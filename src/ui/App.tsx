import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { Header } from './components/Header';
import { Prompt } from './components/Prompt';
import { MessageList } from './components/MessageList';
import { useHistory } from './hooks/useHistory';
import { useSuggestions } from './hooks/useSuggestions';
import { theme } from './styles/theme';

interface AppProps {
  config: any;
  initialMessages?: any[];
  onCommand: (command: string) => Promise<void>;
}

export const App: React.FC<AppProps> = ({ config, initialMessages = [], onCommand }) => {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingTime, setThinkingTime] = useState(0);
  const { exit } = useApp();
  const { addToHistory, navigate } = useHistory();
  
  // Mock data for suggestions - in real app these would come from config/agents
  const { suggestions, updateSuggestions } = useSuggestions(['coder', 'architect', 'debugger'], ['help', 'models', 'clear', 'exit']);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isThinking) {
      interval = setInterval(() => setThinkingTime(t => t + 1), 1000);
    } else {
      setThinkingTime(0);
    }
    return () => clearInterval(interval);
  }, [isThinking]);

  const handleSubmit = async (value: string) => {
    if (value.toLowerCase() === '/exit' || value.toLowerCase() === 'exit') {
      exit();
      return;
    }
    
    addToHistory(value);
    setMessages(prev => [...prev, { role: 'user', content: value }]);
    setIsThinking(true);
    
    try {
      await onCommand(value);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', content: `Error: ${e}`, type: 'error' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleTab = (value: string) => {
    updateSuggestions(value);
    // Simple completion for now
    if (suggestions.length > 0) return suggestions[0];
    return value;
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Header 
        version="0.36.4" 
        backend={config.runtime || 'ollama'} 
        model={config.model || 'llama3.1:8b'} 
        mode="Full Access" 
        workspace={process.cwd()} 
      />
      
      <MessageList messages={messages} />
      
      {isThinking && (
        <Box marginBottom={1}>
          <Text color={theme.colors.indigo}>
            <Spinner type="dots" /> Mimocode thinking... ({thinkingTime}s)
          </Text>
        </Box>
      )}
      
      <Prompt 
        workspace={process.cwd()} 
        onSubmit={handleSubmit} 
        onNavigateHistory={navigate}
        onTab={handleTab}
      />
    </Box>
  );
};
