import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, RefreshCw, Lock, Unlock } from 'lucide-react';
import { motion } from 'motion/react';

export function RawDataView() {
  const [isLocked, setIsLocked] = useState(false);
  const [queries, setQueries] = useState<any[]>([
    { id: 1, type: 'SELECT', table: 'users', query: 'SELECT * FROM users WHERE active = true', performance: '1.2ms', status: 'OK' },
    { id: 2, type: 'UPDATE', table: 'materials', query: 'UPDATE materials SET quantity = 450 WHERE id = 1', performance: '4.5ms', status: 'OK' },
    { id: 3, type: 'INSERT', table: 'audit_logs', query: 'INSERT INTO audit_logs (id, event) VALUES (...)', performance: '0.8ms', status: 'OK' },
    { id: 4, type: 'DELETE', table: 'sessions', query: 'DELETE FROM sessions WHERE expired = true', performance: '2.1ms', status: 'OK' },
  ]);

  const toggleEmergencyLock = () => {
    setIsLocked(!isLocked);
    // In a real app, this would trigger a global state update or API call
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-black text-white italic tracking-tight">Raw Data Monitor</h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Real-time SQL/NoSQL Telemetry</p>
        </div>

        <button
          onClick={toggleEmergencyLock}
          className={`px-6 py-2.5 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase italic tracking-widest ${isLocked 
            ? 'bg-rose-600/20 text-rose-500 border border-rose-500/20' 
            : 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/20'}`}
        >
          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          {isLocked ? 'SYSTEM_LOCKED' : 'EMERGENCY_OVERRIDE_ARMED'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {queries.map((q) => (
          <div key={q.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black text-[10px] ${
                q.type === 'SELECT' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                q.type === 'UPDATE' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                q.type === 'INSERT' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {q.type}
              </div>
              <div>
                <p className="text-[11px] font-mono text-slate-300">{q.query}</p>
                <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Table: <span className="text-slate-300">{q.table}</span></p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-emerald-400">{q.performance}</p>
              <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest mt-1">{q.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
