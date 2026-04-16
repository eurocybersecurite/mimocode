import { useState, useCallback } from 'react';

export function useSuggestions(agents: string[], commands: string[]) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const updateSuggestions = useCallback((input: string) => {
    if (input.startsWith('@')) {
      const query = input.slice(1).toLowerCase();
      setSuggestions(agents.filter(a => a.toLowerCase().startsWith(query)).map(a => `@${a}`));
    } else if (input.startsWith('/')) {
      const query = input.slice(1).toLowerCase();
      setSuggestions(commands.filter(c => c.toLowerCase().startsWith(query)).map(c => `/${c}`));
    } else {
      setSuggestions([]);
    }
    setSelectedIndex(0);
  }, [agents, commands]);

  return { suggestions, selectedIndex, setSelectedIndex, updateSuggestions };
}
