import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PromoCodeManager from '@/components/Admin/PromoCodeManager';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from 'framer-motion';
import { 
  Users, 
  Coins, 
  Shield, 
  Ban, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Crown,
  Settings,
  Eye,
  UserPlus,
  Minus,
  Plus
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  is_banned: boolean;
  is_admin: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [balanceChange, setBalanceChange] = useState<number>(0);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fakeUserCount, setFakeUserCount] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoins: 0,
    bannedUsers: 0,
    adminUsers: 0
  });

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
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

  const loadFakeUserCount = () => {
    const stored = localStorage.getItem('fake_user_count');
    if (stored) {
      setFakeUserCount(parseInt(stored, 10));
    }
  };

  const updateFakeUserCount = (count: number) => {
    const newCount = Math.max(0, count);
    setFakeUserCount(newCount);
    localStorage.setItem('fake_user_count', newCount.toString());
    
    // Update the fake users config in database
    supabase
      .from('fake_users_config')
      .upsert({ id: 1, fake_count: newCount })
      .then(() => {
        toast.success(`Fake users updated to ${formatNumber(newCount)}`);
      });
  };

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_owner')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !profile?.is_owner) {
      navigate('/');
      return;
    }

    setIsAdmin(profile.is_admin || false);
    setIsOwner(profile.is_owner || false);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');

      if (walletsError) throw walletsError;

      const { data: bannedUsers, error: bannedError } = await supabase
        .from('banned_users')
        .select('*');

      if (bannedError) throw bannedError;

      const combinedUsers = profiles.map(profile => ({
        id: profile.id,
        username: profile.username,
        email: profile.email || '',
        balance: wallets?.find(w => w.user_id === profile.id)?.balance || 0,
        is_banned: bannedUsers?.some(b => b.user_id === profile.id) || false,
        is_admin: profile.is_admin || false
      }));

      setUsers(combinedUsers);

      // Calculate stats
      const totalCoins = wallets?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;
      setStats({
        totalUsers: profiles.length,
        totalCoins,
        bannedUsers: bannedUsers?.length || 0,
        adminUsers: profiles.filter(p => p.is_admin).length
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleBalanceChange = async () => {
    if (!selectedUser || balanceChange === 0) return;

    // Check limits based on role
    if (!isOwner && Math.abs(balanceChange) > 500) {
      toast.error('Admins can only give/remove up to 500 coins at a time');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('update_user_balance', {
        target_user_id: selectedUser,
        amount_change: balanceChange
      });

      if (error) throw error;

      toast.success(`Balance ${balanceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(balanceChange)} coins`);
      fetchUsers();
      setSelectedUser('');
      setBalanceChange(0);
    } catch (error) {
      toast.error('Failed to update balance');
      console.error('Error updating balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyMessage = async () => {
    if (!isOwner) {
      toast.error('Only owners can send emergency messages');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('emergency_messages')
        .insert({
          message: emergencyMessage,
          target_user_id: targetUserId || null,
        });

      if (error) throw error;

      toast.success('Emergency message created successfully');
      setEmergencyMessage('');
      setTargetUserId('');
    } catch (error) {
      toast.error('Failed to create emergency message');
      console.error('Error creating emergency message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('banned_users')
        .insert({
          user_id: userId,
          banned_by: user.id,
          reason: banReason || 'No reason provided'
        });

      if (error) throw error;

      toast.success('User banned successfully');
      fetchUsers();
      setBanReason('');
    } catch (error) {
      toast.error('Failed to ban user');
      console.error('Error banning user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('banned_users')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User unbanned successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unban user');
      console.error('Error unbanning user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (!isOwner) {
      toast.error('Only owners can modify admin status');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isCurrentlyAdmin })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${isCurrentlyAdmin ? 'removed from' : 'added to'} admin role`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update admin status');
      console.error('Error updating admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl text-red-500">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 bg-gradient-to-br from-spdm-black via-blue-950/20 to-spdm-dark min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          {isOwner ? (
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Crown className="w-8 h-8 text-yellow-400" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="w-8 h-8 text-spdm-blue" />
            </motion.div>
          )}
          <div>
            <motion.h1 
              className="text-3xl font-bold text-spdm-blue"
              animate={{ textShadow: ["0 0 5px #1d26e1", "0 0 20px #1d26e1", "0 0 5px #1d26e1"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isOwner ? 'Owner Panel' : 'Admin Panel'}
            </motion.h1>
            <p className="text-gray-400">
              {isOwner ? 'Full system control and management' : 'User moderation and basic management'}
            </p>
          </div>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          className="border-spdm-blue text-spdm-blue hover:bg-spdm-blue/10"
        >
          <Settings className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.05, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Users className="w-8 h-8 text-blue-400" />
              </motion.div>
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.totalUsers)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-gradient-to-br from-spdm-blue/10 to-blue-600/10 border-spdm-blue/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Coins className="w-8 h-8 text-spdm-blue" />
              </motion.div>
              <div>
                <p className="text-spdm-blue text-sm font-medium">Total Coins</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.totalCoins)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Ban className="w-8 h-8 text-red-400" />
              </motion.div>
              <div>
                <p className="text-red-400 text-sm font-medium">Banned Users</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.bannedUsers)}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, rotateY: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-8 h-8 text-purple-400" />
              </motion.div>
              <div>
                <p className="text-purple-400 text-sm font-medium">Admin Users</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.adminUsers)}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Fake Users Control - Owner Only */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-600/10 border-yellow-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <UserPlus className="w-6 h-6 text-yellow-400" />
              </motion.div>
              <h2 className="text-xl font-semibold text-yellow-400">Fake Users Control</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => updateFakeUserCount(fakeUserCount - 1)}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="px-4 py-2 bg-spdm-dark rounded-lg border border-yellow-500/30">
                  <span className="text-yellow-400 font-bold text-lg">{formatNumber(fakeUserCount)}</span>
                </div>
                <Button
                  onClick={() => updateFakeUserCount(fakeUserCount + 1)}
                  size="sm"
                  className="bg-spdm-blue hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => updateFakeUserCount(fakeUserCount + 10)}
                  size="sm"
                  className="bg-spdm-blue hover:bg-blue-700 text-white"
                >
                  +10
                </Button>
                <Button
                  onClick={() => updateFakeUserCount(fakeUserCount + 100)}
                  size="sm"
                  className="bg-spdm-blue hover:bg-blue-700 text-white"
                >
                  +100
                </Button>
                <Button
                  onClick={() => updateFakeUserCount(0)}
                  size="sm"
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Reset
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mt-3">
              Control the number of fake users displayed in the online users counter
            </p>
          </Card>
        </motion.div>
      )}

      {/* User Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-spdm-dark/80 border-spdm-blue/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Users className="w-6 h-6 text-spdm-blue" />
            </motion.div>
            <h2 className="text-xl font-semibold text-spdm-blue">User Management</h2>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-spdm-blue/20">
                  <TableHead className="text-spdm-blue">Username</TableHead>
                  <TableHead className="text-spdm-blue">Balance</TableHead>
                  <TableHead className="text-spdm-blue">Status</TableHead>
                  <TableHead className="text-spdm-blue">Role</TableHead>
                  <TableHead className="text-spdm-blue">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-spdm-blue/10 hover:bg-spdm-blue/5"
                  >
                    <TableCell className="font-medium text-white">{user.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-spdm-blue" />
                        <span className="text-spdm-blue font-semibold">{formatNumber(user.balance)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_banned 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {user.is_banned ? (
                          <><Ban className="w-3 h-3 inline mr-1" />Banned</>
                        ) : (
                          <><UserCheck className="w-3 h-3 inline mr-1" />Active</>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_admin 
                          ? 'bg-spdm-blue/20 text-spdm-blue border border-spdm-blue/30' 
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {user.is_admin ? (
                          <><Shield className="w-3 h-3 inline mr-1" />Admin</>
                        ) : (
                          <><Eye className="w-3 h-3 inline mr-1" />User</>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user.id);
                              setBalanceChange(0);
                            }}
                            className="bg-spdm-blue hover:bg-blue-700 text-white"
                          >
                            <Coins className="w-3 h-3 mr-1" />
                            Balance
                          </Button>
                        </motion.div>
                        
                        {isOwner && (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                              variant="outline"
                              className="border-spdm-blue text-spdm-blue hover:bg-spdm-blue/10"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </motion.div>
                        )}
                        
                        {user.is_banned ? (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              onClick={() => handleUnbanUser(user.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Unban
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              onClick={() => handleBanUser(user.id)}
                              variant="destructive"
                            >
                              <UserX className="w-3 h-3 mr-1" />
                              Ban
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Balance Modification Section */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-6 bg-gradient-to-br from-spdm-blue/10 to-blue-600/10 border-spdm-blue/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Coins className="w-6 h-6 text-spdm-blue" />
              </motion.div>
              <h2 className="text-xl font-semibold text-spdm-blue">Modify Balance</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-spdm-blue">Amount Change</Label>
                <Input
                  type="number"
                  value={balanceChange}
                  onChange={(e) => setBalanceChange(parseInt(e.target.value) || 0)}
                  className="bg-spdm-gray border-spdm-blue/30 text-white"
                  placeholder={isOwner ? "No limit" : "Max ±500 coins"}
                />
                {!isOwner && (
                  <motion.p 
                    className="text-sm text-yellow-400 mt-1"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Admin limit: ±500 coins per transaction
                  </motion.p>
                )}
              </div>
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleBalanceChange}
                    disabled={loading || balanceChange === 0}
                    className="bg-spdm-blue hover:bg-blue-700 text-white"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Update Balance
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setSelectedUser('')}
                    variant="outline"
                    className="border-spdm-blue text-spdm-blue hover:bg-spdm-blue/10"
                  >
                    Cancel
                  </Button>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Emergency Message Section - Owner Only */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </motion.div>
              <h2 className="text-xl font-semibold text-red-400">Emergency Message</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-red-400">Message</Label>
                <Textarea
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  className="bg-spdm-gray border-red-500/30 text-white"
                  placeholder="Enter emergency message..."
                />
              </div>
              <div>
                <Label className="text-red-400">Target User ID (optional)</Label>
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="bg-spdm-gray border-red-500/30 text-white"
                  placeholder="Leave empty to send to all users"
                />
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleEmergencyMessage}
                  disabled={loading || !emergencyMessage}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Send Emergency Message
                </Button>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Promo Code Manager */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <PromoCodeManager />
      </motion.div>
    </div>
  );
};

export default Admin;