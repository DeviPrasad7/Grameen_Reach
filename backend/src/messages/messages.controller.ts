import { Body, Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles(Role.BUYER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Send a customer message to a farmer' })
  sendMessage(@Body() dto: SendMessageDto, @CurrentUser() user: any) {
    return this.messagesService.sendMessage(user.id, dto);
  }

  @Get('sent')
  @Roles(Role.BUYER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List messages sent by the current buyer' })
  sentMessages(@CurrentUser() user: any) {
    return this.messagesService.getSentMessages(user.id);
  }

  @Get('inbox')
  @Roles(Role.FARMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'List inbox messages for the current farmer' })
  inbox(@CurrentUser() user: any) {
    return this.messagesService.getInbox(user.id);
  }

  @Patch(':id/read')
  @Roles(Role.FARMER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Mark a customer message as read' })
  read(@Param('id') id: string, @CurrentUser() user: any) {
    return this.messagesService.markRead(id, user.id);
  }
}