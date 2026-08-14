import React from 'react';
import { ActiveTab, AppSettings } from '../types';
import { Briefcase, CheckCircle, Cloud, Database, Github, LayoutDashboard, RefreshCw, Settings, Users, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeQuoteNo: string;
  onRefreshMaterials: () => void;
  isLoadingMaterials: boolean;
  materialsCount: number;
  onOpenSettings: () => void;
  onOpenGitHubSync: () => void;
  isGitHubConfigured: boolean;
  isGitHubSyncing?: boolean;
  settings: AppSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeQuoteNo,
  onRefreshMaterials,
  isLoadingMaterials,
  materialsCount,
  onOpenSettings,
  onOpenGitHubSync,
  isGitHubConfigured,
  isGitHubSyncing = false,
  settings,
}) => {
  return (
    <header className="border-b border-[#232A3E] bg-[#0F111A]/95 backdrop-blur sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Company Logo & Identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* RV Icon Badge */}
            <div className="w-9 h-9 rounded-lg bg-[#1E2538] border border-[#303B57] flex items-center justify-center flex-shrink-0 shadow-inner group">
              <span className="font-condensed font-extrabold text-[#c0c1ff] text-base tracking-wider">
                RV
              </span>
            </div>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-100 leading-tight tracking-tight flex items-center gap-1.5">
                {settings.companyName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Active Quote:</span>
                <span className="font-mono font-semibold text-[#c0c1ff] bg-[#161B2B] px-1.5 py-0.5 rounded border border-[#26304D]">
                  {activeQuoteNo || 'None Selected'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOpenGitHubSync}
              title="GitHub Cloud Sync"
              className="p-2 rounded-lg bg-[#161B2B] border border-[#2A344E] text-[#c0c1ff] hover:bg-[#20273D] transition-colors relative"
            >
              <Github className={`w-4 h-4 ${isGitHubSyncing ? 'animate-bounce' : ''}`} />
              <span
                className={`w-2 h-2 rounded-full absolute top-1 right-1 ${
                  isGitHubConfigured ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
              />
            </button>
            <button
              onClick={onRefreshMaterials}
              disabled={isLoadingMaterials}
              title={`Sync Materials (${materialsCount} loaded)`}
              className="p-2 rounded-lg bg-[#161B2B] border border-[#2A344E] text-slate-300 hover:text-white hover:bg-[#20273D] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMaterials ? 'animate-spin text-[#c0c1ff]' : ''}`} />
            </button>
            <button
              onClick={onOpenSettings}
              title="Settings"
              className="p-2 rounded-lg bg-[#161B2B] border border-[#2A344E] text-slate-300 hover:text-white hover:bg-[#20273D] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center/Right: Navigation Tabs & Desktop Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4">
          <nav className="flex items-center bg-[#131724] p-1 rounded-xl border border-[#232A3E] overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#1F273C] text-slate-100 shadow-sm border border-[#344163]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181E2E]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>DASHBOARD</span>
            </button>

            <button
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'jobs'
                  ? 'bg-[#1F273C] text-[#c0c1ff] shadow-sm border border-[#344163]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181E2E]'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-[#c0c1ff]" />
              <span>JOBS</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-[#1F273C] text-slate-100 shadow-sm border border-[#344163]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181E2E]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>INVENTORY</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-[#1F273C] text-slate-100 shadow-sm border border-[#344163]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#181E2E]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>CLIENTS</span>
            </button>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={onOpenGitHubSync}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161B2B] border border-[#2B3550] hover:border-[#43527D] text-[#c0c1ff] hover:bg-[#20273D] text-xs font-semibold transition-all"
              title="GitHub Cloud Sync (Save/Load Quotes & Clients via GitHub)"
            >
              <Github className={`w-3.5 h-3.5 ${isGitHubSyncing ? 'animate-bounce text-[#c0c1ff]' : ''}`} />
              <span>GitHub Sync</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isGitHubConfigured ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-slate-500'
                }`}
                title={isGitHubConfigured ? 'GitHub Connected' : 'GitHub Not Configured'}
              />
            </button>

            <button
              onClick={onRefreshMaterials}
              disabled={isLoadingMaterials}
              className="p-2 rounded-lg bg-[#161B2B] border border-[#232A3E] text-slate-300 hover:text-white hover:bg-[#20273D] transition-colors relative"
              title={`Sync Materials with Google Sheet (${materialsCount} items loaded)`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMaterials ? 'animate-spin text-[#c0c1ff]' : ''}`} />
              <span className="sr-only">Refresh Inventory</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-[#161B2B] border border-[#232A3E] text-slate-300 hover:text-white hover:bg-[#20273D] transition-colors"
              title="Application Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
