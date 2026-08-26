import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RequestDto } from '../../models/request.model';

@Component({
  selector: 'app-requests-table',
  templateUrl: './requests-table.component.html',
  styleUrls: ['./requests-table.component.scss']
})
export class RequestsTableComponent {
  @Input() items: RequestDto[] = [];
  @Input() sortBy: string = 'CreatedAt';
  @Input() sortDirection: string = 'desc';

  @Output() sortChange = new EventEmitter<{ sortBy: string; sortDirection: string }>();

  readonly columns = [
    { key: 'Id', label: 'Id' },
    { key: 'RequestNumber', label: 'RequestNumber' },
    { key: 'Status', label: 'Status' },
    { key: 'RequestType', label: 'RequestType' },
    { key: 'CreatedAt', label: 'CreatedAt' },
    { key: 'OwnerId', label: 'OwnerId' }
  ];

  onSort(column: string): void {
    if (column === this.sortBy) {
      const newDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.sortChange.emit({ sortBy: column, sortDirection: newDirection });
    } else {
      this.sortChange.emit({ sortBy: column, sortDirection: 'asc' });
    }
  }

  getSortIndicator(column: string): string {
    if (column !== this.sortBy) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }
}
