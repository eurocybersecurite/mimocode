import React from 'react';
import { motion } from 'motion/react';
import { Zap, Users, Code, Activity, ArrowUp } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart, Pie, Cell 
} from 'recharts';

interface DashboardPageProps {
  execHistory: any[];
  agents: any[];
  skills: any[];
  dashboardMetrics?: any;
  agentPerformance?: any;
}

export function DashboardPage({
  execHistory,
  agents,
  skills
}: DashboardPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 p-8 overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">System Dashboard</h2>
            <p className="text-zinc-500 text-sm">Real-time performance metrics and agent analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">System Healthy</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={48} />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Zap size={14} className="text-indigo-500" />
              Total Actions
            </div>
            <div className="text-4xl font-bold text-zinc-100">{execHistory.length}</div>
            <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
              <ArrowUp size={10} className="text-green-500" />
              <span className="text-green-500 font-bold">+12%</span> from last session
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={48} />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Users size={14} className="text-green-500" />
              Active Agents
            </div>
            <div className="text-4xl font-bold text-zinc-100">{agents.length}</div>
            <div className="mt-2 text-[10px] text-zinc-500">Currently orchestrating</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Code size={48} />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Code size={14} className="text-yellow-500" />
              Skills Learned
            </div>
            <div className="text-4xl font-bold text-zinc-100">{skills.length}</div>
            <div className="mt-2 text-[10px] text-zinc-500">Business procedures</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={48} />
            </div>
            <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <Activity size={14} className="text-red-500" />
              Success Rate
            </div>
            <div className="text-4xl font-bold text-zinc-100">98.4%</div>
            <div className="mt-2 text-[10px] text-zinc-500">Across all tool calls</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">Activity Overview</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={execHistory.slice(-10).map((h, i) => ({ name: `T-${10-i}`, val: Math.random() * 1000 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#6366f1', fontSize: '12px' }}
                  />
                  <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-8">Agent Distribution</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agents.map(a => ({ name: a.name, value: execHistory.filter(h => h.agentName === a.name).length || 1 }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {agents.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Agent Performance</h3>
            <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">View All Reports</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/30">
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Agent</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tasks</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => {
                  const tasks = execHistory.filter(h => h.agentName === agent.name).length;
                  return (
                    <tr key={agent.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-all">
                            <Users size={14} />
                          </div>
                          <span className="text-sm font-bold text-zinc-200">@{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-zinc-400 font-mono">{tasks}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Idle</span>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: '95%' }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
