// Refactor the SearchDetailsComponent class to include the following:
// Import the necessary modules and components
// Adding angular modules
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule, NavigationEnd, Router } from '@angular/router';
import { CommonModule, formatDate } from '@angular/common';

// Adding rxjs modules
import { StockService } from '../services/stock.service';
import {
  Observable,
  combineLatest,
  tap,
  interval,
  startWith,
  switchMap,
  of,
  BehaviorSubject,
  Subscription,
  forkJoin
} from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

// Add the Highcharts module
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts/highstock';
import SMA from 'highcharts/indicators/ema';
import IndicatorsCore from 'highcharts/indicators/indicators';
import VBP from 'highcharts/indicators/volume-by-price';
import StockModule from 'highcharts/modules/stock';

// Add Angular Material modules
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

// Add ngboostrap Module
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Import the necessary components
import { SearchComponent } from '../search/search.component';
import { NewsDetailDialogComponent } from '../news-detail-dialog/news-detail-dialog.component';
import { NewsItem } from '../news-details.model';

// Import the necessary services
import { PortfolioService } from '../services/portfolio.service';
import { WatchlistService } from '../services/watchlist.service';
import { EarningsItem } from '../news-details.model';
import { BuyStockDialogComponent } from '../buy-stock-dialog/buy-stock-dialog.component';
import { SellStockDialogComponent } from '../sell-stock-dialog/sell-stock-dialog.component';
import { SearchStateService } from '../services/search-state.service';

// Import the necessary pipes
import { AggregateChangePipe } from '../aggregate-mspr.pipe';
import { AggregateMSPRPipe } from '../aggregate-mspr.pipe';
import { AggregatePositiveMSPRPipe } from '../aggregate-mspr.pipe';
import { AggregatePositiveChangePipe } from '../aggregate-mspr.pipe';
import { AggregateNegativeMSPRPipe } from '../aggregate-mspr.pipe';
import { AggregateNegativeChangePipe } from '../aggregate-mspr.pipe';

// Immport FontAwesome
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'; // Hollow star
import { faStar as fasStar } from '@fortawesome/free-solid-svg-icons'; // Solid star
import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';

// import momentjs
import moment from 'moment-timezone';
import e from 'cors';

// Intialize the required Highcharts modules
StockModule(Highcharts);
IndicatorsCore(Highcharts);
VBP(Highcharts);
SMA(Highcharts);

// Define the SearchDetailsComponent class
@Component({
  selector: 'app-search-details',
  standalone: true,
  imports: [
    CommonModule,
    SearchComponent,
    MatTabsModule,
    HighchartsChartModule,
    MatDialogModule,
    MatButtonModule,
    AggregateChangePipe,
    AggregateMSPRPipe,
    AggregatePositiveMSPRPipe,
    AggregatePositiveChangePipe,
    AggregateNegativeMSPRPipe,
    AggregateNegativeChangePipe,
    NgbModule,
    MatIconModule,
    RouterModule,
    FontAwesomeModule,
    MatProgressSpinner
  ],
  templateUrl: './search-details.component.html',
  styleUrls: ['./search-details.component.css'],
})



// Implement the ngOnInit method to fetch the stock data
export class SearchDetailsComponent implements OnInit {

  // Interface for company Earnings

  // FontAwesome icons
  farStar = farStar;
  fasStar = fasStar;
  faCaretUp = faCaretUp;
  faCaretDown = faCaretDown;

  // Maintain a subscription to unsubscribe later
  private searchTermSubscription!: Subscription;
  private routeParamsSubscription!: Subscription;

