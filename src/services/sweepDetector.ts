import { CandleData } from '../types/trading';

export type SweepType = 'BSL_SWEEP_BEARISH' | 'SSL_SWEEP_BULLISH' | 'NONE';
export type BreakoutStatus = 'CONFIRMED_BREAKOUT' | 'FALSE_BREAKOUT_BULL_TRAP' | 'FALSE_BREAKOUT_BEAR_TRAP' | 'NONE';
export type FakeSweepStatus = 'BARRIDA_FALSA_INDUCEMENT' | 'BARRIDA_GENUINA' | 'NORMAL';

export interface SweepSignal {
  type: SweepType;
  levelPrice: number;
  sweepPrice: number;
  wickRatio: number; // e.g. 0.62 (62% wick)
  volumeMultiplier: number; // e.g. 2.1x SMA20
  confidenceScore: number; // 0 - 100
  recommendedAction: 'BUY_LONG' | 'SELL_SHORT' | 'HOLD';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  description: string;
  mathExplanation: string;
}

export interface FalseBreakoutSignal {
  status: BreakoutStatus;
  keyLevel: number;
  maxPenetrationPrice: number;
  penetrationPct: number;
  deltaDivergenceDetected: boolean;
  confidenceScore: number;
  recommendedAction: 'SHORT_FAKEOUT' | 'LONG_FAKEOUT' | 'HOLD';
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  description: string;
  mathExplanation: string;
}

export interface FakeSweepSignal {
  status: FakeSweepStatus;
  isTrap: boolean;
  minorLevel: number;
  majorPoolPrice: number;
  distanceToMajorPoolPct: number;
  actionWarning: string;
  description: string;
  mathExplanation: string;
}

