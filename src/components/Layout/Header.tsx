import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, Users, ChevronDown, LogOut, Settings, Shield } from 'lucide-react';
import SideMenu from './Menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { SettingsDialog } from '@/components/Settings/SettingsDialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OnlineUser {
  user_id: string;
  username: string;
  last_active: string;
  status: string;
}

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Header = ({ onLoginClick, onSignupClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [fakeUserCount, setFakeUserCount] = useState(0);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Load fake user count
  useEffect(() => {
    const loadFakeUserCount = async () => {
      try {
        const { data, error } = await supabase
          .from('fake_users_config')
          .select('fake_count')
          .eq('id', 1)
          .maybeSingle();
        
        if (!error && data) {
          setFakeUserCount(data.fake_count || 0);
        }
      } catch (error) {
        console.error('Error loading fake user count:', error);
      }
    };
    
    loadFakeUserCount();
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const { data: activeUsers, error: activeUsersError } = await supabase.rpc('get_active_user_ids');
        
        if (activeUsersError) throw activeUsersError;
        
        if (Array.isArray(activeUsers) && activeUsers.length > 0) {
          // Extract user_ids from the activeUsers array
          const userIds = activeUsers.map(user => user.user_id);
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);
          
          if (profilesError) throw profilesError;

          if (profilesData) {
            const formattedUsers = profilesData.map(item => ({
              user_id: item.id,
              username: item.username,
              last_active: new Date().toISOString(),
              status: 'online'
            }));

            setOnlineUsers(formattedUsers);
          }
        } else {
          setOnlineUsers([]);
        }
      } catch (error) {
        console.error("Error fetching online users:", error);
      }
    };

    fetchOnlineUsers();
    
    const channel = supabase
      .channel('presence-updates')
      .on('broadcast', { event: 'presence-update' }, () => {
        fetchOnlineUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalOnlineUsers = onlineUsers.length + fakeUserCount;
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="flex items-center">
        <motion.div 
          className="text-xl md:text-2xl font-bold tracking-wider text-sonic-blue sonic-glow"
          animate={{ 
            textShadow: [
              "0 0 5px #0096ff", 
              "0 0 20px #0096ff", 
              "0 0 5px #0096ff"
            ] 
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          SONIC
        </motion.div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4">
        {!user && onLoginClick && onSignupClick && (
          <div className="hidden sm:flex items-center gap-3">
            <motion.button
              onClick={onLoginClick}
              className="px-4 py-2 text-sm rounded-full border border-sonic-blue text-sonic-blue hover:bg-sonic-blue/10 transition-all glow-border"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              Login
            </motion.button>
            <motion.button
              onClick={onSignupClick}
              className="px-4 py-2 text-sm rounded-full bg-sonic-blue text-white font-medium hover:bg-sonic-darkBlue transition-all glow-border"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              Sign Up
            </motion.button>
          </div>
        )}

        {user && (
          <motion.div 
            className="hidden sm:flex items-center bg-sonic-gray/60 border border-sonic-blue/30 rounded-full px-3 py-1.5 glow-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-sonic-blue/20 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-sonic-blue">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <span className="text-sm text-sonic-blue font-medium">{formatNumber(user.coins)} coins</span>
          </motion.div>
        )}
        
        {user && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button 
                onClick={() => setShowOnlineUsers(!showOnlineUsers)} 
                className="relative flex items-center justify-center p-2 rounded-full hover:bg-sonic-gray transition-all duration-200"
                whileTap={{ scale: 0.9 }}
              >
                <Users size={20} className="text-sonic-blue" />
                <motion.span 
                  className="absolute -top-1 -right-1 bg-sonic-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {formatNumber(totalOnlineUsers)}
                </motion.span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Online Users</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {showOnlineUsers && (
          <div className="absolute top-16 right-20 bg-sonic-dark border border-sonic-blue/30 rounded-lg shadow-lg p-3 min-w-[200px] max-h-[300px] overflow-y-auto animate-fade-in z-50 glow-border">
            <h3 className="text-sm font-medium text-sonic-blue mb-2">Online Users ({formatNumber(totalOnlineUsers)})</h3>
            <div className="space-y-2">
              {onlineUsers.length > 0 ? (
                onlineUsers.map(user => (
                  <div key={user.user_id} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-sonic-blue"></div>
                    <span className="text-sm text-gray-300">{user.username}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No one is online</p>
              )}
              {fakeUserCount > 0 && (
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <p className="text-xs text-gray-500">+ {formatNumber(fakeUserCount)} other users</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sonic-gray/50 border border-sonic-blue/20 hover:bg-sonic-gray transition-all duration-200 cursor-pointer glow-border"
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sonic-blue/20">
                  <User size={16} className="text-sonic-blue" />
                </div>
                <span className="text-sm text-gray-200 hidden md:inline">{user.username}</span>
                <ChevronDown size={16} className="text-gray-400" />
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-sonic-dark border border-sonic-blue/30 text-white min-w-[180px] animate-fade-in">
              <DropdownMenuLabel className="text-gray-400">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sonic-blue/20" />
              <DropdownMenuItem 
                className="hover:bg-sonic-blue/20 focus:bg-sonic-blue/20 active:scale-98 transition-all cursor-pointer"
                onClick={() => setShowSettings(true)}
              >
                <Settings size={16} className="mr-2 text-sonic-blue" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              {user.isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-sonic-blue/20" />
                  <DropdownMenuItem 
                    className="hover:bg-sonic-blue/20 focus:bg-sonic-blue/20 active:scale-98 transition-all cursor-pointer"
                    onClick={() => navigate('/admin')}
                  >
                    <Shield size={16} className="mr-2 text-sonic-blue" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                </>
              )}
              
              <DropdownMenuSeparator className="bg-sonic-blue/20" />
              <DropdownMenuItem 
                className="hover:bg-red-500/20 focus:bg-red-500/20 active:scale-98 transition-all cursor-pointer" 
                onClick={logout}
              >
                <LogOut size={16} className="mr-2 text-red-400" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        
        <motion.button 
          onClick={toggleMenu}
          className="flex items-center justify-center p-2 rounded-md hover:bg-sonic-gray transition-all duration-200"
          whileTap={{ scale: 0.9 }}
          aria-label="Toggle menu"
        >
          <Menu size={24} className="text-sonic-blue" />
        </motion.button>
      </div>

      <SideMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        onLoginClick={onLoginClick} 
        onSignupClick={onSignupClick}
      />

      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </header>
  );
};

export default Header;