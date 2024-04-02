export interface NewsItem {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
  }

export interface StockPrice {
    c: number; // current price
    d: number; // change in price
    dp: number; // percentage change in price
    h: number; // high price of the day
    l: number; // low price of the day
    o: number; // open price of the day
    pc: number; // previous close price
    t: number; // timestamp of last stock data
}

export interface EarningsItem {
  period: string;
  actual: number;
  estimate: number;
  surprise: number;
}

export class NewsDetails {
}
