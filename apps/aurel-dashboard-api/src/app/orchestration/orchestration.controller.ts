import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OrchestrationService, OrchestrationRequest, OrchestrationResponse, Plan } from './orchestration.service';

@Controller('orchestration')
export class OrchestrationController {
  constructor(private readonly orchestrationService: OrchestrationService) {}

  @Post('chat')
  async chat(@Body() request: OrchestrationRequest): Promise<OrchestrationResponse> {
    return this.orchestrationService.orchestrate(request);
  }

  @Get('plans')
  async getAllPlans(): Promise<Plan[]> {
    return this.orchestrationService.getAllPlans();
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string): Promise<Plan | { error: string }> {
    const plan = this.orchestrationService.getPlan(id);
    return plan || { error: 'Plan not found' };
  }
}