  // Define the necessary properties
  companyProfile$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  stockQuote$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  companyPeers$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  recommendationTrends$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  insiderSentiment$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  companyEarnings$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  chartOptions: BehaviorSubject<Highcharts.Options | null> = new BehaviorSubject<Highcharts.Options | null>(null);
  hourlyChartsData$:BehaviorSubject<any> = new BehaviorSubject<any>(null);
  topNews$: BehaviorSubject<NewsItem[]> = new BehaviorSubject<NewsItem[]>([]);
  public Highcharts: typeof Highcharts = Highcharts;
  public Highcharts1: typeof Highcharts = Highcharts;
  public Highcharts2: typeof Highcharts = Highcharts;
  public Highcharts3: typeof Highcharts = Highcharts;
  chartOptions1: BehaviorSubject<Highcharts.Options | null> = new BehaviorSubject<Highcharts.Options | null>(null);
  chartOptions2: BehaviorSubject<Highcharts.Options | null> = new BehaviorSubject<Highcharts.Options | null>(null);
  chartOptions3: BehaviorSubject<Highcharts.Options | null> = new BehaviorSubject<Highcharts.Options | null>(null);
  insiderSentimentData$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  stockAddedSuccess: boolean = false;
  stockAddedName: string = '';
  watchlistEmpty: boolean = true;
  walletBalance: number = 0;
  stockRemovedSuccess: boolean = false;
  stockRemovedName: string = '';
  isStockInPortfolio: boolean = false;
  isInWatchlist: boolean = false;
  buySuccess: boolean = false;
  buyErrorMessage: string = '';
  sellSuccess: boolean = false;
  sellErrorMessage: string = '';
  currentDateTime!: string;
  successMessage: string = '';
  private returningToPage = false;
  private autoUpdateSubscription: Subscription | null = null;
  isLoading: boolean = false; 
  marketStatusText: string = '';
  marketStatusClassValue: string = '';
  private marketStatusCheckSubscription: Subscription | null = null;


  constructor(
    private activatedRoute: ActivatedRoute,
    private stockService: StockService,
    private dialog: MatDialog,
    private watchlistService: WatchlistService,
    private portfolioService: PortfolioService,
    private searchStateService: SearchStateService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    // Subscribe to router events to detect when navigation has occurred
  this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe(() => {
    // Set flag based on URL, queryParams, or other criteria
    this.returningToPage = true; // Set appropriately
  });
  }

  openNewsDetail(newsItem: NewsItem): void {
    this.dialog.open(NewsDetailDialogComponent, {
      width: '500px',
      position: { top: '8vh' },
      data: {
        newsItem,
      },
    });
  }

  // Refactor the marketStatus method to calculate the market status
  marketStatus(timestamp: number): string {
    const lastUpdateMoment = moment(timestamp * 1000).tz('America/Los_Angeles');
    const now = moment().tz('America/Los_Angeles');
    const marketOpen = now
      .clone()
      .set({ hour: 6, minute: 30, second: 0, millisecond: 0 });
    const marketClose = now
      .clone()
      .set({ hour: 13, minute: 0, second: 0, millisecond: 0 });

    // Check if the current time is more than 5 minutes after the last update
    const isMarketClosed = now.diff(lastUpdateMoment, 'minutes') > 5;

    // Check if current time is within market hours and market is not considered closed
    if (now.isBetween(marketOpen, marketClose) && !isMarketClosed) {
      return 'Market is Open';
    } else {
      return `Market Closed on ${lastUpdateMoment.format(
        'YYYY-MM-DD HH:mm:ss'
      )}`;
    }
  }

  // Refactor the marketStatusClass method to calculate the market status class
  marketStatusClass(timestamp: number): string {
    const lastUpdateMoment = moment(timestamp * 1000).tz('America/Los_Angeles');
    const now = moment().tz('America/Los_Angeles');
    const marketOpen = now
      .clone()
      .set({ hour: 6, minute: 30, second: 0, millisecond: 0 });
    const marketClose = now
      .clone()
      .set({ hour: 13, minute: 0, second: 0, millisecond: 0 });

    // Check if the current time is more than 5 minutes after the last update
    const isMarketClosed = now.diff(lastUpdateMoment, 'minutes') > 5;

    if (now.isBetween(marketOpen, marketClose) && !isMarketClosed) {
      return 'text-success'; // Market is open
    } else {
      return 'text-danger'; // Market is closed
    }
  }

