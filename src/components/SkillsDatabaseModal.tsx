import React, { useState } from 'react';
import { TradingSkill } from '../types/trading';
import {
  BookOpen,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
  Target,
  Shield,
} from 'lucide-react';
import { tacticalAudio } from '../utils/audio';

interface SkillsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: TradingSkill[];
  onToggleSkill: (skillId: string) => void;
}

export const SkillsDatabaseModal: React.FC<SkillsDatabaseModalProps> = ({
  isOpen,
  onClose,
  skills,
  onToggleSkill,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', 'SMC', 'WYCKOFF', 'ICT', 'ORDER_FLOW', 'WEB3_FUTURES', 'RISK_MANAGEMENT'];

  const filteredSkills = skills.filter((skill) => {
    const matchCategory = selectedCategory === 'ALL' || skill.category === selectedCategory;
    const matchSearch =
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.description.toLowerCase().includes(search.toLowerCase()) ||
      skill.tacticalApplication.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#070d14] border border-cyan-500/50 rounded-lg tactical-box flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden font-mono-military text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-cyan-900/60 bg-[#091420] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-warfare text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                BASE DE DATOS GLOBAL DE HABILIDADES DE TRADING INSTITUCIONAL
              </h2>
              <p className="text-[11px] text-slate-400">
                Seleccione las metodologías activas que alimentan el radar neuronal de ARES-X.
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

        {/* Filter Bar & Search */}
        <div className="p-3 border-b border-slate-800/80 bg-black/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar habilidad, patrón (ej. FVG, Wyckoff, Order Block)..."
              className="w-full bg-black/80 border border-slate-800 focus:border-cyan-500 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  tacticalAudio.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-black/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className={`p-3 rounded border transition-all flex flex-col justify-between ${
                skill.activeInRadar
                  ? 'bg-[#08121d] border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-black/40 border-slate-900 opacity-60'
              }`}
            >
              <div>
                {/* Header with Title and Radar Toggle */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold uppercase tracking-wider">
                      {skill.category}
                    </span>
                    <h3 className="font-warfare text-sm font-bold text-white mt-1">{skill.name}</h3>
                  </div>

                  <button
                    onClick={() => {
                      tacticalAudio.playClick();
                      onToggleSkill(skill.id);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      skill.activeInRadar
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/70 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                        : 'bg-black/60 text-slate-500 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{skill.activeInRadar ? 'EN RADAR' : 'DESACTIVADA'}</span>
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{skill.description}</p>

                {/* Tactical Application */}
                <div className="bg-black/60 p-2 rounded border border-slate-800/90 mb-2">
                  <span className="text-[10px] text-cyan-400 font-bold block mb-0.5 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    APLICACIÓN TÁCTICA:
                  </span>
                  <p className="text-[11px] text-slate-200">{skill.tacticalApplication}</p>
                </div>

                {/* Tactical Rules Checklist */}
                <div className="mb-2">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">REGLAS DE DISPARO:</span>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {skill.rules.map((rule, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Invalidation threat */}
                <div className="text-[10px] text-rose-400/90 bg-rose-950/20 p-1.5 rounded border border-rose-900/40 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    <strong>INVALIDACIÓN:</strong> {skill.threatCondition}
                  </span>
                </div>
              </div>

              {/* Footer Metrics */}
              <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                <span>
                  WIN RATE EST: <strong className="text-emerald-400">{skill.winRateEst}%</strong>
                </span>
                <span>
                  R:R PROMEDIO: <strong className="text-amber-400">{skill.riskRewardAvg}</strong>
                </span>
                <span className="text-cyan-400 uppercase font-bold">{skill.difficulty}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-cyan-900/60 bg-[#091420] px-4 py-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {skills.filter((s) => s.activeInRadar).length} de {skills.length} habilidades activas en el radar bélico
          </span>
          <button
            onClick={() => {
              tacticalAudio.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
          >
            CONFIRMAR Y VOLVER AL HUD
          </button>
        </div>
      </div>
    </div>
  );
};
