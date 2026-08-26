import { RequestStatus, RequestType } from './request.model';

export interface SearchQuery {
  requestNumber?: string;
  status?: RequestStatus[];
  requestType?: RequestType[];
  createdFrom?: string;  // ISO date string
  createdTo?: string;    // ISO date string
  sortBy: string;        // default: "CreatedAt"
  sortDirection: string; // default: "desc"
  page: number;          // default: 1
  pageSize: number;      // default: 20
}
