import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'shell' | 'opencode' | 'npm' | 'git' | 'custom';
  command?: string;
  args?: string[];
  workingDirectory?: string;
  environment?: Record<string, string>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  assignedAgentId?: string;
  planId?: string;
  stepId?: string;
  output?: string;
  error?: string;
  exitCode?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface TaskExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private tasks = new Map<string, Task>();
  private taskCounter = 0;
  private readonly workspaceRoot: string;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.workspaceRoot = process.env.AUREL_WORKSPACE_ROOT || process.cwd();
  }

  createTask(taskData: Partial<Task> & { title: string; description: string; type: Task['type'] }): Task {
    const taskId = `task_${++this.taskCounter}_${Date.now()}`;
    const task: Task = {
      id: taskId,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      command: taskData.command,
      args: taskData.args,
      workingDirectory: taskData.workingDirectory || this.workspaceRoot,
      environment: taskData.environment,
      status: 'pending',
      assignedAgentId: taskData.assignedAgentId,
      planId: taskData.planId,
      stepId: taskData.stepId,
      metadata: taskData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(taskId, task);
    this.eventEmitter.emit('task.created', task);
    return task;
  }

  async executeTask(taskId: string): Promise<TaskExecutionResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'running';
    task.startedAt = new Date();
    task.updatedAt = new Date();
    this.eventEmitter.emit('task.started', task);

    try {
      let result: TaskExecutionResult;

      switch (task.type) {
        case 'shell':
          result = await this.executeShellCommand(task);
          break;
        case 'opencode':
          result = await this.executeOpencode(task);
          break;
        case 'npm':
          result = await this.executeNpmCommand(task);
          break;
        case 'git':
          result = await this.executeGitCommand(task);
          break;
        case 'custom':
          result = await this.executeCustomCommand(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = result.success ? 'completed' : 'failed';
      task.output = result.output;
      task.error = result.error;
      task.exitCode = result.exitCode;
      task.completedAt = new Date();
      task.updatedAt = new Date();

      this.eventEmitter.emit('task.completed', { task, result });
      return result;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date();
      task.updatedAt = new Date();
      this.eventEmitter.emit('task.failed', { task, error });
      return {
        success: false,
        output: '',
        error: task.error,
        exitCode: -1,
      };
    }
  }

  private async executeShellCommand(task: Task): Promise<TaskExecutionResult> {
    const command = task.command || 'echo "No command specified"';
    const cwd = this.resolveWorkingDirectory(task.workingDirectory);
    
    this.logger.log(`Executing shell command: ${command} in ${cwd}`);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, ...task.environment },
      timeout: 300000, // 5 minutes
    });

    return {
      success: true,
      output: stdout || stderr,
      exitCode: 0,
    };
  }

  private async executeOpencode(task: Task): Promise<TaskExecutionResult> {
    const opencodeBin = process.env.OPENCODE_BIN || 'opencode';
    const autoMode = process.env.OPENCODE_AUTO === 'true' ? '--auto' : '';
    const prompt = task.command || task.description;
    
    if (!prompt) {
      return { success: false, output: '', error: 'No prompt provided for opencode', exitCode: -1 };
    }

    const cwd = this.resolveWorkingDirectory(task.workingDirectory);
    const command = `${opencodeBin} run ${autoMode} --format json "${prompt.replace(/"/g, '\\"')}"`;
    
    this.logger.log(`Executing opencode: ${command} in ${cwd}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        env: { ...process.env, ...task.environment },
        timeout: 600000, // 10 minutes
      });

      return {
        success: true,
        output: stdout || stderr,
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout || '',
        error: error.stderr || error.message,
        exitCode: error.code || -1,
      };
    }
  }

  private async executeNpmCommand(task: Task): Promise<TaskExecutionResult> {
    const command = task.command || 'npm';
    const args = task.args || [];
    const cwd = this.resolveWorkingDirectory(task.workingDirectory);
    const fullCommand = `${command} ${args.join(' ')}`;
    
    this.logger.log(`Executing npm: ${fullCommand} in ${cwd}`);

    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd,
      env: { ...process.env, ...task.environment },
      timeout: 300000,
    });

    return {
      success: true,
      output: stdout || stderr,
      exitCode: 0,
    };
  }

  private async executeGitCommand(task: Task): Promise<TaskExecutionResult> {
    const args = task.args || [];
    const cwd = this.resolveWorkingDirectory(task.workingDirectory);
    const command = `git ${args.join(' ')}`;
    
    this.logger.log(`Executing git: ${command} in ${cwd}`);

    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, ...task.environment },
      timeout: 120000,
    });

    return {
      success: true,
      output: stdout || stderr,
      exitCode: 0,
    };
  }

  private async executeCustomCommand(task: Task): Promise<TaskExecutionResult> {
    // For custom commands, execute directly
    const command = task.command || '';
    const cwd = this.resolveWorkingDirectory(task.workingDirectory);
    
    if (!command) {
      return { success: false, output: '', error: 'No command specified', exitCode: -1 };
    }

    this.logger.log(`Executing custom: ${command} in ${cwd}`);

    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, ...task.environment },
      timeout: 300000,
    });

    return {
      success: true,
      output: stdout || stderr,
      exitCode: 0,
    };
  }

  private resolveWorkingDirectory(workingDir?: string): string {
    if (!workingDir) return this.workspaceRoot;
    if (path.isAbsolute(workingDir)) return workingDir;
    return path.join(this.workspaceRoot, workingDir);
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getTasksByStatus(status: Task['status']): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === status);
  }

  getTasksByAgent(agentId: string): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.assignedAgentId === agentId);
  }

  getTasksByPlan(planId: string): Task[] {
    return Array.from(this.tasks.values()).filter((t) => t.planId === planId);
  }

  updateTask(taskId: string, updates: Partial<Task>): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    Object.assign(task, updates);
    task.updatedAt = new Date();
    this.eventEmitter.emit('task.updated', task);
    return true;
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed' || task.status === 'failed') {
      return false;
    }

    task.status = 'cancelled';
    task.updatedAt = new Date();
    this.eventEmitter.emit('task.cancelled', task);
    return true;
  }

  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    this.tasks.delete(taskId);
    this.eventEmitter.emit('task.deleted', { id: taskId });
    return true;
  }

  // Helper to create common task types
  createShellTask(title: string, command: string, workingDirectory?: string): Task {
    return this.createTask({ title, description: command, type: 'shell', command, workingDirectory });
  }

  createOpencodeTask(title: string, prompt: string, workingDirectory?: string): Task {
    return this.createTask({ title, description: prompt, type: 'opencode', command: prompt, workingDirectory });
  }

  createNpmTask(title: string, command: string, args: string[], workingDirectory?: string): Task {
    return this.createTask({ title, description: `${command} ${args.join(' ')}`, type: 'npm', command, args, workingDirectory });
  }

  createGitTask(title: string, args: string[], workingDirectory?: string): Task {
    return this.createTask({ title, description: `git ${args.join(' ')}`, type: 'git', args, workingDirectory });
  }
}