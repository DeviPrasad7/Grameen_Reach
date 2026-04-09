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

    // Try multiple model names in order of preference
    const models = [
      'gemini-2.5-flash',
      'gemma-3-1b-it',
    ];

    let lastError: Error | null = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }, { timeout: 20000 });

        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const tokens = res.data?.usageMetadata?.totalTokenCount ?? 0;
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

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama3-8b-8192', messages: [{ role: 'user', content: prompt }], max_tokens: 1024 },
      { headers: { Authorization: `Bearer ${key}` }, timeout: 20000 },
    );
    const text = res.data?.choices?.[0]?.message?.content ?? '';
    const tokens = res.data?.usage?.total_tokens ?? 0;
    return { text, tokens, model: 'llama3-8b-8192' };
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
      this.logger.error(`All AI providers failed: ${errorDetail}`);
      return {
        response: null,
        error: `AI service unavailable. ${errorDetail}`,
        suggestion: 'Check that your GEMINI_API_KEY is valid and the Generative Language API is enabled in Google Cloud Console.',
      };
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
    return `You are an expert agricultural marketplace listing assistant for AP/Telangana, India.
Generate a compelling product listing from this farmer's input: "${input}"
Return ONLY valid JSON (no markdown, no code blocks) with these exact fields:
{"title": "English title", "titleTE": "Telugu title", "description": "English description (2-3 sentences)", "descriptionTE": "Telugu description", "suggestedPrice": 45, "grade": "A", "tags": ["fresh", "organic"]}
Keep descriptions practical and appealing to buyers.`;
  }

  buildPriceCoachPrompt(commodity: string, district: string, mandiData: any) {
    return `You are a price coaching assistant for farmers in AP/Telangana.
Commodity: ${commodity}, District: ${district}
Recent mandi data: ${JSON.stringify(mandiData)}

Provide advice in this format:
**Current Market Trend:** Brief 1-line summary
**Suggested Price Range:** ₹XX - ₹XX per KG
**Best Time to Sell:** When to sell for maximum value
**Tips:**
• Tip 1
• Tip 2
• Tip 3

Keep it concise, practical, and farmer-friendly.`;
  }

  buildCounterOfferPrompt(bid: any, product: any) {
    return `A buyer offered ₹${bid.amount}/${product.unit} for ${product.title} (your asking: ₹${product.fixedPrice ?? product.minBidPrice}).
Message: "${bid.message ?? 'none'}"
Suggest a fair counter-offer with justification. Keep it brief and farmer-friendly. Include the suggested counter amount.`;
  }

  buildBasketBuilderPrompt(budget: number, preferences: string, district: string) {
    return `Build a vegetable/fruit shopping basket for a buyer in ${district}, AP/Telangana.
Budget: ₹${budget}. Preferences: ${preferences}.

Format your response as:
**Your Smart Basket (₹${budget} budget)**

| Item | Qty | Est. Price |
|------|-----|-----------|
| Item1 | X kg | ₹XX |

**Total Estimated Cost:** ₹XXX
**Seasonal Tips:** Brief tips about what's in season
**Money-Saving Tip:** One practical tip

Keep it practical and relevant to ${district} markets.`;
  }

  buildModerationPrompt(listing: any) {
    return `Review this agricultural product listing for appropriateness and accuracy:
Title: ${listing.title}
Description: ${listing.description}
Price: ₹${listing.fixedPrice ?? listing.minBidPrice}
Flag any issues: misleading claims, inappropriate content, pricing anomalies. Return JSON: { approved: boolean, issues: string[], suggestions: string[] }`;
  }

  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.aiRequest.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
      this.prisma.aiRequest.count(),
    ]);
    return { items, total, page, limit };
  }
}
