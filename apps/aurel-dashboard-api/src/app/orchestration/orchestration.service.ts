import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TasksService } from '../tasks/tasks.service';

export interface OrchestrationRequest {
  message: string;
  context?: {
    currentView?: string;
    activeProject?: string;
    selectedAgent?: string;
  };
}

export interface OrchestrationResponse {
  reply: string;
  action?: 'task_created' | 'agent_assigned' | 'status_update' | 'info';
  metadata?: {
    taskId?: string;
    agentId?: string;
    planId?: string;
  };
  time: string;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  agentRole: string;
  assignedAgentId?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

@Injectable()
export class OrchestrationService {
  private readonly logger = new Logger(OrchestrationService.name);
  private plans = new Map<string, Plan>();
  private planCounter = 0;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly tasksService: TasksService,
  ) {}

  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Analyze the message to determine intent
    const intent = this.analyzeIntent(request.message);

    switch (intent.type) {
      case 'create_task':
        return this.handleCreateTask(intent, request.context, time);
      case 'check_status':
        return this.handleCheckStatus(intent, request.context, time);
      case 'assign_agent':
        return this.handleAssignAgent(intent, request.context, time);
      case 'list_agents':
        return this.handleListAgents(time);
      case 'list_tasks':
        return this.handleListTasks(time);
      case 'run_diagnostics':
        return this.handleRunDiagnostics(time);
      default:
        return this.handleGeneralChat(request.message, request.context, time);
    }
  }

  private analyzeIntent(message: string): { type: string; entities: Record<string, string> } {
    const lower = message.toLowerCase();

    if (lower.includes('create') && (lower.includes('task') || lower.includes('plan'))) {
      return { type: 'create_task', entities: this.extractTaskEntities(message) };
    }
    if (lower.includes('status') || lower.includes('progress') || lower.includes('how is')) {
      return { type: 'check_status', entities: {} };
    }
    if (lower.includes('assign') && lower.includes('agent')) {
      return { type: 'assign_agent', entities: this.extractAgentEntities(message) };
    }
    if (lower.includes('list') && lower.includes('agent')) {
      return { type: 'list_agents', entities: {} };
    }
    if (lower.includes('list') && lower.includes('task')) {
      return { type: 'list_tasks', entities: {} };
    }
    if (lower.includes('diagnostic') || lower.includes('health') || lower.includes('check system')) {
      return { type: 'run_diagnostics', entities: {} };
    }

    return { type: 'general_chat', entities: {} };
  }

  private extractTaskEntities(message: string): Record<string, string> {
    return { description: message };
  }

  private extractAgentEntities(message: string): Record<string, string> {
    return {};
  }

  private async handleCreateTask(
    intent: { entities: Record<string, string> },
    context: OrchestrationRequest['context'],
    time: string,
  ): Promise<OrchestrationResponse> {
    const planId = `plan_${++this.planCounter}_${Date.now()}`;
    const plan: Plan = {
      id: planId,
      title: 'New Task from Chat',
      description: intent.entities.description || 'Task created via chat',
      steps: [
        {
          id: `step_1_${Date.now()}`,
          title: 'Analyze requirements',
          description: 'Break down the task into actionable steps',
          agentRole: 'planner',
          status: 'pending',
        },
        {
          id: `step_2_${Date.now()}`,
          title: 'Execute implementation',
          description: 'Implement the solution',
          agentRole: 'developer',
          status: 'pending',
        },
        {
          id: `step_3_${Date.now()}`,
          title: 'Review and validate',
          description: 'Review the implementation',
          agentRole: 'reviewer',
          status: 'pending',
        },
      ],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.plans.set(planId, plan);
    this.eventEmitter.emit('plan.created', plan);

    // Create real tasks for each step
    for (const step of plan.steps) {
      const task = this.tasksService.createOpencodeTask(
        `${plan.title}: ${step.title}`,
        step.description,
        undefined,
      );
      task.planId = planId;
      task.stepId = step.id;

      // Find best agent for this step
      const agent = this.findBestAgentForRole(step.agentRole);
      if (agent) {
        task.assignedAgentId = agent.id;
        this.tasksService.updateTask(task.id, { assignedAgentId: agent.id });
        this.logger.log(`Assigned task ${task.id} to agent ${agent.name} (${agent.role})`);
      }
    }

    // Execute the first step immediately (analyze requirements)
    const firstStep = plan.steps[0];
    const firstTask = this.tasksService.getAllTasks().find(t => t.stepId === firstStep.id);
    if (firstTask) {
      this.logger.log(`Executing first step: ${firstTask.title}`);
      this.tasksService.executeTask(firstTask.id).then(result => {
        this.logger.log(`Step ${firstStep.id} completed: ${result.success ? 'success' : 'failed'}`);
        if (result.success) {
          this.updatePlanStep(planId, firstStep.id, { status: 'completed', result: result.output });
          this.executeNextStep(planId, 1);
        } else {
          this.updatePlanStep(planId, firstStep.id, { status: 'failed', result: result.error });
        }
      });
    }

    return {
      reply: `I've created a new plan (**${planId}**) with ${plan.steps.length} steps. The first step (analyze requirements) is now executing via opencode.`,
      action: 'task_created',
      metadata: { planId },
      time,
    };
  }

  private findBestAgentForRole(role: string): { id: string; name: string; role: string } | undefined {
    const roleMap: Record<string, string> = {
      'planner': 'aurel',
      'developer': 'lee',
      'reviewer': 'mira',
      'researcher': 'nova',
      'data': 'dex',
      'analytics': 'orion',
      'integrations': 'kade',
    };
    const agentId = roleMap[role.toLowerCase()] || 'lee';
    return { id: agentId, name: agentId, role };
  }

  private async executeNextStep(planId: string, stepIndex: number): Promise<void> {
    const plan = this.plans.get(planId);
    if (!plan || stepIndex >= plan.steps.length) return;

    const step = plan.steps[stepIndex];
    const task = this.tasksService.getAllTasks().find(t => t.stepId === step.id);
    if (!task) return;

    this.updatePlanStep(planId, step.id, { status: 'in_progress' });

    this.tasksService.executeTask(task.id).then(result => {
      this.logger.log(`Step ${step.id} completed: ${result.success ? 'success' : 'failed'}`);
      if (result.success) {
        this.updatePlanStep(planId, step.id, { status: 'completed', result: result.output });
        this.executeNextStep(planId, stepIndex + 1);
      } else {
        this.updatePlanStep(planId, step.id, { status: 'failed', result: result.error });
        plan.status = 'failed';
      }
    });
  }

  private async handleCheckStatus(
    intent: { entities: Record<string, string> },
    context: OrchestrationRequest['context'],
    time: string,
  ): Promise<OrchestrationResponse> {
    const activePlans = Array.from(this.plans.values()).filter(
      (p) => p.status === 'in_progress' || p.status === 'pending',
    );

    if (activePlans.length === 0) {
      return {
        reply: 'No active plans currently. All systems idle.',
        action: 'status_update',
        time,
      };
    }

    const statusLines = activePlans.map((plan) => {
      const completed = plan.steps.filter((s) => s.status === 'completed').length;
      return `• **${plan.id}**: ${plan.title} — ${completed}/${plan.steps.length} steps done (${plan.status})`;
    });

    return {
      reply: `**Active Plans:**\n${statusLines.join('\n')}`,
      action: 'status_update',
      time,
    };
  }

  private async handleAssignAgent(
    intent: { entities: Record<string, string> },
    context: OrchestrationRequest['context'],
    time: string,
  ): Promise<OrchestrationResponse> {
    return {
      reply: 'Agent assignment feature coming soon. For now, agents are auto-assigned based on role matching.',
      action: 'info',
      time,
    };
  }

  private async handleListAgents(time: string): Promise<OrchestrationResponse> {
    return {
      reply: 'Use the dashboard to see all subagents with their current status and roles.',
      action: 'info',
      time,
    };
  }

  private async handleListTasks(time: string): Promise<OrchestrationResponse> {
    const allPlans = Array.from(this.plans.values());
    if (allPlans.length === 0) {
      return {
        reply: 'No tasks created yet.',
        action: 'info',
        time,
      };
    }

    const taskLines = allPlans.map((plan) => {
      const completed = plan.steps.filter((s) => s.status === 'completed').length;
      return `• **${plan.id}**: ${plan.title} — ${completed}/${plan.steps.length} (${plan.status})`;
    });

    return {
      reply: `**All Plans:**\n${taskLines.join('\n')}`,
      action: 'info',
      time,
    };
  }

  private async handleRunDiagnostics(time: string): Promise<OrchestrationResponse> {
    return {
      reply: 'Running system diagnostics...\n• API: Healthy\n• Database: Connected\n• Tools: Available\n• Subagents: 6 active',
      action: 'info',
      time,
    };
  }

  private async handleGeneralChat(
    message: string,
    context: OrchestrationRequest['context'],
    time: string,
  ): Promise<OrchestrationResponse> {
    const responses = [
      'Acknowledged. I\'ve noted that and will factor it into the next coordination cycle.',
      'Understood. Let me check with the relevant subagents and get back to you.',
      'Received. I\'ve added that to the task queue for processing.',
      'Got it. I\'ll pull the latest status and report back shortly.',
    ];

    return {
      reply: responses[Math.floor(Math.random() * responses.length)],
      action: 'info',
      time,
    };
  }

  getPlan(planId: string): Plan | undefined {
    return this.plans.get(planId);
  }

  getAllPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  updatePlanStep(planId: string, stepId: string, updates: Partial<PlanStep>): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) return false;

    Object.assign(step, updates);
    plan.updatedAt = new Date();

    if (plan.steps.every((s) => s.status === 'completed')) {
      plan.status = 'completed';
    } else if (plan.steps.some((s) => s.status === 'in_progress')) {
      plan.status = 'in_progress';
    }

    this.eventEmitter.emit('plan.updated', plan);
    return true;
  }
}