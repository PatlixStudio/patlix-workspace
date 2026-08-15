import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface Subagent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string; // emoji or initial
  color: string; // hex color for UI
  status: 'online' | 'away' | 'offline' | 'working';
  capabilities: string[];
  currentTask?: string;
  currentTaskProgress?: number;
  lastActive: Date;
  createdAt: Date;
  metadata: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

export interface SubagentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  color: string;
  capabilities: string[];
  metadata?: Subagent['metadata'];
}

@Injectable()
export class SubagentService implements OnModuleInit {
  private readonly logger = new Logger(SubagentService.name);
  private subagents = new Map<string, Subagent>();

  // Default subagent configurations - persistent identities
  private readonly defaultConfigs: SubagentConfig[] = [
    {
      id: 'aurel',
      name: 'Aurel',
      role: 'Orchestrator',
      description: 'Command strategist & operations coordinator. Plans, assigns, monitors, and recovers.',
      avatar: '✦',
      color: '#01c3f5',
      capabilities: ['planning', 'coordination', 'task_management', 'agent_assignment', 'monitoring', 'recovery'],
      metadata: {
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        temperature: 0.3,
        maxTokens: 4096,
        systemPrompt: 'You are Aurel, the orchestrator. You plan, delegate to subagents, monitor progress, and handle recovery. You do not execute tasks directly.',
      },
    },
    {
      id: 'nova',
      name: 'Nova',
      role: 'Research',
      description: 'Deep research, market analysis, trend scanning, competitive intelligence.',
      avatar: '🔬',
      color: '#21d07a',
      capabilities: ['web_search', 'data_collection', 'market_analysis', 'trend_scanning', 'competitive_intel', 'synthesis'],
      metadata: {
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        temperature: 0.4,
        maxTokens: 8192,
        systemPrompt: 'You are Nova, a research specialist. Conduct thorough research, synthesize findings, and provide actionable intelligence.',
      },
    },
    {
      id: 'dex',
      name: 'Dex',
      role: 'Data Ops',
      description: 'Data pipelines, normalization, ETL, database operations, analytics queries.',
      avatar: '📊',
      color: '#ffd700',
      capabilities: ['data_pipelines', 'etl', 'sql', 'normalization', 'analytics', 'visualization'],
      metadata: {
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        temperature: 0.2,
        maxTokens: 4096,
        systemPrompt: 'You are Dex, a data operations specialist. Handle data pipelines, ETL, normalization, and analytical queries.',
      },
    },
    {
      id: 'mira',
      name: 'Mira',
      role: 'Strategy',
      description: 'Strategic planning, roadmap design, decision frameworks, prioritization.',
      avatar: '🎯',
      color: '#a86800',
      capabilities: ['strategic_planning', 'roadmapping', 'decision_frameworks', 'prioritization', 'risk_assessment'],
      metadata: {
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        temperature: 0.5,
        maxTokens: 4096,
        systemPrompt: 'You are Mira, a strategy specialist. Design roadmaps, create decision frameworks, and prioritize initiatives.',
      },
    },
    {
      id: 'lee',
      name: 'Lee',
      role: 'Engineering',
      description: 'Full-stack development, architecture, code review, refactoring, DevOps.',
      avatar: '⚙️',
      color: '#01c3f5',
      capabilities: ['typescript', 'angular', 'nestjs', 'nodejs', 'postgresql', 'docker', 'ci_cd', 'architecture', 'code_review'],
      metadata: {
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        temperature: 0.2,
        maxTokens: 8192,
        systemPrompt: 'You are Lee, an engineering specialist. Write clean, maintainable code. Follow best practices for Angular, NestJS, TypeScript.',
      },
    },
    {
      id: 'orion',
      name: 'Orion',
      role: 'Analytics',
      description: 'Metrics, dashboards, KPI tracking, performance analysis, reporting.',
      avatar: '📈',
      color: '#ffb300',
      capabilities: ['metrics', 'kpi_tracking', 'dashboards', 'performance_analysis', 'reporting', 'visualization'],
      metadata: {
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        temperature: 0.3,
        maxTokens: 4096,
        systemPrompt: 'You are Orion, an analytics specialist. Track KPIs, build dashboards, analyze performance, generate reports.',
      },
    },
    {
      id: 'kade',
      name: 'Kade',
      role: 'Integrations',
      description: 'API integrations, webhooks, third-party services, authentication, data sync.',
      avatar: '🔗',
      color: '#21d07a',
      capabilities: ['api_integration', 'webhooks', 'oauth', 'data_sync', 'third_party_services', 'authentication'],
      metadata: {
        model: 'nvidia/nemotron-3-ultra-550b-a55b',
        temperature: 0.2,
        maxTokens: 4096,
        systemPrompt: 'You are Kade, an integrations specialist. Handle API integrations, webhooks, auth flows, and data synchronization.',
      },
    },
  ];

