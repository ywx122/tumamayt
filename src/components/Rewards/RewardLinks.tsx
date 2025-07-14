
import { useState, useEffect } from 'react';
import { useCoins } from '@/hooks/useCoins';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface RewardLink {
  id: number;
  name: string;
  url: string;
  coins: number;
  claimed: boolean;
}

const RewardLinks = () => {
  const { user } = useAuth();
  const { addCoins } = useCoins({ dailyLimit: 15 });
  const { toast } = useToast();
  const [links, setLinks] = useState<RewardLink[]>([
    { id: 1, name: "Reward 1", url: "https://direct-link.net/1351367/reward-1", coins: 5, claimed: false },
    { id: 2, name: "Reward 2", url: "https://link-hub.net/1351367/reward-2", coins: 5, claimed: false },
    { id: 3, name: "Reward 3", url: "https://link-center.net/1351367/reward-3", coins: 5, claimed: false },
  ]);
  const [isAway, setIsAway] = useState(false);
  const [awayStartTime, setAwayStartTime] = useState<Date | null>(null);
  const [activeReward, setActiveReward] = useState<number | null>(null);
  const [totalClaimedToday, setTotalClaimedToday] = useState(0);
  
  // Track if the user has navigated away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeReward !== null) {
        setIsAway(true);
        setAwayStartTime(new Date());
      } else {
        if (isAway && awayStartTime && activeReward !== null) {
          const awaySeconds = Math.floor((new Date().getTime() - awayStartTime.getTime()) / 1000);
          
          if (awaySeconds >= 30) {
            // User was away for at least 30 seconds
            handleClaimReward();
          } else {
            toast({
              title: "Not enough time",
              description: `You need to stay on the reward page for at least 30 seconds (${30 - awaySeconds} more seconds needed)`,
              variant: "destructive",
            });
          }
          
          setIsAway(false);
          setAwayStartTime(null);
          setActiveReward(null);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAway, awayStartTime, activeReward]);
  
  // Reset the claimed status at midnight
  useEffect(() => {
    const resetClaimed = () => {
      setLinks(prevLinks => prevLinks.map(link => ({ ...link, claimed: false })));
      setTotalClaimedToday(0);
    };
    
    // Check local storage for last claim date
    const checkAndResetDaily = () => {
      const lastResetDate = localStorage.getItem('lastRewardReset');
      const now = new Date();
      const today = now.toDateString();
      
      if (!lastResetDate || lastResetDate !== today) {
        resetClaimed();
        localStorage.setItem('lastRewardReset', today);
      }
    };
    
    checkAndResetDaily();
    
    // Set up daily check
    const interval = setInterval(checkAndResetDaily, 1000 * 60 * 60); // Check every hour
    
    return () => clearInterval(interval);
  }, []);
  
  const handleOpenLink = (id: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to claim rewards",
        variant: "destructive",
      });
      return;
    }
    
    const link = links.find(link => link.id === id);
    if (!link) return;
    
    if (link.claimed) {
      toast({
        title: "Already claimed",
        description: "You've already claimed this reward today",
        variant: "destructive",
      });
      return;
    }
    
    if (totalClaimedToday >= 15) {
      toast({
        title: "Daily limit reached",
        description: "You've reached the daily limit of 15 coins from rewards",
        variant: "destructive",
      });
      return;
    }
    
    // Open link in new tab
    window.open(link.url, "_blank");
    setActiveReward(id);
  };
  
  const handleClaimReward = async () => {
    if (activeReward === null) return;
    
    const linkIndex = links.findIndex(link => link.id === activeReward);
    if (linkIndex === -1) return;
    
    const link = links[linkIndex];
    
    // Update link claimed status
    const newLinks = [...links];
    newLinks[linkIndex] = { ...link, claimed: true };
    setLinks(newLinks);
    
    // Add coins to user balance
    const success = await addCoins(link.coins, `${link.name} reward`);
    
    if (success) {
      setTotalClaimedToday(prev => prev + link.coins);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-spdm-gray rounded-lg p-5 border border-spdm-green/20">
        <h2 className="text-xl font-semibold text-spdm-green mb-4">Free Daily Coins</h2>
        <p className="text-gray-400 mb-6">
          Visit these links to earn coins! You need to keep the page open for at least 30 seconds.
          <br />
          <span className="text-spdm-green font-medium">Daily limit: {totalClaimedToday}/15 coins</span>
        </p>
        
        <div className="space-y-4">
          {links.map((link) => (
            <div 
              key={link.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-spdm-dark border border-spdm-blue/20 hover:border-spdm-blue/50 transition-all"
            >
              <div>
                <h3 className="font-medium text-white">{link.name}</h3>
                <p className="text-sm text-gray-400">Earn {link.coins} coins</p>
              </div>
              <div className="mt-3 sm:mt-0">
                <Button
                  onClick={() => handleOpenLink(link.id)}
                  disabled={link.claimed || totalClaimedToday >= 15}
                  className={`${
                    link.claimed 
                      ? 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed' 
                      : 'bg-spdm-blue hover:bg-blue-700'
                  } text-black`}
                >
                  {link.claimed ? "Claimed" : "Claim Reward"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Payment Methods Section */}
        <div className="mt-8 bg-spdm-dark rounded-lg p-6 border border-spdm-blue/20">
          <h3 className="text-lg font-semibold text-spdm-blue mb-4">Payment Methods</h3>
          <p className="text-gray-400 mb-6">Choose your preferred payment method to purchase coins</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                name: "PayPal",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png",
                description: "Fast and secure international payments"
              },
              {
                name: "Zelle",
                logo: "https://logodownload.org/wp-content/uploads/2022/03/zelle-logo-1.png",
                description: "Instant bank transfers (US only)"
              },
              {
                name: "Cash App",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Square_Cash_app_logo.svg/1200px-Square_Cash_app_logo.svg.png",
                description: "Quick and easy mobile payments"
              },
              {
                name: "BBVA México",
                logo: "https://brandemia.org/contenido/subidas/2019/04/logo-bbva-960x640.jpg",
                description: "Direct bank transfers in Mexico"
              },
              {
                name: "Oxxo",
                logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Oxxo_Logo.svg/2560px-Oxxo_Logo.svg.png",
                description: "Cash payments at any Oxxo store"
              },
              {
                name: "Free Fire Account",
                logo: "https://cdn.pixabay.com/photo/2021/08/31/18/28/garena-free-fire-6589783_1280.png",
                description: "Trade with Free Fire accounts"
              }
            ].map((method, index) => (
              <div
                key={method.name}
                onClick={() => window.open('https://t.me/yowxios', '_blank')}
                className="bg-spdm-gray rounded-lg p-4 border border-spdm-blue/20 hover:border-spdm-blue/50 transition-all cursor-pointer"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 flex items-center justify-center">
                    <img 
                      src={method.logo} 
                      alt={method.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center">
                    {method.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 mb-4">
              Need help with payment? Contact our support team
            </p>
            <button
              onClick={() => window.open('https://discord.gg/aJaKPWr42x', '_blank')}
              className="px-6 py-2 bg-transparent hover:bg-spdm-blue/10 border-2 border-spdm-blue text-spdm-blue font-semibold rounded-full transition-all"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 rounded-lg bg-yellow-600/20 border border-yellow-600/30">
        <h3 className="text-yellow-400 font-medium mb-1">How it works</h3>
        <p className="text-sm text-gray-300">
          1. Click on a reward link to open it in a new tab<br />
          2. Stay on the reward page for at least 30 seconds<br />
          3. Return to this page to receive your coins<br />
          4. You can earn up to 15 coins per day from rewards
        </p>
      </div>
    </div>
  );
};

export default RewardLinks;
