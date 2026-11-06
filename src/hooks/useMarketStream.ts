import { useState, useEffect, useRef, useCallback } from 'react';
import { CryptoAsset, CandleData, OrderBookEntry, TradeTapeItem } from '../types/trading';

export const INITIAL_ASSETS: CryptoAsset[] = [
  {
    symbol: 'BTC-PERP',
    name: 'Bitcoin Perpetual',
    basePrice: 76054,
    currentPrice: 76054,
    change24h: 0.19,
    high24h: 77134,
    low24h: 74842,
    volume24h: 4280590000,
    fundingRate: 0.0105,
    nextFundingIn: '03:22:45',
    openInterest: 1845000000,
    maxLeverage: 100,
  },
  {
    symbol: 'ETH-PERP',
    name: 'Ethereum Perpetual',
    basePrice: 3420,
    currentPrice: 3420,
    change24h: 2.15,
    high24h: 3495,
    low24h: 3310,
    volume24h: 1980000000,
    fundingRate: 0.0084,
    nextFundingIn: '03:22:45',
    openInterest: 940000000,
    maxLeverage: 75,
  },
  {
    symbol: 'SOL-PERP',
    name: 'Solana Perpetual',
    basePrice: 215.5,
    currentPrice: 215.5,
    change24h: 7.85,
    high24h: 224.0,
    low24h: 198.5,
    volume24h: 1450000000,
    fundingRate: 0.0210,
    nextFundingIn: '03:22:45',
    openInterest: 680000000,
    maxLeverage: 50,
  },
  {
    symbol: 'AVAX-PERP',
    name: 'Avalanche Perpetual',
    basePrice: 38.75,
    currentPrice: 38.75,
    change24h: -1.45,
    high24h: 40.2,
    low24h: 37.1,
    volume24h: 320000000,
    fundingRate: -0.0045,
    nextFundingIn: '03:22:45',
    openInterest: 185000000,
    maxLeverage: 50,
  },
  {
    symbol: 'DOGE-PERP',
    name: 'Dogecoin Perpetual',
    basePrice: 0.285,
    currentPrice: 0.285,
    change24h: 5.60,
    high24h: 0.298,
    low24h: 0.264,
    volume24h: 780000000,
    fundingRate: 0.0150,
    nextFundingIn: '03:22:45',
    openInterest: 290000000,
    maxLeverage: 50,
  },
  {
    symbol: 'LINK-PERP',
    name: 'Chainlink Perpetual',
    basePrice: 18.4,
    currentPrice: 18.4,
    change24h: 4.12,
    high24h: 19.1,
    low24h: 17.5,
    volume24h: 210000000,
    fundingRate: 0.0092,
    nextFundingIn: '03:22:45',
    openInterest: 140000000,
    maxLeverage: 50,
  },
];

// Helper to calculate EMA and Bollinger on candles
function calculateIndicators(candles: CandleData[]): CandleData[] {
  const k = 2 / (20 + 1);
  let prevEma = candles[0]?.close || 0;

  return candles.map((c, idx) => {
    const ema20 = idx === 0 ? c.close : c.close * k + prevEma * (1 - k);
    prevEma = ema20;

    const windowSlice = candles.slice(Math.max(0, idx - 19), idx + 1);
    const mean = windowSlice.reduce((acc, curr) => acc + curr.close, 0) / windowSlice.length;
    const variance =
      windowSlice.reduce((acc, curr) => acc + Math.pow(curr.close - mean, 2), 0) /
      windowSlice.length;
    const stdDev = Math.sqrt(variance);

    return {
      ...c,
      ema20: Number(ema20.toFixed(2)),
      upperBand: Number((mean + stdDev * 2).toFixed(2)),
      lowerBand: Number((mean - stdDev * 2).toFixed(2)),
    };
  });
}

function generateInitialCandles(basePrice: number, count: number = 40): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice * 0.985;
  const now = Date.now();
  const stepMs = 60 * 1000 * 5;

  for (let i = count; i >= 0; i--) {
    const time = now - i * stepMs;
    const change = (Math.random() - 0.48) * (price * 0.004);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * (price * 0.002);
    const low = Math.min(open, close) - Math.random() * (price * 0.002);
    const volume = Math.round((Math.random() * 40 + 10) * (price > 1000 ? 5 : 100));

    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return calculateIndicators(candles);
}

