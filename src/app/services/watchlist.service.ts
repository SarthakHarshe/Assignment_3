import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { forkJoin, throwError } from 'rxjs';
import { map,catchError } from 'rxjs/operators';

export interface WatchlistStock {
  symbol: string;
  name: string;
  exchange: string;
  logo: string;
  currentPrice: number;
  change: number;
  changePercentage: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})

export class WatchlistService {
  private watchlistUrl = 'https://assignment3-419001.wl.r.appspot.com/watchlist'; // Adjust if needed
  private baseUrl = 'https://assignment3-419001.wl.r.appspot.com'; // Adjust if needed


  constructor(private http: HttpClient) { }

    // Get all stocks in the watchlist
    getWatchlist(): Observable<WatchlistStock[]> {
      return this.http.get<WatchlistStock[]>(this.watchlistUrl);
    }
  
    // Add a stock to the watchlist
    // Add a stock to the watchlist
addToWatchlist(stock: WatchlistStock): Observable<any> {
  return this.http.post(this.watchlistUrl, stock).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if the error status is 409 Conflict to handle duplicate entries
      if (error.status === 409) {
        // Convert the error into a user-friendly message or another Observable
        return throwError(() => new Error('Stock already in watchlist'));
      }
      // Re-throw other errors to be handled elsewhere
      return throwError(() => error);
    })
  );
}

  
    // Remove a stock from the watchlist
    removeFromWatchlist(symbol: string): Observable<any> {
      return this.http.delete(`${this.watchlistUrl}/${symbol}`);
    }

    // Inside watchlist.service.ts

// ...

// Method to get combined stock profile and quote data
getCombinedStockData(symbol: string): Observable<WatchlistStock> {
  // Create two observables for profile and quote
  const profile$ = this.getStockProfile(symbol);
  const quote$ = this.getStockQuote(symbol);

  // Use forkJoin to execute both requests in parallel and merge their results
  return forkJoin({ profile: profile$, quote: quote$ }).pipe(
    map(results => {
      // Assuming profile and quote responses are structured as expected
      return {
        symbol: symbol,
        name: results.profile.name,
        exchange: results.profile.exchange,
        logo: results.profile.logo,
        currentPrice: results.quote.c,
        change: results.quote.d,
        changePercentage: results.quote.dp,
        timestamp: Date.now() // You might want to adjust this based on your actual data
      };
    })
  );
}

// Separate methods to fetch profile and quote data
getStockProfile(symbol: string): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/company_profile?symbol=${symbol}`);
}

getStockQuote(symbol: string): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/stock_quote?symbol=${symbol}`);
}

// ...

  
  
}
