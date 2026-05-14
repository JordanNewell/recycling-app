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
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";

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

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to view profile</h2>
          <p className="text-gray-600">Track your achievements and progress</p>
        </div>
      </div>
    );
  }

  const badges: BadgeItem[] = [
    {
      id: "1",
      name: "First Steps",
      description: "Complete your first recycling scan",
      icon: "🌱",
      unlocked: true,
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      unlocked: true,
      unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      name: "Plastic Buster",
      description: "Recycle 10 plastic items",
      icon: "♻️",
      unlocked: true,
      unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      name: "Metal Master",
      description: "Recycle 10 metal items",
      icon: "🔧",
      unlocked: true,
      progress: 7,
      requirement: 10,
    },
    {
      id: "5",
      name: "Eco Champion",
      description: "Reach 1000 points",
      icon: "🏆",
      unlocked: true,
      unlockedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "6",
      name: "Streak Legend",
      description: "Maintain a 30-day streak",
      icon: "⚡",
      unlocked: false,
      progress: user.current_streak,
      requirement: 30,
    },
    {
      id: "7",
      name: "Century Club",
      description: "Recycle 100 items",
      icon: "💯",
      unlocked: false,
      progress: user.total_scans,
      requirement: 100,
    },
    {
      id: "8",
      name: "Point Master",
      description: "Reach 5000 points",
      icon: "💎",
      unlocked: false,
      progress: user.points,
      requirement: 5000,
    },
  ];

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
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <div className="flex items-center justify-center space-x-2 mt-2 text-emerald-100">
              <Mail className="w-4 h-4" />
              <p className="text-sm">{user.email}</p>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-1 text-emerald-100">
              <Calendar className="w-4 h-4" />
              <p className="text-xs">Member since {format(new Date(), "MMM yyyy")}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-12 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            value={user.points}
            label="Total Points"
            delay={0.1}
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-600" />}
            value={user.current_streak}
            label="Current Streak"
            delay={0.2}
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-600" />}
            value={user.longest_streak}
            label="Best Streak"
            delay={0.3}
          />
          <StatCard
            icon={<Leaf className="w-5 h-5 text-green-600" />}
            value={user.total_scans}
            label="Total Scans"
            delay={0.4}
          />
        </div>
      </div>

      {/* Badges Section */}
      <div className="p-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Badges</h2>
          </div>
          <div className="bg-emerald-100 px-3 py-1 rounded-full">
            <span className="text-sm font-bold text-emerald-600">
              {badges.filter((b) => b.unlocked).length}/{badges.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge, index) => (
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
                    <Lock className="w-4 h-4 text-gray-400" />
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
                  <h3 className="font-semibold text-sm text-gray-900">{badge.name}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{badge.description}</p>

                  {badge.unlocked && badge.unlockedAt ? (
                    <p className="text-xs text-emerald-600 mt-2 font-medium">
                      Unlocked {format(new Date(badge.unlockedAt), "MMM dd")}
                    </p>
                  ) : badge.progress !== undefined && badge.requirement ? (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(badge.progress / badge.requirement) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
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

      {/* Achievements Summary */}
      <div className="p-4">
        <MobileCard>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Achievements</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Environmental Impact</span>
                <span className="font-semibold text-gray-900">
                  {(user.points * 0.5).toFixed(1)} kg CO2 saved
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Consistency Rate</span>
                <span className="font-semibold text-gray-900">
                  {((user.current_streak / user.longest_streak) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Badges Completion</span>
                <span className="font-semibold text-gray-900">
                  {((badges.filter((b) => b.unlocked).length / badges.length) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </MobileCard>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 font-semibold border-2 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
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
              <h3 className="text-xl font-bold text-gray-900">{selectedBadge.name}</h3>
              <p className="text-gray-600 mt-2">{selectedBadge.description}</p>
            </div>

            {selectedBadge.unlocked && selectedBadge.unlockedAt && (
              <MobileCard className="bg-emerald-50 border-emerald-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900">Badge Unlocked!</p>
                    <p className="text-sm text-emerald-700">
                      {format(new Date(selectedBadge.unlockedAt), "MMMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                </div>
              </MobileCard>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Achievement Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <MobileCard className="text-center">
                  <Award className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Badge Type</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {selectedBadge.requirement ? "Progress" : "Milestone"}
                  </p>
                </MobileCard>
                <MobileCard className="text-center">
                  <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Reward</p>
                  <p className="font-semibold text-gray-900 text-sm">+50 XP</p>
                </MobileCard>
              </div>
            </div>

            {selectedBadge.progress !== undefined && selectedBadge.requirement && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold text-gray-900">
                    {selectedBadge.progress}/{selectedBadge.requirement}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
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
