import React, { useMemo, useState } from 'react';
import { AppSettings, MaterialItem } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Check, Filter, Package, Plus, RefreshCw, Search } from 'lucide-react';

interface InventoryViewProps {
  materials: MaterialItem[];
  settings: AppSettings;
  onRefreshMaterials: () => void;
  isLoadingMaterials: boolean;
  onAddItemToActiveQuote: (item: MaterialItem, qty: number) => void;
  onAddNewCatalogItem: (item: MaterialItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  materials,
  settings,
  onRefreshMaterials,
  isLoadingMaterials,
  onAddItemToActiveQuote,
  onAddNewCatalogItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [addingQtyForSku, setAddingQtyForSku] = useState<string | null>(null);
  const [qtyInput, setQtyInput] = useState<number>(1);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // New Custom Material Form State
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('each');
  const [newItemPrice, setNewItemPrice] = useState('0.00');
  const [newItemCategory, setNewItemCategory] = useState('General Electrical');

  // Dynamically extract logical groups from CSV / inventory data
  const logicalGroups = useMemo(() => {
    const groupSet = new Set<string>();
    materials.forEach((m) => {
      if (m.Category && m.Category.trim()) {
        groupSet.add(m.Category.trim());
      }
    });
    const sorted = Array.from(groupSet).sort((a, b) => a.localeCompare(b));
    return ['All', ...sorted];
  }, [materials]);

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.Item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.SKU.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.Category && m.Category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGroup =
      selectedGroup === 'All' || m.Category === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const handleConfirmAdd = (item: MaterialItem) => {
    onAddItemToActiveQuote(item, qtyInput);
    setAddingQtyForSku(null);
    setQtyInput(1);
  };

  const handleCreateCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: MaterialItem = {
      SKU: newItemSku.trim() || `MAT-${String(materials.length + 1).padStart(3, '0')}`,
      Item: newItemName.trim(),
      Unit: newItemUnit.trim() || 'each',
      Price: parseFloat(newItemPrice) || 0,
      Category: newItemCategory,
      inStock: 50,
    };

    onAddNewCatalogItem(item);
    setShowAddCustomModal(false);
    setNewItemName('');
    setNewItemSku('');
    setNewItemPrice('0.00');
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header & Controls */}
      <div className="surface-card p-4 sm:p-6 border border-[#262F44] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-[#c0c1ff]" />
            <span>Master Inventory & Materials Catalog</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse electrical stock, sync prices from Google Sheets, or add materials directly into the active quote.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshMaterials}
            disabled={isLoadingMaterials}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161B29] border border-[#2B354E] hover:border-[#3D4B6E] text-slate-200 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMaterials ? 'animate-spin text-[#c0c1ff]' : ''}`} />
            <span>{isLoadingMaterials ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddCustomModal(true)}
            className="btn-accent-purple px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Material</span>
          </button>
        </div>
      </div>

      {/* Search & Logical Group Filter Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search catalog by material name, description, or SKU..."
              className="custom-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm"
            />
          </div>

          {/* Group dropdown selector for compact/mobile layouts */}
          <div className="flex items-center gap-2 bg-[#161B29] border border-[#232A3E] px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-[#c0c1ff] flex-shrink-0" />
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider whitespace-nowrap">
              Group:
            </span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {logicalGroups.map((group) => (
                <option key={group} value={group} className="bg-[#121623] text-slate-200">
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logical Group Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {logicalGroups.map((group) => {
            const count =
              group === 'All'
                ? materials.length
                : materials.filter((m) => m.Category === group).length;

            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedGroup === group
                    ? 'bg-[#c0c1ff] text-[#101322] font-bold shadow-md'
                    : 'bg-[#161B29] text-slate-400 hover:text-slate-200 border border-[#232A3E]'
                }`}
              >
                <span>{group}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedGroup === group
                      ? 'bg-[#101322]/20 text-[#101322] font-mono'
                      : 'bg-[#1D253B] text-slate-500 font-mono'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Materials Table Card */}
      <div className="surface-card border border-[#262F44] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-[#121623] border-b border-[#232A3E]">
              <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Material / Item</th>
                <th className="py-3 px-4">Logical Group</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">In Stock</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B2236]">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    No materials found in logical group "{selectedGroup}" matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((item) => (
                  <tr key={item.SKU} className="hover:bg-[#181E2E] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-400">
                      {item.SKU}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-100">
                      {item.Item}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs font-medium">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#161B29] border border-[#232A3E] text-slate-300">
                        {item.Category || 'General Electrical'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">
                      {item.Unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#c0c1ff]">
                      {item.Price !== null && item.Price !== undefined
                        ? formatCurrency(item.Price, settings.currencySymbol || '$')
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                      {item.inStock ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {addingQtyForSku === item.SKU ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={qtyInput}
                            onChange={(e) => setQtyInput(parseFloat(e.target.value) || 1)}
                            className="w-14 bg-[#0F111A] border border-[#2F3A56] rounded px-2 py-1 text-center text-xs text-white font-bold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleConfirmAdd(item)}
                            className="p-1.5 rounded bg-[#c0c1ff] text-[#0F111A] hover:bg-[#d6d7ff] font-bold text-xs"
                            title="Confirm add to quote"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingQtyForSku(item.SKU);
                            setQtyInput(1);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#1D253A] hover:bg-[#26314D] border border-[#2E3A59] text-[#c0c1ff] hover:text-white text-xs font-semibold transition-all"
                        >
                          + Add to Quote
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Custom Material to Catalog */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="surface-card p-6 w-full max-w-md border border-[#2E3A56] shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider mb-4">
              Add New Material to Catalog
            </h3>

            <form onSubmit={handleCreateCatalogItem} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. 100A 3-Phase Main Switchboard"
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    placeholder="e.g. EL-889"
                    className="custom-input w-full rounded-lg px-3.5 py-2 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="each / Roll / Length"
                    className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Unit Price ({settings.currencySymbol || '$'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="custom-input w-full rounded-lg px-3.5 py-2 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Logical Group / Category
                  </label>
                  <input
                    type="text"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    placeholder="e.g. Wiring & Cables"
                    className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                    list="logical-groups-datalist"
                  />
                  <datalist id="logical-groups-datalist">
                    {logicalGroups.filter((g) => g !== 'All').map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-lg bg-transparent border border-[#2B354E] hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
