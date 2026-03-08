import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Play, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function DevTerminal() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newEntry = {
      id: Date.now(),
      command: input,
      timestamp: new Date().toLocaleTimeString(),
      output: `Executing: ${input}\nStatus: Simulation successful.\nResult: COMMAND_LOGGED_AND_QUEUED`,
      type: 'success'
    };

    setHistory(prev => [...prev, newEntry]);
    setInput('');
  };

  return (
    <div className="bg-slate-950/80 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[500px]">
      <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <TerminalIcon className="w-4 h-4" />
          </div>
          <p className="text-xs font-black text-white uppercase italic tracking-widest">IT Specialist Terminal</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setHistory([])} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-rose-500 transition-colors">
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-4">
        <div className="text-emerald-500/60 leading-relaxed">
          Welcome to FactoryOS v4.0.1 Terminal.<br />
          Root access granted. System integrity verified.<br />
          Type 'help' for available commands.
        </div>

        <AnimatePresence initial={false}>
          {history.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-1 bg-white/5 p-3 rounded-xl border border-white/5"
            >
              <div className="flex items-center justify-between text-[9px] text-slate-500">
                 <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-indigo-500" />
                    <span className="font-bold text-slate-300">{entry.command}</span>
                 </div>
                 <span>{entry.timestamp}</span>
              </div>
              <pre className="text-emerald-400/80 whitespace-pre-wrap">{entry.output}</pre>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleExecute} className="p-4 bg-slate-900/50 border-t border-white/5">
        <div className="relative group">
          <ChevronRight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 pl-10 pr-12 text-[11px] font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
            placeholder="Kompayer buyruqlarini kiriting..."
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>
        </div>
      </form>
    </div>
  );
}
