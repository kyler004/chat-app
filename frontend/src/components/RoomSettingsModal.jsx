import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, UserPlus, UserMinus, Shield, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function RoomSettingsModal({ isOpen, onClose, room, currentUser, socket }) {
  const { theme } = useTheme();
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [_isSearching, setIsSearching] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(room);
  const [description, setDescription] = useState(room?.description || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if current user is admin using currentRoom data
  const isAdmin = currentRoom?.isDM ? true : currentRoom?.members?.some(m => m.userId === currentUser.id && m.role === 'ADMIN');

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoadingMembers(true);
      try {
        const endpoint = room.isDM ? `/api/dms/${room.id}` : `/api/rooms/${room.id}/members`;
        const { data } = await api.get(endpoint);
        
        if (room.isDM) {
           // For DMs, 'data.conversation' should have participants
           const membersList = data.conversation.participants.map(p => ({
             id: p.id,
             userId: p.userId,
             user: p.user,
             role: 'MEMBER' // DMs don't have roles in the same way yet
           }));
           setMembers(membersList);
           setCurrentRoom({ ...data.conversation, members: membersList, isDM: true });
           setDescription(data.conversation.description || '');
        } else {
           setMembers(data.members);
           setCurrentRoom(prev => ({ ...prev, members: data.members }));
           setDescription(room.description || '');
        }
      } catch {
        toast.error('Failed to fetch details');
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (isOpen && room) {
      fetchDetails();
    }
  }, [isOpen, room]);

  const updateDescription = async () => {
    setIsUpdating(true);
    try {
      const endpoint = room.isDM ? `/api/dms/${room.id}` : `/api/rooms/${room.id}`;
      // Note: Backend rooms controller might need updateRoom implemented if we want to edit room descriptions here too.
      // But requirement specifically asked for DMs.
      await api.put(endpoint, { description });
      toast.success('Description updated');
    } catch {
      toast.error('Failed to update description');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await api.get(`/api/users/search?username=${query}`);
      // Filter out users already in the room
      const existingIds = new Set(members.map(m => m.userId));
      setSearchResults(data.users.filter(u => !existingIds.has(u.id)));
    } catch (_err) {
      console.error('Search error:', _err);
    } finally {
      setIsSearching(false);
    }
  };

  const addMember = async (user) => {
    try {
      const { data } = await api.post(`/api/rooms/${room.id}/members`, { userId: user.id });
      setMembers(prev => [...prev, data.member]);
      setSearchResults(prev => prev.filter(u => u.id !== user.id));
      toast.success(`Added ${user.username} to ${room.name}`);
      
      // Emit socket event so backend can notify the user
      socket.emit('room:member_added', { 
        roomId: room.id, 
        userId: user.id, 
        member: data.member,
        room: room 
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    }
  };

  const removeMember = async (userId, username) => {
    try {
      await api.delete(`/api/rooms/${room.id}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.userId !== userId));
      toast.success(`Removed ${username} from ${room.name}`);

      // Emit socket event
      socket.emit('room:member_removed', { roomId: room.id, userId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-2xl h-[600px] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ${theme.glassmorphism ? 'bg-bg-surface/80 backdrop-blur-3xl' : 'bg-bg-surface'}`}
      >
        <header className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand/10 text-brand rounded-xl"><Users size={20}/></div>
             <div>
               <h3 className="text-lg font-black text-text-primary uppercase tracking-wider">{room?.isDM ? 'Chat Settings' : 'Room Settings'}</h3>
               <p className="text-xs text-text-muted font-bold tracking-tight opacity-60">{room?.isDM ? `@${room.name}` : `#${room.name}`}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-brand hover:bg-brand/5 rounded-xl transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Description Section (Always visible or editable) */}
          <div className="space-y-4">
             <div className="flex items-center gap-3 mb-2 px-1">
                <Sparkles size={18} className="text-brand" />
                <h4 className="font-black text-text-primary text-sm uppercase tracking-widest opacity-60">Description</h4>
             </div>
             <div className="space-y-3">
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Set a description for this chat..."
                  className="w-full bg-bg-base/40 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:ring-4 focus:ring-brand/10 transition-all font-medium min-h-[100px] resize-none"
                />
                <button 
                  onClick={updateDescription}
                  disabled={isUpdating}
                  className="w-full py-3 bg-brand text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  Save Description
                </button>
             </div>
          </div>

          {/* Add Members Section (Admin only, Rooms only) */}
          {isAdmin && !room?.isDM && (
            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-2 px-1">
                  <UserPlus size={18} className="text-brand" />
                  <h4 className="font-black text-text-primary text-sm uppercase tracking-widest opacity-60">Add Members</h4>
               </div>
               <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors"><Search size={18}/></div>
                  <input 
                    type="text" 
                    placeholder="Search users to add..." 
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full bg-bg-base/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:ring-4 focus:ring-brand/10 transition-all font-medium"
                  />
               </div>

               <AnimatePresence>
                 {searchResults.length > 0 && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }} 
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden"
                   >
                     {searchResults.map(user => (
                       <div key={user.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b last:border-0 border-white/5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center overflow-hidden">
                               {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users size={16} className="text-brand" />}
                             </div>
                             <span className="font-bold text-sm text-text-primary">{user.username}</span>
                          </div>
                          <button onClick={() => addMember(user)} className="p-2 text-brand hover:bg-brand/10 rounded-lg transition-all">
                            <UserPlus size={18} />
                          </button>
                       </div>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          )}

          {/* Current Members Section */}
          <div className="space-y-4">
             <div className="flex items-center gap-3 mb-2 px-1">
                <ShieldCheck size={18} className="text-text-muted" />
                <h4 className="font-black text-text-primary text-sm uppercase tracking-widest opacity-60">Members List</h4>
             </div>
             
             <div className="space-y-3">
               {isLoadingMembers ? (
                 <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand" /></div>
               ) : members.map(member => (
                 <div key={member.id} className="flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl group transition-all hover:border-white/10">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center overflow-hidden">
                         {member.user.avatar ? <img src={member.user.avatar} className="w-full h-full object-cover" /> : <Users size={20} className="text-brand/40" />}
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-text-primary">{member.user.username}</span>
                            {member.role === 'ADMIN' && <Shield size={12} className="text-brand" />}
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{member.role}</span>
                       </div>
                    </div>
                    
                    {isAdmin && member.userId !== currentUser.id && (
                      <button 
                         onClick={() => removeMember(member.userId, member.user.username)}
                         className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                         title="Kick User"
                      >
                         <UserMinus size={18} />
                      </button>
                    )}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
