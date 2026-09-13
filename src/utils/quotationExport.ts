import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/*
  Single source of truth note: this function is intentionally built to
  mirror the print/PDF template (src/app/quotation/[srno]/print/page.tsx)
  section-for-section and field-for-field:

    1) Letterhead (company name, address, phone/mobile, email, GST No)
    2) "QUOTATION" title
    3) No / Date row
    4) To / Enquiry block
    5) Items table - same columns, in the same order, with the same
       RATE_BASIS_MODE-driven Kg/Metre column visibility (showKg/showMeter
       are passed in from the print page's own computed values, not
       recomputed here, so there's exactly one place that decides which
       columns apply)
    6) TOTAL row
    7) Terms (Taxes/Payment/Rate/Delivery/Validity)
    8) Signature block

  If the printed layout changes (a field added/removed/reordered), make the
  same change here in the corresponding section so the three outputs
  (Print, PDF, Excel) never drift apart.
*/

interface CompanyRow {
  COMPANY_NAME: string;
  ADDRESS_LINE1: string;
  ADDRESS_LINE2: string;
  CITY: string;
  STATE: string;
  PINCODE: string;
  PHONE: string;
  MOBILE: string;
  EMAIL: string;
  GST_NO: string;
  LOGO_PATH: string | null;
}

interface QuotationMasterRow {
  QUOTATION_NO: string;
  QUOTATION_DATE: string;
  PARTY_NAME: string;
  PARTY_ADDRESS: string;
  PARTY_GST_NO: string;
  ENQUIRY_NO: string;
  ENQUIRY_DATE: string;
  GST_PERCENT: number;
  PAYMENT_TERMS: string;
  RATE_TERMS: string;
  DELIVERY_TERMS: string;
  VALIDITY: string;
  TOTAL_WEIGHT: number;
  TOTAL_AMOUNT_KG: number;
  TOTAL_AMOUNT_METER: number;
}

interface QuotationDetailRow {
  QUOTATION_DT_SRNO: number;
  SR_NO: number;
  IS_NOTE: boolean;
  DESCRIPTION: string;
  OD: string | null;
  GRADE: string;
  THICKNESS: string;
  LENGTH: number | null;
  QTY: number | null;
  WEIGHT: number | null;
  RATE_PER_KG: number | null;
  RATE_PER_METER: number | null;
  AMOUNT_KG: number | null;
  AMOUNT_METER: number | null;
}

const round2 = (n: number) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },
};

