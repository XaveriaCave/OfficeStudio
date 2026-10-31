import { jsPDF } from 'jspdf';
import { AccountingInvoice, Company, OfficeAccounting, OfficeSpace } from '../types';

export interface InvoicePdfOptions {
  invoice: AccountingInvoice;
  office: OfficeSpace;
  company?: Company;
  taxRate?: number;
  invoiceNumber?: string;
  notes?: string;
  paymentTerms?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    routingOrIfsc?: string;
    swift?: string;
  };
}

export interface StatementPdfOptions {
  office: OfficeSpace;
  company?: Company;
  accounting: OfficeAccounting;
  invoices: AccountingInvoice[];
  periodLabel?: string;
}

/**
 * Maps currency symbols to standard PDF-safe ASCII equivalents for jsPDF's Helvetica font.
 * Standard PDF Helvetica does not support multi-byte Unicode glyphs like '₹' (Indian Rupee),
 * which otherwise corrupts WinAnsiEncoding into '¹' and creates wide character kerning gaps.
 */
export function getPdfSafeCurrency(currency: string = '$'): string {
  if (!currency) return '$';
  const trimmed = currency.trim();
  if (trimmed === '₹' || trimmed === 'INR' || trimmed.includes('₹')) return 'INR ';
  if (trimmed === '€' || trimmed === 'EUR') return 'EUR ';
  if (trimmed === '£' || trimmed === 'GBP') return 'GBP ';
  if (trimmed === '¥' || trimmed === 'JPY' || trimmed === 'CNY') return 'JPY ';
  if (trimmed === 'S$' || trimmed === 'SGD') return 'SGD ';
  if (trimmed === 'A$' || trimmed === 'AUD') return 'AUD ';
  if (trimmed === 'C$' || trimmed === 'CAD') return 'CAD ';
  if (trimmed === 'AED') return 'AED ';
  if (trimmed === 'CHF') return 'CHF ';
  return trimmed;
}

/**
 * Formats a number for PDF generation using PDF-safe ASCII currency codes
 */
export function formatPdfCurrency(amount: number, currency: string = '$'): string {
  const safeCurrency = getPdfSafeCurrency(currency);
  const parts = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${safeCurrency}${parts}`;
}

/**
 * Formats a number for HTML Web UI with full native Unicode symbol (e.g. ₹, €, £, $)
 */
export function formatDisplayCurrency(amount: number, currency: string = '$'): string {
  const parts = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${parts}`;
}

/**
 * Generate and download an individual Invoice / Bill PDF
 */
