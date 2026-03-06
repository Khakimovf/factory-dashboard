import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Utensils, Users, Clock, Moon, Sun, ArrowRight, Beef, Wheat, Activity, ChefHat, CheckCircle2, DollarSign, TrendingDown, Info, Flame, Shell, Coffee, Salad, Soup, LockIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { generateMockTurnstileLogs } from '../../services/attendanceService';
import { toast } from 'sonner';

const todaySpecial = {
  name: "Zirvakli Osh (Plov)",
  cals: 850,
  allergens: ["None"],
  image: "🍲"
};

const weeklyMenu = [
  { day: 'Dush (Mon)', dish: 'Mastava', icon: <Soup className="w-5 h-5 text-amber-500" /> },
  { day: 'Sesh (Tue)', dish: 'Qovurma Lag\'mon', icon: <Utensils className="w-5 h-5 text-rose-500" /> },
  { day: 'Chor (Wed)', dish: 'Osh (Plov)', icon: <Flame className="w-5 h-5 text-orange-500" /> },
  { day: 'Pay (Thu)', dish: 'Manti', icon: <Shell className="w-5 h-5 text-slate-300" /> },
  { day: 'Jum (Fri)', dish: 'Somsa & Sho\'rva', icon: <Coffee className="w-5 h-5 text-amber-600" /> },
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
    // Simulate live entry feed pulsing
    const pulseTimer = setInterval(() => {
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 800);
    }, 4000);
    return () => clearInterval(pulseTimer);
  }, []);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const isLocked = currentHour >= 9 && currentMinute >= 1; // Locked after 09:01

  // Final count calculation
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

  // Cost & Savings Math
  const costPerMeal = 25000; // UZS
  const estCost = viewNightShift ? (nightCount * costPerMeal) : (finalCount * costPerMeal);
  const totalEmployeesRegistered = 930 + 120; // Example: Day + Night
  const absentOrNotEating = totalEmployeesRegistered - (viewNightShift ? nightCount : finalCount);
  const savings = absentOrNotEating * costPerMeal;

  // Meal Waves
  const waves = [
    { id: 1, time: '11:30', name: 'Wave 1: Assembly Lines A & B', target: new Date(), max: 550, current: 412 },
    { id: 2, time: '12:15', name: 'Wave 2: Logistics & Administration', target: new Date(), max: 350, current: 0 },
    { id: 3, time: '13:00', name: 'Wave 3: Quality & Engineering', target: new Date(), max: 115, current: 0 }
  ];
  waves[0].target.setHours(11, 30, 0, 0);
  waves[1].target.setHours(12, 15, 0, 0);
  waves[2].target.setHours(13, 0, 0, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(amount);
  };

  const handleGenerateOrder = () => {
    toast.success("Production Order Finalized", { description: "100% Locked. Sent to Chef's KDS." });
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

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_4fr_3fr] gap-6 lg:gap-8 w-full">

        {/* ─── LEFT COLUMN: LIVE ENTRY & HEATMAP (30%) ─── */}
        <div className="flex flex-col gap-6 h-full">

          {/* Live Entry Feed */}
          <div className={`flex-1 border border-slate-800 bg-slate-900/60 rounded-3xl p-6 flex flex-col relative overflow-hidden transition-all duration-500 ${livePulse ? 'shadow-[0_0_30px_rgba(6,182,212,0.15)] border-cyan-500/30' : 'shadow-xl'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <Activity className={`w-4 h-4 ${livePulse ? 'text-cyan-400 animate-ping' : 'text-emerald-500'}`} />
                Live Entry Feed
              </h3>
              <Badge className="bg-cyan-500/10 text-cyan-400 font-mono text-[9px] uppercase font-black">Face ID Synced</Badge>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10 max-h-[400px]">
              {turnstileLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-cyan-500/20 hover:bg-slate-900/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Users className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">EMP-{log.employeeId}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Main Turnstile</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-400">{log.timestamp.slice(11, 19)}</p>
                </div>
              ))}
            </div>
            {/* Fade out bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none" />
          </div>

          {/* simple heatmap mockup */}
          <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">Capacity Heatmap</h3>
            <div className="grid grid-cols-10 gap-1 lg:gap-1.5">
              {Array.from({ length: 80 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-[2px] ${Math.random() > 0.3 ? 'bg-cyan-500/80' : 'bg-slate-800'}`} />
              ))}
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-500" /> Present in Factory</span>
              <span className="text-[10px] font-black text-white">845 / 930</span>
            </div>
          </div>

        </div>

        {/* ─── MIDDLE COLUMN: CORE DATA (40%) ─── */}
        <div className="flex flex-col gap-6 h-full">

          {/* Predictive Planning Card */}
          <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 border-b border-slate-800/50 pb-4">
                <div>
                  <h3 className="text-lg lg:text-xl font-black uppercase tracking-widest flex items-center gap-2 text-white">
                    {viewNightShift ? <Moon className="w-6 h-6 text-indigo-400" /> : <Sun className="w-6 h-6 text-amber-500" />}
                    {viewNightShift ? 'Tungi Smena Rejasi' : 'Kunduzgi Smena Rejasi'}
                  </h3>
                  {!viewNightShift && (
                    <div className="mt-3 flex items-center gap-2">
                      {isLocked ? (
                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase font-black px-3 py-1.5 flex items-center gap-1.5"><LockIcon className="w-3 h-3" /> AUTO-LOCKED AT 09:01</Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 font-mono text-[10px] uppercase font-black px-3 py-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3 animate-pulse" /> PREDICTING (Closes 09:00)</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8 flex-1">
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 lg:p-5 text-center flex flex-col items-center justify-center">
                  <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-500 mb-2">09:00 Present</p>
                  <p className="text-3xl lg:text-5xl font-black text-white">{viewNightShift ? '-' : presentAt9}</p>
                </div>
                <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-4 lg:p-5 text-center flex flex-col items-center justify-center">
                  <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Handover/Buffer</p>
                  <p className="text-2xl lg:text-4xl font-black text-cyan-400">+{viewNightShift ? '10%' : '120 + 5%'}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 lg:p-5 text-center shadow-[0_0_30px_rgba(245,158,11,0.1)] flex flex-col items-center justify-center">
                  <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-amber-500 mb-2">Final Count</p>
                  <p className="text-4xl lg:text-6xl font-black text-amber-400 tracking-tighter">{viewNightShift ? nightCount : finalCount}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-3xl font-black text-white tracking-tight flex items-center flex-wrap">TAYYORLANISHI KERAK: <span className="text-amber-500 ml-2">{viewNightShift ? nightCount : finalCount} PORTSIYA</span></p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Validated Production Order (VPO)</p>
                </div>
                <Button disabled={!isLocked && !viewNightShift} onClick={handleGenerateOrder} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-xl h-14 px-8 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:shadow-none transition-all">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> {isLocked || viewNightShift ? 'Commit Order' : 'Waiting...'}
                </Button>
              </div>
            </div>
          </div>

          {/* Inventory Bridge & Financial Impact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 w-full">

            {/* Inventory Link */}
            <div className="border border-slate-800 bg-slate-900/60 shadow-xl rounded-3xl p-6 flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800 pb-3"><Utensils className="w-4 h-4 text-rose-500" /> ERP Inventory Bridge</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Beef className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Meat Req (150g/p)</span>
                  </div>
                  <span className="text-lg font-black text-white">{viewNightShift ? reqNightMeat : reqMeat} kg</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Wheat className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Rice Req (120g/p)</span>
                  </div>
                  <span className="text-lg font-black text-white">{viewNightShift ? reqNightRice : reqRice} kg</span>
                </div>
              </div>
              <Button className="mt-auto w-full bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl h-10 border border-slate-700">
                Check Warehouse <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Financial Impact */}
            <div className="border border-slate-800 bg-slate-900/60 shadow-xl rounded-3xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-emerald-900/10 rounded-full blur-[40px] pointer-events-none" />
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800 pb-3 relative z-10"><DollarSign className="w-4 h-4 text-emerald-500" /> Financial Impact</h3>

              <div className="flex-1 flex flex-col justify-center space-y-4 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Estimated Cost (Today)</p>
                  <p className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(estCost)}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Waste Savings</p>
                  </div>
                  <p className="text-xs font-bold text-emerald-300 leading-relaxed">
                    Today we saved <span className="text-white font-black">{absentOrNotEating} portions</span> ({formatCurrency(savings)}) due to highly accurate Face ID syncing instead of estimating blindly.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: WAVES & MENU (30%) ─── */}
        <div className="flex flex-col gap-6 w-full h-full">

          {/* Interactive Meal Waves */}
          <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden flex-1">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-900/10 rounded-full blur-[60px] pointer-events-none" />
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800/50 pb-4 relative z-10"><Clock className="w-5 h-5 text-indigo-400" /> Live Meal Waves</h3>

            <div className="flex-1 space-y-5 relative z-10">
              {viewNightShift ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-500 text-center">Tungi Smena: Bitta To'lqin (23:30 - 01:00)</p>
                </div>
              ) : (
                waves.map((w, i) => {
                  const progress = w.current > 0 ? (w.current / w.max) * 100 : 0;
                  const isActive = currentTime.getTime() >= w.target.getTime() - 1800000 && currentTime.getTime() < w.target.getTime() + 5400000; // Active within a 2 hr window

                  return (
                    <div key={w.id} className={`p-4 rounded-2xl border ${isActive ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-950/50 border-slate-800'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>{w.time}</p>
                          <p className={`text-xs font-bold mt-1 ${isActive ? 'text-white' : 'text-slate-400'}`}>{w.name}</p>
                        </div>
                        <Badge className={`font-mono text-[9px] uppercase font-black px-2 ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                          {w.current}/{w.max} people finished eating
                        </Badge>
                      </div>
                      {/* Animated Progress Bar */}
                      <div className={`w-full h-3 rounded-full overflow-hidden ${isActive ? 'bg-slate-800' : 'bg-slate-900'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-1000 relative overflow-hidden ${isActive ? 'bg-indigo-500' : 'bg-slate-700'}`}
                          style={{ width: `${Math.max(progress, 2)}%` }} // Show at least a tiny sliver so it's not invisible
                        >
                          {isActive && progress > 0 && progress < 100 && (
                            <div className="absolute inset-0 w-full h-full bg-white/20 animate-[wave_2s_linear_infinite]"
                              style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Weekly Menu & Nutrition */}
          <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl rounded-3xl p-6 lg:p-8 flex flex-col relative overflow-hidden">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white mb-6 border-b border-slate-800/50 pb-4 relative z-10"><Salad className="w-5 h-5 text-emerald-500" /> Food & Nutrition</h3>

            {/* Today's Special */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 mb-6 shadow-inner relative overflow-hidden">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <Badge className="bg-rose-500/20 text-rose-400 font-mono text-[9px] uppercase font-black px-2 mb-3">TODAY'S SPECIAL</Badge>
                  <h4 className="text-2xl font-black text-white tracking-tight mb-2">{todaySpecial.name}</h4>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" /> {todaySpecial.cals} kCal</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-400" /> Allergen: {todaySpecial.allergens.join(', ')}</span>
                  </div>
                </div>
                <span className="text-5xl">{todaySpecial.image}</span>
              </div>
            </div>

            {/* Horizontal Scroll Menu */}
            <div className="mt-auto">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Next 5 Days (Preview)</p>
              <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar snap-x">
                {weeklyMenu.map((day, i) => (
                  <div key={i} className="min-w-[120px] p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center snap-center hover:border-slate-700 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3">
                      {day.icon}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{day.day}</p>
                    <p className="text-xs font-bold text-slate-300">{day.dish}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      <style>{`
         @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
         }
         @keyframes wave {
            0% { background-position: 1rem 0; }
            100% { background-position: 0 0; }
         }
         .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
            width: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5); 
            border-radius: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(71, 85, 105, 0.5); 
            border-radius: 4px;
         }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(100, 116, 139, 0.8); 
         }
      `}</style>
    </div>
  );
}

