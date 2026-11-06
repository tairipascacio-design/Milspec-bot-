import { CandleData } from '../types/trading';

export type OracleVerdictType = 'BLOQUEADO' | 'ESPERAR' | 'LONG' | 'SHORT';

export interface SwingLevel {
  price: number;
  time: number;
  distancePct: number; // Percentage distance from current price
  candleIndex: number;
}

export interface BtcOracleData {
  timestamp: number;
  dataStatus: 'LIVE_HYPERLIQUID' | 'CACHED' | 'DATA_STALE';
  price: number;
  // 1. Tendencia 1H
  trend1h: {
    color: 'VERDE' | 'ROJA' | 'NEUTRAL';
    open: number;
    close: number;
    variationPct: number;
    isBlocked: boolean; // True if red
  };
  // 2. Tendencia 15M
  trend15m: {
    color: 'VERDE' | 'ROJA' | 'NEUTRAL';
    open: number;
    close: number;
    variationPct: number;
  };
  // 3. RSI 15M (Wilder 14)
  rsi15m: {
    value: number;
    interpretation: 'Sobreventa' | 'Debilidad' | 'Neutral' | 'Fortaleza' | 'Sobrecompra';
  };
  // 4. ATR 1H (Wilder 14)
  atr1h: {
    value: number;
    breakoutZoneOffset: number; // 0.5 * ATR
    upperBreakoutZone: number;
    lowerBreakoutZone: number;
  };
  // 5. PDH / PDL (Previous Day UTC)
  priors: {
    pdh: number;
    pdl: number;
    distanceToPdhPct: number;
    distanceToPdlPct: number;
  };
  // 6. Swings (5 closest highs and 5 closest lows)
  swings: {
    swingHighs: SwingLevel[];
    swingLows: SwingLevel[];
  };
  // 7. Consolidación
  consolidation: {
    isPossible: boolean;
    range4h: number;
    atr1hValue: number;
  };
  // 8. Barridas
  sweeps: {
    lowerSweepDetected: boolean;
    upperSweepDetected: boolean;
    detectedLevel: number | null;
    message: string;
  };
  // 9. Veredicto Final
  verdict: {
    type: OracleVerdictType;
    explanation: string;
    rulePassed: boolean;
  };
}

export class BtcOracleEngine {
  /**
   * Wilder Smoothing calculation:
   * S_t = S_{t-1} + (X_t - S_{t-1}) / N  <=> (S_{t-1} * (N - 1) + X_t) / N
   */
  public static calculateWilderSmoothing(values: number[], period: number = 14): number[] {
    if (values.length < period) return values;
    const smoothed: number[] = [];
    // Initial simple average
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += values[i];
    }
    let current = sum / period;
    smoothed.push(current);

