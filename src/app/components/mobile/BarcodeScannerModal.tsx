import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult?: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedResult(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError("Kamera qurilmasi qo'llab-quvvatlanmaydi");
      }
    } catch (err: any) {
      setCameraError("Kameraga kirish ruxsati berilmadi yoki kamera band");
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleProcessCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScannedResult(trimmed);
    if (onScanResult) {
      onScanResult(trimmed);
    }
  };

  const handleNavigateToDetail = () => {
    if (scannedResult) {
      navigate(`/admin/details/child-list?search=${encodeURIComponent(scannedResult)}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-lg text-slate-100">Shtrix-kod / QR Skaner</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-5 flex flex-col items-center space-y-4">
          <div className="relative w-full h-56 rounded-xl bg-slate-950 border-2 border-dashed border-indigo-500/50 overflow-hidden flex items-center justify-center">
            {cameraError ? (
              <div className="p-4 text-center text-xs text-amber-400 flex flex-col items-center space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-400 mb-1" />
                <span>{cameraError}</span>
                <span className="text-slate-500">Quyidagi maydondan kodni qo'lda kiriting</span>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-indigo-400 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" />
                </div>
              </>
            )}
          </div>

          {/* Scanned result alert */}
          {scannedResult && (
            <div className="w-full p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-300 text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="font-mono font-bold truncate max-w-[200px]">{scannedResult}</span>
              </div>
              <button
                onClick={handleNavigateToDetail}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors"
              >
                Ko'rish
              </button>
            </div>
          )}

          {/* Manual input fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessCode(manualCode);
            }}
            className="w-full flex space-x-2 pt-2 border-t border-slate-800"
          >
            <input
              type="text"
              placeholder="Kodni qo'lda kiriting (masalan: PRT-009)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Qidirish
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
