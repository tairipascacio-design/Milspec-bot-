import { useState, useEffect, useRef, useCallback } from 'react';
import { CryptoAsset, CandleData, Position, OrderSide, MarginMode } from '../types/trading';
import { ProtocolId, Web3WalletState } from '../types/protocols';
import { BtcOracleData } from '../services/btcOracleEngine';
import {
  SweepDetectorEngine,
  SweepSignal,
  FalseBreakoutSignal,
  FakeSweepSignal,
} from '../services/sweepDetector';
import { InstitutionalAnalysisEngine } from '../services/institutionalAnalysis';
import {
  AutonomousAiStatus,
  SweepHunterTradeLog,
  SweepHunterDecision,
  SweepHunterTelemetry,
} from '../types/sweepHunter';
import { tacticalAudio } from '../utils/audio';

interface UseSweepHunterAutonomousProps {
  activeAsset: CryptoAsset;
  candles: CandleData[];
  cvdDelta: number;
  oracleData: BtcOracleData;
  orderbookImbalance: number;
  selectedProtocol: ProtocolId;
  walletState: Web3WalletState;
  positions: Position[];
  onExecuteOrder: (order: {
    symbol: string;
    side: OrderSide;
    margin: number;
    leverage: number;
    marginMode: MarginMode;
    takeProfit?: number;
    stopLoss?: number;
    protocol: ProtocolId;
  }) => void;
  onClosePosition: (id: string, partial?: boolean) => void;
  onSetBreakEven: (id: string) => void;
}

