import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BidsService } from './bids.service';
import { CreateBidDto } from './dto/create-bid.dto';
import { RespondBidDto } from './dto/respond-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Bids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bids')
export class BidsController {
  constructor(private bidsService: BidsService) {}

  @Post()
  @Roles(Role.BUYER, Role.FARMER)
  @ApiOperation({ summary: 'Place a bid on a product' })
  create(@CurrentUser() user: any, @Body() dto: CreateBidDto) {
    return this.bidsService.createBid(user.id, dto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all bids for a product' })
  getByProduct(@Param('productId') productId: string) {
    return this.bidsService.getBidsByProduct(productId);
  }

  @Get('my')
  @Roles(Role.BUYER, Role.FARMER)
  @ApiOperation({ summary: 'Get my placed bids' })
  getMyBids(@CurrentUser() user: any) {
    return this.bidsService.getMyBids(user.id);
  }

  @Get('farmer')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Farmer: get bids on my products' })
  getFarmerBids(@CurrentUser() user: any) {
    return this.bidsService.getFarmerBids(user.id);
  }

  @Patch(':id/respond')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Farmer: accept/reject/counter a bid' })
  respond(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RespondBidDto,
  ) {
    return this.bidsService.respondToBid(id, user.id, dto);
  }
}
