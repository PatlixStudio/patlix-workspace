import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { ThemeService } from '../theme.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIcon],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class ShellComponent {
  /** Sidebar collapsed (icon-only) state. */
  readonly collapsed = signal(false);

  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Conversations', icon: 'forum', route: '/conversations' },
    { label: 'Subagents', icon: 'smart_toy', route: '/subagents' },
    { label: 'Projects', icon: 'folder', route: '/projects' },
    { label: 'Knowledge Base', icon: 'database', route: '/knowledge-base' },
    { label: 'Analytics', icon: 'bar_chart', route: '/analytics' },
    { label: 'Memory Core', icon: 'memory', route: '/memory-core' },
    { label: 'Integrations', icon: 'extension', route: '/integrations' },
    { label: 'System Settings', icon: 'settings', route: '/settings' },
  ];

  protected readonly dateLabel = 'SAT, AUG 02, 2026';
  protected readonly timeLabel = '10:24:36 AM';
  protected readonly userLabel = 'Patflix Studio';

  /** Voice waveform amplitudes for the bot avatar display. */
  protected readonly wave = [
    10, 18, 12, 24, 16, 30, 20, 14, 26, 18, 32, 22, 16, 28, 20, 12,
    24, 16, 30, 20, 14, 26, 18, 12, 20, 24, 16, 30, 22, 14, 20, 26,
  ];

  protected readonly theme = inject(ThemeService);

  protected toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }
}