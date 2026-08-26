import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { App } from './app';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';
import { RequestsTableComponent } from './components/requests-table/requests-table.component';
import { PaginationComponent } from './components/pagination/pagination.component';

@NgModule({
  declarations: [
    App,
    SearchFilterComponent,
    RequestsTableComponent,
    PaginationComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [App]
})
export class AppModule { }
