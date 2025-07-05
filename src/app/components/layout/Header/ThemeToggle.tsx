'use client';

import { useTheme } from '../../../../contexts/ThemeContext';
import { MoonIcon, SunIcon } from '../../Icon';
import classes from './Header.module.css';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={classes.header_button}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <MoonIcon size="sm" hover />
      ) : (
        <SunIcon size="sm" hover />
      )}
    </button>
  );
};