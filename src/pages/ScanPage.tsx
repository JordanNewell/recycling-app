import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, XCircle, Loader2, Sparkles, ArrowLeft, Info, Award, Zap, ImageIcon, MapPin } from "lucide-react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { toast } from "sonner";
import { apiService } from "@/services/apiService";
import { getEnvironmentalImpact } from "@/lib/impact";
import { enqueue, queuedCount, QUEUE_SYNCED_EVENT, type QueuedEntry } from "@/services/offlineQueue";

interface ScanResult {
  item: string;
  material: string;
  recyclable: boolean;
  points: number;
  instructions: string;
  imageData?: string;
  confidence?: number;
}

// Connectivity can change mid-flow (e.g. dropping between two checks), so read
// navigator.onLine fresh on every call instead of relying on a narrowed value.
const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { user, addRecyclingEntry, getPointsForMaterial } = useAuth();
  const navigate = useNavigate();

  // Offline queue indicator: how many scans are waiting to sync.
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingSyncCount(await queuedCount());
    } catch {
      // IndexedDB unavailable — the indicator is cosmetic, ignore failures.
    }
  }, []);

  useEffect(() => {
    void refreshPendingCount();
    window.addEventListener("online", refreshPendingCount);
    window.addEventListener(QUEUE_SYNCED_EVENT, refreshPendingCount);
    return () => {
      window.removeEventListener("online", refreshPendingCount);
      window.removeEventListener(QUEUE_SYNCED_EVENT, refreshPendingCount);
    };
  }, [refreshPendingCount]);

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast.error("Please sign in to scan items");
      return;
    }

    // Read original image as data URL for preview, then await it so the
    // ScanResult captures the CURRENT scan's image, not a stale closure value.
    const previewDataUrl = await readAsDataURL(file);
    setCapturedImage(previewDataUrl);

    // Start scanning
    setScanning(true);
    setScanResult(null);
    setShowResultSheet(false);

    try {
      // Compress image before sending
      const compressedData = await compressImage(file);

      // Call the API service with actual image data
      const result = await apiService.identifyItem(compressedData);

      const points = getPointsForMaterial(result.material);

      const newScanResult: ScanResult = {
        item: result.item,
        material: result.material,
        recyclable: result.recyclable,
        points: result.recyclable ? points : 0,
        instructions: result.instructions,
        imageData: previewDataUrl,
        confidence: result.confidence,
      };

      setScanResult(newScanResult);
      setShowResultSheet(true);
    } catch (error) {
      toast.error("Failed to identify item. Please try again.");
      console.error("Scan error:", error);
    }
    setScanning(false);
  };

  const readAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    galleryInputRef.current?.click();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      img.onload = () => {
        const maxSize = 1024;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const getLocation = (): Promise<{ latitude: number | null; longitude: number | null; locationName: string }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null, locationName: "Mobile Scan" });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationName: "Current Location",
          });
        },
        () => {
          resolve({ latitude: null, longitude: null, locationName: "Mobile Scan" });
        }
      );
    });
  };

  const resetScanState = () => {
    setShowResultSheet(false);
    setScanResult(null);
    setCapturedImage(null);
  };

  const handleConfirm = async () => {
    if (!scanResult || !user) return;

    if (scanResult.recyclable) {
      const location = await getLocation();

      // Save the scan to the local IndexedDB queue instead of the server.
      // Only called when the online attempt definitely did not record the
      // entry (offline up front, or a network failure before insert), so an
      // entry can never be both queued AND saved — zero double-counting.
      const saveOffline = async () => {
        const entry: QueuedEntry = {
          id: crypto.randomUUID(),
          userId: user.id,
          item: scanResult.item,
          material: scanResult.material,
          location,
          queuedAt: Date.now(),
        };
        await enqueue(entry);
        toast.success("Saved offline", {
          description: "It'll sync when you're back online.",
        });
        void refreshPendingCount();
      };

      // Offline before even trying: queue locally and skip the server.
      if (isOffline()) {
        await saveOffline();
        resetScanState();
        return;
      }

      let result: Awaited<ReturnType<typeof addRecyclingEntry>>;
      try {
        result = await addRecyclingEntry(
          scanResult.item,
          scanResult.material,
          location
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isOffline() || /fetch|network|Failed to/i.test(message)) {
          await saveOffline();
          resetScanState();
          return;
        }
        result = { totalItems: 0, error: true };
      }

      if (result.error) {
        if (isOffline()) {
          // Connection dropped mid-request: the insert cannot have completed,
          // so queue the entry for replay when back online.
          await saveOffline();
          resetScanState();
          return;
        }
        toast.error("Failed to save scan", {
          description: "Please try again in a moment.",
        });
      } else if (result.isDuplicate) {
        toast.warning("Duplicate scan detected", {
          description: "This item was scanned recently. Try scanning a different item.",
        });
      } else {
        toast.success(`+${scanResult.points} points earned!`, {
          description: "Keep up the great work!",
        });
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      }
    }

    resetScanState();
  };

  const handleScanAnother = () => {
    setShowResultSheet(false);
    setScanResult(null);
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen md:max-w-lg md:mx-auto">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-6 pt-12">
        <motion.div initial={{ x: -20 }} animate={{ x: 0 }} className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Scan Item</h1>
            <p className="text-emerald-100">Point your camera at recyclable items</p>
          </div>
        </motion.div>
      </div>

      <div className="p-4 space-y-6">
        {/* Camera View / Image Preview */}
        <MobileCard>
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured item" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {scanning ? (
                    <motion.div
                      key="scanning"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="text-center"
                    >
                      <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto mb-4" />
                      <p className="text-white font-medium">Analyzing item...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ready"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">Ready to scan</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Scanning Overlay */}
            {scanning && (
              <motion.div
                animate={{ y: ["0%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent h-1/4 z-10"
              />
            )}

            {/* Corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400 z-10" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400 z-10" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400 z-10" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400 z-10" />
          </div>
        </MobileCard>

        {/* Scan Buttons */}
        {!scanResult && !scanning && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-3">
            <Button
              size="lg"
              onClick={handleCameraCapture}
              disabled={!user}
              className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Camera className="w-6 h-6 mr-2" />
              Take Photo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleGallerySelect}
              disabled={!user}
              className="w-full h-14 text-base font-semibold"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Choose from Gallery
            </Button>
          </motion.div>
        )}

        {/* Offline queue indicator */}
        {pendingSyncCount > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {pendingSyncCount} scan{pendingSyncCount === 1 ? "" : "s"} waiting to sync
          </p>
        )}

        {/* Tips */}
        {!scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <MobileCard>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Scanning Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="text-emerald-600 dark:text-emerald-400 mr-2">•</span>
                  <span>Ensure good lighting for best results</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 dark:text-emerald-400 mr-2">•</span>
                  <span>Hold camera steady and center the item</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 dark:text-emerald-400 mr-2">•</span>
                  <span>Look for recycling symbols on packaging</span>
                </li>
              </ul>
            </MobileCard>
          </motion.div>
        )}
      </div>

      {/* Scan Result Bottom Sheet */}
      <BottomSheet
        open={showResultSheet}
        onOpenChange={(open) => {
          if (!open) {
            setShowResultSheet(false);
          }
        }}
        title={scanResult?.item || "Scan Result"}
        description={scanResult?.material}
      >
        {scanResult && (
          <div className="space-y-6">
            {/* Result Icon */}
            <div className="flex flex-col items-center text-center">
              {scanResult.recyclable ? (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="w-24 h-24 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                  </div>
                </motion.div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{scanResult.item}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{scanResult.material}</p>

              {scanResult.confidence && (
                <div className="mt-2 flex items-center justify-center space-x-2">
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        scanResult.confidence >= 80 ? "bg-emerald-500" :
                        scanResult.confidence >= 50 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${scanResult.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">{scanResult.confidence}%</span>
                </div>
              )}

              {scanResult.recyclable && (
                <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/50 px-6 py-3 rounded-full flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{scanResult.points} Points</span>
                </div>
              )}
            </div>

            {/* Status Card */}
            <MobileCard className={scanResult.recyclable ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"}>
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  scanResult.recyclable ? "bg-emerald-500" : "bg-red-500"
                }`}>
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${scanResult.recyclable ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"}`}>
                    {scanResult.recyclable ? "Recyclable Item" : "Not Recyclable"}
                  </p>
                  <p className={`text-sm mt-1 ${scanResult.recyclable ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {scanResult.instructions}
                  </p>
                </div>
              </div>
            </MobileCard>

            {/* Environmental Impact */}
            {scanResult.recyclable && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Environmental Impact</h4>
                {(() => {
                  const impact = getEnvironmentalImpact(scanResult.material);
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <MobileCard className="text-center">
                        <Award className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">CO2 Saved</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{impact.co2.toFixed(1)} kg</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">~{impact.drivingKm.toFixed(1)} km driving</p>
                      </MobileCard>
                      <MobileCard className="text-center">
                        <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">Energy Saved</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{impact.energy.toFixed(1)} kWh</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">~{impact.phoneCharges} phone charges</p>
                      </MobileCard>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleScanAnother}
                className="h-12 font-semibold border-2"
              >
                Scan Another
              </Button>
              {scanResult.recyclable && (
                <Button
                  onClick={handleConfirm}
                  className="h-12 font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirm
                </Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
