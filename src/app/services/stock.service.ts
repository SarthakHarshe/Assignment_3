import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { map,catchError } from 'rxjs/operators';
import { NewsItem } from '../news-details.model';

@Injectable({
  providedIn: 'root'
})

export class StockService {

  constructor(private http: HttpClient) { }

  private baseUrl = 'https://assignment3-419001.wl.r.appspot.com';


  // searchStocks(query: string): Observable<any[]> {
  //   if (!query) {
  //     return new Observable((observer) => {
  //       observer.next([]);
  //     });
  //   }

  // const encodedQuery = encodeURIComponent(query);
  //   return this.http.get<any[]>(`${this.baseUrl}/autocomplete?q=${encodedQuery}`);
  // }

  searchStocks(query: string): Observable<any[]> {
    if (!query) {
      return of([]); // Immediately return an empty array if the query is empty
    }
    const encodedQuery = encodeURIComponent(query);
    return this.http.get<any[]>(`${this.baseUrl}/autocomplete?q=${encodedQuery}`).pipe(
      tap(results => {
        if (results.length === 0) {
          throw new Error('No results found'); // Throw an error if no results
        }
      }),
      catchError(error => {
        console.error(`Search error for query "${query}":`, error);
        return of([]); // Return an empty array to handle errors gracefully
      })
    );
  }

  getCompanyProfile(ticker: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/company_profile?symbol=${ticker}`).pipe(
      catchError(error => {
        console.error(`Error fetching company profile for ${ticker}`, error);
        return of(null); // Return null or an empty object to indicate an error
      })
    );
  }

  getStockPrice(ticker: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stock_quote?symbol=${ticker}`).pipe(
      catchError(error => {
        console.error(`Error fetching stock price for ${ticker}`, error);
        return of(null);
      })
    );
  }

  getCompanyPeers(symbol: string): Observable<string[]> {   
    return this.http.get<string[]>(`${this.baseUrl}/company_peers?symbol=${symbol}`).pipe(
      map(peers => peers.filter(peer => !peer.includes('.'))),
      catchError(error => {
        console.error(`Error fetching company peers for ${symbol}`, error);
        return of([]);
      })
    );
  }

  getChartsData(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/charts_data?symbol=${symbol}`).pipe(
      catchError(error => {
        console.error(`Error fetching charts data for ${symbol}`, error);
        return of(null);
      })
    );
  }

  getHourlyChartsData(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/hourly_charts_data?symbol=${symbol}`).pipe(
        catchError(error => {
            console.error(`Error fetching hourly charts data for ${symbol}`, error);
            return of(null);
        })
    );
}



  getTopNews(symbol: string): Observable<any> {
    return this.http.get<NewsItem[]>(`${this.baseUrl}/latest_news?symbol=${symbol}`)
    .pipe(
      map(newsItems => newsItems.filter(item => item.image && item.headline).slice(0, 20)),
      catchError(error => {
        console.error(`Error fetching top news for ${symbol}`, error);
        return of(null);
      })
    );
  }

  getRecommendationTrends(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/recommendation_trends?symbol=${symbol}`).pipe(
      catchError(error => {
        console.error(`Error fetching recommendation trends for ${symbol}`, error);
        return of(null);
      })
    );
  }

  getInsiderSentiment(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/insider_sentiment?symbol=${symbol}`).pipe(
      catchError(error => {
        console.error(`Error fetching insider sentiment for ${symbol}`, error);
        return of(null);
      })
    );
  }

  getCompanyEarnings(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/company_earnings?symbol=${symbol}`).pipe(
      catchError(error => {
        console.error(`Error fetching company earnings for ${symbol}`, error);
        return of(null);
      })
    );
  }

}
