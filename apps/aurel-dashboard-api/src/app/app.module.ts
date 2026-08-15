import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { OrchestrationController } from './orchestration/orchestration.controller';
import { OrchestrationService } from './orchestration/orchestration.service';
import { SubagentController } from './subagents/subagent.controller';
import { SubagentService } from './subagents/subagent.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AppController,
    ChatController,
    OrchestrationController,
    SubagentController,
    TasksController,
  ],
  providers: [
    AppService,
    ChatService,
    OrchestrationService,
    SubagentService,
    TasksService,
  ],
})
export class AppModule {}