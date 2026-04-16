import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'tool_call' | 'tool_result' | 'error' | 'success';
}

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Box flexDirection="column">
      {messages.map((msg, i) => (
        <Box key={i} flexDirection="column" marginBottom={1}>
          {msg.role === 'assistant' && (
            <Box>
              <Text color={theme.colors.indigo} bold>{theme.icons.sparkle} </Text>
              <Box flexDirection="column">
                {msg.content.split('\n').map((line, j) => (
                  <Text key={j}>{line}</Text>
                ))}
              </Box>
            </Box>
          )}
          {msg.role === 'user' && msg.type !== 'tool_result' && (
            <Box>
              <Text color={theme.colors.zinc[400]}>{'> '}</Text>
              <Text color={theme.colors.zinc[100]}>{msg.content}</Text>
            </Box>
          )}
          {msg.type === 'tool_call' && (
            <Box marginLeft={2}>
              <Text color={theme.colors.cyan}>{theme.icons.tool} {msg.content}</Text>
            </Box>
          )}
          {msg.type === 'success' && (
            <Box marginLeft={2}>
              <Text color={theme.colors.green}>{theme.icons.success} {msg.content}</Text>
            </Box>
          )}
          {msg.type === 'error' && (
            <Box marginLeft={2}>
              <Text color={theme.colors.red}>{theme.icons.error} {msg.content}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};
