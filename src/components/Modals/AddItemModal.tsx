import React, { useState } from 'react';
import { MaterialItem, QuoteMaterialItem } from '../../types';
import { formatCurrency, generateTmpSku } from '../../utils/calculations';
import { Check, Package, Plus, Search, X } from 'lucide-react';

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
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<MaterialItem | null>(null);
  const [catalogQty, setCatalogQty] = useState(1);

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState('0.00');
  const [customUnit, setCustomUnit] = useState('each');

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
    const matchesSearch =
      m.Item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.SKU.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || m.Category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConfirmCatalogAdd = (item: MaterialItem, qty: number) => {
    onAddCatalogItem(item, qty);
    onClose();
  };

  const handleConfirmCustomAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: QuoteMaterialItem = {
      id: `custom-${Date.now()}`,
      SKU: generateTmpSku(existingTmpCount),
      Item: customName.trim(),
      Unit: customUnit.trim() || 'each',
      Qty: customQty || 1,
      Price: parseFloat(customPrice) || 0,
      isCustom: true,
    };

    onAddCustomItem(newItem);
    onClose();
    setCustomName('');
    setCustomQty(1);
    setCustomPrice('0.00');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="surface-card w-full max-w-2xl border border-[#2E3A56] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#232A3E] flex items-center justify-between bg-[#121623]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-wider">
              Add Materials to Job
            </h3>
            <p className="text-xs text-slate-400">
              Pick verified stock from the electrical catalog or create custom unlisted fittings.
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
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
            {/* Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search item name, description, or SKU..."
                  className="custom-input w-full rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
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
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs italic">
                  No materials match your search. Switch to the "Custom / Unlisted Item" tab to add a custom item.
                </div>
              ) : (
                filteredCatalog.map((item) => (
                  <div
                    key={item.SKU}
                    className="p-3 rounded-xl bg-[#121623] border border-[#232A3E] hover:border-[#384566] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                          {item.Item}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-[#192033] px-1.5 py-0.5 rounded border border-[#26314D] flex-shrink-0">
                          {item.SKU}
                        </span>
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
                        min="1"
                        step="any"
                        defaultValue={1}
                        id={`qty-input-${item.SKU}`}
                        className="w-12 bg-[#0F111A] border border-[#2B354E] rounded px-1.5 py-1 text-center text-xs font-bold text-slate-100"
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
                        className="btn-accent-purple px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))
              )}
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
                  {generateTmpSku(existingTmpCount)}
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

            <div className="pt-3 border-t border-[#232A3E] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-transparent border border-[#2B354E] hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Add Item to Job
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
