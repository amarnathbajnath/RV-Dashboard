import React from 'react';
import { CalculationBreakdown } from '../types';
import { formatCurrency } from '../utils/calculations';

interface StickySummaryFooterProps {
  financials: CalculationBreakdown;
  markupPct: number;
  vatPct: number;
  onUpdateMarkupPct: (val: number) => void;
  onUpdateVatPct: (val: number) => void;
  currencySymbol?: string;
  onOpenLabourModal?: () => void;
}

export const StickySummaryFooter: React.FC<StickySummaryFooterProps> = ({
  financials,
  markupPct,
  vatPct,
  onUpdateMarkupPct,
  onUpdateVatPct,
  currencySymbol = '$',
  onOpenLabourModal,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#161B29]/95 backdrop-blur-md border-t border-[#2A344E] sticky-footer-shadow px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-4">
        {/* Left/Center: Line Item Calculations Breakdown */}
        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm">
          {/* Materials */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Materials:</span>
            <span className="font-mono font-bold text-slate-100">
              {formatCurrency(financials.materialsSubtotal, currencySymbol)}
              {financials.hasUnpricedItems && (
                <span className="text-amber-400 text-xs ml-1 font-sans" title="Has unpriced items">
                  +N/A
                </span>
              )}
            </span>
          </div>

          {/* Labour */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Labour:</span>
            <button
              type="button"
              onClick={onOpenLabourModal}
              title="Click to configure labour and inspection"
              className="font-mono font-bold text-slate-100 hover:text-[#c0c1ff] underline-offset-2 hover:underline transition-colors"
            >
              {formatCurrency(financials.labourTotal + financials.inspectionTotal + financials.transportTotal, currencySymbol)}
            </button>
          </div>

          {/* Markup % & Calculated Amount */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              Markup (
              <input
                type="number"
                min="0"
                max="999"
                step="0.5"
                value={markupPct}
                onChange={(e) => onUpdateMarkupPct(parseFloat(e.target.value) || 0)}
                className="w-11 sm:w-12 text-center bg-[#0F111A] border border-[#2B354E] rounded px-1 py-0.5 text-xs text-[#c0c1ff] font-bold focus:outline-none focus:border-[#c0c1ff]"
              />
              %):
            </span>
            <span className="font-mono font-bold text-slate-100">
              {formatCurrency(financials.markupAmount, currencySymbol)}
            </span>
          </div>

          {/* VAT % & Calculated Amount */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              VAT (
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={vatPct}
                onChange={(e) => onUpdateVatPct(parseFloat(e.target.value) || 0)}
                className="w-11 sm:w-12 text-center bg-[#0F111A] border border-[#2B354E] rounded px-1 py-0.5 text-xs text-[#c0c1ff] font-bold focus:outline-none focus:border-[#c0c1ff]"
              />
              %):
            </span>
            <span className="font-mono font-bold text-slate-100">
              {formatCurrency(financials.vatAmount, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Right: Total Quoted (Prominent bold typography matching image.png) */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-1 md:pt-0 border-t border-[#232A3E] md:border-t-0">
          <span className="text-xs sm:text-sm font-bold tracking-wide text-slate-300 uppercase">
            Total Quoted
          </span>
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#c0c1ff] font-condensed tracking-tight">
            {formatCurrency(financials.grandTotal, currencySymbol)}
          </div>
        </div>
      </div>
    </footer>
  );
};
