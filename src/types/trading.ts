export type OrderSide = 'LONG' | 'SHORT';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_MARKET';
export type MarginMode = 'CROSS' | 'ISOLATED';

export interface CryptoAsset {
  symbol: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  fundingRate: number; // e.g., 0.0125%
  nextFundingIn: string; // e.g. "03:42:15"
  openInterest: number;
  maxLeverage: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  upperBand?: number;
  lowerBand?: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface TradeTapeItem {
  id: string;
  time: string;
  price: number;
  amount: number;
  side: OrderSide;
  isWhale?: boolean;
}

export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  markPrice: number;
  size: number; // contracts or crypto units
  margin: number; // USDT
  leverage: number;
  liquidationPrice: number;
  takeProfit?: number;
  stopLoss?: number;
  marginMode: MarginMode;
  protocol?: string;
  pnl: number;
  roe: number;
  openedAt: number;
}

export interface TradingSkill {
  id: string;
  name: string;
  category: 'SMC' | 'WYCKOFF' | 'ICT' | 'ORDER_FLOW' | 'WEB3_FUTURES' | 'RISK_MANAGEMENT';
  difficulty: 'CADETE' | 'OPERADOR' | 'COMANDANTE';
  winRateEst: number; // e.g. 78%
  riskRewardAvg: string; // e.g. "1:3.5"
  description: string;
  tacticalApplication: string;
  rules: string[];
  threatCondition: string;
  activeInRadar: boolean;
}

export interface AiTacticalAnalysis {
  action: 'LONG' | 'SHORT' | 'HOLD';
  confluenceScore: number;
  recommendedLeverage: number;
  entryPrice: number;
  takeProfit1: number;
  takeProfit2: number;
  stopLoss: number;
  riskRewardRatio: string;
  tacticalSkillUsed: string;
  briefing: string;
  threatLevel: string;
  voiceTransmission: string;
}

export interface HistoricalBattle {
  id: string;
  title: string;
  date: string;
  symbol: string;
  initialPrice: number;
  targetPrice: number;
  description: string;
  threatLevel: string;
  tacticalObjective: string;
  bestStrategy: string;
  historicalPnlMultiplier: string;
  badgeAward: string;
  scenarioData: CandleData[];
}