  private determineSeriesColor(): string {
    const changeValue = this.stockQuote$.getValue()?.d; // Assuming stockQuote$ holds the latest stock quote data
    return changeValue >= 0 ? '#008000' : '#FF0000'; // Green for non-negative, red for negative
  }
  

  private processChartData(chartsData: any): Highcharts.Options | null {
    // Convert timestamps to milliseconds if necessary
    const seriesData = chartsData.results.map((point: any) => {
      return [point.t, point.c];
    });
    
    const seriesColor = this.determineSeriesColor();

    const newOptions: Highcharts.Options = {
      chart: {
        backgroundColor: '#f2eded',
        type: 'line',
        style: {
          fontFamily: 'Arial',
        },
      },
      title: {
        text: `${chartsData.ticker} Hourly Price Variation`,
        style: {
          color: 'black',
          fontSize: '16px',
        },
      },
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          hour: '%H:%M', // Hourly format
        },
        labels: {
          format: '{value:%H:%M}', // Label format displaying hours and minutes
        },
        tickInterval: 10800 * 1000, // Tick every hour
        crosshair: {
          width: 1,
          color: 'gray',
          dashStyle: 'ShortDot',
        },
        lineColor: '#CCCCCC', // Soften the axis line
        tickColor: '#CCCCCC', // Soften the tick color
      },
      yAxis: {
        title: {
          text: '', // Removes the "Value" text (Step 1)
        },
        gridLineColor: '#F0F0F0', // Horizontal grid lines color
        opposite: true,
        labels: {
          format: '{value}', // Display the value without decimals
          style: {
            color: 'black',
          },
        },
      },
      series: [
        {
          name: 'Price',
          data: seriesData,
          type: 'line',
          color: seriesColor,
          marker: {
            enabled: false, // Disable the markers for a cleaner line
          },
        },
      ],
      credits: {
        // Step 4
        enabled: true,
        href: 'http://www.highcharts.com',
        text: 'highcharts.com',
      },
      tooltip: {
        shared: true,
        xDateFormat: '%H:%M', // Tooltip date format
      },
      plotOptions: {
        series: {
          marker: {
            enabled: true, // Enable markers for each data point
            radius: 3, // Radius of the markers
          },
        },
      },
      // additional chart options...
    };

    return newOptions; // Return the processed chart options
  }

  private processChartData1(chartsData: any): Highcharts.Options | null {
    console.log(chartsData);
    const ohlcData = chartsData.results.map((point: any) => {
      return [point.t, point.o, point.h, point.l, point.c];
    });

    const volumeData = chartsData.results.map((point: any) => {
      return [point.t, point.v];
    });

    const newOptions: Highcharts.Options = {
      legend: {
        enabled: false,
      },

      rangeSelector: {
        enabled: true,
        inputEnabled: true,
        allButtonsEnabled: true,
        selected: 2, 
        buttons: [
          {
            type: 'month',
            count: 1,
            text: '1m',
            title: '1 Month',
          },
          {
            type: 'month',
            count: 3,
            text: '3m',
            title: '3 Months',
          },
          {
            type: 'month',
            count: 6,
            text: '6m',
            title: '6 Months',
          },
          {
            type: 'ytd',
            text: 'YTD',
            title: 'Year to Date',
          },
          {
            type: 'year',
            count: 1,
            text: '1y',
            title: '1 Year',
          },
          {
            type: 'all',
            text: 'All',
            title: 'All Data',
          },
        ],
      },

      title: {
        text: `${chartsData.ticker} Historical`,
      },

      subtitle: {
        text: 'With SMA and Volume by Price technical indicators',
      },

      navigator: {
        enabled: true,
      },

      yAxis: [
        {
          opposite: true,
          startOnTick: false,
          endOnTick: false,
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'OHLC',
          },
          height: '60%',
          lineWidth: 2,
          resize: {
            enabled: true,
          },
        },
        {
          opposite: true,
          labels: {
            align: 'right',
            x: -3,
          },
          title: {
            text: 'Volume',
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2,
        },
      ],

      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          hour: '%M:%Y',
        },
      },

      tooltip: {
        split: true,
      },

      plotOptions: {
        series: {
          dataGrouping: {
            units: [
              [
                'week', // unit name
                [2], // allowed multiples
              ],
              ['month', [1, 2, 3, 4, 6]],
            ],
          },
        },
      },

      series: [
        {
          type: 'candlestick',
          name: chartsData.ticker,
          id: chartsData.ticker,
          zIndex: 2,
          data: ohlcData,
        },
        {
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: volumeData,
          yAxis: 1,
        },
        {
          type: 'vbp',
          linkedTo: chartsData.ticker,
          params: {
            volumeSeriesID: 'volume',
          },
          dataLabels: {
            enabled: false,
          },
          zoneLines: {
            enabled: false,
          },
        },
        {
          type: 'sma',
          linkedTo: chartsData.ticker,
          zIndex: 1,
          marker: {
            enabled: false,
          },
        },
      ],

      credits: {
        enabled: true,
        href: 'https://polygon.io/',
        text: 'Source: Polygon.io',
      },
    };
    return newOptions;
  }


  
  private processChartData2(recommendationTrends: any): Highcharts.Options | null {
    // Recommendation Trends chart options
    const newOptions: Highcharts.Options = {
      chart: {
        type: 'column',
        backgroundColor: '#f2eded',
      },
      title: {
        text: 'Recommendation Trends',
      },
      xAxis: {
        categories: recommendationTrends?.map((item: any) => item.period) ?? [],
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Number of Recommendations',
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: Highcharts.defaultOptions.title?.style?.color ?? 'gray',
          },
        },
      },
      legend: {
        enabled: true,
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
          },
        },
      },
      series: [
        {
          name: 'Strong Buy',
          type: 'column',
          data: recommendationTrends.map((item: any) => item.strongBuy),
        },
        {
          name: 'Buy',
          type: 'column',
          data: recommendationTrends.map((item: any) => item.buy),
        },
        {
          name: 'Hold',
          type: 'column',
          data: recommendationTrends.map((item: any) => item.hold),
        },
        {
          name: 'Sell',
          type: 'column',
          data: recommendationTrends.map((item: any) => item.sell),
        },
        {
          name: 'Strong Sell',
          type: 'column',
          data: recommendationTrends.map((item: any) => item.strongSell),
        },
      ],
    };
    return newOptions;
  }

  private processChartData3(companyEarnings: any[]): Highcharts.Options | null {
    
    const YaxisactualData = companyEarnings.map((item: any) => {
      return item.actual;
    });

    const YaxisestimateData = companyEarnings.map((item: any) => {
      return item.estimate;
    });

    const xaxisdetail = companyEarnings.map((item: any) => {
      const date = item.period;
      return `<br/>${date}<br/>Surprise: ${item.surprise}`
    });

    // Historical EPS Surprises chart options
    const newOptions: Highcharts.Options = {
      chart: {
        type: 'spline',
        backgroundColor: '#f2eded',
      },
      title: {
        text: 'Historical EPS Surprises',
      },
      xAxis: {
        categories: xaxisdetail,
        labels: {
          useHTML: true,
          style: {
            fontSize: '12px',
            textAlign: 'center',
          }
        },
      },
      yAxis: {
        title: {
          text: 'Quarterly EPS',
        },
      },
      tooltip: {
        crosshairs: true,
        shared: true,
      } as Highcharts.TooltipOptions,

      plotOptions: {
        spline: {
          marker: {
            enabled: true,
          },
        },
      },
      series: [
        {
          name: 'Actual',
          type: 'spline',
          marker: {
            symbol: 'square',
          },
          data: YaxisactualData,
        },
        {
          name: 'Estimate',
          type: 'spline',
          marker: {
            symbol: 'diamond',
          },
          data: YaxisestimateData,
        },
      ],
    };
    return newOptions;
  }

  // Call this method to check if the current stock is in the watchlist
  checkIfStockInWatchlist(stockSymbol: string): void {
    this.watchlistService.getWatchlist().subscribe({
      next: (stocks) => {
        this.isInWatchlist = stocks.some(
          (stock) => stock.symbol === stockSymbol
        );
      },
      error: (error) => console.error('Error fetching watchlist:', error),
    });
  }

  toggleWatchlist(stockSymbol: string): void {
    // If the stock is already in the watchlist, remove it
    if (this.isInWatchlist) {
      this.watchlistService.removeFromWatchlist(stockSymbol).subscribe({
        next: () => {
          // Successfully removed from watchlist
          this.isInWatchlist = false; // Update local state
          this.stockRemovedSuccess = true; // Update to true when stock is removed
          this.stockRemovedName = stockSymbol; // Update with the removed stock's symbol or name
          this.stockAddedSuccess = false; // Assuming you use this to show some feedback
          setTimeout(() => {
            this.stockRemovedSuccess = false; // Optionally reset the flag after a few seconds
          }, 3000);
          // Optionally, you can refresh your watchlist or show some user feedback here
        },
        error: (error) =>
          console.error('Error removing stock from watchlist:', error),
      });
    } else {
      // If the stock is not in the watchlist, add it
      this.watchlistService.getCombinedStockData(stockSymbol).subscribe({
        next: (watchlistStock) => {
          this.watchlistService.addToWatchlist(watchlistStock).subscribe({
            next: () => {
              // Successfully added to watchlist
              this.isInWatchlist = true; // Update local state
              this.stockAddedSuccess = true; // Assuming you use this to show some feedback
              this.stockAddedName = watchlistStock.symbol; // For feedback purposes
              setTimeout(() => (this.stockAddedSuccess = false), 3000); // Reset feedback flag after some time
              // Optionally, you can refresh your watchlist or show some user feedback here
            },
            error: (error) =>
              console.error('Error adding stock to watchlist:', error),
          });
        },
        error: (error) =>
          console.error('Error fetching combined stock data:', error),
      });
    }
  }

  //Check if stock is in portfolio

  // Method to check if a stock is in the portfolio
  checkIfStockInPortfolio(stockSymbol: string): void {
    this.portfolioService.getStockDetails(stockSymbol).subscribe({
      next: (response) => {
        // Assuming the backend returns an object with availableQuantity
        // Adjust the condition based on the actual API response structure
        this.isStockInPortfolio = response.availableQuantity > 0;
      },
      error: (error) => {
        this.isStockInPortfolio = false;
      },
    });
  }


  openBuyDialog(stockSymbol: string): void {
    const latestStockQuote = this.stockQuote$.value;
    if (latestStockQuote) {
      const currentPrice = latestStockQuote.c; // Adjust based on your data structure
    
      // Fetch the latest wallet balance before opening the dialog
      this.portfolioService.getWalletBalance().subscribe({
        next: (walletResponse) => {
          const dialogRef = this.dialog.open(BuyStockDialogComponent, {
            width: '500px',
            position: { top: '8vh' },
            data: {
              stock: { symbol: stockSymbol, currentPrice },
              walletBalance: walletResponse.walletBalance,
            },
          });
    
          this.handleDialogClose(dialogRef, stockSymbol);
        },
        error: (error) => console.error('Error fetching wallet balance:', error),
      });
    } else {
      console.error('Error: Latest stock price is not available.');
    }
  }
  


  openSellDialog(stockSymbol: string): void {
    const latestStockQuote = this.stockQuote$.value;
    if (latestStockQuote) {
      const currentPrice = latestStockQuote.c; // Adjust based on your data structure
    
      // Optionally, fetch additional details if necessary, e.g., the available quantity
      this.portfolioService.getStockDetails(stockSymbol).subscribe({
        next: (stockDetails) => {
          const dialogRef = this.dialog.open(SellStockDialogComponent, {
            width: '500px',
            position: { top: '8vh' },
            data: {
              stock: {
                symbol: stockSymbol,
                currentPrice,
                availableQuantity: stockDetails.availableQuantity,
              },
              walletBalance: this.walletBalance, // Assuming this is up-to-date
            },
          });
    
          this.handleDialogClose(dialogRef, stockSymbol);
        },
        error: (error) => console.error('Error fetching stock details:', error),
      });
    } else {
      console.error('Error: Latest stock price is not available.');
    }
  }
  
  

  // Method to handle dialog close
  private handleDialogClose(
    dialogRef: MatDialogRef<any>,
    stockSymbol: string
  ): void {
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.success) {
        // Check if it's a buy or sell operation based on the message
        if (result.message.includes('bought')) {
          this.buySuccess = true;
          this.buyErrorMessage = ''; // Clear any previous error messages
          this.successMessage = result.message; // Use this for displaying success message
        } else if (result.message.includes('sold')) {
          this.sellSuccess = true;
          this.sellErrorMessage = ''; // Clear any previous error messages
          this.successMessage = result.message; // Use this for displaying success message
        }
        setTimeout(() => {
          this.buySuccess = false;
          this.sellSuccess = false;
        }, 3000); // Optionally auto-hide the alert after 3 seconds
      } else if (result && !result.success) {
        this.buyErrorMessage = result.message; // Set this if there was an error in buying
        this.sellErrorMessage = result.message; // Set this if there was an error in selling
        setTimeout(() => {
          this.buyErrorMessage = '';
          this.sellErrorMessage = '';
        }, 3000); // Optionally auto-hide the alert after 3 seconds
      }

      this.loadWalletBalance(); // Refresh the wallet balance regardless of buy/sell success
      this.checkIfStockInPortfolio(stockSymbol); // Refresh stock status in the portfolio
    });
  }

  // Fetch and update wallet balance in the component
  private loadWalletBalance(): void {
    this.portfolioService.getWalletBalance().subscribe({
      next: (response) => {
        this.walletBalance = response.walletBalance;
      },
      error: (error) => console.error('Error fetching wallet balance:', error),
    });
  }

  private fetchStockData(ticker: string): void {
    this.returningToPage = false;
    this.isLoading = true;

    forkJoin({
      companyProfile: this.stockService.getCompanyProfile(ticker),
      stockQuote: this.stockService.getStockPrice(ticker),
      companyPeers: this.stockService.getCompanyPeers(ticker),
      recommendationTrends: this.stockService.getRecommendationTrends(ticker),
      insiderSentiment: this.stockService.getInsiderSentiment(ticker),
      companyEarnings: this.stockService.getCompanyEarnings(ticker),
      topNews: this.stockService.getTopNews(ticker),
      hourlyChartsData: this.stockService.getHourlyChartsData(ticker),
      chartsData: this.stockService.getChartsData(ticker),
    }).subscribe({
      next: (data) => {
      const chartOptions = this.processChartData(data.hourlyChartsData);
      const chartOptions1 = this.processChartData1(data.chartsData);
      const chartOptions2 = this.processChartData2(data.recommendationTrends);
      const chartOptions3 = this.processChartData3(data.companyEarnings);
      
      // Now set the processed chart options to their respective BehaviorSubjects
      this.chartOptions.next(chartOptions);
      this.chartOptions1.next(chartOptions1);
      this.chartOptions2.next(chartOptions2);
      this.chartOptions3.next(chartOptions3);
        // Cache all data together
      this.searchStateService.cacheData(ticker, data);
      // Use cached data
      this.useCachedData(data);
      this.isLoading = false;
      }, error: (error) => {
        console.error(`Failed to fetch data for ${ticker}`, error);
        this.isLoading = false;
      }
    });
    
  }

  private setupAutoUpdate(ticker: string): void {
    // Auto-update stock data and current date/time every 15 seconds

    // Unsubscribe from the previous subscription if it exists
    if (this.autoUpdateSubscription) {
      this.autoUpdateSubscription.unsubscribe();
      this.autoUpdateSubscription = null;
    }
  
      // Then, set up a new subscription
    this.autoUpdateSubscription = interval(15000).pipe(
    startWith(0),
    switchMap(() => this.stockService.getStockPrice(ticker))
    ).subscribe(data => {
    this.stockQuote$.next(data); // Update the stock quote
    this.currentDateTime = moment().tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm:ss');
  });
  }

  private handleNewSearchTerm(term: string): void {
    // this.fetchStockData(term);
    this.setupAutoUpdate(term);
    this.checkIfStockInWatchlist(term);
    this.checkIfStockInPortfolio(term);
    this.cdr.detectChanges(); // You might not need this if using async pipe in templates
  }