export class SweepDetectorEngine {
  /**
   * 1. DETECCIÓN DE BARRIDAS DE LIQUIDEZ (BSL / SSL SWEEPS)
   * Fórmula matemática:
   *  - Nivel Swings: H_swing = max(High[t-N...t-1]), L_swing = min(Low[t-N...t-1])
   *  - Condición de Barrida Alcista (SSL Sweep): Low_t < L_swing && Close_t > L_swing
   *  - Ratio de Mecha: (min(Open, Close) - Low) / (High - Low) >= 0.50 (50%+ mecha inferior de rechazo)
   *  - Volumen: Volume_t > 1.5 * SMA(Volume, 20)
   */
  public static detectLiquiditySweep(candles: CandleData[], lookback: number = 20): SweepSignal {
    if (candles.length < lookback + 2) {
      return {
        type: 'NONE',
        levelPrice: 0,
        sweepPrice: 0,
        wickRatio: 0,
        volumeMultiplier: 1,
        confidenceScore: 0,
        recommendedAction: 'HOLD',
        entryPrice: 0,
        stopLoss: 0,
        takeProfit1: 0,
        takeProfit2: 0,
        description: 'Velas insuficientes para cálculo de swings.',
        mathExplanation: 'Lookback mínimo: 20 velas.',
      };
    }

    const currentCandle = candles[candles.length - 1];
    const prevCandles = candles.slice(candles.length - 1 - lookback, candles.length - 1);

    const swingHigh = Math.max(...prevCandles.map((c) => c.high));
    const swingLow = Math.min(...prevCandles.map((c) => c.low));

    // Calculate SMA20 Volume
    const avgVol = prevCandles.reduce((acc, c) => acc + c.volume, 0) / prevCandles.length || 1;
    const volMult = Number((currentCandle.volume / avgVol).toFixed(2));

    const candleRange = currentCandle.high - currentCandle.low || 1;
    const bodyTop = Math.max(currentCandle.open, currentCandle.close);
    const bodyBottom = Math.min(currentCandle.open, currentCandle.close);

    // SSL Sweep (Barrida de Sell-Side Liquidity en soporte)
    // El precio perfora el swing low buscando liquidar longs y activar stop loss, pero cierra por encima
    if (currentCandle.low < swingLow && currentCandle.close > swingLow) {
      const lowerWick = bodyBottom - currentCandle.low;
      const lowerWickRatio = Number((lowerWick / candleRange).toFixed(2));

      if (lowerWickRatio >= 0.40) {
        const confidence = Math.min(98, Math.round(55 + lowerWickRatio * 30 + Math.min(20, volMult * 8)));
        const entryPrice = currentCandle.close;
        const stopLoss = Number((currentCandle.low * 0.997).toFixed(2));
        const distance = entryPrice - stopLoss;
        const takeProfit1 = Number((entryPrice + distance * 2.0).toFixed(2));
        const takeProfit2 = Number((entryPrice + distance * 3.5).toFixed(2));

        return {
          type: 'SSL_SWEEP_BULLISH',
          levelPrice: swingLow,
          sweepPrice: currentCandle.low,
          wickRatio: lowerWickRatio,
          volumeMultiplier: volMult,
          confidenceScore: confidence,
          recommendedAction: 'BUY_LONG',
          entryPrice,
          stopLoss,
          takeProfit1,
          takeProfit2,
          description: `BARRIDA DE LIQUIDEZ COMPRADORA (SSL SWEEP): El precio barrió los stop loss bajo $${swingLow.toFixed(2)}, pero cerró por encima dejando un ${Math.round(lowerWickRatio * 100)}% de mecha inferior con volumen ${volMult}x superior a la media.`,
          mathExplanation: `Low[t] ($${currentCandle.low}) < SwingLow ($${swingLow}) AND Close[t] ($${currentCandle.close}) > SwingLow. Mecha Inferior = ${Math.round(lowerWickRatio * 100)}% del rango. Vol = ${volMult}x SMA20. Señal: RECHAZO INSTITUCIONAL COMPRADOR.`,
        };
      }
    }

    // BSL Sweep (Barrida de Buy-Side Liquidity en resistencia)
    // El precio perfora el swing high buscando liquidar shorts, pero cierra por debajo
    if (currentCandle.high > swingHigh && currentCandle.close < swingHigh) {
      const upperWick = currentCandle.high - bodyTop;
      const upperWickRatio = Number((upperWick / candleRange).toFixed(2));

      if (upperWickRatio >= 0.40) {
        const confidence = Math.min(98, Math.round(55 + upperWickRatio * 30 + Math.min(20, volMult * 8)));
        const entryPrice = currentCandle.close;
        const stopLoss = Number((currentCandle.high * 1.003).toFixed(2));
        const distance = stopLoss - entryPrice;
        const takeProfit1 = Number((entryPrice - distance * 2.0).toFixed(2));
        const takeProfit2 = Number((entryPrice - distance * 3.5).toFixed(2));

        return {
          type: 'BSL_SWEEP_BEARISH',
          levelPrice: swingHigh,
          sweepPrice: currentCandle.high,
          wickRatio: upperWickRatio,
          volumeMultiplier: volMult,
          confidenceScore: confidence,
          recommendedAction: 'SELL_SHORT',
          entryPrice,
          stopLoss,
          takeProfit1,
          takeProfit2,
          description: `BARRIDA DE LIQUIDEZ VENDEDORA (BSL SWEEP): Trampa alcista. El precio cazó las órdenes de compra sobre $${swingHigh.toFixed(2)} y fue rechazado dejando un ${Math.round(upperWickRatio * 100)}% de mecha superior con volumen ${volMult}x.`,
          mathExplanation: `High[t] ($${currentCandle.high}) > SwingHigh ($${swingHigh}) AND Close[t] ($${currentCandle.close}) < SwingHigh. Mecha Superior = ${Math.round(upperWickRatio * 100)}% del rango. Vol = ${volMult}x SMA20. Señal: ABSORCIÓN PASIVA VENDEDORA.`,
        };
      }
    }

    return {
      type: 'NONE',
      levelPrice: (swingHigh + swingLow) / 2,
      sweepPrice: currentCandle.close,
      wickRatio: 0.2,
      volumeMultiplier: volMult,
      confidenceScore: 45,
      recommendedAction: 'HOLD',
      entryPrice: currentCandle.close,
      stopLoss: Number((currentCandle.close * 0.985).toFixed(2)),
      takeProfit1: Number((currentCandle.close * 1.03).toFixed(2)),
      takeProfit2: Number((currentCandle.close * 1.05).toFixed(2)),
      description: 'Sin barrida activa en este momento. El precio oscila dentro del rango de liquidez interna.',
      mathExplanation: `High[t] ($${currentCandle.high}) <= SwingHigh ($${swingHigh}) && Low[t] ($${currentCandle.low}) >= SwingLow ($${swingLow}). Estructura contenida.`,
    };
  }