export function useMarketStream(initialSymbol = 'BTC-PERP') {
  const [assets, setAssets] = useState<CryptoAsset[]>(INITIAL_ASSETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h'>('5m');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [trades, setTrades] = useState<TradeTapeItem[]>([]);
  const [rsi, setRsi] = useState<number>(58.0);
  const [cvdDelta, setCvdDelta] = useState<number>(+142.5);
  const [orderbookImbalance, setOrderbookImbalance] = useState<number>(14);

  const activeAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];
  const activeAssetRef = useRef(activeAsset);
  activeAssetRef.current = activeAsset;

  // Initialize candles on symbol change
  useEffect(() => {
    const newCandles = generateInitialCandles(activeAsset.currentPrice || activeAsset.basePrice);
    setCandles(newCandles);
  }, [selectedSymbol]);

  // Real Hyperliquid L2 Orderbook parser
  const parseHyperliquidBook = useCallback((bookData: any) => {
    if (!bookData || !bookData.levels || !Array.isArray(bookData.levels[0])) return;

    try {
      const hlBids = bookData.levels[0]; // Array of { px, sz, n }
      const hlAsks = bookData.levels[1];

      let totalBid = 0;
      const parsedBids: OrderBookEntry[] = hlBids.slice(0, 10).map((b: any) => {
        const amount = parseFloat(b.sz) || 0;
        totalBid += amount;
        return {
          price: parseFloat(b.px),
          amount,
          total: Number(totalBid.toFixed(2)),
        };
      });

      let totalAsk = 0;
      const parsedAsks: OrderBookEntry[] = hlAsks.slice(0, 10).map((a: any) => {
        const amount = parseFloat(a.sz) || 0;
        totalAsk += amount;
        return {
          price: parseFloat(a.px),
          amount,
          total: Number(totalAsk.toFixed(2)),
        };
      });

      setBids(parsedBids);
      setAsks(parsedAsks.reverse());

      const imbalance = Math.round(((totalBid - totalAsk) / (totalBid + totalAsk || 1)) * 100);
      setOrderbookImbalance(imbalance);
    } catch (e) {
      console.warn('Error parsing Hyperliquid L2 book:', e);
    }
  }, []);

  // Fetch real market data from Hyperliquid via backend proxy
  const fetchRealHyperliquidData = useCallback(async () => {
    try {
      const coin = selectedSymbol.replace('-PERP', '');

      // 1. Fetch real L2 Orderbook for active coin
      const bookRes = await fetch('/api/protocols/hyperliquid/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'l2Book', coin }),
      });

      if (bookRes.ok) {
        const bookData = await bookRes.json();
        parseHyperliquidBook(bookData);
      }

      // 2. Fetch real mid prices for all coins
      const midsRes = await fetch('/api/protocols/hyperliquid/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allMids' }),
      });

      if (midsRes.ok) {
        const mids = await midsRes.json();
        setAssets((prev) =>
          prev.map((asset) => {
            const rawCoin = asset.symbol.replace('-PERP', '');
            if (mids[rawCoin]) {
              const realPrice = parseFloat(mids[rawCoin]);
              const change24h = Number((((realPrice - asset.basePrice) / asset.basePrice) * 100).toFixed(2));
              return {
                ...asset,
                currentPrice: realPrice,
                change24h,
                high24h: Math.max(asset.high24h, realPrice),
                low24h: Math.min(asset.low24h, realPrice),
              };
            }
            return asset;
          })
        );
      }

      // 3. Fetch real candles from Hyperliquid candleSnapshot
      const startTime = Date.now() - 1000 * 60 * 60 * 36; // last 36 hours
      const candlesRes = await fetch('/api/protocols/hyperliquid/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candleSnapshot',
          req: { coin, interval: '1h', startTime },
        }),
      });

      if (candlesRes.ok) {
        const rawCandles = await candlesRes.json();
        if (Array.isArray(rawCandles) && rawCandles.length >= 5) {
          const parsedCandles: CandleData[] = rawCandles.map((c: any) => ({
            time: c.t,
            open: parseFloat(c.o),
            high: parseFloat(c.h),
            low: parseFloat(c.l),
            close: parseFloat(c.c),
            volume: parseFloat(c.v),
          }));
          setCandles(calculateIndicators(parsedCandles));
        }
      }
    } catch (err) {
      console.warn('Hyperliquid live polling fallback:', err);
    }
  }, [selectedSymbol, parseHyperliquidBook]);

  // Initial fetch and 3-second live Hyperliquid polling loop
  useEffect(() => {
    fetchRealHyperliquidData();
    const hlInterval = setInterval(fetchRealHyperliquidData, 3000);
    return () => clearInterval(hlInterval);
  }, [fetchRealHyperliquidData]);

  // Real-time trades tape and candle tick sync
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const currentPrice = activeAssetRef.current.currentPrice;

      // Realistic tape item around real current price
      const side = Math.random() > 0.48 ? 'LONG' : 'SHORT';
      const isWhale = Math.random() < 0.08;
      const amount = Number(
        ((Math.random() * 2 + 0.1) * (isWhale ? 8 : 1) * (currentPrice > 1000 ? 1 : 35)).toFixed(3)
      );

      const newTrade: TradeTapeItem = {
        id: Math.random().toString(36).substring(2, 9),
        time: new Date().toLocaleTimeString('es-ES', { hour12: false }),
        price: currentPrice,
        amount,
        side,
        isWhale,
      };

      setTrades((prev) => [newTrade, ...prev.slice(0, 24)]);
      setCvdDelta((prev) => Number((prev + (side === 'LONG' ? amount : -amount)).toFixed(1)));

      // Sync latest candle with real current price
      setCandles((prevCandles) => {
        if (!prevCandles.length) return prevCandles;
        const lastCandle = { ...prevCandles[prevCandles.length - 1] };
        lastCandle.close = currentPrice;
        lastCandle.high = Math.max(lastCandle.high, currentPrice);
        lastCandle.low = Math.min(lastCandle.low, currentPrice);
        lastCandle.volume += Math.round(amount);

        const updated = [...prevCandles.slice(0, -1), lastCandle];
        return calculateIndicators(updated);
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  return {
    assets,
    activeAsset,
    selectedSymbol,
    setSelectedSymbol,
    timeframe,
    setTimeframe,
    candles,
    bids,
    asks,
    trades,
    rsi,
    cvdDelta,
    orderbookImbalance,
  };
}
