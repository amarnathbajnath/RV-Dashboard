import React from 'react';
import { AppSettings, MaterialItem, Quote } from '../types';
import { calculateQuoteFinancials, formatCurrency } from '../utils/calculations';
import { Briefcase, DollarSign, Plus, TrendingUp } from 'lucide-react';

interface DashboardViewProps {
  quotes: Quote[];
  materials: MaterialItem[];
  settings: AppSettings;
  onSelectQuote: (quoteId: string) => void;
  onNewQuote: () => void;
  onSwitchToTab: (tab: 'jobs' | 'inventory' | 'clients') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotes,
  settings,
  onSelectQuote,
  onNewQuote,
  onSwitchToTab,
}) => {
  const currency = settings.currencySymbol || '$';

  // Calculate high-level KPIs
  let totalQuotedRevenue = 0;
  let approvedPipelineRevenue = 0;
  let activeJobsCount = 0;
  let draftQuotesCount = 0;

  quotes.forEach((q) => {
    const fin = calculateQuoteFinancials(q);
    totalQuotedRevenue += fin.grandTotal;

    if (q.status === 'approved' || q.status === 'in_progress') {
      approvedPipelineRevenue += fin.grandTotal;
      activeJobsCount++;
    } else if (q.status === 'draft') {
      draftQuotesCount++;
    }
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Executive KPI Cards - 3 Columns without Stock Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Quoted Pipeline */}
        <div className="surface-card p-4 sm:p-5 border border-[#262F44] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Quoted Value
            </span>
            <div className="p-2 rounded-lg bg-[#1D253A] text-[#c0c1ff]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-condensed tracking-tight">
            {formatCurrency(totalQuotedRevenue, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Across {quotes.length} total commercial quotes
          </p>
        </div>

        {/* Approved / Active Jobs */}
        <div className="surface-card p-4 sm:p-5 border border-[#262F44] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Approved Pipeline
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-condensed tracking-tight">
            {formatCurrency(approvedPipelineRevenue, currency)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeJobsCount} active contracts in progress
          </p>
        </div>

        {/* Active Drafts */}
        <div className="surface-card p-4 sm:p-5 border border-[#262F44] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Drafts
            </span>
            <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-condensed tracking-tight">
            {draftQuotesCount}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pending final client transmission
          </p>
        </div>
      </div>

      {/* Quick Launch Banner */}
      <div className="surface-card p-5 sm:p-6 bg-gradient-to-r from-[#171C2B] to-[#1D253A] border border-[#2C3754] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>Risha Vishal Electrical & Construction Co. Ltd.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Commercial job costing, accurate material pricing, automatic 15% markups, 12.5% VAT and one-click PDF quotations.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewQuote}
          className="btn-accent-purple px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quote</span>
        </button>
      </div>

      {/* Recent Quotes Table Card */}
      <div className="surface-card p-4 sm:p-6 border border-[#262F44]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
            Recent Job Quotes
          </h2>
          <button
            onClick={() => onSwitchToTab('jobs')}
            className="text-xs text-[#c0c1ff] hover:text-white font-semibold flex items-center gap-1"
          >
            <span>Open Job Editor</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#232B40] text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="pb-3 pr-4 font-semibold">Quote No.</th>
                <th className="pb-3 pr-4 font-semibold">Customer / Company</th>
                <th className="pb-3 pr-4 font-semibold hidden md:table-cell">Date</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Quoted Total</th>
                <th className="pb-3 text-center pl-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D253A]">
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No job quotes created yet. Click <button onClick={onNewQuote} className="text-[#c0c1ff] underline font-semibold ml-1">Create New Quote</button> to start.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  const fin = calculateQuoteFinancials(q);
                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-[#1A2133] transition-colors cursor-pointer group"
                      onClick={() => {
                        onSelectQuote(q.id);
                        onSwitchToTab('jobs');
                      }}
                    >
                      <td className="py-3 pr-4 font-mono font-bold text-[#c0c1ff]">
                        {q.quoteNo || 'Untitled'}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-slate-200">{q.customer || 'Unnamed Job'}</div>
                        <div className="text-xs text-slate-500">{q.address}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-400 hidden md:table-cell">
                        {q.date}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            q.status === 'approved'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
                              : q.status === 'in_progress'
                              ? 'bg-blue-950/70 text-blue-300 border-blue-700/60'
                              : q.status === 'completed'
                              ? 'bg-purple-950/70 text-purple-300 border-purple-700/60'
                              : q.status === 'declined'
                              ? 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                              : 'bg-slate-800/70 text-slate-300 border-slate-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(fin.grandTotal, currency)}
                      </td>
                      <td className="py-3 text-center pl-4">
                        <span className="text-xs text-[#c0c1ff] group-hover:underline font-semibold">
                          Edit
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
