import Cookies from 'js-cookie';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
// export const getCookieData = () => ({
//     USER_SRNO: 1,
//     UT_SRNO: 1,
//     API_BASE_URL:`${process.env.NEXT_PUBLIC_API_BASE_URL}api/omech/`,
//     AUTH_TOKEN: '',
// });

interface Header {
  key?: string;
  dataIndex?: string;
  title: string;
  render? :any;
}

export const getCookieData = () => {
  const userData = Cookies.get("user");
  const user = userData ? JSON.parse(userData) : null;

  return {
    USER_SRNO: user ? user.userId : null, // Get userId from stored user
    UT_SRNO: user ? user.role : null, // Assuming role acts as a type identifier
    API_BASE_URL: `${process.env.NEXT_PUBLIC_API_BASE_URL}api/omech/`,
    AUTH_TOKEN: Cookies.get("token") || "",
  };
};

export const getToken = () => {
    return Cookies.get("token");
  };
  
  export const isAuthenticated = () => {
    return !!getToken();
  };
  
  export const logout = () => {
    Cookies.remove("token");
  };

  
export const getSelectedText = (value: number, options: any[]): string => {
    const selectedOption = options.find((option:any) => option.value === value);
    return selectedOption ? selectedOption.label : '';
};



// Function to get the current timestamp in IST (YYYY-MM-DD_HH-MM-SS)
const getISTTimestamp = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330); // Convert UTC to IST (UTC+5:30)

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};



export const exportToExcel = (
  data: any[],
  fileName: string,
  headers?: Header[],
  headerText?: string // Optional main heading
) => {
  let ws;

  if (headers && headers.length > 0) {
    // Filter headers that have a dataIndex
    const validHeaders = headers.filter((header) => header.dataIndex);

    // Convert data to match headers structure
    const formattedData = data.map((row) => {
      let newRow: any = {};
      validHeaders.forEach(({ dataIndex, title }) => {
        if (dataIndex) newRow[title] = row[dataIndex]; // Only add columns with valid dataIndexs
      });
      return newRow;
    });

    ws = XLSX.utils.json_to_sheet(formattedData);
  } else {
    // Default behavior if no headers are provided
    ws = XLSX.utils.json_to_sheet(data);
  }


  if (headerText) {
    const range = XLSX.utils.decode_range(ws["!ref"] as string);
    const totalColumns = range.e.c - range.s.c + 1;

    // Insert three rows
    const titleRow = [[headerText]]; // First row
    const secondRow = [[""]]; // Second row (for merging)
    const emptyRow = [[""]]; // Third row (for spacing)

    const newSheet = XLSX.utils.aoa_to_sheet([...titleRow, ...secondRow, ...emptyRow]);

    XLSX.utils.sheet_add_json(newSheet, XLSX.utils.sheet_to_json(ws, { header: 1 }), {
      skipHeader: true,
      origin: -1, // Insert at the beginning
    });

    if (!newSheet["!merges"]) newSheet["!merges"] = [];
    newSheet["!merges"].push({
      s: { r: 0, c: 0 },
      e: { r: 1, c: totalColumns - 1 }, // Merge across columns
    });

    ws = newSheet;
  }

  // Define column widths to make the sheet look cleaner
  ws["!cols"] = new Array(10).fill({ wch: 20 });



  // Generate filename with timestamp (YYYY-MM-DD_HH-MM-SS)
  const fullFileName = `${fileName}_${getISTTimestamp()}.xlsx`;

  // Create a new workbook and append the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Write the workbook and convert it to a Blob
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });

  // Save the file
  saveAs(dataBlob, fullFileName);
};




