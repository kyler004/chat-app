import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
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
  LayoutPanelLeft
} from 'lucide-react';

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const socket = useSocket(user);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  // Load rooms on mount
  useEffect(() => {
    api.get('/api/rooms').then(({ data }) => setRooms(data.rooms));
  }, []);

  // When active room changes — join it and load messages
  useEffect(() => {
    if (!activeRoom) return;
    socket.joinRoom(activeRoom.id);
    api.get(`/api/messages/room/${activeRoom.id}`)
      .then(({ data }) => setMessages(data.messages || []));
  }, [activeRoom, socket]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = socket.onMessage(({ message }) => {
      setMessages((prev) => [...prev, message]);
    });
    return cleanup;
  }, [socket.onMessage]);

  // Listen for socket errors
  useEffect(() => {
    socket.socket?.on('error', (err) => {
      console.error('Socket error received:', err);
      alert(`Message error: ${err.message}`);
    });
    return () => socket.socket?.off('error');
  }, [socket.socket]);

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

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !activeRoom) return;
    socket.sendRoomMessage(activeRoom.id, input.trim());
    socket.stopTyping(activeRoom.id);
    setInput('');
  };

  const handleTyping = (value) => {
    setInput(value);
    if (!activeRoom) return;
    socket.startTyping(activeRoom.id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.stopTyping(activeRoom.id);
    }, 1500); 
  };

  const handleLogout = () => {
    socket.disconnect();
    logout();
  };

  return (
    <div className="flex h-screen w-full bg-bg-base overflow-hidden">
      {/* ── Sidebar ───────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {sidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex h-full flex-col border-r border-border-subtle bg-bg-surface z-20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-6 border-bottom border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>◈</motion.span>
                </div>
                <span className="text-xl font-bold tracking-tight">Relay</span>
              </div>
            </div>

            {/* Quick Search */}
            <div className="px-4 py-4">
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors" />
                <input 
                  type="text" 
                  placeholder="Jump to..." 
                  className="w-full bg-bg-elevated/50 border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-xs focus:bg-bg-elevated transition-colors outline-none"
                />
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 space-y-6 px-3 py-2 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">General</span>
                </div>
                <div className="space-y-0.5">
                  <SidebarItem icon={<MessageSquare size={18}/>} label="Direct Messages" />
                  <SidebarItem icon={<Users size={18}/>} label="Team" />
                  <SidebarItem icon={<Bell size={18}/>} label="Notifications" badge="3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Channels</span>
                  <button className="text-text-muted hover:text-brand transition-colors"><Plus size={14}/></button>
                </div>
                <div className="space-y-0.5">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoom(room)}
                      className={`flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                        activeRoom?.id === room.id 
                          ? "bg-brand text-white shadow-lg shadow-brand/25" 
                          : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                      }`}
                    >
                      <Hash size={18} className={activeRoom?.id === room.id ? "text-white/80" : "text-text-muted group-hover:text-text-secondary"} />
                      <span className="flex-1 text-left truncate">{room.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Footer */}
            <div className="p-4 mt-auto">
              <div className="flex items-center gap-3 rounded-2xl bg-bg-elevated/50 p-3 border border-border-subtle hover:bg-bg-elevated transition-colors group">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white font-bold text-sm shadow-md">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg-surface bg-success shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-text-primary uppercase tracking-tight">{user?.username}</p>
                  <p className="text-[10px] text-success font-bold uppercase tracking-wider">Active</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────── */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {activeRoom ? (
          <>
            {/* Header */}
            <header className="flex h-16 items-center justify-between px-8 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 -ml-2 text-text-muted hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                >
                  {sidebarOpen ? <PanelLeftClose size={20}/> : <PanelLeftOpen size={20}/>}
                </button>
                <div className="flex items-center gap-2">
                  <Hash size={20} className="text-brand" />
                  <h2 className="text-base font-bold text-text-primary">{activeRoom.name}</h2>
                  {activeRoom.description && (
                    <span className="hidden md:inline-block h-4 w-px bg-border-subtle mx-2" />
                  )}
                  <p className="hidden md:inline-block text-sm text-text-secondary truncate max-w-sm">
                    {activeRoom.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-text-muted hover:text-brand hover:bg-brand/10 rounded-xl transition-all">
                  <Search size={20} />
                </button>
                <button className="p-2 text-text-muted hover:text-brand hover:bg-brand/10 rounded-xl transition-all">
                  <Settings size={20} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {(messages || []).map((msg, i) => {
                const isOwn = msg.sender?.id === user?.id;
                const showHeader = i === 0 || messages[i - 1]?.sender?.id !== msg.sender?.id || 
                                  (new Date(msg.createdAt) - new Date(messages[i-1].createdAt) > 300000);
                
                return (
                  <MessageItem 
                    key={msg.id} 
                    message={msg} 
                    isOwn={isOwn} 
                    showHeader={showHeader} 
                  />
                );
              })}
              
              <AnimatePresence>
                {typingUsers.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-3 text-text-muted"
                  >
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-1.5 h-1.5 bg-brand rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand rounded-full" />
                    </div>
                    <span className="text-xs font-medium italic">
                      {typingUsers.map(u => u.username).join(', ')} typing...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <footer className="p-6 pt-0">
              <div className="relative glass-card rounded-2xl p-2 focus-within:ring-2 focus-within:ring-brand/20 transition-all">
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2">
                    <input
                      value={input}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={`Message in #${activeRoom.name}`}
                      className="w-full bg-transparent border-none text-sm text-text-primary focus:outline-none placeholder:text-text-muted"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-30 shadow-lg shadow-brand/20"
                  >
                    <SendHorizontal size={20} />
                  </motion.button>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-3xl bg-bg-surface flex items-center justify-center border border-border-subtle shadow-xl text-brand"
            >
              <LayoutPanelLeft size={48} />
            </motion.div>
            <div className="max-w-xs space-y-2">
              <h3 className="text-2xl font-bold">Select a Room</h3>
              <p className="text-text-secondary text-sm">Join a conversation to start chatting with your team.</p>
            </div>
            <button className="btn-primary rounded-full!">Explore Channels</button>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, badge }) {
  return (
    <button className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary group transition-all">
      <span className="text-text-muted group-hover:text-brand transition-colors">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold">{badge}</span>}
    </button>
  );
}

function MessageItem({ message, isOwn, showHeader }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group flex items-start gap-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {showHeader ? (
        <div className="mt-1 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-elevated border border-border-subtle shadow-sm text-brand font-bold uppercase overflow-hidden">
            {message.sender?.avatar ? <img src={message.sender.avatar} alt="" /> : message.sender?.username?.[0]}
          </div>
        </div>
      ) : (
        <div className="w-10 opacity-0 group-hover:opacity-100 flex items-center justify-center pt-2">
          <span className="text-[10px] text-text-muted font-medium">{time}</span>
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {showHeader && (
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-sm font-bold text-text-primary uppercase tracking-tight">{message.sender?.username}</span>
            <span className="text-[10px] text-text-muted font-medium">{time}</span>
          </div>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
          isOwn 
            ? "bg-brand text-white rounded-tr-none shadow-lg shadow-brand/10" 
            : "bg-bg-elevated border border-border-subtle text-text-primary rounded-tl-none shadow-sm"
        }`}>
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}