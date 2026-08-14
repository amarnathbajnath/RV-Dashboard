import React, { useState } from 'react';
import { AppSettings, Client, JobSection, Quote, QuoteMaterialItem } from '../types';
import { calculateItemTotal, formatCurrency } from '../utils/calculations';
import { Download, FileSpreadsheet, FileText, Layers, Plus, Save, Sparkles, Trash2, Upload, UserPlus } from 'lucide-react';

interface JobViewProps {
  quote: Quote | null;
  clients: Client[];
  settings: AppSettings;
  onUpdateQuoteField: <K extends keyof Quote>(field: K, value: Quote[K]) => void;
  onUpdateSectionItem: (sectionIndex: number, itemIndex: number, field: keyof QuoteMaterialItem, value: any) => void;
  onRemoveItem: (sectionIndex: number, itemIndex: number, isTmp?: boolean) => void;
  onOpenAddItemModal: (sectionIndex: number) => void;
  onOpenLabourModal: () => void;
  onSaveJob: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
  onSaveJSON: () => void;
  onLoadJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectClient: (client: Client) => void;
  onNewQuote?: () => void;
  onAddNewSection?: () => void;
  onRemoveSection?: (index: number) => void;
}

export const JobView: React.FC<JobViewProps> = ({
  quote,
  clients,
  settings,
  onUpdateQuoteField,
  onUpdateSectionItem,
  onRemoveItem,
  onOpenAddItemModal,
  onOpenLabourModal,
  onSaveJob,
  onExportPDF,
  onExportCSV,
  onSaveJSON,
  onLoadJSON,
  onSelectClient,
  onNewQuote,
}) => {
  const [showClientPicker, setShowClientPicker] = useState(false);

  if (!quote) {
    return (
      <div className="pb-28">
        <div className="surface-card p-8 sm:p-12 border border-[#262F44] text-center max-w-xl mx-auto my-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#161B29] border border-[#2D3854] flex items-center justify-center text-[#c0c1ff] mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-2 tracking-tight">
            No Active Quote Selected
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            Select an existing quotation from the top toolbar dropdown, start a fresh quote, or load a previously exported job file (.json).
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNewQuote && (
              <button
                type="button"
                onClick={onNewQuote}
                className="btn-accent-purple w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Quote</span>
              </button>
            )}

            <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#161B29] hover:bg-[#1E2538] border border-[#2B354E] hover:border-[#3D4B6E] text-slate-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer">
              <Upload className="w-4 h-4 text-[#c0c1ff]" />
              <span>Load Job File (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={onLoadJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Default to first section if exists
  const primarySection = quote.sections?.[0] || {
    id: 'sec-default',
    title: 'General Materials',
    scope: '',
    materials: [],
    tmpItems: [],
  };

  const totalLabourFormatted = formatCurrency(
    (quote.labourConfig?.labourCost || 0) +
      (quote.labourConfig?.inspectionCost || 0) +
      (quote.labourConfig?.transportCost || 0),
    settings.currencySymbol || '$'
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-28">
      {/* ─────────────────────────────────────────────────────────────
          CARD 1: JOB DETAILS (Matching image.png)
      ───────────────────────────────────────────────────────────── */}
      <section className="surface-card p-4 sm:p-6 shadow-lg shadow-black/20">
        <h2 className="text-base sm:text-lg font-bold text-slate-100 mb-4 tracking-tight">
          Job Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name with Client Selector */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
              CUSTOMER NAME
            </label>
            <div className="relative">
              <input
                type="text"
                value={quote.customer}
                onChange={(e) => onUpdateQuoteField('customer', e.target.value)}
                placeholder="Enter client or company name"
                className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-medium pr-28"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => setShowClientPicker(!showClientPicker)}
                  className="text-xs text-slate-400 hover:text-[#c0c1ff] font-semibold bg-[#1A2133] hover:bg-[#232B42] px-2.5 py-1 rounded border border-[#2B354E] transition-colors flex items-center gap-1"
                >
                  Load Client...
                </button>
              </div>

              {/* Client Picker Dropdown Menu */}
              {showClientPicker && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-[#161B29] border border-[#2F3A56] rounded-xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase border-b border-[#232A3E] bg-[#121622]">
                    Select Existing Client
                  </div>
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectClient(c);
                        setShowClientPicker(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#20273D] text-xs transition-colors flex flex-col border-b border-[#1E2538] last:border-0"
                    >
                      <span className="font-semibold text-slate-200">{c.name}</span>
                      <span className="text-[11px] text-slate-400">{c.company} • {c.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
              ADDRESS
            </label>
            <input
              type="text"
              value={quote.address}
              onChange={(e) => onUpdateQuoteField('address', e.target.value)}
              placeholder="e.g. 100 Industrial Parkway"
              className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-medium"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
              DATE
            </label>
            <input
              type="date"
              value={quote.date}
              onChange={(e) => onUpdateQuoteField('date', e.target.value)}
              className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-medium"
            />
          </div>

          {/* Quote No. */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
              QUOTE NO.
            </label>
            <input
              type="text"
              value={quote.quoteNo}
              onChange={(e) => onUpdateQuoteField('quoteNo', e.target.value)}
              placeholder="RV-Q-2026-005 | RV-E-2-2026-005"
              className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-medium font-mono text-[#c0c1ff]"
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CARD 2: SCOPE OF WORK (Matching image.png)
      ───────────────────────────────────────────────────────────── */}
      <section className="surface-card p-4 sm:p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
            Scope of Work
          </h2>

          <button
            type="button"
            onClick={onOpenLabourModal}
            className="flex items-center gap-1 text-xs font-mono font-semibold text-[#c0c1ff] bg-[#1C2234] hover:bg-[#252E46] border border-[#2D3854] px-3 py-1.5 rounded-lg transition-all"
            title="Configure Labour, Inspection & Crew rates"
          >
            <span>$ Labour Config ({totalLabourFormatted})</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              value={quote.scopeDescription}
              onChange={(e) => onUpdateQuoteField('scopeDescription', e.target.value)}
              placeholder="Standard electrical fit-out and distribution work..."
              className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-normal resize-y min-h-[70px]"
            />
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
              INTERNAL NOTES
            </label>
            <textarea
              rows={2}
              value={quote.internalNotes}
              onChange={(e) => onUpdateQuoteField('internalNotes', e.target.value)}
              placeholder="Initial quote generated for client review..."
              className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-normal resize-y min-h-[50px]"
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CARD 3: MATERIAL LIST (Matching image.png)
      ───────────────────────────────────────────────────────────── */}
      <section className="surface-card p-4 sm:p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
              Material List
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              ({(primarySection.materials?.length || 0) + (primarySection.tmpItems?.length || 0)} items)
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddItemModal(0)}
            className="flex items-center gap-1.5 bg-[#1C2234] hover:bg-[#252E46] border border-[#2D3854] text-[#c0c1ff] hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ITEM</span>
          </button>
        </div>

        {/* Material Items List */}
        <div className="space-y-3">
          {primarySection.materials.length === 0 && primarySection.tmpItems.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#232A3E] rounded-xl bg-[#121623]">
              <p className="text-slate-400 text-sm font-medium mb-3">
                No materials added to this quote yet.
              </p>
              <button
                type="button"
                onClick={() => onOpenAddItemModal(0)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F273C] hover:bg-[#28324D] border border-[#344163] text-[#c0c1ff] text-xs font-bold uppercase tracking-wider transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Materials from Catalog</span>
              </button>
            </div>
          ) : (
            <>
              {/* Standard Catalog Materials */}
              {primarySection.materials.map((item, idx) => {
                const lineTotal = calculateItemTotal(item.Qty, item.Price);
                return (
                  <div
                    key={item.id || `mat-${idx}`}
                    className="bg-[#121623] border border-[#232B40] rounded-xl p-3.5 sm:p-4 hover:border-[#333E5D] transition-colors"
                  >
                    {/* Top Row: Item Title & Delete Button */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm sm:text-base">
                          {item.Item}
                        </span>
                        {item.Unit && (
                          <span className="text-[11px] text-slate-400 font-medium bg-[#1A2133] px-2 py-0.5 rounded border border-[#2A344E]">
                            {item.Unit}
                          </span>
                        )}
                        {item.SKU && item.SKU !== '—' && (
                          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                            [{item.SKU}]
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(0, idx, false)}
                        title="Remove item"
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom Row: 3 Columns for QTY, UNIT PRICE, TOTAL (Exact match to image.png) */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-center">
                      {/* QTY */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          QTY
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.Qty}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              0,
                              idx,
                              'Qty',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="custom-input w-full rounded-lg px-3 py-2 text-center text-sm font-semibold"
                        />
                      </div>

                      {/* UNIT PRICE */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          UNIT PRICE
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.Price ?? ''}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              0,
                              idx,
                              'Price',
                              e.target.value === '' ? null : parseFloat(e.target.value)
                            )
                          }
                          placeholder="0.00"
                          className="custom-input w-full rounded-lg px-3 py-2 text-center text-sm font-semibold"
                        />
                      </div>

                      {/* TOTAL */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-right sm:text-center">
                          TOTAL
                        </label>
                        <div className="custom-input w-full rounded-lg px-3 py-2 text-right sm:text-center text-sm font-mono font-bold text-[#c0c1ff] bg-[#0E121C]">
                          {lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Unlisted / Custom Items */}
              {primarySection.tmpItems.map((item, idx) => {
                const lineTotal = calculateItemTotal(item.Qty, item.Price);
                return (
                  <div
                    key={item.id || `tmp-${idx}`}
                    className="bg-[#121623] border border-[#2D3349] rounded-xl p-3.5 sm:p-4 hover:border-[#414B69] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm sm:text-base">
                          {item.Item}
                        </span>
                        <span className="text-[10px] font-mono text-[#c0c1ff] bg-[#1B2134] px-1.5 py-0.5 rounded border border-[#2E3958]">
                          {item.SKU} (Custom)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(0, idx, true)}
                        title="Remove custom item"
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-center">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          QTY
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.Qty}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              0,
                              idx,
                              'Qty',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="custom-input w-full rounded-lg px-3 py-2 text-center text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          UNIT PRICE
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.Price ?? 0}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              0,
                              idx,
                              'Price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="custom-input w-full rounded-lg px-3 py-2 text-center text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-right sm:text-center">
                          TOTAL
                        </label>
                        <div className="custom-input w-full rounded-lg px-3 py-2 text-right sm:text-center text-sm font-mono font-bold text-[#c0c1ff] bg-[#0E121C]">
                          {lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          PRIMARY ACTIONS (Matching image.png: SAVE JOB, PDF, CSV)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        {/* Prominent SAVE JOB button (Soft purple accent #c0c1ff) */}
        <button
          type="button"
          onClick={onSaveJob}
          className="btn-accent-purple w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer shadow-lg"
        >
          <Save className="w-4 h-4" />
          <span>SAVE JOB</span>
        </button>

        {/* Secondary Grid: PDF & CSV Export */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onExportPDF}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161B29] hover:bg-[#1E2538] border border-[#2B354E] hover:border-[#3D4B6E] text-slate-200 text-sm font-bold tracking-wider transition-all"
          >
            <Download className="w-4 h-4 text-[#c0c1ff]" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#161B29] hover:bg-[#1E2538] border border-[#2B354E] hover:border-[#3D4B6E] text-slate-200 text-sm font-bold tracking-wider transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#c0c1ff]" />
            <span>CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
