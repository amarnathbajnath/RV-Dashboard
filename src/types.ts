export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'in_progress' | 'completed' | 'declined';

export interface MaterialItem {
  SKU: string;
  Item: string;
  Unit: string;
  Price: number | null;
  Category?: string;
  inStock?: number;
}

export interface QuoteMaterialItem {
  id: string;
  SKU: string;
  Item: string;
  Unit: string;
  Qty: number;
  Price: number | null;
  isCustom?: boolean;
  category?: string;
}

export interface JobSection {
  id: string;
  title: string;
  scope: string;
  materials: QuoteMaterialItem[];
  tmpItems: QuoteMaterialItem[];
}

export interface LabourConfig {
  labourCost: number;
  inspectionCost: number;
  hourlyRate?: number;
  estimatedHours?: number;
  crewSize?: number;
  transportCost?: number;
}

export interface Quote {
  id: string;
  quoteNo: string;
  customer: string;
  clientCompany?: string;
  address: string;
  date: string;
  validUntil?: string;
  status: QuoteStatus;
  scopeDescription: string;
  internalNotes: string;
  sections: JobSection[];
  labourConfig: LabourConfig;
  markupPct: number;
  vatPct: number;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}

export interface AppSettings {
  companyName: string;
  companySubtitle: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRegistrationNumber: string;
  defaultMarkupPct: number;
  defaultVatPct: number;
  defaultLabourRate: number;
  defaultInspectionRate: number;
  currencySymbol: string;
  googleSheetUrl: string;
  autoSave: boolean;
}

export interface CalculationBreakdown {
  materialsSubtotal: number;
  markupAmount: number;
  vatAmount: number;
  labourTotal: number;
  inspectionTotal: number;
  transportTotal: number;
  grandTotal: number;
  grossProfit: number;
  profitMarginPct: number;
  hasUnpricedItems: boolean;
  totalItemsCount: number;
}

export type ActiveTab = 'dashboard' | 'jobs' | 'inventory' | 'clients';

export interface GitHubSyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  quotesPath: string; // e.g. "data/quotes.json"
  clientsPath: string; // e.g. "data/clients.json"
  autoSyncOnSave: boolean;
  lastSyncedAt?: string;
}

export interface GitHubSyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
  quotesCount?: number;
  clientsCount?: number;
}
