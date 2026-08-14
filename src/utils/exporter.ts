import { jsPDF } from 'jspdf';
import { AppSettings, MaterialItem, Quote } from '../types';
import { calculateQuoteFinancials } from './calculations';

/**
 * Parses Google Sheets CSV text safely with header recognition
 */
export function parseCSVToMaterials(csvText: string): MaterialItem[] {
  const lines = csvText.trim().split('\n');
  if (lines.length <= 1) return [];

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    return values;
  };

  // Header detection
  const headerRow = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  let skuIdx = headerRow.findIndex((h) => h.includes('sku') || h.includes('code') || h.includes('id') || h.includes('item#'));
  let itemIdx = headerRow.findIndex((h) => h.includes('item') || h.includes('desc') || h.includes('material') || h.includes('name'));
  let unitIdx = headerRow.findIndex((h) => h.includes('unit') || h.includes('uom') || h.includes('measure'));
  let priceIdx = headerRow.findIndex((h) => h.includes('price') || h.includes('rate') || h.includes('cost'));
  let groupIdx = headerRow.findIndex((h) =>
    h.includes('group') ||
    h.includes('logicalgroup') ||
    h.includes('logicalgroupname') ||
    h.includes('category') ||
    h.includes('classification') ||
    h.includes('section') ||
    h.includes('type')
  );
  let stockIdx = headerRow.findIndex((h) => h.includes('stock') || h.includes('qty') || h.includes('quantity'));

  // Fallbacks if headers not detected properly
  if (skuIdx === -1) skuIdx = 0;
  if (itemIdx === -1) itemIdx = 1;
  if (unitIdx === -1) unitIdx = 2;
  if (priceIdx === -1) priceIdx = 3;
  if (groupIdx === -1) groupIdx = 4;
  if (stockIdx === -1) stockIdx = 5;

  const materials: MaterialItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseLine(line);
    const itemVal = values[itemIdx] || values[1] || '';
    if (!itemVal) continue;

    const rawPrice = values[priceIdx] !== undefined ? values[priceIdx].trim().replace(/[$,TTD ]/g, '') : '';
    const price = rawPrice !== '' && !isNaN(parseFloat(rawPrice)) ? parseFloat(rawPrice) : null;
    const groupVal = values[groupIdx] || values[4] || 'General Electrical';
    const skuVal = values[skuIdx] || `SKU-${String(i).padStart(3, '0')}`;
    const unitVal = values[unitIdx] || 'each';
    const inStockVal = values[stockIdx] ? parseInt(values[stockIdx], 10) : 50;

    materials.push({
      SKU: skuVal,
      Item: itemVal,
      Unit: unitVal,
      Price: price,
      Category: groupVal,
      inStock: isNaN(inStockVal) ? 50 : inStockVal,
    });
  }

  return materials;
}

/**
 * Generates a clean, professional PDF Quotation
 */
