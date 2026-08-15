import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { SubagentService, Subagent } from './subagent.service';

@Controller('subagents')
export class SubagentController {
  constructor(private readonly subagentService: SubagentService) {}

  @Get()
  async getAll(): Promise<Subagent[]> {
    return this.subagentService.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Subagent | { error: string }> {
    const agent = this.subagentService.getById(id);
    return agent || { error: 'Subagent not found' };
  }

  @Get('role/:role')
  async getByRole(@Param('role') role: string): Promise<Subagent[]> {
    return this.subagentService.getByRole(role);
  }

  @Get('status/online')
  async getOnline(): Promise<Subagent[]> {
    return this.subagentService.getOnline();
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: Subagent['status'] },
  ): Promise<{ success: boolean }> {
    const success = this.subagentService.updateStatus(id, body.status);
    return { success };
  }

  @Post(':id/assign-task')
  async assignTask(
    @Param('id') id: string,
    @Body() body: { task: string },
  ): Promise<{ success: boolean }> {
    const success = this.subagentService.assignTask(id, body.task);
    return { success };
  }

  @Patch(':id/task-progress')
  async updateTaskProgress(
    @Param('id') id: string,
    @Body() body: { progress: number },
  ): Promise<{ success: boolean }> {
    const success = this.subagentService.updateTaskProgress(id, body.progress);
    return { success };
  }

  @Post(':id/complete-task')
  async completeTask(
    @Param('id') id: string,
    @Body() body: { result?: string },
  ): Promise<{ success: boolean }> {
    const success = this.subagentService.completeTask(id, body.result);
    return { success };
  }

  @Get(':id/capabilities')
  async getCapabilities(@Param('id') id: string): Promise<string[]> {
    return this.subagentService.getCapabilities(id);
  }

  @Post('find-best')
  async findBestAgent(
    @Body() body: { capabilities: string[] },
  ): Promise<Subagent | { error: string }> {
    const agent = this.subagentService.findBestAgentForTask(body.capabilities);
    return agent || { error: 'No suitable agent found' };
  }
}