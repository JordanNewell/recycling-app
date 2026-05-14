import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileCard, StatCard } from "@/components/mobile/MobileCard";
import { StatCardSkeleton, CardSkeleton } from "@/components/mobile/LoadingSkeletons";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { SwipeablePages } from "@/components/mobile/SwipeablePages";
import { Button } from "@/components/ui/button";
import { Leaf, TrendingUp, Flame, Award, ArrowRight, Sparkles, LogIn } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function HomePage() {
  const { user, loading, login, register, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleRefresh = async () => {
    if (user) {
      await refreshUser();
      toast.success("Dashboard refreshed!");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    
    if (isSignUp && !name) {
      toast.error("Please enter your name");
      return;
    }

    let result;
    if (isSignUp) {
      result = await register(email, password, name);
      if (result.success) {
        toast.success("Account created! Please check your email to verify.");
        setShowAuthModal(false);
        return;
      }
    } else {
      result = await login(email, password);
      if (result.success) {
        toast.success("Welcome back!");
        setShowAuthModal(false);
        return;
      }
    }
    
    if (result.error) {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="pt-6">
          <StatCardSkeleton />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full blur-3xl opacity-20"
            />
            <Leaf className="w-24 h-24 text-emerald-600 mx-auto relative" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">EcoScan</h1>
            <p className="text-lg text-gray-600">
              Turn recycling into rewards
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              size="lg"
              onClick={() => setShowAuthModal(true)}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            
            <p className="text-sm text-gray-500">
              Scan items, earn points, and make a difference
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8">
            {[
              { icon: Leaf, label: "Eco-Friendly", value: "100%" },
              { icon: Award, label: "Badges", value: "15+" },
              { icon: TrendingUp, label: "Points", value: "Unlimited" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <item.icon className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-600">{item.label}</p>
                <p className="text-sm font-bold text-gray-900">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isSignUp ? "Create Account" : "Welcome Back"}</DialogTitle>
              <DialogDescription>
                {isSignUp 
                  ? "Sign up to start tracking your recycling impact" 
                  : "Sign in to continue your recycling journey"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAuth} className="space-y-4 mt-4">
              {isSignUp && (
                <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
              <Button type="submit" className="w-full h-12 text-base font-semibold">
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Need an account? Sign up"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const recentActivities = [
    { icon: Leaf, action: "Recycled plastic bottle", time: "2h ago", points: 25 },
    { icon: Sparkles, action: "Earned First Steps badge", time: "5h ago", points: 50 },
    { icon: TrendingUp, action: "Reached 7-day streak", time: "1d ago", points: 100 },
  ];

  return (
    <SwipeablePages 
      currentPath={location.pathname}
      swipeConfig={{ left: "/history" }}
    >
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-6 pt-12 rounded-b-3xl shadow-xl"
        >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className="text-3xl font-bold"
              >
                Hello, {user.name}!
              </motion.h1>
              <p className="text-emerald-100 mt-1">Keep up the great work</p>
            </div>
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              <Leaf className="w-7 h-7" />
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mt-6"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-emerald-100 text-sm">Total Points</p>
              <p className="text-3xl font-bold mt-1">{user.points}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-emerald-100 text-sm">Current Streak</p>
              <div className="flex items-baseline mt-1">
                <p className="text-3xl font-bold">{user.current_streak}</p>
                <Flame className="w-5 h-5 ml-2 text-orange-300" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="p-4 -mt-6">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            value={user.total_scans}
            label="Total Scans"
            trend="up"
            trendValue="+12%"
            delay={0.1}
          />
          <StatCard
            icon={<Award className="w-5 h-5 text-emerald-600" />}
            value={user.badges_earned}
            label="Badges Earned"
            trend="neutral"
            delay={0.2}
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-600" />}
            value={user.longest_streak}
            label="Longest Streak"
            delay={0.3}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/history")}
            className="text-emerald-600 hover:text-emerald-700"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <MobileCard key={index} delay={0.1 + index * 0.05} pressable>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <activity.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">+{activity.points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            </MobileCard>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 pb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/scan")}
            className="h-24 flex-col space-y-2 border-2 border-emerald-200 hover:bg-emerald-50"
          >
            <Leaf className="w-6 h-6 text-emerald-600" />
            <span className="font-semibold">Scan Item</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/badges")}
            className="h-24 flex-col space-y-2 border-2 border-emerald-200 hover:bg-emerald-50"
          >
            <Award className="w-6 h-6 text-emerald-600" />
            <span className="font-semibold">View Badges</span>
          </Button>
        </div>
      </div>
      </PullToRefresh>
    </SwipeablePages>
  );
}
