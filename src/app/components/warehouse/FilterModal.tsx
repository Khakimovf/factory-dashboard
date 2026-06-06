import React, { useState } from 'react';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (category: string, status: string) => void;
    onReset: () => void;
    initialCategory?: string;
    initialStatus?: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    onApply,
    onReset,
    initialCategory = '',
    initialStatus = ''
}) => {
    const [category, setCategory] = useState(initialCategory);
    const [status, setStatus] = useState(initialStatus);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-[#0f1117] border border-white/10 rounded-2xl p-8 w-[480px] max-w-[90vw] shadow-2xl"
                style={{ animation: 'fadeIn 0.2s ease' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white text-lg font-semibold tracking-widest uppercase">
                        ⚙ Filter Configuration
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/40 hover:text-white text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Material Category */}
                <div className="mb-6">
                    <p className="text-white/50 text-xs tracking-widest uppercase mb-3">
                        Material Category
                    </p>
                    {[
                        { value: '', label: 'ALL CATEGORIES' },
                        { value: 'FINISHED_GOODS', label: 'FINISHED GOODS' },
                        { value: 'RAW_MATERIAL', label: 'RAW MATERIAL' },
                        { value: 'SEMI_FINISHED', label: 'SEMI-FINISHED' }
                    ].map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setCategory(cat.value)}
                            className={`w-full text-left px-4 py-2 rounded mb-1 text-sm tracking-wider transition-colors ${category === cat.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Stock Status */}
                <div className="mb-8">
                    <p className="text-white/50 text-xs tracking-widest uppercase mb-3">
                        Stock Status
                    </p>
                    {[
                        { value: '', label: 'ALL STATUSES' },
                        { value: 'unrestricted', label: 'HAS UNRESTRICTED' },
                        { value: 'reserved', label: 'HAS RESERVED' },
                        { value: 'blocked', label: 'HAS BLOCKED' }
                    ].map(st => (
                        <button
                            key={st.value}
                            onClick={() => setStatus(st.value)}
                            className={`w-full text-left px-4 py-2 rounded mb-1 text-sm tracking-wider transition-colors ${status === st.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            {st.label}
                        </button>
                    ))}
                </div>

                {/* Footer buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => { onApply(category, status); onClose(); }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded text-sm tracking-widest uppercase transition-colors"
                    >
                        Apply Configuration
                    </button>
                    <button
                        onClick={() => {
                            setCategory('');
                            setStatus('');
                            onReset();
                            onClose();
                        }}
                        className="px-6 bg-white/5 hover:bg-white/10 text-white/60 py-2.5 rounded text-sm tracking-widest uppercase transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
        </div>
    );
};
