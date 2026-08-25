import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AGE_GATE_KEY } from '../models/companion';

/**
 * Blocks routes until the user confirmed they are 18+ on the age-gate page.
 * Uses a persistent cookie instead of localStorage to survive container restarts.
 */
export const ageGateGuard: CanActivateFn = () => {
  const router = inject(Router);
  const consented = document.cookie.match(new RegExp(`(^| )${AGE_GATE_KEY}=([^;]+)`));
  if (!consented) {
    return router.createUrlTree(['/age-gate']);
  }
  return true;
};