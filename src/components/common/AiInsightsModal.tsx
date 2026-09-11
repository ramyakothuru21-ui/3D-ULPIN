import React from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, Building2, MapPin, Layers } from 'lucide-react';
import { LoadedDataset } from '../../services/dataService';
import { generateCadastralInsights } from '../../services/aiInsightsService';

interface AiInsightsModalProps {
  data: LoadedDataset;
  onClose: () => void;
  onJumpToEntity?: (parcelId?: string, buildingId?: string) => void;
}

export const AiInsightsModal: React.FC<AiInsightsModalProps> = ({
  data,
  onClose,
  onJumpToEntity
}) => {
  const insights = React.useMemo(() => {
    return generateCadastralInsights(data);
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-brand-900 to-cyan-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Cadastral AI Insights Engine</h3>
              <p className="text-xs text-slate-300">
                Deterministic rule-based spatial analytics derived directly from CSV data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice of Transparency */}
        <div className="px-5 py-3 bg-cyan-50/80 border-b border-cyan-100 flex items-center gap-2 text-xs text-cyan-900 font-medium">
          <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
          <span>
            <strong>Transparency Guarantee:</strong> Statements are calculated deterministically across the 100 parcels, 100 buildings, and 986 vertical units without synthetic AI hallucinations.
          </span>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          {insights.map(ins => (
            <div
              key={ins.id}
              className="p-4 bg-slate-50 hover:bg-brand-50/40 rounded-2xl border border-slate-200 hover:border-brand-300 transition space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-brand-700 border border-slate-200">
                  {ins.category}
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Rule Verified ({ins.confidenceScore}%)</span>
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">{ins.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{ins.description}</p>

              {ins.highlightedParcelId && onJumpToEntity && (
                <div className="pt-2 flex items-center justify-end">
                  <button
                    onClick={() => {
                      onJumpToEntity(ins.highlightedParcelId, ins.highlightedBuildingId);
                      onClose();
                    }}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                  >
                    <span>Locate {ins.highlightedParcelId} on GIS Map</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Target Jurisdiction: Duvvada, Visakhapatnam, Andhra Pradesh</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
