import { TradingSkill } from '../types/trading';

export const TRADING_SKILLS_DATABASE: TradingSkill[] = [
  {
    id: 'smc-order-blocks',
    name: 'Order Blocks Institucionales (SMC)',
    category: 'SMC',
    difficulty: 'OPERADOR',
    winRateEst: 78,
    riskRewardAvg: '1:3.8',
    description: 'Última vela contraria antes de un impulso violento que rompe la estructura del mercado (BOS/ChoCh), dejando órdenes institucionales pendientes.',
    tacticalApplication: 'Entrada precisa en la zona de mitigación (50% del Order Block) con stop loss inmediatamente detrás del extremo.',
    rules: [
      'Identificar rompimiento claro de estructura (BOS) con desplazamiento',
      'Verificar presencia de Fair Value Gap (FVG) contiguo',
      'Esperar retroceso a zona Discount (para Long) o Premium (para Short)',
      'Confirmar entrada con vela de rechazo en temporalidad menor'
    ],
    threatCondition: 'Si el precio cierra con cuerpo más allá del 100% del OB, la tesis queda inmediatamente invalidada.',
    activeInRadar: true,
  },
  {
    id: 'smc-fvg-inbalance',
    name: 'Fair Value Gaps (FVG) & Ineficiencias',
    category: 'SMC',
    difficulty: 'CADETE',
    winRateEst: 74,
    riskRewardAvg: '1:3.0',
    description: 'Desequilibrio algorítmico de 3 velas donde la mecha de la vela 1 y la mecha de la vela 3 no se solapan, creando un imán de liquidez.',
    tacticalApplication: 'Disparo de entrada al tocar el 50% (Consequent Encroachment) del gap para reequilibrar la entrega de precio.',
    rules: [
      'Localizar FVG en temporalidad mayor (15m o 1h)',
      'Filtrar solo gaps en dirección de la tendencia algorítmica',
      'Entrar en el nivel medio del gap (CE 50%)',
      'Target en el siguiente pool de liquidez externa'
    ],
    threatCondition: 'Gaps llenados con excesiva violencia pueden indicar cambio de régimen, no retroceso.',
    activeInRadar: true,
  },
  {
    id: 'wyckoff-spring-c',
    name: 'Wyckoff Spring (Fase C de Acumulación)',
    category: 'WYCKOFF',
    difficulty: 'COMANDANTE',
    winRateEst: 84,
    riskRewardAvg: '1:4.5',
    description: 'Trampa bajista institucional diseñada para barrer los stop loss de los compradores minoristas y capturar liquidez antes del markup exponencial.',
    tacticalApplication: 'Ataque táctico Long agresivo cuando el precio perfora el soporte del rango y recupera rápidamente la zona en menos de 3 velas.',
    rules: [
      'Rango lateral prolongado con volumen decreciente (Fase A y B)',
      'Perforación falsa del soporte mínimo con mecha de absorción',
      'Volumen ultra alto en el punto bajo que no logra continuar cayendo',
      'Reingreso al rango: confirmación del Spring y disparo de compra'
    ],
    threatCondition: 'Si el precio rompe y se mantiene por debajo con alto volumen, se convierte en Sign of Weakness (SOW) y se aborta.',
    activeInRadar: true,
  },
  {
    id: 'wyckoff-utad-dist',
    name: 'Wyckoff UTAD (Upthrust After Distribution)',
    category: 'WYCKOFF',
    difficulty: 'COMANDANTE',
    winRateEst: 82,
    riskRewardAvg: '1:4.2',
    description: 'Falsa ruptura alcista en máximos de rango distributivo para inducir FOMO minorista antes de una liquidación masiva a la baja.',
    tacticalApplication: 'Ataque táctico Short al confirmarse la reentrada bajo la resistencia histórica del rango con volumen de ventas institucional.',
    rules: [
      'Rango de distribución en zona Premium macro',
      'Ruptura de nuevos máximos sin continuidad real',
      'Divergencia bajista extrema en volumen y CVD',
      'Vela de cierre bajista engolfante dentro del rango: orden Short'
    ],
    threatCondition: 'Ruptura con volumen creciente y soporte consolidado por encima anula la distribución.',
    activeInRadar: true,
  },
  {
    id: 'ict-judas-swing',
    name: 'ICT Judas Swing & Killzones (Londres/NY)',
    category: 'ICT',
    difficulty: 'OPERADOR',
    winRateEst: 76,
    riskRewardAvg: '1:3.2',
    description: 'Movimiento de distracción institucional ejecutado en los primeros 30-45 minutos de la sesión de Londres (02:00-05:00 UTC) o Nueva York (12:00-15:00 UTC).',
    tacticalApplication: 'Esperar la toma de liquidez del rango asiático (Asian High/Low) y ejecutar en dirección opuesta con el verdadero flujo.',
    rules: [
      'Marcar máximos y mínimos de la sesión asiática',
      'Observar la apertura de Londres: búsqueda de sweep agresivo',
      'Identificar cambio de estructura interna (m1 o m5)',
      'Ejecutar contra la trampa con objetivo en el extremo opuesto del día'
    ],
    threatCondition: 'Noticias macroeconómicas de alto impacto (FOMC / CPI) pueden invalidar la estructura habitual de Killzone.',
    activeInRadar: true,
  },
  {
    id: 'orderflow-cvd-divergence',
    name: 'CVD Divergence & Delta Absorption',
    category: 'ORDER_FLOW',
    difficulty: 'COMANDANTE',
    winRateEst: 86,
    riskRewardAvg: '1:3.6',
    description: 'Divergencia entre la acción del precio y el Cumulative Volume Delta (CVD). Ocurre cuando el precio hace nuevos mínimos pero el delta comprador aumenta.',
    tacticalApplication: 'Detección de absorción pasiva institucional mediante órdenes límite en el book. Señal de inminente reversión explosiva.',
    rules: [
      'Monitorear el delta de mercado agresivo frente a las órdenes límite pasivas',
      'Confirmar que grandes órdenes de venta de mercado no logran bajar el precio',
      'Identificar cluster de volumen denso en el footprint',
      'Ejecutar en la dirección de la absorción institucional'
    ],
    threatCondition: 'Si el libro de órdenes pasivo es retirado (spoofing), puede ocurrir un vacío de liquidez.',
    activeInRadar: true,
  },
  {
    id: 'web3-liquidation-squeeze',
    name: 'Web3 Futures Liquidation Cascades (Squeeze Hunting)',
    category: 'WEB3_FUTURES',
    difficulty: 'COMANDANTE',
    winRateEst: 88,
    riskRewardAvg: '1:5.0',
    description: 'Identificación de clusters de liquidación masiva en exchanges de futuros descentralizados y centralizados donde se concentran los stop loss.',
    tacticalApplication: 'Cazar el rebote de agotamiento justo después de que la cascada de liquidaciones termina de ejecutarse.',
    rules: [
      'Mapear niveles con alta densidad de liquidaciones estimadas',
      'Esperar la vela de mecha gigante con pico extremo de volumen',
      'Comprobar tasa de financiamiento (Funding Rate) extremadamente desbalanceada',
      'Entrar en contra del consenso sobre-apalancado con apalancamiento controlado'
    ],
    threatCondition: 'Desapalancamiento sistémico global puede prolongar la caída más allá del soporte estimado.',
    activeInRadar: true,
  },
  {
    id: 'risk-kelly-military',
    name: 'Blindaje Bélico: Matriz Kelly & Preservación de Capital',
    category: 'RISK_MANAGEMENT',
    difficulty: 'CADETE',
    winRateEst: 95,
    riskRewardAvg: '1:3.0',
    description: 'Protocolo matemático estricto de tamaño de posición para garantizar que la cuenta nunca sufra una liquidación catastrófica.',
    tacticalApplication: 'Nunca arriesgar más del 1% al 2% del balance total por operación, fijando el precio de liquidación a más del 20% de distancia.',
    rules: [
      'Fijar Stop Loss innegociable antes de ingresar a la posición',
      'Ajustar el apalancamiento en base a la distancia del Stop Loss',
      'Mover a Break Even (BE) inmediatamente al alcanzar Target 1 (+1.5R)',
      'Toma de ganancias parciales del 50% para financiar el riesgo restante'
    ],
    threatCondition: 'Operar sin Stop Loss o hacer revenge trading activa el protocolo de bloqueo automático del sistema.',
    activeInRadar: true,
  }
];
