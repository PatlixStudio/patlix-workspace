import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TasksService } from '../tasks/tasks.service';
import { SubagentService } from '../subagents/subagent.service';
import { OrchestrationService } from '../orchestration/orchestration.service';

export interface SystemMetrics {
  timestamp: Date;
  agents: {
    total: number;
    online: number;
    working: number;
    away: number;
    offline: number;
  };
  tasks: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  plans: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface AgentMetrics {
  agentId: string;
  agentName: string;
  role: string;
  tasksCompleted: number;
  tasksFailed: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  lastActive: Date;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metricsHistory: SystemMetrics[] = [];
  private readonly maxHistorySize = 1440; // 24 hours at 1-minute intervals

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly tasksService: TasksService,
    private readonly subagentService: SubagentService,
    private readonly orchestrationService: OrchestrationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherCurrentMetrics();
      this.metricsHistory.push(metrics);

      // Trim history
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      }

      this.eventEmitter.emit('metrics.collected', metrics);
    } catch (error) {
      this.logger.error('Failed to collect metrics', error);
    }
  }

  private async gatherCurrentMetrics(): Promise<SystemMetrics> {
    const agents = this.subagentService.getAll();
    const tasks = this.tasksService.getAllTasks();
    const plans = this.orchestrationService.getAllPlans();

    return {
      timestamp: new Date(),
      agents: {
        total: agents.length,
        online: agents.filter(a => a.status === 'online').length,
        working: agents.filter(a => a.status === 'working').length,
        away: agents.filter(a => a.status === 'away').length,
        offline: agents.filter(a => a.status === 'offline').length,
      },
      tasks: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        running: tasks.filter(t => t.status === 'running').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
        cancelled: tasks.filter(t => t.status === 'cancelled').length,
      },
      plans: {
        total: plans.length,
        pending: plans.filter(p => p.status === 'pending').length,
        inProgress: plans.filter(p => p.status === 'in_progress').length,
        completed: plans.filter(p => p.status === 'completed').length,
        failed: plans.filter(p => p.status === 'failed').length,
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  getMetricsHistory(minutes = 60): SystemMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp >= cutoff);
  }

  getAgentMetrics(): AgentMetrics[] {
    const agents = this.subagentService.getAll();
    const tasks = this.tasksService.getAllTasks();

    return agents.map(agent => {
      const agentTasks = tasks.filter(t => t.assignedAgentId === agent.id);
      const completedTasks = agentTasks.filter(t => t.status === 'completed');
      const failedTasks = agentTasks.filter(t => t.status === 'failed');
      
      const executionTimes = completedTasks
        .filter(t => t.startedAt && t.completedAt)
        .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime());

      const totalExecutionTime = executionTimes.reduce((sum, t) => sum + t, 0);
      const averageExecutionTime = executionTimes.length > 0 
        ? totalExecutionTime / executionTimes.length 
        : 0;

      return {
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        tasksCompleted: completedTasks.length,
        tasksFailed: failedTasks.length,
        totalExecutionTime,
        averageExecutionTime,
        lastActive: agent.lastActive,
      };
    });
  }

  getSystemHealth(): 'healthy' | 'degraded' | 'critical' {
    const current = this.getCurrentMetrics();
    if (!current) return 'healthy';

    // Check for concerning patterns
    const failedTaskRate = current.tasks.total > 0 
      ? current.tasks.failed / current.tasks.total 
      : 0;
    const failedPlanRate = current.plans.total > 0
      ? current.plans.failed / current.plans.total
      : 0;
    const memoryUsagePercent = current.system.memoryUsage.heapUsed / current.system.memoryUsage.heapTotal;

    if (failedTaskRate > 0.5 || failedPlanRate > 0.5 || memoryUsagePercent > 0.9) {
      return 'critical';
    }
    if (failedTaskRate > 0.2 || failedPlanRate > 0.2 || memoryUsagePercent > 0.75) {
      return 'degraded';
    }
    return 'healthy';
  }

  getDashboardStats(): Record<string, any> {
    const current = this.getCurrentMetrics();
    if (!current) {
      return {
        activeProjects: 0,
        tasksInProgress: 0,
        overallProgress: '0%',
        criticalAlerts: 0,
        agentsOnline: 0,
        agentsWorking: 0,
        systemHealth: 'unknown',
        uptime: '0s',
      };
    }

    const plans = this.orchestrationService.getAllPlans();
    const totalSteps = plans.reduce((sum, p) => sum + (p.steps?.length || 0), 0);
    const completedSteps = plans.reduce((sum, p) => 
      sum + (p.steps?.filter((s: any) => s.status === 'completed').length || 0), 0);
    const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      activeProjects: current.plans.inProgress + current.plans.pending,
      tasksInProgress: current.tasks.running,
      overallProgress: `${overallProgress}%`,
      criticalAlerts: current.tasks.failed + current.plans.failed,
      agentsOnline: current.agents.online,
      agentsWorking: current.agents.working,
      systemHealth: this.getSystemHealth(),
      uptime: this.formatUptime(current.system.uptime),
      memoryUsage: `${Math.round(current.system.memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(current.system.memoryUsage.heapTotal / 1024 / 1024)}MB`,
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }
}