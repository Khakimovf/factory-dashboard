import { useState, useRef, useEffect } from 'react';
import { QrCode, X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: { lineId: string; lineName: string; type: string }) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && scanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      startScanning();
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    scanIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      try {
        const qrData = decodeQRCode(imageData);
        if (qrData) {
          handleQRDetected(qrData);
        }
      } catch (e) {
        // QR not detected, continue scanning
      }
    }, 500);
  };

  const decodeQRCode = (imageData: ImageData): string | null => {
    // Simple QR code detection using jsQR library would be ideal
    // For now, we'll use a manual input fallback
    // In production, use: import jsQR from 'jsqr';
    return null;
  };

  const handleQRDetected = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'QC_CHECKPOINT' && parsed.lineId && parsed.lineName) {
        stopCamera();
        setScanning(false);
        onScan(parsed);
        toast.success(`QR Code scanned: ${parsed.lineName}`);
      } else {
        toast.error('Invalid QR code format');
      }
    } catch (e) {
      toast.error('Invalid QR code data');
    }
  };

  const handleQRInput = () => {
    const qrData = prompt('Paste QR code data (JSON):');
    if (qrData) {
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.type === 'QC_CHECKPOINT' && parsed.lineId && parsed.lineName) {
          onScan(parsed);
          toast.success(`QR Code entered: ${parsed.lineName}`);
        } else {
          toast.error('Invalid QR code format');
        }
      } catch (e) {
        toast.error('Invalid QR code data');
      }
    }
  };

  const handleManualInput = () => {
    const lineId = prompt('Enter Line ID:');
    const lineName = prompt('Enter Line Name:');
    if (lineId && lineName) {
      onScan({ lineId, lineName, type: 'QC_CHECKPOINT' });
      toast.success(`Manual check-in: ${lineName}`);
    }
  };

  const handleStartScan = () => {
    setScanning(true);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Scanner
          </DialogTitle>
          <DialogDescription>
            Scan the QR code at the production line to check in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!scanning ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <Camera className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Click Start to begin scanning
              </p>
              <Button onClick={handleStartScan} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                autoPlay
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleManualInput}
              className="flex-1"
            >
              Manual Input
            </Button>
            <Button
              variant="outline"
              onClick={handleQRInput}
              className="flex-1"
            >
              Paste QR Data
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                stopCamera();
                setScanning(false);
                onClose();
              }}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
