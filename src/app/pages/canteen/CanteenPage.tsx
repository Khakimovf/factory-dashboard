import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Utensils, Users, Clock, Moon, Sun, ArrowRight, Beef, Wheat, Activity, ChefHat, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { generateMockTurnstileLogs } from '../../services/attendanceService';
import { toast } from 'sonner';

export function CanteenPage() {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewNightShift, setViewNightShift] = useState(false);
  const [turnstileLogs] = useState(() => generateMockTurnstileLogs().slice(0, 10)); // For live ticker

  // 1. Time & Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const isLocked = currentHour >= 9 && currentMinute >= 1; // Locked after 09:01

  // Final count calculation (mocked for demo)
  const presentAt9 = 845;
  const nightHandover = 120;
  const buffer = 0.05; // 5%
  const finalCount = Math.floor((presentAt9 + nightHandover) * (1 + buffer));
  const nightCount = Math.floor(nightHandover * 1.1);

  // Inventories (per portion): Meat 0.150kg, Rice 0.120kg
  const reqMeat = (finalCount * 0.15).toFixed(1);
  const reqRice = (finalCount * 0.12).toFixed(1);

  const reqNightMeat = (nightCount * 0.15).toFixed(1);
  const reqNightRice = (nightCount * 0.12).toFixed(1);

  // Wave Logic
  const waves = [
    { id: 1, time: '11:30', name: 'Wave 1: Assembly Lines A & B', target: new Date() },
    { id: 2, time: '12:15', name: 'Wave 2: Logistics & Administration', target: new Date() }
  ];

  // Setup wave dates based on today
  waves[0].target.setHours(11, 30, 0, 0);
  waves[1].target.setHours(12, 15, 0, 0);

  const getNextWave = () => {
    if (currentTime < waves[0].target) return waves[0];
    if (currentTime < waves[1].target) return waves[1];
    return null;
  };

  const nextWave = getNextWave();
  let countdown = "00:00:00";
  if (nextWave) {
    const diff = nextWave.target.getTime() - currentTime.getTime();
    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    countdown = `${h}:${m}:${s}`;
  }

  const handleGenerateOrder = () => {
    toast.success("Production Order Generated", { description: "Sent to Kitchen Display System." });
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans transition-colors duration-500 bg-slate-950 text-slate-300 pb-24">
      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-amber-500" />
            SAP Food & Resource Planning
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-1">Canteen Operations & Inventory Cockpit</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-full items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3">View:</span>
            <button onClick={() => setViewNightShift(false)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!viewNightShift ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Kunduzgi (Day)</button>
            <button onClick={() => setViewNightShift(true)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewNightShift ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Tungi (Night)</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* LIVE ENTRY STREAM TICKER */}
        <div className="h-12 border border-slate-800 bg-slate-900/50 rounded-xl flex items-center px-4 overflow-hidden relative">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-800 shrink-0 z-10 bg-slate-900/80">
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Entry</span>
          </div>
          <div className="flex gap-8 px-4 animate-[marquee_20s_linear_infinite] whitespace-nowrap overflow-hidden min-w-[200%]">
            {turnstileLogs.map((log, i) => (
              <span key={i} className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                EMP-{log.employeeId} <span className="text-slate-600">passed turnstile at {log.timestamp.slice(11, 19)}</span>
              </span>
            ))}
            {/* duplicate for seamless loop */}
            {turnstileLogs.map((log, i) => (
              <span key={`dup-${i}`} className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                EMP-{log.employeeId} <span className="text-slate-600">passed turnstile at {log.timestamp.slice(11, 19)}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 1. PREDICTIVE PLANNING WIDGET */}
          <div className="col-span-1 lg:col-span-2 border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 sm:p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-900/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 border-b border-slate-800/50 pb-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-white">
                    {viewNightShift ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                    {viewNightShift ? 'Tungi Smena Rejasi' : 'Kunduzgi Smena Rejasi (Day Shift)'}
                  </h3>
                  {/* Lock Status */}
                  {!viewNightShift && (
                    <div className="mt-2 flex items-center gap-2">
                      {isLocked ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 font-mono text-[10px] uppercase font-black px-2.5 py-1">LOCKED (09:01)</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-500 font-mono text-[10px] uppercase font-black px-2.5 py-1">PREDICTING (Closes 09:00)</Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Current Logic</p>
                  <p className="text-xs font-bold text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 relative z-20">
                    Present + Night Handover + 5% Buffer
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">09:00 Present</p>
                  <p className="text-3xl font-black text-white">{viewNightShift ? '-' : presentAt9}</p>
                </div>
                <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Handover/Buffer</p>
                  <p className="text-3xl font-black text-amber-500">+{viewNightShift ? '10%' : '120 + 5%'}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Final Count</p>
                  <p className="text-4xl font-black text-amber-400">{viewNightShift ? nightCount : finalCount}</p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-800/50 flex justify-between items-center">
                <div>
                  <p className="text-xl font-black text-white tracking-tight">TAYYORLANISHI KERAK: <span className="text-amber-500">{viewNightShift ? nightCount : finalCount} PORTSIYA</span></p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Chef's Production Order • Auto-generated based on Turnstile Data</p>
                </div>
                <Button disabled={!isLocked && !viewNightShift} onClick={handleGenerateOrder} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-12 px-6 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:shadow-none">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> {isLocked || viewNightShift ? 'Send Order to Kitchen' : 'Waiting for Lock-in'}
                </Button>
              </div>
            </div>
          </div>

          {/* 2. SHIFT-BASED DISTRIBUTION (WAVES) */}
          <div className="col-span-1 border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 sm:p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[60px] pointer-events-none" />
            <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800/50 pb-4 relative z-10"><Clock className="w-5 h-5 text-indigo-400" /> Meal Waves</h3>

            <div className="flex-1 flex flex-col justify-center relative z-10">
              {nextWave && !viewNightShift ? (
                <div className="text-center mb-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Countdown to {nextWave.name}</p>
                  <p className="text-5xl font-mono font-black text-white tracking-tighter drop-shadow-lg">{countdown}</p>
                </div>
              ) : (
                <div className="text-center mb-8">
                  {viewNightShift ? (
                    <p className="text-lg font-black uppercase tracking-widest text-slate-500">Tungi smena oraliq ovqatlanish vachi (23:00 / 03:00)</p>
                  ) : (
                    <p className="text-lg font-black uppercase tracking-widest text-slate-500">All Lunch Waves Completed</p>
                  )}
                </div>
              )}

              {!viewNightShift && (
                <div className="space-y-3">
                  {waves.map((w, i) => (
                    <div key={w.id} className={`p-4 rounded-2xl border flex items-center justify-between ${nextWave?.id === w.id ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-slate-950/50 border-slate-800'}`}>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${nextWave?.id === w.id ? 'text-indigo-400' : 'text-slate-500'}`}>{w.time}</p>
                        <p className={`text-sm font-bold mt-0.5 ${nextWave?.id === w.id ? 'text-white' : 'text-slate-400'}`}>{w.name}</p>
                      </div>
                      {currentTime > w.target && nextWave?.id !== w.id && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 font-mono text-[9px] uppercase font-black px-2 mt-2">Finished</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. INVENTORY INTEGRATION */}
          <div className="col-span-1 lg:col-span-3 border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-900/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex-1 relative z-10 w-full">
              <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2 text-white mb-2"><Utensils className="w-5 h-5 text-rose-500" /> ERP Inventory Bridge</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Canteen Warehouse Required Resources</p>
            </div>

            <div className="flex-1 flex gap-4 w-full relative z-10">
              <div className="flex-1 bg-slate-950/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Beef className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Meat Requirement</p>
                  <p className="text-2xl font-black text-white">{viewNightShift ? reqNightMeat : reqMeat} kg</p>
                </div>
              </div>

              <div className="flex-1 bg-slate-950/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Wheat className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rice / Carb Req.</p>
                  <p className="text-2xl font-black text-white">{viewNightShift ? reqNightRice : reqRice} kg</p>
                </div>
              </div>
            </div>

            <Button className="w-full md:w-auto mt-4 md:mt-0 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-12 px-6 border border-slate-700 relative z-10">
              View Warehouse Map <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>
      </div>

      <style>{`
         @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
         }
      `}</style>
    </div>
  );
}
