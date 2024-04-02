import { Component, OnInit, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WatchlistStock } from '../services/watchlist.service';
import { WatchlistService } from '../services/watchlist.service';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule, ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { SearchStateService } from '../services/search-state.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';
import { StockService } from '../services/stock.service';



@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [HttpClientModule, NgbModule, MatCardModule, MatIconModule, MatButtonModule, CommonModule, FormsModule, MatProgressSpinnerModule, FontAwesomeModule],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.css'
})


export class WatchlistComponent implements OnInit {

  watchlistEmpty: boolean = true;
  isLoading: boolean = false;
  faCaretUp = faCaretUp;
  faCaretDown = faCaretDown;



  watchlist: WatchlistStock[] = [];
  constructor(private watchlistService: WatchlistService, private router: Router, private searchStateService: SearchStateService, private StockService: StockService) { }

  ngOnInit(): void {
    this.loadWatchlist();
  }

  navigateToSearch(stockSymbol: string): void {
    this.searchStateService.updateSearchTerm(stockSymbol);
    this.router.navigate(['/search', stockSymbol]);
    this.StockService.searchStocks(stockSymbol).subscribe( results => {
      this.searchStateService.updateSearchResults(results);
    });
  }

  loadWatchlist(): void {
    this.isLoading = true; // Start loading
    this.watchlistService.getWatchlist().subscribe({
      next: (stocks) => {
        this.watchlist = stocks;
        this.watchlistEmpty = stocks.length === 0;
        this.isLoading = false; // Stop loading
      },
      error: (error) => {
        console.error('Error fetching watchlist:', error);
        this.watchlistEmpty = true;
        this.isLoading = false; // Stop loading even on error
      }
    });
  }

  addStockToWatchlist(stockSymbol: string): void {
    // Use the new getCombinedStockData method to fetch the combined stock data
    this.watchlistService.getCombinedStockData(stockSymbol).subscribe({
      next: (newStock) => {
        // Add the newStock to the watchlist
        this.watchlistService.addToWatchlist(newStock).subscribe({
          next: () => {
            // After successful addition, you might want to update the UI
            // to reflect that the stock has been added to the watchlist
            console.log(`${newStock.symbol} added to watchlist.`);
            this.loadWatchlist(); // Reload the watchlist to show the new entry
          },
          error: (error) => {
            console.error('Error adding stock to watchlist:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error fetching combined stock data:', error);
      }
    });
  }
  

  removeStockFromWatchlist(stockSymbol: string, event: MouseEvent): void {
    event.stopPropagation();
    this.watchlistService.removeFromWatchlist(stockSymbol).subscribe(() => {
      // Refresh the watchlist to remove the stock
      this.loadWatchlist();
    }, error => {
      console.error('Error removing stock from watchlist:', error);
    });
  }
  


}
