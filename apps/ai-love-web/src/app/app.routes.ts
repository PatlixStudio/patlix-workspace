import { Route } from '@angular/router';
import { ageGateGuard } from './core/guards/age-gate.guard';
import { AgeGateComponent } from './pages/age-gate/age-gate';
import { CompanionListComponent } from './pages/companion-list/companion-list';
import { CompanionDetailComponent } from './pages/companion-detail/companion-detail';
import { ChatComponent } from './pages/chat/chat';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ProfileComponent } from './pages/profile/profile';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: '/companions' },
  { path: 'age-gate', component: AgeGateComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', canActivate: [ageGateGuard], component: ProfileComponent },
  {
    path: 'companions',
    canActivate: [ageGateGuard],
    children: [
      { path: '', component: CompanionListComponent },
      { path: ':id', component: CompanionDetailComponent },
      { path: ':id/chat', component: ChatComponent },
    ],
  },
  { path: '**', redirectTo: '/companions' },
];