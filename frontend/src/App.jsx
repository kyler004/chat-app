import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './components/AuthPage';
import ChatLayout from './components/ChatLayout';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', height: '100vh',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  return user ? <ChatLayout /> : <AuthPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}