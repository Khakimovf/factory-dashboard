import React, { useState, useMemo } from 'react';
import { useFinanceStore, OCRContract, AllocatedItem } from '../../store/financeStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import {
    FileText, UploadCloud, CheckCircle2, Loader2, Building2,
    Calendar, Percent, AlertCircle, Info, Terminal, RefreshCw, Layers
} from 'lucide-react';
import { toast } from 'sonner';

// Mock DB matching the required exact schema
const SIMULATED_CONTRACT_DB: Record<string, OCRContract> = {
    "Contract-120A": {
        id: "Contract №120-A",
        party: "UzAuto Motors JSC",
        type: "SALES (SOTUV)",
        vatRate: 0.12, // 12% QQS (НДС)
        validUntil: "2027-12-31",
        totalVolumeValue: "500 000 000 UZS",
        allocatedItems: [
            { sku: "26211286", contractPrice: 45000, maxLimit: 5000, currentQty: 1250 },
            { sku: "26211284", contractPrice: 45000, maxLimit: 5000, currentQty: 980 }
        ]
    },
    "Contract-8821": {
        id: "PO-8821",
        party: "Hardware Supply Co.",
        type: "PURCHASE (XARID)",
        vatRate: 0.12,
        validUntil: "2026-11-30",
        totalVolumeValue: "120 000 000 UZS",
        allocatedItems: [
            { sku: "13536589", contractPrice: 1200, maxLimit: 100000, currentQty: 45000 }
        ]
    }
};

const SKU_NAMES: Record<string, string> = {
    "26211286": "Door Trim Inner Panel Left",
    "26211284": "Door Trim Inner Panel Right",
    "13536589": "M6 Hexagonal Flange Bolt"
};

