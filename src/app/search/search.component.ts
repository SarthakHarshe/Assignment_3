import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, tap, finalize, of, Subscription, BehaviorSubject } from 'rxjs';
import {debounceTime,switchMap,catchError,map,startWith} from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { StockService } from '../services/stock.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule, ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { SearchStateService } from '../services/search-state.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    MatAutocompleteModule,
    FormsModule,
    ReactiveFormsModule,
    AsyncPipe,
    NgIf,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: `./search.component.html`,
  styleUrl: `./search.component.css`,
})


export class SearchComponent implements OnInit, OnDestroy {
  // Declare variables
  control = new FormControl();
  filteredResults = new BehaviorSubject<any[]>([]);
  isLoading = false; // Track loading state
  searchTerm: string = '';
  private subscriptions = new Subscription();
  noInputError: boolean = false;
  noDataError: boolean = false;
  private valueChangesSubscription!: Subscription; // Declare the property here


  constructor(private stockService: StockService, private router: Router,private searchStateService: SearchStateService,private ngZone: NgZone,private cdr: ChangeDetectorRef ) {} // Inject the StockService

  // Function to initialize component
  ngOnInit() {
    // this.filteredResults = this.control.valueChanges.pipe(
    //   debounceTime(300),
    //   tap(() => this.isLoading = true), // Start loading
    //   switchMap(value => {
    //     if (value) {
    //       return this.stockService.searchStocks(value).pipe(
    //         startWith([]), // Emits an initial empty array to clear previous results
    //         catchError(() => of([])), // In case of error, emit an empty array
    //         finalize(() => this.isLoading = false) // Stop loading on completion/error
    //       );
    //     } else {
    //       this.isLoading = false;
    //       return of([]); // Emit an empty array immediately for empty input
    //     }
    //   })
    // );
    // Set up the observable for the autocomplete
    this.subscribeToValueChanges();

    // Subscribe to search results updates
    const searchResultsSubscription = this.searchStateService.currentSearchResults.subscribe(results => {
      if (results && results.length > 0) {
        this.filteredResults.next(results);
      }
    });
    this.subscriptions.add(searchResultsSubscription);

    // Subscribe to search term updates
    this.subscriptions.add(
      this.searchStateService.currentSearchTerm.subscribe(term => {
        this.ngZone.run(() => {
          if (term !== this.control.value) {
            this.control.setValue(term, {emitEvent: false});
          }
          this.searchTerm = term;
          this.cdr.markForCheck(); // Ensure UI updates
        });
      })
    );


    this.searchStateService.currentSearchResults.subscribe(results => {
      // If there are previous results, set them
      if (results && results.length > 0) {
        this.filteredResults.next(results);
      }
    });

    this.searchStateService.currentSearchTerm.subscribe(term => {
      this.ngZone.run(() => {
      this.searchTerm = term;
      this.cdr.detectChanges(); // Manually trigger change detection
      });
    });

    // Initialize search bar with current search term from the service
  const currentTerm = this.searchStateService.getCurrentSearchTerm(); // Assuming you have a method to get the current term synchronously
  if (currentTerm) {
    this.control.setValue(currentTerm);
    // If there's a current term and you're not on its detail page, navigate to it
    if (this.router.url !== `/search/${currentTerm}`) {
      this.router.navigate(['/search', currentTerm]);
    }
  }

  }

  // onSearchSubmit(event: Event): void {
  //   event.preventDefault();
  //   const ticker = this.control.value;
  //   if (ticker) {
  //     this.searchStateService.updateSearchTerm(ticker.trim());
  //     this.router.navigate(['/search', ticker.trim()]);
  //     this.stockService.searchStocks(ticker.trim()).subscribe(results => {
  //       this.searchStateService.updateSearchResults(results);
  //     });
  //   }
  // }

  subscribeToValueChanges() {
    if (this.valueChangesSubscription) {
      this.valueChangesSubscription.unsubscribe();
    }
  
    this.valueChangesSubscription = this.control.valueChanges.pipe(
      debounceTime(300),
      tap(() => {
        this.isLoading = true; // Begin loading
        this.filteredResults.next([]); // Clear previous results at the start of a new search
        this.clearErrors(); // Reset error states
      }),
      switchMap(value => {
        if (!value.trim()) {
          this.isLoading = false; // Not searching, so not loading
          return of([]);
        } else {
          // Execute search and handle results/errors
          return this.refreshAutocompleteResults(value);
        }
      })
    ).subscribe(results => {
      // Now we can safely update the results
      this.filteredResults.next(results);
      this.cdr.markForCheck(); // Ensure UI is updated
    });
  
    this.subscriptions.add(this.valueChangesSubscription);
  }
  
  
  


  onSearchSubmit(event: Event): void {
    event.preventDefault();
    const ticker = this.control.value;
    if (!ticker) {
      this.noInputError = true; // Show no input error message
      // Consider adding logic to hide the error after some time if desired
    } else {
      this.searchStateService.updateSearchTerm(ticker.trim()); // Make sure to update the search term
      this.stockService.searchStocks(ticker.trim()).subscribe(results => {
        if (results.length === 0) {
          this.noDataError = true; // Show no data error message
          setTimeout(() => this.noDataError = false, 5000); // Hide the message after 5 seconds
        } else {
          this.searchStateService.updateSearchResults(results); // Update the search results
          this.router.navigate(['/search', ticker.trim()]); // Navigate to the details page
        }
      });
    }
  }

  clearErrors(): void {
    this.noInputError = false;
    this.noDataError = false;
    this.cdr.markForCheck(); // Manually trigger change detection to update the view
  }
  

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    // this.search(event.option.value);
    const ticker = event.option.value;
    if(ticker) {
      this.searchStateService.updateSearchTerm(ticker);
      this.router.navigate(['/search', ticker]);
      this.stockService.searchStocks(ticker).subscribe(results => {
        this.searchStateService.updateSearchResults(results);
      });
    }
  }

  private search(ticker: string): void {
    if (ticker) {
      this.router.navigate(['/search', ticker.trim()]);
      this.control.setValue(ticker.trim(), { emitEvent: false }); // Update the input field without emitting an event
    }
  }

  refreshAutocompleteResults(value: string): Observable<any[]> {
    return this.stockService.searchStocks(value).pipe(
      tap(results => {
        // Only set noDataError to true if there are indeed no results
        this.noDataError = results.length === 0;
      }),
      catchError(() => {
        // Handle any errors during the search
        this.noDataError = true; // Assume no data could be a reason for an error
        return of([]); // Continue with an empty array
      }),
      finalize(() => {
        // Ensure isLoading is set to false after the operation concludes
        this.isLoading = false;
        this.cdr.markForCheck(); // Trigger UI update
      })
    );
  }
  
  
  
  
  

  // Add a new method to handle the clear functionality
  clearSearch(): void {
  this.control.setValue(''); // Clear the search bar
  this.filteredResults.next([]); // Clear the autocomplete results
  this.searchStateService.updateSearchTerm(''); // Reset the search term state
  this.searchStateService.updateSearchResults([]); // Reset the search results state
  this.router.navigate(['/search']); // Navigate to the initial search page
  this.subscribeToValueChanges(); // Re-subscribe to the control value changes
  this.clearErrors(); // Make sure this is being called correctly
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }
  
}
