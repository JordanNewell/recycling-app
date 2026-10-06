import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MobileCard, StatCard } from "@/components/mobile/MobileCard";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { Button } from "@/components/ui/button";
import {
  User,
  Award,
  TrendingUp,
  Flame,
  Leaf,
  LogOut,
  Mail,
  Calendar,
  Trophy,
  Target,
  Zap,
  Lock,
  CheckCircle,
  Moon,
  Sun,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useMemo, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";
import { useTheme } from "next-themes";
import { getTotalEnvironmentalImpact } from "@/lib/impact";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  requirement?: number;
}

const BADGE_ICONS: Record<string, string> = {
  "scan_1_item": "🌱",
  "scan_10_items": "♻️",
  "scan_50_items": "🌍",
  "streak_7_days": "🔥",
  "earn_100_points": "🏆",
  "earn_1000_points": "💎",
};

const BADGE_REQUIREMENTS: Record<string, { progress: number; label: string; type: "scans" | "points" | "streak" }> = {
  "scan_1_item": { progress: 1, label: "1 scan", type: "scans" },
  "scan_10_items": { progress: 10, label: "10 scans", type: "scans" },
  "scan_50_items": { progress: 50, label: "50 scans", type: "scans" },
  "streak_7_days": { progress: 7, label: "7 day streak", type: "streak" },
  "earn_100_points": { progress: 100, label: "100 points", type: "points" },
  "earn_1000_points": { progress: 1000, label: "1000 points", type: "points" },
};

function getUserStatForType(type: "scans" | "points" | "streak", user: NonNullable<ReturnType<typeof useAuth>["user"]>): number {
  switch (type) {
    case "scans": return user.total_scans || 0;
    case "points": return user.points;
    case "streak": return user.current_streak;
  }
}

