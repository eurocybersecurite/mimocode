import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Code, Trash2, Play, Edit3, Save, Tag, RefreshCw } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

interface Skill {
  name: string;
  description: string;
  prompt?: string;
  tags?: string[];
}

interface SkillsPageProps {
  skillSearchTerm: string;
  setSkillSearchTerm: (val: string) => void;
  skills: Skill[];
  setConfirmDeleteSkill: (name: string) => void;
  handleRunSkill: (name: string) => void;
  fetchSkills: () => void;
}

export function SkillsPage({
  skillSearchTerm,
  setSkillSearchTerm,
  skills,
  setConfirmDeleteSkill,
  handleRunSkill,
  fetchSkills
}: SkillsPageProps) {
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredSkills = skills.filter(s => 
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
      className="h-full p-6 overflow-y-auto"
    >
      <div className="mb-6 relative w-full md:w-96">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search skills..." 
          value={skillSearchTerm}
          onChange={(e) => setSkillSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSkills.map((skill) => (
          <div key={skill.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-zinc-700 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-yellow-600/10 rounded-xl text-yellow-500">
                <Code size={20} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingSkill(skill)}
                  className="p-1.5 hover:bg-indigo-500/10 rounded-lg text-zinc-500 hover:text-indigo-500"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={() => setConfirmDeleteSkill(skill.name)}
                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-zinc-100 mb-1">{skill.name}</h3>
            <p className="text-xs text-zinc-500 line-clamp-2 mb-4 flex-1">{skill.description || 'No description provided.'}</p>
            
            <div className="flex flex-wrap gap-1 mb-6">
              {skill.tags?.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-400 font-medium">#{tag}</span>
              ))}
            </div>

            <button 
              onClick={() => handleRunSkill(skill.name)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-yellow-600 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition-all"
            >
              <Play size={12} /> Execute Skill
            </button>
          </div>
        ))}
        {filteredSkills.length === 0 && (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-zinc-600">
            <Code size={48} className="opacity-20 mb-4" />
            <p className="text-sm font-medium">No skills found</p>
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
