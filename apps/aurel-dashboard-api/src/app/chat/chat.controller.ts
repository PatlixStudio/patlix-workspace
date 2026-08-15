import { Body, Controller, Post } from '@nestjs/common';
import { ChatRequest, ChatResponse, ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  send(@Body() request: ChatRequest): ChatResponse {
    return this.chatService.respond(request);
  }
}