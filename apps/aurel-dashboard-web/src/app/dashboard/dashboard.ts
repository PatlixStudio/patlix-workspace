import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  accent: 'cyan' | 'gold' | 'green' | 'red';
}

interface Subagent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  color: string;
  status: 'online' | 'away' | 'offline' | 'working';
  capabilities: string[];
  currentTask?: string;
  currentTaskProgress?: number;
  lastActive: string;
  metadata?: Record<string, any>;
}

interface ActivityItem {
  name: string;
  task: string;
  progress: number;
  accent: string;
}

interface Insight {
  label: string;
  value: string;
  icon: string;
  delta: string;
}

interface Project {
  name: string;
  detail: string;
  progress: number;
}

interface ActivityLog {
  time: string;
  text: string;
  type: 'done' | 'info' | 'alert';
}

interface ChatMessage {
  author: 'user' | 'aurel';
  text: string;
  time: string;
}

interface OrchestrationResponse {
  reply: string;
  action?: 'task_created' | 'agent_assigned' | 'status_update' | 'info';
  metadata?: {
    taskId?: string;
    agentId?: string;
    planId?: string;
  };
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIcon, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected readonly userInitial = 'P';

  // State signals
  protected readonly stats = signal<StatCard[]>([
    { label: 'Active Projects', value: '—', icon: 'folder_open', accent: 'cyan' },
    { label: 'Tasks in Progress', value: '—', icon: 'task_alt', accent: 'gold' },
    { label: 'Overall Progress', value: '—', icon: 'trending_up', accent: 'green' },
    { label: 'Critical Alerts', value: '—', icon: 'notifications_active', accent: 'red' },
  ]);

