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
import { FarmerService } from './farmer.service';
import { CreateFarmerProfileDto } from './dto/create-farmer-profile.dto';
import { UpdateFarmerProfileDto } from './dto/update-farmer-profile.dto';
import { UploadDocDto } from './dto/upload-doc.dto';
import { VerifyFarmerDto } from './dto/verify-farmer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('Farmer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class FarmerController {
  constructor(private farmerService: FarmerService) {}

  @Post('farmer/profile')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Create farmer profile (FARMER role)' })
  createProfile(@CurrentUser() user: any, @Body() dto: CreateFarmerProfileDto) {
    return this.farmerService.createProfile(user.id, dto);
  }

  @Get('farmer/profile')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Get own farmer profile' })
  getProfile(@CurrentUser() user: any) {
    return this.farmerService.getProfile(user.id);
  }

  @Patch('farmer/profile')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Update farmer profile' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateFarmerProfileDto) {
    return this.farmerService.updateProfile(user.id, dto);
  }

  @Post('farmer/docs')
  @Roles(Role.FARMER)
  @ApiOperation({ summary: 'Add verification document' })
  addDoc(@CurrentUser() user: any, @Body() dto: UploadDocDto) {
    return this.farmerService.addDoc(user.id, dto);
  }

  @Get('admin/farmers/pending')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: get farmers pending verification' })
  getPending() {
    return this.farmerService.getPendingVerifications();
  }

  @Patch('admin/farmers/:id/verify')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: approve or reject a farmer' })
  verify(
    @Param('id') id: string,
    @Body() dto: VerifyFarmerDto,
    @CurrentUser() admin: any,
  ) {
    return this.farmerService.verifyFarmer(id, dto, admin.id);
  }
}
