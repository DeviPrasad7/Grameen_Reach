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
    if (!key) throw new Error('GEMINI_API_KEY not set');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    }, { timeout: 15000 });

    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const tokens = res.data?.usageMetadata?.totalTokenCount ?? 0;
    return { text, tokens, model: 'gemini-1.5-flash' };
  }

  private async callGroq(prompt: string): Promise<{ text: string; tokens: number; model: string }> {
    const key = this.config.get<string>('GROQ_API_KEY');
    if (!key) throw new Error('GROQ_API_KEY not set');

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama3-8b-8192', messages: [{ role: 'user', content: prompt }] },
      { headers: { Authorization: `Bearer ${key}` }, timeout: 15000 },
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
          });
          return { response: cached, cached: true, model: 'cache' };
        }
      } catch {}
    }

    let result: { text: string; tokens: number; model: string } | null = null;
    let error: string | null = null;

    // Try Gemini first, fallback to Groq
    try {
      result = await this.callGemini(prompt);
    } catch (e) {
      try {
        result = await this.callGroq(prompt);
      } catch (e2) {
        error = 'No AI API keys configured or both APIs failed. Set GEMINI_API_KEY or GROQ_API_KEY.';
      }
    }

    if (!result) {
      return { response: null, error };
    }

    const durationMs = Date.now() - start;

    // Cache for 1 hour
    if (this.redis) {
      try { await this.redis.setex(cKey, 3600, result.text); } catch {}
    }

    await this.prisma.aiRequest.create({
      data: { userId, feature, model: result.model, prompt, response: result.text, tokens: result.tokens, cached: false, durationMs },
    });

    return { response: result.text, model: result.model, tokens: result.tokens, durationMs };
  }

  buildListingPrompt(input: string) {
    return `You are an expert agricultural marketplace listing assistant for AP/Telangana, India.
Generate a compelling product listing from this farmer's input: "${input}"
Return JSON with: title (English), titleTE (Telugu), description (English, 2-3 sentences), descriptionTE (Telugu), suggestedPrice (number, INR/KG), grade (A/B/C), tags (array).`;
  }

  buildPriceCoachPrompt(commodity: string, district: string, mandiData: any) {
    return `You are a price coaching assistant for farmers in AP/Telangana.
Commodity: ${commodity}, District: ${district}
Recent mandi data: ${JSON.stringify(mandiData)}
Suggest optimal pricing strategy, best time to sell, and negotiation tips. Keep it concise and practical.`;
  }

  buildCounterOfferPrompt(bid: any, product: any) {
    return `A buyer offered ₹${bid.amount}/${product.unit} for ${product.title} (your asking: ₹${product.fixedPrice ?? product.minBidPrice}).
Message: "${bid.message ?? 'none'}"
Suggest a fair counter-offer with justification. Keep it brief and farmer-friendly.`;
  }

  buildBasketBuilderPrompt(budget: number, preferences: string, district: string) {
    return `Build a vegetable/fruit shopping basket for a buyer in ${district}, AP/Telangana.
Budget: ₹${budget}. Preferences: ${preferences}.
Suggest a practical basket with quantities, estimated prices, and seasonal tips.`;
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
