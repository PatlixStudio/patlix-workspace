import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Companion, CompanionGender } from '../models/companion';

/**
 * Talks to the ai-love API companion catalog under `/api`.
 */
@Injectable({ providedIn: 'root' })
export class CompanionsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/companions';

  /**
   * Lists companions, optionally filtered by gender and personality tag.
   *
   * @param gender optional gender filter
   * @param tag optional personality-tag filter (substring)
   */
  list(gender?: CompanionGender, tag?: string): Observable<Companion[]> {
    const params: string[] = [];
    if (gender) {
      params.push(`gender=${encodeURIComponent(gender)}`);
    }
    if (tag) {
      params.push(`tag=${encodeURIComponent(tag)}`);
    }
    const qs = params.length > 0 ? `?${params.join('&')}` : '';
    return this.http.get<Companion[]>(`${this.baseUrl}${qs}`);
  }

  /**
   * Returns a single companion by id.
   *
   * @param id companion id
   */
  get(id: string): Observable<Companion> {
    return this.http.get<Companion>(`${this.baseUrl}/${id}`);
  }

  /**
   * Returns the distinct personality tags across the catalog (for filter chips).
   */
  personalityTags(): Observable<string[]> {
    return this.list().pipe(
      map((companions) => {
        const set = new Set<string>();
        for (const companion of companions) {
          for (const tag of companion.personalityTags) {
            set.add(tag);
          }
        }
        return [...set].sort();
      }),
    );
  }
}