export const exportQuotationToExcel = async (
  company: CompanyRow | null,
  master: QuotationMasterRow,
  details: QuotationDetailRow[],
  showKg: boolean,
  showMeter: boolean,
  fmtDate: (d: string | null | undefined) => string
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Quotation', { pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1 } });

  const totalCols = 2 + (showKg ? 2 : 0) + (showMeter ? 2 : 0); // SR NO + PARTICULARS + rate/amount pairs
  let row = 1;

  const mergeCenterBold = (text: string, size = 11, underline = false) => {
    ws.mergeCells(row, 1, row, totalCols);
    const cell = ws.getCell(row, 1);
    cell.value = text;
    cell.font = { bold: true, size, underline };
    cell.alignment = { horizontal: 'center' };
    row++;
  };

  // 1) Letterhead
  mergeCenterBold(company?.COMPANY_NAME || 'Company Name Not Set', 16);
  mergeCenterBold(
    [company?.ADDRESS_LINE1, company?.ADDRESS_LINE2, company?.CITY, company?.STATE, company?.PINCODE].filter(Boolean).join(', '),
    10
  );
  if (company?.PHONE || company?.MOBILE) {
    mergeCenterBold(`${company?.PHONE ? `Tele : ${company.PHONE}` : ''}${company?.MOBILE ? `, Mob - ${company.MOBILE}` : ''}`, 10);
  }
  if (company?.EMAIL) mergeCenterBold(`Email : ${company.EMAIL}`, 10);
  if (company?.GST_NO) mergeCenterBold(`GST NO - ${company.GST_NO}`, 10, true);

  // 2) Title
  mergeCenterBold('QUOTATION', 14, true);
  row++;

  // 3) No / Date row
  ws.mergeCells(row, 1, row, Math.ceil(totalCols / 2));
  ws.getCell(row, 1).value = `NO. : ${master.QUOTATION_NO}`;
  ws.getCell(row, 1).font = { bold: true };
  ws.mergeCells(row, Math.ceil(totalCols / 2) + 1, row, totalCols);
  ws.getCell(row, Math.ceil(totalCols / 2) + 1).value = `DATE : ${fmtDate(master.QUOTATION_DATE)}`;
  ws.getCell(row, Math.ceil(totalCols / 2) + 1).font = { bold: true };
  row++;

  // 4) To / Enquiry block
  ws.mergeCells(row, 1, row, Math.ceil(totalCols / 2));
  ws.getCell(row, 1).value = `To,\n${master.PARTY_NAME}\n${master.PARTY_ADDRESS || ''}${master.PARTY_GST_NO ? `\nGSTIN: ${master.PARTY_GST_NO}` : ''}`;
  ws.getCell(row, 1).alignment = { wrapText: true, vertical: 'top' };
  ws.mergeCells(row, Math.ceil(totalCols / 2) + 1, row, totalCols);
  ws.getCell(row, Math.ceil(totalCols / 2) + 1).value = `Enquiry No - ${master.ENQUIRY_NO || '-'}\nDated ${fmtDate(master.ENQUIRY_DATE) || '-'}`;
  ws.getCell(row, Math.ceil(totalCols / 2) + 1).alignment = { wrapText: true, vertical: 'top' };
  ws.getRow(row).height = 60;
  row += 2;

  ws.mergeCells(row, 1, row, totalCols);
  ws.getCell(row, 1).value = 'We are pleased to submit our lowest quotation under -';
  row += 2;

  // 5) Items table
  const headerRowNum = row;
  const headers = ['SR NO', 'PARTICULARS', 'WEIGHT APPROX'];
  if (showKg) headers.push('RATE/KG', 'AMOUNT (Kg)');
  if (showMeter) headers.push('RATE/METRE', 'AMOUNT (Metre)');
  headers.forEach((h, idx) => {
    const cell = ws.getCell(headerRowNum, idx + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    cell.border = THIN_BORDER;
  });
  row++;

  details.forEach((d) => {
    if (d.IS_NOTE) {
      ws.mergeCells(row, 1, row, totalCols);
      const cell = ws.getCell(row, 1);
      cell.value = d.DESCRIPTION;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      cell.border = THIN_BORDER;
      row++;
      return;
    }
    const specLine = [d.OD && `${d.OD} MM OD`, d.THICKNESS && `${d.THICKNESS} MM THICK`, d.LENGTH && `${d.LENGTH} MM LENGTH`]
      .filter(Boolean)
      .join(' X ');
    const particulars = [d.DESCRIPTION, specLine, d.GRADE, d.QTY ? `${d.QTY} NOS` : null].filter(Boolean).join('\n');

    const values = [d.SR_NO, particulars, round2(d.WEIGHT || 0)];
    if (showKg) values.push(round2(d.RATE_PER_KG || 0), round2(d.AMOUNT_KG || 0));
    if (showMeter) values.push(round2(d.RATE_PER_METER || 0), round2(d.AMOUNT_METER || 0));

    values.forEach((v, idx) => {
      const cell = ws.getCell(row, idx + 1);
      cell.value = v;
      cell.border = THIN_BORDER;
      cell.alignment = idx === 1 ? { wrapText: true, vertical: 'top' } : { horizontal: 'center', vertical: 'top' };
    });
    row++;
  });

  // 6) TOTAL row
  const totalValues: (string | number)[] = ['', 'TOTAL', round2(master.TOTAL_WEIGHT || 0)];
  if (showKg) totalValues.push('', round2(master.TOTAL_AMOUNT_KG || 0));
  if (showMeter) totalValues.push('', round2(master.TOTAL_AMOUNT_METER || 0));
  totalValues.forEach((v, idx) => {
    const cell = ws.getCell(row, idx + 1);
    cell.value = v;
    cell.font = { bold: true };
    cell.border = THIN_BORDER;
    cell.alignment = { horizontal: 'center' };
  });
  row += 2;

  // 7) Terms
  const termLines = [
    `TAXES : - GST Extra ${master.GST_PERCENT}%`,
    master.PAYMENT_TERMS && `PAYMENT TERMS : ${master.PAYMENT_TERMS}`,
    master.RATE_TERMS && `RATE : ${master.RATE_TERMS}`,
    master.DELIVERY_TERMS && `DELIVERY : ${master.DELIVERY_TERMS}`,
    master.VALIDITY && `VALIDITY : ${master.VALIDITY}`,
  ].filter(Boolean) as string[];
  termLines.forEach((line) => {
    ws.mergeCells(row, 1, row, totalCols);
    ws.getCell(row, 1).value = line;
    row++;
  });
  row++;
  ws.mergeCells(row, 1, row, totalCols);
  ws.getCell(row, 1).value = 'Waiting for your valuable PO.';
  row += 2;

  // 8) Signature block
  ws.mergeCells(row, 1, row, totalCols);
  ws.getCell(row, 1).value = `For ${company?.COMPANY_NAME || 'Omech Components Pvt. Ltd.'}`;
  row += 3;
  ws.mergeCells(row, 1, row, totalCols);
  ws.getCell(row, 1).value = 'Authorized Signatory';

  // Column widths - roughly matching the print table's proportions
  ws.getColumn(1).width = 8;
  ws.getColumn(2).width = 40;
  ws.getColumn(3).width = 14;
  for (let c = 4; c <= totalCols; c++) ws.getColumn(c).width = 14;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Quotation_${master.QUOTATION_NO.replace(/[\\/]/g, '-')}.xlsx`);
};