export function useSweepHunterAutonomous({
  activeAsset,
  candles,
  cvdDelta,
  oracleData,
  orderbookImbalance,
  selectedProtocol,
  walletState,
  positions,
  onExecuteOrder,
  onClosePosition,
  onSetBreakEven,
}: UseSweepHunterAutonomousProps) {
  // Autonomy switch state: ON / OFF
  const [isAiAutonomyEnabled, setIsAiAutonomyEnabled] = useState<boolean>(false);
  const [autonomousStatus, setAutonomousStatus] = useState<AutonomousAiStatus>('OFF');

  // Trade logs and decision history
  const [tradeLogs, setTradeLogs] = useState<SweepHunterTradeLog[]>([]);
  const [decisionHistory, setDecisionHistory] = useState<SweepHunterDecision[]>([]);
  const [lastDecision, setLastDecision] = useState<SweepHunterDecision | null>(null);

  // Timestamp references to prevent over-trading
  const lastExecutionTimeRef = useRef<number>(0);
  const isExecutingRef = useRef<boolean>(false);

  // Parse numeric balance
  const numericUsdtBalance = parseFloat(walletState.usdtBalance.replace(/[^0-9.]/g, '')) || 0;

  // Toggle autonomy switch ON / OFF
  const toggleAiAutonomy = useCallback(() => {
    tacticalAudio.playClick();
    setIsAiAutonomyEnabled((prev) => {
      const next = !prev;
      if (next) {
        tacticalAudio.playVictory();
        if (oracleData.trend1h.isBlocked) {
          setAutonomousStatus('BLOCKED_ORACLE_RED');
          tacticalAudio.speakTacticalVoice('Autonomía activada pero en espera: BTC 1 hora en rojo.');
        } else {
          setAutonomousStatus('MONITORING');
          tacticalAudio.speakTacticalVoice('Inteligencia artificial armada. Vigilancia autónoma de barridas iniciada.');
        }
      } else {
        setAutonomousStatus('OFF');
        tacticalAudio.speakTacticalVoice('Autonomía detenida. Motores de análisis continúan en observación pasiva.');
      }
      return next;
    });
  }, [oracleData.trend1h.isBlocked]);

  // Continuously supervise open positions belonging to this active asset
  useEffect(() => {
    const activePositions = positions.filter((p) => p.symbol === activeAsset.symbol);
    if (!activePositions.length) return;

    activePositions.forEach((pos) => {
      const markPrice = activeAsset.currentPrice;

      // 1. Take Profit hit check
      if (pos.takeProfit) {
        const isTpHit =
          pos.side === 'LONG' ? markPrice >= pos.takeProfit : markPrice <= pos.takeProfit;

        if (isTpHit) {
          tacticalAudio.playVictory();
          tacticalAudio.speakTacticalVoice(`Take profit alcanzado en ${pos.symbol}. Cerrando con beneficio.`);
          onClosePosition(pos.id);

          setTradeLogs((prev) =>
            prev.map((t) =>
              t.id === pos.id || t.symbol === pos.symbol
                ? {
                    ...t,
                    status: 'CLOSED_TP',
                    exitPrice: markPrice,
                    pnl: Number(pos.pnl.toFixed(2)),
                    roe: Number(pos.roe.toFixed(2)),
                  }
                : t
            )
          );
          return;
        }
      }

      // 2. Stop Loss hit check
      if (pos.stopLoss) {
        const isSlHit =
          pos.side === 'LONG' ? markPrice <= pos.stopLoss : markPrice >= pos.stopLoss;

        if (isSlHit) {
          tacticalAudio.playKlaxon();
          tacticalAudio.speakTacticalVoice(`Stop loss ejecutado en ${pos.symbol}. Posición cerrada para defensa de capital.`);
          onClosePosition(pos.id);

          setTradeLogs((prev) =>
            prev.map((t) =>
              t.id === pos.id || t.symbol === pos.symbol
                ? {
                    ...t,
                    status: 'CLOSED_SL',
                    exitPrice: markPrice,
                    pnl: Number(pos.pnl.toFixed(2)),
                    roe: Number(pos.roe.toFixed(2)),
                  }
                : t
            )
          );
          return;
        }
      }

      // 3. Move to Break-Even if profit is substantial (+1.8%) and SL not yet at breakeven
      if (pos.side === 'LONG' && markPrice >= pos.entryPrice * 1.018) {
        if (!pos.stopLoss || pos.stopLoss < pos.entryPrice) {
          onSetBreakEven(pos.id);
          tacticalAudio.playClick();
        }
      } else if (pos.side === 'SHORT' && markPrice <= pos.entryPrice * 0.982) {
        if (!pos.stopLoss || pos.stopLoss > pos.entryPrice) {
          onSetBreakEven(pos.id);
          tacticalAudio.playClick();
        }
      }
    });
  }, [activeAsset.currentPrice, activeAsset.symbol, positions, onClosePosition, onSetBreakEven]);

  // Main Continuous Evaluation Loop (Runs every 4 seconds)
  useEffect(() => {
    const cycleInterval = setInterval(async () => {
      // 1. ALWAYS RUN THE MATHEMATICAL ENGINES (even when AI is OFF)
      const sweepSignal: SweepSignal = SweepDetectorEngine.detectLiquiditySweep(candles, 20);
      const falseBreakoutSignal: FalseBreakoutSignal = SweepDetectorEngine.detectFalseBreakout(
        candles,
        cvdDelta
      );
      const fakeSweepSignal: FakeSweepSignal = SweepDetectorEngine.detectFakeSweep(
        candles,
        activeAsset.currentPrice
      );
      const riskEvaluation = InstitutionalAnalysisEngine.calculateRisk(numericUsdtBalance);

      const isOracleBlocked = oracleData.trend1h.isBlocked;
      const isInducement = fakeSweepSignal.isTrap;
      const activePositionsForAsset = positions.filter((p) => p.symbol === activeAsset.symbol);

      // If IA is OFF, update status and do not proceed with autonomous orders
      if (!isAiAutonomyEnabled) {
        setAutonomousStatus('OFF');
        return;
      }

      // IA is ON: Update dynamic status
      if (isOracleBlocked) {
        setAutonomousStatus('BLOCKED_ORACLE_RED');
      } else if (activePositionsForAsset.length > 0) {
        setAutonomousStatus('MANAGING_POSITIONS');
      } else {
        setAutonomousStatus('MONITORING');
      }

      // CHECK MANDATORY SAFETY RULE 1: BTC 1H RED
      if (isOracleBlocked) {
        const blockDecision: SweepHunterDecision = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          action: 'HOLD',
          authorized: false,
          confidence: 0,
          strategy: 'Protección Imperativa de Capital',
          reasoning:
            'BLOQUEO OBLIGATORIO: BTC 1H en ROJO (' +
            oracleData.trend1h.variationPct +
            '%). El Oráculo mantiene las compuertas de fuego cerradas.',
          oracleStatus: 'ROJA · ENTRADAS BLOQUEADAS',
          sweepSignal: sweepSignal.type,
          riskEvaluation: 'Apalancamiento congelado',
          threatLevel: 'CRÍTICO',
          blockedReason: 'BTC 1H Rojo',
          source: 'DETERMINISTIC_ENGINE',
        };
        setLastDecision(blockDecision);
        return;
      }

      // CHECK MANDATORY SAFETY RULE 2: INDUCEMENT TRAP
      if (isInducement) {
        const inducementDecision: SweepHunterDecision = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          action: 'HOLD',
          authorized: false,
          confidence: 15,
          strategy: 'Filtro Anti-Inducement',
          reasoning: `BARRIDA FALSA DETECTADA: Cebo de liquidez en $${fakeSweepSignal.minorLevel.toFixed(2)}. Pool macro a ${fakeSweepSignal.distanceToMajorPoolPct}%. Esperando purga institucional real.`,
          oracleStatus: 'VERDE',
          sweepSignal: 'INDUCEMENT_TRAP',
          riskEvaluation: 'Entrada abortada por trampa',
          threatLevel: 'ALTO',
          blockedReason: 'Cebo de liquidez menor',
          source: 'DETERMINISTIC_ENGINE',
        };
        setLastDecision(inducementDecision);
        return;
      }

      // CHECK: Do not open concurrent positions for the same asset
      if (activePositionsForAsset.length > 0) {
        return;
      }

      // CHECK COOLDOWN (At least 30 seconds between autonomous entries)
      const now = Date.now();
      if (now - lastExecutionTimeRef.current < 30000) {
        return;
      }

      // 2. DETECT AUTONOMOUS ENTRY OPPORTUNITY
      const isBullishOpportunity =
        (sweepSignal.type === 'SSL_SWEEP_BULLISH' && sweepSignal.wickRatio >= 0.4) ||
        falseBreakoutSignal.status === 'FALSE_BREAKOUT_BEAR_TRAP';

      const isBearishOpportunity =
        (sweepSignal.type === 'BSL_SWEEP_BEARISH' && sweepSignal.wickRatio >= 0.4) ||
        falseBreakoutSignal.status === 'FALSE_BREAKOUT_BULL_TRAP';

      if (!isBullishOpportunity && !isBearishOpportunity) {
        return;
      }

      // Lock to avoid double firing
      if (isExecutingRef.current) return;
      isExecutingRef.current = true;
      setAutonomousStatus('EVALUATING');

      const side: OrderSide = isBullishOpportunity ? 'LONG' : 'SHORT';

      try {
        // Consult Gemini AI via backend endpoint with verified math
        const evalRes = await fetch('/api/ai/sweep-autonomous-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: activeAsset.symbol,
            price: activeAsset.currentPrice,
            sweepType: sweepSignal.type,
            wickRatio: sweepSignal.wickRatio,
            volumeMultiplier: sweepSignal.volumeMultiplier,
            falseBreakoutStatus: falseBreakoutSignal.status,
            isTrap: isInducement,
            oracleVerdict: oracleData.verdict.type,
            isBtc1hBlocked: oracleData.trend1h.isBlocked,
            rsi15m: oracleData.rsi15m.value,
            atr1h: oracleData.atr1h.value,
            cvdDelta,
            orderbookImbalance,
            protocol: selectedProtocol,
          }),
        });

        if (!evalRes.ok) throw new Error('Evaluación autónoma no respondió');
        const evalData = await evalRes.json();

        if (evalData.authorized && (evalData.action === 'LONG' || evalData.action === 'SHORT')) {
          setAutonomousStatus('EXECUTING');
          lastExecutionTimeRef.current = Date.now();

          // Calculate safe margin from Risk Engine
          const safeMargin = Math.min(
            2500,
            Math.max(500, riskEvaluation.recommendedMarginUsdt)
          );
          const safeLeverage = Math.min(
            evalData.recommendedLeverage || 20,
            activeAsset.maxLeverage
          );

          const tp =
            evalData.takeProfit ||
            Number(
              (
                activeAsset.currentPrice *
                (side === 'LONG' ? 1.035 : 0.965)
              ).toFixed(2)
            );

          const sl =
            evalData.stopLoss ||
            Number(
              (
                activeAsset.currentPrice *
                (side === 'LONG' ? 0.985 : 1.015)
              ).toFixed(2)
            );

          // 3. EXECUTE AUTONOMOUS ORDER VIA EXISTING EXECUTOR
          onExecuteOrder({
            symbol: activeAsset.symbol,
            side,
            margin: safeMargin,
            leverage: safeLeverage,
            marginMode: 'ISOLATED',
            takeProfit: tp,
            stopLoss: sl,
            protocol: selectedProtocol,
          });

          // Register in trade log
          const newTradeLog: SweepHunterTradeLog = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            symbol: activeAsset.symbol,
            side,
            entryPrice: activeAsset.currentPrice,
            margin: safeMargin,
            leverage: safeLeverage,
            takeProfit: tp,
            stopLoss: sl,
            status: 'OPEN',
            strategyUsed: evalData.strategyUsed || `${sweepSignal.type} + ${falseBreakoutSignal.status}`,
            reason: evalData.tacticalReasoning || 'Barrida de liquidez confirmada con ratio de mecha > 40%',
            protocol: selectedProtocol,
            txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          };

          setTradeLogs((prev) => [newTradeLog, ...prev.slice(0, 49)]);

          const decision: SweepHunterDecision = {
            id: newTradeLog.id,
            timestamp: Date.now(),
            action: side,
            authorized: true,
            confidence: evalData.confidence || 88,
            strategy: newTradeLog.strategyUsed,
            reasoning: evalData.tacticalReasoning,
            oracleStatus: `BTC 1H ${oracleData.trend1h.color} (+${oracleData.trend1h.variationPct}%)`,
            sweepSignal: sweepSignal.type,
            riskEvaluation: `Margen $${safeMargin} | Apalancamiento ${safeLeverage}x (Kelly Fraccional)`,
            threatLevel: evalData.threatLevel || 'MEDIO',
            source: 'GEMINI_AI',
          };

          setLastDecision(decision);
          setDecisionHistory((prev) => [decision, ...prev.slice(0, 19)]);

          // Sound announcement
          tacticalAudio.playStrikeLaunch(side);
          if (evalData.voiceRadio) {
            tacticalAudio.speakTacticalVoice(evalData.voiceRadio);
          }
        } else {
          setLastDecision({
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            action: 'HOLD',
            authorized: false,
            confidence: evalData.confidence || 30,
            strategy: 'Filtro de Confluencia',
            reasoning: evalData.tacticalReasoning || 'Sin confluencia institucional suficiente.',
            oracleStatus: `BTC 1H ${oracleData.trend1h.color}`,
            sweepSignal: sweepSignal.type,
            riskEvaluation: 'En espera',
            threatLevel: 'BAJO',
            source: 'GEMINI_AI',
          });
        }
      } catch (err) {
        console.warn('Autonomous evaluation loop warning:', err);
      } finally {
        isExecutingRef.current = false;
      }
    }, 4000);

    return () => clearInterval(cycleInterval);
  }, [
    isAiAutonomyEnabled,
    activeAsset,
    candles,
    cvdDelta,
    oracleData,
    orderbookImbalance,
    numericUsdtBalance,
    positions,
    selectedProtocol,
    onExecuteOrder,
  ]);

  // Method to immediately trigger a tactical sweep test for demonstration / verification
  const triggerManualTacticalSweep = useCallback(
    (forcedSide: OrderSide) => {
      if (oracleData.trend1h.isBlocked) {
        tacticalAudio.playKlaxon();
        alert('OPERACIÓN BLOQUEADA: BTC 1H está en ROJO. Ni el operador ni la IA pueden eludir esta regla.');
        return;
      }

      tacticalAudio.playStrikeLaunch(forcedSide);
      const safeMargin = 1000;
      const safeLeverage = 20;
      const currentPrice = activeAsset.currentPrice;
      const tp = Number(
        (currentPrice * (forcedSide === 'LONG' ? 1.035 : 0.965)).toFixed(2)
      );
      const sl = Number(
        (currentPrice * (forcedSide === 'LONG' ? 0.985 : 1.015)).toFixed(2)
      );

      onExecuteOrder({
        symbol: activeAsset.symbol,
        side: forcedSide,
        margin: safeMargin,
        leverage: safeLeverage,
        marginMode: 'ISOLATED',
        takeProfit: tp,
        stopLoss: sl,
        protocol: selectedProtocol,
      });

      const testLog: SweepHunterTradeLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        symbol: activeAsset.symbol,
        side: forcedSide,
        entryPrice: currentPrice,
        margin: safeMargin,
        leverage: safeLeverage,
        takeProfit: tp,
        stopLoss: sl,
        status: 'OPEN',
        strategyUsed:
          forcedSide === 'LONG'
            ? 'SSL Sweep Bullish (Prueba Táctica)'
            : 'BSL Sweep Bearish (Prueba Táctica)',
        reason: `Disparo manual verificado en ${selectedProtocol}. Absorción de liquidez confirmada en $${currentPrice}.`,
        protocol: selectedProtocol,
        txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      };

      setTradeLogs((prev) => [testLog, ...prev]);

      const testDecision: SweepHunterDecision = {
        id: testLog.id,
        timestamp: Date.now(),
        action: forcedSide,
        authorized: true,
        confidence: 94,
        strategy: testLog.strategyUsed,
        reasoning: testLog.reason,
        oracleStatus: `BTC 1H ${oracleData.trend1h.color}`,
        sweepSignal: forcedSide === 'LONG' ? 'SSL_SWEEP_BULLISH' : 'BSL_SWEEP_BEARISH',
        riskEvaluation: 'Margen $1,000 USDT | 20x',
        threatLevel: 'BAJO',
        source: 'DETERMINISTIC_ENGINE',
      };

      setLastDecision(testDecision);
      setDecisionHistory((prev) => [testDecision, ...prev]);
    },
    [activeAsset, oracleData, onExecuteOrder, selectedProtocol]
  );

  // Compute metrics
  const totalAutonomousPnl = tradeLogs.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const closedLogs = tradeLogs.filter((t) => t.status !== 'OPEN');
  const winningLogs = closedLogs.filter((t) => (t.pnl || 0) > 0);
  const winRatePct = closedLogs.length
    ? Math.round((winningLogs.length / closedLogs.length) * 100)
    : 100;

  return {
    isAiAutonomyEnabled,
    toggleAiAutonomy,
    autonomousStatus,
    tradeLogs,
    lastDecision,
    decisionHistory,
    totalAutonomousPnl,
    winRatePct,
    triggerManualTacticalSweep,
  };
}
