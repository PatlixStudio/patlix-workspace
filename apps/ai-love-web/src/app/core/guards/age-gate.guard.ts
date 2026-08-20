import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AGE_GATE_KEY } from '../models/companion';

/**
 * Blocks routes until the user confirmed they are 18+ on the age-gate page.
 */
export const ageGateGuard: CanActivateFn = () => {
  const router = inject(Router);
  const consented = localStorage.getItem(AGE_GATE_KEY) === 'true';
  if (!consented) {
    return router.createUrlTree(['/age-gate']);
  }
  return true;
};