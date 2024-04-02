import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { PortfolioService } from '../services/portfolio.service';


// Add a new interface for the data object structure
interface DialogData {
  stock: {
    symbol: string;
    currentPrice: number;
    availableQuantity?: number; // Optional property for the available quantity
  };
  walletBalance: number;
}

@Component({
  selector: 'app-sell-stock-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sell-stock-dialog.component.html',
  styleUrl: './sell-stock-dialog.component.css'
})

export class SellStockDialogComponent implements OnInit{

  sellForm!: FormGroup;
  maxQuantity: number = 0; // This should be set to the maximum quantity of stocks available to sell

  constructor(
    private dialogRef: MatDialogRef<SellStockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private portfolioService: PortfolioService,
  ) {
     // Here, we're using a nullish coalescing operator (??) to provide a default value
    // in case `availableQuantity` is not provided in the data.
    this.maxQuantity = data.stock.availableQuantity ?? 0;
  }
  

  ngOnInit(): void {
    this.sellForm = this.fb.group({
      quantity: ['', {
      validators: [Validators.required, Validators.min(1), Validators.max(this.maxQuantity)],
      updateOn: 'change'
    }]
  
    });


   // Check if availableQuantity is provided, if not, fetch from the backend
   if (this.data.stock.availableQuantity !== undefined) {
    this.maxQuantity = this.data.stock.availableQuantity;
    this.initializeForm();
  } else {
    // Fetch from the backend
    this.portfolioService.getStockDetails(this.data.stock.symbol).subscribe({
      next: (stockDetails) => {
        this.maxQuantity = stockDetails.availableQuantity;
        this.initializeForm();
      },
      error: (error) => {
        console.error('Error fetching stock details:', error);
        // Handle error appropriately, maybe close dialog or show a message
      }
    });
  }
}

initializeForm(): void {
  // Add the maxQuantityValidator to the form control
  this.sellForm.get('quantity')?.addValidators(this.maxQuantityValidator());
  this.sellForm.get('quantity')?.updateValueAndValidity();
}


  maxQuantityValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const forbidden = control.value > this.maxQuantity;
      return forbidden ? { max: { value: control.value } } : null;
    };
  }

  sellStock() {
    if (this.sellForm.valid) {
      const quantity = this.sellForm.get('quantity')?.value;
      const { symbol, currentPrice } = this.data.stock;
  
      // Here you're passing the current price directly from the dialog's data, which is expected by your backend
      this.portfolioService.sellStock(symbol, quantity, currentPrice).subscribe({
        next: (response) => {
          // Assuming the sell operation was successful
          this.dialogRef.close({ success: true, message: `${quantity} shares of ${symbol} sold successfully at a price of ${currentPrice} each.`});
        },
        error: (error) => {
          console.error('Error selling stock:', error);
          this.dialogRef.close({ success: false, message: 'Failed to sell stock. Please try again.' });
        }
      });
    }
  }
  
  


  closeDialog() {
    this.dialogRef.close();
  }


}
