import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Code, Trash2, Globe, Edit3, Save, Tag, RefreshCw, Download } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

interface Skill {
  name: string;
  description: string;
  prompt?: string;
  tags?: string[];
  isExternal?: boolean;
}

interface SkillsPageProps {
  skillSearchTerm: string;
  setSkillSearchTerm: (val: string) => void;
  skills: Skill[];
  setConfirmDeleteSkill: (name: string) => void;
  fetchSkills: () => void;
}

export function SkillsPage({
  skillSearchTerm,
  setSkillSearchTerm,
  skills,
  setConfirmDeleteSkill,
  fetchSkills
}: SkillsPageProps) {
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBrowsingExternal, setIsBrowsingExternal] = useState(false);
  const [externalSkills, setExternalSkills] = useState<Skill[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState(false);

  const fetchExternalSkills = async () => {
    setIsLoadingExternal(true);
    try {
      const featuredSkills: Skill[] = [
        {
          name: 'cloud-deploy-expert',
          description: 'Optimized workflows for deploying React/Node apps to AWS, Vercel, and Netlify with CI/CD.',
          tags: ['devops', 'cloud', 'deploy'],
          prompt: 'You are a deployment expert. Help the user configure their CI/CD pipeline and environment variables for cloud deployment.'
        },
        {
          name: 'security-hardening',
          description: 'Automatically scan and fix OWASP top 10 vulnerabilities in your codebase.',
          tags: ['security', 'audit', 'fix'],
          prompt: 'You are a security auditor. Analyze the code for vulnerabilities and provide secure alternatives.'
        },
        {
          name: 'performance-profiler',
          description: 'Identify bottlenecks in your frontend or backend and suggest concrete optimizations.',
          tags: ['performance', 'optimization'],
          prompt: 'You are a performance engineer. Profile the provided code or logs and suggest memory and CPU optimizations.'
        },
        {
          name: 'documentation-ai',
          description: 'Generate comprehensive READMEs, API docs, and TSDoc/JSDoc from your source code.',
          tags: ['documentation', 'markdown'],
          prompt: 'You are a documentation specialist. Create clear, professional, and exhaustive documentation for the project.'
        }
      ];

      // Attempt to fetch, but merge with featured skills
      const res = await axios.get('https://raw.githubusercontent.com/eurocybersecurite/mimocode-skills/main/index.json').catch(() => ({ data: [] }));
      const merged = [...featuredSkills, ...res.data];
      
      setExternalSkills(merged.map((s: any) => ({ ...s, isExternal: true })));
      setIsBrowsingExternal(true);
    } catch (e) {
      console.error("Failed to fetch external skills", e);
    } finally {
      setIsLoadingExternal(false);
    }
  };

  const importSkill = async (skill: Skill) => {
    try {
      await axios.post('/api/skills', { ...skill, isExternal: undefined });
      fetchSkills();
      alert(`Skill ${skill.name} imported successfully!`);
    } catch (e) { console.error(e); }
  };

  const displaySkills = isBrowsingExternal ? externalSkills : skills;

  const filteredSkills = displaySkills.filter(s => 
    s.name.toLowerCase().includes(skillSearchTerm.toLowerCase()) || 
    s.description.toLowerCase().includes(skillSearchTerm.toLowerCase())
  );

  const handleSaveSkill = async () => {
    if (!editingSkill) return;
    setIsSaving(true);
    try {
      await axios.post('/api/skills', editingSkill);
      fetchSkills();
      setEditingSkill(null);
    } catch (e) { console.error(e); }
    finally { setIsSaving(false); }
  };

  return (
    <motion.div 
      key="skills"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder={isBrowsingExternal ? "Search external skills..." : "Search local skills..."}
            value={skillSearchTerm}
            onChange={(e) => setSkillSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all shadow-lg shadow-black/20"
          />
          {skillSearchTerm && (
            <button 
              onClick={() => setSkillSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsBrowsingExternal(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isBrowsingExternal ? 'bg-zinc-100 text-zinc-900 shadow-lg shadow-white/5' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'}`}
          >
            Local Skills
          </button>
          <button 
            onClick={fetchExternalSkills}
            disabled={isLoadingExternal}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isBrowsingExternal ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'}`}
          >
            {isLoadingExternal ? <RefreshCw size={14} className="animate-spin" /> : <Globe size={14} />}
            Browse External
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <div key={skill.name} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl p-6 flex flex-col hover:border-indigo-500/30 hover:bg-zinc-900/80 transition-all group relative overflow-hidden">
            {skill.isExternal && (
              <div className="absolute top-0 right-0 p-3">
                <div className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[8px] font-bold uppercase tracking-widest rounded-full border border-indigo-500/20">External</div>
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-yellow-600/10 rounded-2xl text-yellow-500 group-hover:scale-110 transition-transform">
                <Code size={24} />
              </div>
              {!skill.isExternal && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingSkill(skill)}
                    className="p-2 hover:bg-indigo-500/10 rounded-xl text-zinc-500 hover:text-indigo-400 transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => setConfirmDeleteSkill(skill.name)}
                    className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            
            <h3 className="font-bold text-zinc-100 text-lg mb-2">{skill.name}</h3>
            <p className="text-sm text-zinc-500 line-clamp-2 mb-6 flex-1 leading-relaxed">{skill.description || 'No description provided.'}</p>
            
            <div className="flex flex-wrap gap-1.5 mb-8">
              {skill.tags?.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-zinc-800/50 rounded-lg text-[10px] text-zinc-400 font-bold border border-zinc-700/30 uppercase tracking-tight">#{tag}</span>
              ))}
            </div>

            {skill.isExternal ? (
              <button 
                onClick={() => importSkill(skill)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-bold text-white transition-all shadow-lg shadow-indigo-500/20"
              >
                <Download size={14} /> Import Skill
              </button>
            ) : (
              <div className="text-center py-2 px-4 bg-zinc-800/30 rounded-2xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Local Workflow
              </div>
            )}
          </div>
        ))}
        {filteredSkills.length === 0 && (
          <div className="col-span-full h-80 flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
            <Code size={64} className="opacity-10 mb-6" />
            <p className="text-sm font-bold uppercase tracking-widest opacity-50">No skills found</p>
            <p className="text-xs mt-2 opacity-30">Try a different search or browse external</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/10 rounded-xl text-indigo-500">
                    <Edit3 size={20} />
                  </div>
                  <h3 className="font-bold text-zinc-100">Edit Skill: {editingSkill.name}</h3>
                </div>
                <button onClick={() => setEditingSkill(null)} className="text-zinc-500 hover:text-zinc-300 transition-all"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Description</label>
                    <input 
                      type="text" 
                      value={editingSkill.description}
                      onChange={(e) => setEditingSkill({...editingSkill, description: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Tags (comma separated)</label>
                    <div className="relative">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        type="text" 
                        value={editingSkill.tags?.join(', ')}
                        onChange={(e) => setEditingSkill({...editingSkill, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-[400px]">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Skill Prompt</label>
                  <div className="flex-1 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
                    <Editor
                      height="100%"
                      defaultLanguage="markdown"
                      theme="vs-dark"
                      value={editingSkill.prompt}
                      onChange={(val) => setEditingSkill({...editingSkill, prompt: val || ''})}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex gap-3">
                <button 
                  onClick={() => setEditingSkill(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSkill}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Skill Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
