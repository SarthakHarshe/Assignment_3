import { Component, OnInit, Input } from '@angular/core';
import { PortfolioService } from '../services/portfolio.service';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PortfolioStock } from '../portfolio.model';
import { MatCardModule, MatCardHeader, MatCardContent, MatCardTitle, MatCardActions, MatCardSubtitle } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BuyStockDialogComponent } from '../buy-stock-dialog/buy-stock-dialog.component';
import { SellStockDialogComponent } from '../sell-stock-dialog/sell-stock-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { StockService } from '../services/stock.service';
import { MatProgressSpinnerModule, ProgressSpinnerMode } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCaretUp, faCaretDown } from '@fortawesome/free-solid-svg-icons';



@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [NgIf, NgFor, MatCardModule, MatCardHeader, MatCardContent, MatCardTitle, MatCardActions, BuyStockDialogComponent, SellStockDialogComponent, MatCardSubtitle, CommonModule, MatButtonModule, MatProgressSpinnerModule, FontAwesomeModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent implements OnInit{

  portfolio: PortfolioStock[] = [];
  walletBalance!: number;
  successAlert: boolean = false;
  successMessage: string = '';
  errorAlert: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  faCaretUp = faCaretUp;
  faCaretDown = faCaretDown;


  constructor(private portfolioService: PortfolioService,
    public dialog: MatDialog, private router: Router) { }

  ngOnInit(): void {
    this.loadPortfolio();
    this.loadWalletBalance();
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.successAlert = true;
    setTimeout(() => this.successAlert = false, 3000); // Auto-hide after 3 seconds
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.errorAlert = true;
    setTimeout(() => this.errorAlert = false, 3000); // Auto-hide after 3 seconds
  }


  loadPortfolio(): void {
    this.isLoading = true; // Start loading
    this.portfolioService.getPortfolio().subscribe({
      next: (data: PortfolioStock[]) => {
        this.portfolio = data;
        this.isLoading = false; // Stop loading
      },
      error: (error) => {
        console.error('Error loading portfolio:', error);
        this.isLoading = false; // Stop loading even on error
      }
    });
  }
  

  loadWalletBalance(): void {
    this.isLoading = true; // Start loading
    this.portfolioService.getWalletBalance().subscribe({
      next: (data: { walletBalance: number }) => {
        this.walletBalance = data.walletBalance;
        this.isLoading = false; // Stop loading
      },
      error: (error) => {
        console.error('Error loading wallet balance:', error);
        this.isLoading = false; // Stop loading even on error
      }
    });
  }

  // Modal dialog to buy stock
  openBuyDialog(stock: PortfolioStock): void {
    // Fetch the latest stock price before opening the buy dialog
    this.portfolioService.getStockPrice(stock.symbol).subscribe({
      next: (priceResponse) => {
        const dialogRef = this.dialog.open(BuyStockDialogComponent, {
          width: '60vh',
          position: { top: '8vh' },
          data: { stock: stock, walletBalance: this.walletBalance, price: priceResponse.price }
        });
  
        dialogRef.afterClosed().subscribe(result => {
          if (result?.success) {
            this.showSuccess(result.message);
            this.loadPortfolio(); // Refresh portfolio to reflect new stock
            this.loadWalletBalance(); // Update wallet balance
          } else if (result && !result.success) {
            this.showError(result.message);
          }
        });
      },
      error: (error) => console.error('Error fetching latest stock price:', error)
    });
  }
  
  

  // Modal dialog to sell stock
  openSellDialog(stock: PortfolioStock): void {
    // Fetch the latest stock price before opening the sell dialog
    this.portfolioService.getStockPrice(stock.symbol).subscribe({
      next: (priceResponse) => {
        const dialogRef = this.dialog.open(SellStockDialogComponent, {
          width: '60vh',
          position: { top: '8vh' },
          data: { stock: stock, walletBalance: this.walletBalance, price: priceResponse.price }
        });
  
        dialogRef.afterClosed().subscribe(result => {
          if (result?.success) {
            this.showSuccess(result.message);
            this.loadPortfolio(); // Reload the portfolio to reflect changes
            this.loadWalletBalance(); // Update wallet balance
          } else if (result && !result.success) {
            this.showError(result.message);
          }
        });
      },
      error: (error) => console.error('Error fetching latest stock price:', error)
    });
  }
  


// Methods to buy and sell stocks, these should call the respective
  // methods from your PortfolioService and handle updates accordingly
  buyStock(symbol: string, quantity: number, price: number): void {
    this.portfolioService.buyStock(symbol, quantity, price).subscribe({
      next: (response) => {
        // Handle the response here, e.g., update wallet balance, portfolio list
        this.walletBalance -= response.price * quantity;
        this.loadPortfolio(); // Reload the portfolio to reflect the new stock

        // Show a success message
        // Show a success message using the showSnackBar method
        this.showSuccess(`${quantity} shares of ${symbol} bought successfully!`);
      },
      error: (error) => {
        // Handle errors, e.g., not enough balance
        console.error('Error buying stock:', error);
        this.showError('Error buying stock. Please try again.'); // Use showSnackBar for errors
      }
    });
  }

  sellStock(symbol: string, quantity: number, price: number): void {
    this.portfolioService.sellStock(symbol, quantity, price).subscribe({
      next: (response) => {
        // Handle the response here, e.g., update wallet balance, portfolio list
        this.walletBalance += response.price * quantity;
        this.loadPortfolio(); // Reload the portfolio to reflect the sold stock

        /// Show a success message using the showSnackBar method
        this.showSuccess(`${quantity} shares of ${symbol} sold successfully!`);
      },
      error: (error) => {
        // Handle errors, e.g., not enough stocks to sell
        console.error('Error selling stock:', error);
        this.showError('Error selling stock. Please try again.'); // Use showSnackBar for errors
      }
    });
  }

   // This method is triggered when a stock card header is clicked
   navigateToDetails(symbol: string): void {
    this.router.navigateByUrl(`/details/${symbol}`); // Make sure to replace with your correct route
  }

  getStockClass(stock: PortfolioStock): { [key: string]: boolean } {
    return {
      'text-success': stock.change > 0,
      'text-danger': stock.change < 0,
      'text-black': stock.change === 0
    };
  }

  // This method returns the class based on the stock's change value
  getChangeClass(change: number): string {
    if (change > 0) {
      return 'text-success';
    } else if (change < 0) {
      return 'text-danger';
    } else {
      return 'text-black'; 
    }
  }

}
