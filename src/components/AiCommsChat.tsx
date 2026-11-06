import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  X,
  Send,
  Volume2,
  Cpu,
  Shield,
  Crosshair,
  User,
  Bot,
  HelpCircle,
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface AiCommsChatProps {
  isOpen: boolean;
  onClose: () => void;
  marketContext: any;
  positions: any[];
}

interface Message {
  id: string;
  sender: 'OPERATOR' | 'ARES';
  text: string;
  time: string;
}

export const AiCommsChat: React.FC<AiCommsChatProps> = ({
  isOpen,
  onClose,
  marketContext,
  positions,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ARES',
      text: 'Canal táctico militar seguro establecido con ARES-X. Los sistemas de vigilancia Web3 y la base de datos de trading mundial están en línea. Comandante, indique sus órdenes o solicite informe de campo.',
      time: new Date().toLocaleTimeString('es-ES', { hour12: false }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    tacticalAudio.playRadioBeep();

    const userMsg: Message = {
      id: Math.random().toString(36),
      sender: 'OPERATOR',
      text,
      time: new Date().toLocaleTimeString('es-ES', { hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat-tactical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          marketContext,
          positions,
        }),
      });

      const data = await res.json();
      const aresMsg: Message = {
        id: Math.random().toString(36),
        sender: 'ARES',
        text: data.reply || 'Transmisión recibida y procesada.',
        time: new Date().toLocaleTimeString('es-ES', { hour12: false }),
      };

      setMessages((prev) => [...prev, aresMsg]);
      tacticalAudio.playRadioBeep();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          sender: 'ARES',
          text: 'Interferencia táctica en el enlace. Repita la transmisión, Comandante.',
          time: new Date().toLocaleTimeString('es-ES', { hour12: false }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    '¿Cuál es el mejor vector de ataque actual para BTC?',
    'Evalúa el riesgo de liquidación de mis posiciones abiertas',
    'Explícame cómo aplicar el Wyckoff Spring en futuros con 20x',
    '¿Hay cascadas de liquidación inminentes en el mercado?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl h-[85vh] bg-[#070d14] border border-emerald-500/50 rounded-lg tactical-box tactical-box-success flex flex-col shadow-[0_0_30px_rgba(16,185,129,0.25)] overflow-hidden font-mono-military text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 bg-[#09181c] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-warfare text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  CANAL DE RADIO TÁCTICO: ARES-X
                </h2>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold">
                  ENCRIPTADO MIL-SPEC
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Enlace directo por satélite con el Comandante de IA y Estrategia Mundial.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 border-b border-slate-800 bg-black/40 flex items-center gap-1.5 overflow-x-auto text-[10px]">
          <span className="text-slate-500 shrink-0">FRECUENCIAS:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-2 py-1 rounded bg-black/70 hover:bg-emerald-950 border border-slate-800 text-slate-300 hover:text-emerald-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat History Messages */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'OPERATOR' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                {m.sender === 'OPERATOR' ? (
                  <>
                    <span>OPERADOR (TÚ)</span>
                    <span className="text-slate-600">|</span>
                    <span>{m.time}</span>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-400 font-bold">ARES-X INTELIGENCIA</span>
                    <span className="text-slate-600">|</span>
                    <span>{m.time}</span>
                    <button
                      onClick={() => tacticalAudio.speakTacticalVoice(m.text)}
                      className="text-cyan-400 hover:text-cyan-300 ml-1 cursor-pointer"
                      title="Escuchar por voz militar"
                    >
                      <Volume2 className="w-3 h-3 inline" />
                    </button>
                  </>
                )}
              </div>

              <div
                className={`p-3 rounded-lg max-w-[85%] leading-relaxed ${
                  m.sender === 'OPERATOR'
                    ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-100'
                    : 'bg-[#091522] border border-emerald-900/50 text-slate-200'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs italic">
              <Cpu className="w-4 h-4 animate-spin" />
              <span>ARES-X decodificando telemetría y formulando estrategia bélica...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800/80 bg-[#091420]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Transmitir orden militar o consulta técnica a ARES-X..."
              className="flex-1 bg-black/80 border border-slate-700 focus:border-emerald-500 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>TRANSMITIR</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
