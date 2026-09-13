'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Spin, Result, Space, message } from 'antd';
import { PrinterOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { apiClient } from '@/utils/apiClient';
import { getCookieData } from '@/utils/common';
import { exportQuotationToExcel } from '@/utils/quotationExport';
import dayjs from 'dayjs';

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
  QUOTATION_SRNO: number;
  QUOTATION_NO: string;
  QUOTATION_DATE: string;
  PARTY_NAME: string;
  PARTY_ADDRESS: string;
  PARTY_GST_NO: string;
  ENQUIRY_NO: string;
  ENQUIRY_DATE: string;
  RATE_BASIS_MODE: 'K' | 'M' | 'BOTH';
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
const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '' : round2(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const fmtDate = (d: string | null | undefined) => (d ? dayjs(d).format('DD/MM/YYYY') : '');

const QuotationPrintPage = () => {
  const params = useParams();
  const srno = params?.srno as string;
  const { API_BASE_URL } = getCookieData();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [master, setMaster] = useState<QuotationMasterRow | null>(null);
  const [details, setDetails] = useState<QuotationDetailRow[]>([]);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [excelGenerating, setExcelGenerating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srno]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [companyRes, quotationRes] = await Promise.all([
        apiClient(`${API_BASE_URL}DtCompanyMaster`, 'GET'),
        apiClient(`${API_BASE_URL}DtQuotationDtl?QUOTATION_SRNO=${srno}`, 'GET'),
      ]);
      if (companyRes.msgId === 200 && companyRes.data?.Table?.[0]) {
        setCompany(companyRes.data.Table[0]);
      }
      if (quotationRes.msgId === 200 && quotationRes.data) {
        setMaster(quotationRes.data.Table?.[0] || null);
        setDetails(quotationRes.data.Table1 || []);
      }
    } catch (err) {
      console.error('Error loading quotation for print:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!master) {
    return <Result status="404" title="Quotation not found" />;
  }

  const showKg = master.RATE_BASIS_MODE === 'K' || master.RATE_BASIS_MODE === 'BOTH';
  const showMeter = master.RATE_BASIS_MODE === 'M' || master.RATE_BASIS_MODE === 'BOTH';

  // Download PDF: captures the exact same rendered DOM node used for Print
  // (sheetRef) via html2canvas, then drops that image into a jsPDF file -
  // this is what guarantees the PDF looks identical to Print, since it's a
  // literal snapshot of the same template, not a separately re-typeset
  // document. Splits across multiple A4 pages if the quotation is long.
  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    setPdfGenerating(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(sheetRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Quotation_${master.QUOTATION_NO.replace(/[\\/]/g, '-')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      message.error('Failed to generate PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadExcel = async () => {
    setExcelGenerating(true);
    try {
      await exportQuotationToExcel(company, master, details, showKg, showMeter, fmtDate);
    } catch (err) {
      console.error('Error generating Excel:', err);
      message.error('Failed to generate Excel');
    } finally {
      setExcelGenerating(false);
    }
  };

  return (
    <div style={{ background: '#e9e9e9', minHeight: '100vh', paddingBottom: 40 }}>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .quotation-sheet { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', padding: 16 }}>
        <Space>
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
            Print
          </Button>
          <Button icon={<FilePdfOutlined />} loading={pdfGenerating} onClick={handleDownloadPdf}>
            Download PDF
          </Button>
          <Button icon={<FileExcelOutlined />} loading={excelGenerating} onClick={handleDownloadExcel}>
            Download Excel
          </Button>
        </Space>
      </div>

      <div
        className="quotation-sheet"
        ref={sheetRef}
        style={{
          background: 'white',
          maxWidth: 900,
          margin: '0 auto',
          padding: 24,
          border: '2px solid #000',
          fontFamily: 'Arial, sans-serif',
          fontSize: 13,
          color: '#000',
        }}
      >
        {/* Letterhead */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 8 }}>
          {company?.LOGO_PATH && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.LOGO_PATH}
              alt={company.COMPANY_NAME || 'Company Logo'}
              style={{ maxHeight: 70, objectFit: 'contain', marginBottom: 4 }}
            />
          )}
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{company?.COMPANY_NAME || 'Company Name Not Set'}</div>
          <div>
            {[company?.ADDRESS_LINE1, company?.ADDRESS_LINE2, company?.CITY, company?.STATE, company?.PINCODE]
              .filter(Boolean)
              .join(', ')}
          </div>
          <div>
            {company?.PHONE && <>Tele : {company.PHONE}</>}
            {company?.MOBILE && <>, Mob - {company.MOBILE}</>}
          </div>
          {company?.EMAIL && (
            <div style={{ color: '#0645AD' }}>
              Email : {company.EMAIL}
            </div>
          )}
          {company?.GST_NO && <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>GST NO - {company.GST_NO}</div>}
          <div style={{ fontSize: 18, fontWeight: 'bold', textDecoration: 'underline', marginTop: 4 }}>QUOTATION</div>
        </div>

        {/* No / Date row */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: 4, width: '50%' }}>
                <strong>NO. :</strong> {master.QUOTATION_NO}
              </td>
              <td style={{ border: '1px solid #000', padding: 4, width: '50%' }}>
                <strong>DATE :</strong> {fmtDate(master.QUOTATION_DATE)}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: 4, verticalAlign: 'top' }} colSpan={1}>
                <div><strong>To,</strong></div>
                <div style={{ fontWeight: 'bold' }}>{master.PARTY_NAME}</div>
                <div>{master.PARTY_ADDRESS}</div>
                {master.PARTY_GST_NO && <div>GSTIN: {master.PARTY_GST_NO}</div>}
              </td>
              <td style={{ border: '1px solid #000', padding: 4, verticalAlign: 'top' }}>
                <div><strong>Enquiry No</strong> - {master.ENQUIRY_NO || '-'}</div>
                <div>Dated {fmtDate(master.ENQUIRY_DATE) || '-'}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ margin: '10px 0' }}>We are pleased to submit our lowest quotation under -</div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
          <thead>
            <tr>
              <th style={thStyle}>SR NO</th>
              <th style={thStyle}>PARTICULARS</th>
              <th style={thStyle}>WEIGHT<br />APPROX</th>
              {showKg && <th style={thStyle}>RATE/KG</th>}
              {showKg && <th style={thStyle}>AMOUNT (Kg)</th>}
              {showMeter && <th style={thStyle}>RATE/METRE</th>}
              {showMeter && <th style={thStyle}>AMOUNT (Metre)</th>}
            </tr>
          </thead>
          <tbody>
            {details.map((d) =>
              d.IS_NOTE ? (
                <tr key={d.QUOTATION_DT_SRNO} style={{ background: '#ffff00' }}>
                  <td style={tdStyle}></td>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }} colSpan={showKg && showMeter ? 5 : showKg || showMeter ? 3 : 1}>
                    {d.DESCRIPTION}
                  </td>
                </tr>
              ) : (
                <tr key={d.QUOTATION_DT_SRNO}>
                  <td style={tdStyle}>{d.SR_NO}</td>
                  <td style={{ ...tdStyle, textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold' }}>{d.DESCRIPTION}</div>
                    <div>
                      {[d.OD && `${d.OD} MM OD`, d.THICKNESS && `${d.THICKNESS} MM THICK`, d.LENGTH && `${d.LENGTH} MM LENGTH`]
                        .filter(Boolean)
                        .join(' X ')}
                    </div>
                    {d.GRADE && <div>{d.GRADE}</div>}
                    {d.QTY ? <div>{d.QTY} NOS</div> : null}
                  </td>
                  <td style={tdStyle}>{fmt(d.WEIGHT)}</td>
                  {showKg && <td style={tdStyle}>{fmt(d.RATE_PER_KG)}</td>}
                  {showKg && <td style={tdStyle}>{fmt(d.AMOUNT_KG)}</td>}
                  {showMeter && <td style={tdStyle}>{fmt(d.RATE_PER_METER)}</td>}
                  {showMeter && <td style={tdStyle}>{fmt(d.AMOUNT_METER)}</td>}
                </tr>
              )
            )}
            <tr style={{ fontWeight: 'bold' }}>
              <td style={tdStyle}></td>
              <td style={tdStyle}>TOTAL</td>
              <td style={tdStyle}>{fmt(master.TOTAL_WEIGHT)}</td>
              {showKg && <td style={tdStyle}></td>}
              {showKg && <td style={tdStyle}>{fmt(master.TOTAL_AMOUNT_KG)}</td>}
              {showMeter && <td style={tdStyle}></td>}
              {showMeter && <td style={tdStyle}>{fmt(master.TOTAL_AMOUNT_METER)}</td>}
            </tr>
          </tbody>
        </table>

        {/* Terms */}
        <div style={{ lineHeight: 1.8 }}>
          <div><strong>TAXES :</strong> - GST Extra {master.GST_PERCENT}%</div>
          {master.PAYMENT_TERMS && <div><strong>PAYMENT TERMS :</strong> {master.PAYMENT_TERMS}</div>}
          {master.RATE_TERMS && <div><strong>RATE :</strong> {master.RATE_TERMS}</div>}
          {master.DELIVERY_TERMS && <div><strong>DELIVERY :</strong> {master.DELIVERY_TERMS}</div>}
          {master.VALIDITY && <div><strong>VALIDITY :</strong> {master.VALIDITY}</div>}
          <div style={{ marginTop: 10 }}>Waiting for your valuable PO.</div>
        </div>

        <div style={{ marginTop: 40 }}>
          <div>For {company?.COMPANY_NAME || 'Omech Components Pvt. Ltd.'}</div>
          <div style={{ height: 60 }} />
          <div>Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = { border: '1px solid #000', padding: 4, background: '#f0f0f0', fontSize: 12 };
const tdStyle: React.CSSProperties = { border: '1px solid #000', padding: 4, fontSize: 12, textAlign: 'center', verticalAlign: 'top' };

export default QuotationPrintPage;
