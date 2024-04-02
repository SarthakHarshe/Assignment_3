import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PortfolioService } from '../services/portfolio.service';

interface DialogData {
  stock: {
    symbol: string;
    currentPrice: number;
  };
  walletBalance: number;
}

@Component({
  selector: 'app-buy-stock-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './buy-stock-dialog.component.html',
  styleUrl: './buy-stock-dialog.component.css'
})

export class BuyStockDialogComponent {

  buyForm: FormGroup;
  transactionCost: number = 0;
  errorMessage: string = '';

  constructor(
    private dialogRef: MatDialogRef<BuyStockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private portfolioService: PortfolioService
  ) {
    this.buyForm = this.fb.group({
      quantity: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.buyForm.get('quantity')?.valueChanges.subscribe((quantity) => {
      this.transactionCost = quantity * this.data.stock.currentPrice;
    });
  }

  buyStock() {
    if (this.buyForm.valid && !this.notEnoughFunds) {
      const quantity = this.buyForm.get('quantity')?.value;
      const price = this.data.stock.currentPrice; 
  
      this.portfolioService.buyStock(this.data.stock.symbol, quantity, price).subscribe({
        next: (response) => {
          this.dialogRef.close({success: true, message: `${quantity} shares of ${this.data.stock.symbol} bought successfully!`});
        },
        error: (error) => {
          console.error('Error buying stock:', error);
          this.dialogRef.close({success: false, message: 'Failed to buy stock. Please try again.'});
        }
      });
    }
  }
  
  

  get notEnoughFunds(): boolean {
    return this.transactionCost > this.data.walletBalance;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
