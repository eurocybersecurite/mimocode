import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { theme } from '../styles/theme';

interface PromptProps {
  workspace: string;
  onSubmit: (value: string) => void;
  onNavigateHistory: (direction: 'up' | 'down') => string;
  onTab: (value: string) => string;
}

export const Prompt: React.FC<PromptProps> = ({ workspace, onSubmit, onNavigateHistory, onTab }) => {
  const [value, setValue] = useState('');
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [pastedLines, setPastedLines] = useState(0);
  
  const projectName = workspace.split('/').pop() || 'project';

  useInput((input, key) => {
    if (key.upArrow) {
      const prev = onNavigateHistory('up');
      if (prev !== undefined) setValue(prev);
    }
    if (key.downArrow) {
      const next = onNavigateHistory('down');
      if (next !== undefined) setValue(next);
    }
    if (key.tab) {
      const completed = onTab(value);
      if (completed) setValue(completed);
    }
  });

  const handleChange = (val: string) => {
    // Detect paste (simple heuristic: large jump in length or multiple lines)
    if (val.length - value.length > 50 || val.includes('\n')) {
      const lines = val.split('\n').length;
      if (lines > 1) setPastedLines(lines);
    }
    setValue(val);
    setIsMultiLine(val.endsWith('\\'));
  };

  const handleSubmit = (val: string) => {
    if (val.endsWith('\\')) {
      setValue(val.slice(0, -1) + '\n');
      return;
    }
    onSubmit(val);
    setValue('');
    setPastedLines(0);
  };

  return (
    <Box flexDirection="column">
      <Text color={theme.colors.yellow}>{'─'.repeat(process.stdout.columns || 80)}</Text>
      {pastedLines > 0 && (
        <Text color={theme.colors.zinc[400]} italic>[Pasted Text: {pastedLines} lines]</Text>
      )}
      <Box>
        <Text color={theme.colors.zinc[600]}>[{projectName}] </Text>
        <Text color={theme.colors.indigo} bold>{'> '}</Text>
        <TextInput 
          value={value} 
          onChange={handleChange} 
          onSubmit={handleSubmit}
          placeholder="..."
        />
      </Box>
    </Box>
  );
};
