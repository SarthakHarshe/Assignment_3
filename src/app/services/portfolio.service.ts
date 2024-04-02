import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private apiUrl = 'https://assignment3-419001.wl.r.appspot.com';


  constructor(private http: HttpClient) { }

  getPortfolio(): Observable<any> {
    return this.http.get(`${this.apiUrl}/portfolio`);
  }

   // Updated to include price in the request
   buyStock(symbol: string, quantity: number, price: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/portfolio/buy`, { symbol, quantity, price });
  }

  // Updated to include price in the request
  sellStock(symbol: string, quantity: number, price: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/portfolio/sell`, { symbol, quantity, price });
  }

  getWalletBalance(): Observable<{walletBalance: number}> {
    // Assuming the endpoint to get user data is '/userdata', and it contains a field 'walletBalance'.
    return this.http.get<{walletBalance: number}>(`${this.apiUrl}/userdata`);
  }
  
  // If you need to update wallet balance after buy/sell operations, you would use:
  updateWalletBalance(newBalance: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/userdata/update-wallet`, { newBalance });
  }

  // Add a method to get a specific stock from the portfolio
  getStockFromPortfolio(symbol: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/portfolio/stock/${symbol}`);
  }

  getStockDetails(symbol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/portfolio/stock-details/${symbol}`);
  }

  getStockPrice(ticker: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stock_quote?symbol=${ticker}`).pipe(
      catchError(error => {
        console.error(`Error fetching stock price for ${ticker}`, error);
        return of(null);
      })
    );
  }
}
