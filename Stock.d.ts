declare interface StockPosition {
    shares: number;
    avgPx: number;
    sharesShort: number;
    avgPxShort: number;
}

declare interface Stock {
    symbol: string;
    price: number;
    maxShares: number;
    
    position: StockPosition;
    
    volatility: number;
    forecast: number;

    hftPosition?: number;
    hftTarget?: number;
}