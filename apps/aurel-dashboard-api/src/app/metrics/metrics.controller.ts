import { Controller, Get } from '@nestjs/common';
import { MetricsService, SystemMetrics, AgentMetrics } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getCurrentMetrics(): Promise<SystemMetrics | null> {
    return this.metricsService.getCurrentMetrics();
  }

  @Get('history')
  async getMetricsHistory(): Promise<SystemMetrics[]> {
    return this.metricsService.getMetricsHistory(60); // Last 60 minutes
  }

  @Get('agents')
  async getAgentMetrics(): Promise<AgentMetrics[]> {
    return this.metricsService.getAgentMetrics();
  }

  @Get('health')
  async getSystemHealth(): Promise<{ status: string }> {
    return { status: this.metricsService.getSystemHealth() };
  }

  @Get('dashboard')
  async getDashboardStats(): Promise<Record<string, any>> {
    return this.metricsService.getDashboardStats();
  }
}