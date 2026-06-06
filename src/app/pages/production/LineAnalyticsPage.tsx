import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFactory } from '../../context/FactoryContext';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowLeft, Activity, Target, Wrench, PackageX, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, LineChart, Line, ReferenceLine
} from 'recharts';

// ─── Dark analytic card ───────────────────────────────────────────────────────
interface AnalyticCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    sub?: string;
    accent?: 'green' | 'blue' | 'red' | 'yellow';
    pulse?: boolean;
}

function AnalyticCard({ icon, iconBg, label, value, sub, accent = 'blue', pulse }: AnalyticCardProps) {
    const accentText: Record<string, string> = {
        green: 'text-green-400', blue: 'text-blue-400',
        red: 'text-red-400', yellow: 'text-yellow-400',
    };
    return (
        <div className="relative bg-gray-900 border border-gray-700/60 rounded-xl p-5 overflow-hidden flex flex-col gap-3 shadow-lg">
            <div className={`absolute inset-0 opacity-[0.04] ${iconBg} rounded-xl`} />
            <div className="flex items-center justify-between relative">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
                <span className={`p-2 rounded-lg ${iconBg} bg-opacity-20`}>{icon}</span>
            </div>
            <div className="relative">
                <p className={`text-2xl font-bold tracking-tight ${accentText[accent]} ${pulse ? 'animate-pulse' : ''}`}>{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Demand vs Supply: generate 7-day forecast based on line's required materials ─
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const today = new Date();

function buildDemandSupplyData(requiredCount: number, currentStock: number) {
    const dailyDemand = requiredCount * 22; // 22 units/day target per material slot
    let stock = currentStock;
    return DAYS.map((day, i) => {
        const demand = dailyDemand + Math.round((Math.random() - 0.5) * dailyDemand * 0.2);
        const supply = i < 3 ? demand + Math.round(demand * 0.15) : demand - Math.round(demand * 0.08);
        stock = Math.max(0, stock - demand + supply);
        return { day, demand, supply, buffer: Math.max(0, stock) };
    });
}

export function LineAnalyticsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { productionLines, materials } = useFactory();
    const { t } = useLanguage();

    const line = productionLines.find(l => l.id === id);

    const analytics = useMemo(() => {
        if (!line) return null;

        // OEE for this line only
        const oee = line.efficiency;

        // Daily progress (mock: output vs 500 target)
        const TARGET = 500;
        const produced = line.output;

        // Status alerts
        const isDown = line.status === 'maintenance_requested';
        const underRepair = line.status === 'maintenance';

        // Material risk: materials this line uses that are critically low
        const lineMaterialIds = line.requiredMaterials.map(rm => rm.materialId);
        const riskMaterials = materials.filter(m =>
            lineMaterialIds.includes(m.id) &&
            m.minStock > 0 && m.quantity < m.minStock * 0.3
        );

        // Downtime
        const downtimeMin = line.downtimeRecord?.accumulatedMinutes ?? 0;
        const currentDownStart = line.downtimeRecord?.currentStartTime;
        const currentDownMin = currentDownStart
            ? Math.floor((Date.now() - currentDownStart) / 60000)
            : 0;
        const totalDown = downtimeMin + currentDownMin;

        // Demand vs supply chart data: use first required material
        const firstMat = line.requiredMaterials[0];
        const firstMatStock = materials.find(m => m.id === firstMat?.materialId)?.quantity ?? 200;
        const demandSupplyData = buildDemandSupplyData(line.requiredMaterials.length, firstMatStock);

        return { oee, TARGET, produced, isDown, underRepair, riskMaterials, totalDown, currentDownMin, demandSupplyData };
    }, [line, materials]);

    if (!line || !analytics) {
        return (
            <div className="p-8 bg-gray-900 min-h-full flex items-center justify-center">
                <p className="text-gray-400">{t('productionDetail.lineNotFound')}</p>
            </div>
        );
    }

    const maintenanceActive = analytics.isDown || analytics.underRepair;
    const progressPct = Math.min(100, Math.round((analytics.produced / analytics.TARGET) * 100));

    // Monthly loss chart: mock weekly buckets
    const lossData = [
        { week: 'W1', planned: 2400, lost: Math.round(analytics.totalDown * 0.25 + 30) },
        { week: 'W2', planned: 2400, lost: Math.round(analytics.totalDown * 0.3 + 20) },
        { week: 'W3', planned: 2400, lost: Math.round(analytics.totalDown * 0.2 + 45) },
        { week: 'W4', planned: 2400, lost: analytics.totalDown + Math.round(analytics.currentDownMin) },
    ];

    const totalMonthlyLoss = lossData.reduce((s, d) => s + d.lost, 0);

    return (
        <div className="p-8 bg-gray-900 min-h-full text-white">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(`/production-lines/${id}`)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('productionDetail.backToLines')} / {line.name}
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                            Liniya tahlili
                        </h1>
                        <p className="text-gray-400 mt-1">{line.name} — Real-time performance analytics</p>
                    </div>

                    {/* Tab nav buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => navigate(`/production-lines/${id}/live`)}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 px-4 py-2 rounded-lg"
                        >
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('productionDetail.liveProduction')}</span>
                        </Button>
                        <Button
                            onClick={() => navigate(`/production-lines/${id}/buffer`)}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 px-4 py-2 rounded-lg"
                        >
                            <span className="text-sm font-medium">{t('productionDetail.lineBuffer.button')}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── 4 Analytics Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {/* 1. OEE */}
                <AnalyticCard
                    icon={<Activity className="w-5 h-5 text-blue-400" />}
                    iconBg="bg-blue-500"
                    label="OEE — This Line"
                    value={`${analytics.oee}%`}
                    sub="Overall Equipment Effectiveness"
                    accent={analytics.oee >= 80 ? 'green' : analytics.oee >= 60 ? 'yellow' : 'red'}
                />

                {/* 2. Daily Target Progress */}
                <div className="relative bg-gray-900 border border-gray-700/60 rounded-xl p-5 shadow-lg flex flex-col gap-3">
                    <div className="absolute inset-0 opacity-[0.04] bg-green-500 rounded-xl" />
                    <div className="flex items-center justify-between relative">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Daily Target Progress</span>
                        <span className="p-2 rounded-lg bg-green-500 bg-opacity-20">
                            <Target className="w-5 h-5 text-green-400" />
                        </span>
                    </div>
                    <div className="relative">
                        <p className="text-2xl font-bold tracking-tight text-green-400">
                            {analytics.produced.toLocaleString()} / {analytics.TARGET.toLocaleString()}
                        </p>
                        <div className="mt-2 w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{progressPct}% of daily target</p>
                    </div>
                </div>

                {/* 3. Maintenance */}
                <AnalyticCard
                    icon={<Wrench className={`w-5 h-5 ${maintenanceActive ? 'text-red-400' : 'text-gray-400'}`} />}
                    iconBg={maintenanceActive ? 'bg-red-500' : 'bg-gray-500'}
                    label="Maintenance Status"
                    value={analytics.isDown ? '🔴 Line Down' : analytics.underRepair ? '🟡 Under Repair' : '✅ Operational'}
                    sub={analytics.totalDown > 0 ? `${analytics.totalDown} min downtime this session` : 'No downtime recorded'}
                    accent={maintenanceActive ? 'red' : 'green'}
                    pulse={maintenanceActive}
                />

                {/* 4. Material Risk */}
                <AnalyticCard
                    icon={<PackageX className={`w-5 h-5 ${analytics.riskMaterials.length > 0 ? 'text-yellow-400' : 'text-gray-400'}`} />}
                    iconBg={analytics.riskMaterials.length > 0 ? 'bg-yellow-500' : 'bg-gray-500'}
                    label="Material Availability Risk"
                    value={analytics.riskMaterials.length > 0 ? `${analytics.riskMaterials.length} Part(s) Critical` : 'All Stocked'}
                    sub="Materials for this line below 30% threshold"
                    accent={analytics.riskMaterials.length > 0 ? 'yellow' : 'green'}
                    pulse={analytics.riskMaterials.length > 0}
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Demand vs Supply — Next 7 Days */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <div>
                            <h3 className="text-sm font-semibold text-white">Demand vs Supply — Next 7 Days</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Component requirements for {line.name}</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={analytics.demandSupplyData} barSize={18} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: 11, color: '#9ca3af', paddingTop: 8 }}
                            />
                            <Bar dataKey="demand" name="Demand (units)" fill="#60a5fa" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="supply" name="Supply (units)" fill="#34d399" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Line Loss Analysis */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-red-400" />
                            <div>
                                <h3 className="text-sm font-semibold text-white">Monthly Line Loss Analysis</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Downtime per week — {line.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Total Loss</p>
                            <p className="text-lg font-bold text-red-400">{totalMonthlyLoss} min</p>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={lossData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} unit=" min" />
                            <Tooltip
                                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
                                formatter={(v: number) => [`${v} min`, 'Downtime']}
                            />
                            <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '1h threshold', fill: '#f59e0b', fontSize: 10 }} />
                            <Line type="monotone" dataKey="lost" name="Downtime (min)" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>

                    {/* Weekly breakdown */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                        {lossData.map(d => (
                            <div key={d.week} className="text-center p-2 rounded-lg bg-gray-900/50 border border-gray-700/50">
                                <p className="text-[10px] text-gray-500">{d.week}</p>
                                <p className={`text-sm font-bold mt-0.5 ${d.lost > 60 ? 'text-red-400' : d.lost > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                                    {d.lost} min
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
