export interface PortfolioStock {
    symbol: string;
    name: string; // Make sure this is included if it's returned from the backend
    quantity: number;
    averageCost: number;
    totalCost: number;
    currentPrice: number; // Current price of the stock
    change: number; // The change in value based on current price
    marketValue: number; // Market value based on current price
  }
  

export class Portfolio {
}
