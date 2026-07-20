import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';
import { toast } from 'sonner';

const AUTH_UNAVAILABLE = 'Authentication is not configured. Please contact support.';

// Data structures
export interface RecyclingEntry {
  id: string;
  item: string;
  material: string;
  date: Date;
  points: number;
  created_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
  unlockedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  points: number;
  current_streak: number;
  longest_streak: number;
  last_scan_date?: string;
  total_scans?: number;
  badges_earned?: number;
  created_at?: string;
}

interface User extends UserProfile {
  recyclingHistory: RecyclingEntry[];
  badges: Badge[];
}

// AuthContext interface
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithProvider: (provider: 'google' | 'twitter' | 'facebook') => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addRecyclingEntry: (item: string, material: string, location?: { latitude: number | null; longitude: number | null; address?: string; locationName?: string }) => Promise<{ totalItems: number; isDuplicate?: boolean; error?: boolean }>;
  recyclingHistory: RecyclingEntry[];
  refreshUser: () => Promise<void>;
  getPointsForMaterial: (material: string) => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const profileLoadingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Set up auth state listener — Supabase v2 fires INITIAL_SESSION on subscribe,
    // so explicit getSession() below would just duplicate the work.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        // Token refresh doesn't change identity — skip the expensive profile reload
        // to avoid hourly re-renders and accidental logouts on transient errors.
        if (event === 'TOKEN_REFRESHED') return;

        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
          profileLoadingRef.current = null;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Dedupe concurrent calls (getSession + onAuthStateChange can both fire on init)
    if (profileLoadingRef.current === userId) return;
    profileLoadingRef.current = userId;

    try {
      // Get user profile. `profile` is reassigned below if the row didn't exist yet,
      // so it must be `let`; `profileError` is never reassigned.
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      let { data: profile } = profileResult;
      const { error: profileError } = profileResult;

      // If no profile exists (trigger didn't fire), create one
      if (profileError && profileError.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser();
        const userName = userData?.user?.user_metadata?.name || userData?.user?.email?.split('@')[0] || 'User';
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email: userData?.user?.email, name: userName });
        if (insertError) throw insertError;
        const { data: newProfile, error: retryError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (retryError) throw retryError;
        profile = newProfile;
      } else if (profileError) {
        throw profileError;
      }

      // Get recycling history
      const { data: recyclingEntries, error: recyclingError } = await supabase
        .from('recycling_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (recyclingError) throw recyclingError;

      // Get user badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          badges (
            id,
            name,
            description,
            image_url,
            criteria
          ),
          created_at
        `)
        .eq('user_id', userId);

      if (badgesError) throw badgesError;

      // Count total scans
      const totalScans = recyclingEntries?.length || 0;
      const badgesEarned = userBadges?.length || 0;

      const user: User = {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || 'User',
        points: profile.points || 0,
        current_streak: profile.current_streak || 0,
        longest_streak: profile.longest_streak || 0,
        last_scan_date: profile.last_scan_date,
        created_at: profile.created_at,
        total_scans: totalScans,
        badges_earned: badgesEarned,
        recyclingHistory: recyclingEntries?.map(entry => ({
          id: entry.id,
          item: entry.item,
          material: entry.material,
          date: new Date(entry.created_at),
          points: entry.points,
          created_at: entry.created_at
        })) || [],
        badges: userBadges?.map((ub: any) => ({
          id: ub.badges.criteria || ub.badges.id,
          name: ub.badges.name,
          description: ub.badges.description,
          imageUrl: ub.badges.image_url || '',
          criteria: ub.badges.criteria,
          unlockedAt: ub.created_at
        })) || []
      };

      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Don't silently boot the user on a transient error — only clear if there's no user yet.
      setUser((prev) => prev);
      setLoading(false);
      toast.error('Could not load your profile', {
        description: 'Please check your connection and pull to refresh.',
      });
    } finally {
      profileLoadingRef.current = null;
    }
  };

  // Authentication functions
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: AUTH_UNAVAILABLE };
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: AUTH_UNAVAILABLE };
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If session returned, email confirmation is off — user is logged in
      // If no session, email confirmation is on — trigger onAuthStateChange won't fire yet
      if (data.session) {
        await loadUserProfile(data.session.user.id);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const loginWithProvider = async (provider: 'google' | 'twitter' | 'facebook'): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: AUTH_UNAVAILABLE };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  // Recycling and badge logic
  const getPointsForMaterial = (material: string): number => {
    const pointsMap: Record<string, number> = {
      'Plastic': 10,
      'PET Plastic (#1)': 25,
      'Glass': 15,
      'Metal': 15,
      'Aluminum': 30,
      'Paper': 5,
      'Cardboard': 20,
      'Electronics': 25,
      'Batteries': 20,
      'Paper with Plastic Lining': 5
    };
    return pointsMap[material] || 10;
  };

  const addRecyclingEntry = async (
    item: string,
    material: string,
    location?: { latitude: number | null; longitude: number | null; address?: string; locationName?: string }
  ): Promise<{ totalItems: number; isDuplicate?: boolean; error?: boolean }> => {
    if (!user || !session || !supabase) return { totalItems: 0, error: true };

    try {
      const currentCount = user.recyclingHistory.length;

      // Anti-spam check: Look for identical scans within the last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

      const { data: recentScans, error: checkError } = await supabase
        .from('recycling_entries')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('item', item)
        .gte('created_at', twoMinutesAgo)
        .limit(1);

      if (checkError) {
        console.error('Error checking for duplicate scans:', checkError);
      }

      // If duplicate found within 2 minutes, return without inserting
      if (recentScans && recentScans.length > 0) {
        console.log('Duplicate scan detected within 2 minutes, skipping insertion');
        return {
          totalItems: currentCount,
          isDuplicate: true
        };
      }

      const points = getPointsForMaterial(material);

      // Add recycling entry to database with location data.
      // location.latitude/longitude may legitimately be null (geolocation unavailable) —
      // never store the (0,0) sentinel.
      const { error: entryError } = await supabase
        .from('recycling_entries')
        .insert({
          user_id: user.id,
          item,
          material,
          points,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          address: location?.address || null,
          location_name: location?.locationName || null
        });

      if (entryError) throw entryError;

      // Calculate streak using local calendar days (last_scan_date is a date, not timestamptz).
      const todayLocalStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local TZ
      const lastScanDate = user.last_scan_date;

      let newStreak = user.current_streak;
      if (lastScanDate) {
        // Parse as local date (not UTC) by splitting components manually.
        const [y, m, d] = lastScanDate.split('-').map(Number);
        const lastScanLocal = new Date(y, m - 1, d);
        const todayLocal = new Date();
        const todayMidnight = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate());
        const daysDiff = Math.round((todayMidnight.getTime() - lastScanLocal.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 0) {
          // Already scanned today — keep streak as-is
        } else if (daysDiff === 1) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          points: user.points + points,
          current_streak: newStreak,
          longest_streak: Math.max(user.longest_streak, newStreak),
          last_scan_date: todayLocalStr
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Check for new badges
      await checkForNewBadges(user.id, user.recyclingHistory.length + 1, user.points + points, newStreak);

      // Reload user profile
      await loadUserProfile(user.id);

      return { totalItems: currentCount + 1, isDuplicate: false };
    } catch (error) {
      console.error('Error adding recycling entry:', error);
      return { totalItems: user.recyclingHistory.length, error: true };
    }
  };

  const checkForNewBadges = async (userId: string, totalScans: number, totalPoints: number, currentStreak: number) => {
    try {
      // Get available badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*');

      if (badgesError) throw badgesError;

      // Get user's existing badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      if (userBadgesError) throw userBadgesError;

      const existingBadgeIds = userBadges?.map(ub => ub.badge_id) || [];

      // Check for new badges to award
      const newBadges = badges?.filter(badge => {
        if (existingBadgeIds.includes(badge.id)) return false;

        switch (badge.criteria) {
          case 'scan_1_item':
            return totalScans >= 1;
          case 'scan_10_items':
            return totalScans >= 10;
          case 'scan_50_items':
            return totalScans >= 50;
          case 'streak_7_days':
            return currentStreak >= 7;
          case 'earn_100_points':
            return totalPoints >= 100;
          case 'earn_1000_points':
            return totalPoints >= 1000;
          default:
            return false;
        }
      }) || [];

      // Award new badges
      if (newBadges.length > 0) {
        const badgeInserts = newBadges.map(badge => ({
          user_id: userId,
          badge_id: badge.id
        }));

        const { error: insertError } = await supabase
          .from('user_badges')
          .insert(badgeInserts);

        if (insertError) throw insertError;

        // Send notifications for new badges
        for (const badge of newBadges) {
          await notificationService.notifyBadgeUnlocked(
            badge.name,
            badge.description
          );
        }
      }

      // Milestone and streak notifications are independent of badge awarding —
      // they should fire on every qualifying scan, not just when a new badge unlocks.
      if (totalPoints >= 1000 && !existingBadgeIds.find(id => {
        const badge = badges?.find(b => b.id === id);
        return badge?.criteria === 'earn_1000_points';
      })) {
        await notificationService.notifyMilestone('1000 Points Club', totalPoints);
      }

      if (currentStreak >= 7 && currentStreak % 7 === 0) {
        await notificationService.notifyStreakAchievement(currentStreak);
      }
    } catch (error) {
      console.error('Error checking for badges:', error);
    }
  };

  const refreshUser = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!session,
      loading,
      login,
      register,
      loginWithProvider,
      logout,
      addRecyclingEntry,
      recyclingHistory: user?.recyclingHistory || [],
      refreshUser,
      getPointsForMaterial
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
