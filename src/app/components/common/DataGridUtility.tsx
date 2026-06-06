import React, { useState } from 'react';
import { Search, Filter, Download, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../ui/dropdown-menu';

interface Column {
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
}

interface DataGridUtilityProps {
    title: string;
    data: any[];
    columns: Column[];
    onImport?: () => void;
    onExport?: (format: 'xlsx' | 'pdf' | 'csv') => void;
}

export function DataGridUtility({ title, data, columns, onImport, onExport }: DataGridUtilityProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md mt-8">
            {/* Utility Toolbar */}
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Operational Data Grid</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search data..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64 bg-slate-950 border-slate-800 text-xs font-bold rounded-xl"
                        />
                    </div>

                    <Button variant="outline" className="gap-2 bg-slate-950 border-slate-800 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <Filter className="w-3.5 h-3.5" /> Filters
                    </Button>

                    <div className="h-6 w-[1px] bg-slate-800 mx-1" />

                    {onImport && (
                        <Button onClick={onImport} variant="outline" className="gap-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            <Upload className="w-3.5 h-3.5" /> Import CSV
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <Download className="w-3.5 h-3.5" /> Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-slate-800">
                            <DropdownMenuItem onClick={() => onExport?.('xlsx')} className="gap-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel (.xlsx)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExport?.('pdf')} className="gap-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer">
                                <FileText className="w-4 h-4 text-rose-500" /> PDF Document
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExport?.('csv')} className="gap-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer">
                                <FileText className="w-4 h-4 text-amber-500" /> CSV Data
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Grid Container */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/50">
                            {columns.map(col => (
                                <th key={col.key} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                {columns.map(col => (
                                    <td key={col.key} className="px-6 py-4 text-xs font-bold text-slate-300">
                                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
