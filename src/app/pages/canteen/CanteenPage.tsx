import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Utensils, Users, Clock, Moon, Sun, ArrowRight, Beef, Wheat, Activity, ChefHat, CheckCircle2, DollarSign, TrendingDown, Info, Flame, Shell, Coffee, Salad, Soup, LockIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { generateMockTurnstileLogs } from '../../services/attendanceService';
import { toast } from 'sonner';

const menu = {
  firstMeal: "Mastava (Suyuq)",
  secondMeal: "Zirvakli Osh (Plov)",
  cals: 1050,
  allergens: ["Gluten", "Rice"],
};

const weeklyMenu = [
  { day: 'Dush (Mon)', dish: 'Mastava & Sho\'rva', icon: <Soup className="w-5 h-5 text-amber-500" /> },
  { day: 'Sesh (Tue)', dish: 'Soup & Lag\'mon', icon: <Utensils className="w-5 h-5 text-rose-500" /> },
  { day: 'Chor (Wed)', dish: 'Soup & Osh', icon: <Flame className="w-5 h-5 text-orange-500" /> },
  { day: 'Pay (Thu)', dish: 'Soup & Manti', icon: <Shell className="w-5 h-5 text-slate-300" /> },
  { day: 'Jum (Fri)', dish: 'Soup & Somsa', icon: <Coffee className="w-5 h-5 text-amber-600" /> },
];

