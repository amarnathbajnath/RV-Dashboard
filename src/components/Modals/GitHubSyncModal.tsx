import React, { useState } from 'react';
import { Client, GitHubSyncConfig, Quote } from '../../types';
import { testGitHubConnection } from '../../utils/githubSync';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Eye,
  EyeOff,
  GitBranch,
  Github,
  KeyRound,
  RefreshCw,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GitHubSyncConfig;
  onSaveConfig: (newConfig: GitHubSyncConfig) => void;
  onPushToGitHub: () => Promise<void>;
  onPullFromGitHub: () => Promise<void>;
  isSyncing: boolean;
  quotesCount: number;
  clientsCount: number;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onPushToGitHub,
  onPullFromGitHub,
  isSyncing,
  quotesCount,
  clientsCount,
}) => {
  const [formData, setFormData] = useState<GitHubSyncConfig>({ ...config });
  const [showToken, setShowToken] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    loading: boolean;
    success: boolean;
    message: string;
  }>({
    tested: false,
    loading: false,
    success: false,
    message: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = <K extends keyof GitHubSyncConfig>(
    field: K,
    value: GitHubSyncConfig[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestStatus({ tested: false, loading: false, success: false, message: '' });
  };

  const handleTestConnection = async () => {
    setTestStatus({ tested: true, loading: true, success: false, message: 'Testing connection...' });
    const result = await testGitHubConnection(formData);
    setTestStatus({
      tested: true,
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  const handleSaveAndClose = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  const isConfigured = !!(formData.token && formData.owner && formData.repo);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="surface-card w-full max-w-2xl border border-[#2E3A56] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#232A3E] flex items-center justify-between bg-[#121623]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#1B2236] border border-[#2F3C5C] text-[#c0c1ff]">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span>GitHub Cloud Sync</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A2238] border border-[#2D3958] text-[#c0c1ff] font-mono lowercase">
                  JSON repository backup
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Save and sync your quotes and clients directly to your GitHub repository.
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

        {/* Content Form */}
        <form onSubmit={handleSaveAndClose} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Actions (Push / Pull) Bar */}
          <div className="bg-[#101420] border border-[#242E46] rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <Cloud className="w-4 h-4 text-[#c0c1ff]" />
                <span className="font-semibold text-slate-200">Repository Sync Status:</span>
                <span className="font-mono text-slate-400">
                  {config.lastSyncedAt
                    ? `Last synced ${new Date(config.lastSyncedAt).toLocaleString()}`
                    : 'Not synced yet'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Local: <strong className="text-slate-200">{quotesCount}</strong> quotes,{' '}
                <strong className="text-slate-200">{clientsCount}</strong> clients
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onPushToGitHub}
                disabled={isSyncing || !isConfigured}
                className="btn-accent-purple py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                <span>{isSyncing ? 'Syncing...' : 'Push to GitHub (Save)'}</span>
              </button>

              <button
                type="button"
                onClick={onPullFromGitHub}
                disabled={isSyncing || !isConfigured}
                className="py-2.5 px-4 rounded-lg bg-[#161B2B] hover:bg-[#1E253C] border border-[#2B3654] hover:border-[#3D4C74] text-slate-200 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ArrowDownToLine className="w-4 h-4 text-[#c0c1ff]" />
                <span>Pull from GitHub (Load)</span>
              </button>
            </div>
          </div>

          {/* Connection Settings */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#c0c1ff] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                <span>GitHub Repository Connection</span>
              </h4>

              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=RVJobCostingApp"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#c0c1ff] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Generate Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Personal Access Token */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Personal Access Token (PAT) *
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  required
                  value={formData.token}
                  onChange={(e) => handleFieldChange('token', e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                  className="custom-input w-full rounded-lg pl-3.5 pr-10 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Requires standard <code className="text-[#c0c1ff]">repo</code> scope to read and commit JSON files. Stored securely in your browser only.
              </p>
            </div>

            {/* Repo Owner & Repo Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  GitHub Username / Owner *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner}
                  onChange={(e) => handleFieldChange('owner', e.target.value)}
                  placeholder="e.g. amar-bajnath"
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Repository Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.repo}
                  onChange={(e) => handleFieldChange('repo', e.target.value)}
                  placeholder="e.g. rv-job-costing"
                  className="custom-input w-full rounded-lg px-3.5 py-2 text-sm font-mono"
                />
              </div>
            </div>

            {/* Branch & Auto-sync */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Branch
                </label>
                <div className="relative">
                  <GitBranch className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => handleFieldChange('branch', e.target.value)}
                    placeholder="main"
                    className="custom-input w-full rounded-lg pl-8 pr-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141926] border border-[#232B40] cursor-pointer hover:border-[#333E5D] transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.autoSyncOnSave}
                    onChange={(e) => handleFieldChange('autoSyncOnSave', e.target.checked)}
                    className="rounded border-[#2F3C5C] text-[#c0c1ff] focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-slate-200 select-none">
                    Auto-push when clicking "Save Job"
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Test Connection Button & Result Box */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus.loading || !formData.token || !formData.owner || !formData.repo}
              className="text-xs font-bold text-[#c0c1ff] hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B2B] border border-[#2B3654] hover:bg-[#1E253C] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testStatus.loading ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </button>

            {testStatus.tested && (
              <div
                className={`mt-2 p-3 rounded-lg text-xs flex items-start gap-2 border ${
                  testStatus.success
                    ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                )}
                <span>{testStatus.message}</span>
              </div>
            )}
          </div>

          {/* Advanced File Paths (Collapsible) */}
          <div className="pt-2 border-t border-[#232A3E]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <span>{showAdvanced ? '▼ Hide' : '▶ Show'} Repository JSON File Paths</span>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 rounded-xl bg-[#121623] border border-[#232A3E]">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Quotes JSON Path
                  </label>
                  <input
                    type="text"
                    value={formData.quotesPath}
                    onChange={(e) => handleFieldChange('quotesPath', e.target.value)}
                    placeholder="data/quotes.json"
                    className="custom-input w-full rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Clients JSON Path
                  </label>
                  <input
                    type="text"
                    value={formData.clientsPath}
                    onChange={(e) => handleFieldChange('clientsPath', e.target.value)}
                    placeholder="data/clients.json"
                    className="custom-input w-full rounded-lg px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#232A3E] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-transparent border border-[#2B354E] hover:border-slate-500 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              Close
            </button>

            <button
              type="submit"
              className="btn-accent-purple px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save GitHub Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
