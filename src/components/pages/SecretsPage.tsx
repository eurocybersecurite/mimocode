import React from 'react';
import { motion } from 'motion/react';
import { LockIcon, RefreshCw, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface SecretsPageProps {
  secrets: any[];
  fetchSecrets: () => void;
  isSecretsLoading: boolean;
  handleDeleteSecret: (name: string) => void;
  setIsCreatingSecret: (val: boolean) => void;
}

export function SecretsPage({
  secrets,
  fetchSecrets,
  isSecretsLoading,
  handleDeleteSecret,
  setIsCreatingSecret
}: SecretsPageProps) {
  const [visibleSecrets, setVisibleSecrets] = React.useState<Record<string, boolean>>({});

  const toggleVisibility = (name: string) => {
    setVisibleSecrets(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <motion.div 
      key="secrets"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full p-8 overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Secrets Manager</h2>
            <p className="text-zinc-500 text-sm">Securely manage environment variables and API keys</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchSecrets}
              className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 transition-colors"
              disabled={isSecretsLoading}
            >
              <RefreshCw size={18} className={isSecretsLoading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setIsCreatingSecret(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={14} /> Add Secret
            </button>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/30">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Key Name</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Value</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {secrets.map((secret) => (
                  <tr key={secret.name} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <LockIcon size={14} />
                        </div>
                        <span className="text-sm font-bold text-zinc-200">{secret.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500">
                          {visibleSecrets[secret.name] ? secret.value : '••••••••••••••••'}
                        </span>
                        <button 
                          onClick={() => toggleVisibility(secret.name)}
                          className="text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          {visibleSecrets[secret.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteSecret(secret.name)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {secrets.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center text-zinc-600">
                      <LockIcon size={48} className="mx-auto opacity-10 mb-4" />
                      <p className="text-sm font-medium">No secrets found in this workspace</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
