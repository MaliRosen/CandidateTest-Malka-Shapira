import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { RequestsService } from './services/requests.service';
import { SearchQuery } from './models/search-query.model';
import { PagedResult } from './models/paged-result.model';
import { RequestDto } from './models/request.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  // Demo credentials
  readonly userId = 1;
  readonly isAdmin = true;

  query: SearchQuery = {
    sortBy: 'CreatedAt',
    sortDirection: 'desc',
    page: 1,
    pageSize: 20
  };

  result: PagedResult<RequestDto> | null = null;
  loading = false;
  error: string | null = null;

  constructor(private requestsService: RequestsService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  onFilterChange(changes: Partial<SearchQuery>): void {
    this.query = { ...this.query, ...changes, page: 1 };
    this.loadRequests();
  }

  onSortChange(sort: { sortBy: string; sortDirection: string }): void {
    this.query = { ...this.query, sortBy: sort.sortBy, sortDirection: sort.sortDirection };
    this.loadRequests();
  }

  onPageChange(page: number): void {
    this.query = { ...this.query, page };
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.requestsService
      .search(this.query, this.userId, this.isAdmin)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (result) => {
          this.result = result;
          this.error = null;
        },
        error: (err) => {
          this.error = err?.message ?? 'אירעה שגיאה בטעינת הבקשות';
        }
      });
  }
}
