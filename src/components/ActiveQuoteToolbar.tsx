import React from 'react';
import { Quote, QuoteStatus } from '../types';
import { ChevronDown, Copy, Download, Plus, Trash2, Upload } from 'lucide-react';
import { calculateQuoteFinancials, formatCurrency } from '../utils/calculations';

interface ActiveQuoteToolbarProps {
  quotes: Quote[];
  activeQuote: Quote | null;
  onSelectQuote: (quoteId: string) => void;
  onNewQuote: () => void;
  onUpdateStatus: (status: QuoteStatus) => void;
  onDuplicateQuote: () => void;
  onDeleteQuote: () => void;
  onSaveJSON: () => void;
  onLoadJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currencySymbol?: string;
}

export const ActiveQuoteToolbar: React.FC<ActiveQuoteToolbarProps> = ({
  quotes,
  activeQuote,
  onSelectQuote,
  onNewQuote,
  onUpdateStatus,
  onDuplicateQuote,
  onDeleteQuote,
  onSaveJSON,
  onLoadJSON,
  currencySymbol = '$',
}) => {
  return (
    <div className="bg-[#101420] border-b border-[#232A3E] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Active Quote Picker, New Quote & In-line Download / Load Job buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase flex-shrink-0">
            ACTIVE QUOTE:
          </span>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <select
              value={activeQuote?.id || ''}
              onChange={(e) => onSelectQuote(e.target.value)}
              className="w-full appearance-none bg-[#161B29] border border-[#2B354E] hover:border-[#3B486A] text-slate-200 text-xs sm:text-sm font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-[#c0c1ff] transition-all cursor-pointer truncate"
            >
              <option value="" className="bg-[#161B29] text-slate-400 italic">
                {quotes.length === 0 ? '-- No Quotes Available --' : '-- Select Active Quote --'}
              </option>
              {quotes.map((q) => {
                const fin = calculateQuoteFinancials(q);
                const customer = q.customer || 'Unnamed Job';
                return (
                  <option key={q.id} value={q.id} className="bg-[#161B29] text-slate-200 py-1">
                    {q.quoteNo || 'Draft'} - {customer} ({formatCurrency(fin.grandTotal, currencySymbol)})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* In-Line Action Buttons (+ New Quote, Download Job, Load Job) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onNewQuote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B29] border border-[#2B354E] hover:border-[#c0c1ff] text-[#c0c1ff] hover:bg-[#1D2438] text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Quote</span>
            </button>

            <button
              type="button"
              onClick={onSaveJSON}
              disabled={!activeQuote}
              title={activeQuote ? `Download ${activeQuote.quoteNo || 'Quote'} as a standalone JSON file` : 'Select a quote first'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B29] border border-[#2B354E] hover:border-[#3D4B6E] disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 hover:text-white text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#c0c1ff]" />
              <span>Download Quote JSON</span>
            </button>

            <label
              title="Load one or more Quote JSON files into the app"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B29] border border-[#2B354E] hover:border-[#3D4B6E] text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#c0c1ff]" />
              <span>Load Quote JSON(s)</span>
              <input
                type="file"
                accept=".json"
                multiple
                onChange={onLoadJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Right: Status selector and Quote actions (enabled only when activeQuote exists) */}
        {activeQuote && (
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                STATUS:
              </span>

              <div className="relative">
                <select
                  value={activeQuote.status}
                  onChange={(e) => onUpdateStatus(e.target.value as QuoteStatus)}
                  className={`appearance-none text-xs font-bold uppercase rounded-lg px-3 py-1.5 pr-7 border cursor-pointer focus:outline-none transition-all ${
                    activeQuote.status === 'approved'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                      : activeQuote.status === 'in_progress'
                      ? 'bg-blue-950/60 text-blue-300 border-blue-700/60'
                      : activeQuote.status === 'completed'
                      ? 'bg-purple-950/70 text-purple-300 border-purple-700/60'
                      : activeQuote.status === 'declined'
                      ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                      : 'bg-[#161B29] text-slate-300 border-[#2B354E]'
                  }`}
                >
                  <option value="draft" className="bg-[#161B29] text-slate-300">DRAFT</option>
                  <option value="sent" className="bg-[#161B29] text-amber-300">SENT</option>
                  <option value="approved" className="bg-[#161B29] text-emerald-300">APPROVED</option>
                  <option value="in_progress" className="bg-[#161B29] text-blue-300">IN PROGRESS</option>
                  <option value="completed" className="bg-[#161B29] text-purple-300">COMPLETED</option>
                  <option value="declined" className="bg-[#161B29] text-rose-300">DECLINED</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Actions (Duplicate & Delete) */}
            <div className="flex items-center gap-1 pl-2 border-l border-[#232A3E]">
              <button
                type="button"
                onClick={onDuplicateQuote}
                title="Duplicate Quote"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1B2236] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {quotes.length > 0 && (
                <button
                  type="button"
                  onClick={onDeleteQuote}
                  title="Delete Quote"
                  className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
