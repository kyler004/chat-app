import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../api/client';

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const socket = useSocket(user);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState('');
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
      .then(({ data }) => setMessages(data.messages));
  }, [activeRoom]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = socket.onMessage(({ message }) => {
      setMessages((prev) => [...prev, message]);
    });
    return cleanup;
  }, [socket.onMessage]);

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
  }, [socket.onTyping]);

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
    }, 1500); // stop typing indicator after 1.5s of no keypresses
  };

  const handleLogout = () => {
    socket.disconnect();
    logout();
  };

  return (
    <div style={s.shell}>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.brand}>◈ <span>Relay</span></div>
        </div>

        <div style={s.section}>
          <p style={s.sectionLabel}>Rooms</p>
          {rooms.map((room) => (
            <button
              key={room.id}
              style={{
                ...s.roomItem,
                ...(activeRoom?.id === room.id ? s.roomItemActive : {}),
              }}
              onClick={() => setActiveRoom(room)}
            >
              <span style={s.roomHash}>#</span>
              <span>{room.name}</span>
            </button>
          ))}
        </div>

        {/* User footer */}
        <div style={s.userBar}>
          <div style={s.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
          <div style={s.userInfo}>
            <p style={s.userName}>{user?.username}</p>
            <p style={s.userStatus}>● Online</p>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout} title="Sign out">
            ⎋
          </button>
        </div>
      </aside>

      {/* ── Chat Area ─────────────────────────────── */}
      <main style={s.main}>
        {activeRoom ? (
          <>
            {/* Header */}
            <div style={s.chatHeader}>
              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>#</span>
              <strong>{activeRoom.name}</strong>
              {activeRoom.description && (
                <span style={s.roomDesc}>— {activeRoom.description}</span>
              )}
            </div>

            {/* Messages */}
            <div style={s.messageList}>
              {messages.map((msg, i) => {
                const isOwn = msg.sender?.id === user?.id;
                const showAvatar = i === 0 || messages[i - 1]?.sender?.id !== msg.sender?.id;
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                  />
                );
              })}
              {typingUsers.length > 0 && (
                <div style={s.typingIndicator}>
                  <span style={s.typingDots}>
                    <span /><span /><span />
                  </span>
                  <span style={s.typingText}>
                    {typingUsers.map((u) => u.username).join(', ')}{' '}
                    {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={s.inputArea}>
              <input
                style={s.input}
                placeholder={`Message #${activeRoom.name}`}
                value={input}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
                onClick={handleSend}
                disabled={!input.trim()}
              >
                ↑
              </button>
            </div>
          </>
        ) : (
          <div style={s.empty}>
            <p style={s.emptyIcon}>◈</p>
            <p style={s.emptyTitle}>Select a room to start chatting</p>
            <p style={s.emptySub}>Choose a channel from the sidebar</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Message Bubble sub-component
function MessageBubble({ message, isOwn, showAvatar }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={{ ...s.msgRow, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      {!isOwn && showAvatar && (
        <div style={s.msgAvatar}>
          {message.sender?.username?.[0]?.toUpperCase()}
        </div>
      )}
      {!isOwn && !showAvatar && <div style={{ width: 32, flexShrink: 0 }} />}
      <div style={{ maxWidth: '65%' }}>
        {showAvatar && !isOwn && (
          <p style={s.msgSender}>{message.sender?.username}</p>
        )}
        <div style={{ ...s.bubble, ...(isOwn ? s.bubbleOwn : s.bubbleOther) }}>
          <p style={s.bubbleText}>{message.content}</p>
          <p style={s.bubbleTime}>{time}</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' },

  // Sidebar
  sidebar: {
    width: 240, flexShrink: 0, background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border)', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
  },
  sidebarTop: { padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' },
  brand: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 18,
    fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.3px',
  },
  section: { flex: 1, overflowY: 'auto', padding: '16px 8px 8px' },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase', padding: '0 8px 8px',
  },
  roomItem: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
    fontSize: 14, textAlign: 'left', transition: 'all 0.15s',
  },
  roomItemActive: { background: 'var(--bg-hover)', color: 'var(--text-primary)' },
  roomHash: { color: 'var(--text-muted)', fontSize: 16, fontWeight: 300 },
  userBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px',
    borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userStatus: { fontSize: 11, color: 'var(--success)' },
  logoutBtn: {
    background: 'none', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', fontSize: 18, padding: 4, flexShrink: 0,
  },

  // Chat area
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chatHeader: {
    padding: '16px 24px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 600,
    background: 'var(--bg-surface)',
  },
  roomDesc: { color: 'var(--text-secondary)', fontWeight: 400, fontSize: 13, marginLeft: 4 },
  messageList: {
    flex: 1, overflowY: 'auto', padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },

  // Message bubbles
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  msgAvatar: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
    color: 'var(--text-secondary)',
  },
  msgSender: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 3, paddingLeft: 2 },
  bubble: {
    padding: '9px 13px', borderRadius: 'var(--radius-md)',
    display: 'inline-flex', flexDirection: 'column', gap: 4,
  },
  bubbleOwn: {
    background: 'var(--accent)', borderBottomRightRadius: 4,
  },
  bubbleOther: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 1.5, color: 'var(--text-primary)' },
  bubbleTime: { fontSize: 10, color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-end' },

  // Typing
  typingIndicator: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 0', color: 'var(--text-muted)', fontSize: 12,
  },
  typingDots: { display: 'flex', gap: 3 },
  typingText: { fontStyle: 'italic' },

  // Input
  inputArea: {
    padding: '16px 24px', borderTop: '1px solid var(--border)',
    display: 'flex', gap: 10, background: 'var(--bg-surface)',
  },
  input: {
    flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', padding: '11px 16px', color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 'var(--radius-md)', background: 'var(--accent)',
    border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s',
  },

  // Empty state
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  emptyIcon: { fontSize: 48, color: 'var(--text-muted)', marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 600 },
  emptySub: { fontSize: 14, color: 'var(--text-secondary)' },
};