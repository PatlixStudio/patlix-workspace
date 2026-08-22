import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto, ChatResponseDto, ChatHistoryDto } from './chat.dto';

interface AuthenticatedRequest extends Request {
  user?: { sub: string };
  headers: Request['headers'] & { 'x-user-id'?: string };
}

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private getUserId(req: AuthenticatedRequest): string {
    return req.user?.sub || req.headers['x-user-id'] || 'default';
  }

  @Post(':companionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to a companion and get AI response' })
  @ApiParam({ name: 'companionId', description: 'Companion ID (e.g., ava, leo)' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Companion not found' })
  async sendMessage(
    @Param('companionId') companionId: string,
    @Body() dto: SendMessageDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChatResponseDto> {
    const userId = this.getUserId(req);
    const response = await this.chatService.sendMessage({
      companionId,
      userMessage: dto.message,
      history: dto.history,
      userId,
      allowExplicit: dto.allowExplicit ?? false,
    });
    return { response };
  }

  @Get(':companionId/history')
  @ApiOperation({ summary: 'Get chat history for a companion' })
  @ApiParam({ name: 'companionId', description: 'Companion ID' })
  @ApiResponse({ status: 200, type: ChatHistoryDto })
  getHistory(@Param('companionId') companionId: string, @Req() req: AuthenticatedRequest): ChatHistoryDto {
    const userId = this.getUserId(req);
    const messages = this.chatService.getHistory(companionId, userId);
    return { messages };
  }

  @Delete(':companionId/history')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear chat history for a companion' })
  @ApiParam({ name: 'companionId', description: 'Companion ID' })
  @ApiResponse({ status: 204, description: 'History cleared' })
  clearHistory(@Param('companionId') companionId: string, @Req() req: AuthenticatedRequest): void {
    const userId = this.getUserId(req);
    this.chatService.clearHistory(companionId, userId);
  }
}