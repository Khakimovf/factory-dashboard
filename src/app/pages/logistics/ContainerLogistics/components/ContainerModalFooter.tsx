import React from 'react';
import { Save, X, AlertCircle } from 'lucide-react';

interface ContainerModalFooterProps {
    isEditMode: boolean;
    hasChanges: boolean;
    lastEditedBy?: string;
    lastEditedAt?: string;
    onSave: () => void;
    onCancel: () => void;
    onClose: () => void;
    onEdit: () => void;
}

export const ContainerModalFooter: React.FC<ContainerModalFooterProps> = ({
    isEditMode,
    hasChanges,
    lastEditedBy = 'Admin',
    lastEditedAt = 'Bugun, 14:20',
    onSave,
    onCancel,
    onClose,
    onEdit,
}) => {
    return (
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {isEditMode && hasChanges && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <AlertCircle size={16} className="text-amber-500" />
                        <span className="text-[10px] font-black text-amber-500 uppercase italic">
                            O'zgarishlar saqlanmagan
                        </span>
                    </div>
                )}
                {!isEditMode && (
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Oxirgi tahrirlash:</span>
                        <span className="text-[10px] font-black text-slate-300 italic uppercase">
                            {lastEditedAt} — {lastEditedBy}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                {isEditMode ? (
                    <>
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-black uppercase italic transition-all flex items-center gap-2"
                        >
                            <X size={16} />
                            Bekor qilish
                        </button>
                        <button
                            onClick={onSave}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase italic shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                        >
                            <Save size={16} />
                            Saqlash
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onEdit}
                            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-black uppercase italic transition-all flex items-center gap-2 border border-slate-700"
                        >
                            <Edit3 size={16} className="text-indigo-400" />
                            Tahrirlash
                        </button>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-black uppercase italic transition-all"
                        >
                            Yopish
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Helper to keep icons working if Edit3 is needed (imported from lucide-react above)
import { Edit3 } from 'lucide-react';
