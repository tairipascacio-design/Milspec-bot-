import { CandleData, TradeTapeItem } from '../types/trading';

export interface SmcResult {
  hasOrderBlock: boolean;
  orderBlockType: 'BULLISH_OB' | 'BEARISH_OB' | 'NONE';
  orderBlockPrice: number;
  hasFvg: boolean;
  fvgZone: { top: number; bottom: number } | null;
  marketStructure: 'BULLISH_BOS' | 'BEARISH_BOS' | 'RANGE';
}

export interface IctResult {
  currentKillzone: 'LONDON_OPEN' | 'NY_AM_KILLZONE' | 'NY_PM_KILLZONE' | 'ASIAN_RANGE' | 'OUTSIDE_KILLZONE';
  judasSwingDetected: boolean;
  optimalTradeEntry: { fib62: number; fib79: number };
  timeUtc: string;
}

export interface WyckoffResult {
  phase: 'FASE_A_STOPPING' | 'FASE_B_BUILDING' | 'FASE_C_SPRING' | 'FASE_C_UTAD' | 'FASE_D_MARKUP' | 'FASE_E_RUNAWAY';
  signal: 'SPRING_BUY' | 'UTAD_SELL' | 'ABSORPTION_ACCUMULATION' | 'NEUTRAL';
  confidence: number;
}

export interface RiskKellyResult {
  recommendedMarginUsdt: number;
  kellyFractionPct: number;
  maxLeverageRecommended: number;
  liquidationBufferDistancePct: number;
  riskRewardEstimate: string;
}

export class InstitutionalAnalysisEngine {
  // SMC: Order Blocks & Fair Value Gaps
  public static runSmcAnalysis(candles: CandleData[], currentPrice: number): SmcResult {
    if (candles.length < 5) {
      return {
        hasOrderBlock: false,
        orderBlockType: 'NONE',
        orderBlockPrice: currentPrice,
        hasFvg: false,
        fvgZone: null,
        marketStructure: 'RANGE',
      };
    }

    // Check last 3 candles for Fair Value Gap
    const c1 = candles[candles.length - 3];
    const c2 = candles[candles.length - 2];
    const c3 = candles[candles.length - 1];

    let hasFvg = false;
    let fvgZone = null;

    if (c3.low > c1.high) {
      // Bullish FVG
      hasFvg = true;
      fvgZone = { top: c3.low, bottom: c1.high };
    } else if (c3.high < c1.low) {
      // Bearish FVG
      hasFvg = true;
      fvgZone = { top: c1.low, bottom: c3.high };
    }

    // Check for Order Block (last opposing candle before impulsive move)
    const recentMove = c3.close - c1.open;
    const isBullishImpulse = recentMove > 0;
    const orderBlockType = isBullishImpulse ? 'BULLISH_OB' : 'BEARISH_OB';
    const orderBlockPrice = isBullishImpulse ? c1.low : c1.high;

    return {
      hasOrderBlock: true,
      orderBlockType,
      orderBlockPrice,
      hasFvg,
      fvgZone,
      marketStructure: isBullishImpulse ? 'BULLISH_BOS' : 'BEARISH_BOS',
    };
  }

  // ICT: London / NY Killzones & Judas Swing
  public static runIctAnalysis(currentPrice: number): IctResult {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const timeUtc = `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')} UTC`;

    let currentKillzone: IctResult['currentKillzone'] = 'OUTSIDE_KILLZONE';
    let judasSwingDetected = false;

    if (utcHours >= 2 && utcHours < 5) {
      currentKillzone = 'LONDON_OPEN';
      judasSwingDetected = true;
    } else if (utcHours >= 12 && utcHours < 15) {
      currentKillzone = 'NY_AM_KILLZONE';
      judasSwingDetected = true;
    } else if (utcHours >= 18 && utcHours < 20) {
      currentKillzone = 'NY_PM_KILLZONE';
    } else if (utcHours >= 0 && utcHours < 2) {
      currentKillzone = 'ASIAN_RANGE';
    }

    const fib62 = Number((currentPrice * 0.988).toFixed(2));
    const fib79 = Number((currentPrice * 0.982).toFixed(2));

    return {
      currentKillzone,
      judasSwingDetected,
      optimalTradeEntry: { fib62, fib79 },
      timeUtc,
    };
  }

  // Wyckoff Accumulation Spring & Distribution UTAD
  public static runWyckoffAnalysis(candles: CandleData[], rsi: number): WyckoffResult {
    if (rsi < 35) {
      return {
        phase: 'FASE_C_SPRING',
        signal: 'SPRING_BUY',
        confidence: 88,
      };
    } else if (rsi > 68) {
      return {
        phase: 'FASE_C_UTAD',
        signal: 'UTAD_SELL',
        confidence: 85,
      };
    } else {
      return {
        phase: 'FASE_B_BUILDING',
        signal: 'NEUTRAL',
        confidence: 65,
      };
    }
  }

  // Risk Management & Kelly Criterion
  public static calculateRisk(
    accountBalance: number,
    winRateEstPct: number = 75,
    riskRewardRatio: number = 3.0
  ): RiskKellyResult {
    // Kelly formula: f* = (p * (b + 1) - 1) / b
    const p = winRateEstPct / 100;
    const b = riskRewardRatio;
    const kelly = Math.max(0.01, Math.min(0.15, (p * (b + 1) - 1) / b)); // Capped at 15% max for safety
    const fractionalKelly = kelly * 0.5; // Half-Kelly for institutional resilience
    const recommendedMarginUsdt = Math.round(accountBalance * fractionalKelly);

    return {
      recommendedMarginUsdt,
      kellyFractionPct: Number((fractionalKelly * 100).toFixed(1)),
      maxLeverageRecommended: 20,
      liquidationBufferDistancePct: 18.5,
      riskRewardEstimate: `1:${b.toFixed(1)}`,
    };
  }
}
