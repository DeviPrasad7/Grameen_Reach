import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmerProfileDto } from './dto/create-farmer-profile.dto';
import { UpdateFarmerProfileDto } from './dto/update-farmer-profile.dto';
import { UploadDocDto } from './dto/upload-doc.dto';
import { VerifyFarmerDto, VerifyAction } from './dto/verify-farmer.dto';

@Injectable()
export class FarmerService {
  constructor(private prisma: PrismaService) {}

  async createProfile(userId: string, dto: CreateFarmerProfileDto) {
    const existing = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Farmer profile already exists');

    return this.prisma.farmerProfile.create({
      data: { userId, ...dto },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { userId },
      include: { docs: true, user: { select: { name: true, email: true } } },
    });
    if (!profile) throw new NotFoundException('Farmer profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateFarmerProfileDto) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Farmer profile not found');
    return this.prisma.farmerProfile.update({ where: { userId }, data: dto });
  }

  async addDoc(userId: string, dto: UploadDocDto) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Farmer profile not found');

    return this.prisma.farmerDoc.create({
      data: {
        farmerProfileId: profile.id,
        docType: dto.docType as any,
        fileUrl: dto.fileUrl,
        docNumber: dto.docNumber,
        notes: dto.notes,
      },
    });
  }

  async getMyDocs(userId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Farmer profile not found');
    return this.prisma.farmerDoc.findMany({
      where: { farmerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllFarmers() {
    return this.prisma.farmerProfile.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        docs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingVerifications() {
    return this.prisma.farmerProfile.findMany({
      where: { verificationLevel: 'LEVEL_0' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        docs: true,
      },
    });
  }

  async verifyFarmer(profileId: string, dto: VerifyFarmerDto, adminId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Farmer profile not found');

    const newLevel = dto.action === VerifyAction.APPROVE ? 'LEVEL_1' : 'LEVEL_0';

    return this.prisma.farmerProfile.update({
      where: { id: profileId },
      data: { verificationLevel: newLevel as any },
    });
  }

  async getProfileById(profileId: string) {
    const profile = await this.prisma.farmerProfile.findUnique({
      where: { id: profileId },
      include: { docs: true, user: { select: { name: true, email: true } } },
    });
    if (!profile) throw new NotFoundException('Farmer profile not found');
    return profile;
  }
}
