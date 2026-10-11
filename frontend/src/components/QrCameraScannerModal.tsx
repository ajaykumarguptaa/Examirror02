import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface QrCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const QrCameraScannerModal: React.FC<QrCameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'interactive-qr-reader';

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop error:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const startScanner = async () => {
    setErrorMsg(null);
    try {
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39
        ],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Parse potential URL or raw code
          let cleanedCode = decodedText.trim();
          try {
            if (cleanedCode.includes('/verify/')) {
              const parts = cleanedCode.split('/verify/');
              if (parts[1]) {
                const subParts = parts[1].split('/');
                cleanedCode = subParts[subParts.length - 1] || parts[1];
              }
            } else if (cleanedCode.includes('=')) {
              const url = new URL(cleanedCode, window.location.origin);
              cleanedCode = url.searchParams.get('roll') || url.searchParams.get('enrollment') || url.searchParams.get('id') || decodedText;
            }
          } catch {
            // keep cleanedCode as is
          }

          // Trigger success callback and shutdown camera
          stopScanner().then(() => {
            onScanSuccess(cleanedCode);
            onClose();
          });
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsScanning(true);
      setCameraPermission('granted');
    } catch (err: any) {
      console.error('Camera QR scanner error:', err);
      setCameraPermission('denied');
      setErrorMsg(
        err?.message?.includes('Permission') || err?.name === 'NotAllowedError'
          ? 'Camera access permission denied. Please allow camera permissions in your browser settings.'
          : 'Unable to start camera scanner. Please ensure no other application is using the camera.'
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow DOM element rendering
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-snug">
                Scan QR Code / Barcode
              </h3>
              <p className="text-[11px] text-slate-400">
                Point camera at student ID card or diploma QR
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 text-center">
          <div className="relative mx-auto w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full object-cover" />
            
            {/* Viewfinder Target Overlays */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-xl animate-pulse flex items-center justify-center">
                  <div className="w-4 h-4 bg-emerald-400/40 rounded-full animate-ping" />
                </div>
              </div>
            )}

            {!isScanning && !errorMsg && (
              <div className="text-white text-xs space-y-2 flex flex-col items-center">
                <RefreshCw size={24} className="animate-spin text-blue-400" />
                <span>Initializing camera sensor...</span>
              </div>
            )}
          </div>

          {/* Error / Instructions */}
          {errorMsg ? (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 text-left">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Camera Access Error</p>
                <p className="text-[11px] mt-0.5">{errorMsg}</p>
                <button
                  onClick={startScanner}
                  className="mt-2 text-[11px] font-bold underline cursor-pointer text-red-800 hover:text-red-950"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-1 text-slate-500 text-xs">
              <p className="flex items-center justify-center gap-1 font-medium text-slate-700">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Encrypted Instant QR Authentication</span>
              </p>
              <p className="text-[11px]">
                Camera stream is processed locally and immediately turns off after scanning.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
