import { useState, useCallback } from 'react';

export function useHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(-1);

  const addToHistory = useCallback((command: string) => {
    if (command.trim()) {
      setHistory(prev => [command, ...prev].slice(0, 100));
      setIndex(-1);
    }
  }, []);

  const navigate = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up') {
      const nextIndex = Math.min(index + 1, history.length - 1);
      setIndex(nextIndex);
      return history[nextIndex] || '';
    } else {
      const nextIndex = Math.max(index - 1, -1);
      setIndex(nextIndex);
      return nextIndex === -1 ? '' : history[nextIndex];
    }
  }, [history, index]);

  return { addToHistory, navigate };
}
