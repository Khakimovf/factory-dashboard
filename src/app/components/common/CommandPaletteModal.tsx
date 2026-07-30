import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { 
  Search, 
  Box, 
  Layers, 
  Factory, 
  ShieldCheck, 
  FileSpreadsheet, 
  PackageCheck, 
  X,
  PlusCircle,
  QrCode
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenScanner?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  onOpenScanner,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const navigate = useNavigate();

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (externalIsOpen === undefined) {
          setInternalIsOpen((open) => !open);
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [externalIsOpen]);

  if (!isOpen) return null;

  const runCommand = (command: () => void) => {
    command();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <Command className="w-full">
          <div className="flex items-center border-b border-slate-800 px-4">
            <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" />
            <Command.Input
              placeholder="Qidiruv yoki buyruq kiriting (masalan: Detal, Ombor, Skaner)..."
              className="flex h-14 w-full rounded-md bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>

          <Command.List className="max-h-[350px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-slate-400">
              Natija topilmadi.
            </Command.Empty>

            <Command.Group heading="Tezkor Amallar" className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Command.Item
                onSelect={() => runCommand(() => onOpenScanner && onOpenScanner())}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors"
              >
                <QrCode className="mr-3 h-4 w-4 text-indigo-400" />
                <span>Shtrix-kod / QR Skanerni ochish</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Detallar Boshqaruvi" className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/admin/detail-management'))}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors"
              >
                <Box className="mr-3 h-4 w-4 text-blue-400" />
                <span>Ota Detallar (Father Details) Ro'yxati</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/admin/details/child-list'))}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors"
              >
                <Layers className="mr-3 h-4 w-4 text-emerald-400" />
                <span>Barcha Bola Detallar (Child Details)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/admin/details/father-children'))}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors"
              >
                <FileSpreadsheet className="mr-3 h-4 w-4 text-amber-400" />
                <span>Ota va Bola Detallar Iyerarxiyasi</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Modullar va Bo'limlar" className="px-2 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/warehouse'))}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors"
              >
                <PackageCheck className="mr-3 h-4 w-4 text-cyan-400" />
                <span>Omborxona (Warehouse) Boshqaruvi</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/production'))}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors"
              >
                <Factory className="mr-3 h-4 w-4 text-purple-400" />
                <span>Ishlab Chiqarish (Production / MRP)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => navigate('/admin'))}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-sm text-slate-200 hover:bg-indigo-600/30 hover:text-white transition-colors"
              >
                <ShieldCheck className="mr-3 h-4 w-4 text-rose-400" />
                <span>Tizim Administratsiyasi</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
            <span>Navigatsiya uchun <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">Ctrl + K</kbd> bosing</span>
            <span>Factory ERP v1.0</span>
          </div>
        </Command>
      </div>
    </div>
  );
};
