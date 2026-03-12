import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('relay-theme');
    return saved ? JSON.parse(saved) : {
      accentColor: '#6366f1',
      darkMode: true,
      meshBackground: true,
      glassmorphism: true,
      compactView: false
    };
  });

  useEffect(() => {
    localStorage.setItem('relay-theme', JSON.stringify(theme));
    
    // Apply accent color
    document.documentElement.style.setProperty('--accent', theme.accentColor);
    
    // Apply accent glow (with transparency)
    const glowColor = theme.accentColor + '26'; // Adds 15% opacity (0.15 * 255 = ~38 = 0x26)
    document.documentElement.style.setProperty('--accent-glow', glowColor);
    
    // Apply dark mode class
    if (theme.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateTheme = (updates) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
