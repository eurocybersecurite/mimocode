import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme';
import os from 'os';

interface HeaderProps {
  version: string;
  backend: string;
  model: string;
  mode: string;
  workspace: string;
}

export const Header: React.FC<HeaderProps> = ({ version, backend, model, mode, workspace }) => {
  const cpuLoad = os.loadavg()[0].toFixed(2);
  const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);
  const freeMem = ((os.totalmem() - os.freemem()) / (1024 ** 3)).toFixed(1);
  
  const projectName = workspace.split('/').pop() || 'project';

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={theme.colors.indigo} bold>Mimocode v{version}</Text>
      <Text color={theme.colors.zinc[600]}>{'─'.repeat(process.stdout.columns || 80)}</Text>
      
      <Box gap={2}>
        <Text color={theme.colors.zinc[400]}>Backend: <Text color={theme.colors.cyan}>{backend}</Text></Text>
        <Text color={theme.colors.zinc[400]}>Model: <Text color={theme.colors.cyan}>{model}</Text></Text>
        <Text color={theme.colors.zinc[400]}>Mode: <Text color={theme.colors.cyan}>{mode}</Text></Text>
      </Box>
      
      <Box gap={2}>
        <Text color={theme.colors.zinc[400]}>CPU Load: <Text color={theme.colors.yellow}>{cpuLoad}</Text></Text>
        <Text color={theme.colors.zinc[400]}>RAM: <Text color={theme.colors.yellow}>{freeMem}GB / {totalMem}GB</Text></Text>
      </Box>
      
      <Text color={theme.colors.zinc[400]}>Workspace: <Text color={theme.colors.indigo}>{workspace}</Text></Text>
      
      <Text color={theme.colors.zinc[600]}>{'─'.repeat(process.stdout.columns || 80)}</Text>
      
      <Text color={theme.colors.zinc[400]}>Type your message or <Text color={theme.colors.indigo}>@agent</Text> or <Text color={theme.colors.indigo}>/command</Text> (type <Text color={theme.colors.yellow}>?</Text> for help)</Text>
      <Text color={theme.colors.zinc[600]} italic>Use \ at end of line for multi-line input.</Text>
    </Box>
  );
};
