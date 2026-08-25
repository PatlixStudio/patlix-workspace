import { Controller, Post, Get, Delete, Body, Param, HttpCode, HttpStatus, Req, Header, NotFoundException, BadGatewayException, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ChatService } from './chat.service';
import { SendMessageDto, ChatResponseDto, ChatHistoryDto, SpeakDto } from './chat.dto';

interface AuthenticatedRequest extends Request {
  user?: { sub: string };
  headers: Request['headers'] & { 'x-user-id'?: string };
}

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  private resolveAuth(req: AuthenticatedRequest): { userId: string; isSubscribed: boolean } {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const user = this.authService.validateToken(token);
      if (user) return { userId: user.id, isSubscribed: user.isSubscribed };
    }
    if (req.user?.sub) {
      const user = this.authService.getUser(req.user.sub);
      if (user) return { userId: user.id, isSubscribed: user.isSubscribed };
    }
    const headerId = req.headers['x-user-id'];
    if (typeof headerId === 'string' && headerId) {
      const user = this.authService.getUser(headerId);
      if (user) return { userId: user.id, isSubscribed: user.isSubscribed };
      return { userId: headerId, isSubscribed: false };
    }
    return { userId: 'default', isSubscribed: false };
  }

  private getUserId(req: AuthenticatedRequest): string {
    return this.resolveAuth(req).userId;
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
    const { userId, isSubscribed } = this.resolveAuth(req);
    const response = await this.chatService.sendMessage({
      companionId,
      userMessage: dto.message,
      history: dto.history,
      userId,
      isSubscribed,
      allowExplicit: dto.allowExplicit ?? false,
    });
    return { response };
  }

  @Post(':companionId/speak')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'audio/mpeg')
  @ApiOperation({ summary: 'Synthesise speech in the companion\'s unique voice' })
  @ApiParam({ name: 'companionId', description: 'Companion ID' })
  @ApiResponse({ status: 200, description: 'audio/mpeg stream' })
  async speak(
    @Param('companionId') companionId: string,
    @Body() dto: SpeakDto,
  ): Promise<StreamableFile> {
    try {
      return new StreamableFile(await this.chatService.speak(companionId, dto.text));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('not found')) throw new NotFoundException(message);
      throw new BadGatewayException(message);
    }
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