  protected readonly subagents = signal<Subagent[]>([]);
  protected readonly activities = signal<ActivityItem[]>([]);
  protected readonly insights = signal<Insight[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly logs = signal<ActivityLog[]>([]);
  protected readonly messages = signal<ChatMessage[]>([
    {
      author: 'aurel',
      text: 'Aurel Dashboard connected. All systems nominal. How can I help?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);
  protected readonly loading = signal(true);
  protected readonly waveform = signal<number[]>([]);

  private readonly http = inject(HttpClient);
  private refreshInterval?: number;
  private waveformInterval?: number;

  ngOnInit(): void {
    this.loadDashboardData();
    this.startAutoRefresh();
    this.startWaveformAnimation();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.waveformInterval) clearInterval(this.waveformInterval);
  }

  private startAutoRefresh(): void {
    // Refresh every 10 seconds
    this.refreshInterval = window.setInterval(() => {
      this.loadDashboardData(false);
    }, 10000);
  }

  private startWaveformAnimation(): void {
    this.waveformInterval = window.setInterval(() => {
      this.waveform.update(() => 
        Array.from({ length: 32 }, () => Math.floor(Math.random() * 25) + 5)
      );
    }, 200);
  }

  private async loadDashboardData(showLoading = true): Promise<void> {
    if (showLoading) this.loading.set(true);

    try {
      // Load subagents from API
      const agents = await this.http.get<Subagent[]>('/api/subagents').toPromise();
      if (agents) this.subagents.set(agents);

      // Load orchestration plans for stats
      const plans = await this.http.get<any[]>('/api/orchestration/plans').toPromise();
      this.updateStatsFromPlans(plans || []);

      // Generate activities from subagent current tasks
      this.updateActivitiesFromAgents(agents || []);

      // Load insights (could come from a metrics endpoint)
      this.updateInsights(agents || [], plans || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.addLog('alert', 'Failed to load dashboard data from API');
    } finally {
      this.loading.set(false);
    }
  }

  private updateStatsFromPlans(plans: any[]): void {
    const activePlans = plans.filter(p => p.status === 'in_progress' || p.status === 'pending');
    const totalSteps = plans.reduce((sum, p) => sum + (p.steps?.length || 0), 0);
    const completedSteps = plans.reduce((sum, p) => 
      sum + (p.steps?.filter((s: any) => s.status === 'completed').length || 0), 0);
    const overallProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    this.stats.update(current => [
      { ...current[0], value: String(activePlans.length) },
      { ...current[1], value: String(plans.filter(p => p.status === 'in_progress').length) },
      { ...current[2], value: `${overallProgress}%` },
      { ...current[3], value: String(plans.filter(p => p.status === 'failed').length) },
    ]);
  }

  private updateActivitiesFromAgents(agents: Subagent[]): void {
    const activityItems: ActivityItem[] = agents
      .filter(a => a.currentTask)
      .map(a => ({
        name: a.name,
        task: a.currentTask || 'Idle',
        progress: a.currentTaskProgress || 0,
        accent: a.color,
      }));

    if (activityItems.length === 0) {
      activityItems.push(
        { name: 'Aurel', task: 'Monitoring systems', progress: 100, accent: '#01c3f5' },
        { name: 'Nova', task: 'Standing by', progress: 0, accent: '#21d07a' },
        { name: 'Lee', task: 'Awaiting assignment', progress: 0, accent: '#01c3f5' },
      );
    }

    this.activities.set(activityItems);
  }

  private updateInsights(agents: Subagent[], plans: any[]): void {
    const onlineAgents = agents.filter(a => a.status === 'online').length;
    const workingAgents = agents.filter(a => a.status === 'working').length;
    const totalPlans = plans.length;
    const completedPlans = plans.filter(p => p.status === 'completed').length;

    this.insights.set([
      { label: 'Agents Online', value: String(onlineAgents), icon: 'devices', delta: `${workingAgents} working` },
      { label: 'Plans Active', value: String(totalPlans), icon: 'assignment', delta: `${completedPlans} completed` },
      { label: 'System Health', value: 'Optimal', icon: 'favorite', delta: 'All services operational' },
      { label: 'Last Sync', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: 'sync', delta: 'Auto-refresh: 10s' },
    ]);
  }

  private addLog(type: ActivityLog['type'], text: string): void {
    this.logs.update(current => [
      { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text, type },
      ...current.slice(0, 9),
    ]);
  }

  /** Sends the current draft as a user message and queues an Aurel reply. */
  protected async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.sending()) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    this.messages.update(list => [...list, { author: 'user', text, time }]);
    this.draft.set('');
    this.sending.set(true);

    try {
      const response = await this.http.post<OrchestrationResponse>('/api/orchestration/chat', {
        message: text,
        context: {
          currentView: 'dashboard',
          activeProject: this.projects()[0]?.name,
        },
      }).toPromise();

      if (response) {
        this.messages.update(list => [
          ...list,
          { author: 'aurel', text: response.reply, time: response.time },
        ]);
        
        // If action indicates something changed, refresh dashboard
        if (response.action === 'task_created' || response.action === 'agent_assigned') {
          this.loadDashboardData(false);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.messages.update(list => [
        ...list,
        {
          author: 'aurel',
          text: 'I could not reach the coordination core. Please try again.',
          time,
        },
      ]);
      this.addLog('alert', 'Chat API error');
    } finally {
      this.sending.set(false);
    }
  }

  // Subagent actions
  protected async assignTaskToAgent(agentId: string): Promise<void> {
    const agent = this.subagents().find(a => a.id === agentId);
    if (!agent) return;

    const task = prompt(`Assign task to ${agent.name} (${agent.role}):`);
    if (!task) return;

    try {
      await this.http.post(`/api/subagents/${agentId}/assign-task`, { task }).toPromise();
      this.addLog('info', `Task assigned to ${agent.name}`);
      this.loadDashboardData(false);
    } catch (error) {
      console.error('Failed to assign task:', error);
      this.addLog('alert', `Failed to assign task to ${agent.name}`);
    }
  }

  protected getStatusClass(status: Subagent['status']): string {
    return status;
  }

  protected getAgentInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  protected parseProgress(value: string): number {
    const num = parseInt(value.replace('%', ''), 10);
    return isNaN(num) ? 0 : num;
  }
}