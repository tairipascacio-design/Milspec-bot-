import { OrderSide } from './trading';
import { ProtocolId } from './protocols';

export type AutonomousAiStatus =
  | 'OFF'
  | 'MONITORING'
  | 'EVALUATING'
  | 'EXECUTING'
  | 'MANAGING_POSITIONS'
  | 'BLOCKED_ORACLE_RED'
  | 'BLOCKED_SAFETY';

export interface SweepHunterTradeLog {
  id: string;
  timestamp: number;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  exitPrice?: number;
  margin: number;
  leverage: number;
  takeProfit: number;
  stopLoss: number;
  status: 'OPEN' | 'CLOSED_TP' | 'CLOSED_SL' | 'CLOSED_MANUAL';
  pnl?: number;
  roe?: number;
  strategyUsed: string;
  reason: string;
  protocol: ProtocolId;
  txHash: string;
}

export interface SweepHunterDecision {
  id: string;
  timestamp: number;
  action: 'LONG' | 'SHORT' | 'HOLD';
  authorized: boolean;
  confidence: number;
  strategy: string;
  reasoning: string;
  oracleStatus: string;
  sweepSignal: string;
  riskEvaluation: string;
  threatLevel: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO';
  blockedReason?: string;
  source: 'GEMINI_AI' | 'DETERMINISTIC_ENGINE';
}

export interface SweepHunterTelemetry {
  hyperliquidConnected: boolean;
  hyperliquidPingMs: number;
  lastBookUpdate: number;
  oracleTrend1h: 'VERDE' | 'ROJA' | 'NEUTRAL';
  isOracleBlocked: boolean;
  sweepSignalType: string;
  hasInducementTrap: boolean;
  kellyMarginRecommended: number;
  activePositionsCount: number;
}
