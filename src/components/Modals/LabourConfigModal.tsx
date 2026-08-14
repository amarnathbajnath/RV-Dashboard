import React, { useState } from 'react';
import { LabourConfig } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { Calculator, Check, DollarSign, ShieldCheck, Truck, Users, X } from 'lucide-react';

interface LabourConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LabourConfig;
  onSaveConfig: (config: LabourConfig) => void;
  currencySymbol?: string;
}

export const LabourConfigModal: React.FC<LabourConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  currencySymbol = '$',
}) => {
  const [labourCost, setLabourCost] = useState<number>(config?.labourCost || 0);
  const [inspectionCost, setInspectionCost] = useState<number>(config?.inspectionCost || 0);
  const [hourlyRate, setHourlyRate] = useState<number>(config?.hourlyRate || 65);
  const [estimatedHours, setEstimatedHours] = useState<number>(config?.estimatedHours || 8);
  const [crewSize, setCrewSize] = useState<number>(config?.crewSize || 2);
  const [transportCost, setTransportCost] = useState<number>(config?.transportCost || 0);

  if (!isOpen) return null;

  const calculatedLabour = Number((estimatedHours * hourlyRate * crewSize).toFixed(2));
  const totalLabourPackage = Number(
    (labourCost + inspectionCost + transportCost).toFixed(2)
  );

  const handleApplyCalculatedLabour = () => {
    setLabourCost(calculatedLabour);
  };

  const handleSave = () => {
    onSaveConfig({
      labourCost: Math.max(0, labourCost),
      inspectionCost: Math.max(0, inspectionCost),
      hourlyRate,
      estimatedHours,
      crewSize,
      transportCost: Math.max(0, transportCost),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="surface-card w-full max-w-lg border border-[#2E3A56] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#232A3E] flex items-center justify-between bg-[#121623]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#1B2236] text-[#c0c1ff]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-wider">
                Labour & Inspection Configuration
              </h3>
              <p className="text-xs text-slate-400">
                Added directly at face value after markup and VAT calculations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-[#1E2538] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Main Direct Labour Fee */}
          <div className="bg-[#121623] p-4 rounded-xl border border-[#262F44] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Direct Labour Cost ({currencySymbol})
              </label>
              <span className="text-xs font-mono font-bold text-[#c0c1ff]">
                {formatCurrency(labourCost, currencySymbol)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={labourCost}
                onChange={(e) => setLabourCost(parseFloat(e.target.value) || 0)}
                className="custom-input w-full rounded-lg pl-8 pr-3.5 py-2.5 text-base font-bold font-mono"
              />
            </div>

            {/* Interactive Hours & Crew Calculator */}
            <div className="pt-3 border-t border-[#1F273C] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold">
                  <Calculator className="w-3.5 h-3.5 text-[#c0c1ff]" />
                  <span>Crew Rate Estimator</span>
                </span>
                <span className="font-mono text-slate-300">
                  {estimatedHours}h × ${hourlyRate}/h × {crewSize} electricians = ${calculatedLabour.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 1)}
                    className="custom-input w-full rounded px-2 py-1.5 text-center text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="5"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 1)}
                    className="custom-input w-full rounded px-2 py-1.5 text-center text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Crew Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={crewSize}
                    onChange={(e) => setCrewSize(parseInt(e.target.value, 10) || 1)}
                    className="custom-input w-full rounded px-2 py-1.5 text-center text-xs font-semibold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyCalculatedLabour}
                className="w-full py-1.5 rounded-lg bg-[#1B2338] hover:bg-[#25304E] border border-[#2B3654] text-xs font-semibold text-[#c0c1ff] transition-all flex items-center justify-center gap-1"
              >
                <span>Apply Calculated Labour ({formatCurrency(calculatedLabour, currencySymbol)})</span>
              </button>
            </div>
          </div>

          {/* Inspection & Compliance Fee */}
          <div className="bg-[#121623] p-4 rounded-xl border border-[#262F44] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Electrical Inspection Certificate Fee</span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatCurrency(inspectionCost, currencySymbol)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Government / T&TEC Electrical Inspectorate certification and sign-off fee.
            </p>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={inspectionCost}
                onChange={(e) => setInspectionCost(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="custom-input w-full rounded-lg pl-8 pr-3.5 py-2 text-sm font-semibold font-mono"
              />
            </div>
          </div>

          {/* Transport & Mobilization Fee */}
          <div className="bg-[#121623] p-4 rounded-xl border border-[#262F44] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Site Transport & Mobilization</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-400">
                {formatCurrency(transportCost, currencySymbol)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={transportCost}
                onChange={(e) => setTransportCost(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="custom-input w-full rounded-lg pl-8 pr-3.5 py-2 text-sm font-semibold font-mono"
              />
            </div>
          </div>

          {/* Combined Total Preview */}
          <div className="p-3.5 rounded-xl bg-[#161B29] border border-[#2B354E] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Total Labour Package:
            </span>
            <span className="text-lg font-mono font-extrabold text-[#c0c1ff]">
              {formatCurrency(totalLabourPackage, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#232A3E] bg-[#121623] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-transparent border border-[#2B354E] hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Update Labour Config</span>
          </button>
        </div>
      </div>
    </div>
  );
};
