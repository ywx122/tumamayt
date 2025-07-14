import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import WalletDisplay from "./WalletDisplay";
import RewardLinks from "../Rewards/RewardLinks";
import SpinWheel from "../SpinWheel/SpinWheel";
import Shop from "../Shop/Shop";
import AfkFarm from "../AFK/AfkFarm";
import Leaderboard from "../Leaderboard/Leaderboard";
import PromoCodeForm from "../PromoCode/PromoCodeForm";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface DashboardProps {
  activeTab?: 'rewards' | 'spin' | 'shop' | 'afk' | 'leaderboard';
}

const Dashboard = ({ activeTab = 'rewards' }: DashboardProps) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'rewards' | 'spin' | 'shop' | 'afk' | 'leaderboard'>(activeTab);
  
  // Update tab when activeTab prop changes
  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);
  
  const paymentMethods = [
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
  ];

  const handlePaymentClick = () => {
    window.open('https://t.me/yowxios', '_blank');
  };
  
  if (!user) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-spdm-green mb-4 glow-text">Please Login to Access Dashboard</h2>
          <p className="text-gray-400">Create an account or login to access exclusive features.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-spdm-green relative inline-block"
            animate={{ 
              textShadow: [
                "0 0 10px #0096ff, 0 0 20px #0096ff, 0 0 30px #0096ff",
                "0 0 20px #0096ff, 0 0 30px #0096ff, 0 0 40px #0096ff",
                "0 0 10px #0096ff, 0 0 20px #0096ff, 0 0 30px #0096ff"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
            Dashboard
          </motion.h1>
          <motion.div
            className="h-1 w-32 bg-gradient-to-r from-transparent via-spdm-green to-transparent mx-auto mt-2"
            animate={{
              boxShadow: [
                "0 0 5px #0096ff",
                "0 0 20px #0096ff, 0 0 30px #0096ff",
                "0 0 5px #0096ff"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="md:col-span-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <WalletDisplay />
          </motion.div>
          <motion.div 
            className="md:col-span-1"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <PromoCodeForm />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex overflow-x-auto pb-2 space-x-3 bg-spdm-dark/30 rounded-xl p-2 backdrop-blur-sm border border-spdm-green/20">
            <TabButton 
              active={currentTab === 'rewards'} 
              onClick={() => setCurrentTab('rewards')}
              label="Free Coins"
              index={0}
            />
            <TabButton 
              active={currentTab === 'spin'} 
              onClick={() => setCurrentTab('spin')}
              label="Spin Wheel"
              index={1}
            />
            <TabButton 
              active={currentTab === 'shop'} 
              onClick={() => setCurrentTab('shop')}
              label="Shop"
              index={2}
            />
            <TabButton 
              active={currentTab === 'afk'} 
              onClick={() => setCurrentTab('afk')}
              label="AFK Farm"
              index={3}
            />
            <TabButton 
              active={currentTab === 'leaderboard'} 
              onClick={() => setCurrentTab('leaderboard')}
              label="Leaderboard"
              index={4}
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-6"
          key={currentTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          {currentTab === 'rewards' && <RewardLinks />}
          {currentTab === 'spin' && <SpinWheel />}
          {currentTab === 'shop' && <Shop />}
          {currentTab === 'afk' && <AfkFarm />}
          {currentTab === 'leaderboard' && <Leaderboard />}
        </motion.div>

        {/* Payment Methods Section */}
        <motion.div 
          className="mt-12 bg-gradient-to-br from-spdm-dark via-spdm-gray/50 to-spdm-dark rounded-xl p-6 border border-spdm-green/30 relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            boxShadow: "0 0 20px rgba(0, 150, 255, 0.1), inset 0 0 20px rgba(0, 150, 255, 0.05)"
          }}
        >
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-spdm-green/5 via-transparent to-spdm-blue/5"
            animate={{
              background: [
                "linear-gradient(45deg, rgba(0, 150, 255, 0.05) 0%, transparent 50%, rgba(0, 150, 255, 0.05) 100%)",
                "linear-gradient(45deg, transparent 0%, rgba(0, 150, 255, 0.1) 50%, transparent 100%)",
                "linear-gradient(45deg, rgba(0, 150, 255, 0.05) 0%, transparent 50%, rgba(0, 150, 255, 0.05) 100%)"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 relative z-10"
          >
            <motion.h2 
              className="text-2xl font-bold text-spdm-green mb-4"
              animate={{
                textShadow: [
                  "0 0 10px rgba(0, 150, 255, 0.5)",
                  "0 0 20px rgba(0, 150, 255, 0.8)",
                  "0 0 10px rgba(0, 150, 255, 0.5)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Payment Methods
            </motion.h2>
            <p className="text-gray-400">Choose your preferred payment method to purchase coins</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(0, 150, 255, 0.4)",
                  borderColor: "rgba(0, 150, 255, 0.6)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePaymentClick}
                className="bg-gradient-to-br from-spdm-gray to-spdm-dark rounded-lg p-4 border border-spdm-green/20 transition-all cursor-pointer backdrop-blur-sm"
                style={{
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                }}
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
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-center relative z-10"
          >
            <p className="text-gray-400 mb-4">
              Need help with payment? Contact our support team
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open('https://discord.gg/aJaKPWr42x', '_blank')}
              className="px-6 py-3 bg-transparent hover:bg-spdm-green/10 border-2 border-spdm-green text-spdm-green font-semibold rounded-full transition-all relative overflow-hidden group"
              style={{
                boxShadow: "0 0 20px rgba(0, 150, 255, 0.3)"
              }}
            >
              <motion.div
                className="absolute inset-0 bg-spdm-green/10 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              Contact Support
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  index: number;
}

const TabButton = ({ active, onClick, label, index }: TabButtonProps) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
    whileHover={{ 
      scale: 1.05,
      boxShadow: active 
        ? "0 0 25px rgba(0, 150, 255, 0.6)" 
        : "0 0 15px rgba(0, 150, 255, 0.3)"
    }}
    whileTap={{ scale: 0.95 }}
    className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all relative overflow-hidden ${
      active 
        ? 'bg-gradient-to-r from-spdm-green to-spdm-blue text-black font-bold' 
        : 'bg-gradient-to-r from-spdm-gray to-spdm-dark text-gray-300 hover:text-spdm-green border border-spdm-green/20'
    }`}
    style={active ? {
      boxShadow: "0 0 20px rgba(0, 150, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
    } : {}}
  >
    {active && (
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    )}
    <motion.span
      className="relative z-10"
      animate={active ? {
        textShadow: ["0 0 5px rgba(0, 0, 0, 0.5)", "0 0 10px rgba(0, 0, 0, 0.3)", "0 0 5px rgba(0, 0, 0, 0.5)"]
      } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
    {label}
    </motion.span>
  </motion.button>
);

export default Dashboard;