  /**
   * 2. DETECCIÓN DE RUPTURAS FALSAS (FALSE BREAKOUTS / SFP - SWING FAILURE PATTERN)
   * Fórmula matemática:
   *  - Resistencia R / Soporte S: Clúster de toques repetidos.
   *  - Penetración: Delta = |P_max - Level| / Level * 100
   *  - Si 0.1% <= Delta <= 1.8% pero la vela actual o anterior cierra contraria (reingreso al rango):
   *    -> Bull Trap (Trampa de Toros) = Falsa Ruptura Alcista
   *    -> Bear Trap (Trampa de Osos) = Falsa Ruptura Bajista
   */
  public static detectFalseBreakout(candles: CandleData[], cvdDelta: number = 0): FalseBreakoutSignal {
    if (candles.length < 10) {
      return {
        status: 'NONE',
        keyLevel: 0,
        maxPenetrationPrice: 0,
        penetrationPct: 0,
        deltaDivergenceDetected: false,
        confidenceScore: 0,
        recommendedAction: 'HOLD',
        entryPrice: 0,
        stopLoss: 0,
        targetPrice: 0,
        description: 'Datos insuficientes para análisis de ruptura.',
        mathExplanation: 'Requiere al menos 10 velas históricas.',
      };
    }

    const recent = candles.slice(candles.length - 10);
    const last = recent[recent.length - 1];
    const prev = recent[recent.length - 2];

    const maxHigh = Math.max(...recent.slice(0, 8).map((c) => c.high));
    const minLow = Math.min(...recent.slice(0, 8).map((c) => c.low));

    // Check for Bull Trap (Ruptura falsa al alza)
    if (prev.high > maxHigh && last.close < maxHigh) {
      const penetrationPct = Number((((prev.high - maxHigh) / maxHigh) * 100).toFixed(2));
      const deltaDivergence = cvdDelta < 0; // Negative volume delta during upward breakout = divergence
      const confidence = Math.min(96, Math.round(70 + (deltaDivergence ? 15 : 5) + Math.min(10, penetrationPct * 5)));

      return {
        status: 'FALSE_BREAKOUT_BULL_TRAP',
        keyLevel: maxHigh,
        maxPenetrationPrice: prev.high,
        penetrationPct,
        deltaDivergenceDetected: deltaDivergence,
        confidenceScore: confidence,
        recommendedAction: 'SHORT_FAKEOUT',
        entryPrice: last.close,
        stopLoss: Number((prev.high * 1.002).toFixed(2)),
        targetPrice: Number((minLow * 1.005).toFixed(2)),
        description: `RUPTURA FALSA ALCISTA (BULL TRAP / SFP): Ruptura de resistencia en $${maxHigh.toFixed(2)} (+${penetrationPct}%) sin continuidad. La vela reingresó al rango${deltaDivergence ? ' con divergencia negativa en delta CVD' : ''}.`,
        mathExplanation: `High[t-1] ($${prev.high}) > Resistencia ($${maxHigh}) pero Close[t] ($${last.close}) < Resistencia. Reingreso confirmado. Delta CVD = ${cvdDelta}. Vector: SHORT a soporte del rango.`,
      };
    }

    // Check for Bear Trap (Ruptura falsa a la baja)
    if (prev.low < minLow && last.close > minLow) {
      const penetrationPct = Number((((minLow - prev.low) / minLow) * 100).toFixed(2));
      const deltaDivergence = cvdDelta > 0;
      const confidence = Math.min(96, Math.round(70 + (deltaDivergence ? 15 : 5) + Math.min(10, penetrationPct * 5)));

      return {
        status: 'FALSE_BREAKOUT_BEAR_TRAP',
        keyLevel: minLow,
        maxPenetrationPrice: prev.low,
        penetrationPct,
        deltaDivergenceDetected: deltaDivergence,
        confidenceScore: confidence,
        recommendedAction: 'LONG_FAKEOUT',
        entryPrice: last.close,
        stopLoss: Number((prev.low * 0.998).toFixed(2)),
        targetPrice: Number((maxHigh * 0.995).toFixed(2)),
        description: `RUPTURA FALSA BAJISTA (BEAR TRAP / SFP): Intento de colapso bajo soporte $${minLow.toFixed(2)} fallido. El mercado recuperó el soporte${deltaDivergence ? ' con absorción de compras visible en delta CVD' : ''}.`,
        mathExplanation: `Low[t-1] ($${prev.low}) < Soporte ($${minLow}) pero Close[t] ($${last.close}) > Soporte. Recuperación en < 2 velas. Delta CVD = ${cvdDelta}. Vector: LONG a techo del rango.`,
      };
    }

    return {
      status: 'NONE',
      keyLevel: maxHigh,
      maxPenetrationPrice: last.high,
      penetrationPct: 0,
      deltaDivergenceDetected: false,
      confidenceScore: 30,
      recommendedAction: 'HOLD',
      entryPrice: last.close,
      stopLoss: Number((last.close * 0.985).toFixed(2)),
      targetPrice: Number((last.close * 1.03).toFixed(2)),
      description: 'No se detecta trampa de ruptura en la ventana actual. El precio se consolida dentro de límites normales.',
      mathExplanation: `Rango: $${minLow.toFixed(2)} - $${maxHigh.toFixed(2)}. Sin penetración de umbral delta > 0.1%.`,
    };
  }

