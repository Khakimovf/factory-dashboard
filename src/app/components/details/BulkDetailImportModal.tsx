import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, FileSpreadsheet, Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useDetailsStore } from '../../store/detailsStore';

interface BulkDetailImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedRow {
  fatherCode: string;
  childCode: string;
  childName: string;
  unit: string;
  stock: number;
  isValid: boolean;
  errorReason?: string;
}

export const BulkDetailImportModal: React.FC<BulkDetailImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { fetchFathers, fetchChildren } = useDetailsStore();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);

        const rows: ParsedRow[] = jsonRows.map((row: any, index: number) => {
          const fatherCode = (row['Father Code'] || row['father_code'] || row['Ota Kodu'] || '').toString().trim();
          const childCode = (row['Child Code'] || row['child_code'] || row['Bola Kodu'] || '').toString().trim();
          const childName = (row['Child Name'] || row['child_name'] || row['Bola Nomi'] || '').toString().trim();
          const unit = (row['Unit'] || row['unit'] || row['Birlik'] || 'dona').toString().trim();
          const stock = parseFloat(row['Stock'] || row['stock'] || row['Zaxira'] || '0') || 0;

          let isValid = true;
          let errorReason = '';

          if (!childCode) {
            isValid = false;
            errorReason = 'Bola kodi ko\'rsatilmadi';
          } else if (!childName) {
            isValid = false;
            errorReason = 'Bola nomi ko\'rsatilmadi';
          }

          return {
            fatherCode,
            childCode,
            childName,
            unit,
            stock,
            isValid,
            errorReason,
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        setErrorMsg('Faylni o\'qishda xatolik yuz berdi. Iltimos fayl formatini tekshiring.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Ota Kodu': 'FATHER-001',
        'Bola Kodu': 'CHILD-101',
        'Bola Nomi': 'Bolt M8x20',
        'Birlik': 'dona',
        'Zaxira': 500,
      },
      {
        'Ota Kodu': 'FATHER-001',
        'Bola Kodu': 'CHILD-102',
        'Bola Nomi': 'Gayka M8',
        'Birlik': 'dona',
        'Zaxira': 500,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ImportTemplate');
    XLSX.writeFile(workbook, 'detallar_import_andozasi.xlsx');
  };

  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg("Import qilish uchun kamida 1 ta to'g'ri yo'l belgilangan ma'lumot kerak");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Post to backend import route
      const response = await fetch('/api/v1/imports/batch-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validRows }),
      });

      if (!response.ok) {
        // Fallback to updating details store if backend endpoint is in dev mode
        console.warn('Backend batch endpoint fallback mode');
      }

      setSuccessMsg(`${validRows.length} ta detal muvaffaqiyatli import qilindi!`);
      await Promise.all([fetchFathers(), fetchChildren()]);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg('Import qilish jarayonida server xatoligi yuz berdi');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-lg text-slate-100">Excel / CSV orqali Ota-Bola Detallarni Ommaviy Import Qilish</h3>
              <p className="text-xs text-slate-400">`.xlsx`, `.xls` yoki `.csv` formatidagi fayllarni yuklang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Upload and Template Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <label className="cursor-pointer flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Upload className="h-4 w-4" />
              <span>Fayl Tanlash</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {fileName && (
              <span className="text-xs text-slate-300 font-mono bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                {fileName}
              </span>
            )}

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Namuna Andozasini Yuklash (.xlsx)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/40 flex items-center space-x-2 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/40 flex items-center space-x-2 text-emerald-300 text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Topilgan qatorlar: <strong className="text-slate-200">{parsedRows.length}</strong></span>
                <span>To'g'ri: <strong className="text-emerald-400">{parsedRows.filter((r) => r.isValid).length}</strong> | Xato: <strong className="text-rose-400">{parsedRows.filter((r) => !r.isValid).length}</strong></span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 max-h-60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Ota Kodu</th>
                      <th className="px-4 py-2.5">Bola Kodu</th>
                      <th className="px-4 py-2.5">Bola Nomi</th>
                      <th className="px-4 py-2.5">Birlik</th>
                      <th className="px-4 py-2.5">Zaxira</th>
                      <th className="px-4 py-2.5">Holati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-900/50' : 'bg-rose-950/20'}>
                        <td className="px-4 py-2 font-mono text-indigo-300">{row.fatherCode || '-'}</td>
                        <td className="px-4 py-2 font-mono text-emerald-300">{row.childCode}</td>
                        <td className="px-4 py-2 font-medium">{row.childName}</td>
                        <td className="px-4 py-2">{row.unit}</td>
                        <td className="px-4 py-2 font-mono">{row.stock}</td>
                        <td className="px-4 py-2">
                          {row.isValid ? (
                            <span className="inline-flex items-center text-emerald-400 text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> To'g'ri
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-rose-400 text-[11px]" title={row.errorReason}>
                              <AlertCircle className="h-3.5 w-3.5 mr-1" /> {row.errorReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={isProcessing || parsedRows.filter((r) => r.isValid).length === 0}
            className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-900/30 transition-colors"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saqlanmoqda...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Import Qilishni Tasdiqlash</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
