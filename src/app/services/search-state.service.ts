import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SearchStateService {
  private searchTermSource = new BehaviorSubject<string>('');
  private searchResultsSource = new BehaviorSubject<any[]>([]);
  private lastSearchedTicker = '';
  private lastSearchedData: any = null;
  private cache = new Map<string, any>(); // Cache storing data against search terms


  currentSearchTerm = this.searchTermSource.asObservable();
  currentSearchResults = this.searchResultsSource.asObservable();

  private hasSearchResultsSource = new BehaviorSubject<boolean>(false);
  hasSearchResults = this.hasSearchResultsSource.asObservable();

  constructor() { }

  getCurrentSearchTerm(): string {
    return this.searchTermSource.value; // Directly return the current value of the BehaviorSubject
  }

  updateSearchTerm(term: string) {
    this.searchTermSource.next(term);
  }

  updateSearchResults(results: any[]) {
    this.searchResultsSource.next(results);
    this.hasSearchResultsSource.next(results.length > 0);
  }

  cacheData(ticker: string, data: any) {
    this.cache.set(ticker, data);
  }

  getCachedData(ticker: string): any {
    return this.cache.get(ticker);
  }

  isCachedDataValid(ticker: string): boolean {
    return this.getCachedData(ticker);
  }

  clearSearchState() {
      this.searchTermSource.next('');  // Emit an empty string to reset the search term
      this.searchResultsSource.next([]);  // Emit an empty array to reset the search results
      this.hasSearchResultsSource.next(false);  // Optionally, indicate that there are no search results
      this.updateSearchResults([]);
  }
  
}
