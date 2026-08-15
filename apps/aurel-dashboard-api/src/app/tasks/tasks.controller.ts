import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { TasksService, Task, TaskExecutionResult } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(@Body() body: Partial<Task> & { title: string; description: string; type: Task['type'] }): Promise<Task> {
    return this.tasksService.createTask(body);
  }

  @Post(':id/execute')
  async executeTask(@Param('id') id: string): Promise<TaskExecutionResult> {
    return this.tasksService.executeTask(id);
  }

  @Get()
  async getAllTasks(): Promise<Task[]> {
    return this.tasksService.getAllTasks();
  }

  @Get('status/:status')
  async getTasksByStatus(@Param('status') status: Task['status']): Promise<Task[]> {
    return this.tasksService.getTasksByStatus(status);
  }

  @Get('agent/:agentId')
  async getTasksByAgent(@Param('agentId') agentId: string): Promise<Task[]> {
    return this.tasksService.getTasksByAgent(agentId);
  }

  @Get('plan/:planId')
  async getTasksByPlan(@Param('planId') planId: string): Promise<Task[]> {
    return this.tasksService.getTasksByPlan(planId);
  }

  @Get(':id')
  async getTask(@Param('id') id: string): Promise<Task | { error: string }> {
    const task = this.tasksService.getTask(id);
    return task || { error: 'Task not found' };
  }

  @Patch(':id')
  async updateTask(@Param('id') id: string, @Body() body: Partial<Task>): Promise<{ success: boolean }> {
    const success = this.tasksService.updateTask(id, body);
    return { success };
  }

  @Post(':id/cancel')
  async cancelTask(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = this.tasksService.cancelTask(id);
    return { success };
  }

  @Delete(':id')
  async deleteTask(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = this.tasksService.deleteTask(id);
    return { success };
  }

  // Convenience endpoints for common task types
  @Post('shell')
  async createShellTask(@Body() body: { title: string; command: string; workingDirectory?: string }): Promise<Task> {
    return this.tasksService.createShellTask(body.title, body.command, body.workingDirectory);
  }

  @Post('opencode')
  async createOpencodeTask(@Body() body: { title: string; prompt: string; workingDirectory?: string }): Promise<Task> {
    return this.tasksService.createOpencodeTask(body.title, body.prompt, body.workingDirectory);
  }

  @Post('npm')
  async createNpmTask(@Body() body: { title: string; command: string; args: string[]; workingDirectory?: string }): Promise<Task> {
    return this.tasksService.createNpmTask(body.title, body.command, body.args, body.workingDirectory);
  }

  @Post('git')
  async createGitTask(@Body() body: { title: string; args: string[]; workingDirectory?: string }): Promise<Task> {
    return this.tasksService.createGitTask(body.title, body.args, body.workingDirectory);
  }
}