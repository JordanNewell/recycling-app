import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { notificationService } from '@/services/notificationService';

// Data structures
interface RecyclingEntry {
  id: string;
  item: string;
  material: string;
  date: Date;
  points: number;
  created_at?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  points: number;
  current_streak: number;
  longest_streak: number;
  last_scan_date?: string;
  total_scans?: number;
  badges_earned?: number;
}

interface User extends UserProfile {
  recyclingHistory: RecyclingEntry[];
  badges: Badge[];
  currentStreak: number;
  longestStreak: number;
  lastScanDate?: string;
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
  addRecyclingEntry: (item: string, material: string, location?: { latitude: number; longitude: number; address?: string; locationName?: string }) => Promise<{ totalItems: number; isDuplicate?: boolean }>;
  recyclingHistory: RecyclingEntry[];
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

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
          badges (
            id,
            name,
            description,
            image_url,
            criteria
          )
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
        total_scans: totalScans,
        badges_earned: badgesEarned,
        currentStreak: profile.current_streak || 0,
        longestStreak: profile.longest_streak || 0,
        lastScanDate: profile.last_scan_date,
        recyclingHistory: recyclingEntries?.map(entry => ({
          id: entry.id,
          item: entry.item,
          material: entry.material,
          date: new Date(entry.created_at),
          points: entry.points,
          created_at: entry.created_at
        })) || [],
        badges: userBadges?.map((ub: any) => ({
          id: ub.badges.id,
          name: ub.badges.name,
          description: ub.badges.description,
          imageUrl: ub.badges.image_url || '',
          criteria: ub.badges.criteria
        })) || []
      };

      setUser(user);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  };

  // Authentication functions
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
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
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
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

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const loginWithProvider = async (provider: 'google' | 'twitter' | 'facebook'): Promise<{ success: boolean; error?: string }> => {
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
    await supabase.auth.signOut();
  };

  // Recycling and badge logic
  const getPointsForMaterial = (material: string): number => {
    const pointsMap: Record<string, number> = {
      'Plastic': 10,
      'PET Plastic': 10,
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
    location?: { latitude: number; longitude: number; address?: string; locationName?: string }
  ): Promise<{ totalItems: number; isDuplicate?: boolean }> => {
    if (!user || !session) return { totalItems: 0 };

    try {
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
          totalItems: user.recyclingHistory.length,
          isDuplicate: true 
        };
      }

      const points = getPointsForMaterial(material);
      
      // Add recycling entry to database with location data
      const { error: entryError } = await supabase
        .from('recycling_entries')
        .insert({
          user_id: user.id,
          item,
          material,
          points,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          address: location?.address || null,
          location_name: location?.locationName || null
        });

      if (entryError) throw entryError;

      // Calculate streak
      const today = new Date().toISOString().split('T')[0];
      const lastScanDate = user.last_scan_date;
      
      let newStreak = user.current_streak;
      if (lastScanDate) {
        const lastScan = new Date(lastScanDate);
        const daysDiff = Math.floor((new Date().getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          newStreak += 1;
        } else if (daysDiff > 1) {
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
          last_scan_date: today
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Check for new badges
      await checkForNewBadges(user.id, user.recyclingHistory.length + 1, user.points + points, newStreak);

      // Reload user profile
      await loadUserProfile(user.id);

      return { totalItems: user.recyclingHistory.length + 1, isDuplicate: false };
    } catch (error) {
      console.error('Error adding recycling entry:', error);
      return { totalItems: user.recyclingHistory.length };
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

        // Check for milestone notifications
        if (totalPoints >= 1000 && !existingBadgeIds.find(id => {
          const badge = badges?.find(b => b.id === id);
          return badge?.criteria === 'earn_1000_points';
        })) {
          await notificationService.notifyMilestone('1000 Points Club', totalPoints);
        }

        // Check for streak notifications
        if (currentStreak >= 7 && currentStreak % 7 === 0) {
          await notificationService.notifyStreakAchievement(currentStreak);
        }
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
      refreshUser
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
