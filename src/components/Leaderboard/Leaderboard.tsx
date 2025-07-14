import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCoins } from '@/hooks/useCoins';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  coins: number;
  position: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const { user } = useAuth();
  const { addCoins } = useCoins();
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'wallets' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Use RPC function to get leaderboard data with proper joins
      const { data: walletsData, error: walletsError } = await supabase.rpc('get_leaderboard_data');

      if (walletsError) throw walletsError;

      if (walletsData) {
        const formattedData = walletsData.map((entry, index) => ({
          user_id: entry.user_id,
          username: entry.username || 'Unknown',
          coins: entry.balance,
          position: index + 1
        }));
        setLeaderboard(formattedData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimPositionReward = async () => {
    if (!user || hasClaimedReward) return;

    // Check if 7 days have passed since last leaderboard reward claim
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    if (user.lastLeaderboardRewardClaim && user.lastLeaderboardRewardClaim > sevenDaysAgo) {
      const nextClaimDate = new Date(user.lastLeaderboardRewardClaim.getTime() + 7 * 24 * 60 * 60 * 1000);
      toast({
        title: "Reward Already Claimed",
        description: `You can claim your next leaderboard reward on ${nextClaimDate.toLocaleDateString()}`,
        variant: "destructive",
      });
      return;
    }

    const userPosition = leaderboard.find(entry => entry.user_id === user.id);
    if (!userPosition) return;

    let rewardAmount = 0;
    if (userPosition.position === 1) rewardAmount = 100;
    else if (userPosition.position === 2) rewardAmount = 50;
    else if (userPosition.position === 3) rewardAmount = 25;

    if (rewardAmount > 0) {
      try {
        await addCoins(rewardAmount, `Top ${userPosition.position} Leaderboard Reward`);
        
        // Update last leaderboard reward claim timestamp
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ last_leaderboard_reward_claim: now.toISOString() })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        
        setHasClaimedReward(true);
        
        toast({
          title: "Reward Claimed!",
          description: `You received ${rewardAmount} coins for being #${userPosition.position} on the leaderboard! Next reward available in 7 days.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to claim reward. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Check if user can claim reward (7 days cooldown)
  const canClaimReward = () => {
    if (!user || !userPosition || userPosition.position > 3) return false;
    
    if (hasClaimedReward) return false;
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return !user.lastLeaderboardRewardClaim || user.lastLeaderboardRewardClaim <= sevenDaysAgo;
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-5 h-5 text-spdm-green" />;
    }
  };

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-600/20 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-800/20 border-amber-600/30';
      default:
        return 'bg-spdm-gray/50 border-spdm-green/20';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-spdm-green"></div>
      </div>
    );
  }

  const userPosition = user ? leaderboard.find(entry => entry.user_id === user.id) : null;

  return (
    <div className="space-y-6">
      <div className="bg-spdm-gray rounded-lg p-6 border border-spdm-green/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-spdm-green">🏆 Top Players</h2>
          <div className="text-sm text-gray-400">
            Updates in real-time • Min 10 coins to appear
          </div>
        </div>

        {/* Reward Info */}
        <div className="bg-spdm-dark rounded-lg p-4 mb-6 border border-spdm-green/30">
          <h3 className="text-lg font-semibold text-spdm-green mb-3">🎁 Position Rewards</h3>
          <p className="text-sm text-gray-400 mb-3">Rewards can be claimed once every 7 days</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <Crown className="w-8 h-8 text-yellow-400 mb-2" />
              <span className="text-yellow-400 font-bold">1st Place</span>
              <span className="text-white">100 coins</span>
            </div>
            <div className="flex flex-col items-center">
              <Trophy className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-400 font-bold">2nd Place</span>
              <span className="text-white">50 coins</span>
            </div>
            <div className="flex flex-col items-center">
              <Medal className="w-8 h-8 text-amber-600 mb-2" />
              <span className="text-amber-600 font-bold">3rd Place</span>
              <span className="text-white">25 coins</span>
            </div>
          </div>
        </div>

        {/* User's Position */}
        {userPosition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-4 border ${getPositionColor(userPosition.position)}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {getPositionIcon(userPosition.position)}
                <div>
                  <span className="text-spdm-green font-bold">Your Position: #{userPosition.position}</span>
                  <div className="text-white font-semibold">{userPosition.coins.toLocaleString()} coins</div>
                </div>
              </div>
              {canClaimReward() && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={claimPositionReward}
                  className="px-4 py-2 bg-spdm-green hover:bg-spdm-darkGreen text-black font-medium rounded-lg"
                >
                  Claim Reward
                </motion.button>
              )}
              {user?.lastLeaderboardRewardClaim && !canClaimReward() && userPosition.position <= 3 && (
                <div className="text-sm text-gray-400">
                  Next reward: {new Date(user.lastLeaderboardRewardClaim.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No players with 10+ coins yet</p>
              <p className="text-sm">Be the first to reach 10 coins!</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${getPositionColor(entry.position)} ${
                  user?.id === entry.user_id ? 'ring-2 ring-spdm-green' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getPositionIcon(entry.position)}
                      <span className="text-2xl font-bold text-white">#{entry.position}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white text-lg">
                        {entry.username}
                        {user?.id === entry.user_id && (
                          <span className="ml-2 text-sm text-spdm-green">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-spdm-green">
                      {entry.coins.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">coins</div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;