export function generateInvoicePdf(options: InvoicePdfOptions): jsPDF {
  const {
    invoice,
    office,
    company,
    taxRate = office.accounting?.taxRate ?? 18,
    notes,
    paymentTerms = 'Net 30 Days',
    bankDetails = {
      bankName: 'Global Silicon Corporate Bank',
      accountName: company?.name || 'Enterprise Holdings Ltd',
      accountNumber: '9482-1049-8821',
      routingOrIfsc: 'GSCB0004921',
      swift: 'GSCBUS33',
    },
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isReceivable = invoice.type === 'receivable';
  const currency = company?.currency || office.accounting?.currency || '$';
  const cleanId = invoice.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '01';
  const invoiceNumber =
    options.invoiceNumber ||
    (isReceivable
      ? `INV-2026-${office.code.replace(/[^a-zA-Z0-9]/g, '')}-${cleanId}`
      : `BILL-2026-${office.code.replace(/[^a-zA-Z0-9]/g, '')}-${cleanId}`);

  const issueDate = new Date().toISOString().split('T')[0];
  const dueDate = invoice.dueDate || '2026-11-30';

  // Tax calculations
  const totalAmount = invoice.amount;
  const taxPercent = taxRate > 0 ? taxRate : 0;
  // If total is inclusive of tax, calculate base and tax
  const subtotal = totalAmount / (1 + taxPercent / 100);
  const taxAmount = totalAmount - subtotal;

  // Colors
  const primaryOrange = [234, 88, 12]; // #ea580c
  const slateDark = [15, 23, 42]; // #0f172a
  const slateMuted = [100, 116, 139]; // #64748b
  const slateBorder = [226, 232, 240]; // #e2e8f0
  const emeraldGreen = [22, 101, 52]; // #166534

  // Top Accent Header Bar
  doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
  doc.rect(0, 0, 210, 5, 'F');

  // Header Title & Logo Area
  let y = 18;

  // Company Brand Name & Document Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(company?.name || 'Enterprise Corporate Group', 14, y);

  // Document Type Header on Right
  doc.setFontSize(16);
  doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
  const docTypeTitle = isReceivable ? 'TAX INVOICE' : 'VENDOR EXPENSE BILL';
  doc.text(docTypeTitle, 196, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `${company?.companyType || 'Corporate Entity'} · Spatial Office Studio Management`,
    14,
    y
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`#${invoiceNumber}`, 196, y, { align: 'right' });

  // Divider line
  y += 6;
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);

  // Two-column Party Details (Seller & Buyer / Issuer & Vendor)
  y += 8;
  const colLeftX = 14;
  const colRightX = 110;

  // Left Column: Issuer (Our Company & Office Suite)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
  doc.text(isReceivable ? 'ISSUED BY / SERVICE PROVIDER' : 'PAYABLE BY / ENTITY', colLeftX, y);

  // Right Column: Counterparty (Client or Vendor)
  doc.text(isReceivable ? 'BILLED TO / CLIENT DETAILS' : 'VENDOR / PAYEE DETAILS', colRightX, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(company?.name || 'Corporate Office', colLeftX, y);
  doc.text(invoice.counterparty || 'Enterprise Client', colRightX, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Suite: ${office.name} (${office.code}) · Floor 0${office.floorLevel}`, colLeftX, y);
  doc.text(`Category: ${invoice.category || 'Professional Services'}`, colRightX, y);

  y += 4;
  if (company?.gstDetails) {
    doc.text(`GST / Tax ID: ${company.gstDetails}`, colLeftX, y);
  } else {
    doc.text(`Department: ${office.department}`, colLeftX, y);
  }
  doc.text(`Payment Terms: ${paymentTerms}`, colRightX, y);

  y += 4;
  if (company?.registeredAddress) {
    const addressLines = doc.splitTextToSize(company.registeredAddress, 85);
    doc.text(addressLines[0] || '', colLeftX, y);
  } else {
    doc.text(`Domain: ${company?.domain || 'office.studio.v'}`, colLeftX, y);
  }
  doc.text(`Status: ${invoice.status.toUpperCase()}`, colRightX, y);

  y += 4;
  if (company?.contactEmail || company?.phone) {
    doc.text(`${company.contactEmail || ''} ${company.phone ? `· ${company.phone}` : ''}`, colLeftX, y);
  }

  // Invoice Metadata Pill Box
  y += 7;
  doc.setFillColor(254, 247, 238); // warm cream orange-50
  doc.setDrawColor(254, 215, 170); // orange-200
  doc.roundedRect(14, y, 182, 14, 2, 2, 'FD');

  const metaBoxY = y + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('INVOICE DATE', 20, metaBoxY);
  doc.text('DUE DATE', 65, metaBoxY);
  doc.text('PAYMENT STATUS', 110, metaBoxY);
  doc.text('TOTAL AMOUNT DUE', 155, metaBoxY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(issueDate, 20, metaBoxY + 5);
  doc.text(dueDate, 65, metaBoxY + 5);

  // Status with colored indicator
  if (invoice.status === 'paid') {
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.text('PAID / CLEARED', 110, metaBoxY + 5);
  } else if (invoice.status === 'overdue') {
    doc.setTextColor(225, 29, 72);
    doc.text('OVERDUE', 110, metaBoxY + 5);
  } else {
    doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
    doc.text('PENDING', 110, metaBoxY + 5);
  }

  doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
  doc.text(formatPdfCurrency(totalAmount, currency), 155, metaBoxY + 5);

  // Itemized Line Items Table
  y += 20;

  // Table Header
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(14, y, 182, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', 18, y + 5.5);
  doc.text('DESCRIPTION & SPECIFICATION', 28, y + 5.5);
  doc.text('CATEGORY', 105, y + 5.5);
  doc.text('QTY', 140, y + 5.5, { align: 'center' });
  doc.text('RATE', 165, y + 5.5, { align: 'right' });
  doc.text('AMOUNT', 190, y + 5.5, { align: 'right' });

  // Table Body Rows
  y += 8;
  const items = [
    {
      index: 1,
      description: invoice.description || `${invoice.category} fulfillment for ${office.name}`,
      category: invoice.category,
      qty: 1,
      rate: subtotal,
      amount: subtotal,
    },
  ];

  items.forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 12, 'F');
    }
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.line(14, y + 12, 196, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(String(item.index), 18, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.text(item.description, 28, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(`Suite Code: ${office.code} · Spatial Reference: ${office.name}`, 28, y + 9.5);

    doc.setFontSize(8.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(item.category, 105, y + 7);
    doc.text(String(item.qty), 140, y + 7, { align: 'center' });
    doc.text(formatPdfCurrency(item.rate, currency), 165, y + 7, { align: 'right' });
    doc.text(formatPdfCurrency(item.amount, currency), 190, y + 7, { align: 'right' });

    y += 12;
  });

  // Financial Breakdown Card (Subtotal, GST/Tax, Total)
  y += 6;
  const calcBoxWidth = 88;
  const calcBoxX = 196 - calcBoxWidth; // 108mm, aligned with right page margin

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.roundedRect(calcBoxX, y, calcBoxWidth, 34, 2, 2, 'D');

  let calcY = y + 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Net Subtotal:', calcBoxX + 6, calcY);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(formatPdfCurrency(subtotal, currency), calcBoxX + calcBoxWidth - 7, calcY, {
    align: 'right',
  });

  calcY += 6.5;
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Tax / GST (${taxPercent}%):`, calcBoxX + 6, calcY);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(formatPdfCurrency(taxAmount, currency), calcBoxX + calcBoxWidth - 7, calcY, {
    align: 'right',
  });

  calcY += 4.5;
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.line(calcBoxX + 5, calcY, calcBoxX + calcBoxWidth - 5, calcY);

  calcY += 7.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
  doc.text('Total Amount:', calcBoxX + 6, calcY);
  doc.text(formatPdfCurrency(totalAmount, currency), calcBoxX + calcBoxWidth - 7, calcY, {
    align: 'right',
  });

  // Left side: Banking / Remittance Details
  const bankBoxX = 14;
  const bankBoxWidth = 88;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(bankBoxX, y, bankBoxWidth, 34, 2, 2, 'FD');

  let bankY = y + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('REMITTANCE & WIRE PAYMENT DETAILS', bankBoxX + 5, bankY);

  bankY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Bank Name: ${bankDetails.bankName || 'Global Commercial Bank'}`, bankBoxX + 5, bankY);
  bankY += 4;
  doc.text(`Account Name: ${bankDetails.accountName || company?.name}`, bankBoxX + 5, bankY);
  bankY += 4;
  doc.text(`Account No: ${bankDetails.accountNumber} · Swift: ${bankDetails.swift}`, bankBoxX + 5, bankY);
  bankY += 4;
  doc.text(`IFSC / Routing: ${bankDetails.routingOrIfsc}`, bankBoxX + 5, bankY);

  // Notes & Terms
  y += 38;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('TERMS & CONDITIONS / AUDIT MEMO:', 14, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  const defaultNotes =
    notes ||
    `Payment is due within ${paymentTerms} from invoice date. Please cite invoice reference #${invoiceNumber} in wire remittance. Questions regarding this invoice can be directed to the corporate spatial finance department at ${company?.contactEmail || 'finance@pacificmind.io'}.`;
  const noteLines = doc.splitTextToSize(defaultNotes, 182);
  doc.text(noteLines, 14, y);

  // Signature Block
  y += 18;
  const signX = 130;
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.line(signX, y, 196, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Authorized Finance Controller', signX, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);

  // Find managing agent name if present
  const managingAgent = office.agents?.find((a) => a.isAccountingAgent);
  const signatoryName = managingAgent
    ? `${managingAgent.name} (${managingAgent.role})`
    : 'Corporate Treasury Controller';
  doc.text(signatoryName, signX, y);

  y += 4;
  doc.text(`Digital Sign-off: ${new Date().toISOString()}`, signX, y);

  // Paid watermark stamp if paid
  if (invoice.status === 'paid') {
    doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(signX - 45, y - 22, 38, 14, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.text('PAID IN FULL', signX - 26, y - 13, { align: 'center' });
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `office.studio.v Financial Architecture Suite · Generated on ${new Date().toLocaleDateString()} · Page 1 of 1`,
    105,
    288,
    { align: 'center' }
  );

  return doc;
}

/**
 * Downloads the generated invoice PDF directly in the user's browser
 */
export function downloadInvoicePdf(options: InvoicePdfOptions): void {
  const doc = generateInvoicePdf(options);
  const cleanId = options.invoice.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  const filename = `${options.invoice.type === 'receivable' ? 'Invoice' : 'Bill'}_${options.office.code}_${cleanId}.pdf`;
  doc.save(filename);
}

/**
 * Generate and download a comprehensive Ledger & Accounting Statement PDF
 */
export function generateStatementPdf(options: StatementPdfOptions): jsPDF {
  const { office, company, accounting, invoices, periodLabel = 'Fiscal Year 2026' } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = company?.currency || accounting.currency || '$';
  const primaryOrange = [234, 88, 12];
  const slateDark = [15, 23, 42];
  const slateMuted = [100, 116, 139];
  const slateBorder = [226, 232, 240];

  // Top Accent Bar
  doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
  doc.rect(0, 0, 210, 5, 'F');

  let y = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(company?.name || 'Enterprise Corporate Group', 14, y);

  doc.setFontSize(14);
  doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
  doc.text('FINANCIAL STATEMENT & LEDGER', 196, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `Office Suite: ${office.name} (${office.code}) · Floor 0${office.floorLevel} · ${periodLabel}`,
    14,
    y
  );
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);

  // Financial Metrics Summary Grid (4 Cards)
  y += 7;
  const cardWidth = 43;
  const cardHeight = 16;
  const metrics = [
    { label: 'MONTHLY REVENUE', val: formatPdfCurrency(accounting.monthlyRevenue, currency) },
    { label: 'LIQUID RESERVES', val: formatPdfCurrency(accounting.cashReserves, currency) },
    {
      label: 'TOTAL RECEIVABLES',
      val: formatPdfCurrency(
        invoices
          .filter((i) => i.type === 'receivable')
          .reduce((sum, i) => sum + i.amount, 0),
        currency
      ),
    },
    {
      label: 'TOTAL PAYABLES',
      val: formatPdfCurrency(
        invoices
          .filter((i) => i.type === 'payable')
          .reduce((sum, i) => sum + i.amount, 0),
        currency
      ),
    },
  ];

  metrics.forEach((m, idx) => {
    const cardX = 14 + idx * (cardWidth + 3.3);
    doc.setFillColor(254, 247, 238);
    doc.setDrawColor(254, 215, 170);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(m.label, cardX + 3.5, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(m.val, cardX + 3.5, y + 11.5);
  });

  // Table of Invoices & Ledger
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Itemized Accounts Ledger (${invoices.length} entries)`, 14, y);

  y += 4;
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(14, y, 182, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TYPE', 18, y + 4.8);
  doc.text('COUNTERPARTY', 42, y + 4.8);
  doc.text('CATEGORY', 90, y + 4.8);
  doc.text('DUE DATE', 130, y + 4.8);
  doc.text('STATUS', 158, y + 4.8);
  doc.text('AMOUNT', 190, y + 4.8, { align: 'right' });

  y += 7;
  invoices.forEach((inv, idx) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 8, 'F');
    }
    doc.setDrawColor(slateBorder[0], slateBorder[1], slateBorder[2]);
    doc.line(14, y + 8, 196, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (inv.type === 'receivable') {
      doc.setTextColor(22, 101, 52);
      doc.text('+ REC', 18, y + 5.2);
    } else {
      doc.setTextColor(225, 29, 72);
      doc.text('- PAY', 18, y + 5.2);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(inv.counterparty.slice(0, 24), 42, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(inv.category.slice(0, 20), 90, y + 5.2);
    doc.text(inv.dueDate, 130, y + 5.2);

    if (inv.status === 'paid') {
      doc.setTextColor(22, 101, 52);
      doc.text('PAID', 158, y + 5.2);
    } else {
      doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
      doc.text('PENDING', 158, y + 5.2);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(formatPdfCurrency(inv.amount, currency), 190, y + 5.2, { align: 'right' });

    y += 8;
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    `office.studio.v Financial Architecture Suite · Statement for ${office.name} (${office.code}) · Page 1 of 1`,
    105,
    288,
    { align: 'center' }
  );

  return doc;
}

/**
 * Downloads the full accounting statement PDF
 */
export function downloadStatementPdf(options: StatementPdfOptions): void {
  const doc = generateStatementPdf(options);
  const filename = `Statement_${options.office.code}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
