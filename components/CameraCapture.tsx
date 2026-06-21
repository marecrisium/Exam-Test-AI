import React, { useState, useEffect, useRef } from 'react';

interface CameraCaptureProps {
  onPhotoCaptured: (file: File) => void;
  isLoading?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoCaptured, isLoading = false }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Turn off / clean up camera on toggle or unmount
  useEffect(() => {
    if (!isActive) {
      stopCamera();
      setCapturedImage(null);
      setCapturedBlob(null);
      setCameraError(null);
    } else {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  // Start back/front camera stream
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraError(null);
    setCapturedImage(null);
    setCapturedBlob(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: { ideal: 'environment' } }, // Prefer rear camera for scanning
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enumerate available video devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      if (!deviceId && videoDevices.length > 0) {
        // Try to pre-select active stream device
        const activeTrack = mediaStream.getVideoTracks()[0];
        if (activeTrack) {
          const settings = activeTrack.getSettings();
          if (settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }
      }
    } catch (err: any) {
      console.error('Kamera erişim hatası:', err);
      setPermissionState('denied');
      
      let errorMsg = 'Kameraya erişilemedi. Lütfen izin verdiğinizden emin olun.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Tarayıcı veya uygulama kamera izni reddedildi. Lütfen site ayarlarına göz atın.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Cihazda geçerli bir kamera bulunamadı.';
      }
      setCameraError(errorMsg);
    }
  };

  // Handle device switches
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    startCamera(devId);
  };

  // Standard snapshot capturing
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Set canvas size matching the exact video aspect
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      // Draw active mirror/frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to dataUrl and Blob for saving
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Add the taken photo to main files array
  const handleConfirmPhoto = () => {
    if (!capturedBlob) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `kamera_cekimi_${timestamp}.jpeg`;
    const file = new File([capturedBlob], fileName, { type: 'image/jpeg' });

    onPhotoCaptured(file);
    
    // Reset preview to allow taking more photos
    setCapturedImage(null);
    setCapturedBlob(null);
  };

  // Trigger Native backup file dialog for mobile system camera capture
  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onPhotoCaptured(files[0]);
    }
    // reset input value
    e.target.value = '';
  };

  const triggerNativeCamera = () => {
    nativeInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
      {/* Active Trigger */}
      <div className="flex items-center justify-between">
        <label htmlFor="camera-toggle" className="flex items-center space-x-3 cursor-pointer select-none">
          <input
            type="checkbox"
            id="camera-toggle"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={isLoading}
            className="w-4.5 h-4.5 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"
          />
          <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <span>📷 Kameradan Fotoğraf Çekip Yükle</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-normal">Hızlı Tarama</span>
          </div>
        </label>
      </div>

      {isActive && (
        <div className="space-y-4 border-t pt-4 animate-fade-in">
          {capturedImage ? (
            /* Selected Frame Preview Screen */
            <div className="space-y-3">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-200">
                <img src={capturedImage} alt="Kamera önizleme" className="w-full h-full object-contain" />
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-sm">
                  ✓ Fotoğraf Hazır
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setCapturedBlob(null);
                  }}
                  className="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-500 transition-colors"
                >
                  Tekrar Çek
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPhoto}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 transition-colors"
                >
                  Belgeyi Ekle ve Yükle
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Stream Video View */
            <div className="space-y-3">
              {cameraError ? (
                /* Fallback styling if iframe constraints, permission, or no camera blocks the getUserMedia API */
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-slate-700">
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                    Tarayıcı veya iframe izinleri sebebiyle doğrudan akış açılamadı. Sistem kamerasını tetikleyerek anında fotoğraf çekebilirsiniz:
                  </p>
                  <button
                    type="button"
                    onClick={triggerNativeCamera}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 transition-colors"
                  >
                    📸 Sistem Kamerasıyla Fotoğraf Çek
                  </button>
                </div>
              ) : (
                /* Native Camera Stream Video Layout */
                <>
                  {devices.length > 1 && (
                    <div className="flex flex-col space-y-1">
                      <label htmlFor="camera-select" className="text-xs font-semibold text-slate-500">Kamera Seçimi</label>
                      <select
                        id="camera-select"
                        value={selectedDeviceId}
                        onChange={handleDeviceChange}
                        className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 focus:ring-sky-500 focus:border-sky-500"
                      >
                        {devices.map((device, idx) => (
                          <option key={device.deviceId || idx} value={device.deviceId}>
                            {device.label || `Kamera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-200">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-sky-600 text-white text-xs px-2 py-0.5 rounded-md font-mono flex items-center gap-1.5 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      <span>KAMERA AKTİF</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
                    >
                      📸 Fotoğrafı Yakala
                    </button>
                    
                    <button
                      type="button"
                      onClick={triggerNativeCamera}
                      className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium border border-transparent rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Bunun yerine sistem kamerası uygulamasını kullan
                    </button>
                  </div>
                </>
                )}

              {/* Hidden file input for capturing native device camera */}
              <input
                ref={nativeInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleNativeCapture}
              />
              
              {/* Hidden Canvas used to grab single snapshot */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
