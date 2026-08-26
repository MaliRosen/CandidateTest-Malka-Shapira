import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { RequestStatus, RequestType } from '../../models/request.model';
import { SearchQuery } from '../../models/search-query.model';

interface EnumOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss'],
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  @Output() filterChange = new EventEmitter<Partial<SearchQuery>>();

  form!: FormGroup;

  readonly statusOptions: EnumOption<RequestStatus>[] = [
    { label: 'New', value: RequestStatus.New },
    { label: 'In Progress', value: RequestStatus.InProgress },
    { label: 'Completed', value: RequestStatus.Completed },
    { label: 'Cancelled', value: RequestStatus.Cancelled },
  ];

  readonly requestTypeOptions: EnumOption<RequestType>[] = [
    { label: 'General', value: RequestType.General },
    { label: 'Legal', value: RequestType.Legal },
    { label: 'Payment', value: RequestType.Payment },
    { label: 'Appeal', value: RequestType.Appeal },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      requestNumber: [''],
      status: [[]],
      requestType: [[]],
      createdFrom: [''],
      createdTo: [''],
    });

    // requestNumber: debounce 500ms before emitting
    this.form.get('requestNumber')!
      .valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.emitFilter());

    // Dropdown and date controls: emit immediately on change
    ['status', 'requestType', 'createdFrom', 'createdTo'].forEach((controlName) => {
      this.form.get(controlName)!
        .valueChanges.pipe(
          distinctUntilChanged(),
          takeUntil(this.destroy$),
        )
        .subscribe(() => this.emitFilter());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private emitFilter(): void {
    const raw = this.form.value;
    const filter: Partial<SearchQuery> = {};

    if (raw.requestNumber != null && raw.requestNumber !== '') {
      filter.requestNumber = raw.requestNumber;
    }

    if (Array.isArray(raw.status) && raw.status.length > 0) {
      filter.status = raw.status as RequestStatus[];
    }

    if (Array.isArray(raw.requestType) && raw.requestType.length > 0) {
      filter.requestType = raw.requestType as RequestType[];
    }

    if (raw.createdFrom != null && raw.createdFrom !== '') {
      filter.createdFrom = raw.createdFrom;
    }

    if (raw.createdTo != null && raw.createdTo !== '') {
      filter.createdTo = raw.createdTo;
    }

    this.filterChange.emit(filter);
  }
}
