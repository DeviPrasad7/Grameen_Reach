import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { AiRequestDto } from './dto/ai-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { GovtPricesService } from '../govt-prices/govt-prices.service';

@ApiTags('AI Gateway')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private govtPricesService: GovtPricesService,
  ) {}

  @Post('listing-generator')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.FARMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Generate product listing from short input (FARMER)' })
  listingGenerator(@Body() dto: AiRequestDto, @CurrentUser() user: any) {
    return this.aiService.run('listing-generator', this.aiService.buildListingPrompt(dto.prompt), user.id);
  }

  @Post('price-coach')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.FARMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Price coaching for farmers (mandi + web-augmented)' })
  async priceCoach(@Body() body: { commodity: string; district: string }, @CurrentUser() user: any) {
    const mandiData = await this.govtPricesService.getPriceSuggestions(body.commodity, body.district);
    const hasMandi = mandiData && (mandiData as any).latestModal != null && Number((mandiData as any).latestModal) > 0;

    // If no mandi data, augment with Tavily web search (no-op if TAVILY_API_KEY not set)
    const webContext = hasMandi
      ? null
      : await this.aiService.callTavily(
          `Current wholesale and retail price of ${body.commodity} per kg in ${body.district}, Andhra Pradesh / Telangana, India 2026`,
        );

    const prompt = this.aiService.buildPriceCoachPrompt(body.commodity, body.district, mandiData, webContext);
    return this.aiService.run('price-coach', prompt, user.id);
  }

  @Post('counter-offer')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.FARMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Counter-offer suggestion for farmer' })
  counterOffer(@Body() body: { bid: any; product: any }, @CurrentUser() user: any) {
    const prompt = this.aiService.buildCounterOfferPrompt(body.bid, body.product);
    return this.aiService.run('counter-offer', prompt, user.id);
  }

  @Post('basket-builder')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Build shopping basket for buyer' })
  basketBuilder(@Body() body: { budget: number; preferences: string; district: string }, @CurrentUser() user: any) {
    const prompt = this.aiService.buildBasketBuilderPrompt(body.budget, body.preferences, body.district);
    return this.aiService.run('basket-builder', prompt, user.id);
  }

  @Post('moderation-helper')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Listing moderation helper (ADMIN)' })
  moderationHelper(@Body() body: { listing: any }, @CurrentUser() user: any) {
    const prompt = this.aiService.buildModerationPrompt(body.listing);
    return this.aiService.run('moderation-helper', prompt, user.id);
  }

  @Get('audit-logs')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin: AI audit logs' })
  auditLogs(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.aiService.getAuditLogs(parseInt(page), parseInt(limit));
  }
}