private fetchWalletBalance(): void {
  this.portfolioService.getWalletBalance().subscribe({
    next: (data) => {
      this.walletBalance = data.walletBalance;
    },
    error: (error) =>
      console.error('Error fetching wallet balance:', error),
  });
}

private useCachedData(data: any) {
  // Use the cached data to update your BehaviorSubjects
  this.companyProfile$.next(data.companyProfile);
  this.stockQuote$.next(data.stockQuote);
  this.companyPeers$.next(data.companyPeers);
  this.recommendationTrends$.next(data.recommendationTrends);
  this.insiderSentiment$.next(data.insiderSentiment);
  this.companyEarnings$.next(data.companyEarnings);
  const chartOptions = this.processChartData(data.hourlyChartsData);
  this.chartOptions.next(chartOptions);
  const chartOptions1 = this.processChartData1(data.chartsData);
  this.chartOptions1.next(chartOptions1);
  const chartOptions2 = this.processChartData2(data.recommendationTrends);
  this.chartOptions2.next(chartOptions2);
  const chartOptions3 = this.processChartData3(data.companyEarnings);
  this.chartOptions3.next(chartOptions3);
  this.topNews$.next(data.topNews);
}

onPeerSelected(peerTicker: string): void {
  // Update the search term in the SearchStateService
  this.searchStateService.updateSearchTerm(peerTicker);
  
  // Navigate to the search details page for the selected peer
  this.router.navigate(['/search', peerTicker]);

  // Check if there's cached data for the peerTicker
  const cachedData = this.searchStateService.getCachedData(peerTicker);
  if (cachedData) {
    // Use the cached data
    this.useCachedData(cachedData);
  } else {
    // Fetch new data for the peerTicker
    this.fetchStockData(peerTicker);
  }
}

