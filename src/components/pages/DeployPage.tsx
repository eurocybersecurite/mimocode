import React from 'react';
import { motion } from 'motion/react';
import { Globe, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DeployPageProps {
  handleDeploy: () => void;
  isDeploying: boolean;
  deployStatus: any;
  config: any;
}

export function DeployPage({
  handleDeploy,
  isDeploying,
  deployStatus,
  config
}: DeployPageProps) {
  const repoUrl = config?.githubRepo || 'https://github.com/eurocybersecurite/mimocode.git';
  const displayRepo = repoUrl.replace('https://github.com/', '');

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
          <Globe size={40} className="text-indigo-500" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-100 mb-2">Deploy Your Application</h2>
        <p className="text-zinc-400">Version-checked deployment to GitHub.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
        <button 
          onClick={() => handleDeploy()}
          disabled={isDeploying}
          className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${
            isDeploying ? 'border-indigo-500 bg-indigo-500/5' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
              <Globe size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-zinc-100">GitHub Deployment</h3>
              <p className="text-sm text-zinc-500">{displayRepo}</p>
            </div>
          </div>
          {isDeploying ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
          ) : (
            <ChevronRight className="text-zinc-600" />
          )}
        </button>
      </div>

      {isDeploying && deployStatus && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-zinc-200">Deployment in Progress</h4>
            <span className="text-indigo-400 font-mono text-sm">{deployStatus.progress}%</span>
          </div>
          
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mb-8">
            <motion.div 
              className="h-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${deployStatus.progress}%` }}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <CheckCircle2 size={16} className={deployStatus.progress >= 10 ? 'text-green-500' : 'text-zinc-700'} />
              <span className={deployStatus.progress >= 10 ? 'text-zinc-200' : ''}>Checking version compatibility...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <CheckCircle2 size={16} className={deployStatus.progress >= 30 ? 'text-green-500' : 'text-zinc-700'} />
              <span className={deployStatus.progress >= 30 ? 'text-zinc-200' : ''}>Preparing local changes (git add)...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <CheckCircle2 size={16} className={deployStatus.progress >= 50 ? 'text-green-500' : 'text-zinc-700'} />
              <span className={deployStatus.progress >= 50 ? 'text-zinc-200' : ''}>Creating release commit...</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <CheckCircle2 size={16} className={deployStatus.progress >= 80 ? 'text-green-500' : 'text-zinc-700'} />
              <span className={deployStatus.progress >= 80 ? 'text-zinc-200' : ''}>Pushing to GitHub repository...</span>
            </div>
          </div>
        </motion.div>
      )}

      {deployStatus?.url && !isDeploying && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-green-500/20">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-green-400 mb-2">Success!</h3>
          <p className="text-zinc-400 mb-6">Your application is live and ready to use.</p>
          <a 
            href={deployStatus.url} 
            target="_blank" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all"
          >
            Open Application
            <ChevronRight size={18} />
          </a>
        </motion.div>
      )}
    </div>
  );
}