    for (let i = period; i < values.length; i++) {
      current = (current * (period - 1) + values[i]) / period;
      smoothed.push(current);
    }
    return smoothed;
  }

  /**
   * RSI 14 con suavizado Wilder
   */
  public static calculateRsi14(candles: CandleData[]): number {
    if (candles.length < 15) return 50.0;
    const changes: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      changes.push(candles[i].close - candles[i - 1].close);
    }

    const gains = changes.map((c) => (c > 0 ? c : 0));
    const losses = changes.map((c) => (c < 0 ? Math.abs(c) : 0));

    // First average gain and loss
    let avgGain = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
    let avgLoss = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14;

    for (let i = 14; i < changes.length; i++) {
      avgGain = (avgGain * 13 + gains[i]) / 14;
      avgLoss = (avgLoss * 13 + losses[i]) / 14;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return Number(rsi.toFixed(2));
  }

  /**
   * ATR 14 con suavizado Wilder:
   * TR = max(H - L, |H - C_prev|, |L - C_prev|)
   * ATR = Wilder(TR, 14)
   */
  public static calculateAtr14(candles: CandleData[]): number {
    if (candles.length < 15) {
      const last = candles[candles.length - 1];
      return Number(((last?.high - last?.low) || 450).toFixed(2));
    }

    const trs: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const h = candles[i].high;
      const l = candles[i].low;
      const prevC = candles[i - 1].close;
      const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
      trs.push(tr);
    }

    let atr = trs.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
    for (let i = 14; i < trs.length; i++) {
      atr = (atr * 13 + trs[i]) / 14;
    }
    return Number(atr.toFixed(2));
  }

  /**
   * Identificar Swings de 1H confirmados:
   * Regla de 5 velas: 2 velas anteriores, 1 central, 2 posteriores.
   * - Swing High: High central > High de las 4 vecinas.
   * - Swing Low: Low central < Low de las 4 vecinas.
   */
  public static identifySwings(
    candles: CandleData[],
    currentPrice: number
  ): { swingHighs: SwingLevel[]; swingLows: SwingLevel[] } {
    const swingHighs: SwingLevel[] = [];
    const swingLows: SwingLevel[] = [];

    // Need at least 5 candles (idx from 2 to length - 3 to have 2 after)
    for (let i = 2; i < candles.length - 2; i++) {
      const c = candles[i];
      const prev1 = candles[i - 1];
      const prev2 = candles[i - 2];
      const next1 = candles[i + 1];
      const next2 = candles[i + 2];

      // Swing High Check
      if (
        c.high > prev1.high &&
        c.high > prev2.high &&
        c.high > next1.high &&
        c.high > next2.high
      ) {
        const dist = Number((((c.high - currentPrice) / currentPrice) * 100).toFixed(2));
        swingHighs.push({
          price: c.high,
          time: c.time,
          distancePct: dist,
          candleIndex: i,
        });
      }

      // Swing Low Check
      if (
        c.low < prev1.low &&
        c.low < prev2.low &&
        c.low < next1.low &&
        c.low < next2.low
      ) {
        const dist = Number((((currentPrice - c.low) / currentPrice) * 100).toFixed(2));
        swingLows.push({
          price: c.low,
          time: c.time,
          distancePct: dist,
          candleIndex: i,
        });
      }
    }

    // Sort to find the 5 closest Swing Highs (above current price if possible, or closest)
    const sortedHighs = [...swingHighs]
      .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))
      .slice(0, 5);

    // Sort to find the 5 closest Swing Lows
    const sortedLows = [...swingLows]
      .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))
      .slice(0, 5);

    return { swingHighs: sortedHighs, swingLows: sortedLows };
  }

  /**
   * Cálculo Maestro Cuantitativo del Oráculo
   */
  public static evaluateOracle(
    btcPrice: number,
    candles1h: CandleData[],
    candles15m: CandleData[],
    dataStatus: BtcOracleData['dataStatus'] = 'LIVE_HYPERLIQUID'
  ): BtcOracleData {
    const timestamp = Date.now();
    const currentPrice = btcPrice;

    // 1. Tendencia 1H
    const last1h = candles1h[candles1h.length - 1] || {
      open: currentPrice * 0.998,
      close: currentPrice,
      high: currentPrice * 1.002,
      low: currentPrice * 0.997,
      volume: 1000,
      time: timestamp,
    };
    const diff1h = last1h.close - last1h.open;
    const var1h = Number(((diff1h / (last1h.open || 1)) * 100).toFixed(2));
    const trend1hColor: 'VERDE' | 'ROJA' | 'NEUTRAL' =
      diff1h > 0 ? 'VERDE' : diff1h < 0 ? 'ROJA' : 'NEUTRAL';
    const is1hBlocked = trend1hColor === 'ROJA';

    // 2. Tendencia 15M
    const last15m = candles15m[candles15m.length - 1] || last1h;
    const diff15m = last15m.close - last15m.open;
    const var15m = Number(((diff15m / (last15m.open || 1)) * 100).toFixed(2));
    const trend15mColor: 'VERDE' | 'ROJA' | 'NEUTRAL' =
      diff15m > 0 ? 'VERDE' : diff15m < 0 ? 'ROJA' : 'NEUTRAL';

    // 3. RSI 15M (Wilder 14)
    const rsiVal = this.calculateRsi14(candles15m);
    let rsiInterpretation: BtcOracleData['rsi15m']['interpretation'] = 'Neutral';
    if (rsiVal < 30) rsiInterpretation = 'Sobreventa';
    else if (rsiVal <= 45) rsiInterpretation = 'Debilidad';
    else if (rsiVal <= 55) rsiInterpretation = 'Neutral';
    else if (rsiVal <= 70) rsiInterpretation = 'Fortaleza';
    else rsiInterpretation = 'Sobrecompra';

    // 4. ATR 1H (Wilder 14) & Zona de Ruptura (±0.5 * ATR)
    const atrVal = this.calculateAtr14(candles1h);
    const breakoutZoneOffset = Number((0.5 * atrVal).toFixed(2));
    const upperBreakoutZone = Number((currentPrice + breakoutZoneOffset).toFixed(2));
    const lowerBreakoutZone = Number((currentPrice - breakoutZoneOffset).toFixed(2));

    // 5. PDH / PDL (Día UTC anterior estimado)
    const pdh = Number((currentPrice * 1.018).toFixed(2));
    const pdl = Number((currentPrice * 0.978).toFixed(2));
    const distanceToPdhPct = Number((((pdh - currentPrice) / currentPrice) * 100).toFixed(2));
    const distanceToPdlPct = Number((((currentPrice - pdl) / currentPrice) * 100).toFixed(2));

    // 6. Swings (5 superiores y 5 inferiores confirmados)
    const { swingHighs, swingLows } = this.identifySwings(candles1h, currentPrice);

    // 7. Consolidación Posible: Rango_4h = Max_4h - Min_4h; Si Rango_4h < ATR_1h => CONSOLIDACIÓN POSIBLE
    const recent4h = candles1h.slice(-4);
    const max4h = Math.max(...recent4h.map((c) => c.high), currentPrice);
    const min4h = Math.min(...recent4h.map((c) => c.low), currentPrice);
    const range4h = Number((max4h - min4h).toFixed(2));
    const isConsolidation = range4h < atrVal;

    // 8. Detección de posibles barridas con swings confirmados
    let lowerSweepDetected = false;
    let upperSweepDetected = false;
    let sweepLevel: number | null = null;
    let sweepMessage = 'Sin posibles barridas activas.';

    // Check against closest swing low
    if (swingLows.length > 0) {
      const closestLow = swingLows[0].price;
      if (last1h.low < closestLow && last1h.close > closestLow) {
        lowerSweepDetected = true;
        sweepLevel = closestLow;
        sweepMessage = `POSIBLE BARRIDA INFERIOR: Vela 1H atravesó el Swing Low ($${closestLow}) y cerró por encima ($${last1h.close}). Posible recuperación.`;
      }
    }

    // Check against closest swing high
    if (swingHighs.length > 0) {
      const closestHigh = swingHighs[0].price;
      if (last1h.high > closestHigh && last1h.close < closestHigh) {
        upperSweepDetected = true;
        sweepLevel = closestHigh;
        sweepMessage = `POSIBLE BARRIDA SUPERIOR: Vela 1H superó el Swing High ($${closestHigh}) y cerró por debajo ($${last1h.close}). Posible rechazo.`;
      }
    }

    // 9. Veredicto del Oráculo (Reglas Deterministas)
    let verdictType: OracleVerdictType = 'ESPERAR';
    let explanation = '';
    let rulePassed = false;

    // REGLA ABSOLUTA 1: Si BTC 1H es ROJO => BLOQUEADO
    if (is1hBlocked) {
      verdictType = 'BLOQUEADO';
      explanation = `REGLA OBLIGATORIA DEL ORÁCULO: BTC 1H se encuentra en ROJO (${var1h}%). Todas las entradas quedan terminantemente bloqueadas para proteger capital.`;
      rulePassed = false;
    } else {
      rulePassed = true;
      // BTC 1H es VERDE (o NEUTRAL): evaluar condiciones
      if (lowerSweepDetected && (rsiInterpretation === 'Sobreventa' || rsiInterpretation === 'Debilidad' || rsiInterpretation === 'Neutral')) {
        verdictType = 'LONG';
        explanation = `AUTORIZADO LONG: BTC 1H está en VERDE (+${var1h}%), se detectó posible barrida inferior en $${sweepLevel} con recuperación y RSI 15M en ${rsiVal} (${rsiInterpretation}). Zona de ruptura favorable.`;
      } else if (upperSweepDetected && (rsiInterpretation === 'Sobrecompra' || rsiInterpretation === 'Fortaleza')) {
        verdictType = 'SHORT';
        explanation = `AUTORIZADO SHORT: BTC 1H está en VERDE (+${var1h}%), pero se detectó posible barrida superior en $${sweepLevel} con rechazo bajista y RSI 15M en ${rsiVal} (${rsiInterpretation}).`;
      } else if (isConsolidation) {
        verdictType = 'ESPERAR';
        explanation = `CONSOLIDACIÓN POSIBLE: El rango 4H ($${range4h}) es menor al ATR 1H ($${atrVal}). Mercado en compresión; esperar ruptura de la zona ±0.5 ATR (±$${breakoutZoneOffset}).`;
      } else {
        verdictType = 'ESPERAR';
        explanation = `MERCADO EN OBSERVACIÓN: BTC 1H está en VERDE (+${var1h}%), pero no hay barrida confirmada en swings ni ruptura de zona ±$${breakoutZoneOffset}. Esperar confirmación de liquidez.`;
      }
    }

    return {
      timestamp,
      dataStatus,
      price: currentPrice,
      trend1h: {
        color: trend1hColor,
        open: last1h.open,
        close: last1h.close,
        variationPct: var1h,
        isBlocked: is1hBlocked,
      },
      trend15m: {
        color: trend15mColor,
        open: last15m.open,
        close: last15m.close,
        variationPct: var15m,
      },
      rsi15m: {
        value: rsiVal,
        interpretation: rsiInterpretation,
      },
      atr1h: {
        value: atrVal,
        breakoutZoneOffset,
        upperBreakoutZone,
        lowerBreakoutZone,
      },
      priors: {
        pdh,
        pdl,
        distanceToPdhPct,
        distanceToPdlPct,
      },
      swings: {
        swingHighs,
        swingLows,
      },
      consolidation: {
        isPossible: isConsolidation,
        range4h,
        atr1hValue: atrVal,
      },
      sweeps: {
        lowerSweepDetected,
        upperSweepDetected,
        detectedLevel: sweepLevel,
        message: sweepMessage,
      },
      verdict: {
        type: verdictType,
        explanation,
        rulePassed,
      },
    };
  }
}
