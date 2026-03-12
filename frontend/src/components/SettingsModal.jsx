import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Settings, 
  Palette, 
  Shield, 
  ChevronRight,
  Camera,
  Check,
  Loader2,
  Bell,
  Monitor,
  Volume2,
  Globe,
  Trash2,
  Key,
  ShieldAlert
} from 'lucide-react';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function SettingsModal({ isOpen, onClose, user, onUpdateUser }) {
  const { theme, updateTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    avatar: user?.avatar || '',
    bio: user?.bio || '' // Future proofing
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Mock states for general/account tabs
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [launchStartup, setLaunchStartup] = useState(true);

  const tabs = [
    { id: 'profile', icon: <User size={18}/>, label: 'Profile' },
    { id: 'appearance', icon: <Palette size={18}/>, label: 'Appearance' },
    { id: 'account', icon: <Shield size={18}/>, label: 'Account' },
    { id: 'general', icon: <Settings size={18}/>, label: 'General' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess(false);
    try {
      const { data } = await api.patch('/api/users/profile', {
        username: formData.username,
        avatar: formData.avatar
      });
      onUpdateUser(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-4xl h-[600px] border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col sm:flex-row ${theme.glassmorphism ? 'bg-bg-surface/80 backdrop-blur-3xl' : 'bg-bg-surface'}`}
      >
        {/* Glow Effects */}
        {theme.meshBackground && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
             <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-brand/10 blur-[100px] rounded-full" />
             <div className="absolute -bottom-[20%] -right-[20%] w-[40%] h-[40%] bg-indigo-500/10 blur-[80px] rounded-full" />
          </div>
        )}

        {/* Sidebar Nav */}
        <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-white/5 p-6 flex flex-col z-10">
          <div className="mb-8 px-2">
            <h2 className="text-xl font-black text-text-primary tracking-tight">Settings</h2>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1 opacity-50">Local Preferences</p>
          </div>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all relative overflow-hidden ${
                  activeTab === tab.id 
                    ? "text-brand" 
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div layoutId="active-tab-bg" className="absolute inset-0 bg-brand/5 z-0" />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10 flex-1 text-left">{tab.label}</span>
                {activeTab === tab.id && <motion.div layoutId="active-tab-indicator" className="relative z-10 w-1.5 h-1.5 rounded-full bg-brand" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5 px-2">
            <div className="flex items-center gap-3 opacity-40">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black italic">v1.2</div>
              <p className="text-[10px] font-bold text-text-muted">Relay Desktop App</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col z-10 overflow-hidden bg-white/2">
          <header className="flex items-center justify-between px-8 py-6 border-b border-white/5">
            <h3 className="text-lg font-black text-text-primary uppercase tracking-wider">{tabs.find(t => t.id === activeTab).label}</h3>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-brand hover:bg-brand/5 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-brand/10 border-2 border-dashed border-brand/30 flex items-center justify-center overflow-hidden">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={40} className="text-brand/40" />
                        )}
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-2 bg-brand text-white rounded-xl shadow-lg shadow-brand/20 hover:scale-110 transition-transform">
                        <Camera size={16} />
                      </button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-black text-text-primary uppercase tracking-widest opacity-60">Profile Picture</label>
                      <input 
                        type="text" 
                        placeholder="Avatar URL (https://...)" 
                        value={formData.avatar}
                        onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                        className="w-full bg-bg-base/40 border border-white/5 rounded-2xl py-3 px-5 text-sm outline-none focus:ring-4 focus:ring-brand/10 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Username Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-primary uppercase tracking-widest opacity-60">Display Name</label>
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-bg-base/40 border border-white/5 rounded-2xl py-4 px-6 text-base outline-none focus:ring-4 focus:ring-brand/10 transition-all font-bold tracking-tight"
                    />
                    <p className="text-xs text-text-muted font-medium ml-1">This is how others will see you in channels.</p>
                  </div>

                  {/* Bio Section */}
                  <div className="space-y-3">
                    <label className="text-sm font-black text-text-primary uppercase tracking-widest opacity-60">About Me</label>
                    <textarea 
                      rows="3"
                      placeholder="Tell us a bit about yourself..." 
                      className="w-full bg-bg-base/40 border border-white/5 rounded-2xl py-4 px-6 text-base outline-none focus:ring-4 focus:ring-brand/10 transition-all font-medium resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToggleCard 
                      label="Dark Mode" 
                      checked={theme.darkMode} 
                      onChange={(val) => updateTheme({ darkMode: val })} 
                    />
                    <ToggleCard 
                      label="Mesh Backgrounds" 
                      checked={theme.meshBackground} 
                      onChange={(val) => updateTheme({ meshBackground: val })} 
                    />
                    <ToggleCard 
                      label="Glassmorphism" 
                      checked={theme.glassmorphism} 
                      onChange={(val) => updateTheme({ glassmorphism: val })} 
                    />
                    <ToggleCard 
                      label="Compact View" 
                      checked={theme.compactView} 
                      onChange={(val) => updateTheme({ compactView: val })} 
                    />
                  </div>
                  
                  <div className="p-6 rounded-3xl bg-brand/5 border border-brand/10 space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand/20 text-brand rounded-xl"><Palette size={20}/></div>
                        <h4 className="font-black text-text-primary">Theme Accent</h4>
                     </div>
                     <div className="flex gap-3">
                        {[
                          '#6366f1', // Indigo (Default)
                          '#ec4899', // Pink
                          '#10b981', // Emerald
                          '#f59e0b', // Amber
                          '#ef4444', // Red
                          '#8b5cf6', // Violet
                          '#0ea5e9'  // Sky
                        ].map(color => (
                          <ColorCircle 
                            key={color} 
                            color={color} 
                            active={theme.accentColor === color} 
                            onClick={() => updateTheme({ accentColor: color })}
                          />
                        ))}
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'account' && (
                <motion.div
                  key="account-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  <div className="p-6 rounded-3xl bg-brand/5 border border-brand/10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand/20 text-brand rounded-xl"><Shield size={20}/></div>
                      <h4 className="font-black text-text-primary">Security Settings</h4>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="space-y-2">
                         <label className="text-sm font-black text-text-primary uppercase tracking-widest opacity-60">Email Address</label>
                         <input 
                           type="email" 
                           defaultValue={user?.email || 'user@example.com'} 
                           disabled
                           className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-sm outline-none opacity-70 cursor-not-allowed font-medium"
                         />
                         <p className="text-xs text-text-muted font-medium ml-1">Contact support to change your email address.</p>
                       </div>
                       
                       <button className="flex w-full sm:w-auto items-center justify-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all font-bold text-sm text-text-primary">
                         <Key size={16} className="text-brand" /> Change Password
                       </button>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-danger/5 border border-danger/10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-danger/20 text-danger rounded-xl"><ShieldAlert size={20}/></div>
                      <h4 className="font-black text-danger tracking-tight text-lg">Danger Zone</h4>
                    </div>
                    
                    <div className="space-y-2">
                       <p className="text-sm font-medium text-text-secondary">Permanently remove your account and all of its data. This action is not reversible.</p>
                       <button className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 rounded-2xl transition-all font-bold text-sm">
                         <Trash2 size={16} /> Delete Account
                       </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'general' && (
                <motion.div
                  key="general-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                     <div className="flex items-center gap-3 mb-2 px-2">
                        <Bell size={18} className="text-text-muted" />
                        <h4 className="font-black text-text-primary text-sm uppercase tracking-widest opacity-60">Notifications</h4>
                     </div>
                     <ToggleCard 
                       label="Desktop Notifications" 
                       checked={notifications} 
                       onChange={setNotifications} 
                     />
                     <ToggleCard 
                       label="Sound Alerts" 
                       checked={soundAlerts} 
                       onChange={setSoundAlerts} 
                     />
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-3 mb-2 px-2">
                        <Monitor size={18} className="text-text-muted" />
                        <h4 className="font-black text-text-primary text-sm uppercase tracking-widest opacity-60">App Behavior</h4>
                     </div>
                     <ToggleCard 
                       label="Launch on System Startup" 
                       checked={launchStartup} 
                       onChange={setLaunchStartup} 
                     />
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-3 mb-2 px-2">
                        <Globe size={18} className="text-text-muted" />
                        <h4 className="font-black text-text-primary text-sm uppercase tracking-widest opacity-60">Language & Region</h4>
                     </div>
                     <select className="w-full bg-bg-surface border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:ring-4 focus:ring-brand/10 transition-all appearance-none cursor-pointer">
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                     </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="p-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex-1 mr-8">
              {error && <p className="text-xs font-bold text-danger animate-shake">{error}</p>}
              {success && <p className="text-xs font-bold text-success flex items-center gap-2"><Check size={14}/> Settings updated successfully!</p>}
            </div>
            <button 
              disabled={isSaving}
              onClick={handleSave}
              className="btn-primary px-10 py-3.5 rounded-2xl flex items-center gap-3 relative"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              <span className="font-black uppercase tracking-widest text-sm">Save Changes</span>
            </button>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

function ToggleCard({ label, checked, onChange }) {
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
        checked ? "bg-white/5 border-white/10 shadow-sm" : "bg-transparent border-white/5 opacity-50"
      }`}
    >
      <span className="font-bold text-sm text-text-primary">{label}</span>
      <div className={`w-10 h-6 rounded-full relative transition-colors ${checked ? "bg-brand" : "bg-white/20"}`}>
        <motion.div 
          animate={{ x: checked ? 18 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          initial={false}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}

function ColorCircle({ color, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center p-1 ${
        active ? "ring-2 ring-white ring-offset-2 ring-offset-bg-surface scale-110" : "opacity-70 hover:opacity-100"
      }`}
      style={{ backgroundColor: color }}
    >
      {active && <Check size={14} className="text-white" />}
    </div>
  );
}
