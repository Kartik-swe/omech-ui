import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

/**
 * Parses a date string in either "DD/MM/YYYY" or ISO "YYYY-MM-DD" (optionally
 * with a time component) into a timestamp for sorting. Returns -Infinity for
 * anything missing/unparseable so blank dates always sort last in a
 * descending sort, instead of throwing off the order.
 */
export const parseDateForSort = (value: unknown): number => {
  if (!value || typeof value !== "string") return -Infinity;
  const v = value.trim();
  if (!v) return -Infinity;

  // DD/MM/YYYY (used by RECEIVED_DATE, SLITTING_DATE, etc.)
  const dmy = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    return isNaN(t) ? -Infinity : t;
  }

  // ISO YYYY-MM-DD (used by FN_FMT_DATE / SCHEDULE_DATE, etc.)
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
    return isNaN(t) ? -Infinity : t;
  }

  const fallback = new Date(v).getTime();
  return isNaN(fallback) ? -Infinity : fallback;
};

/**
 * Returns a new array sorted by the given date field, most recent first.
 * Rows with a missing/unparseable date are pushed to the end.
 */
export const sortByDateDesc = <T extends Record<string, any>>(rows: T[], dateKey: keyof T): T[] =>
  [...rows].sort((a, b) => parseDateForSort(b[dateKey]) - parseDateForSort(a[dateKey]));

/**
 * Definition of one column in an exported sheet.
 */
export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  /** 'text' | 'number' | 'date' | 'currency' - controls number formatting */
  type?: "text" | "number" | "date" | "currency";
  /** Optional value transformer, e.g. (row) => row.A + row.B */
  render?: (row: any) => any;
}

export interface ExportSheet {
  /** Sheet/tab name (max 31 chars, Excel limit) */
  sheetName: string;
  /** Title shown in the merged banner row above the table */
  title?: string;
  columns: ExportColumn[];
  rows: any[];
}

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E78" }, // dark blue
};

const TITLE_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD9E1F2" }, // light blue
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFBFBFBF" } },
  left: { style: "thin", color: { argb: "FFBFBFBF" } },
  bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
  right: { style: "thin", color: { argb: "FFBFBFBF" } },
};

const getISTTimestamp = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330); // UTC -> IST
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};

const getISTDisplayDate = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330);
  const day = String(now.getUTCDate()).padStart(2, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const year = now.getUTCFullYear();
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes} IST`;
};

const numFmtFor = (type?: ExportColumn["type"]) => {
  switch (type) {
    case "number":
      return "#,##0.00";
    case "currency":
      return '"₹"#,##0.00';
    case "date":
      return "dd/mm/yyyy";
    default:
      return undefined;
  }
};

/**
 * Build and download a polished, multi-sheet Excel workbook.
 *
 * @param sheets  One or more sheets, each with its own columns/rows/title.
 * @param fileName Base file name (timestamp is appended automatically).
 * @param reportSubtitle Optional line placed under the title (e.g. filters applied).
 */
export const exportExcelPro = async (
  sheets: ExportSheet[],
  fileName: string,
  reportSubtitle?: string
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Omech";
  workbook.created = new Date();

  sheets.forEach((sheetDef) => {
    const safeName = sheetDef.sheetName.slice(0, 31);
    const ws = workbook.addWorksheet(safeName, {
      views: [{ state: "frozen", ySplit: sheetDef.title ? 4 : 1 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    });

    const colCount = sheetDef.columns.length;
    let headerRowNumber = 1;

    if (sheetDef.title) {
      // Title banner row
      ws.mergeCells(1, 1, 1, colCount);
      const titleCell = ws.getCell(1, 1);
      titleCell.value = sheetDef.title;
      titleCell.font = { bold: true, size: 14, color: { argb: "FF1F4E78" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = TITLE_FILL;
      ws.getRow(1).height = 24;

      // Subtitle / generated-on row
      ws.mergeCells(2, 1, 2, colCount);
      const subCell = ws.getCell(2, 1);
      subCell.value = `${reportSubtitle ? reportSubtitle + "  |  " : ""}Generated on ${getISTDisplayDate()}  |  ${sheetDef.rows.length} record(s)`;
      subCell.font = { italic: true, size: 10, color: { argb: "FF595959" } };
      subCell.alignment = { horizontal: "center" };

      // Spacer row
      ws.getRow(3).height = 6;

      headerRowNumber = 4;
    }

    // Column widths (ExcelJS applies these to the whole column, header included)
    ws.columns = sheetDef.columns.map((c) => ({
      key: c.key,
      width: c.width ?? Math.max(14, c.header.length + 4),
    }));

    // Header row
    const headerRow = ws.getRow(headerRowNumber);
    sheetDef.columns.forEach((c, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = c.header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = HEADER_FILL;
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = THIN_BORDER;
    });
    headerRow.height = 22;

    // Data rows
    sheetDef.rows.forEach((row, rowIdx) => {
      const excelRow = ws.getRow(headerRowNumber + 1 + rowIdx);
      sheetDef.columns.forEach((c, colIdx) => {
        const cell = excelRow.getCell(colIdx + 1);
        const raw = c.render ? c.render(row) : row[c.key];
        const fmt = numFmtFor(c.type);
        if (c.type === "date" && raw) {
          const d = raw instanceof Date ? raw : new Date(raw);
          if (!isNaN(d.getTime())) {
            cell.value = d;
          } else {
            cell.value = raw ?? "";
          }
        } else if ((c.type === "number" || c.type === "currency") && raw !== null && raw !== undefined && raw !== "") {
          const n = typeof raw === "number" ? raw : parseFloat(raw);
          cell.value = isNaN(n) ? raw : n;
        } else {
          cell.value = raw ?? "";
        }
        if (fmt) cell.numFmt = fmt;
        cell.border = THIN_BORDER;
        cell.alignment = { vertical: "middle", horizontal: c.type === "number" || c.type === "currency" ? "right" : "left" };
        if (rowIdx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F8FB" } };
        }
      });
    });

    // Auto filter on the header row
    if (sheetDef.rows.length > 0) {
      ws.autoFilter = {
        from: { row: headerRowNumber, column: 1 },
        to: { row: headerRowNumber, column: colCount },
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}_${getISTTimestamp()}.xlsx`);
};
