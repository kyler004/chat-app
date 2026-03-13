import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, MessageSquare, Loader2, Check } from 'lucide-react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function CreateRoomModal({ isOpen, onClose, onRoomCreated }) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Room name is required');
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { data } = await api.post('/api/rooms', { 
        name: name.trim(), 
        description: description.trim() 
      });
      onRoomCreated(data.room);
      onClose();
      setName('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-lg border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ${theme.glassmorphism ? 'bg-bg-surface/80 backdrop-blur-3xl' : 'bg-bg-surface'}`}
      >
        <header className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand/10 text-brand rounded-xl"><Hash size={20}/></div>
             <h3 className="text-lg font-black text-text-primary uppercase tracking-wider">Create a Forum</h3>
          </div>
          <button onClick={onClose} className="p-2 text-text-muted hover:text-brand hover:bg-brand/5 rounded-xl transition-all">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-text-primary uppercase tracking-widest opacity-60 ml-1">Room Name</label>
            <div className="relative group">
               <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand transition-colors"><Hash size={18}/></div>
               <input 
                 type="text" 
                 placeholder="new-channel" 
                 value={name}
                 onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                 className="w-full bg-bg-base/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-base outline-none focus:ring-4 focus:ring-brand/10 transition-all font-bold tracking-tight"
                 autoFocus
               />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-text-primary uppercase tracking-widest opacity-60 ml-1">Description</label>
            <div className="relative group">
                <div className="absolute left-5 top-5 text-text-muted group-focus-within:text-brand transition-colors"><MessageSquare size={18}/></div>
                <textarea 
                  rows="3"
                  placeholder="What's this forum about?" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bg-base/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-base outline-none focus:ring-4 focus:ring-brand/10 transition-all font-medium resize-none"
                />
            </div>
          </div>

          {error && <p className="text-sm font-bold text-danger animate-shake px-2">{error}</p>}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 relative shadow-xl shadow-brand/20 active:scale-[0.98]"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            <span className="font-black uppercase tracking-widest text-sm">Create Forum</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