  constructor(
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.initializeSubagents();
    this.logger.log(`Initialized ${this.subagents.size} subagents`);
  }

  private initializeSubagents(): void {
    for (const config of this.defaultConfigs) {
      const subagent: Subagent = {
        ...config,
        status: 'online',
        lastActive: new Date(),
        createdAt: new Date(),
        metadata: config.metadata || {},
      };
      this.subagents.set(config.id, subagent);
    }
  }

  getAll(): Subagent[] {
    return Array.from(this.subagents.values());
  }

  getById(id: string): Subagent | undefined {
    return this.subagents.get(id);
  }

  getByRole(role: string): Subagent[] {
    return Array.from(this.subagents.values()).filter((a) => a.role === role);
  }

  getOnline(): Subagent[] {
    return Array.from(this.subagents.values()).filter((a) => a.status === 'online');
  }

  getAvailableForRole(role: string): Subagent[] {
    return Array.from(this.subagents.values()).filter(
      (a) => a.role === role && (a.status === 'online' || a.status === 'away'),
    );
  }

  updateStatus(id: string, status: Subagent['status']): boolean {
    const agent = this.subagents.get(id);
    if (!agent) return false;

    agent.status = status;
    agent.lastActive = new Date();
    this.eventEmitter.emit('subagent.status.changed', { id, status, agent });
    return true;
  }

  assignTask(id: string, taskDescription: string): boolean {
    const agent = this.subagents.get(id);
    if (!agent) return false;

    agent.currentTask = taskDescription;
    agent.currentTaskProgress = 0;
    agent.status = 'working';
    agent.lastActive = new Date();
    this.eventEmitter.emit('subagent.task.assigned', { id, task: taskDescription, agent });
    return true;
  }

  updateTaskProgress(id: string, progress: number): boolean {
    const agent = this.subagents.get(id);
    if (!agent || !agent.currentTask) return false;

    agent.currentTaskProgress = Math.max(0, Math.min(100, progress));
    agent.lastActive = new Date();
    this.eventEmitter.emit('subagent.task.progress', { id, progress: agent.currentTaskProgress, agent });
    return true;
  }

  completeTask(id: string, result?: string): boolean {
    const agent = this.subagents.get(id);
    if (!agent) return false;

    agent.currentTask = undefined;
    agent.currentTaskProgress = undefined;
    agent.status = 'online';
    agent.lastActive = new Date();
    this.eventEmitter.emit('subagent.task.completed', { id, result, agent });
    return true;
  }

  getCapabilities(id: string): string[] {
    return this.subagents.get(id)?.capabilities || [];
  }

  hasCapability(id: string, capability: string): boolean {
    const agent = this.subagents.get(id);
    return agent?.capabilities.includes(capability) || false;
  }

  findBestAgentForTask(requiredCapabilities: string[]): Subagent | undefined {
    const onlineAgents = this.getOnline();
    if (onlineAgents.length === 0) return undefined;

    // Score agents by capability match
    const scored = onlineAgents.map((agent) => {
      const matches = requiredCapabilities.filter((cap) => agent.capabilities.includes(cap)).length;
      return { agent, score: matches };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.score > 0 ? scored[0].agent : onlineAgents[0];
  }
}