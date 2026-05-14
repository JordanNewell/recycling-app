import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle2, XCircle, Loader2, Sparkles, ArrowLeft, Info, Award, Zap } from "lucide-react";
import { MobileCard } from "@/components/mobile/MobileCard";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { toast } from "sonner";
import { apiService } from "@/services/apiService";

interface ScanResult {
  item: string;
  material: string;
  recyclable: boolean;
  points: number;
  instructions: string;
}

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const { user, addRecyclingEntry } = useAuth();
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!user) {
      toast.error("Please sign in to scan items");
      return;
    }

    setScanning(true);
    setScanResult(null);
    setShowResultSheet(false);

    // Simulate camera capture and use AI service
    setTimeout(async () => {
      try {
        // Call the real API service with a mock image
        const result = await apiService.identifyItem("mock_image_data");
        
        // Get points for the material
        const pointsMap: Record<string, number> = {
          'PET Plastic (#1)': 25,
          'Aluminum': 30,
          'Glass': 35,
          'Cardboard': 20,
          'Paper': 10,
        };
        const points = pointsMap[result.material] || 10;

        const newScanResult = {
          item: result.item,
          material: result.material,
          recyclable: result.recyclable,
          points: result.recyclable ? points : 0,
          instructions: result.instructions,
        };

        setScanResult(newScanResult);
        setShowResultSheet(true);
      } catch (error) {
        toast.error("Failed to identify item. Please try again.");
        console.error("Scan error:", error);
      }
      setScanning(false);
    }, 2000);
  };

  const handleConfirm = async () => {
    if (!scanResult || !user) return;

    if (scanResult.recyclable) {
      const result = await addRecyclingEntry(
        scanResult.item,
        scanResult.material,
        { latitude: 0, longitude: 0, locationName: "Mobile Scan" }
      );

      if (result.isDuplicate) {
        toast.warning("Duplicate scan detected", {
          description: "This item was scanned recently. Try scanning a different item.",
        });
      } else {
        toast.success(`+${scanResult.points} points earned!`, {
          description: "Keep up the great work!",
        });
      }
    }

    // Close sheet and reset for next scan
    setShowResultSheet(false);
    setScanResult(null);
  };

  const handleScanAnother = () => {
    setShowResultSheet(false);
    setScanResult(null);
  };

  return (
    <div className="min-h-screen">
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
        {/* Camera View */}
        <MobileCard>
          <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden">
            {/* Simulated Camera Feed */}
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

            {/* Scanning Overlay */}
            {scanning && (
              <motion.div
                animate={{ y: ["0%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent h-1/4"
              />
            )}

            {/* Corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400" />
          </div>
        </MobileCard>

        {/* Scan Button */}
        {!scanResult && !scanning && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Button
              size="lg"
              onClick={handleScan}
              disabled={!user}
              className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Camera className="w-6 h-6 mr-2" />
              Start Scanning
            </Button>
          </motion.div>
        )}

        {/* Tips */}
        {!scanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <MobileCard>
              <h3 className="font-semibold text-gray-900 mb-3">Scanning Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">•</span>
                  <span>Ensure good lighting for best results</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">•</span>
                  <span>Hold camera steady and center the item</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-600 mr-2">•</span>
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
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-16 h-16 text-red-600" />
                  </div>
                </motion.div>
              )}

              <h3 className="text-2xl font-bold text-gray-900">{scanResult.item}</h3>
              <p className="text-gray-600 mt-1">{scanResult.material}</p>

              {scanResult.recyclable && (
                <div className="mt-4 bg-emerald-50 px-6 py-3 rounded-full flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span className="text-lg font-bold text-emerald-600">+{scanResult.points} Points</span>
                </div>
              )}
            </div>

            {/* Status Card */}
            <MobileCard className={scanResult.recyclable ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}>
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  scanResult.recyclable ? "bg-emerald-500" : "bg-red-500"
                }`}>
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${scanResult.recyclable ? "text-emerald-900" : "text-red-900"}`}>
                    {scanResult.recyclable ? "Recyclable Item" : "Not Recyclable"}
                  </p>
                  <p className={`text-sm mt-1 ${scanResult.recyclable ? "text-emerald-700" : "text-red-700"}`}>
                    {scanResult.instructions}
                  </p>
                </div>
              </div>
            </MobileCard>

            {/* Environmental Impact (if recyclable) */}
            {scanResult.recyclable && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Environmental Impact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MobileCard className="text-center">
                    <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">CO2 Saved</p>
                    <p className="font-semibold text-gray-900 text-sm">{(scanResult.points * 0.5).toFixed(1)} kg</p>
                  </MobileCard>
                  <MobileCard className="text-center">
                    <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Energy Saved</p>
                    <p className="font-semibold text-gray-900 text-sm">{(scanResult.points * 0.3).toFixed(1)} kWh</p>
                  </MobileCard>
                </div>
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