export function CanteenPage() {
  const { t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewNightShift, setViewNightShift] = useState(false);
  const [turnstileLogs, setTurnstileLogs] = useState(() => generateMockTurnstileLogs().slice(0, 15));
  const [livePulse, setLivePulse] = useState(false);

  // 1. Time logic & Live Pulse Simulation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 800);
    }, 4000);
    return () => clearInterval(pulseTimer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const isLocked = currentHour >= 9 && currentMinute >= 1;

  // Final count calculation
  const presentAt9 = 845;
  const nightHandover = 120;
  const buffer = 0.05;
  const finalCount = Math.floor((presentAt9 + nightHandover) * (1 + buffer));
  const nightCount = Math.floor(nightHandover * 1.1);
  const activeCount = viewNightShift ? nightCount : finalCount;

  // Inventories (per portion combined)
  const reqMeat = (activeCount * 0.25).toFixed(1); // Increased for 2 meals
  const reqRice = (activeCount * 0.18).toFixed(1);
  const reqOil = (activeCount * 0.03).toFixed(1);

  const waves = [
    { id: 1, time: '11:30', name: 'Wave 1: Assembly Lines A & B', target: new Date(), max: 550, current: 412 },
    { id: 2, time: '12:15', name: 'Wave 2: Logistics & Administration', target: new Date(), max: 350, current: 0 },
    { id: 3, time: '13:00', name: 'Wave 3: Quality & Engineering', target: new Date(), max: 115, current: 0 }
  ];
  waves[0].target.setHours(11, 30, 0, 0);
  waves[1].target.setHours(12, 15, 0, 0);
  waves[2].target.setHours(13, 0, 0, 0);

  const handleGenerateOrder = () => {
    toast.success("Production Order Finalized", { description: "Dual-Meal VPO Locked. Sent to Chef." });
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-500 bg-slate-950 text-slate-300 pb-24 overflow-x-hidden w-full mx-auto">

      {/* Top Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 w-full">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <ChefHat className="w-8 h-8 lg:w-10 lg:h-10 text-amber-500" />
            Canteen War Room
          </h2>
          <p className="text-xs lg:text-sm font-bold uppercase tracking-widest text-slate-500 mt-1">SAP Food & Resource Planning (FRP)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-full items-center shadow-inner">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4">Active Shift:</span>
            <button onClick={() => setViewNightShift(false)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!viewNightShift ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-slate-400 hover:text-white'}`}>Kunduzgi (Day)</button>
            <button onClick={() => setViewNightShift(true)} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewNightShift ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-slate-400 hover:text-white'}`}>Tungi (Night)</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 w-full">

        {/* ─── LEFT COLUMN: LIVE ENTRY & INVENTORY ─── */}
        <div className="flex flex-col gap-8 h-full">

          {/* Live Entry Feed - Expanded */}
          <div className={`flex-1 border border-slate-800 bg-slate-900/60 rounded-3xl p-6 flex flex-col relative overflow-hidden transition-all duration-500 ${livePulse ? 'shadow-[0_0_30px_rgba(6,182,212,0.15)] border-cyan-500/30' : 'shadow-xl'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <Activity className={`w-4 h-4 ${livePulse ? 'text-cyan-400 animate-ping' : 'text-emerald-500'}`} />
                Live Entry Feed
              </h3>
              <Badge className="bg-cyan-500/10 text-cyan-400 font-mono text-[9px] uppercase font-black">Turnstile Synced</Badge>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10">
              {turnstileLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-cyan-500/20 hover:bg-slate-900/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">EMP-{log.employeeId}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Main Gate Turnstile</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-400">{log.timestamp.slice(11, 19)}</p>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none" />
          </div>

          {/* ERP Inventory Bridge - Free Space Utilization */}
          <div className="border border-slate-800 bg-slate-900/60 shadow-xl rounded-3xl p-6 flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800 pb-3"><Wheat className="w-4 h-4 text-emerald-500" /> ERP Inventory Bridge</h3>
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Beef className="w-5 h-5 text-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Meat Req</span>
                </div>
                <span className="text-lg font-black text-white">{reqMeat} kg</span>
              </div>
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Rice Req</span>
                </div>
                <span className="text-lg font-black text-white">{reqRice} kg</span>
              </div>
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <Shell className="w-5 h-5 text-cyan-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Oil Req</span>
                </div>
                <span className="text-lg font-black text-white">{reqOil} kg</span>
              </div>
            </div>
            <p className="text-[9px] font-black p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-emerald-400/80 uppercase tracking-widest text-center mb-4">Calculation based on 1st & 2nd meals combined</p>
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-11 border border-slate-700 shadow-lg">
              Check Warehouse Stocks <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: REJASI & WAVES (Expanded) ─── */}
        <div className="flex flex-col gap-8 h-full">

          {/* Predictive Planning Card - Main Focus */}
          <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6 border-b border-slate-800/50 pb-4">
                <div>
                  <h3 className="text-xl lg:text-2xl font-black uppercase tracking-widest flex items-center gap-2 text-white italic">
                    {viewNightShift ? <Moon className="w-6 h-6 text-indigo-400" /> : <Sun className="w-6 h-6 text-amber-500" />}
                    {viewNightShift ? 'Tungi Smena Rejasi' : 'Kunduzgi Smena Rejasi'}
                  </h3>
                  <div className="mt-3 flex items-center gap-3">
                    <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase font-black px-3 py-1.5 flex items-center gap-1.5"><LockIcon className="w-3 h-3" /> SAP-FRP LOCKED</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">JAMI PORSIYA</p>
                  <p className="text-4xl lg:text-6xl font-black text-white">{activeCount}</p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">1-OVQAT</p>
                  <p className="text-4xl lg:text-6xl font-black text-emerald-500">{activeCount}</p>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-center shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">2-OVQAT</p>
                  <p className="text-4xl lg:text-6xl font-black text-emerald-500">{activeCount}</p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-center bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase">Wait Time</p>
                      <p className="text-sm font-black text-white tracking-widest">4.2m</p>
                    </div>
                    <p className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">
                      TAYYORLANISHI KERAK: <span className="text-amber-500 underline decoration-amber-500/30 underline-offset-8">{activeCount} PORTSIYA</span>
                    </p>
                  </div>
                </div>
                <Button onClick={handleGenerateOrder} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl h-16 px-10 shadow-lg active:scale-95 transition-all">
                  <CheckCircle2 className="w-6 h-6 mr-2" /> SEND TO PRODUCTION
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {/* Live Meal Waves - Free Space Utilization */}
            <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[60px] pointer-events-none" />
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800/50 pb-4 relative z-10"><Clock className="w-5 h-5 text-indigo-400" /> Live Meal Waves</h3>
              <div className="space-y-5">
                {waves.map((w) => {
                  const progress = (w.current / w.max) * 100;
                  return (
                    <div key={w.id} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                      <div className="flex justify-between items-center mb-2.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{w.time} | {w.name}</p>
                        <span className="text-[10px] font-black text-emerald-500">{w.current}/{w.max}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Food & Nutrition - Dual Meal Logic */}
            <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800/50 pb-4 relative z-10"><Salad className="w-5 h-5 text-emerald-500" /> Food & Nutrition</h3>
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5">1-OVQAT (Suyuq)</p>
                  <p className="text-xl font-black text-white italic uppercase tracking-tight">{menu.firstMeal}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5">2-OVQAT (Quyuq)</p>
                  <p className="text-xl font-black text-white italic uppercase tracking-tight">{menu.secondMeal}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-auto">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex-1 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase">KCAL</p>
                  <p className="text-sm font-black text-white">{menu.cals}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex-1 text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase">Allergens</p>
                  <p className="text-sm font-black text-white">{menu.allergens[0]}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
         .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 4px; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.5); border-radius: 4px; }
      `}</style>
    </div>
  );
}

