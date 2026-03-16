import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsModal from './SettingsModal';
import DiscoverUsersModal from './DiscoverUsersModal';
import InvitesModal from './InvitesModal';
import CreateRoomModal from './CreateRoomModal';
import RoomSettingsModal from './RoomSettingsModal';
import { useTheme } from '../context/ThemeContext';
import { 
  Hash, 
  SendHorizontal, 
  LogOut, 
  User as UserIcon, 
  Plus, 
  Settings, 
  Search,
  MessageSquare,
  Users,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  MoreVertical,
  Smile,
  X,
  Paperclip,
  Menu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { playNotificationSound } from '../utils/audio';

export default function ChatLayout() {
  const { user, setUser, logout } = useAuth();
  const { theme } = useTheme();
  const socket = useSocket(user);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);
  const [isInvitesOpen, setIsInvitesOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [invites, setInvites] = useState([]);
  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  // Load rooms and DMs on mount
  useEffect(() => {
    Promise.all([
      api.get('/api/rooms').catch(() => ({ data: { rooms: [] } })),
      api.get('/api/users/me/dms').catch(() => ({ data: { dms: [] } })),
      api.get('/api/invites').catch(() => ({ data: { invites: [] } }))
    ]).then(([roomsRes, dmsRes, invitesRes]) => {
      setRooms([...(roomsRes.data.rooms || []), ...(dmsRes.data.dms || [])]);
      setInvites(invitesRes.data.invites || []);
    });
  }, []);

  // When active room changes — join it and load messages
  useEffect(() => {
    if (!activeRoom) return;

    if (activeRoom.isDM) {
      socket.socket?.emit('dm:join', { conversationId: activeRoom.id });
      api.get(`/api/messages/dm/${activeRoom.id}`)
        .then(({ data }) => setMessages(data.messages || []));
    } else {
      socket.joinRoom(activeRoom.id);
      api.get(`/api/messages/room/${activeRoom.id}`)
        .then(({ data }) => setMessages(data.messages || []));
    }
  }, [activeRoom, socket]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = socket.onMessage(({ message, roomId, conversationId }) => {
      // Determine if we should append the message to the current view
      const incomingId = roomId || conversationId;
      const isCurrentRoom = activeRoom?.id === incomingId;

      if (isCurrentRoom) {
        setMessages((prev) => [...prev, message]);
      }

      // If the message is from someone else, notify
      if (message.senderId !== user.id) {
        if (theme.notifications && !isCurrentRoom) {
          toast(`New message from ${message.sender?.username}`, { icon: '💬' });
        }
        
        // Play sound if not looking at the room, or if we want sounds all the time
        if (theme.soundAlerts) {
          playNotificationSound();
        }
      }
    });
    return cleanup;
  }, [socket, activeRoom, user.id, theme.notifications, theme.soundAlerts]);

  // Listen for socket errors
  useEffect(() => {
    const s = socket.socket;
    s?.on('error', (err) => {
      console.error('Socket error received:', err);
    });
    return () => s?.off('error');
  }, [socket]);

  // Listen for typing indicators
  useEffect(() => {
    const cleanup = socket.onTyping(({ user: typingUser, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping
          ? [...prev.filter((u) => u.id !== typingUser.id), typingUser]
          : prev.filter((u) => u.id !== typingUser.id)
      );
    });
    return cleanup;
  }, [socket]);

  // Listen for invites
  useEffect(() => {
    const s = socket.socket;
    if (!s) return;

    const handleInviteReceived = ({ invite }) => {
      setInvites((prev) => [invite, ...prev]);
      if (theme.notifications) toast.success(`New invite from ${invite.sender.username}`);
      if (theme.soundAlerts) playNotificationSound();
    };

    const handleInviteAccepted = ({ conversation }) => {
      // Refresh the incoming invites list or rooms.
      // For now, let's just make sure we re-fetch invites so the matching one is gone.
      api.get('/api/invites').then(({ data }) => setInvites(data.invites || []));
      // And we might want to refresh DM rooms here, assuming they are interleaved in 'rooms'
      // or we handle DMs in a separate state. For now, assuming they mix.
      setRooms((prev) => [...prev, conversation]);
      if (theme.notifications) toast.success(`Invite accepted by ${conversation.name}`);
      if (theme.soundAlerts) playNotificationSound();
    };

    const handleRoomAdded = ({ room }) => {
      setRooms((prev) => {
        if (prev.find(r => r.id === room.id)) return prev;
        return [...prev, room];
      });
      if (theme.notifications) toast.success(`You were added to #${room.name}`);
      if (theme.soundAlerts) playNotificationSound();
    };

    const handleRoomRemoved = ({ roomId }) => {
      setRooms((prev) => prev.filter(r => r.id !== roomId));
      if (activeRoom?.id === roomId) {
        setActiveRoom(null);
        toast.error('You were removed from the room');
      }
    };

    const handleRoomUpdated = ({ room: updatedRoom }) => {
      setRooms((prev) => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r));
      if (activeRoom?.id === updatedRoom.id) {
        setActiveRoom(prev => ({ ...prev, ...updatedRoom }));
      }
    };

    const handleDMUpdated = ({ conversation: updatedDM }) => {
      setRooms((prev) => prev.map(r => r.id === updatedDM.id ? { ...r, ...updatedDM } : r));
      if (activeRoom?.id === updatedDM.id) {
        setActiveRoom(prev => ({ ...prev, ...updatedDM }));
      }
    };

    s.on('invite:received', handleInviteReceived);
    s.on('invite:accepted', handleInviteAccepted);
    s.on('room:added', handleRoomAdded);
    s.on('room:removed', handleRoomRemoved);
    s.on('room:updated', handleRoomUpdated);
    s.on('dm:updated', handleDMUpdated);

    return () => {
      s.off('invite:received', handleInviteReceived);
      s.off('invite:accepted', handleInviteAccepted);
      s.off('room:added', handleRoomAdded);
      s.off('room:removed', handleRoomRemoved);
      s.off('room:updated', handleRoomUpdated);
      s.off('dm:updated', handleDMUpdated);
    };
  }, [socket, theme.notifications, theme.soundAlerts]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (!isSearching) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSearching]);

  const handleSend = () => {
    if (!input.trim() || !activeRoom) return;
    
    if (activeRoom.isDM) {
      socket.socket?.emit('message:send_dm', { conversationId: activeRoom.id, content: input.trim() });
      socket.stopDMTyping(activeRoom.id);
    } else {
      socket.sendRoomMessage(activeRoom.id, input.trim());
      socket.stopTyping(activeRoom.id);
    }
    
    setInput('');
  };

  const handleTyping = (value) => {
    setInput(value);
    if (!activeRoom) return;
    
    if (activeRoom.isDM) {
      socket.startDMTyping(activeRoom.id);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.stopDMTyping(activeRoom.id);
      }, 1500);
    } else {
      socket.startTyping(activeRoom.id);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        socket.stopTyping(activeRoom.id);
      }, 1500); 
    }
  };

  const activeRoomId = activeRoom?.id;

  useEffect(() => {
    // This empty effect is just to show where it was.
    // The lint complained about activeRoomId missing in some effect.
  }, [activeRoomId]);

  const handleLogout = () => {
    socket.disconnect();
    logout();
  };

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className={`flex h-screen w-full bg-bg-base overflow-hidden font-sans decoration-none ${theme.compactView ? 'compact-mode' : ''}`}>
      {/* Mesh Background for Main Content */}
      {theme.meshBackground && (
        <div className="mesh-gradient opacity-10">
          <div className="mesh-ball left-0 top-0" />
          <div className="mesh-ball right-0 bottom-0 bg-indigo-500/30" />
        </div>
      )}

      {/* ── Sidebar ───────────────────────────────── */}
      <AnimatePresence mode="popLayout" initial={false}>
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0, x: -20 }}
            animate={{ width: 300, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex h-full flex-col border-r border-white/5 bg-bg-surface/40 backdrop-blur-3xl z-30 overflow-hidden"
          >
            {/* Sidebar Glow */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
               <div className="absolute -top-[20%] -left-[20%] w-full h-full bg-brand/5 blur-[100px] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex h-20 items-center justify-between px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-inner">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-text-primary">Relay</span>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 py-4">
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-all" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="w-full bg-bg-base/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-bg-base/60 transition-all outline-none focus:ring-4 focus:ring-brand/10"
                />
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 space-y-8 px-4 py-4 overflow-y-auto custom-scrollbar">
              <div>
                <div className="flex items-center justify-between px-3 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Explore</span>
                </div>
                <div className="space-y-1">
                  <SidebarItem icon={<MessageSquare size={18}/>} label="All Messages" />
                  <button 
                    onClick={() => setIsDiscoverOpen(true)}
                    className="flex w-full items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-text-secondary hover:bg-white/5 hover:text-text-primary group transition-all"
                  >
                    <span className="text-text-muted group-hover:text-brand transition-all"><Users size={18}/></span>
                    <span className="flex-1 text-left">Discover Users</span>
                  </button>
                  <button 
                    onClick={() => setIsInvitesOpen(true)}
                    className="flex w-full items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-text-secondary hover:bg-white/5 hover:text-text-primary group transition-all relative"
                  >
                    <span className="text-text-muted group-hover:text-brand transition-all"><Bell size={18}/></span>
                    <span className="flex-1 text-left">Notifications</span>
                    {invites.filter(i => i.receiverId === user.id).length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-brand shadow-lg shadow-brand/20 text-white text-[10px] font-black">
                        {invites.filter(i => i.receiverId === user.id).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between px-3 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">Channels</span>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    onClick={() => setIsCreateRoomOpen(true)}
                    className="text-text-muted hover:text-brand transition-colors"
                  >
                    <Plus size={16}/>
                  </motion.button>
                </div>
                <div className="space-y-1">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveRoom(room);
                        setSearchQuery('');
                        setIsSearching(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden ${
                        activeRoom?.id === room.id 
                          ? "text-white" 
                          : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                      }`}
                    >
                      {activeRoom?.id === room.id && (
                        <motion.div layoutId="active-room" className="absolute inset-0 bg-brand shadow-lg shadow-brand/20 z-0" />
                      )}
                      <span className="relative z-10 flex items-center gap-3 w-full">
                        <Hash size={18} className={activeRoom?.id === room.id ? "text-white/70" : "text-text-muted group-hover:text-text-secondary"} />
                        <span className="flex-1 text-left truncate">{room.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Footer */}
            <div className="p-5 border-t border-white/5 bg-bg-surface/20">
              <div 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-4 rounded-3xl bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-all group cursor-pointer"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white font-black text-lg shadow-xl shadow-brand/20">
                    {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-2xl" /> : user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-bg-surface bg-success shadow-sm animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate text-text-primary uppercase tracking-tight">{user?.username}</p>
                  <p className="text-[10px] text-success font-black uppercase tracking-widest mt-0.5">Online Now</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────── */}
      <main className="relative flex flex-1 flex-col overflow-hidden z-20">
        {activeRoom ? (
          <>
            {/* Header */}
            <header className="flex h-20 items-center justify-between px-10 border-b border-white/5 bg-bg-base/40 backdrop-blur-3xl z-10">
              <div className="flex items-center gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-3 bg-white/5 text-text-muted hover:text-brand hover:bg-brand/10 rounded-2xl transition-all"
                >
                  {sidebarOpen ? <PanelLeftClose size={22}/> : <PanelLeftOpen size={22}/>}
                </motion.button>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <Hash size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text-primary tracking-tight">{activeRoom.name}</h2>
                    <p className="text-xs text-text-secondary font-medium opacity-70 truncate max-w-sm">
                      {activeRoom.description || "No description set"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AnimatePresence mode="wait">
                  {isSearching ? (
                    <motion.div 
                      key="search-input"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 280, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="relative flex items-center"
                    >
                      <input 
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 pl-4 pr-10 text-sm focus:ring-4 focus:ring-brand/10 outline-none transition-all"
                      />
                      <button 
                        onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                        className="absolute right-3 p-1 text-text-muted hover:text-brand transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button 
                      key="search-btn"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => setIsSearching(true)}
                      className="p-3 text-text-muted hover:text-brand hover:bg-brand/10 rounded-2xl transition-all"
                    >
                      <Search size={22} />
                    </motion.button>
                  )}
                </AnimatePresence>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 text-text-muted hover:text-brand hover:bg-brand/10 rounded-2xl transition-all"
                  title="Global Settings"
                >
                  <Settings size={22} />
                </button>
                <button 
                  onClick={() => setIsRoomSettingsOpen(true)}
                  className="p-3 text-text-muted hover:text-brand hover:bg-brand/10 rounded-2xl transition-all"
                  title="Conversation Settings"
                >
                  <Menu size={22} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10 custom-scrollbar">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg, i) => {
                  const isOwn = msg.sender?.id === user?.id;
                  const showHeader = i === 0 || filteredMessages[i - 1]?.sender?.id !== msg.sender?.id || 
                                    (new Date(msg.createdAt) - new Date(filteredMessages[i-1].createdAt) > 300000);
                  
                  return (
                    <MessageItem 
                      key={msg.id} 
                      message={msg} 
                      isOwn={isOwn} 
                      showHeader={showHeader} 
                      searchQuery={searchQuery}
                    />
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <Search size={48} className="text-text-muted" />
                  <p className="text-lg font-bold">No messages found</p>
                  <button 
                    onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                    className="text-brand hover:underline font-bold"
                  >
                    Clear search
                  </button>
                </div>
              )}
              
              <AnimatePresence>
                {!searchQuery && typingUsers.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-4 text-text-muted px-2"
                  >
                    <div className="flex gap-1.5">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 bg-brand rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 bg-brand rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 bg-brand rounded-full" />
                    </div>
                    <span className="text-xs font-bold italic tracking-tight uppercase opacity-50">
                      {typingUsers.map(u => u.username).join(', ')} is typing...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <footer className="p-8 pt-0">
              <div className={`relative rounded-4xl p-3 border-white/10 ring-1 ring-white/5 shadow-2xl focus-within:ring-brand/30 transition-all bg-bg-surface/30 backdrop-blur-3xl ${theme.glassmorphism ? 'glass-card' : 'bg-bg-surface'}`}>
                <div className="flex items-end gap-3 px-3">
                  <button className="p-3 text-text-muted hover:text-brand hover:bg-brand/10 rounded-2xl transition-all mb-1"><Paperclip size={22} /></button>
                  <div className="flex-1 py-4">
                    <textarea
                      rows="1"
                      value={input}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                      placeholder={`Message in #${activeRoom.name}`}
                      className="w-full bg-transparent border-none text-base text-text-primary focus:outline-none placeholder:text-text-muted/40 resize-none max-h-40"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <button className="p-3 text-text-muted hover:text-brand hover:bg-brand/10 rounded-2xl transition-all"><Smile size={22} /></button>
                    <motion.button
                      whileHover={{ scale: 1.05, rotate: -10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white disabled:opacity-20 shadow-xl shadow-brand/40"
                    >
                      <SendHorizontal size={24} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="w-32 h-32 rounded-[2.5rem] bg-bg-surface/40 backdrop-blur-3xl flex items-center justify-center border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-brand mb-10"
            >
              <Sparkles size={64} className="animate-pulse" />
            </motion.div>
            <div className="max-w-md space-y-4">
              <h3 className="text-4xl font-black tracking-tight">Your Digital Space.</h3>
              <p className="text-text-secondary text-lg font-medium opacity-60 leading-relaxed">
                Connect with your team, share ideas, and build the future together in realtime.
              </p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary mt-12 rounded-3xl! px-10 py-4 text-base"
            >
              Launch a Conversation
            </motion.button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            user={user}
            onUpdateUser={setUser}
          />
        )}
        {isDiscoverOpen && (
          <DiscoverUsersModal 
            isOpen={isDiscoverOpen} 
            onClose={() => setIsDiscoverOpen(false)} 
            user={user} 
          />
        )}
        {isInvitesOpen && (
          <InvitesModal 
            isOpen={isInvitesOpen} 
            onClose={() => setIsInvitesOpen(false)} 
            invites={invites}
            setInvites={setInvites}
            user={user} 
          />
        )}
        {isCreateRoomOpen && (
          <CreateRoomModal 
            isOpen={isCreateRoomOpen} 
            onClose={() => setIsCreateRoomOpen(false)}
            onRoomCreated={(newRoom) => setRooms(prev => [newRoom, ...prev])}
          />
        )}
        {isRoomSettingsOpen && (
          <RoomSettingsModal
            isOpen={isRoomSettingsOpen}
            onClose={() => setIsRoomSettingsOpen(false)}
            room={activeRoom}
            currentUser={user}
            socket={socket.socket}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, badge }) {
  return (
    <button className="flex w-full items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-text-secondary hover:bg-white/5 hover:text-text-primary group transition-all">
      <span className="text-text-muted group-hover:text-brand transition-all">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className="px-2.5 py-1 rounded-lg bg-brand shadow-lg shadow-brand/20 text-white text-[10px] font-black">{badge}</span>}
    </button>
  );
}

function MessageItem({ message, isOwn, showHeader, searchQuery }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const highlightContent = (content, query) => {
    if (!query.trim()) return content;
    const parts = content.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="bg-brand/30 text-white rounded px-0.5">{part}</span> 
        : part
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex items-start gap-5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {showHeader ? (
        <div className="mt-1 shrink-0">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-elevated border border-white/5 shadow-lg text-brand font-black uppercase overflow-hidden"
          >
            {message.sender?.avatar ? <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" /> : message.sender?.username?.[0]}
          </motion.div>
        </div>
      ) : (
        <div className="w-12 opacity-0 group-hover:opacity-40 flex items-center justify-center pt-3">
          <span className="text-[10px] text-text-muted font-black tracking-tighter">{time}</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {showHeader && (
          <div className={`flex items-center gap-3 mb-2 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-xs font-black text-text-primary uppercase tracking-wider">{message.sender?.username}</span>
            <span className="text-[10px] text-text-muted font-black tracking-widest opacity-40">{time}</span>
          </div>
        )}
        <div className={`relative px-5 py-3.5 rounded-3xl text-[15px] font-medium leading-relaxed whitespace-pre-wrap shadow-sm transition-all hover:shadow-md ${
          isOwn 
            ? "bg-brand text-white rounded-tr-none shadow-brand/10 hover:shadow-brand/20" 
            : "bg-bg-elevated border border-white/5 text-text-primary rounded-tl-none"
        }`}>
          {isOwn && (
             <div className="absolute top-0 right-0 w-full h-full bg-linear-to-br from-white/10 to-transparent rounded-3xl rounded-tr-none pointer-events-none" />
          )}
          <span className="relative z-10">{highlightContent(message.content, searchQuery)}</span>
        </div>
      </div>
    </motion.div>
  );
}