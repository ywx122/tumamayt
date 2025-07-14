import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, logToDiscord } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast'; // Use the re-exported version
import { Database } from '@/integrations/supabase/types';

type UserProfile = Database['public']['Tables']['profiles']['Row'];

// Define our own wallet type since it's not in the generated types yet
interface Wallet {
  user_id: string;
  balance: number;
  last_reward_claim?: string | null;
  level?: number;
  updated_at?: string;
}

interface AuthUser {
  id: string;
  email?: string;
  username: string;
  coins: number;
  isAdmin: boolean;
  isOwner: boolean;
  lastRewardClaim?: Date | null;
  lastSpinTime?: Date;
  lastLeaderboardRewardClaim?: Date | null;
  afkFarmStart?: Date;
  afkFarmCoinsEarned?: number;
  level?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserCoins: (amount: number) => Promise<void>;
  updatePresence: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch user profile and wallet data
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch wallet data - use any to bypass TypeScript errors since the types are not updated yet
      let walletData: Wallet | null = null;
      
      try {
        // Try to fetch existing wallet using maybeSingle() instead of single()
        const { data, error } = await supabase
          .from('wallets' as any)
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) throw error;

        if (!data) {
          // Wallet doesn't exist yet, create one
          const { error: createWalletError } = await supabase.rpc('update_user_balance', {
            target_user_id: userId,
            amount_change: 100 // Initial balance
          });
          
          if (createWalletError) throw createWalletError;
          
          // Fetch the newly created wallet
          const { data: newWallet, error: newWalletError } = await supabase
            .from('wallets' as any)
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (newWalletError) throw newWalletError;
          // Explicitly cast the newWallet data to Wallet type
          walletData = newWallet as unknown as Wallet;
        } else {
          // Existing wallet found
          walletData = data as unknown as Wallet;
        }
      } catch (walletError) {
        console.error('Wallet fetch error:', walletError);
        logToDiscord(`Error fetching wallet: ${JSON.stringify(walletError)}`, 'error');
        // Set default wallet data
        walletData = {
          user_id: userId,
          balance: 0,
          level: 1,
          last_reward_claim: null
        };
      }

      // Get user email
      const { data: authUserData } = await supabase.auth.getUser();
      const userEmail = authUserData?.user?.email;

      const profile = profileData as UserProfile;
      
      // Convert string date to Date object if needed
      const lastRewardClaim = walletData?.last_reward_claim 
        ? new Date(walletData.last_reward_claim) 
        : null;
      
      const lastLeaderboardRewardClaim = walletData?.last_leaderboard_reward_claim 
        ? new Date(walletData.last_leaderboard_reward_claim) 
        : null;

      // Combine data into user object
      const userData: AuthUser = {
        id: userId,
        email: userEmail,
        username: profile.username,
        coins: walletData?.balance || 0,
        isAdmin: profile.is_admin || false,
        isOwner: profile.is_owner || false,
        lastRewardClaim: lastRewardClaim,
        lastLeaderboardRewardClaim: lastLeaderboardRewardClaim,
        level: walletData?.level || 1,
      };

      setUser(userData);
      logToDiscord(`User logged in: ${profile.username}`, 'info');
    } catch (error) {
      console.error('Error fetching user data:', error);
      logToDiscord(`Error fetching user data: ${JSON.stringify(error)}`, 'error');
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    const setupAuth = async () => {
      // Set up auth state listener first
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          setSession(currentSession);
          
          if (currentSession?.user) {
            // Use setTimeout to prevent potential deadlocks
            setTimeout(() => {
              fetchUserData(currentSession.user.id);
            }, 0);
          } else {
            setUser(null);
          }
        }
      );

      // Then check for existing session
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      
      if (data.session?.user) {
        await fetchUserData(data.session.user.id);
      }
      
      setLoading(false);
      
      return () => {
        subscription.unsubscribe();
      };
    };

    setupAuth();
  }, []);

  // Update user presence in active_users table using RPC
  const updatePresence = async () => {
    if (!user) return;

    try {
      // Use RPC function instead of direct table access
      const { error } = await supabase.rpc('insert_or_update_user_presence', {
        p_user_id: user.id,
        p_status: 'online'
      });

      if (error) {
        console.error('Error updating user presence with RPC:', error);
        logToDiscord(`Error updating user presence: ${error.message}`, 'error');
      }
      
      // Broadcast presence update to all clients
      const channel = supabase.channel('presence-updates');
      channel.send({
        type: 'broadcast',
        event: 'presence-update',
        payload: { user_id: user.id }
      });
      
    } catch (error: any) {
      console.error('Error updating user presence:', error);
      logToDiscord(`Error updating user presence: ${error.message}`, 'error');
    }
  };

  // Update presence periodically when user is logged in
  useEffect(() => {
    if (!user) return;

    updatePresence();
    const interval = setInterval(updatePresence, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({
        title: "Login successful!",
        description: "Welcome back to Yowx Mods!",
      });
      logToDiscord(`User login successful: ${email}`, 'info');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      logToDiscord(`Login failed: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;
      toast({
        title: "Account created!",
        description: "Welcome to Yowx Mods!",
      });
      logToDiscord(`New user signup: ${username} (${email})`, 'info');
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
      logToDiscord(`Signup failed: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        logToDiscord(`User logged out: ${user.username}`, 'info');
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error: any) {
      console.error('Logout failed:', error);
      logToDiscord(`Logout failed: ${error.message}`, 'error');
    }
  };

  const updateUserCoins = async (amount: number) => {
    if (!user) return;

    // Ensure amount is an integer
    const intAmount = Math.round(amount);

    try {
      // Using the balance update RPC function
      const { data, error } = await supabase.rpc('update_user_balance', {
        target_user_id: user.id,
        amount_change: intAmount
      });

      if (error) {
        console.error('Error in updateUserCoins:', error);
        logToDiscord(`Error updating balance via RPC: ${error.message}`, 'error');
        throw error;
      }

      // After successful update, refresh the wallet data
      const { data: updatedWallet, error: walletError } = await supabase
        .from('wallets' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) {
        console.error('Error fetching updated wallet:', walletError);
        logToDiscord(`Error fetching updated wallet: ${walletError.message}`, 'error');
        
        // Still update local state even if we can't fetch latest from DB
        setUser(prev => prev ? {
          ...prev,
          coins: prev.coins + intAmount
        } : null);
      } else if (updatedWallet) {
        // Update local user state with the freshly fetched wallet data
        const wallet = updatedWallet as unknown as Wallet;
        setUser(prev => prev ? {
          ...prev,
          coins: wallet.balance,
          level: wallet.level || prev.level
        } : null);
      }

      logToDiscord(`User ${user.username} coins updated: ${intAmount > 0 ? '+' : ''}${intAmount} coins`, 'info');
    } catch (error: any) {
      console.error('Error updating user balance:', error);
      logToDiscord(`Error updating user balance: ${error.message}`, 'error');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      login, 
      signup, 
      logout,
      updateUserCoins,
      updatePresence
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};