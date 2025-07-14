import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, Gift, ShoppingCart, RotateCw, Timer, Shield, Youtube, Bug } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AuthModal from '../Auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

// Define button animation variants
const buttonVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.3,
    },
  }),
  tap: {
    scale: 0.95,
  },
};

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const BUG_REPORT_WEBHOOK = "https://discord.com/api/webhooks/1375252347579531387/KsQQ5AHhd7IdHJYblJdSSXOTdpvRTRnT21hEqJK1f04vD3uvSkNMQy4-7YGDH2GKuhP5";

const SideMenu = ({ isOpen, onClose, onLoginClick, onSignupClick }: SideMenuProps) => {
  const [authType, setAuthType] = useState<'login' | 'signup' | null>(null);
  const [showBugReport, setShowBugReport] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const openAuth = (type: 'login' | 'signup') => {
    if (onLoginClick && type === 'login') {
      onLoginClick();
      onClose();
      return;
    }
    
    if (onSignupClick && type === 'signup') {
      onSignupClick();
      onClose();
      return;
    }
    
    setAuthType(type);
  };

  const closeAuth = () => {
    setAuthType(null);
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleBugReport = async () => {
    if (!user || !bugDescription.trim()) return;

    setIsSubmitting(true);
    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('bug_reports')
        .insert({
          user_id: user.id,
          message: bugDescription
        });

      if (dbError) throw dbError;

      // Send to Discord webhook
      const payload = {
        username: "Bug Report Bot",
        embeds: [{
          title: "New Bug Report",
          description: bugDescription,
          color: 15158332, // Red
          fields: [
            {
              name: "Reported by",
              value: user.username,
              inline: true
            },
            {
              name: "User ID",
              value: user.id,
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      const response = await fetch(BUG_REPORT_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to send to Discord');

      toast({
        title: "Bug report submitted",
        description: "Thank you for helping us improve!",
      });

      setBugDescription('');
      setShowBugReport(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: "Error",
        description: "Failed to submit bug report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-menu z-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed top-0 right-0 w-full md:w-80 h-full bg-gradient-to-b from-sonic-dark via-sonic-blue/20 to-sonic-darker border-l border-sonic-blue/30 z-50 p-6 flex flex-col backdrop-blur-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center mb-8">
              <motion.h2 
                className="text-xl font-semibold text-sonic-blue sonic-glow"
                animate={{ 
                  textShadow: [
                    "0 0 5px #0096ff", 
                    "0 0 20px #0096ff", 
                    "0 0 5px #0096ff"
                  ] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Menu
              </motion.h2>
              <motion.button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-sonic-gray transition-colors"
                whileTap={{ scale: 0.9, rotate: -90 }}
                whileHover={{ rotate: -15 }}
              >
                <X className="text-sonic-blue" size={24} />
              </motion.button>
            </div>

            <div className="flex flex-col space-y-5">
              {!user ? (
                <>
                  <motion.button 
                    onClick={() => openAuth('login')}
                    className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                    variants={buttonVariants}
                    custom={0}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <LogIn className="mr-3 text-sonic-blue" size={20} />
                    <span className="text-sonic-blue group-hover:text-white transition-all duration-200">Login</span>
                  </motion.button>
                  
                  <motion.button 
                    onClick={() => openAuth('signup')}
                    className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                    variants={buttonVariants}
                    custom={1}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <UserPlus className="mr-3 text-sonic-blue" size={20} />
                    <span className="text-sonic-blue group-hover:text-white transition-all duration-200">Sign Up</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button 
                    onClick={() => handleNavigate('/free-key')}
                    className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                    variants={buttonVariants}
                    custom={0}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <Gift className="mr-3 text-sonic-blue" size={20} />
                    <span className="text-sonic-blue group-hover:text-white transition-all duration-200">Free Key</span>
                  </motion.button>
                  
                  <motion.button 
                    onClick={() => handleNavigate('/shop')}
                    className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                    variants={buttonVariants}
                    custom={1}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <ShoppingCart className="mr-3 text-sonic-blue" size={20} />
                    <span className="text-sonic-blue group-hover:text-white transition-all duration-200">Shop</span>
                  </motion.button>

                  <motion.button 
                    onClick={() => handleNavigate('/spin')}
                    className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                    variants={buttonVariants}
                    custom={2}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <RotateCw className="mr-3 text-sonic-blue" size={20} />
                    <span className="text-sonic-blue group-hover:text-white transition-all duration-200">Spin Wheel</span>
                  </motion.button>

                  <motion.button 
                    onClick={() => handleNavigate('/afk-farm')}
                    className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                    variants={buttonVariants}
                    custom={3}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <Timer className="mr-3 text-sonic-blue" size={20} />
                    <span className="text-sonic-blue group-hover:text-white transition-all duration-200">AFK Farm</span>
                  </motion.button>

                  <motion.button 
                    onClick={() => setShowBugReport(true)}
                    className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                    variants={buttonVariants}
                    custom={4}
                    initial="initial"
                    animate="animate"
                    whileTap="tap"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <Bug className="mr-3 text-sonic-blue" size={20} />
                    <span className="text-sonic-blue group-hover:text-white transition-all duration-200">Report Bug</span>
                  </motion.button>
                  
                  {user.isOwner && (
                    <motion.button 
                      onClick={() => handleNavigate('/admin')}
                      className="flex items-center p-3 rounded-md hover:bg-sonic-gray transition-all duration-200 border border-sonic-blue/50 hover:border-sonic-blue group backdrop-blur-sm glow-border"
                      variants={buttonVariants}
                      custom={5}
                      initial="initial"
                      animate="animate"
                      whileTap="tap"
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <Shield className="mr-3 text-sonic-blue" size={20} />
                      <span className="text-sonic-blue group-hover:text-white transition-all duration-200">Owner Panel</span>
                    </motion.button>
                  )}
                </>
              )}
            </div>

            <div className="mt-auto space-y-4">
              <motion.button
                onClick={() => openExternalLink('https://chat.whatsapp.com/KteLnsPOMEKIJw3I1phViP')}
                className="w-full p-3 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium flex justify-center items-center gap-3 transition-all backdrop-blur-sm glow-border"
                variants={buttonVariants}
                custom={user ? 5 : 2}
                initial="initial"
                animate="animate"
                whileTap="tap"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="20" 
                  height="20" 
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </motion.button>
              
              <motion.button
                onClick={() => openExternalLink('https://discord.gg/aJaKPWr42x')}
                className="w-full p-3 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex justify-center items-center gap-3 transition-all backdrop-blur-sm glow-border"
                variants={buttonVariants}
                custom={user ? 6 : 3}
                initial="initial"
                animate="animate"
                whileTap="tap"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="20" 
                  height="20" 
                  fill="currentColor"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                </svg>
                Discord
              </motion.button>
              
              <motion.button
                onClick={() => openExternalLink('https://www.youtube.com/@yowxmods')}
                className="w-full p-3 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium flex justify-center items-center gap-3 transition-all backdrop-blur-sm glow-border"
                variants={buttonVariants}
                custom={user ? 7 : 4}
                initial="initial"
                animate="animate"
                whileTap="tap"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Youtube size={20} />
                YouTube Channel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {authType !== null && !onLoginClick && !onSignupClick && (
        <AuthModal isOpen={authType !== null} onClose={closeAuth} type={authType || 'login'} />
      )}

      <Dialog open={showBugReport} onOpenChange={setShowBugReport}>
        <DialogContent className="bg-sonic-dark border-sonic-blue/20">
          <DialogHeader>
            <DialogTitle className="text-sonic-blue">Report a Bug</DialogTitle>
            <DialogDescription>
              Describe the issue you've encountered and we'll look into it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Describe the bug in detail..."
              className="h-32 bg-sonic-gray border-sonic-blue/30"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBugReport(false)}
                className="border-sonic-blue text-sonic-blue hover:bg-sonic-blue/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBugReport}
                disabled={isSubmitting || !bugDescription.trim()}
                className="bg-sonic-blue hover:bg-sonic-darkBlue text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SideMenu;