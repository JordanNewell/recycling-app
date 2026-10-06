import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { MobileCard } from "@/components/mobile/MobileCard";
import { ListItemSkeleton } from "@/components/mobile/LoadingSkeletons";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { SwipeablePages } from "@/components/mobile/SwipeablePages";
import { Button } from "@/components/ui/button";
import { Leaf, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { getTotalEnvironmentalImpact } from "@/lib/impact";

export default function HistoryPage() {
  const { user, recyclingHistory, loading, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    toast.success("History refreshed!");
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getDateLabel = (date?: string) => {
    const itemDate = new Date(date || Date.now());
    if (isToday(itemDate)) return "Today";
    if (isYesterday(itemDate)) return "Yesterday";
    return format(itemDate, "MMM dd, yyyy");
  };

  const groupByDate = () => {
    const grouped: Record<string, typeof recyclingHistory> = {};
    recyclingHistory.forEach((entry) => {
      const dateLabel = getDateLabel(entry.created_at);
      if (!grouped[dateLabel]) grouped[dateLabel] = [];
      grouped[dateLabel].push(entry);
    });
    return grouped;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Leaf className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sign in to view history</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your recycling journey</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4 pt-20">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    );
  }

  const groupedHistory = groupByDate();
  const totalPoints = recyclingHistory.reduce((sum, entry) => sum + entry.points, 0);
  const impact = getTotalEnvironmentalImpact(recyclingHistory);

  return (
    <SwipeablePages
      currentPath={location.pathname}
      swipeConfig={{ right: "/" }}
    >
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen pb-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-6 pt-12 rounded-b-3xl shadow-xl">
        <motion.div initial={{ y: -20 }} animate={{ y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold">Recycling History</h1>
          <p className="text-emerald-100 mt-1">Your environmental impact</p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mt-6"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{recyclingHistory.length}</p>
            <p className="text-xs text-emerald-100 mt-1">Items</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-emerald-100 mt-1">Points</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{user.current_streak}</p>
            <p className="text-xs text-emerald-100 mt-1">Day Streak</p>
          </div>
        </motion.div>
      </div>

      {/* Pull to Refresh */}
      <div className="p-4 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-gray-600 dark:text-gray-400"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Timeline + Impact: side-by-side on md+ (impact card sticks while scrolling) */}
      <div className="md:grid md:grid-cols-[1fr_320px] md:items-start">
        {/* History Timeline */}
        <div className="p-4 space-y-6">
          {Object.keys(groupedHistory).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Leaf className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No history yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Start scanning items to build your history</p>
            </motion.div>
          ) : (
            Object.entries(groupedHistory).map(([date, entries], groupIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                {/* Date Header */}
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{date}</h3>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Entries */}
                <div className="space-y-3">
                  {entries.map((entry, index) => (
                    <MobileCard key={entry.id} delay={0.05 * index} pressable>
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{entry.item}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{entry.material}</p>

                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(new Date(entry.created_at || entry.date), { addSuffix: true })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              +{entry.points}
                            </span>
                          </div>
                        </div>
                      </div>
                    </MobileCard>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Impact Summary */}
        {recyclingHistory.length > 0 && (
          <div className="p-4 md:sticky md:top-4">
            <MobileCard>
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Environmental Impact</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{impact.totalCo2.toFixed(1)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">kg CO2 Saved</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{impact.totalEnergy.toFixed(1)}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">kWh Energy Saved</p>
                </div>
              </div>
            </MobileCard>
          </div>
        )}
      </div>
      </PullToRefresh>
    </SwipeablePages>
  );
}
