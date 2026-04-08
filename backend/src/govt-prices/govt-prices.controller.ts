import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { GovtPricesService } from './govt-prices.service';
import { CreatePriceDto } from './dto/create-price.dto';
import { QueryPriceDto } from './dto/query-price.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Govt Prices')
@Controller('govt-prices')
export class GovtPricesController {
  constructor(private govtPricesService: GovtPricesService) {}

  @Get()
  @ApiOperation({ summary: 'Query mandi/govt prices' })
  findAll(@Query() query: QueryPriceDto) {
    return this.govtPricesService.findAll(query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Price suggestions for farmers' })
  getSuggestions(
    @Query('commodity') commodity: string,
    @Query('district') district: string,
  ) {
    return this.govtPricesService.getPriceSuggestions(commodity, district);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Mandi vs market price comparison for buyers' })
  getComparison(
    @Query('commodity') commodity: string,
    @Query('district') district: string,
  ) {
    return this.govtPricesService.getPriceComparison(commodity, district);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: manual price entry' })
  create(@Body() dto: CreatePriceDto, @CurrentUser() user: any) {
    return this.govtPricesService.create(dto, user.id);
  }

  @Post('upload-csv')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Admin: upload CSV of mandi prices' })
  uploadCsv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.govtPricesService.uploadCsv(file.buffer, user.id);
  }
}
