import React from 'react';
import { motion } from 'motion/react';
import { Globe, Activity } from 'lucide-react';

interface PreviewPageProps {
  windowLocationOrigin?: string;
}

export function PreviewPage({ windowLocationOrigin }: PreviewPageProps) {
  const origin = windowLocationOrigin || window.location.origin;
  return (
    <motion.div 
      key="preview"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="h-10 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-zinc-500" />
          <span className="text-xs font-mono text-zinc-400">{origin}</span>
        </div>
        <button 
          onClick={() => {
            const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
            if (iframe) iframe.src = iframe.src;
          }}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
          title="Reload Preview"
        >
          <Activity size={14} />
        </button>
      </div>
      <div className="flex-1 bg-white">
        <iframe 
          id="preview-iframe"
          src={origin} 
          className="w-full h-full border-none"
          title="App Preview"
        />
      </div>
    </motion.div>
  );
}
