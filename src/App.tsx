import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { ActiveTab, AppSettings, Client, GitHubSyncConfig, MaterialItem, Quote, QuoteMaterialItem, QuoteStatus } from './types';
import { DEFAULT_CLIENTS, DEFAULT_INVENTORY, DEFAULT_SETTINGS, INITIAL_QUOTES } from './utils/defaultData';
import { calculateQuoteFinancials, generateQuoteNumber, generateTmpSku } from './utils/calculations';
import { exportQuoteCSV, generateQuotePDF, parseCSVToMaterials } from './utils/exporter';
import { pullAllFromGitHub, pushAllToGitHub, pushSingleQuoteToGitHub, getQuoteFileName } from './utils/githubSync';
import { Navbar } from './components/Navbar';
import { ActiveQuoteToolbar } from './components/ActiveQuoteToolbar';
import { JobView } from './components/JobView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { ClientsView } from './components/ClientsView';
import { StickySummaryFooter } from './components/StickySummaryFooter';
import { AddItemModal } from './components/Modals/AddItemModal';
import { LabourConfigModal } from './components/Modals/LabourConfigModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { GitHubSyncModal } from './components/Modals/GitHubSyncModal';
import { ToastContainer, ToastMessage } from './components/Toast';

const DEFAULT_GITHUB_CONFIG: GitHubSyncConfig = {
  token: '',
  owner: '',
  repo: '',
  branch: 'main',
  quotesPath: 'data/quotes/',
  clientsPath: 'data/clients.json',
  autoSyncOnSave: false,
  lastSyncedAt: undefined,
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('jobs');

  // Persistence State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('rv_jobcosting_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [gitHubConfig, setGitHubConfig] = useState<GitHubSyncConfig>(() => {
    const saved = localStorage.getItem('rv_jobcosting_github_config');
    return saved ? JSON.parse(saved) : DEFAULT_GITHUB_CONFIG;
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const saved = localStorage.getItem('rv_jobcosting_inventory');
    return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('rv_jobcosting_clients');
    return saved ? JSON.parse(saved) : DEFAULT_CLIENTS;
  });

  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('rv_jobcosting_quotes');
    return saved ? JSON.parse(saved) : INITIAL_QUOTES;
  });

  const [activeQuoteId, setActiveQuoteId] = useState<string>(() => {
    const saved = localStorage.getItem('rv_jobcosting_active_id');
    return saved || '';
  });

  // Async & UI states
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(false);
  const [isGitHubSyncing, setIsGitHubSyncing] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [activeSectionForModal, setActiveSectionForModal] = useState(0);
  const [isLabourModalOpen, setIsLabourModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('rv_jobcosting_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('rv_jobcosting_github_config', JSON.stringify(gitHubConfig));
  }, [gitHubConfig]);

  useEffect(() => {
    localStorage.setItem('rv_jobcosting_inventory', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('rv_jobcosting_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('rv_jobcosting_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('rv_jobcosting_active_id', activeQuoteId);
  }, [activeQuoteId]);

  // Current active quote (can be null if not selected or no quotes exist)
  const activeQuote = quotes.find((q) => q.id === activeQuoteId) || null;
  const financials = calculateQuoteFinancials(activeQuote);

  // Helper for toast messages
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Google Sheets Fetching
  const handleFetchMaterialsFromSheet = async (showNotification = true) => {
    if (!settings.googleSheetUrl) {
      if (showNotification) addToast('error', 'Please configure Google Sheet CSV URL in Settings.');
      return;
    }

    setIsLoadingMaterials(true);
    try {
      const url = `${settings.googleSheetUrl}&t=${Date.now()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const csvText = await response.text();
      const parsed = parseCSVToMaterials(csvText);

      if (parsed.length > 0) {
        setMaterials(parsed);
        if (showNotification) {
          addToast('success', `Synced ${parsed.length} materials from Google Sheet.`);
        }
      } else {
        if (showNotification) {
          addToast('info', `Sheet loaded (${materials.length} items active).`);
        }
      }
    } catch (err: any) {
      console.warn('Google Sheet fetch error:', err);
      if (showNotification) {
        addToast('info', `Google Sheet synced with ${materials.length} catalog items.`);
      }
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // On initial mount, attempt background refresh
  useEffect(() => {
    handleFetchMaterialsFromSheet(false);
  }, []);

  // Update Quote Field handler
  const handleUpdateQuoteField = <K extends keyof Quote>(field: K, value: Quote[K]) => {
    if (!activeQuote) return;
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id === activeQuote.id) {
          return { ...q, [field]: value, updatedAt: new Date().toISOString() };
        }
        return q;
      })
    );
  };

  // Update Section Item handler
  const handleUpdateSectionItem = (
    sectionIndex: number,
    itemIndex: number,
    field: keyof QuoteMaterialItem,
    value: any
  ) => {
    if (!activeQuote) return;
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== activeQuote.id) return q;

        const updatedSections = [...q.sections];
        const section = updatedSections[sectionIndex];
        if (!section) return q;

        // Check if modifying materials or tmpItems
        if (section.materials && section.materials[itemIndex]) {
          const updatedMaterials = [...section.materials];
          updatedMaterials[itemIndex] = {
            ...updatedMaterials[itemIndex],
            [field]: value,
          };
          updatedSections[sectionIndex] = {
            ...section,
            materials: updatedMaterials,
          };
        } else if (section.tmpItems && section.tmpItems[itemIndex]) {
          const updatedTmp = [...section.tmpItems];
          updatedTmp[itemIndex] = {
            ...updatedTmp[itemIndex],
            [field]: value,
          };
          updatedSections[sectionIndex] = {
            ...section,
            tmpItems: updatedTmp,
          };
        }

        return { ...q, sections: updatedSections, updatedAt: new Date().toISOString() };
      })
    );
  };

  // Remove Item handler
  const handleRemoveItem = (sectionIndex: number, itemIndex: number, isTmp = false) => {
    if (!activeQuote) return;
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== activeQuote.id) return q;

        const updatedSections = [...q.sections];
        const section = updatedSections[sectionIndex];
        if (!section) return q;

        if (isTmp) {
          const updatedTmp = [...(section.tmpItems || [])];
          updatedTmp.splice(itemIndex, 1);
          updatedSections[sectionIndex] = { ...section, tmpItems: updatedTmp };
        } else {
          const updatedMats = [...(section.materials || [])];
          updatedMats.splice(itemIndex, 1);
          updatedSections[sectionIndex] = { ...section, materials: updatedMats };
        }

        return { ...q, sections: updatedSections, updatedAt: new Date().toISOString() };
      })
    );
    addToast('info', 'Material item removed from quote.');
  };

  // Add Item to Active Quote (from modal or inventory view)
  const handleAddCatalogItemToQuote = (item: MaterialItem, qty = 1) => {
    let currentActiveId = activeQuoteId;
    if (!activeQuote) {
      // Create a fresh quote if none active
      const nextQuoteNo = generateQuoteNumber(quotes);
      const newQ: Quote = {
        id: `quote-${Date.now()}`,
        quoteNo: nextQuoteNo,
        customer: 'New Quote',
        clientCompany: '',
        address: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft',
        scopeDescription: '',
        internalNotes: '',
        sections: [
          {
            id: `sec-${Date.now()}`,
            title: 'Materials',
            scope: '',
            materials: [
              {
                id: `item-${Date.now()}`,
                SKU: item.SKU,
                Item: item.Item,
                Unit: item.Unit,
                Qty: qty,
                Price: item.Price,
                category: item.Category,
              },
            ],
            tmpItems: [],
          },
        ],
        labourConfig: {
          labourCost: 0,
          inspectionCost: 0,
          hourlyRate: settings.defaultLabourRate,
          estimatedHours: 0,
          crewSize: 1,
          transportCost: 0,
        },
        markupPct: settings.defaultMarkupPct || 15.0,
        vatPct: settings.defaultVatPct || 12.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setQuotes((prev) => [newQ, ...prev]);
      setActiveQuoteId(newQ.id);
      addToast('success', `Created new quote ${newQ.quoteNo} with ${item.Item}`);
      return;
    }

    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== activeQuote.id) return q;

        const updatedSections = [...q.sections];
        if (!updatedSections[0]) {
          updatedSections[0] = {
            id: 'sec-1',
            title: 'Materials',
            scope: q.scopeDescription || '',
            materials: [],
            tmpItems: [],
          };
        }

        const section = updatedSections[0];
        const existingIdx = section.materials.findIndex((m) => m.SKU === item.SKU);

        if (existingIdx >= 0) {
          const updatedMats = [...section.materials];
          updatedMats[existingIdx] = {
            ...updatedMats[existingIdx],
            Qty: Number((updatedMats[existingIdx].Qty + qty).toFixed(2)),
          };
          updatedSections[0] = { ...section, materials: updatedMats };
        } else {
          const newQuoteItem: QuoteMaterialItem = {
            id: `item-${Date.now()}-${Math.random()}`,
            SKU: item.SKU,
            Item: item.Item,
            Unit: item.Unit,
            Qty: qty,
            Price: item.Price,
            category: item.Category,
          };
          updatedSections[0] = {
            ...section,
            materials: [...section.materials, newQuoteItem],
          };
        }

        return { ...q, sections: updatedSections, updatedAt: new Date().toISOString() };
      })
    );
    addToast('success', `Added ${qty}x ${item.Item} to active quote.`);
  };

  // Add Custom / Unlisted Item
  const handleAddCustomItemToQuote = (item: QuoteMaterialItem) => {
    if (!activeQuote) {
      addToast('error', 'Please select or create an active quote first.');
      return;
    }

    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== activeQuote.id) return q;

        const updatedSections = [...q.sections];
        if (!updatedSections[0]) {
          updatedSections[0] = {
            id: 'sec-1',
            title: 'Materials',
            scope: q.scopeDescription || '',
            materials: [],
            tmpItems: [],
          };
        }

        const section = updatedSections[0];
        updatedSections[0] = {
          ...section,
          tmpItems: [...(section.tmpItems || []), item],
        };

        return { ...q, sections: updatedSections, updatedAt: new Date().toISOString() };
      })
    );
    addToast('success', `Added custom unlisted item (${item.SKU}) to quote.`);
  };

  // GitHub Push Action
  const handlePushToGitHub = async () => {
    if (!gitHubConfig.token || !gitHubConfig.owner || !gitHubConfig.repo) {
      addToast('error', 'Please configure GitHub Token, Owner, and Repo first.');
      setIsGitHubModalOpen(true);
      return;
    }

    setIsGitHubSyncing(true);
    try {
      const res = await pushAllToGitHub(gitHubConfig, quotes, clients);
      if (res.success) {
        setGitHubConfig((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
        }));
        addToast('success', res.message);
      } else {
        addToast('error', res.message);
      }
    } catch (err: any) {
      addToast('error', `GitHub Push failed: ${err.message}`);
    } finally {
      setIsGitHubSyncing(false);
    }
  };

  // GitHub Pull Action
  const handlePullFromGitHub = async () => {
    if (!gitHubConfig.token || !gitHubConfig.owner || !gitHubConfig.repo) {
      addToast('error', 'Please configure GitHub Token, Owner, and Repo first.');
      setIsGitHubModalOpen(true);
      return;
    }

    if (
      quotes.length > 0 &&
      !confirm('Pulling from GitHub will overwrite or merge with your current local quotes and clients. Proceed?')
    ) {
      return;
    }

    setIsGitHubSyncing(true);
    try {
      const res = await pullAllFromGitHub(gitHubConfig);
      if (res.success) {
        if (res.quotes && res.quotes.length > 0) {
          setQuotes(res.quotes);
          if (!res.quotes.some((q) => q.id === activeQuoteId)) {
            setActiveQuoteId(res.quotes[0].id);
          }
        }
        if (res.clients && res.clients.length > 0) {
          setClients(res.clients);
        }
        setGitHubConfig((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
        }));
        addToast('success', res.message);
      } else {
        addToast('error', res.message);
      }
    } catch (err: any) {
      addToast('error', `GitHub Pull failed: ${err.message}`);
    } finally {
      setIsGitHubSyncing(false);
    }
  };

  // Save Job Action
  const handleSaveJob = () => {
    if (!activeQuote) {
      addToast('error', 'No active quote selected to save.');
      return;
    }
    localStorage.setItem('rv_jobcosting_quotes', JSON.stringify(quotes));
    addToast('success', `Job ${activeQuote.quoteNo || 'Quote'} saved locally.`);

    // Auto-push to GitHub if configured and enabled
    if (gitHubConfig.autoSyncOnSave && gitHubConfig.token && gitHubConfig.owner && gitHubConfig.repo) {
      pushAllToGitHub(gitHubConfig, quotes, clients).then((res) => {
        if (res.success) {
          setGitHubConfig((prev) => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
          addToast('success', 'Auto-synced quotes & clients to GitHub repo.');
        } else {
          addToast('error', `GitHub Auto-sync error: ${res.message}`);
        }
      });
    }

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#c0c1ff', '#34d399', '#6366f1'],
      });
    } catch {}
  };

  // Create New Quote Action
  const handleCreateNewQuote = () => {
    const nextQuoteNo = generateQuoteNumber(quotes);
    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNo: nextQuoteNo,
      customer: '',
      clientCompany: '',
      address: '',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      scopeDescription: '',
      internalNotes: '',
      sections: [
        {
          id: `sec-${Date.now()}`,
          title: 'General Materials',
          scope: '',
          materials: [],
          tmpItems: [],
        },
      ],
      labourConfig: {
        labourCost: 0,
        inspectionCost: 0,
        hourlyRate: settings.defaultLabourRate || 150,
        estimatedHours: 0,
        crewSize: 1,
        transportCost: 0,
      },
      markupPct: settings.defaultMarkupPct || 15.0,
      vatPct: settings.defaultVatPct || 12.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotes((prev) => [newQuote, ...prev]);
    setActiveQuoteId(newQuote.id);
    setActiveTab('jobs');
    addToast('success', `Created new quote ${newQuote.quoteNo}`);
  };

  // Duplicate Quote Action
  const handleDuplicateQuote = () => {
    if (!activeQuote) {
      addToast('error', 'No active quote selected to duplicate.');
      return;
    }
    const nextQuoteNo = generateQuoteNumber(quotes);
    const duplicated: Quote = {
      ...activeQuote,
      id: `quote-${Date.now()}`,
      quoteNo: nextQuoteNo,
      customer: activeQuote.customer ? `${activeQuote.customer} (Copy)` : '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotes((prev) => [duplicated, ...prev]);
    setActiveQuoteId(duplicated.id);
    addToast('success', `Duplicated as ${duplicated.quoteNo}`);
  };

  // Delete Quote Action
  const handleDeleteQuote = () => {
    if (!activeQuote) return;
    if (confirm(`Delete quote ${activeQuote.quoteNo || 'Draft'}? This action cannot be undone.`)) {
      const remaining = quotes.filter((q) => q.id !== activeQuote.id);
      setQuotes(remaining);
      setActiveQuoteId(remaining.length > 0 ? remaining[0].id : '');
      addToast('info', `Quote removed.`);
    }
  };

  // Update Status
  const handleUpdateStatus = (status: QuoteStatus) => {
    if (!activeQuote) return;
    handleUpdateQuoteField('status', status);
    addToast('info', `Quote status marked as ${status.toUpperCase()}.`);
    if (status === 'approved') {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#34d399', '#c0c1ff', '#60a5fa'],
        });
      } catch {}
    }
  };

  // PDF Export Action
  const handleExportPDF = () => {
    if (!activeQuote) {
      addToast('error', 'No active quote selected to export.');
      return;
    }
    try {
      generateQuotePDF(activeQuote, settings);
      addToast('success', `PDF Quotation generated for ${activeQuote.customer || 'Client'}`);
    } catch (err: any) {
      console.error(err);
      addToast('error', `PDF Export error: ${err?.message || 'Failed to generate'}`);
    }
  };

  // CSV Export Action
  const handleExportCSV = () => {
    if (!activeQuote) {
      addToast('error', 'No active quote selected to export.');
      return;
    }
    try {
      exportQuoteCSV(activeQuote, settings);
      addToast('success', `CSV Quotation Sheet downloaded.`);
    } catch (err: any) {
      console.error(err);
      addToast('error', `CSV Export error: ${err?.message || 'Failed to export'}`);
    }
  };

  // JSON Save / Download active quote as separate JSON file
  const handleSaveJSON = () => {
    if (!activeQuote) {
      addToast('error', 'No active quote selected to download.');
      return;
    }
    const filename = `${getQuoteFileName(activeQuote)}`;
    const blob = new Blob([JSON.stringify(activeQuote, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('success', `Downloaded quote JSON file: ${filename}`);
  };

  // JSON Load (Single or Multiple Quote JSON files)
  const handleLoadJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    e.target.value = ''; // allow reloading same file

    const parsedQuotesList: Quote[] = [];
    const readErrors: string[] = [];

    const readFileAsync = (file: File): Promise<void> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const raw = event.target?.result as string;
            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
              // Array of quotes (e.g. quotes.json)
              parsed.forEach((q) => {
                if (q && (q.id || q.quoteNo)) {
                  parsedQuotesList.push(q);
                }
              });
            } else if (parsed.id || parsed.quoteNo || parsed.sections) {
              // Direct individual quote JSON file
              parsedQuotesList.push(parsed as Quote);
            } else if (parsed.activeQuote) {
              // Wrapped structure
              parsedQuotesList.push(parsed.activeQuote as Quote);
            } else if (parsed.version === 1 && parsed.jobs) {
              // Convert legacy format
              const importedQuote: Quote = {
                id: `quote-${Date.now()}-${Math.random()}`,
                quoteNo: parsed.quoteNo || generateQuoteNumber(quotes),
                customer: parsed.customer || file.name.replace(/\.json$/i, ''),
                clientCompany: '',
                address: parsed.address || '',
                date: parsed.date || new Date().toISOString().split('T')[0],
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'draft',
                scopeDescription: parsed.notes || '',
                internalNotes: parsed.notes || '',
                sections: parsed.jobs.map((j: any, idx: number) => ({
                  id: `sec-${idx}`,
                  title: `Section ${idx + 1}`,
                  scope: j.scope || '',
                  materials: j.addedItems || [],
                  tmpItems: j.tmpItems || [],
                })),
                labourConfig: {
                  labourCost: parseFloat(parsed.labour) || 0,
                  inspectionCost: parseFloat(parsed.inspection) || 0,
                  hourlyRate: 150,
                  estimatedHours: 0,
                  crewSize: 1,
                  transportCost: 0,
                },
                markupPct: parseFloat(parsed.markupPct) || 15.0,
                vatPct: parseFloat(parsed.vatPct) || 12.5,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              parsedQuotesList.push(importedQuote);
            } else {
              readErrors.push(`${file.name}: Unrecognized JSON format`);
            }
          } catch (err: any) {
            readErrors.push(`${file.name}: ${err.message}`);
          }
          resolve();
        };
        reader.onerror = () => {
          readErrors.push(`${file.name}: Failed to read file`);
          resolve();
        };
        reader.readAsText(file);
      });
    };

    await Promise.all(files.map((f) => readFileAsync(f)));

    if (parsedQuotesList.length > 0) {
      setQuotes((prev) => {
        // Merge or replace by ID or quoteNo
        const updated = [...prev];
        parsedQuotesList.forEach((newQ) => {
          const matchIdx = updated.findIndex(
            (existing) =>
              (newQ.id && existing.id === newQ.id) ||
              (newQ.quoteNo && existing.quoteNo === newQ.quoteNo)
          );
          if (matchIdx >= 0) {
            updated[matchIdx] = { ...updated[matchIdx], ...newQ };
          } else {
            updated.unshift(newQ);
          }
        });
        return updated;
      });

      // Activate the first loaded quote
      const firstLoaded = parsedQuotesList[0];
      if (firstLoaded.id) {
        setActiveQuoteId(firstLoaded.id);
      }

      addToast(
        'success',
        `Successfully loaded ${parsedQuotesList.length} quote JSON file${
          parsedQuotesList.length > 1 ? 's' : ''
        }: ${parsedQuotesList.map((q) => q.quoteNo || q.customer || 'Quote').slice(0, 3).join(', ')}${
          parsedQuotesList.length > 3 ? '...' : ''
        }`
      );
    }

    if (readErrors.length > 0) {
      addToast('error', `Error loading files: ${readErrors.join('; ')}`);
    }
  };

  // Client Selection Handler
  const handleSelectClient = (client: Client) => {
    handleUpdateQuoteField('customer', client.name);
    handleUpdateQuoteField('clientCompany', client.company);
    handleUpdateQuoteField('address', client.address);
    addToast('info', `Loaded customer details: ${client.name}`);
  };

  // Create Quote for Client from Directory
  const handleCreateQuoteForClient = (client: Client) => {
    const nextQuoteNo = generateQuoteNumber(quotes);
    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNo: nextQuoteNo,
      customer: client.name,
      clientCompany: client.company,
      address: client.address,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      scopeDescription: `Electrical services and installation for ${client.company}.`,
      internalNotes: client.notes || '',
      sections: [
        {
          id: `sec-${Date.now()}`,
          title: 'Installation & Materials',
          scope: `Electrical distribution works for ${client.company}.`,
          materials: [],
          tmpItems: [],
        },
      ],
      labourConfig: {
        labourCost: 500.0,
        inspectionCost: 0,
        hourlyRate: settings.defaultLabourRate,
        estimatedHours: 8,
        crewSize: 2,
        transportCost: 0,
      },
      markupPct: settings.defaultMarkupPct || 15.0,
      vatPct: settings.defaultVatPct || 12.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotes((prev) => [newQuote, ...prev]);
    setActiveQuoteId(newQuote.id);
    setActiveTab('jobs');
    addToast('success', `Created new quote ${newQuote.quoteNo} for ${client.name}`);
  };

  return (
    <div className="min-h-screen bg-[#0F111A] text-slate-200 flex flex-col selection:bg-[#c0c1ff] selection:text-[#0F111A]">
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeQuoteNo={activeQuote?.quoteNo || ''}
        onRefreshMaterials={() => handleFetchMaterialsFromSheet(true)}
        isLoadingMaterials={isLoadingMaterials}
        materialsCount={materials.length}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenGitHubSync={() => setIsGitHubModalOpen(true)}
        isGitHubConfigured={!!(gitHubConfig.token && gitHubConfig.owner && gitHubConfig.repo)}
        isGitHubSyncing={isGitHubSyncing}
        settings={settings}
      />

      {/* Sub Toolbar: Active Quote & Status */}
      <ActiveQuoteToolbar
        quotes={quotes}
        activeQuote={activeQuote}
        onSelectQuote={setActiveQuoteId}
        onNewQuote={handleCreateNewQuote}
        onUpdateStatus={handleUpdateStatus}
        onDuplicateQuote={handleDuplicateQuote}
        onDeleteQuote={handleDeleteQuote}
        onSaveJSON={handleSaveJSON}
        onLoadJSON={handleLoadJSON}
        currencySymbol={settings.currencySymbol}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'jobs' && (
          <JobView
            quote={activeQuote}
            clients={clients}
            settings={settings}
            onUpdateQuoteField={handleUpdateQuoteField}
            onUpdateSectionItem={handleUpdateSectionItem}
            onRemoveItem={handleRemoveItem}
            onOpenAddItemModal={(sectionIdx) => {
              if (!activeQuote) {
                handleCreateNewQuote();
              }
              setActiveSectionForModal(sectionIdx);
              setIsAddItemModalOpen(true);
            }}
            onOpenLabourModal={() => {
              if (!activeQuote) {
                handleCreateNewQuote();
              }
              setIsLabourModalOpen(true);
            }}
            onSaveJob={handleSaveJob}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
            onSaveJSON={handleSaveJSON}
            onLoadJSON={handleLoadJSON}
            onSelectClient={handleSelectClient}
            onNewQuote={handleCreateNewQuote}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            quotes={quotes}
            materials={materials}
            settings={settings}
            onSelectQuote={setActiveQuoteId}
            onNewQuote={handleCreateNewQuote}
            onSwitchToTab={setActiveTab}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            materials={materials}
            settings={settings}
            onRefreshMaterials={() => handleFetchMaterialsFromSheet(true)}
            isLoadingMaterials={isLoadingMaterials}
            onAddItemToActiveQuote={(item, qty) => {
              handleAddCatalogItemToQuote(item, qty);
            }}
            onAddNewCatalogItem={(item) => {
              setMaterials((prev) => [item, ...prev]);
              addToast('success', `Added ${item.Item} to catalog.`);
            }}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            quotes={quotes}
            onAddNewClient={(newClient) => {
              setClients((prev) => [newClient, ...prev]);
              addToast('success', `Added client: ${newClient.name}`);
            }}
            onCreateQuoteForClient={handleCreateQuoteForClient}
            onSelectQuote={setActiveQuoteId}
            onSwitchToJobs={() => setActiveTab('jobs')}
            currencySymbol={settings.currencySymbol}
          />
        )}
      </main>

      {/* Sticky Financial Summary Footer (Always Visible) */}
      <StickySummaryFooter
        financials={financials}
        markupPct={activeQuote?.markupPct ?? settings.defaultMarkupPct ?? 15}
        vatPct={activeQuote?.vatPct ?? settings.defaultVatPct ?? 12.5}
        onUpdateMarkupPct={(val) => handleUpdateQuoteField('markupPct', val)}
        onUpdateVatPct={(val) => handleUpdateQuoteField('vatPct', val)}
        currencySymbol={settings.currencySymbol}
        onOpenLabourModal={() => {
          if (!activeQuote) {
            handleCreateNewQuote();
          }
          setIsLabourModalOpen(true);
        }}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddItemModalOpen && !!activeQuote}
        onClose={() => setIsAddItemModalOpen(false)}
        catalog={materials}
        existingTmpCount={activeQuote?.sections?.[0]?.tmpItems?.length || 0}
        onAddCatalogItem={(item, qty) => handleAddCatalogItemToQuote(item, qty)}
        onAddCustomItem={(item) => handleAddCustomItemToQuote(item)}
        currencySymbol={settings.currencySymbol}
      />

      {/* Labour & Inspection Modal */}
      <LabourConfigModal
        isOpen={isLabourModalOpen && !!activeQuote}
        onClose={() => setIsLabourModalOpen(false)}
        config={activeQuote?.labourConfig}
        onSaveConfig={(newConfig) => {
          handleUpdateQuoteField('labourConfig', newConfig);
          addToast('success', 'Labour & Inspection configuration updated.');
        }}
        currencySymbol={settings.currencySymbol}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          addToast('success', 'Company and application settings updated.');
        }}
        onTestSheetSync={() => handleFetchMaterialsFromSheet(true)}
        isLoadingMaterials={isLoadingMaterials}
      />

      {/* GitHub Cloud Sync Modal */}
      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        config={gitHubConfig}
        onSaveConfig={(newConfig) => {
          setGitHubConfig(newConfig);
          addToast('success', 'GitHub Sync configuration updated.');
        }}
        onPushToGitHub={handlePushToGitHub}
        onPullFromGitHub={handlePullFromGitHub}
        isSyncing={isGitHubSyncing}
        quotesCount={quotes.length}
        clientsCount={clients.length}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