export default function ProfilePage({ focusBadges = false }: { focusBadges?: boolean }) {
  const { user, logout, recyclingHistory } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const badgesSectionRef = useRef<HTMLDivElement | null>(null);

  // If we landed on /badges, scroll the badges section into view after mount.
  useEffect(() => {
    if (focusBadges && user && badgesSectionRef.current) {
      badgesSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusBadges, user]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleBadgeClick = (badge: BadgeItem) => {
    if (badge.unlocked) {
      setSelectedBadge(badge);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Chart data: last 7 days activity (local-time day boundaries)
  const weeklyActivityData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // toLocaleDateString('en-CA') gives YYYY-MM-DD in LOCAL time (not UTC),
      // matching the user's actual day boundaries rather than UTC's.
      const dateStr = date.toLocaleDateString('en-CA');
      const count = recyclingHistory.filter((entry) =>
        entry.created_at?.startsWith(dateStr)
      ).length;
      days.push({
        day: format(date, "EEE"),
        count,
      });
    }
    return days;
  }, [recyclingHistory]);

  // Chart data: material breakdown
  const materialBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {};
    recyclingHistory.forEach((entry) => {
      const material = entry.material.split(" (")[0].split("#")[0].trim();
      counts[material] = (counts[material] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [recyclingHistory]);

  const MATERIAL_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sign in to view profile</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your achievements and progress</p>
        </div>
      </div>
    );
  }

  // Build badges from real data + all available badge definitions.
  // (user_badges.badge_id always maps to a known criteria via the seed, so no
  // separate "unknown badges" pass is needed.)
  const unlockedBadgeIds = new Set(user.badges.map((b) => b.criteria));
  const allBadges = Object.entries(BADGE_REQUIREMENTS).map(([criteria, req]) => {
    const isUnlocked = unlockedBadgeIds.has(criteria);
    const current = getUserStatForType(req.type, user);
    const badgeData = user.badges.find((b) => b.criteria === criteria);

    return {
      id: criteria,
      name: badgeData?.name || criteria.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: badgeData?.description || `Reach ${req.label}`,
      icon: BADGE_ICONS[criteria] || "🏅",
      unlocked: isUnlocked,
      unlockedAt: badgeData?.unlockedAt,
      progress: isUnlocked ? undefined : Math.min(current, req.progress),
      requirement: req.progress,
    };
  });

  const impact = getTotalEnvironmentalImpact(recyclingHistory);

  return (
    <div className="min-h-screen pb-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-6 pt-12 pb-20 relative overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full"
        />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30"
          >
            <User className="w-12 h-12" />
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold">{user.name}</h1>
            <div className="flex items-center justify-center space-x-2 mt-2 text-emerald-100">
              <Mail className="w-4 h-4" />
              <p className="text-sm">{user.email}</p>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-1 text-emerald-100">
              <Calendar className="w-4 h-4" />
              <p className="text-xs">Member since {format(user.created_at ? new Date(user.created_at) : new Date(), "MMM yyyy")}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-x-visible md:snap-none">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            value={user.points}
            label="Total Points"
            delay={0.1}
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
            value={user.current_streak}
            label="Current Streak"
            delay={0.2}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
            value={user.longest_streak}
            label="Best Streak"
            delay={0.3}
          />
          <StatCard
            icon={<Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />}
            value={user.total_scans ?? 0}
            label="Total Scans"
            delay={0.4}
          />
        </div>
      </div>

      {/* Badges Section */}
      <div ref={badgesSectionRef} className="p-4 mt-6 scroll-mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Badges</h2>
          </div>
          <div className="bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {allBadges.filter((b) => b.unlocked).length}/{allBadges.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleBadgeClick(badge)}
            >
              <MobileCard
                pressable={badge.unlocked}
                className={`relative ${badge.unlocked ? "cursor-pointer" : "opacity-60"}`}
              >
                {!badge.unlocked && (
                  <div className="absolute top-3 right-3">
                    <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                )}

                <div className="text-center">
                  <div
                    className={`text-4xl mb-2 ${
                      badge.unlocked ? "filter-none" : "grayscale opacity-40"
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{badge.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{badge.description}</p>

                  {badge.unlocked ? (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                      Unlocked
                    </p>
                  ) : badge.progress !== undefined && badge.requirement ? (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(badge.progress / badge.requirement) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {badge.progress}/{badge.requirement}
                      </p>
                    </div>
                  ) : null}
                </div>
              </MobileCard>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      {recyclingHistory.length > 0 && (
        <div className="p-4 mt-4 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {/* Weekly Activity Chart */}
          <MobileCard>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Weekly Activity</h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivityData}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: theme === "dark" ? "#9ca3af" : "#6b7280" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        color: theme === "dark" ? "#f3f4f6" : "#111827",
                      }}
                      labelStyle={{ color: theme === "dark" ? "#f3f4f6" : "#111827" }}
                      formatter={(value: number) => [`${value} items`, "Scanned"]}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </MobileCard>

          {/* Material Breakdown Chart */}
          {materialBreakdownData.length > 0 && (
            <MobileCard>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Material Breakdown</h3>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-32 w-32 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={materialBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={55}
                          dataKey="value"
                          strokeWidth={2}
                          stroke={theme === "dark" ? "#111827" : "#ffffff"}
                        >
                          {materialBreakdownData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={MATERIAL_COLORS[index % MATERIAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {materialBreakdownData.slice(0, 5).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: MATERIAL_COLORS[index % MATERIAL_COLORS.length] }}
                          />
                          <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </MobileCard>
          )}
        </div>
      )}

      {/* Achievements Summary + Settings: side-by-side on md+ */}
      <div className="md:grid md:grid-cols-2 md:gap-4 md:items-start">
        {/* Achievements Summary */}
        <div className="p-4">
          <MobileCard>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Achievements</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Environmental Impact</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {impact.totalCo2.toFixed(1)} kg CO2 saved
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Energy Saved</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {impact.totalEnergy.toFixed(1)} kWh
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-600 dark:text-gray-400">Active Days</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {(() => {
                      const uniqueDays = new Set(
                        recyclingHistory.map(e => e.created_at?.split('T')[0]).filter(Boolean)
                      );
                      return uniqueDays.size;
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Badges Completion</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {allBadges.length > 0 ? ((allBadges.filter((b) => b.unlocked).length / allBadges.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Settings */}
        <div className="p-4">
          <MobileCard>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Settings</h3>
              </div>
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="w-full justify-start h-12"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 mr-3 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 mr-3 text-gray-600" />
                )}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 md:max-w-sm">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 font-semibold border-2 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Badge Detail Bottom Sheet */}
      <BottomSheet
        open={!!selectedBadge}
        onOpenChange={(open) => !open && setSelectedBadge(null)}
        title={selectedBadge?.name}
        description="Badge Details"
      >
        {selectedBadge && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-6xl mb-4">{selectedBadge.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedBadge.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedBadge.description}</p>
            </div>

            {selectedBadge.unlocked && (
              <MobileCard className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">Badge Unlocked!</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {selectedBadge.unlockedAt ? format(new Date(selectedBadge.unlockedAt), "MMMM dd, yyyy") : "Earned through your recycling efforts"}
                    </p>
                  </div>
                </div>
              </MobileCard>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Achievement Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <MobileCard className="text-center">
                  <Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Badge Type</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {selectedBadge.requirement ? "Progress" : "Milestone"}
                  </p>
                </MobileCard>
                <MobileCard className="text-center">
                  <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Reward</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">+50 XP</p>
                </MobileCard>
              </div>
            </div>

            {selectedBadge.progress !== undefined && selectedBadge.requirement && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedBadge.progress}/{selectedBadge.requirement}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (selectedBadge.progress / selectedBadge.requirement) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={() => setSelectedBadge(null)}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              Close
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