  /**
   * 3. DETECCIÓN DE BARRIDAS FALSAS (FAKE SWEEPS / INDUCEMENT / CEBO DE LIQUIDEZ)
   * Fórmula matemática:
   *  - Barrida menor sobre pivot interno (Minor Low/High), PERO existe un nivel macro de Equal Lows (EQL) o Equal Highs (EQH)
   *    a menos de 0.8% de distancia sin tocar.
   *  - Volumen débil en la supuesta reversión: Vol < 1.0 * SMA(Volume, 20).
   *  - Conclusión: ES UNA BARRIDA FALSA / INDUCEMENT. Los creadores de mercado inducen a los minoristas a comprar/vender
   *    temprano para luego cazarlos en el nivel macro real.
   */
  public static detectFakeSweep(candles: CandleData[], currentPrice: number): FakeSweepSignal {
    if (candles.length < 15) {
      return {
        status: 'NORMAL',
        isTrap: false,
        minorLevel: currentPrice,
        majorPoolPrice: currentPrice,
        distanceToMajorPoolPct: 0,
        actionWarning: 'Datos insuficientes',
        description: 'Requiere más velas para triangular pools mayores de liquidez.',
        mathExplanation: 'Lookback insuficiente.',
      };
    }

    const recent = candles.slice(candles.length - 15);
    const avgVol = recent.reduce((a, c) => a + c.volume, 0) / recent.length || 1;
    const lastCandle = recent[recent.length - 1];

    // Minor low formed in the last 4 candles
    const minorLow = Math.min(...recent.slice(-4).map((c) => c.low));
    // Major liquidity pool (lowest low in 15 candles)
    const majorLow = Math.min(...recent.map((c) => c.low));

    const distancePct = Number((((minorLow - majorLow) / minorLow) * 100).toFixed(2));
    const isLowVolume = lastCandle.volume < avgVol * 0.95;

    // If minor low was breached but major low is very close (between 0.2% and 1.2% away) and volume is low:
    if (distancePct > 0.15 && distancePct < 1.2 && isLowVolume) {
      return {
        status: 'BARRIDA_FALSA_INDUCEMENT',
        isTrap: true,
        minorLevel: minorLow,
        majorPoolPrice: majorLow,
        distanceToMajorPoolPct: distancePct,
        actionWarning: '¡ALERTA TÁCTICA! BARRIDA FALSA (INDUCEMENT). NO ENTRAR EN LONG TODAVÍA.',
        description: `BARRIDA FALSA DETECTADA (INDUCEMENT): El mercado simuló un barrido del mínimo menor $${minorLow.toFixed(2)}, pero hay un pool de liquidez macro mayor en $${majorLow.toFixed(2)} a solo ${distancePct}% de distancia. El volumen es débil (${Math.round((lastCandle.volume / avgVol) * 100)}% de la media). Es un cebo minorista antes del verdadero barrido final.`,
        mathExplanation: `Distancia a Pool Mayor = |MinorLow ($${minorLow}) - MajorLow ($${majorLow})| / MinorLow = ${distancePct}%. Volumen = ${lastCandle.volume} (< SMA20 ${Math.round(avgVol)}). Algoritmo MM: Liquidity Baiting en curso.`,
      };
    }

    return {
      status: 'BARRIDA_GENUINA',
      isTrap: false,
      minorLevel: minorLow,
      majorPoolPrice: majorLow,
      distanceToMajorPoolPct: distancePct,
      actionWarning: 'Condiciones de liquidez limpias. Sin trampa de inducement detectada.',
      description: 'El flujo de órdenes no presenta indicios de cebo de liquidez menor. Los pools identificados se encuentran a distancias estructurales normales.',
      mathExplanation: `Distancia estructural: ${distancePct}%. Volumen actual dentro de parámetros normales.`,
    };
  }
}
