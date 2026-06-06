import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    endpoint: string;
    templateUrl?: string;
    onSuccess?: (data: any) => void;
}

export function BulkImportModal({ isOpen, onClose, title, endpoint, templateUrl, onSuccess }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ imported: number, errors: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Iltimos, faylni tanlang');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${baseUrl}/api/v1${endpoint}`, {
                method: 'POST',
                body: formData,
                headers: {
                    // Auth token normally goes here
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Yuklashda xatolik yuz berdi');

            const data = await response.json();
            setResult(data);
            if (data.errors.length === 0) {
                toast.success(`${data.imported} ta yozuv muvaffaqiyatli yuklandi`);
                if (onSuccess) onSuccess(data);
                // onClose(); // Keep open to show results if there are errors
            } else {
                toast.warning(`${data.imported} ta yozuv yuklandi, lekin xatolar mavjud`);
            }
        } catch (error) {
            console.error(error);
            toast.error('Faylni yuklashda xatolik yuz berdi');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900/40">
                            <Upload className="w-10 h-10 text-gray-400 mb-4" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                                CSV faylini shu yerga tashlang yoki tanlang
                            </p>
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <Label
                                htmlFor="csv-upload"
                                className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            >
                                {file ? file.name : 'Faylni tanlash'}
                            </Label>
                        </div>

                        {templateUrl && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300">Shablon kerakmi?</p>
                                        <p className="text-[10px] text-blue-600 dark:text-blue-400">To'g'ri formatda yuklash uchun namuna CSV faylni yuklab oling</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-blue-600" asChild>
                                    <a href={templateUrl} download>
                                        <Download className="w-4 h-4 mr-1" />
                                        Yuklab olish
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${result.errors.length === 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200'}`}>
                            {result.errors.length === 0 ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                            )}
                            <div>
                                <p className="text-sm font-bold">{result.imported} ta yozuv muvaffaqiyatli qayta ishlandi</p>
                                {result.errors.length > 0 && (
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{result.errors.length} ta xatolik aniqlandi</p>
                                )}
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-1.5 bg-gray-50 dark:bg-gray-900">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Xatoliklar tafsiloti:</p>
                                {result.errors.map((err, i) => (
                                    <p key={i} className="text-[11px] text-red-500 flex items-start gap-2">
                                        <span className="shrink-0">•</span>
                                        <span>{err}</span>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {result ? (
                        <Button onClick={() => { setResult(null); setFile(null); onClose(); }}>Yopish</Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onClose} disabled={isUploading}>Bekor qilish</Button>
                            <Button onClick={handleUpload} disabled={!file || isUploading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isUploading ? 'Yuklanmoqda...' : 'Yuklash'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
