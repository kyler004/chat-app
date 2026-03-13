import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, X, Check } from 'lucide-react';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';

export default function DiscoverUsersModal({ isOpen, onClose, user }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentInvites, setSentInvites] = useState(new Set());
  const socket = useSocket(user);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleInvite = async (receiverId) => {
    try {
      const { data } = await api.post('/api/invites', { receiverId });
      setSentInvites(prev => new Set(prev).add(receiverId));
      
      // Emit socket event to notify receiver
      socket.socket?.emit('invite:send', { 
        receiverId, 
        invite: data.invite 
      });
    } catch (error) {
      console.error('Failed to send invite:', error);
      // Could show a toast here
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-bg-surface border border-white/10 shadow-2xl glass-card flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-black text-white">Discover Users</h2>
            <p className="text-sm text-text-muted mt-1">Find people and start a conversation</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 border-b border-white/5 bg-black/20">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              autoFocus
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-brand/50 outline-none transition-all placeholder:text-text-muted/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[200px]">
          {isSearching ? (
            <div className="flex justify-center items-center h-full py-10">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-1">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white font-black overflow-hidden shadow-md">
                      {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-brand transition-colors">{u.username}</p>
                    </div>
                  </div>
                  {sentInvites.has(u.id) ? (
                    <button disabled className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-text-muted text-xs font-bold ring-1 ring-white/10">
                      <Check size={14} /> Sent
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleInvite(u.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-xs font-bold hover:bg-brand hover:text-white transition-all ring-1 ring-brand/30"
                    >
                      <UserPlus size={14} /> Invite
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-50">
              <Search size={32} className="text-text-muted mb-3" />
              <p className="text-sm font-medium">No users found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center opacity-50">
              <UserPlus size={32} className="text-text-muted mb-3" />
              <p className="text-sm font-medium">Search for someone to chat with</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
