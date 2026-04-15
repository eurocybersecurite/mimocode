import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Importez votre composant UI Ink ici. Assurez-vous qu'il s'appelle MimocodeUI
// et qu'il est exporté depuis src/ui/App.tsx.
import { MimocodeUI } from './ui/App'; 
import { loadConfig, Config } from './config';
import { loadAgents, Agent } from './agents';

// Placeholder pour la fonction sendMessage - à implémenter dans MimocodeUI ou à passer en prop
const sendMessage = (message: string) => {
  console.log(`[Simulated Send] ${message}`); // Placeholder
};

// Le composant Ink principal qui sera rendu
const MimocodeInkApp: React.FC<{ config: Config, agents: Agent[] }> = ({ config, agents }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fonction pour traiter l'entrée utilisateur et simuler une réponse IA
  const processUserInput = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setHistory(prev => [...prev, { role: 'user', content: message }]);
    setIsProcessing(true);

    // Placeholder pour l'appel LLM réel ou l'exécution d'agent
    // Ici, vous devrez intégrer la logique pour appeler les agents, les commandes slash, etc.
    setTimeout(() => {
      const aiResponse = `AI response to: "${message}"`; 
      setHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setInput(''); // Efface l'entrée après l'envoi
      setIsProcessing(false);
      // Potentiellement sauvegarder l'historique ici
    }, 1000);
  };

  // Capture la saisie utilisateur avec le hook useInput d'Ink
  useInput((inputChar, key) => {
    if (isProcessing) return; // Ne pas capturer l'entrée pendant le traitement

    if (key.return) {
      processUserInput(input);
      setInput(''); // Efface l'entrée après traitement
    } else if (key.backspace) {
      setInput(prev => prev.slice(0, -1));
    } else if (inputChar) {
      setInput(prev => prev + inputChar);
    }
  });

  // Rend l'interface
  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="round" paddingLeft={1} paddingRight={1} borderColor="cyan">
        <Text color="blue" bold>Mimocode CLI (Ink)</Text>
      </Box>
      
      {/* Chat History */}
      <Box flexGrow={1} flexDirection="column" padding={1} marginBottom={1}>
        {history.map((msg, i) => (
          <Text key={i} color={msg.role === 'user' ? 'green' : '#6366f1'}> {/* Indigo pour l'assistant */}
            {msg.role === 'user' ? '> ' : '✦ '}{msg.content}
          </Text>
        ))}
      </Box>

      {/* Input */}
      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text color="blue" bold>{"> "}</Text>
        <Text color="white">{input}</Text>
      </Box>
    </Box>
  );
};

// Fonction principale pour démarrer l'application Ink
export async function startInkApp() {
  const config = await loadConfig();
  const agents = await loadAgents(config);

  // Assurez-vous que le fichier d'historique existe si l'application Ink en a besoin
  const historyFile = path.join(os.homedir(), '.mimocode', 'cli_history.json');
  if (!await fs.pathExists(historyFile)) {
      await fs.ensureDir(path.dirname(historyFile));
      await fs.writeJson(historyFile, [], { spaces: 2 });
  }

  // Rend l'application Ink dans le terminal
  const { waitUntilExit } = render(<MimocodeInkApp config={config} agents={agents} />);
  await waitUntilExit(); // Attend que l'utilisateur quitte l'application Ink
}
