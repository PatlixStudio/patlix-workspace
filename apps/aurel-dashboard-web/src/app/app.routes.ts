import { Route } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard';
import { PlaceholderPageComponent } from './pages/placeholder';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'conversations', component: PlaceholderPageComponent, data: { label: 'Conversations' } },
  { path: 'subagents', component: PlaceholderPageComponent, data: { label: 'Subagents' } },
  { path: 'projects', component: PlaceholderPageComponent, data: { label: 'Projects' } },
  { path: 'knowledge-base', component: PlaceholderPageComponent, data: { label: 'Knowledge Base' } },
  { path: 'analytics', component: PlaceholderPageComponent, data: { label: 'Analytics' } },
  { path: 'memory-core', component: PlaceholderPageComponent, data: { label: 'Memory Core' } },
  { path: 'integrations', component: PlaceholderPageComponent, data: { label: 'Integrations' } },
  { path: 'settings', component: PlaceholderPageComponent, data: { label: 'System Settings' } },
  { path: '**', redirectTo: '/dashboard' },
];