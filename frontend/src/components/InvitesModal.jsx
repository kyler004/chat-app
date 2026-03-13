import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Clock } from 'lucide-react';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';

export default function InvitesModal({ isOpen, onClose, invites, setInvites, user }) {
  const socket = useSocket(user);

  const handleAccept = async (inviteId, senderId) => {
    try {
      const { data } = await api.put(`/api/invites/${inviteId}/accept`);
      
      // Remove from list
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
      
      // Notify sender
      if (socket.socket) {
        socket.socket.emit('invite:accept', { 
          senderId, 
          receiverId: user.id, 
          conversation: data.conversation 
        });
      }

      onClose(); // Optional: close modal when accepted
    } catch (error) {
      console.error('Failed to accept invite:', error);
    }
  };

  const handleReject = async (inviteId) => {
    try {
      await api.put(`/api/invites/${inviteId}/reject`);
      setInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (error) {
      console.error('Failed to reject invite:', error);
    }
  };

  if (!isOpen) return null;

  // Separate incoming and outgoing using strict equality with logged in user.id
  const incoming = invites.filter(inv => inv.receiverId === user.id);
  const outgoing = invites.filter(inv => inv.senderId === user.id);

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
            <h2 className="text-xl font-black text-white">Invitations</h2>
            <p className="text-sm text-text-muted mt-1">Manage your connection requests</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <Clock size={48} className="text-text-muted mb-4" />
              <p className="text-lg font-bold text-white">No pending invites</p>
              <p className="text-sm text-text-muted mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {incoming.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3 ml-2">Incoming Requests</h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {incoming.map(inv => (
                        <motion.div 
                          key={inv.id} 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center font-black overflow-hidden shadow-md">
                              {inv.sender.avatar ? <img src={inv.sender.avatar} className="w-full h-full object-cover"/> : inv.sender.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{inv.sender.username}</p>
                              <p className="text-[10px] text-text-muted uppercase font-bold mt-0.5">Wants to chat</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAccept(inv.id, inv.senderId)}
                              className="p-2 bg-success/20 text-success hover:bg-success hover:text-white rounded-xl transition-all"
                              title="Accept"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => handleReject(inv.id)}
                              className="p-2 bg-danger/20 text-danger hover:bg-danger hover:text-white rounded-xl transition-all"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </motion.div>
                       ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {outgoing.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3 ml-2">Sent Requests</h3>
                  <div className="space-y-2">
                    {outgoing.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5">
                        <div className="flex items-center gap-3 opacity-60">
                           <div className="h-10 w-10 rounded-xl bg-bg-elevated text-text-muted flex items-center justify-center font-black overflow-hidden">
                             {inv.receiver.avatar ? <img src={inv.receiver.avatar} className="w-full h-full object-cover"/> : inv.receiver.username[0].toUpperCase()}
                           </div>
                           <div>
                             <p className="text-sm font-bold text-white">{inv.receiver.username}</p>
                             <p className="text-[10px] text-text-muted uppercase font-bold mt-0.5">Pending...</p>
                           </div>
                        </div>
                        <span className="text-xs font-bold text-text-muted px-2 py-1 bg-white/5 rounded-md">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
