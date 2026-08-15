import { Component, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ChatService } from '../chat.service';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  accent: 'cyan' | 'gold' | 'green' | 'red';
}

interface Subagent {
  name: string;
  role: string;
  status: 'online' | 'away' | 'offline';
  initial: string;
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

@Component({
  selector: 'app-dashboard',
  imports: [MatIcon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  protected readonly userInitial = 'P';

  protected readonly stats: StatCard[] = [
    { label: 'Active Projects', value: '12', icon: 'folder_open', accent: 'cyan' },
    { label: 'Tasks in Progress', value: '28', icon: 'task_alt', accent: 'gold' },
    { label: 'Overall Progress', value: '85%', icon: 'trending_up', accent: 'green' },
    { label: 'Critical Alerts', value: '4', icon: 'notifications_active', accent: 'red' },
  ];

  protected readonly subagents: Subagent[] = [
    { name: 'Nova', role: 'Research', status: 'online', initial: 'N' },
    { name: 'Dex', role: 'Data Ops', status: 'online', initial: 'D' },
    { name: 'Mira', role: 'Strategy', status: 'away', initial: 'M' },
    { name: 'Lee', role: 'Engineering', status: 'online', initial: 'L' },
    { name: 'Orion', role: 'Analytics', status: 'offline', initial: 'O' },
    { name: 'Kade', role: 'Integrations', status: 'away', initial: 'K' },
  ];

  protected readonly activities: ActivityItem[] = [
    { name: 'Nova', task: 'Market data collection', progress: 92, accent: 'var(--ad-cyan)' },
    { name: 'Dex', task: 'Pipeline normalization', progress: 76, accent: 'var(--ad-gold)' },
    { name: 'Mira', task: 'Strategic planning brief', progress: 58, accent: 'var(--ad-cyan)' },
    { name: 'Lee', task: 'API refactor sprint', progress: 84, accent: 'var(--ad-gold)' },
  ];

  protected readonly insights: Insight[] = [
    { label: 'Tasks Allocated', value: '1,204', icon: 'assignment', delta: '+8%' },
    { label: 'Tasks Completed', value: '986', icon: 'check_circle', delta: '+12%' },
    { label: 'Time Saved', value: '143h', icon: 'schedule', delta: '+9%' },
    { label: 'Model Throughput', value: '3.2k', icon: 'bolt', delta: '+5%' },
  ];

  protected readonly projects: Project[] = [
    { name: 'OceanRita Platform', detail: 'Core platform build', progress: 78 },
    { name: 'AI Assistant Engine', detail: 'Conversation engine v2', progress: 62 },
    { name: 'Marketing Campaign', detail: 'Q3 launch series', progress: 45 },
  ];

  protected readonly logs: ActivityLog[] = [
    { time: '09:58', text: 'Nova completed market data collection task', type: 'done' },
    { time: '09:41', text: 'Analysis pipeline finished processing 2,401 records', type: 'info' },
    { time: '09:22', text: 'Mira flagged a strategy gap in Q3 plan', type: 'alert' },
    { time: '08:47', text: 'Dex synced 6 new integrations', type: 'done' },
  ];

  /** Conversation between the user and Aurel. */
  protected readonly messages = signal<ChatMessage[]>([
    {
      author: 'user',
      text: 'Can you summarize this week\u2019s progress?',
      time: '10:18',
    },
    {
      author: 'aurel',
      text: 'Tasks are up 12% with 986 completed. OceanRita is at 78% \u2014 3 blockers flagged on the Q3 marketing launch.',
      time: '10:18',
    },
    {
      author: 'user',
      text: 'Great. Deploy the assistant engine update tonight.',
      time: '10:20',
    },
  ]);

  /** New-message draft bound to the chat input. */
  protected readonly draft = signal('');

  /** True while a reply is being fetched from the API. */
  protected readonly sending = signal(false);

  private readonly chatService = inject(ChatService);

  protected readonly waveform = [
    12, 20, 14, 26, 18, 30, 16, 24, 12, 20, 26, 14, 22, 30, 18, 12,
    24, 16, 28, 20, 14, 26, 18, 12, 20, 24, 16, 30, 22, 14, 20, 26,
  ];

  /** Sends the current draft as a user message and queues an Aurel reply. */
  protected async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.sending()) {
      return;
    }
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.update((list) => [...list, { author: 'user', text, time }]);
    this.draft.set('');
    this.sending.set(true);
    try {
      const reply = await this.chatService.send(text);
      this.messages.update((list) => [
        ...list,
        { author: 'aurel', text: reply.reply, time: reply.time },
      ]);
    } catch {
      this.messages.update((list) => [
        ...list,
        {
          author: 'aurel',
          text: 'I could not reach the coordination core. Please try again.',
          time,
        },
      ]);
    } finally {
      this.sending.set(false);
    }
  }
}