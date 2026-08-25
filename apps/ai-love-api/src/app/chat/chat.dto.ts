import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  @IsString()
  role!: 'user' | 'assistant' | 'system';

  @ApiProperty()
  @IsString()
  content!: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  message!: string;

  @ApiProperty({ type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history!: ChatMessageDto[];

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  allowExplicit?: boolean;
}

export class ChatResponseDto {
  @ApiProperty()
  response!: string;
}

export class ChatHistoryDto {
  @ApiProperty({ type: [ChatMessageDto] })
  messages!: ChatMessageDto[];
}

export class SpeakDto {
  @ApiProperty({ description: 'Text to synthesise with the companion voice' })
  @IsString()
  text!: string;
}