export function generateQuotePDF(quote: Quote, settings: AppSettings): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 14;
  const MR = 14;
  const MT = 14;
  const MB = 18;
  const contentW = PAGE_W - ML - MR;
  let y = MT;
  let pageNum = 1;

  const financials = calculateQuoteFinancials(quote);
  const customer = quote.customer || 'Commercial Client';
  const company = quote.clientCompany || '';
  const address = quote.address || 'Trinidad & Tobago';
  const quoteNo = quote.quoteNo || 'QT-DRAFT';
  const currency = settings.currencySymbol || '$';

  const dateFmt = quote.date
    ? new Date(quote.date + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  function drawPageNumber() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Page ${pageNum}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
    doc.text(settings.companyName, ML, PAGE_H - 8);
    doc.text(quoteNo, PAGE_W - MR, PAGE_H - 8, { align: 'right' });
  }

  function addPage() {
    drawPageNumber();
    doc.addPage();
    pageNum++;
    y = MT;
    drawRunningHeader();
  }

  function checkY(neededHeight: number) {
    if (y + neededHeight > PAGE_H - MB) {
      addPage();
    }
  }

  function drawRunningHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(90, 95, 120);
    doc.text(`${settings.companyName}  |  Official Quotation ${quoteNo}`, ML, y);
    y += 4;
    doc.setDrawColor(210, 215, 230);
    doc.setLineWidth(0.3);
    doc.line(ML, y, PAGE_W - MR, y);
    y += 5;
  }

  function drawHorizontalLine(color = [220, 225, 235]) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.25);
    doc.line(ML, y, PAGE_W - MR, y);
  }

  // --- BRAND HEADER BAND ---
  doc.setFillColor(15, 17, 26); // #0F111A
  doc.rect(0, 0, PAGE_W, 36, 'F');

  // Badge RV
  doc.setFillColor(192, 193, 255); // #c0c1ff
  doc.roundedRect(ML, 8, 12, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 17, 26);
  doc.text('RV', ML + 6, 16, { align: 'center' });

  // Company details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(245, 247, 255);
  doc.text(settings.companyName, ML + 16, 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 185, 210);
  doc.text(settings.companySubtitle || 'Commercial & Industrial Electrical Contracting', ML + 16, 19);
  doc.text(`${settings.companyAddress} | Tel: ${settings.companyPhone}`, ML + 16, 24);

  // Quote info on top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(192, 193, 255);
  doc.text(quoteNo, PAGE_W - MR, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 205, 230);
  doc.text(`Date: ${dateFmt}`, PAGE_W - MR, 19, { align: 'right' });
  doc.text(`Status: ${quote.status.toUpperCase()}`, PAGE_W - MR, 24, { align: 'right' });

  y = 42;

  // --- CLIENT & JOB DETAILS CARD ---
  doc.setFillColor(243, 245, 250);
  doc.roundedRect(ML, y, contentW, 20, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 130);
  doc.text('QUOTED TO / CUSTOMER', ML + 4, y + 5);
  doc.text('SITE / PROJECT LOCATION', ML + 80, y + 5);
  doc.text('QUOTE DETAILS', ML + 140, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 25, 40);
  doc.text(customer + (company ? ` (${company})` : ''), ML + 4, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 45, 60);
  doc.text(address, ML + 80, y + 11);

  doc.text(`Tax ID: ${settings.taxRegistrationNumber}`, ML + 140, y + 11);
  doc.text(`Valid for: 30 Days`, ML + 140, y + 16);

  y += 26;

  // --- SCOPE OF WORK ---
  if (quote.scopeDescription) {
    checkY(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 40, 70);
    doc.text('SCOPE OF WORK', ML, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 65, 80);
    const scopeLines = doc.splitTextToSize(quote.scopeDescription, contentW);
    doc.text(scopeLines, ML, y);
    y += scopeLines.length * 4 + 4;
  }

  // --- MATERIAL LIST TABLE HEADER ---
  function renderTableHeader() {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(ML, y, contentW, 6.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('SKU', ML + 3, y + 4.5);
    doc.text('QTY', ML + 28, y + 4.5);
    doc.text('UNIT', ML + 42, y + 4.5);
    doc.text('MATERIAL DESCRIPTION', ML + 62, y + 4.5);
    doc.text('UNIT PRICE', ML + 140, y + 4.5, { align: 'right' });
    doc.text('TOTAL', PAGE_W - MR - 3, y + 4.5, { align: 'right' });
    y += 7.5;
  }

  renderTableHeader();

  // --- RENDER ITEMS ---
  let isEven = false;
  quote.sections.forEach((section, sIdx) => {
    const allItems = [...(section.materials || []), ...(section.tmpItems || [])];

    if (quote.sections.length > 1) {
      checkY(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(70, 80, 140);
      doc.text(`Section ${sIdx + 1}: ${section.title || section.scope || 'Materials'}`, ML, y + 4);
      y += 6;
    }

    allItems.forEach((item) => {
      checkY(7);
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(ML, y, contentW, 6, 'F');
      }
      isEven = !isEven;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(110, 115, 130);
      doc.text(String(item.SKU || '—').substring(0, 12), ML + 3, y + 4.2);

      doc.setTextColor(20, 25, 40);
      doc.setFont('helvetica', 'bold');
      doc.text(String(item.Qty || 1), ML + 28, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 95, 110);
      doc.text(String(item.Unit || 'each').substring(0, 10), ML + 42, y + 4.2);

      doc.setTextColor(30, 35, 50);
      const itemDesc = item.Item.length > 44 ? item.Item.substring(0, 42) + '...' : item.Item;
      doc.text(itemDesc, ML + 62, y + 4.2);

      const priceVal = item.Price !== null && item.Price !== undefined ? item.Price : null;
      const totalVal = priceVal !== null ? (priceVal * item.Qty).toFixed(2) : 'N/A';

      doc.setTextColor(70, 75, 90);
      doc.text(priceVal !== null ? `${currency}${priceVal.toFixed(2)}` : 'N/A', ML + 140, y + 4.2, {
        align: 'right',
      });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 100, 70);
      doc.text(totalVal !== 'N/A' ? `${currency}${totalVal}` : 'N/A', PAGE_W - MR - 3, y + 4.2, {
        align: 'right',
      });

      y += 6;
      drawHorizontalLine([235, 238, 245]);
    });
  });

  y += 4;

  // --- INTERNAL NOTES (IF ANY) ---
  if (quote.internalNotes) {
    checkY(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80, 85, 100);
    doc.text('JOB NOTES / REMARKS', ML, y);
    y += 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 95, 110);
    const noteLines = doc.splitTextToSize(quote.internalNotes, contentW - 70);
    doc.text(noteLines, ML, y);
  }

  // --- FINANCIAL SUMMARY BOX (STICKY FOOTER REPLICATION) ---
  checkY(52);
  const sumBoxW = 75;
  const sumBoxX = PAGE_W - MR - sumBoxW;
  const sumBoxY = y;

  doc.setFillColor(15, 17, 26); // #0F111A
  doc.roundedRect(sumBoxX, sumBoxY, sumBoxW, 46, 2, 2, 'F');

  let sy = sumBoxY + 5.5;

  function renderSummaryLine(label: string, value: string, isBig = false, highlight = false) {
    doc.setFont('helvetica', isBig ? 'bold' : 'normal');
    doc.setFontSize(isBig ? 10 : 8);

    if (highlight) {
      doc.setTextColor(192, 193, 255); // #c0c1ff
    } else if (isBig) {
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(170, 175, 195);
    }

    doc.text(label, sumBoxX + 4, sy);
    doc.text(value, sumBoxX + sumBoxW - 4, sy, { align: 'right' });
    sy += isBig ? 6.5 : 5.2;
  }

  renderSummaryLine('Materials Subtotal:', `${currency}${financials.materialsSubtotal.toFixed(2)}`);
  renderSummaryLine(`Markup (${quote.markupPct}%):`, `${currency}${financials.markupAmount.toFixed(2)}`);
  renderSummaryLine(`VAT (${quote.vatPct}% on mat+markup):`, `${currency}${financials.vatAmount.toFixed(2)}`);
  renderSummaryLine('Labour Cost:', `${currency}${financials.labourTotal.toFixed(2)}`);
  if (financials.inspectionTotal > 0) {
    renderSummaryLine('Inspection Certificate:', `${currency}${financials.inspectionTotal.toFixed(2)}`);
  }

  doc.setDrawColor(45, 50, 75);
  doc.setLineWidth(0.3);
  doc.line(sumBoxX + 3, sy - 1, sumBoxX + sumBoxW - 3, sy - 1);
  sy += 2;

  renderSummaryLine('TOTAL QUOTED:', `${currency}${financials.grandTotal.toFixed(2)}`, true, true);

  y = Math.max(y + 20, sumBoxY + 50);

  // --- SIGNATURE & AUTHORIZATION SECTION ---
  checkY(24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 105, 120);
  doc.text('Authorized Signature & Company Stamp:', ML, y + 8);
  doc.text('Client Acceptance Signature & Date:', ML + 95, y + 8);

  doc.setDrawColor(180, 185, 200);
  doc.line(ML, y + 16, ML + 75, y + 16);
  doc.line(ML + 95, y + 16, ML + 170, y + 16);

  drawPageNumber();

  // Trigger download or share
  const fileName = `Quotation_${quoteNo}_${customer.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator
      .share({
        files: [file],
        title: `Quotation ${quoteNo} - ${settings.companyName}`,
      })
      .catch(() => {
        downloadBlob(blob, fileName);
      });
  } else {
    downloadBlob(blob, fileName);
  }
}

/**
 * Exports Quote as CSV
 */
export function exportQuoteCSV(quote: Quote, settings: AppSettings): void {
  const financials = calculateQuoteFinancials(quote);
  const esc = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return '""';
    if (typeof v === 'number') return isFinite(v) ? v : '""';
    return `"${String(v).replace(/"/g, '""')}"`;
  };

  const row = (...cols: (string | number | null | undefined)[]) => cols.map(esc).join(',');
  const rows: string[] = [];

  rows.push(row(settings.companyName));
  rows.push(row('Commercial Electrical Quotation Sheet'));
  rows.push('');
  rows.push(row('Customer', quote.customer));
  rows.push(row('Company', quote.clientCompany || ''));
  rows.push(row('Site Address', quote.address));
  rows.push(row('Date', quote.date));
  rows.push(row('Quote No.', quote.quoteNo));
  rows.push(row('Status', quote.status.toUpperCase()));
  rows.push('');

  if (quote.scopeDescription) {
    rows.push(row('Scope of Work', quote.scopeDescription));
    rows.push('');
  }

  quote.sections.forEach((section, sIdx) => {
    rows.push(row(`SECTION ${sIdx + 1}`, section.title || section.scope || 'Materials'));
    rows.push(row('SKU', 'Item Description', 'Unit', 'Qty', 'Unit Price', 'Line Total'));

    const allItems = [...(section.materials || []), ...(section.tmpItems || [])];
    allItems.forEach((m) => {
      const unitP = m.Price !== null && m.Price !== undefined ? m.Price : 'N/A';
      const lineT = m.Price !== null && m.Price !== undefined ? Number((m.Price * m.Qty).toFixed(2)) : 'N/A';
      rows.push(row(m.SKU, m.Item, m.Unit, m.Qty, unitP, lineT));
    });
    rows.push('');
  });

  rows.push(row('--- FINANCIAL SUMMARY ---'));
  rows.push(row('Materials Subtotal', financials.materialsSubtotal));
  rows.push(row(`Markup (${quote.markupPct}%)`, financials.markupAmount));
  rows.push(row(`VAT (${quote.vatPct}%)`, financials.vatAmount));
  rows.push(row('Labour Cost', financials.labourTotal));
  rows.push(row('Inspection Fee', financials.inspectionTotal));
  rows.push(row('TOTAL QUOTED', financials.grandTotal));
  rows.push('');

  if (quote.internalNotes) {
    rows.push(row('Internal Notes', quote.internalNotes));
  }

  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `Quotation_${quote.quoteNo || 'Job'}_${quote.customer.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

  downloadBlob(blob, fileName);
}

/**
 * Downloads a binary Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
