'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { MoonIcon, SunIcon } from '../../Icon';
import classes from './Header.module.css';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className={classes.header_button}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon size="md" />
      ) : (
        <SunIcon size="md" />
      )}
    </button>
  );
};