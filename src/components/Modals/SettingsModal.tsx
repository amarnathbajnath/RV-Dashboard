import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { Building, Check, Database, Percent, RefreshCw, Save, Settings, ShieldCheck, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onTestSheetSync: () => void;
  isLoadingMaterials: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestSheetSync,
  isLoadingMaterials,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });

  if (!isOpen) return null;

  const handleChange = <K extends keyof AppSettings>(field: K, value: AppSettings[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="surface-card w-full max-w-2xl border border-[#2E3A56] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#232A3E] flex items-center justify-between bg-[#121623]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#1B2236] text-[#c0c1ff]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-wider">
                Application & Company Settings
              </h3>
              <p className="text-xs text-slate-400">
                Configure defaults, tax rates, letterhead info, and Google Sheet catalog sync.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Company Profile */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c0c1ff] flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>Company Information (Printed on Quotations)</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tagline / Business Specialization
              </label>
              <input
                type="text"
                value={formData.companySubtitle}
                onChange={(e) => handleChange('companySubtitle', e.target.value)}
                className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => handleChange('companyAddress', e.target.value)}
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Tax / VAT Registration No.
                </label>
                <input
                  type="text"
                  value={formData.taxRegistrationNumber}
                  onChange={(e) => handleChange('taxRegistrationNumber', e.target.value)}
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Telephone / Contact
                </label>
                <input
                  type="text"
                  value={formData.companyPhone}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Defaults */}
          <div className="space-y-3 pt-3 border-t border-[#232A3E]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#c0c1ff] flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" />
              <span>Default Financial Rates & Currency</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Default Markup %
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.defaultMarkupPct}
                  onChange={(e) => handleChange('defaultMarkupPct', parseFloat(e.target.value) || 0)}
                  className="custom-input w-full rounded-lg px-3 py-2 text-sm font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Default VAT %
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.defaultVatPct}
                  onChange={(e) => handleChange('defaultVatPct', parseFloat(e.target.value) || 0)}
                  className="custom-input w-full rounded-lg px-3 py-2 text-sm font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  placeholder="$ or TTD"
                  className="custom-input w-full rounded-lg px-3 py-2 text-sm font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Google Sheets Sync URL */}
          <div className="space-y-3 pt-3 border-t border-[#232A3E]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#c0c1ff] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Google Sheets CSV Catalog Link</span>
              </h4>

              <button
                type="button"
                onClick={onTestSheetSync}
                disabled={isLoadingMaterials}
                className="text-xs text-[#c0c1ff] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingMaterials ? 'animate-spin' : ''}`} />
                <span>Test Live Sync</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Published Google Sheet CSV URL
              </label>
              <input
                type="url"
                value={formData.googleSheetUrl}
                onChange={(e) => handleChange('googleSheetUrl', e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                className="custom-input w-full rounded-lg px-3.5 py-2 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Publish sheet via File &gt; Share &gt; Publish to Web &gt; CSV format.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#232A3E] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-transparent border border-[#2B354E] hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
