
import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, TrendingUp, Star } from "lucide-react";

const WalletDisplay = () => {
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastBalance, setLastBalance] = useState<number | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  
  // Detect balance changes for animations
  useEffect(() => {
    if (user && lastBalance !== null && user.coins !== lastBalance) {
      setIsAnimating(true);
      setShowParticles(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowParticles(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    if (user) {
      setLastBalance(user.coins);
    }
  }, [user?.coins]);
  
  if (!user) return null;
  
  return (
    <motion.div
      className="bg-gradient-to-br from-spdm-dark via-spdm-gray to-spdm-dark border border-spdm-green/40 rounded-xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden backdrop-blur-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 0 30px rgba(0, 150, 255, 0.4), inset 0 0 20px rgba(0, 150, 255, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-spdm-green/10 via-spdm-blue/10 to-spdm-green/10"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(0, 150, 255, 0.1) 0%, rgba(0, 200, 255, 0.05) 50%, rgba(0, 150, 255, 0.1) 100%)",
            "linear-gradient(45deg, rgba(0, 200, 255, 0.05) 0%, rgba(0, 150, 255, 0.15) 50%, rgba(0, 200, 255, 0.05) 100%)",
            "linear-gradient(45deg, rgba(0, 150, 255, 0.1) 0%, rgba(0, 200, 255, 0.05) 50%, rgba(0, 150, 255, 0.1) 100%)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Particle effects */}
      <AnimatePresence>
        {showParticles && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-spdm-green rounded-full"
                initial={{ 
                  x: 100, 
                  y: 20, 
                  opacity: 1,
                  scale: 0
                }}
                animate={{ 
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 100 - 50,
                  opacity: 0,
                  scale: [0, 1, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 1,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      
      <div className="flex items-center space-x-3">
        <motion.div 
          className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-spdm-green/30 to-spdm-blue/30 relative"
          animate={isAnimating ? { 
            rotate: 360,
            scale: [1, 1.2, 1]
          } : {
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            rotate: isAnimating ? { duration: 0.5 } : { duration: 4, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 0.5 }
          }}
          style={{
            boxShadow: "0 0 20px rgba(0, 150, 255, 0.4), inset 0 0 20px rgba(0, 150, 255, 0.2)"
          }}
        >
          <motion.div
            animate={{
              textShadow: [
                "0 0 10px rgba(0, 150, 255, 0.8)",
                "0 0 20px rgba(0, 150, 255, 1)",
                "0 0 10px rgba(0, 150, 255, 0.8)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Coins className="w-8 h-8 text-spdm-green" />
          </motion.div>
          
          {/* Floating stars around the coin icon */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ 
              rotate: 360,
              scale: [1, 1.3, 1]
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Star className="w-3 h-3 text-yellow-400" />
          </motion.div>
        </motion.div>
        
        <div>
          <motion.p 
            className="text-sm text-gray-400 font-medium"
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            💰 Wallet Balance
          </motion.p>
          <div className="flex items-center">
            <AnimatePresence mode="popLayout">
              <motion.span 
                key={user.coins}
                initial={{ y: -30, opacity: 0, scale: 0.5 }}
                animate={{ 
                  y: 0, 
                  opacity: 1, 
                  scale: 1,
                  textShadow: [
                    "0 0 10px rgba(0, 150, 255, 0.8)",
                    "0 0 20px rgba(0, 150, 255, 1)",
                    "0 0 10px rgba(0, 150, 255, 0.8)"
                  ]
                }}
                exit={{ y: 30, opacity: 0, scale: 0.5 }}
                transition={{ 
                  duration: 0.5,
                  textShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="text-2xl font-bold text-spdm-green mr-2"
              >
                {user.coins}
              </motion.span>
            </AnimatePresence>
            <motion.span 
              className="text-white font-medium"
              animate={{
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              coins
            </motion.span>
            
            {isAnimating && (
              <motion.div
                className="ml-2"
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1.2, 1], rotate: 360 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.6 }}
              >
                <TrendingUp className="w-5 h-5 text-green-400" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        <motion.div 
          className="px-4 py-2 rounded-full bg-gradient-to-r from-spdm-green/20 to-spdm-blue/20 text-spdm-green text-sm font-bold border border-spdm-green/40 relative overflow-hidden"
          animate={{
            boxShadow: [
              "0 0 10px rgba(0, 150, 255, 0.3)",
              "0 0 20px rgba(0, 150, 255, 0.6)",
              "0 0 10px rgba(0, 150, 255, 0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-spdm-green/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative z-10">✨ Active</span>
        </motion.div>
        
        {user.level !== undefined && (
          <motion.div 
            className="mt-3 text-sm text-gray-400 flex items-center gap-1"
            animate={{
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span>Level</span>
            <motion.span 
              className="text-spdm-green font-bold"
              animate={{
                textShadow: [
                  "0 0 5px rgba(0, 150, 255, 0.5)",
                  "0 0 15px rgba(0, 150, 255, 0.8)",
                  "0 0 5px rgba(0, 150, 255, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {user.level}
            </motion.span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default WalletDisplay;
