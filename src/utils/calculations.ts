import { CalculationBreakdown, JobSection, Quote, QuoteMaterialItem } from '../types';

/**
 * Calculates total for a single item (Qty * Price)
 */
export function calculateItemTotal(qty: number, price: number | null | undefined): number {
  if (price === null || price === undefined || isNaN(price)) return 0;
  const validQty = isNaN(qty) || qty < 0 ? 0 : qty;
  return Number((validQty * price).toFixed(2));
}

/**
 * Calculates totals for a single section
 */
export function calculateSectionTotals(section: JobSection): {
  subtotal: number;
  itemsCount: number;
  hasUnpriced: boolean;
} {
  let subtotal = 0;
  let hasUnpriced = false;
  let itemsCount = 0;

  const processItems = (items: QuoteMaterialItem[]) => {
    for (const item of items) {
      itemsCount += item.Qty || 1;
      if (item.Price === null || item.Price === undefined || isNaN(item.Price)) {
        hasUnpriced = true;
      } else {
        subtotal += (item.Qty || 0) * item.Price;
      }
    }
  };

  processItems(section.materials || []);
  processItems(section.tmpItems || []);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    itemsCount,
    hasUnpriced,
  };
}

/**
 * Calculates complete financial breakdown for a quote
 */
export function calculateQuoteFinancials(quote: Quote | null | undefined): CalculationBreakdown {
  if (!quote) {
    return {
      materialsSubtotal: 0,
      markupAmount: 0,
      vatAmount: 0,
      labourTotal: 0,
      inspectionTotal: 0,
      transportTotal: 0,
      grandTotal: 0,
      grossProfit: 0,
      profitMarginPct: 0,
      hasUnpricedItems: false,
      totalItemsCount: 0,
    };
  }

  let materialsSubtotal = 0;
  let hasUnpricedItems = false;
  let totalItemsCount = 0;

  if (quote.sections && Array.isArray(quote.sections)) {
    for (const section of quote.sections) {
      const { subtotal, itemsCount, hasUnpriced } = calculateSectionTotals(section);
      materialsSubtotal += subtotal;
      totalItemsCount += itemsCount;
      if (hasUnpriced) hasUnpricedItems = true;
    }
  }

  materialsSubtotal = Number(materialsSubtotal.toFixed(2));

  // Markup calculation (Applies to materials)
  const markupPct = Math.max(0, Number(quote.markupPct) || 0);
  const markupAmount = Number((materialsSubtotal * (markupPct / 100)).toFixed(2));

  // VAT calculation (Applies to materials + markup)
  const vatPct = Math.max(0, Number(quote.vatPct) || 0);
  const vatBase = materialsSubtotal + markupAmount;
  const vatAmount = Number((vatBase * (vatPct / 100)).toFixed(2));

  // Labour, Inspection and Transport (Added at face value after VAT)
  const labourTotal = Math.max(0, Number(quote.labourConfig?.labourCost) || 0);
  const inspectionTotal = Math.max(0, Number(quote.labourConfig?.inspectionCost) || 0);
  const transportTotal = Math.max(0, Number(quote.labourConfig?.transportCost) || 0);

  // Grand Total
  const grandTotal = Number(
    (materialsSubtotal + markupAmount + vatAmount + labourTotal + inspectionTotal + transportTotal).toFixed(2)
  );

  // Profit calculations
  const grossProfit = Number((markupAmount + labourTotal * 0.4).toFixed(2)); // estimated internal contribution
  const profitMarginPct = grandTotal > 0 ? Number(((grossProfit / grandTotal) * 100).toFixed(1)) : 0;

  return {
    materialsSubtotal,
    markupAmount,
    vatAmount,
    labourTotal,
    inspectionTotal,
    transportTotal,
    grandTotal,
    grossProfit,
    profitMarginPct,
    hasUnpricedItems,
    totalItemsCount,
  };
}

/**
 * Currency formatting helper
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencySymbol = '$',
  showSymbol = true
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${currencySymbol}0.00` : '0.00';
  }
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return showSymbol ? `${currencySymbol}${formatted}` : formatted;
}

/**
 * Quote Number Auto-Generator
 */
export function generateQuoteNumber(existingQuotes: Quote[] = []): string {
  const currentYear = new Date().getFullYear();
  const yearQuotes = existingQuotes.filter(q => q.quoteNo && q.quoteNo.includes(String(currentYear)));
  const nextNum = yearQuotes.length + 1;
  return `QT-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Temporary SKU Generator
 */
export function generateTmpSku(existingCount = 0): string {
  return `TMP-${String(existingCount + 1).padStart(3, '0')}`;
}

/**
 * Smart Quote Improvement & Margin Insights
 */
export function getQuoteOptimizationInsights(quote: Quote, financials: CalculationBreakdown): {
  type: 'info' | 'warning' | 'success' | 'tip';
  title: string;
  description: string;
}[] {
  const insights: {
    type: 'info' | 'warning' | 'success' | 'tip';
    title: string;
    description: string;
  }[] = [];

  if (financials.hasUnpricedItems) {
    insights.push({
      type: 'warning',
      title: 'Unpriced Material Items Found',
      description: 'One or more items in the material list have no unit price. Total quotation may underestimate true project costs.',
    });
  }

  if (quote.markupPct < 15 && financials.materialsSubtotal > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Material Markup (<15%)',
      description: 'Commercial electrical projects in Trinidad & Tobago typically aim for 20%–30% markup to buffer against supply chain price increases.',
    });
  } else if (quote.markupPct >= 25) {
    insights.push({
      type: 'success',
      title: 'Healthy Margin Target',
      description: `Markup set to ${quote.markupPct}%, providing strong coverage for material price fluctuations.`,
    });
  }

  if (financials.materialsSubtotal > 1500 && financials.labourTotal === 0) {
    insights.push({
      type: 'tip',
      title: 'Missing Labour Cost',
      description: 'You have significant materials listed ($' + financials.materialsSubtotal.toFixed(2) + ') but no Labour or Inspection fee configured.',
    });
  }

  if (financials.materialsSubtotal > 3000 && !quote.labourConfig?.inspectionCost) {
    insights.push({
      type: 'info',
      title: 'Electrical Inspection Check',
      description: 'High-power or multi-panel jobs usually require a Ministry/T&TEC Inspectorate certificate fee.',
    });
  }

  if (quote.vatPct !== 12.5) {
    insights.push({
      type: 'info',
      title: 'Custom VAT Applied',
      description: `Current VAT rate is ${quote.vatPct}%. Standard commercial VAT rate in T&T is 12.5%.`,
    });
  }

  return insights;
}
