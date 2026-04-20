import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private redis: Redis | null = null;
  private readonly modelCatalog = [
    { name: 'Gemini 2.5 Flash', apiModel: 'gemini-2.5-flash', kind: 'text' },
    { name: 'Gemini 2.5 Flash Lite', apiModel: 'gemini-2.5-flash-lite', kind: 'text' },
    { name: 'Gemini 2.0 Flash', apiModel: 'gemini-2.0-flash', kind: 'text' },
    { name: 'Gemini 2.0 Flash Lite', apiModel: 'gemini-2.0-flash-lite', kind: 'text' },
    { name: 'Gemini 2.5 Pro', apiModel: 'gemini-2.5-pro', kind: 'text' },
    { name: 'Gemma 3 27B', apiModel: 'gemma-3-27b-it', kind: 'text' },
    { name: 'Gemma 3 12B', apiModel: 'gemma-3-12b-it', kind: 'text' },
    { name: 'Gemma 3 4B', apiModel: 'gemma-3-4b-it', kind: 'text' },
    { name: 'Gemma 3 1B', apiModel: 'gemma-3-1b-it', kind: 'text' },
  ];
  private readonly groqModels = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
  ];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const redisUrl = config.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, { lazyConnect: true, enableOfflineQueue: false });
        this.redis.connect().catch(() => { this.redis = null; });
      } catch {
        this.redis = null;
      }
    }
  }

  private cacheKey(feature: string, prompt: string) {
    return `ai:${feature}:${crypto.createHash('md5').update(prompt).digest('hex')}`;
  }

  private async callGemini(prompt: string): Promise<{ text: string; tokens: number; model: string }> {
    const key = this.config.get<string>('GEMINI_API_KEY');
    if (!key || key.trim() === '') {
      throw new Error('GEMINI_API_KEY is not configured. Add it to your .env file.');
    }

    // Try at most 3 Gemini models before falling through to Groq
    const models = this.modelCatalog
      .filter((model) => model.kind === 'text')
      .slice(0, 3)
      .map((model) => model.apiModel);

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }, { timeout: 15000 });

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const tokens = res.data?.usageMetadata?.totalTokenCount ?? 0;
        if (!text) {
          lastError = new Error(`Gemini model ${model} returned empty text`);
          continue;
        }
        return { text, tokens, model };
      } catch (e: any) {
        const status = e.response?.status;
        const errMsg = e.response?.data?.error?.message || e.message;
        this.logger.warn(`Gemini model ${model} failed (${status}): ${errMsg}`);

        // 429 = quota exceeded - clear message and stop trying
        if (status === 429) {
          throw new Error('Gemini free tier quota exceeded. Wait for quota reset (usually resets daily) or upgrade your plan at https://ai.google.dev/pricing');
        }
        // 400/403 = auth/key error - stop trying
        if (status === 400 || status === 403) {
          throw new Error(`Gemini API key error (${status}): ${errMsg}`);
        }

        lastError = new Error(`Gemini API error (${status || 'network'}): ${errMsg}`);
        continue;
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }

  private async callGroq(prompt: string): Promise<{ text: string; tokens: number; model: string }> {
    const key = this.config.get<string>('GROQ_API_KEY');
    if (!key || key.trim() === '') {
      throw new Error('GROQ_API_KEY is not configured');
    }

    let lastError: Error | null = null;
    for (const model of this.groqModels) {
      try {
        const res = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          { model, messages: [{ role: 'user', content: prompt }], max_tokens: 1024, temperature: 0.2 },
          { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 },
        );
        const text = res.data?.choices?.[0]?.message?.content ?? '';
        const tokens = res.data?.usage?.total_tokens ?? 0;
        return { text, tokens, model };
      } catch (e: any) {
        const status = e.response?.status;
        const errMsg = e.response?.data?.error?.message || e.message;
        this.logger.warn(`Groq model ${model} failed (${status}): ${errMsg}`);
        if (status === 401 || status === 403) {
          throw new Error(`Groq API key error (${status}): ${errMsg}`);
        }
        lastError = new Error(`Groq error (${status || 'network'}): ${errMsg}`);
      }
    }
    throw lastError || new Error('All Groq models failed');
  }

  private extractQuotedInput(prompt: string) {
    const quoted = prompt.match(/"([^"]+)"/);
    return quoted?.[1]?.trim() || prompt.trim();
  }

  private extractPromptJson(prompt: string, marker: string) {
    const start = prompt.indexOf(marker);
    if (start === -1) return null;

    const jsonStart = start + marker.length;
    const jsonEnd = prompt.indexOf('\n\nRules:', jsonStart);
    const rawJson = prompt.slice(jsonStart, jsonEnd === -1 ? undefined : jsonEnd).trim();

    try {
      return JSON.parse(rawJson);
    } catch {
      return null;
    }
  }

  private buildGroundedPriceAdvice(mandiData: any) {
    const commodity = mandiData?.commodity || 'the crop';
    const district = mandiData?.district || 'your district';
    const latestModal = Number(mandiData?.latestModal ?? mandiData?.modalPrice ?? 0);
    const avgModal = Number(mandiData?.avgModal7Days ?? mandiData?.avgModal ?? latestModal);

    if (!latestModal) {
      // No mandi data — give a general, honest response rather than "no data"
      return [
        `**Current Market Trend:** No local mandi data for ${commodity} in ${district}. Check a nearby APMC or wholesale buyer for the current rate.`,
        `**Suggested Price Range:** Estimate from the buyer's expected quality and your cost per kg (aim for 20-35% above cost). AI pricing is unavailable right now.`,
        `**Best Time to Sell:** Move stock within 3-5 days of harvest to protect freshness and margin.`,
        '**Tips:**',
        `• Call two local aggregators for a quick verbal quote on ${commodity}.`,
        '• Photograph produce in daylight for a better buyer response.',
        '• Re-check the district spelling if the data looks missing.',
      ].join('\n');
    }

    // Mandi data exists — convert to per-kg (1 quintal = 100 kg)
    const perKg = latestModal / 100;
    const minKg = Math.round(perKg * 0.9);
    const maxKg = Math.round(perKg * 1.1);
    const currentTrend = avgModal > latestModal * 1.02
      ? 'Prices are easing slightly versus the 7-day mandi average, so avoid underpricing.'
      : avgModal < latestModal * 0.98
        ? 'Prices are firming up versus the 7-day mandi average, so hold for a better quote if stock allows.'
        : 'Prices are steady around the recent mandi modal.';

    return [
      `**Current Market Trend:** ${currentTrend} (mandi modal ₹${Math.round(latestModal)}/quintal)`,
      `**Suggested Price Range:** ₹${minKg} - ₹${maxKg} per kg (${commodity} in ${district})`,
      `**Best Time to Sell:** Sell when nearby buyers are matching the mandi modal; mornings within the APMC window usually get the best rate.`,
      '**Tips:**',
      '• Base your ask on the latest mandi modal, not on guessed internet prices.',
      '• If quality is high, stay near the top of the suggested range.',
      '• If stock is urgent, keep the price close to the latest modal and move quickly.',
    ].join('\n');
  }

  private buildLocalFallback(feature: string, prompt: string) {
    const input = this.extractQuotedInput(prompt);

    if (feature === 'listing-generator') {
      const baseTitle = input.replace(/^describe\s+your\s+/i, '').trim() || 'Fresh Produce';
      return JSON.stringify({
        title: baseTitle,
        titleTE: baseTitle,
        description: `Fresh ${baseTitle.toLowerCase()} sourced directly from verified farmers.`,
        descriptionTE: `${baseTitle} నేరుగా ధృవీకరించిన రైతుల నుండి.`,
        suggestedPrice: 50,
        grade: 'A',
        tags: ['fresh', 'farm-direct', 'verified'],
      });
    }

    if (feature === 'price-coach') {
      const parsed = this.extractPromptJson(prompt, 'Live mandi data: ');
      return this.buildGroundedPriceAdvice(parsed);
    }

    if (feature === 'counter-offer') {
      return [
        '**Suggested Counter Offer:** Ask for 8-15% above the buyer bid when your stock is fresh and limited.',
        '**Reasoning:** The buyer showed interest, so a small counter keeps the deal alive while protecting margin.',
      ].join('\n');
    }

    if (feature === 'basket-builder') {
      return [
        '**Your Smart Basket**',
        '| Item | Qty | Est. Price |',
        '|------|-----|-----------|',
        '| Seasonal vegetables | 2 kg | ₹120 |',
        '| Fresh fruit | 1 kg | ₹80 |',
        '| Pulses | 1 kg | ₹110 |',
        '',
        '**Total Estimated Cost:** ₹310',
        '**Seasonal Tips:** Mix staples with one seasonal crop for better value.',
        '**Money-Saving Tip:** Buy directly from one district to reduce delivery cost.',
      ].join('\n');
    }

    if (feature === 'moderation-helper') {
      return JSON.stringify({
        approved: true,
        issues: [],
        suggestions: ['Listing looks reasonable.', 'Double-check spelling and quantity before publishing.'],
      });
    }

    return 'AI service is unavailable right now, so a local fallback response was used.';
  }

  getModelCatalog() {
    return this.modelCatalog;
  }

  async callTavily(query: string): Promise<{ answer: string; snippets: string[] } | null> {
    const key = this.config.get<string>('TAVILY_API_KEY');
    if (!key || key.trim() === '') return null;

    try {
      const res = await axios.post(
        'https://api.tavily.com/search',
        {
          api_key: key,
          query,
          search_depth: 'basic',
          include_answer: true,
          max_results: 5,
        },
        { timeout: 10000 },
      );
      const answer: string = res.data?.answer || '';
      const results: Array<{ title?: string; content?: string }> = res.data?.results || [];
      const snippets = results
        .map((r) => `${r.title ? r.title + ': ' : ''}${(r.content || '').slice(0, 300)}`)
        .filter((s) => s.trim().length > 0);
      return { answer, snippets };
    } catch (e: any) {
      this.logger.warn(`Tavily search failed: ${e.response?.data?.error || e.message}`);
      return null;
    }
  }

  buildPriceCoachPrompt(
    commodity: string,
    district: string,
    mandiData: any,
    webContext?: { answer: string; snippets: string[] } | null,
  ) {
    const hasMandi = mandiData && mandiData.latestModal != null && Number(mandiData.latestModal) > 0;
    const mandiBlock = hasMandi
      ? `Live mandi data (AP/Telangana APMC, authoritative — prefer this over web data):\n${JSON.stringify(mandiData)}`
      : `Live mandi data: none available for ${commodity} in ${district}.`;

    const webBlock = webContext && (webContext.answer || webContext.snippets.length > 0)
      ? `\n\nRecent web context (use only to estimate retail/wholesale prices; treat numbers as approximate):\n${webContext.answer ? '- Summary: ' + webContext.answer + '\n' : ''}${webContext.snippets.slice(0, 4).map((s) => '- ' + s).join('\n')}`
      : '';

    return `You are a price coaching assistant for a farmer in ${district}, Andhra Pradesh / Telangana, India.
Commodity: ${commodity}

${mandiBlock}${webBlock}

Rules:
- If mandi data exists, base your range on the mandi modal (±10%). State the mandi rate explicitly.
- If mandi data is absent, rely on the web context and typical Indian retail/wholesale prices for this commodity. Clearly note that the estimate is based on general market knowledge, not local mandi data.
- Give prices per KG (convert from quintal if needed: 1 quintal = 100 kg).
- Never refuse to answer — always give a best-effort range.
- No markdown code fences, no greetings, no sign-offs.

Respond in exactly this format:
**Current Market Trend:** <one-line summary: stable / rising / falling, and which data source you used>
**Suggested Price Range:** ₹<min> - ₹<max> per kg
**Best Time to Sell:** <one line>
**Tips:**
• <tip 1>
• <tip 2>
• <tip 3>`;
  }

  async run(feature: string, prompt: string, userId?: string): Promise<any> {
    const cKey = this.cacheKey(feature, prompt);
    const start = Date.now();

    // Check cache
    if (this.redis) {
      try {
        const cached = await this.redis.get(cKey);
        if (cached) {
          await this.prisma.aiRequest.create({
            data: { userId, feature, model: 'cache', prompt, response: cached, cached: true, durationMs: 0 },
          }).catch(() => {});
          return { response: cached, cached: true, model: 'cache' };
        }
      } catch {}
    }

    let result: { text: string; tokens: number; model: string } | null = null;
    const errors: string[] = [];

    // Try Gemini first
    try {
      result = await this.callGemini(prompt);
    } catch (e: any) {
      errors.push(`Gemini: ${e.message}`);
      this.logger.warn(`Gemini failed: ${e.message}`);
    }

    // Fallback to Groq
    if (!result) {
      try {
        result = await this.callGroq(prompt);
      } catch (e: any) {
        errors.push(`Groq: ${e.message}`);
        this.logger.warn(`Groq failed: ${e.message}`);
      }
    }

    if (!result) {
      const errorDetail = errors.join(' | ');
      this.logger.warn(`All AI providers failed, using local fallback: ${errorDetail}`);
      const fallback = this.buildLocalFallback(feature, prompt);

      await this.prisma.aiRequest.create({
        data: { userId, feature, model: 'local-fallback', prompt, response: fallback, cached: false, durationMs: Date.now() - start },
      }).catch(() => {});

      return { response: fallback, model: 'local-fallback', tokens: 0, durationMs: Date.now() - start, fallback: true };
    }

    const durationMs = Date.now() - start;

    // Cache for 1 hour
    if (this.redis) {
      try { await this.redis.setex(cKey, 3600, result.text); } catch {}
    }

    await this.prisma.aiRequest.create({
      data: { userId, feature, model: result.model, prompt, response: result.text, tokens: result.tokens, cached: false, durationMs },
    }).catch(() => {});

    return { response: result.text, model: result.model, tokens: result.tokens, durationMs };
  }

  buildListingPrompt(input: string) {
    return `You are a marketplace listing writer for farmers in Andhra Pradesh / Telangana, India.
Input from the farmer: "${input}"

Return ONLY a valid compact JSON object. No markdown, no code fences, no commentary before or after.
Schema:
{"title":"<English title, max 8 words>","titleTE":"<same meaning in Telugu>","description":"<2 sentences, plain facts>","descriptionTE":"<same in Telugu>","suggestedPrice":<number, INR per kg or per unit>,"unit":"kg","grade":"A","tags":["fresh","farm-direct"]}

Rules:
- Infer a realistic Indian retail price (not mandi wholesale). Never return 0.
- Keep description factual: crop, grade, origin, harvest freshness. No hype words like "premium" or "world-class".
- Telugu fields must be in Telugu script, not transliteration.`;
  }

  buildCounterOfferPrompt(bid: any, product: any) {
    return `You are a pricing assistant for an Indian farmer.
Product: ${product.title}, asking price: ₹${product.fixedPrice ?? product.minBidPrice}/${product.unit}.
Buyer's offer: ₹${bid.amount}/${product.unit}. Buyer's message: "${bid.message ?? 'none'}".

Respond in this exact format, nothing else:
**Suggested Counter:** ₹<amount>/<unit>
**Reasoning:** <one sentence, under 25 words>

Rules:
- The counter must sit between the buyer's offer and the asking price.
- Do NOT add greetings, offers to refine, or extra prose.`;
  }

  buildBasketBuilderPrompt(budget: number, preferences: string, district: string) {
    return `You are planning a fresh-produce basket for a home buyer in ${district}, Andhra Pradesh / Telangana.
Budget: ₹${budget}. Preferences: ${preferences || 'none'}.

Respond in exactly this Markdown format. No other text before or after:

**Your Smart Basket (₹${budget} budget)**

| Item | Qty | Est. Price |
|------|-----|-----------|
| <item 1> | <qty> | ₹<price> |
| <item 2> | <qty> | ₹<price> |
| <item 3> | <qty> | ₹<price> |
| <item 4> | <qty> | ₹<price> |

**Total Estimated Cost:** ₹<sum>
**Seasonal Tips:** <one short line about what's in season in ${district} this month>
**Money-Saving Tip:** <one practical tip>

Rules:
- Total must be ≤ budget.
- Use real Indian produce (tomato, onion, brinjal, mango, banana, dal, rice, etc.).
- Respect preferences strictly (vegetarian, organic, diabetic, etc.).`;
  }

  buildModerationPrompt(listing: any) {
    return `Review this agricultural marketplace listing and return ONLY valid JSON (no markdown):
{"approved": true|false, "issues": ["..."], "suggestions": ["..."]}

Listing:
Title: ${listing.title}
Description: ${listing.description}
Price: ₹${listing.fixedPrice ?? listing.minBidPrice}

Flag misleading claims, inappropriate content, or pricing that is clearly off (e.g. 10x mandi rate). Keep issues and suggestions short.`;
  }

  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.aiRequest.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, userId: true, feature: true, model: true,
          tokens: true, cached: true, durationMs: true, createdAt: true,
          // omit prompt/response from list to keep payload small
        },
      }),
      this.prisma.aiRequest.count(),
    ]);

    const userIds = [...new Set(items.map((i) => i.userId).filter((id): id is string => !!id))];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      items: items.map((i) => ({ ...i, user: i.userId ? userMap.get(i.userId) ?? null : null })),
      total,
      page,
      limit,
    };
  }
}