export function ContractsPage() {
    const { ocrContracts, addOcrContract } = useFinanceStore();
    
    // File drag & drop simulator state
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStepText, setCurrentStepText] = useState('');
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("Contract-120A");
    const [ocrLogs, setOcrLogs] = useState<string[]>([]);

    // Handle Drag Events
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    // OCR Simulation Pipeline
    const runOcrPipeline = (templateKey: string, fileName: string) => {
        if (loading) return;
        setLoading(true);
        setProgress(0);
        setOcrLogs([]);

        const steps = [
            { pct: 15, text: `[16:24:32] 📂 Reading file: "${fileName}"...` },
            { pct: 30, text: "[16:24:32] ⚡ Extracting document layout & structure..." },
            { pct: 50, text: "[16:24:33] 🔍 OCR Text extraction in progress..." },
            { pct: 70, text: "[16:24:33] 🧬 Matching party names with ERP Master Directory..." },
            { pct: 85, text: "[16:24:34] 📊 Extracting tax schedules, line items, and pricing matrices..." },
            { pct: 100, text: "[16:24:34] ✅ Document successfully digitized! Loading JSON payload..." }
        ];

        let currentStep = 0;
        const intervalTime = 330; // 2000ms total / 6 steps ~= 330ms
        
        const timer = setInterval(() => {
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                setProgress(step.pct);
                setCurrentStepText(step.text);
                setOcrLogs(prev => [...prev, step.text]);
                currentStep++;
            } else {
                clearInterval(timer);
                
                // Add the contract from mock database
                const parsedContract = SIMULATED_CONTRACT_DB[templateKey];
                if (parsedContract) {
                    addOcrContract({
                        ...parsedContract,
                        // randomize ID slightly or just overwrite to keep it fresh
                        validUntil: parsedContract.validUntil,
                    });
                    toast.success(`Shartnoma yuklandi: ${parsedContract.id} (${parsedContract.party})`);
                }
                
                setLoading(false);
            }
        }, intervalTime);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Auto-detect template based on filename, else fallback to selected template selector
        const nameLower = file.name.toLowerCase();
        let targetKey = selectedTemplateKey;
        if (nameLower.includes("120") || nameLower.includes("uzauto")) {
            targetKey = "Contract-120A";
        } else if (nameLower.includes("8821") || nameLower.includes("hardware") || nameLower.includes("po")) {
            targetKey = "Contract-8821";
        }
        
        runOcrPipeline(targetKey, file.name);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        
        const nameLower = file.name.toLowerCase();
        let targetKey = selectedTemplateKey;
        if (nameLower.includes("120") || nameLower.includes("uzauto")) {
            targetKey = "Contract-120A";
        } else if (nameLower.includes("8821") || nameLower.includes("hardware") || nameLower.includes("po")) {
            targetKey = "Contract-8821";
        }
        
        runOcrPipeline(targetKey, file.name);
    };

    return (
        <div className="w-full min-h-screen bg-[#020617] text-slate-100 font-sans px-8 py-8 space-y-8 pb-24">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Layers className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        Shartnomalar Boshqaruvi
                    </h1>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-[0.4em] font-black mt-2">
                        Intellectual Contract & Agreement Registry — AI-Powered OCR Engine
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-black px-3 py-1">
                        Active Database Node
                    </Badge>
                </div>
            </div>

            {/* Dashboard panels grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Drag-and-Drop Uploader */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-white text-base font-black uppercase tracking-tight">AI OCR Document Staging</CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Drop contract PDF/DOCX below. AI will automatically parse pricing schedules and limits.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Template selector helper */}
                            <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Mock Document to Simulate Upload</Label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button 
                                        onClick={() => setSelectedTemplateKey("Contract-120A")}
                                        className={`px-3 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                            selectedTemplateKey === "Contract-120A"
                                                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                        }`}
                                    >
                                        UzAuto Sales (№120-A)
                                    </button>
                                    <button 
                                        onClick={() => setSelectedTemplateKey("Contract-8821")}
                                        className={`px-3 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                            selectedTemplateKey === "Contract-8821"
                                                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                        }`}
                                    >
                                        Hardware Purchase (PO-8821)
                                    </button>
                                </div>
                            </div>

                            {/* Drop Zone Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`relative h-60 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all ${
                                    isDragging 
                                        ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]" 
                                        : "border-slate-800 hover:border-indigo-500/40 bg-slate-950/40"
                                }`}
                            >
                                <input 
                                    type="file" 
                                    id="contract-file-picker" 
                                    className="hidden" 
                                    onChange={handleFileSelect} 
                                    accept=".pdf,.docx,.doc" 
                                    disabled={loading}
                                />
                                
                                {loading ? (
                                    <div className="space-y-4 w-full px-6">
                                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{currentStepText}</p>
                                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-indigo-500 h-full transition-all duration-300 rounded-full" 
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <label 
                                        htmlFor="contract-file-picker"
                                        className="cursor-pointer space-y-4 flex flex-col items-center group"
                                    >
                                        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-lg group-hover:border-indigo-500/30 group-hover:bg-slate-900/80 transition-all">
                                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white uppercase tracking-tight">
                                                [ 📂 UPLOAD NEW CONTRACT (PDF/DOCX) ]
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">
                                                or Drag & Drop file here to execute OCR
                                            </p>
                                        </div>
                                    </label>
                                )}
                            </div>

                            {/* Simulated Terminal logs */}
                            {(loading || ocrLogs.length > 0) && (
                                <div className="bg-black/80 rounded-xl p-4 border border-slate-900/60 font-mono text-[9px] text-slate-400 space-y-1 h-36 overflow-y-auto scrollbar-hide shadow-inner">
                                    <p className="text-indigo-400 font-black uppercase flex items-center gap-1.5 mb-2 border-b border-white/5 pb-1">
                                        <Terminal className="w-3 h-3" /> AI OCR Logging Terminal
                                    </p>
                                    {ocrLogs.map((log, i) => (
                                        <p key={i} className="animate-in fade-in duration-300">{log}</p>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side: Active Master Ledger list */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md shadow-2xl overflow-hidden min-h-[500px]">
                        <CardHeader className="border-b border-slate-800/60 bg-slate-900/20">
                            <CardTitle className="text-white text-base font-black uppercase tracking-tight">Registered B2B Contract Ledger</CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Live system registry matching contract constraints onto current stock movements
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {ocrContracts.length === 0 ? (
                                <div className="h-96 flex flex-col items-center justify-center text-slate-600 text-center gap-3">
                                    <FileText className="w-12 h-12 opacity-30" />
                                    <p className="text-xs font-black uppercase tracking-widest">No registered contracts inside registry node</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {ocrContracts.map(contract => (
                                        <Card key={contract.id} className="bg-slate-950 border border-slate-800/80 hover:border-slate-700/60 transition-colors shadow-lg rounded-2xl overflow-hidden">
                                            {/* Contract top identity bar */}
                                            <div className="px-5 py-4 border-b border-slate-900 bg-slate-900/10 flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center">
                                                        <FileText className="w-4 h-4 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-black text-white tracking-widest uppercase">{contract.id}</h3>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1.5 mt-0.5">
                                                            <Building2 className="w-3 h-3 text-slate-600" /> Partner: {contract.party}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 ${
                                                        contract.type === 'SALES (SOTUV)'
                                                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                                            : 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20'
                                                    }`}>
                                                        {contract.type}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Parameters Grid */}
                                            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-900 text-xs">
                                                <div>
                                                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Total Value Limit</span>
                                                    <span className="text-white font-black">{contract.totalVolumeValue}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">VAT / QQS Rate</span>
                                                    <span className="text-emerald-400 font-black flex items-center gap-1">
                                                        <Percent className="w-3 h-3" /> {(contract.vatRate * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Valid Until</span>
                                                    <span className="text-slate-300 font-black font-mono flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-slate-600" /> {contract.validUntil}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block mb-0.5">Registry Status</span>
                                                    <span className="text-emerald-400 font-black flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Digitized
                                                    </span>
                                                </div>
                                            </div>

                                            {/* SKU Allocations/Limits List */}
                                            <div className="p-5 bg-slate-900/10 space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Allocated SKUs & Quantity Limits
                                                </h4>
                                                
                                                <div className="space-y-4">
                                                    {contract.allocatedItems.map((item: AllocatedItem) => {
                                                        const pct = Math.min(100, Math.round((item.currentQty / item.maxLimit) * 100));
                                                        // Color dynamic based on progress
                                                        let progressColor = "bg-indigo-600";
                                                        if (pct > 90) progressColor = "bg-red-500";
                                                        else if (pct > 70) progressColor = "bg-amber-500";

                                                        return (
                                                            <div key={item.sku} className="space-y-1.5 p-3.5 bg-slate-950/80 border border-slate-900 rounded-xl">
                                                                <div className="flex justify-between items-center text-xs">
                                                                    <div>
                                                                        <span className="font-black text-slate-200 tracking-wider font-mono mr-2">{item.sku}</span>
                                                                        <span className="text-[10px] text-slate-500 uppercase font-bold">{SKU_NAMES[item.sku] || "Part Item"}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="font-black text-slate-300">{item.currentQty.toLocaleString()}</span>
                                                                        <span className="text-slate-500"> / {item.maxLimit.toLocaleString()} pcs</span>
                                                                        <Badge className="ml-2 bg-slate-900 text-[9px] font-black text-slate-400 border border-slate-800">{pct}%</Badge>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>

                                                                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 font-bold">
                                                                    <span>Price (Standard): {item.contractPrice.toLocaleString()} UZS</span>
                                                                    <span className="text-emerald-500">Price + QQS: {(item.contractPrice * (1 + contract.vatRate)).toLocaleString()} UZS</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

