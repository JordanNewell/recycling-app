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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

export default function HomePage() {
  const { user, loading, login, register, loginWithProvider, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const signUpForm = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) });

  const handleRefresh = async () => {
    if (user) {
      await refreshUser();
      toast.success("Dashboard refreshed!");
    }
  };

  const handleProviderLogin = async (provider: "google" | "twitter" | "facebook") => {
    const result = await loginWithProvider(provider);
    if (!result.success && result.error) {
      toast.error(result.error);
    }
  };

  const handleLoginSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success("Welcome back!");
      setShowAuthModal(false);
      loginForm.reset();
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const handleSignUpSubmit = async (data: SignUpFormData) => {
    const result = await register(data.email, data.password, data.name);
    if (result.success) {
      toast.success("Account created!");
      setShowAuthModal(false);
      signUpForm.reset();
    } else if (result.error) {
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
            <Leaf className="w-24 h-24 text-emerald-600 dark:text-emerald-400 mx-auto relative" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">EcoScan</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
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

            <p className="text-sm text-gray-500 dark:text-gray-500">
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
                <item.icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
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
            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)} className="space-y-4 mt-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Your Name"
                    className="h-12"
                    {...signUpForm.register("name")}
                  />
                  {signUpForm.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">{signUpForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    className="h-12"
                    {...signUpForm.register("email")}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">{signUpForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password (min 8 characters)"
                    className="h-12"
                    {...signUpForm.register("password")}
                  />
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">{signUpForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={signUpForm.formState.isSubmitting}>
                  {signUpForm.formState.isSubmitting ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            ) : (
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4 mt-4">
                {/* Social Login */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 font-medium"
                    onClick={() => handleProviderLogin("google")}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-card text-muted-foreground">or continue with email</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    className="h-12"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    className="h-12"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500 mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loginForm.formState.isSubmitting}>
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            )}

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Need an account? Sign up"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Derive recent activities from actual data
  const recentActivities = user.recyclingHistory.slice(0, 5).map((entry) => ({
    icon: Leaf,
    action: `Recycled ${entry.item}`,
    time: entry.created_at ? new Date(entry.created_at).toLocaleDateString() : "recently",
    points: entry.points,
  }));

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
            icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            value={user.total_scans ?? 0}
            label="Total Scans"
            delay={0.1}
          />
          <StatCard
            icon={<Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            value={user.badges_earned ?? 0}
            label="Badges Earned"
            delay={0.2}
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
            value={user.longest_streak}
            label="Longest Streak"
            delay={0.3}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Activity</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/history")}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {recentActivities.length === 0 ? (
          <MobileCard>
            <div className="text-center py-6">
              <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No activity yet. Start scanning!</p>
            </div>
          </MobileCard>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <MobileCard key={index} delay={0.1 + index * 0.05} pressable>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{activity.action}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{activity.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">+{activity.points}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">points</p>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 pb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/scan")}
            className="h-24 flex-col space-y-2 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">Scan Item</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/badges")}
            className="h-24 flex-col space-y-2 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">View Badges</span>
          </Button>
        </div>
      </div>
      </PullToRefresh>
    </SwipeablePages>
  );
}
