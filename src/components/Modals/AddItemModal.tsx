import React, { useEffect, useRef, useState } from 'react';
import { MaterialItem, QuoteMaterialItem } from '../../types';
import { formatCurrency, generateTmpSku } from '../../utils/calculations';
import { Check, CheckCircle2, Package, Plus, Search, X } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: MaterialItem[];
  existingTmpCount: number;
  onAddCatalogItem: (item: MaterialItem, qty: number) => void;
  onAddCustomItem: (item: QuoteMaterialItem) => void;
  currencySymbol?: string;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  catalog,
  existingTmpCount,
  onAddCatalogItem,
  onAddCustomItem,
  currencySymbol = '$',
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lastAddedSku, setLastAddedSku] = useState<string | null>(null);
  const [recentlyAddedCount, setRecentlyAddedCount] = useState<number>(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customNameRef = useRef<HTMLInputElement>(null);

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState('0.00');
  const [customUnit, setCustomUnit] = useState('each');

  // Focus search input when modal opens or tab changes to catalog
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (activeTab === 'catalog') {
          searchInputRef.current?.focus();
        } else {
          customNameRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Wiring & Cables',
    'Breakers & Panels',
    'Conduits & Fittings',
    'Lighting & Fixtures',
    'Metering & Switchgear',
    'Transformers & Heavy',
  ];

  const filteredCatalog = catalog.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term && selectedCategory === 'All') return true;

    const matchesSearch =
      !term ||
      m.Item.toLowerCase().includes(term) ||
      m.SKU.toLowerCase().includes(term) ||
      (m.Category && m.Category.toLowerCase().includes(term));
    const matchesCategory =
      selectedCategory === 'All' || m.Category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConfirmCatalogAdd = (item: MaterialItem, qty: number) => {
    onAddCatalogItem(item, qty);
    setRecentlyAddedCount((prev) => prev + 1);
    setLastAddedSku(item.SKU);

    // Reset quantity input element for this item
    const inputEl = document.getElementById(`qty-input-${item.SKU}`) as HTMLInputElement;
    if (inputEl) {
      inputEl.value = '1';
    }

    // Clear search term and keep focus on the search field
    setSearchTerm('');
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 0);

    // Reset last added indicator after 2 seconds
    setTimeout(() => {
      setLastAddedSku((current) => (current === item.SKU ? null : current));
    }, 2000);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCatalog.length > 0) {
        const topItem = filteredCatalog[0];
        const inputEl = document.getElementById(`qty-input-${topItem.SKU}`) as HTMLInputElement;
        const qty = parseFloat(inputEl?.value || '1') || 1;
        handleConfirmCatalogAdd(topItem, qty);
      }
    }
  };

  const handleConfirmCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: QuoteMaterialItem = {
      id: `custom-${Date.now()}`,
      SKU: generateTmpSku(existingTmpCount + recentlyAddedCount),
      Item: customName.trim(),
      Unit: customUnit.trim() || 'each',
      Qty: customQty || 1,
      Price: parseFloat(customPrice) || 0,
      isCustom: true,
    };

    onAddCustomItem(newItem);
    setRecentlyAddedCount((prev) => prev + 1);
    setCustomName('');
    setCustomQty(1);
    setCustomPrice('0.00');

    // Keep focus on custom item name input for rapid entry
    setTimeout(() => {
      customNameRef.current?.focus();
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="surface-card w-full max-w-2xl border border-[#2E3A56] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#232A3E] flex items-center justify-between bg-[#121623]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Add Materials to Job</span>
              {recentlyAddedCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono">
                  +{recentlyAddedCount} added
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Search and add items continuously. The search field clears and keeps focus automatically.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-[#1E2538] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#232A3E] bg-[#141824] p-1.5 gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-[#1E273C] text-[#c0c1ff] border border-[#303E60] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>From Inventory Catalog ({catalog.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-[#1E273C] text-[#c0c1ff] border border-[#303E60] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom / Unlisted Item</span>
          </button>
        </div>

        {/* Tab 1: Catalog Picker */}
        {activeTab === 'catalog' && (
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 flex flex-col min-h-0">
            {/* Search & Category Filter */}
            <div className="space-y-2 flex-shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search item name, description, or SKU (Press Enter to add first result)..."
                  className="custom-input w-full rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm font-medium"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      searchInputRef.current?.focus();
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#c0c1ff] text-[#121424] font-bold'
                        : 'bg-[#161B29] text-slate-400 hover:text-slate-200 border border-[#232A3E]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-[220px]">
              {filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  No materials match your search. Switch to the "Custom / Unlisted Item" tab to add a custom item.
                </div>
              ) : (
                filteredCatalog.map((item) => {
                  const wasJustAdded = lastAddedSku === item.SKU;
                  return (
                    <div
                      key={item.SKU}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        wasJustAdded
                          ? 'bg-emerald-950/30 border-emerald-600/50 shadow-sm'
                          : 'bg-[#121623] border-[#232A3E] hover:border-[#384566]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                            {item.Item}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-[#192033] px-1.5 py-0.5 rounded border border-[#26314D] flex-shrink-0">
                            {item.SKU}
                          </span>
                          {wasJustAdded && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5 flex-shrink-0">
                              <Check className="w-3 h-3" /> Added!
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Unit: {item.Unit}</span>
                          <span>•</span>
                          <span className="font-mono text-[#c0c1ff] font-bold">
                            {formatCurrency(item.Price, currencySymbol)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          defaultValue={1}
                          id={`qty-input-${item.SKU}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const qty = parseFloat((e.target as HTMLInputElement).value || '1') || 1;
                              handleConfirmCatalogAdd(item, qty);
                            }
                          }}
                          className="w-14 bg-[#0F111A] border border-[#2B354E] rounded px-1.5 py-1 text-center text-xs font-bold text-slate-100 focus:border-[#c0c1ff] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const inputEl = document.getElementById(
                              `qty-input-${item.SKU}`
                            ) as HTMLInputElement;
                            const qty = parseFloat(inputEl?.value || '1') || 1;
                            handleConfirmCatalogAdd(item, qty);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            wasJustAdded
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'btn-accent-purple'
                          }`}
                        >
                          {wasJustAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{wasJustAdded ? 'Added' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Footer Action */}
            <div className="pt-3 border-t border-[#232A3E] flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-400">
                {recentlyAddedCount > 0 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Added {recentlyAddedCount} material item{recentlyAddedCount > 1 ? 's' : ''} to active quote
                  </span>
                ) : (
                  <span>Click Add or press Enter to add materials</span>
                )}
              </span>

              <button
                type="button"
                onClick={onClose}
                className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Custom / Unlisted Item Form */}
        {activeTab === 'custom' && (
          <form onSubmit={handleConfirmCustomAdd} className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Item Name / Description *
              </label>
              <input
                ref={customNameRef}
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Custom stainless steel conduit bracket"
                className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={customQty}
                  onChange={(e) => setCustomQty(parseFloat(e.target.value) || 1)}
                  className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Unit Price ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Auto-Generated SKU
                </label>
                <div className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#c0c1ff] bg-[#0E121C]">
                  {generateTmpSku(existingTmpCount + recentlyAddedCount)}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="each / set / pack"
                  className="custom-input w-full rounded-lg px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#232A3E] flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                {recentlyAddedCount > 0 && (
                  <span className="text-emerald-400 font-semibold">
                    +{recentlyAddedCount} items added to quote
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-transparent border border-[#2B354E] hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold"
                >
                  Done
                </button>
                <button
                  type="submit"
                  className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item to Job</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