private handleSearchTermChange(ticker: string): void {
  // This method handles fetching and using data for a given ticker symbol
  const cachedData = this.searchStateService.getCachedData(ticker);
  if (cachedData) {
    this.useCachedData(cachedData);
  } else {
    this.fetchStockData(ticker);
  }
  this.setupAutoUpdate(ticker);
  this.checkIfStockInWatchlist(ticker);
  this.checkIfStockInPortfolio(ticker);
}


  ngOnInit(): void {

   // Existing subscription to search term changes from SearchStateService
  this.searchTermSubscription = this.searchStateService.currentSearchTerm.pipe(distinctUntilChanged()).subscribe(term => {
    if (term) {
      this.handleSearchTermChange(term);
    }
  });

  // Additionally, check for a ticker symbol in the route parameters
  this.routeParamsSubscription = this.activatedRoute.params.subscribe(params => {
    const ticker = params['ticker']; // Assuming the route parameter is named 'ticker'
    if (ticker) {
      this.handleSearchTermChange(ticker);
    } else {
      // Here you could handle scenarios where no ticker is provided
    }
  });

}

  //   // Subscribe to search term changes from SearchStateService
  //   this.searchTermSubscription = this.searchStateService.currentSearchTerm.pipe(distinctUntilChanged()).subscribe(term => {
  //   if (term) {
  //     // Check if we should use cached data
  //     const cachedData = this.searchStateService.getCachedData(term);
  //     if (cachedData) {
  //       this.useCachedData(cachedData);
  //     } else {
  //       this.fetchStockData(term);
  //     }
  //     this.handleNewSearchTerm(term);
  //     this.fetchWalletBalance();
  //   }
    
  // });



  ngOnDestroy(): void {
     // Clean up subscriptions to avoid memory leaks
  if (this.searchTermSubscription) {
    this.searchTermSubscription.unsubscribe();
  }

  // Since autoUpdateSubscription might be null, check if it's truthy before calling unsubscribe
  if (this.autoUpdateSubscription) {
    this.autoUpdateSubscription.unsubscribe();
  }
  }

}
