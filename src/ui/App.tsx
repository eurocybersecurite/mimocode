import React, { useState } from 'react';
import { Box, Text } from 'ink';

export const GeminiUI = ({ config, agents }: { config: any, agents: any[] }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="round" paddingLeft={1} paddingRight={1} borderColor="cyan">
        <Text color="blue" bold>Mimocode v0.37.1</Text>
      </Box>
      
      {/* Chat History */}
      <Box flexGrow={1} flexDirection="column" padding={1}>
        {history.map((msg, i) => (
          <Text key={i} color={msg.role === 'user' ? 'green' : 'white'}>
            {msg.role === 'user' ? '> ' : '✦ '}{msg.content}
          </Text>
        ))}
      </Box>

      {/* Input */}
      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text color="blue" bold>{"> "}</Text>
        <Text>{input}</Text>
      </Box>
    </Box>
  );
};
