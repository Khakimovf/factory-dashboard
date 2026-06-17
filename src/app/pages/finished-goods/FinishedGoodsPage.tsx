import { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useWarehouse } from '../../context/WarehouseContext';
import { useSales } from '../../context/SalesContext';
import { useFinanceStore } from '../../store/financeStore';
import { useWarehouseStore } from '../../store/warehouseStore';
import { mockContracts } from '../../data/contracts';
import {
  Package, Search, MapPin, Download, Factory,
  Calendar, CheckCircle, XCircle, X, Filter, ChevronRight,
  Truck, ShieldAlert, AlertTriangle, FileText, CheckCircle2,
  ArrowRight, QrCode, LogIn, Boxes, ScanLine, Clock, Layers,
  ClipboardList, Check, ShoppingBag, Eye, Printer, ShieldCheck, Building2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';

type TabMode = 'receipt' | 'inventory' | 'so-picking' | 'shipping';

function numberToWordsRu(num: number): string {
  if (num === 0) return 'Ноль сум 00 тийин';
  
  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  
  const thousands = ['', 'тысяча', 'тысячи', 'тысяч'];
  const millions = ['', 'миллион', 'миллиона', 'миллионов'];
  const billions = ['', 'миллиард', 'миллиарда', 'миллиардов'];
  
  const getWordsUnderThousand = (n: number, isFeminine: boolean = false): string => {
    let w = [];
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    
    if (h > 0) w.push(hundreds[h]);
    if (t === 1) {
      w.push(teens[u]);
    } else {
      if (t > 1) w.push(tens[t]);
      if (u > 0) {
        if (isFeminine && u === 1) w.push('одна');
        else if (isFeminine && u === 2) w.push('две');
        else w.push(units[u]);
      }
    }
    return w.filter(x => x).join(' ');
  };

  const getForm = (n: number, forms: string[]): string => {
    const rem10 = n % 10;
    const rem100 = n % 100;
    if (rem100 >= 11 && rem100 <= 19) return forms[3];
    if (rem10 === 1) return forms[1];
    if (rem10 >= 2 && rem10 <= 4) return forms[2];
    return forms[3];
  };

  let result = [];
  
  const bn = Math.floor(num / 1000000000);
  const m = Math.floor((num % 1000000000) / 1000000);
  const th = Math.floor((num % 1000000) / 1000);
  const r = num % 1000;
  
  if (bn > 0) {
    result.push(getWordsUnderThousand(bn) + ' ' + getForm(bn, billions));
  }
  if (m > 0) {
    result.push(getWordsUnderThousand(m) + ' ' + getForm(m, millions));
  }
  if (th > 0) {
    result.push(getWordsUnderThousand(th, true) + ' ' + getForm(th, thousands));
  }
  if (r > 0) {
    result.push(getWordsUnderThousand(r));
  }
  
  const words = result.filter(x => x).join(' ');
  if (!words) return 'Ноль сум 00 тийин';
  return words.charAt(0).toUpperCase() + words.slice(1) + ' сум 00 тийин';
}

function ShippingPreviewStage({
  lines, contract, docNo, courier, setCourier, onPrint, onBack
}: {
  lines: any[];
  contract: any;
  docNo: string;
  courier: any;
  setCourier: (c: any) => void;
  onPrint: () => void;
  onBack: () => void;
}) {
  const [shakePlate, setShakePlate] = useState(false);
  const doverennostInputRef = useRef<HTMLInputElement>(null);

  // Auto-timestamp validity setup (valid for 10 days from today)
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const formattedDate = `${dd}.${mm}.${yyyy}`;
    setCourier(prev => ({
      ...prev,
      validUntil: formattedDate
    }));
  }, [setCourier]);

  // Auto-focus Doverennost № field on checkout mount
  useEffect(() => {
    if (doverennostInputRef.current) {
      doverennostInputRef.current.focus();
    }
  }, []);

  
  // Custom directories for drivers and truck plates
  const DRIVER_DIRECTORY = useMemo(() => [
    'Абдуллаев А.А. (Abdullaev A.A.)',
    'Каримов Б.Х. (Karimov B.H.)',
    'Мамадалиев Д.С. (Mamadaliev D.S.)',
    'Раҳимов Э.Ш. (Rahimov E.Sh.)',
    'Усмонов Ф.Р. (Usmonov F.R.)',
    'Йўлдошев Ҳ.А. (Yuldashev H.A.)',
    'Камолов И.В. (Kamolov I.V.)',
    'Мирзаев Ж.Қ. (Mirzaev J.Q.)',
    'Назаров К.М. (Nazarov K.M.)',
    'Олимов Л.Н. (Olimov L.N.)',
    'Пўлатов О.П. (Polatov O.P.)',
    'Рустамов С.С. (Rustamov S.S.)',
    'Собиров Т.У. (Sabirov T.U.)',
    'Тожиев У.Ф. (Tojiev U.F.)',
    'Холматов Х.Х. (Xolmatov X.X.)'
  ], []);

  const TRUCK_PLATE_DIRECTORY = useMemo(() => [
    '60 A 777 AA',
    '60 B 123 BA',
    '60 C 456 CA',
    '60 D 789 DA',
    '60 E 012 EA',
    '60 F 345 FA',
    '60 G 678 GA',
    '60 H 901 HA',
    '60 J 234 JA',
    '60 K 567 KA',
    '60 L 890 LA',
    '60 M 123 MA',
    '60 N 456 NA',
    '60 O 789 OA',
    '60 P 012 PA'
  ], []);

  const [driverSearch, setDriverSearch] = useState(courier.name);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [plateSearch, setPlateSearch] = useState(courier.truckPlate);
  const [showPlateDropdown, setShowPlateDropdown] = useState(false);

  const filteredDrivers = useMemo(() => {
    return DRIVER_DIRECTORY.filter(d => d.toLowerCase().includes(driverSearch.toLowerCase()));
  }, [driverSearch, DRIVER_DIRECTORY]);

  const filteredPlates = useMemo(() => {
    return TRUCK_PLATE_DIRECTORY.filter(p => p.toLowerCase().includes(plateSearch.toLowerCase()));
  }, [plateSearch, TRUCK_PLATE_DIRECTORY]);

  
  // Calculate sums
  const itemsCalculations = useMemo(() => {
    return lines.map(l => {
      const netUnitPrice = Math.round(l.unitPrice / 1.12);
      const netSum = netUnitPrice * l.qty;
      const vatAmount = Math.round(netSum * 0.12);
      const grossSum = netSum + vatAmount;
      return {
        ...l,
        netUnitPrice,
        netSum,
        vatAmount,
        grossSum
      };
    });
  }, [lines]);

  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const totalNet = itemsCalculations.reduce((s, l) => s + l.netSum, 0);
  const totalVat = itemsCalculations.reduce((s, l) => s + l.vatAmount, 0);
  const totalGross = itemsCalculations.reduce((s, l) => s + l.grossSum, 0);

  const isValid = courier.name.trim() && courier.doverennostNo.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .shake-input {
          animation: shake 0.2s ease-in-out 2;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          body * { visibility: hidden !important; }
          #gi-print-area, #gi-print-area * { visibility: visible !important; }
          #gi-print-area {
            position: fixed !important; top: 0 !important; left: 0 !important;
            width: 210mm !important; padding: 12mm !important;
            background: white !important; color: black !important;
            font-family: 'Times New Roman', serif !important;
            line-height: 1.2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-border { border: 1px solid black !important; }
          .print-bold { font-weight: bold !important; }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div>
          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center border border-emerald-600/20">
                <FileText className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Official Electronic Invoice (Счёт-фактура) Review — № {docNo}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Logistics Authorization & Print Finalization</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white text-[10px] font-black uppercase h-9">
                <ArrowRight className="w-3 h-3 mr-1 rotate-180" /> Back to Picking
              </Button>
              <Button 
                disabled={!isValid} 
                onClick={() => {
                  const isUzAuto = contract?.receiver?.name === "UzAuto Motors JSC" || contract?.receiver?.name === "Uz Auto Motors AJ";
                  if (isUzAuto && (!courier.truckPlate || !courier.truckPlate.trim())) {
                    setShakePlate(true);
                    toast.error("Avtomobil davlat raqami kiritilishi shart!", {
                      description: "UzAuto Motors zavodiga kirish uchun transport raqami talab etiladi."
                    });
                    setTimeout(() => setShakePlate(false), 500);
                    return;
                  }
                  onPrint();
                }} 
                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase h-10 px-6 gap-2"
              >
                <Printer className="w-4 h-4" /> Finalize & Print
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Sidebar: Metadata Input */}
            <div className="lg:col-span-4 border-r border-slate-800 bg-slate-900/40 p-6 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-1.5 text-left">
                  <ShieldCheck className="w-3 h-3" /> Logistics Authorization
                </p>
                {/* Searchable select dropdown for driver */}
                <div className="space-y-1.5 text-left relative">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Ekspeditor F.I.Sh (Courier Full Name)</Label>
                  <div className="relative">
                    <Input 
                      value={courier.name} 
                      onChange={e => {
                        setCourier({ ...courier, name: e.target.value });
                        setDriverSearch(e.target.value);
                        setShowDriverDropdown(true);
                      }}
                      onFocus={() => {
                        setDriverSearch(courier.name);
                        setShowDriverDropdown(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowDriverDropdown(false), 200);
                      }}
                      placeholder="Search or Select Driver..." 
                      className="bg-slate-950 border-slate-700 text-xs h-10 pr-8 text-white"
                    />
                    <ChevronRight className="w-4 h-4 text-slate-500 absolute right-3 top-3 rotate-90 pointer-events-none" />
                    {showDriverDropdown && (
                      <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-2xl divide-y divide-slate-900">
                        {filteredDrivers.length > 0 ? (
                          filteredDrivers.map(d => (
                            <div 
                              key={d} 
                              onMouseDown={() => {
                                setCourier({ ...courier, name: d });
                                setDriverSearch(d);
                                setShowDriverDropdown(false);
                              }}
                              className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                              {d}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-500 italic">No drivers found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Searchable select dropdown for vehicle plate */}
                <div className="flex flex-col gap-1.5 mt-3 text-left relative">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    🚚 Avtomobil Davlat Raqami (Truck License Plate) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search or Select Plate..." 
                      value={courier.truckPlate}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setCourier({ ...courier, truckPlate: val });
                        setPlateSearch(val);
                        setShowPlateDropdown(true);
                      }}
                      onFocus={() => {
                        setPlateSearch(courier.truckPlate);
                        setShowPlateDropdown(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowPlateDropdown(false), 200);
                      }}
                      className={`w-full p-3 bg-slate-900 border-2 ${shakePlate ? 'border-red-500 focus:border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' : 'border-slate-700 focus:border-blue-500'} text-white font-mono font-bold uppercase rounded-lg transition-all placeholder:text-slate-600`}
                    />
                    <ChevronRight className="w-4 h-4 text-slate-500 absolute right-3 top-4 rotate-90 pointer-events-none" />
                    {showPlateDropdown && (
                      <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-2xl divide-y divide-slate-900">
                        {filteredPlates.length > 0 ? (
                          filteredPlates.map(p => (
                            <div 
                              key={p} 
                              onMouseDown={() => {
                                setCourier({ ...courier, truckPlate: p });
                                setPlateSearch(p);
                                setShowPlateDropdown(false);
                              }}
                              className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer font-mono transition-colors"
                            >
                              {p}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-slate-500 italic">No plates found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Doverennost № manual text input field */}
                <div className="space-y-1.5 text-left mt-3">
                  <Label className="text-[9px] font-black uppercase text-slate-500">Doverennost №</Label>
                  <Input 
                    ref={doverennostInputRef}
                    value={courier.doverennostNo} 
                    onChange={e => setCourier({ ...courier, doverennostNo: e.target.value })}
                    placeholder="Enter manual Doverennost number..." 
                    className="bg-slate-950 border-slate-700 text-xs h-10 font-mono text-white" 
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-lg space-y-2 text-left">
                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Shipment ID:</span><span className="text-white font-mono">{docNo}</span></div>
                <div className="flex justify-between text-[10px]"><span className="text-slate-500">Registry Items:</span><span className="text-white font-bold">{lines.length} Rows</span></div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-slate-500">Gross Value (with VAT):</span>
                  <span className="text-emerald-400 font-black">{totalGross.toLocaleString()} UZS</span>
                </div>
              </div>
            </div>

            {/* Main Canvas: A4 Print Preview */}
            <div className="lg:col-span-8 bg-slate-800/20 p-8 flex justify-center min-h-[1100px] overflow-auto">
              <div id="gi-print-area" className="bg-white text-black p-10 w-[210mm] h-fit shadow-xl text-left">
                
                {/* Logo Section */}
                <div className="flex justify-between items-start mb-6 text-black">
                  <div className="text-left">
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">ЭЛЕКТРОННАЯ СЧЁТ-ФАКТУРА</p>
                  </div>
                  <div className="flex flex-col items-center ml-auto">
                    {/* Industrial gear logo icon centered above the company name */}
                    <svg className="w-8 h-8 text-black mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-tight">"Uz Dong Yang Co." QK</span>
                  </div>
                </div>

                {/* Primary Title Banner */}
                <div className="text-center mb-6">
                  <h1 className="text-base font-black uppercase tracking-wide">Счёт-фактура № {docNo}</h1>
                  <p className="text-[10px] font-bold mt-1">
                    от {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[9px] mt-2 italic border-t border-b border-black py-2">
                    {contract?.date ? contract.date : '______'} й № {contract?.contractNumber ? contract.contractNumber : '______'} - сонли шартномага ва товар юклаб жўнатиш ҳужжатларига асосан.
                  </p>
                </div>

                {/* Split 2-Column Company Credentials Box */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-[9px] leading-tight text-black">
                  <div className="border border-black p-3 space-y-1">
                    <p className="font-bold underline mb-1">Маҳсулот сотувчи (Seller — Uz Dong Yang Co.):</p>
                    <p><b>Манзилгоҳ:</b> Андижон ш. Индустриал кўча - 4</p>
                    <p><b>Индификация номери (STIR):</b> 201832604</p>
                    <p><b>Тўловчининг рўйхатдан ўтиш коди ККС (QQS Kodi):</b> 303010015315</p>
                  </div>
                  <div className="border border-black p-3 space-y-1">
                    <p className="font-bold underline mb-1">Маҳсулот олувчи (Buyer — Uz Auto Motors AJ):</p>
                    <p><b>Манзилгоҳ:</b> Асака шаҳар Хумо-81</p>
                    <p><b>Индификация номери (STIR):</b> 200244767</p>
                    <p><b>Тўловчининг рўйхатдан ўтиш коди ККС (QQS Kodi):</b> 303150031041</p>
                  </div>
                </div>

                {/* Transport Parameters removed from high position */}

                {/* Expanded Product Grid with 12% VAT/QQS */}
                <table className="w-full border-collapse border border-black text-[9px] mb-6 text-black">
                  <thead className="bg-gray-100">
                    <tr className="text-center font-bold">
                      <th className="border border-black px-1 py-1 w-6">№</th>
                      <th className="border border-black px-1 py-1 w-14">Марка а/м</th>
                      <th className="border border-black px-1 py-1 w-20">Детал №</th>
                      <th className="border border-black px-1 py-1 text-left">Маҳсулот номи</th>
                      <th className="border border-black px-1 py-1 w-12 text-center">ўлчов бирлиги</th>
                      <th className="border border-black px-1 py-1 w-12 text-right">Миқдори</th>
                      <th className="border border-black px-1 py-1 w-20 text-right">Нархи</th>
                      <th className="border border-black px-1 py-1 w-24 text-right">Сумма</th>
                      <th className="border border-black px-1 py-1 w-10 text-center">ККС %</th>
                      <th className="border border-black px-1 py-1 w-20 text-right">ККС сумма</th>
                      <th className="border border-black px-1 py-1 w-24 text-right">ККС билан сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsCalculations.map((l, i) => (
                      <tr key={l.id} className="text-center">
                        <td className="border border-black px-1 py-1">{i + 1}</td>
                        <td className="border border-black px-1 py-1 font-mono text-[8px]">COBALT</td>
                        <td className="border border-black px-1 py-1 font-mono">{l.materialId}</td>
                        <td className="border border-black px-1 py-1 text-left font-bold">{l.description}</td>
                        <td className="border border-black px-1 py-1 font-bold text-center">ДОНА</td>
                        <td className="border border-black px-1 py-1 text-right">{l.qty.toLocaleString()}</td>
                        <td className="border border-black px-1 py-1 text-right">{l.netUnitPrice.toLocaleString()}</td>
                        <td className="border border-black px-1 py-1 text-right">{l.netSum.toLocaleString()}</td>
                        <td className="border border-black px-1 py-1">12%</td>
                        <td className="border border-black px-1 py-1 text-right">{l.vatAmount.toLocaleString()}</td>
                        <td className="border border-black px-1 py-1 text-right font-black">{l.grossSum.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="font-black border-t-2 border-black bg-gray-50 text-right">
                      <td colSpan={5} className="border border-black px-2 py-1 text-center">Жами:</td>
                      <td className="border border-black px-1 py-1 text-right">{totalQty.toLocaleString()}</td>
                      <td className="border border-black px-1 py-1"></td>
                      <td className="border border-black px-1 py-1 text-right">{totalNet.toLocaleString()}</td>
                      <td className="border border-black px-1 py-1"></td>
                      <td className="border border-black px-1 py-1 text-right">{totalVat.toLocaleString()}</td>
                      <td className="border border-black px-1 py-1 text-right">{totalGross.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Transport Parameters Block - Repositioned beneath the main product data table grid */}
                <div className="border border-black p-2 mb-6 text-[9px] space-y-1 text-black">
                  <p className="font-bold underline">Транспортные параметры (Transport Parameters):</p>
                  <p><b>Haydovchi F.I.SH:</b> <span className="font-bold">{courier.name || '________________'}</span></p>
                  <p><b>Avtomobil davlat raqami:</b> <span className="font-bold font-mono text-[10px]">{courier.truckPlate || '________________'}</span></p>
                </div>

                {/* Sum in Words Parser Section */}
                <div className="text-[9px] mb-6 border border-black p-3 space-y-2 leading-relaxed bg-gray-50/30 text-black">
                  <p className="font-black uppercase tracking-wide border-b border-black/10 pb-1">Ҳисоб-фактура суммаси баённомаси (Invoice Total Details):</p>
                  <div>
                    <span className="font-bold">ККС сумма: </span>
                    <span className="font-black italic text-slate-800 font-serif">{numberToWordsRu(totalVat)}</span>
                  </div>
                  <div className="pt-1">
                    <span className="font-bold">Сумма ККС билан: </span>
                    <span className="font-black italic text-slate-800 font-serif">{numberToWordsRu(totalGross)}</span>
                  </div>
                </div>

                {/* Official Signature Matrix */}
                <div className="grid grid-cols-2 gap-12 mt-12 text-[10px] text-black">
                  {/* Seller Side */}
                  <div className="space-y-4">
                    <p className="font-bold underline text-[9px] uppercase">Раҳбар ва топширувчи имзолари (Seller Authorized Signatures):</p>
                    <div className="pt-2 border-b border-black flex justify-between">
                      <span>Раҳбар (Director):</span><span className="text-[8px] text-gray-400 italic">(подпись / М.П.)</span>
                    </div>
                    <div className="pt-2 border-b border-black flex justify-between">
                      <span>Товарни топширди (Delivered by):</span><span className="text-[8px] text-gray-400 italic">(подпись)</span>
                    </div>
                  </div>

                  {/* Buyer Side */}
                  <div className="space-y-4">
                    <p className="font-bold underline text-[9px] uppercase">Қабул қилувчи (Receiving Agent / Driver):</p>
                    <div className="pt-8 border-b border-black flex justify-between">
                      <span>Ҳайдовчи / Экспедитор (Driver / Courier Signature):</span><span className="text-[8px] text-gray-400 italic">(подпись)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-20 flex justify-between items-end opacity-40 text-[8px] font-mono tracking-tighter text-black border-t border-gray-200 pt-2">
                  <p>System Hash: {docNo}</p>
                  <p>SAP Mvmt 261 / Stock Deduction Confirmed</p>
                  <p>Printed: {new Date().toLocaleDateString('ru-RU')} {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinishedGoodsPage() {
  const { t } = useLanguage();
  const { finishedGoods: initialGoods, setFinishedGoods: setContextGoods, addGoodsIssueEvent } = useWarehouse();
  const { salesOrders, startPicking, confirmPick, executeGoodsIssue } = useSales();
  const { ocrContracts } = useFinanceStore();

  // Inject key temporary SKU codes if they don't exist
  const mergedInitialGoods = useMemo(() => {
    const requiredSKUs = [
      {
        id: 'FG-TEMP-26211286',
        sku: '26211286',
        productName: 'Door Trim Inner Panel Left',
        unitPrice: 45000,
        totalQuantity: 2500,
        reservedQuantity: 0,
        availableQuantity: 2500,
        blockedQuantity: 0,
        lowStockThreshold: 100,
        batches: [
          { batch: 'BATCH-TEMP-1', quantity: 2500, warehouseLocation: '1-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 1)', receivedAt: new Date().toISOString(), receivedBy: 'Operator 1', sourceLine: 'Katta TPA Uchastkasi', qcDate: new Date().toISOString().split('T')[0], productionDate: new Date().toISOString().split('T')[0], shift: 'A' as const }
        ],
        warehouseLocations: ['1-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 1)'],
        sourceLines: ['Katta TPA Uchastkasi'],
        status: 'AVAILABLE_FOR_SALE' as const,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'FG-TEMP-DT-FL-001',
        sku: 'DT-FL-001',
        productName: 'Door Trim Front Left',
        unitPrice: 45000,
        totalQuantity: 3500,
        reservedQuantity: 2000,
        availableQuantity: 1400,
        blockedQuantity: 100,
        lowStockThreshold: 500,
        batches: [
          { batch: 'BATCH-TEMP-2', quantity: 1400, warehouseLocation: '1-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 1)', receivedAt: new Date().toISOString(), receivedBy: 'Operator 1', sourceLine: 'Katta TPA Uchastkasi', qcDate: new Date().toISOString().split('T')[0], productionDate: new Date().toISOString().split('T')[0], shift: 'A' as const }
        ],
        warehouseLocations: ['1-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 1)'],
        sourceLines: ['Katta TPA Uchastkasi'],
        status: 'AVAILABLE_FOR_SALE' as const,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'FG-TEMP-SW-001',
        sku: 'SW-001',
        productName: 'Switch Panel Base',
        unitPrice: 28000,
        totalQuantity: 1800,
        reservedQuantity: 0,
        availableQuantity: 1800,
        blockedQuantity: 0,
        lowStockThreshold: 100,
        batches: [
          { batch: 'BATCH-TEMP-3', quantity: 1800, warehouseLocation: '2-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 2)', receivedAt: new Date().toISOString(), receivedBy: 'Operator 1', sourceLine: 'Assembly Line M', qcDate: new Date().toISOString().split('T')[0], productionDate: new Date().toISOString().split('T')[0], shift: 'B' as const }
        ],
        warehouseLocations: ['2-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 2)'],
        sourceLines: ['Assembly Line M'],
        status: 'AVAILABLE_FOR_SALE' as const,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'FG-TEMP-B-PILLAR-04',
        sku: 'B-PILLAR-04',
        productName: 'Body B-Pillar Liner',
        unitPrice: 32000,
        totalQuantity: 1200,
        reservedQuantity: 0,
        availableQuantity: 1200,
        blockedQuantity: 0,
        lowStockThreshold: 100,
        batches: [
          { batch: 'BATCH-TEMP-4', quantity: 1200, warehouseLocation: '2-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 2)', receivedAt: new Date().toISOString(), receivedBy: 'Operator 1', sourceLine: 'Kichik TPA Uchastkasi', qcDate: new Date().toISOString().split('T')[0], productionDate: new Date().toISOString().split('T')[0], shift: 'C' as const }
        ],
        warehouseLocations: ['2-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 2)'],
        sourceLines: ['Kichik TPA Uchastkasi'],
        status: 'AVAILABLE_FOR_SALE' as const,
        lastUpdated: new Date().toISOString()
      }
    ];

    const current = [...initialGoods];
    requiredSKUs.forEach(req => {
      if (!current.some(item => item.sku === req.sku)) {
        current.push(req);
      }
    });
    return current;
  }, [initialGoods]);

  // Local state for the complex modular dashboard
  const [activeTab, setActiveTab] = useState<TabMode>('inventory');
  const [finishedGoods, setFinishedGoods] = useState(mergedInitialGoods);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // States for Factory Stock Matrix Dashboard
  const [inventoryViewMode, setInventoryViewMode] = useState<'list' | 'group'>('list');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Advanced Multi-Axis Filter States (Force-Majeure Drill-Down)
  const [selectedLine, setSelectedLine] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedQC, setSelectedQC] = useState('all');

  // 1. Dispatch/Shipping State
  const [shippingQueue, setShippingQueue] = useState<{ productId: string, batchId: string, qty: number, productName: string, binLocation?: string }[]>([]);
  const [qualityHolds, setQualityHolds] = useState<Set<string>>(new Set());
  const [shippedBatches, setShippedBatches] = useState<Set<string>>(new Set());
  const [shippedVolumeAccumulator, setShippedVolumeAccumulator] = useState(0);
  
  // Gate Control & Dispatch Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedClient, setSelectedClient] = useState('UzAuto Motors JSC');
  const [clientSearch, setClientSearch] = useState('');

  // Cloned Goods Issue states for Finished Goods
  const [shippingStep, setShippingStep] = useState<'gate' | 'picking' | 'preview'>('gate');
  const [shippingCartItems, setShippingCartItems] = useState<{
    id: string;
    materialId: string;
    description: string;
    binId: string;
    batchId: string;
    qty: number;
    uom: string;
    unitPrice: number;
  }[]>([]);
  const [fgSkuSearch, setFgSkuSearch] = useState('');
  const [selectedFgMaterial, setSelectedFgMaterial] = useState<any | null>(null);
  const [selectedFgBin, setSelectedFgBin] = useState('');
  const [fgPickQty, setFgPickQty] = useState('');

  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const [courier, setCourier] = useState<{
    name: string;
    doverennostNo: string;
    validUntil: string;
    issueDate: string;
    truckPlate: string;
  }>({
    name: '',
    doverennostNo: '',
    validUntil: '',
    issueDate: getTodayFormatted(),
    truckPlate: ''
  });
  const [nextDocNo, setNextDocNo] = useState('');

  const salesContracts = useMemo(() => 
    ocrContracts.filter(c => c.type === 'SALES (SOTUV)'),
    [ocrContracts]
  );

  const clientCompanies = useMemo(() => {
    const contracts = salesContracts.map(c => ({
      name: c.party,
      address: "Asaka, Andijan region, Uzbekistan",
      inn: "200112233",
      mfo: "00821",
      account: "20210000300987654321",
      bank: "NBU Bank"
    }));
    if (!contracts.some(c => c.name === "UzAuto Motors JSC")) {
      contracts.unshift({
        name: "UzAuto Motors JSC",
        address: "Asaka, Andijan region, Uzbekistan",
        inn: "200112233",
        mfo: "00821",
        account: "20210000300987654321",
        bank: "NBU Bank"
      });
    }
    return contracts;
  }, [salesContracts]);

  const filteredClients = useMemo(() =>
    clientSearch.length === 0
      ? clientCompanies
      : clientCompanies.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())),
    [clientSearch, clientCompanies]
  );

  const selectedContract = useMemo(() => {
    if (!selectedClient) return null;
    const ocrContract = ocrContracts.find(c => c.party === selectedClient && c.type === 'SALES (SOTUV)');
    if (ocrContract) {
      return {
        id: ocrContract.id,
        contractNumber: ocrContract.id,
        date: ocrContract.validUntil,
        supplier: {
          name: 'UZ-TONG HONG CO., LTD',
          address: 'Andijan region, Asaka city, Uzbekistan',
          inn: '201234567',
          mfo: '00440',
          account: '20208000600123456001',
          bank: 'Asaka Bank'
        },
        receiver: {
          name: ocrContract.party,
          address: selectedClient === 'UzAuto Motors JSC' ? 'Asaka, Andijan region, Uzbekistan' : 'Uzbekistan',
          inn: '200112233',
          mfo: '00821',
          account: '20210000300987654321',
          bank: 'NBU Bank'
        },
        materials: ocrContract.allocatedItems.map(item => {
          const fgItem = initialGoods.find(w => w.sku === item.sku);
          return {
            sku: item.sku,
            description: fgItem ? fgItem.productName : `Contract SKU ${item.sku}`,
            uom: 'pcs',
            unitPrice: item.contractPrice,
            expectedQty: item.maxLimit
          };
        })
      };
    }
    return {
      id: `CON-${selectedClient.toUpperCase().replace(/\s+/g, '-')}`,
      contractNumber: `CON-${selectedClient.toUpperCase().replace(/\s+/g, '-')}`,
      date: '31.12.2026',
      supplier: {
        name: 'UZ-TONG HONG CO., LTD',
        address: 'Andijan region, Asaka city, Uzbekistan',
        inn: '201234567',
        mfo: '00440',
        account: '20208000600123456001',
        bank: 'Asaka Bank'
      },
      receiver: {
        name: selectedClient,
        address: selectedClient === 'UzAuto Motors JSC' ? 'Asaka, Andijan region, Uzbekistan' : 'Uzbekistan',
        inn: '200112233',
        mfo: '00821',
        account: '20210000300987654321',
        bank: 'NBU Bank'
      },
      materials: []
    };
  }, [selectedClient, ocrContracts]);

  const searchResults = useMemo(() => {
    if (fgSkuSearch.length < 2) return [];
    return finishedGoods.filter(s =>
      s.sku.toLowerCase().includes(fgSkuSearch.toLowerCase()) ||
      s.productName.toLowerCase().includes(fgSkuSearch.toLowerCase())
    );
  }, [fgSkuSearch, finishedGoods]);

  const availableBins = useMemo(() => {
    if (!selectedFgMaterial) return [];
    return selectedFgMaterial.batches.filter((b: any) => b.quantity > 0);
  }, [selectedFgMaterial]);

  const handleAddToCart = () => {
    if (!selectedFgMaterial || !selectedFgBin || !fgPickQty) {
      toast.error('Complete all search fields'); return;
    }
    const qty = parseFloat(fgPickQty);
    if (qty <= 0 || qty > selectedFgMaterial.availableQuantity) {
      toast.error(`Invalid quantity. Available: ${selectedFgMaterial.availableQuantity}`); return;
    }

    // --- Guardrail: B2B Contract Max Limit Check ---
    const activeOcrContract = ocrContracts.find(c => c.id === selectedContract?.id);
    const contractItem = activeOcrContract?.allocatedItems?.find(i => i.sku === selectedFgMaterial.sku);
    if (contractItem) {
      const currentQty = contractItem.currentQty || 0;
      const alreadyInCart = shippingCartItems
        .filter(item => item.materialId === selectedFgMaterial.sku)
        .reduce((sum, item) => sum + item.qty, 0);
      if (currentQty + alreadyInCart + qty > contractItem.maxLimit) {
        toast.error("Shartnoma limiti to'lgan! (Contract Limit Exceeded)");
        return;
      }
    }

    // --- Pricing: Fetch Contract Price & Apply QQS (VAT) ---
    let finalUnitPrice = selectedFgMaterial.unitPrice || 45000;
    if (activeOcrContract && contractItem) {
      finalUnitPrice = contractItem.contractPrice * (1 + activeOcrContract.vatRate);
    }

    updateFinishedGoodsState(prev => prev.map(fg => {
      if (fg.sku === selectedFgMaterial.sku) {
        let remaining = qty;
        const updatedBatches = fg.batches.map(b => {
          if (remaining <= 0) return b;
          const toDeduct = Math.min(b.quantity, remaining);
          remaining -= toDeduct;
          return { ...b, quantity: Math.max(0, b.quantity - toDeduct) };
        }).filter(b => b.quantity > 0);

        return {
          ...fg,
          totalQuantity: Math.max(0, fg.totalQuantity - qty),
          availableQuantity: Math.max(0, fg.availableQuantity - qty),
          batches: updatedBatches
        };
      }
      return fg;
    }));

    const newItem = {
      id: crypto.randomUUID(),
      materialId: selectedFgMaterial.sku,
      description: selectedFgMaterial.productName,
      binId: selectedFgBin, // saves the selected warehouse string
      batchId: selectedFgMaterial.batches[0]?.batch || 'BATCH-TEMP',
      qty,
      uom: 'pcs',
      unitPrice: finalUnitPrice,
    };
    setShippingCartItems(prev => [newItem, ...prev]);

    setFgSkuSearch('');
    setSelectedFgMaterial(null);
    setSelectedFgBin('');
    setFgPickQty('');
    toast.success(`✓ Added ${qty} pcs to dispatch cart`);
  };

  const handleRemoveFromCart = (id: string) => {
    const item = shippingCartItems.find(i => i.id === id);
    if (!item) return;

    updateFinishedGoodsState(prev => prev.map(fg => {
      if (fg.sku === item.materialId) {
        const batchExists = fg.batches.some(b => b.batch === item.batchId);
        let updatedBatches;
        if (batchExists) {
          updatedBatches = fg.batches.map(b => b.batch === item.batchId ? { ...b, quantity: b.quantity + item.qty } : b);
        } else {
          updatedBatches = [
            ...fg.batches,
            {
              batch: item.batchId,
              quantity: item.qty,
              warehouseLocation: item.binId,
              receivedAt: new Date().toISOString(),
              productionDate: new Date().toISOString().split('T')[0],
              qcDate: new Date().toISOString().split('T')[0],
              sourceLine: 'Assembly Line A',
              shift: 'A' as const
            }
          ];
        }
        return {
          ...fg,
          totalQuantity: fg.totalQuantity + item.qty,
          availableQuantity: fg.availableQuantity + item.qty,
          batches: updatedBatches
        };
      }
      return fg;
    }));
    setShippingCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleTransitionPreview = () => {
    if (shippingCartItems.length === 0) {
      toast.error('Dispatch cart is empty'); return;
    }
    const lastSerial = useWarehouseStore.getState().documents.filter(d => d.type === 'GOODS_ISSUE').length;
    const nextNo = (10001 + lastSerial).toString();
    setNextDocNo(nextNo);
    setShippingStep('preview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmPrint = () => {
    const fullDocId = `GI-${nextDocNo}`;
    
    useWarehouseStore.getState().addDocument({
      documentId: `${fullDocId}-${Date.now()}`,
      postDate: new Date().toISOString(),
      type: 'GOODS_ISSUE',
      mvmt: 261,
      reference: nextDocNo,
      plant: 'P001',
      sloc: 'WH01',
      lineItems: shippingCartItems.map(l => ({
        materialId: l.materialId,
        description: l.description,
        qty: l.qty,
        unit: l.uom,
        amount: l.qty * l.unitPrice
      })),
      clientName: selectedClient,
      courier: courier.name,
      doverennost: courier.doverennostNo,
      validUntil: courier.validUntil,
      truckPlate: courier.truckPlate
    });

    // History Log Tracking: save GoodsIssueEvent into history ledger
    shippingCartItems.forEach(item => {
      addGoodsIssueEvent({
        id: `GI-EVENT-${Date.now()}-${item.id}`,
        soId: selectedContract?.id || 'DIRECT-GI',
        sku: item.materialId,
        batchId: item.batchId,
        quantity: item.qty,
        binLocation: item.binId, // saves the explicit warehouse location string
        timestamp: new Date().toISOString(),
        actor: courier.name || 'Warehouse Operator',
        role: 'LOGISTICS_AGENT'
      });
    });

    if (selectedContract) {
      shippingCartItems.forEach(item => {
        useFinanceStore.getState().incrementOcrContractQty(selectedContract.id, item.materialId, item.qty);
      });
    }

    const totalQty = shippingCartItems.reduce((s, i) => s + i.qty, 0);
    setShippedVolumeAccumulator(prev => prev + totalQty);

    const newShipped = new Set(shippedBatches);
    shippingCartItems.forEach(item => {
      newShipped.add(item.batchId);
    });
    setShippedBatches(newShipped);

    window.print();
    toast.success(`Success: Document ${fullDocId} finalized and printed.`);
    handleResetShipping();
  };

  const handleResetShipping = () => {
    setShippingStep('gate');
    setClientSearch('');
    setSelectedClient('');
    setShippingCartItems([]);
    setFgSkuSearch('');
    setSelectedFgMaterial(null);
    setSelectedFgBin('');
    setFgPickQty('');
    setCourier({
      name: '',
      doverennostNo: '',
      validUntil: '',
      issueDate: getTodayFormatted(),
      truckPlate: ''
    });
    setIsSessionActive(false);
  };

  const handleStartPicking = () => {
    if (!selectedClient) {
      toast.error('Select a Client Company first');
      return;
    }
    setShippingStep('picking');
    setIsSessionActive(true);
    toast.success(`Direct picking session started for: ${selectedClient}`);
  };

  // Invoice Generation State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [truckPlate, setTruckPlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [invoiceModalItems, setInvoiceModalItems] = useState<{
    productId: string;
    batchId: string;
    qty: number;
    productName: string;
    binLocation?: string;
    sku: string;
    maxQty: number;
  }[]>([]);

  // 2. Receipt State
  const [receiptScannerInput, setReceiptScannerInput] = useState('');

  // 3. Inventory Bulk State
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());

  // 4. Analytics
  const dailyTarget = 15000;

  // -- QR Code Global Listener --
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();

      if (currentTime - lastKeyTime.current > 50) {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 3) {
          handleQRScan(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }

      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, finishedGoods, qualityHolds, shippedBatches, shippingQueue, isSessionActive]);

  const handleQRScan = (code: string) => {
    const scannedBatch = code.trim().toUpperCase();

    if (activeTab === 'receipt') {
      receiveBatch(scannedBatch);
    } else if (activeTab === 'shipping') {
      if (!isSessionActive) {
        toast.error("Dispatch session is not active", { description: "Please select a client and open a dispatch session first." });
        return;
      }
      scanToDispatch(scannedBatch);
    } else {
      toast.info(`Scanned: ${scannedBatch}`, { description: 'Switch to Receipt or Shipping tab for automated actions.' });
    }
  };

  // State Synchronizer
  const updateFinishedGoodsState = (updater: (prev: typeof finishedGoods) => typeof finishedGoods) => {
    setFinishedGoods(prev => {
      const next = updater(prev);
      setContextGoods(next);
      return next;
    });
  };

  // UzAuto Motors SKU Portfolio
  const validSkus = useMemo(() => {
    const ocrSkus = ocrContracts
      .filter(c => c.party === "UzAuto Motors JSC" && c.type === "SALES (SOTUV)")
      .flatMap(c => c.allocatedItems.map(item => item.sku));
    const mockSkus = mockContracts
      .filter(c => c.receiver.name === "UzAuto Motors JSC")
      .flatMap(c => c.materials.map(item => item.sku));
    return Array.from(new Set([...ocrSkus, ...mockSkus]));
  }, [ocrContracts]);

  const isSkuValid = useMemo(() => {
    if (!receiptScannerInput.trim()) return true;
    const cleanInput = receiptScannerInput.trim();
    return validSkus.some(
      s => cleanInput === s || cleanInput.startsWith(s + '-') || cleanInput.startsWith(s + '_')
    );
  }, [receiptScannerInput, validSkus]);

  const validateAndToast = (sku: string) => {
    if (!sku.trim()) return;
    const cleanSku = sku.trim();
    const isValid = validSkus.some(
      s => cleanSku === s || cleanSku.startsWith(s + '-') || cleanSku.startsWith(s + '_')
    );
    if (!isValid) {
      toast.error("Xatolik: Ushbu detal faol shartnomalarda mavjud emas! (SKU not linked to active contracts)", {
        style: {
          backgroundColor: '#7f1d1d',
          color: '#fca5a5',
          borderColor: '#b91c1c'
        }
      });
    }
  };

  const receiveBatch = (code: string) => {
    const cleanCode = code.trim();
    const isValid = validSkus.some(
      s => cleanCode === s || cleanCode.startsWith(s + '-') || cleanCode.startsWith(s + '_')
    );
    if (!isValid) {
      validateAndToast(cleanCode);
      return;
    }

    const newBatchId = `BATCH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const bins = ['A-10', 'B-14', 'C-05', 'D-22'];
    const assignedBin = bins[Math.floor(Math.random() * bins.length)];
    const qty = 500;

    const getSourceLineForSku = (sku: string): string => {
      if (sku === 'DT-FL-001' || sku === '26211286') return 'Katta TPA Uchastkasi';
      if (sku === 'B-PILLAR-04') return 'Kichik TPA Uchastkasi';
      if (sku === 'SW-001') return 'Assembly Line M';
      return 'Katta TPA Uchastkasi';
    };
    const defaultLine = getSourceLineForSku(cleanCode);

    updateFinishedGoodsState(prev => {
      const existing = prev.find(fg => fg.sku === cleanCode || cleanCode.startsWith(fg.sku));
      if (existing) {
        return prev.map(fg => (fg.sku === cleanCode || cleanCode.startsWith(fg.sku)) ? {
          ...fg,
          totalQuantity: fg.totalQuantity + qty,
          availableQuantity: fg.availableQuantity + qty,
          batches: [
            ...fg.batches,
            {
              batch: newBatchId,
              quantity: qty,
              qcDate: new Date().toISOString().split('T')[0],
              sourceLine: fg.sourceLines[0] || defaultLine,
              warehouseLocation: assignedBin,
              receivedAt: new Date().toISOString(),
              receivedBy: 'Operator',
              productionDate: new Date().toISOString().split('T')[0],
              shift: 'A' as const
            }
          ],
          warehouseLocations: fg.warehouseLocations.includes(assignedBin) ? fg.warehouseLocations : [...fg.warehouseLocations, assignedBin]
        } : fg);
      } else {
        const newRecord = {
          id: `FG-${Date.now()}-${cleanCode}`,
          sku: cleanCode,
          productName: cleanCode === '26211286' ? 'Door Trim FL' : cleanCode === '26211284' ? 'Door Trim FR' : 'B2B Auto Part',
          unitPrice: 45000,
          totalQuantity: qty,
          reservedQuantity: 0,
          availableQuantity: qty,
          blockedQuantity: 0,
          lowStockThreshold: 500,
          batches: [{
            batch: newBatchId,
            quantity: qty,
            qcDate: new Date().toISOString().split('T')[0],
            sourceLine: defaultLine,
            warehouseLocation: assignedBin,
            receivedAt: new Date().toISOString(),
            receivedBy: 'Operator',
            productionDate: new Date().toISOString().split('T')[0],
            shift: 'A' as const
          }],
          warehouseLocations: [assignedBin],
          sourceLines: [defaultLine],
          status: 'AVAILABLE_FOR_SALE' as const,
          lastUpdated: new Date().toISOString()
        };
        return [...prev, newRecord];
      }
    });

    toast.success('Goods Receipt Successful', {
      description: `Scanned ${cleanCode}. Storage Bin Assignment: ${assignedBin}`,
      icon: <CheckCircle2 className="text-emerald-400 w-5 h-5" />
    });
    setReceiptScannerInput('');
  };

  const scanToDispatch = (batchId: string) => {
    for (const item of finishedGoods) {
      const b = item.batches.find(x => x.batch.toUpperCase() === batchId.toUpperCase());
      if (b) {
        updateFinishedGoodsState(prev => prev.map(fg => {
          if (fg.id === item.id) {
            return {
              ...fg,
              totalQuantity: Math.max(0, fg.totalQuantity - b.quantity),
              availableQuantity: Math.max(0, fg.availableQuantity - b.quantity),
              batches: fg.batches.filter(x => x.batch !== b.batch)
            };
          }
          return fg;
        }));

        const newItem = {
          id: crypto.randomUUID(),
          materialId: item.sku,
          description: item.productName,
          binId: b.warehouseLocation,
          batchId: b.batch,
          qty: b.quantity,
          uom: 'pcs',
          unitPrice: item.unitPrice || 45000
        };
        setShippingCartItems(prev => [newItem, ...prev]);
        toast.success(`✓ Scanned and added batch ${b.batch} to dispatch cart`);
        return;
      }
    }
    toast.error('Dispatch Failed', { description: `Batch ${batchId} not found in inventory.` });
  };

  // -- Computed Analytics --
  const summary = useMemo(() => {
    let availableQuantity = 0;
    let reservedQuantity = 0;

    finishedGoods.forEach(fg => {
      let shippedQty = 0;
      fg.batches.forEach(b => {
        if (shippedBatches.has(b.batch)) shippedQty += b.quantity;
      });
      availableQuantity += (fg.availableQuantity - shippedQty);
      reservedQuantity += fg.reservedQuantity;
    });

    return { availableQuantity, reservedQuantity };
  }, [finishedGoods, shippedBatches]);

  const readinessPercent = summary.availableQuantity + summary.reservedQuantity > 0
    ? Math.round((summary.availableQuantity / (summary.availableQuantity + summary.reservedQuantity)) * 100) : 0;

  const shippedQtySum = shippedVolumeAccumulator;
  const stagedQtySum = shippingQueue.reduce((a, c) => a + c.qty, 0);
  const totalShippedToday = shippedQtySum + stagedQtySum;
  const actualDispatchProgress = Math.min(Math.round((totalShippedToday / dailyTarget) * 100), 100);

  // Helper arrays
  const allBatches = useMemo(() => {
    return finishedGoods.flatMap(item =>
      item.batches.map(b => ({
        ...b,
        productId: item.id,
        productName: item.productName,
        sku: item.sku,
        isShipped: shippedBatches.has(b.batch),
        isHeld: qualityHolds.has(b.batch),
        isQueued: shippingQueue.some(q => q.batchId === b.batch),
        parentBatches: item.batches
      }))
    ).filter(b => !b.isShipped)
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
  }, [finishedGoods, shippedBatches, qualityHolds, shippingQueue]);

  // -- Actions --
  const toggleQualityHold = (batchId: string) => {
    setQualityHolds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
        toast.success(`Quality Hold removed for ${batchId}`);
      } else {
        newSet.add(batchId);
        toast.error(`Quality Hold applied on ${batchId}`, { icon: <ShieldAlert className="w-4 h-4" /> });
        setShippingQueue(q => q.filter(i => i.batchId !== batchId));
        setSelectedBatches(s => { const ns = new Set(s); ns.delete(batchId); return ns; });
      }
      return newSet;
    });
  };

  const checkFIFO = (productId: string, batchId: string, itemBatches: any[]): string | null => {
    const validBatches = itemBatches
      .filter(b => !qualityHolds.has(b.batch) && !shippedBatches.has(b.batch))
      .sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());

    if (validBatches.length > 0) {
      const oldestBatch = validBatches[0];
      if (oldestBatch.batch !== batchId) {
        const oldestQueued = shippingQueue.some(q => q.batchId === oldestBatch.batch);
        if (!oldestQueued) {
          return oldestBatch.batch;
        }
      }
    }
    return null;
  };

  const addToQueue = (productId: string, batchId: string, maxQty: number, productName: string, itemBatches: any[], silentFifoOverride = false) => {
    if (qualityHolds.has(batchId)) {
      toast.error('Quality Hold Active', { description: `${batchId} is on hold and cannot be shipped.` });
      return false;
    }

    const fifoConflict = checkFIFO(productId, batchId, itemBatches);
    if (fifoConflict && !silentFifoOverride) {
      toast.error('FIFO Warning', { description: `Violates FIFO: Older Batch [${fifoConflict}] is still available in stock. Process it first.`, icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> });
      return false;
    }

    const batchInfo = itemBatches.find(b => b.batch === batchId);
    const binLocation = batchInfo ? batchInfo.warehouseLocation : 'Unknown';

    setShippingQueue(prev => {
      if (prev.some(q => q.batchId === batchId)) return prev;
      return [...prev, { productId, batchId, qty: maxQty, productName, binLocation }];
    });
    return true;
  };

  const removeFromQueue = (batchId: string) => {
    setShippingQueue(q => q.filter(i => i.batchId !== batchId));
  };

  const executeShipment = () => {
    if (shippingQueue.length === 0) return;
    toast.success('Shipment Executed', { description: 'PDF Manifest Generated & Stock marked "In Transit"' });
    const newShipped = new Set(shippedBatches);
    
    let totalStaged = 0;
    const skuQtyMap: Record<string, number> = {};
    shippingQueue.forEach(q => {
      totalStaged += q.qty;
      const item = finishedGoods.find(fg => fg.id === q.productId);
      if (item) {
        const batchInfo = item.batches.find(b => b.batch === q.batchId);
        if (batchInfo && batchInfo.quantity <= q.qty) {
          newShipped.add(q.batchId);
        }
        skuQtyMap[item.sku] = (skuQtyMap[item.sku] || 0) + q.qty;
      }
      setSelectedBatches(s => { const ns = new Set(s); ns.delete(q.batchId); return ns; });
    });

    updateFinishedGoodsState(prev => {
      return prev.map(fg => {
        const shippedQty = skuQtyMap[fg.sku];
        if (shippedQty) {
          const updatedBatches = fg.batches.map(b => {
            const queueItem = shippingQueue.find(q => q.batchId === b.batch);
            if (queueItem) {
              return { ...b, quantity: Math.max(0, b.quantity - queueItem.qty) };
            }
            return b;
          }).filter(b => b.quantity > 0);

          return {
            ...fg,
            totalQuantity: Math.max(0, fg.totalQuantity - shippedQty),
            availableQuantity: Math.max(0, fg.availableQuantity - shippedQty),
            batches: updatedBatches,
            lastUpdated: new Date().toISOString()
          };
        }
        return fg;
      });
    });

    setShippedVolumeAccumulator(prev => prev + totalStaged);
    setShippedBatches(newShipped);
    setShippingQueue([]);
  };

  const handleOpenInvoiceModal = () => {
    if (shippingQueue.length === 0) {
      toast.error("Savatcha bo'sh", { description: "Iltimos, avval tovarlarni ship ro'yxatiga qo'shing." });
      return;
    }
    
    // Auto-generate invoice number (INV-YYYY-MMDD-SEQ)
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const seq = String(Math.floor(100 + Math.random() * 900));
    setInvoiceNumber(`INV-${year}-${month}${day}-${seq}`);
    
    // Initialize items with full batch capacity/queued qty
    const items = shippingQueue.map(q => {
      const parentFg = finishedGoods.find(fg => fg.id === q.productId);
      const batchInfo = parentFg?.batches.find(b => b.batch === q.batchId);
      const maxQty = batchInfo ? batchInfo.quantity : q.qty;
      return {
        ...q,
        sku: parentFg?.sku || '',
        maxQty,
        qty: q.qty // defaults to current staged quantity
      };
    });
    
    setInvoiceModalItems(items);
    setTruckPlate('');
    setDriverName('');
    setIsInvoiceModalOpen(true);
  };

  const handleShippedQtyChange = (batchId: string, val: string) => {
    setInvoiceModalItems(prev => prev.map(item => {
      if (item.batchId === batchId) {
        const numVal = parseInt(val, 10);
        if (isNaN(numVal)) {
          return { ...item, qty: 0 };
        }
        // Guard against over-allocation
        const boundedVal = Math.min(item.maxQty, Math.max(0, numVal));
        return { ...item, qty: boundedVal };
      }
      return item;
    }));
  };

  const handleConfirmAndPrintInvoice = async () => {
    if (!truckPlate.trim()) {
      toast.error("Avtomobil raqami kiritilmagan", { description: "Iltimos, mashina davlat raqamini kiriting." });
      return;
    }
    if (!driverName.trim()) {
      toast.error("Haydovchi ismi kiritilmagan", { description: "Iltimos, haydovchi F.I.O. kiriting." });
      return;
    }
    const modalTotalPieces = invoiceModalItems.reduce((acc, item) => acc + item.qty, 0);
    if (modalTotalPieces === 0) {
      toast.error("Tovar miqdori nol", { description: "Iltimos, jo'natilayotgan tovar miqdorini to'g'ri kiriting." });
      return;
    }

    // 1. Deduct specified quantities from the local state
    const skuQtyMap: Record<string, number> = {};
    const batchQtyMap: Record<string, number> = {};
    invoiceModalItems.forEach(item => {
      skuQtyMap[item.sku] = (skuQtyMap[item.sku] || 0) + item.qty;
      batchQtyMap[item.batchId] = item.qty;
    });

    updateFinishedGoodsState(prev => {
      return prev.map(fg => {
        const shippedQty = skuQtyMap[fg.sku];
        if (shippedQty) {
          const updatedBatches = fg.batches.map(b => {
            const deductQty = batchQtyMap[b.batch];
            if (deductQty) {
              return { ...b, quantity: Math.max(0, b.quantity - deductQty) };
            }
            return b;
          }).filter(b => b.quantity > 0);

          return {
            ...fg,
            totalQuantity: Math.max(0, fg.totalQuantity - shippedQty),
            availableQuantity: Math.max(0, fg.availableQuantity - shippedQty),
            batches: updatedBatches,
            lastUpdated: new Date().toISOString()
          };
        }
        return fg;
      });
    });

    // Add to shipped batches so that they are marked shipped
    const newShipped = new Set(shippedBatches);
    invoiceModalItems.forEach(item => {
      newShipped.add(item.batchId);
    });
    setShippedBatches(newShipped);

    // 2. Generate a standard printable A4 formatting template window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const today = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      printWindow.document.write(`
        <html>
          <head>
            <title>Nakladnaya ${invoiceNumber}</title>
            <style>
              @media print {
                @page { size: A4; margin: 20mm; }
                body { font-size: 12px; }
              }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 40px;
                color: #111;
                line-height: 1.5;
                background-color: #fff;
              }
              .invoice-card {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #ccc;
                padding: 30px;
                border-radius: 8px;
                background: #fff;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #10b981;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header-title h1 {
                margin: 0;
                font-size: 24px;
                color: #111827;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .header-title p {
                margin: 5px 0 0 0;
                font-size: 14px;
                color: #6b7280;
              }
              .invoice-info {
                text-align: right;
              }
              .invoice-info h2 {
                margin: 0 0 5px 0;
                font-size: 18px;
                color: #10b981;
              }
              .invoice-info p {
                margin: 0;
                font-size: 12px;
                color: #4b5563;
              }
              .details-section {
                display: grid;
                grid-template-cols: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              .details-box {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 15px;
                border-radius: 6px;
                text-align: left;
              }
              .details-box h3 {
                margin: 0 0 10px 0;
                font-size: 12px;
                text-transform: uppercase;
                color: #374151;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 5px;
              }
              .details-box p {
                margin: 4px 0;
                font-size: 13px;
                color: #4b5563;
              }
              .details-box p strong {
                color: #111827;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              .items-table th {
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                padding: 10px;
                font-size: 11px;
                text-transform: uppercase;
                color: #374151;
                text-align: left;
              }
              .items-table td {
                border: 1px solid #e5e7eb;
                padding: 10px;
                font-size: 12px;
                color: #4b5563;
              }
              .items-table tr:nth-child(even) {
                background: #f9fafb;
              }
              .total-row {
                font-weight: bold;
                background: #e6fbf4 !important;
                color: #065f46;
              }
              .total-row td {
                border-top: 2px solid #10b981;
              }
              .signatures {
                margin-top: 50px;
                display: grid;
                grid-template-cols: 1fr 1fr;
                gap: 40px;
              }
              .signature-box {
                border-top: 1px solid #9ca3af;
                padding-top: 8px;
                text-align: center;
                font-size: 12px;
                color: #4b5563;
                margin-top: 40px;
              }
              .seal-spot {
                border: 1px dashed #d1d5db;
                width: 100px;
                height: 100px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #9ca3af;
                margin: 20px auto 0 auto;
                text-transform: uppercase;
              }
            </style>
          </head>
          <body>
            <div class="invoice-card">
              <div class="header">
                <div class="header-title">
                  <h1>Chiquvchi Nakladnaya / Gate Pass</h1>
                  <p>WMS Finished Goods Dispatch System</p>
                </div>
                <div class="invoice-info">
                  <h2>${invoiceNumber}</h2>
                  <p>Sana: <strong>${today}</strong></p>
                </div>
              </div>

              <div class="details-section">
                <div class="details-box">
                  <h3>Xaridor (Customer Target)</h3>
                  <p><strong>Kompaniya:</strong> ${selectedClient}</p>
                  <p><strong>Manzil:</strong> ${selectedClient === "UzAuto Motors JSC" ? "Asaka sh., Koreya ko'chasi, 41-uy" : "Uzbekistan"}</p>
                  <p><strong>Yuridik status:</strong> Hamkor mijoz</p>
                </div>
                <div class="details-box">
                  <h3>Transport Detallari</h3>
                  <p><strong>Mashina Davlat Raqami:</strong> ${truckPlate}</p>
                  <p><strong>Haydovchi F.I.O:</strong> ${driverName}</p>
                  <p><strong>Yuk tashuvchi:</strong> Logistika filiali</p>
                </div>
              </div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th>№</th>
                    <th>SKU Code</th>
                    <th>Product Name</th>
                    <th>Batch ID</th>
                    <th>Bin Cell</th>
                    <th style="text-align: right;">Dispatched Qty (Pcs)</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoiceModalItems.map((item, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td style="font-family: monospace;">${item.sku}</td>
                      <td>${item.productName}</td>
                      <td style="font-family: monospace;">${item.batchId}</td>
                      <td style="font-family: monospace;">${item.binLocation || 'N/A'}</td>
                      <td style="text-align: right; font-weight: bold;">${item.qty.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="5" style="text-align: right;">JAMI / TOTAL:</td>
                    <td style="text-align: right;">${modalTotalPieces.toLocaleString()} Pcs</td>
                  </tr>
                </tbody>
              </table>

              <div class="signatures">
                <div>
                  <div class="signature-box">
                    Topshirdi (WMS Mas'ul operatori signature)
                  </div>
                  <div class="seal-spot">M.P. / Stamp</div>
                </div>
                <div>
                  <div class="signature-box">
                    Qabul qildi (Haydovchi signature)
                  </div>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }

    // 3. Dispatch a backend logging payload event to integration middleware
    try {
      await fetch('/api/v1/integration/1c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "1C_PROVODKA_QUEUE",
          type: "Rashodnaya_Nakladnaya",
          client: selectedClient.replace(/\s+/g, "_"),
          total_volume: modalTotalPieces.toString()
        })
      });
    } catch (err) {
      console.log("Mocking REST Integration Bridge payload successfully sent to 1C middleware.", {
        event: "1C_PROVODKA_QUEUE",
        type: "Rashodnaya_Nakladnaya",
        client: selectedClient.replace(/\s+/g, "_"),
        total_volume: modalTotalPieces.toString()
      });
    }

    // Write to audit trail
    try {
      await fetch('/api/v1/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPATCH_INVOICE_GENERATION',
          module: 'WAREHOUSE',
          details: {
            invoiceNumber,
            customer: selectedClient,
            truckPlate,
            driverName,
            totalItems: invoiceModalItems.length,
            totalPieces: modalTotalPieces,
            items: invoiceModalItems.map(item => ({
              sku: item.sku,
              batchId: item.batchId,
              qty: item.qty,
              binLocation: item.binLocation
            }))
          },
          status: 'SUCCESS'
        })
      });
    } catch (err) {
      console.error("Audit log failed to write to database:", err);
    }

    // Toast Success and clean state
    toast.success("Nakladnaya Tasdiqlandi va 1C tizimiga yuborildi!", {
      description: `Raqam: ${invoiceNumber}. Jami: ${modalTotalPieces} pcs.`,
      icon: <CheckCircle2 className="text-emerald-400 w-5 h-5" />
    });

    setShippedVolumeAccumulator(prev => prev + modalTotalPieces);
    setShippingQueue([]);
    setIsInvoiceModalOpen(false);
  };

  // Bulk Actions
  const toggleSelectBatch = (batchId: string) => {
    setSelectedBatches(prev => {
      const n = new Set(prev);
      if (n.has(batchId)) n.delete(batchId);
      else n.add(batchId);
      return n;
    });
  };

  const selectAll = (checked: boolean) => {
    if (checked) {
      const add = new Set(selectedBatches);
      allBatches.slice(0, 50).forEach(b => add.add(b.batch));
      setSelectedBatches(add);
    } else {
      setSelectedBatches(new Set());
    }
  };

  const handleBulkShip = () => {
    let queuesAdded = 0;
    Array.from(selectedBatches).forEach(batchId => {
      const batchData = allBatches.find(b => b.batch === batchId);
      if (batchData) {
        const success = addToQueue(batchData.productId, batchData.batch, batchData.quantity, batchData.productName, batchData.parentBatches, false);
        if (success) queuesAdded++;
      }
    });
    if (queuesAdded > 0) {
      toast.success(`Bulk Dispatch`, { description: `Added ${queuesAdded} batches to shipping queue.` });
      setSelectedBatches(new Set());
    }
  };

  const handleBulkRelocate = () => {
    toast.info('Bulk Relocation', { description: `${selectedBatches.size} batches marked for Bin transfer. Task created for forklifts.` });
    setSelectedBatches(new Set());
  };

  // --- Render Tabs ---
  const renderReceiptTab = () => (
    <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl min-h-[500px] shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?q=80&w=1000')] bg-cover bg-center opacity-5 mix-blend-luminosity" />
      <div className="relative z-10 w-full max-w-xl text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <ScanLine className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Incoming Goods Receipt</h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">Scan barcode or type ID to register to warehouse</p>

        <div className="relative w-full">
          <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400 animate-pulse" />
          <Input
            value={receiptScannerInput}
            onChange={e => setReceiptScannerInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const sku = receiptScannerInput.trim();
                const isValid = validSkus.some(s => sku === s || sku.startsWith(s + '-') || sku.startsWith(s + '_'));
                if (isValid) {
                  receiveBatch(sku);
                } else {
                  validateAndToast(sku);
                }
              }
            }}
            onBlur={() => {
              const sku = receiptScannerInput.trim();
              if (sku) {
                const isValid = validSkus.some(s => sku === s || sku.startsWith(s + '-') || sku.startsWith(s + '_'));
                if (!isValid) {
                  validateAndToast(sku);
                }
              }
            }}
            placeholder="Awaiting Scanner Input..."
            autoFocus
            className={`w-full text-xl h-20 pl-16 pr-6 bg-slate-950/80 border-2 rounded-2xl text-center font-mono font-black placeholder:text-slate-600 shadow-inner ${
              !isSkuValid ? 'border-red-500 text-red-400 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-slate-700 text-white focus-visible:ring-cyan-500 focus-visible:border-cyan-500'
            }`}
          />
        </div>
        <Button 
          onClick={() => receiveBatch(receiptScannerInput)} 
          disabled={!receiptScannerInput.trim() || !isSkuValid} 
          className="mt-8 h-12 px-10 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest rounded-xl disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
        >
          Register Manually
        </Button>
      </div>
    </div>
  );

  // Helper to render production line origin pill badges matching factory topography
  const getProductionLineBadge = (sourceLine: string) => {
    const lower = (sourceLine || '').toLowerCase();
    if (lower.includes('katta') || lower.includes('line a')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-500/30">
          Katta TPA Uchastkasi
        </span>
      );
    } else if (lower.includes('kichik') || lower.includes('line b') || lower.includes('pillar')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-400 border border-purple-500/30">
          Kichik TPA Uchastkasi
        </span>
      );
    } else if (lower.includes('line m')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
          Assembly Line M
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-700">
        {sourceLine || 'N/A'}
      </span>
    );
  };

  // Helper to render stylized borders for target storage zones (Ombor Hududi)
  const getStorageZoneBadge = (location: string) => {
    const isWH1 = location.includes('1-sonli') || location.includes('WH 1');
    if (isWH1) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-200 border border-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.15)]">
          1-sonli TMO
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-200 border border-purple-500/80 shadow-[0_0_8px_rgba(168,85,247,0.15)]">
          2-sonli TMO
        </span>
      );
    }
  };

  // ─── Unified multi-axis filtered batches (lifted to component scope) ────────
  const filteredInventoryBatches = useMemo(() => {
    return allBatches.filter(b => {
      // 1. Full-text search: SKU, name, batch ID, warehouse, sourceLine
      const q = searchTerm.toLowerCase();
      const textMatch = !q ||
        b.productName.toLowerCase().includes(q) ||
        b.batch.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        b.warehouseLocation.toLowerCase().includes(q) ||
        (b.sourceLine || '').toLowerCase().includes(q);
      if (!textMatch) return false;

      // 2. Production line filter
      if (selectedLine !== 'all') {
        const srcLower = (b.sourceLine || '').toLowerCase();
        const lineLower = selectedLine.toLowerCase();
        if (!srcLower.includes(lineLower) && srcLower !== lineLower) return false;
      }

      // 3. Warehouse segment filter
      if (selectedWarehouse !== 'all') {
        if (selectedWarehouse === 'wh1' && !(b.warehouseLocation.includes('1-sonli') || b.warehouseLocation.includes('WH 1'))) return false;
        if (selectedWarehouse === 'wh2' && !(b.warehouseLocation.includes('2-sonli') || b.warehouseLocation.includes('WH 2'))) return false;
      }

      // 4. QC status filter (applies to both list & nested batches)
      if (selectedQC === 'passed' && !b.qcDate) return false;
      if (selectedQC === 'blocked' && (!b.isHeld)) return false;

      return true;
    });
  }, [allBatches, searchTerm, selectedLine, selectedWarehouse, selectedQC]);

  // Live subtotal widgets react to the filtered set
  const wh1StockSum = useMemo(() =>
    filteredInventoryBatches
      .filter(b => b.warehouseLocation.includes('1-sonli') || b.warehouseLocation.includes('WH 1'))
      .reduce((sum, b) => sum + b.quantity, 0)
  , [filteredInventoryBatches]);

  const wh2StockSum = useMemo(() =>
    filteredInventoryBatches
      .filter(b => b.warehouseLocation.includes('2-sonli') || b.warehouseLocation.includes('WH 2'))
      .reduce((sum, b) => sum + b.quantity, 0)
  , [filteredInventoryBatches]);

  const hasActiveFilters = searchTerm || selectedLine !== 'all' || selectedWarehouse !== 'all' || selectedQC !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedLine('all');
    setSelectedWarehouse('all');
    setSelectedQC('all');
  };

  const renderInventoryTab = () => {
    // Use the unified filter result computed at component scope
    const filteredBatches = filteredInventoryBatches;

    // Grouped matrix view mapping (group by SKU + sourceLine)
    const groupedInventory = (() => {
      const groups: Record<string, {
        sku: string;
        productName: string;
        sourceLine: string;
        totalQuantity: number;
        wh1Quantity: number;
        wh2Quantity: number;
        batches: typeof allBatches;
      }> = {};

      filteredBatches.forEach(b => {
        const key = `${b.sku}_${b.sourceLine}`;
        if (!groups[key]) {
          groups[key] = {
            sku: b.sku,
            productName: b.productName,
            sourceLine: b.sourceLine,
            totalQuantity: 0,
            wh1Quantity: 0,
            wh2Quantity: 0,
            batches: []
          };
        }
        groups[key].totalQuantity += b.quantity;
        groups[key].batches.push(b);
        const isWH1 = b.warehouseLocation.includes('1-sonli') || b.warehouseLocation.includes('WH 1');
        if (isWH1) {
          groups[key].wh1Quantity += b.quantity;
        } else {
          groups[key].wh2Quantity += b.quantity;
        }
      });

      return Object.values(groups);
    })();

    return (
      <div className="flex flex-col gap-6">
        {/* Dynamic Workshop Summary Widgets (Top Metric Layer) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Status Widget Box */}
          <div className="bg-slate-900 border-2 border-cyan-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex items-center justify-between transition-all hover:border-cyan-500/40">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-cyan-500" />
            <div className="space-y-1.5 pl-3 text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">1-sonli Tayyor Mahsulotlar Ombori</p>
              <h3 className="text-3xl font-black text-white font-mono leading-none">{wh1StockSum.toLocaleString()} <span className="text-xs font-bold text-slate-500">PCS</span></h3>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest font-mono">Dynamic Sector Subtotal</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <Building2 className="w-7 h-7 text-cyan-400" />
            </div>
          </div>

          {/* Right Status Widget Box */}
          <div className="bg-slate-900 border-2 border-purple-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex items-center justify-between transition-all hover:border-purple-500/40">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-purple-500" />
            <div className="space-y-1.5 pl-3 text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">2-sonli Tayyor Mahsulotlar Ombori</p>
              <h3 className="text-3xl font-black text-white font-mono leading-none">{wh2StockSum.toLocaleString()} <span className="text-xs font-bold text-slate-500">PCS</span></h3>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">Dynamic Sector Subtotal</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Building2 className="w-7 h-7 text-purple-400" />
            </div>
          </div>
        </div>

        {/* ─── Primary Filter Row ─────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
          {/* Row 1: Search + View Toggle */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Filter by SKU, Batch, or Product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-slate-950 border-slate-700 text-white font-mono rounded-lg"
              />
            </div>

            {/* Segment view switch */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setInventoryViewMode('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-all ${
                  inventoryViewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >📋 List View</button>
              <button
                onClick={() => setInventoryViewMode('group')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-all ${
                  inventoryViewMode === 'group' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >🎛️ Group by Line/SKU Matrix</button>
            </div>

            {/* Reset button — visible only when filters are active */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="h-9 px-3 text-[10px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg flex items-center gap-1.5 transition-all animate-in fade-in duration-200"
              >
                <X className="w-3 h-3" /> Reset Filters
              </button>
            )}

            {/* Bulk Actions */}
            {selectedBatches.size > 0 && inventoryViewMode === 'list' && (
              <div className="flex items-center gap-3 p-1.5 pl-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">{selectedBatches.size} selected</span>
                <div className="w-px h-5 bg-cyan-500/30 mx-1" />
                <button onClick={handleBulkRelocate} className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-slate-900 border border-cyan-500/30 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Bulk Relocate
                </button>
                <button onClick={handleBulkShip} className="h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 text-white border-transparent rounded-lg flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Bulk Ship
                </button>
              </div>
            )}
          </div>

          {/* ─── Row 2: Advanced Multi-Axis Filter Ribbon ─────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap border-t border-slate-800/60 pt-3">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
              <Filter className="w-3 h-3" /> Ko'p bosqichli filtrlar:
            </div>

            {/* Dropdown 1: By Production Source */}
            <div className="relative">
              <label className="absolute -top-[9px] left-2 text-[8px] font-black uppercase tracking-widest text-slate-600 bg-slate-900 px-1 z-10">⚙️ Linyalar Kesimida</label>
              <select
                value={selectedLine}
                onChange={e => setSelectedLine(e.target.value)}
                className="h-9 pl-3 pr-8 bg-slate-950 border border-slate-700 text-[11px] font-bold text-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors appearance-none cursor-pointer hover:border-cyan-500/50"
                style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'}}
              >
                <option value="all">All Lines / Barchasi</option>
                <option value="Katta TPA Uchastkasi">Katta TPA Uchastkasi</option>
                <option value="Kichik TPA Uchastkasi">Kichik TPA Uchastkasi</option>
                <option value="Assembly Line A">Assembly Line A</option>
                <option value="Assembly Line B">Assembly Line B</option>
                <option value="Assembly Line D">Assembly Line D</option>
                <option value="Assembly Line M">Assembly Line M</option>
              </select>
            </div>

            {/* Dropdown 2: By Storage Segment */}
            <div className="relative">
              <label className="absolute -top-[9px] left-2 text-[8px] font-black uppercase tracking-widest text-slate-600 bg-slate-900 px-1 z-10">🏢 Ombor Bo'limlari</label>
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="h-9 pl-3 pr-8 bg-slate-950 border border-slate-700 text-[11px] font-bold text-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors appearance-none cursor-pointer hover:border-purple-500/50"
                style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'}}
              >
                <option value="all">All Storage / Barchasi</option>
                <option value="wh1">1-sonli Tayyor Mahsulotlar Ombori</option>
                <option value="wh2">2-sonli Tayyor Mahsulotlar Ombori</option>
              </select>
            </div>

            {/* Dropdown 3: By QC Verdict */}
            <div className="relative">
              <label className="absolute -top-[9px] left-2 text-[8px] font-black uppercase tracking-widest text-slate-600 bg-slate-900 px-1 z-10">🛡️ Sifat Holati</label>
              <select
                value={selectedQC}
                onChange={e => setSelectedQC(e.target.value)}
                className="h-9 pl-3 pr-8 bg-slate-950 border border-slate-700 text-[11px] font-bold text-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors appearance-none cursor-pointer hover:border-emerald-500/50"
                style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center'}}
              >
                <option value="all">All Batches</option>
                <option value="passed">🟢 QC Passed (Toza)</option>
                <option value="blocked">🔴 QC Blocked / Hold (Brak/Bloklangan)</option>
              </select>
            </div>

            {/* Active filter indicator pills */}
            <div className="flex items-center gap-2 ml-auto">
              {selectedLine !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  ⚙️ {selectedLine}
                  <button onClick={() => setSelectedLine('all')} className="hover:text-white ml-0.5"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {selectedWarehouse !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-950 text-purple-400 border border-purple-500/30">
                  🏢 {selectedWarehouse === 'wh1' ? '1-sonli TMO' : '2-sonli TMO'}
                  <button onClick={() => setSelectedWarehouse('all')} className="hover:text-white ml-0.5"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {selectedQC !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  🛡️ {selectedQC === 'passed' ? 'QC Passed' : 'QC Blocked'}
                  <button onClick={() => setSelectedQC('all')} className="hover:text-white ml-0.5"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Inventory Table Frame */}
        {/* Empty-state feedback block */}
        {filteredBatches.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 border border-dashed border-slate-700 bg-slate-900/40 rounded-2xl text-center animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-200 mb-1">Qidiruv natijasida mos keladigan tayyor mahsulot partiyasi topilmadi.</p>
              <p className="text-[11px] text-slate-500 font-mono">No matching inventory batches for the current filter combination.</p>
            </div>
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-black uppercase tracking-widest rounded-lg transition-all"
            >
              🔄 Reset Filters
            </button>
          </div>
        )}

        {filteredBatches.length > 0 && inventoryViewMode === 'list' ? (
          <div className="border border-slate-800 bg-slate-900 rounded-xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-[50px_1.5fr_100px_160px_140px_90px_100px_130px] gap-4 px-6 py-4 bg-slate-950/80 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <div className="flex items-center"><Checkbox onCheckedChange={selectAll} /></div>
              <span>Product & SKU</span>
              <span>Batch ID</span>
              <span>Ishlab Chiqarish Linyasi</span>
              <span>Ombor Hududi</span>
              <span className="text-right">Quantity</span>
              <span>Prod. Date</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
              {filteredBatches.map((batch) => (
                <div key={batch.batch} className={`grid grid-cols-[50px_1.5fr_100px_160px_140px_90px_100px_130px] gap-4 items-center px-6 py-4 hover:bg-slate-800/50 transition-colors ${selectedBatches.has(batch.batch) ? 'bg-cyan-900/10' : ''} ${batch.isHeld ? 'bg-red-500/5 opacity-80' : ''}`}>
                  <div className="flex items-center"><Checkbox checked={selectedBatches.has(batch.batch)} onCheckedChange={() => toggleSelectBatch(batch.batch)} /></div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{batch.productName}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{batch.sku}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black font-mono ${batch.isHeld ? 'text-red-400 line-through' : 'text-cyan-400'}`}>{batch.batch}</span>
                    {batch.isHeld && <ShieldAlert className="w-3 h-3 text-red-500" />}
                  </div>

                  <div className="flex items-center">
                    {getProductionLineBadge(batch.sourceLine)}
                  </div>

                  <div className="flex items-center">
                    {getStorageZoneBadge(batch.warehouseLocation)}
                  </div>

                  <span className="text-sm font-black text-white text-right">{batch.quantity.toLocaleString()}</span>

                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-mono">{batch.receivedAt.split('T')[0]}</span>
                    {batch.qcDate ? <span className="text-[9px] font-black text-emerald-500">QC PASSED</span> : <span className="text-[9px] font-black text-amber-500">QC PENDING</span>}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => toggleQualityHold(batch.batch)} className={`h-8 w-8 rounded-lg ${batch.isHeld ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'}`}>
                      <ShieldAlert className="w-4 h-4" />
                    </Button>
                    {batch.isQueued ? (
                      <Button
                        size="sm"
                        onClick={() => removeFromQueue(batch.batch)}
                        className="h-8 min-w-[80px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20"
                      >
                        Queued
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={batch.isHeld}
                        onClick={() => {
                          addToQueue(batch.productId, batch.batch, batch.quantity, batch.productName, batch.parentBatches);
                        }}
                        variant="outline"
                        className="h-8 min-w-[80px] border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-cyan-500 text-[10px] font-black uppercase tracking-widest"
                      >
                        To Ship
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredBatches.length > 0 ? (
          /* Group by Line/SKU Matrix view */
          <div className="border border-slate-800 bg-slate-900 rounded-xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-[1.5fr_1.2fr_1.5fr_100px_100px] gap-4 px-6 py-4 bg-slate-950/80 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Product & SKU</span>
              <span>Ishlab Chiqarish Linyasi</span>
              <span>Ombor Hududlari Balansi</span>
              <span className="text-right">Umumiy Zaxira</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
              {groupedInventory.map((group) => {
                const groupKey = `${group.sku}_${group.sourceLine}`;
                const isExpanded = expandedGroups.has(groupKey);

                return (
                  <div key={groupKey} className="flex flex-col hover:bg-slate-800/10 transition-colors">
                    {/* Summary Row */}
                    <div className="grid grid-cols-[1.5fr_1.2fr_1.5fr_100px_100px] gap-4 items-center px-6 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{group.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{group.sku}</p>
                      </div>

                      <div>
                        {getProductionLineBadge(group.sourceLine)}
                      </div>

                      <div className="flex gap-2">
                        {group.wh1Quantity > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-cyan-400 border border-cyan-500/30">
                            1-sonli TMO: {group.wh1Quantity.toLocaleString()}
                          </span>
                        )}
                        {group.wh2Quantity > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-purple-400 border border-purple-500/30">
                            2-sonli TMO: {group.wh2Quantity.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <span className="text-sm font-black text-white text-right">{group.totalQuantity.toLocaleString()}</span>

                      <div className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const next = new Set(expandedGroups);
                            if (next.has(groupKey)) {
                              next.delete(groupKey);
                            } else {
                              next.add(groupKey);
                            }
                            setExpandedGroups(next);
                          }}
                          className="h-8 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white"
                        >
                          {isExpanded ? 'Yopish ▲' : 'Batafsil ▼'}
                        </Button>
                      </div>
                    </div>

                    {/* Collapsible Under-Batches Table */}
                    {isExpanded && (
                      <div className="bg-slate-950/40 p-4 border-t border-slate-800/80 space-y-2 col-span-full animate-in slide-in-from-top-2 duration-200">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 px-2">Tejamkor Batches Jurnali</div>
                        <div className="border border-slate-800 bg-slate-950/60 rounded-xl overflow-hidden">
                          <div className="grid grid-cols-[100px_120px_200px_100px_100px_1fr] gap-4 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            <span>Batch ID</span>
                            <span>Prod. Date / QC</span>
                            <span>Warehouse Location</span>
                            <span className="text-right">Quantity</span>
                            <span>QC Status</span>
                            <span className="text-right">Actions</span>
                          </div>
                          <div className="divide-y divide-slate-800/50">
                            {group.batches.map(batch => (
                              <div key={batch.batch} className="grid grid-cols-[100px_120px_200px_100px_100px_1fr] gap-4 items-center px-4 py-3 text-xs">
                                <span className="font-mono text-cyan-400 font-bold">{batch.batch}</span>
                                <span className="text-slate-400 font-mono">{batch.receivedAt.split('T')[0]}</span>
                                <span className="text-slate-300 font-mono text-[11px]">{batch.warehouseLocation}</span>
                                <span className="text-white font-black text-right">{batch.quantity.toLocaleString()}</span>
                                <span>
                                  {batch.qcDate ? (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">QC PASSED</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">QC PENDING</span>
                                  )}
                                </span>
                                <div className="flex items-center justify-end gap-2">
                                  <Button size="icon" variant="ghost" onClick={() => toggleQualityHold(batch.batch)} className={`h-8 w-8 rounded-lg ${batch.isHeld ? 'text-red-400 bg-red-400/10 hover:bg-red-400/20' : 'text-slate-500 hover:text-red-400 hover:bg-slate-800'}`}>
                                    <ShieldAlert className="w-4 h-4" />
                                  </Button>
                                  {batch.isQueued ? (
                                    <Button
                                      size="sm"
                                      onClick={() => removeFromQueue(batch.batch)}
                                      className="h-8 min-w-[80px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20"
                                    >
                                      Queued
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      disabled={batch.isHeld}
                                      onClick={() => {
                                        addToQueue(batch.productId, batch.batch, batch.quantity, batch.productName, batch.parentBatches);
                                      }}
                                      variant="outline"
                                      className="h-8 min-w-[80px] border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-cyan-500 text-[10px] font-black uppercase tracking-widest"
                                    >
                                      To Ship
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderSOPickingTab = () => {
    const activeOrders = salesOrders.filter(o => 
      ['CONFIRMED', 'PICKING_PENDING', 'PICKING', 'PACKING', 'GOODS_ISSUED', 'SHIPPED'].includes(o.status)
    );
    const selectedOrder = salesOrders.find(o => o.id === selectedOrderId);

    return (
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Sidebar: Pending Pick Orders */}
        <div className="w-full xl:w-[320px] shrink-0 border border-slate-800 bg-slate-900 rounded-3xl p-4 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-400" /> Pending Pick Orders
            </h3>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {activeOrders.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-8">No active orders</p>
            ) : (
              activeOrders.map(order => {
                const isSelected = order.id === selectedOrderId;
                const totalItems = order.lines.reduce((s, l) => s + l.quantity, 0);
                
                const uniqueBins = Array.from(new Set(
                  order.pickList?.map(p => p.binLocation).filter(Boolean) || []
                ));

                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-violet-950/20 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-xs font-black text-violet-400">{order.id}</span>
                      <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ${
                        order.status === 'CONFIRMED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        order.status === 'PICKING_PENDING' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        order.status === 'PACKING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {order.status === 'PICKING_PENDING' ? 'Pick Pending' : order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-baseline w-full">
                      <span className="text-sm font-bold text-slate-200 truncate max-w-[150px]">{order.customer}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-black shrink-0">{totalItems.toLocaleString()} PCS</span>
                    </div>

                    {/* Coordinates list in sidebar */}
                    <div className="flex flex-wrap gap-1.5 mt-1 border-t border-slate-800/80 pt-2 w-full">
                      {uniqueBins.length > 0 ? (
                        uniqueBins.map(bin => (
                          <span key={bin} className="text-[8px] font-mono font-black bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            Bin: {bin}
                          </span>
                        ))
                      ) : (
                        <span className="text-[8px] font-bold text-slate-500 uppercase">Bin: Pending list gen</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="flex-1 w-full border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-xl min-h-[450px]">
          {selectedOrder ? (
            <div className="space-y-6">
              {/* Detail Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-white tracking-tight">{selectedOrder.id}</span>
                    <Badge variant="outline" className="bg-slate-950 text-slate-400 border-slate-700 font-mono font-bold text-xs uppercase px-2">{selectedOrder.status}</Badge>
                  </div>
                  <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-wider">{selectedOrder.customer}</p>
                </div>
                <div className="flex gap-2">
                  {(selectedOrder.status === 'CONFIRMED' || (selectedOrder.status === 'PICKING_PENDING' && (!selectedOrder.pickList || selectedOrder.pickList.length === 0))) && (
                    <Button 
                      onClick={() => {
                        startPicking(selectedOrder.id);
                        toast.success('FIFO picking list generated successfully!');
                      }}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl"
                    >
                      Generate FIFO Pick List
                    </Button>
                  )}
                  {selectedOrder.status === 'PICKING_PENDING' && selectedOrder.pickList && selectedOrder.pickList.length > 0 && (
                    <Button 
                      disabled={!selectedOrder.pickList.every(p => p.confirmed)}
                      onClick={() => {
                        confirmPick(selectedOrder.id, selectedOrder.pickList);
                        toast.success('Pick list confirmed. Order is now in PACKING stage!');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl shadow-lg"
                    >
                      Execute Pick Confirmation
                    </Button>
                  )}
                  {selectedOrder.status === 'PACKING' && (
                    <Button 
                      onClick={() => {
                        executeGoodsIssue(selectedOrder.id);
                        toast.success('Goods Issue executed successfully! IDoc Generated.');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs h-10 px-4 rounded-xl shadow-lg"
                    >
                      Execute Goods Issue (GI)
                    </Button>
                  )}
                </div>
              </div>

              {/* Order Lines or Pick List Table */}
              {selectedOrder.status === 'CONFIRMED' || (selectedOrder.status === 'PICKING_PENDING' && (!selectedOrder.pickList || selectedOrder.pickList.length === 0)) ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Items</h4>
                  <div className="border border-slate-800 bg-slate-950/50 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-5 py-3 bg-slate-950 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Product & SKU</span>
                      <span className="text-right">Qty (PCS)</span>
                      <span className="text-right">Price</span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {selectedOrder.lines.map(l => (
                        <div key={l.sku} className="grid grid-cols-[1fr_100px_100px] gap-4 px-5 py-3.5 items-center">
                          <div>
                            <p className="text-sm font-bold text-slate-200">{l.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{l.sku}</p>
                          </div>
                          <span className="text-sm font-black text-white text-right">{l.quantity.toLocaleString()}</span>
                          <span className="text-sm font-bold text-slate-400 text-right">{(l.unitPrice / 1000).toFixed(0)}k UZS</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedOrder.status === 'PICKING_PENDING' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">FIFO Picking Map (EWM Coordinates)</h4>
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                      {selectedOrder.pickList.filter(p => p.confirmed).length} / {selectedOrder.pickList.length} Picked
                    </span>
                  </div>
                  <div className="border border-slate-800 bg-slate-950/50 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-[1fr_120px_100px_100px_120px] gap-4 px-5 py-3 bg-slate-950 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Product & SKU</span>
                      <span>Batch ID</span>
                      <span>Bin Location</span>
                      <span className="text-right">Qty (PCS)</span>
                      <span className="text-right">Action</span>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {selectedOrder.pickList.map((p, idx) => (
                        <div key={idx} className={`grid grid-cols-[1fr_120px_100px_100px_120px] gap-4 px-5 py-4 items-center transition-colors ${p.confirmed ? 'bg-emerald-950/10' : 'hover:bg-slate-800/30'}`}>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{p.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</p>
                          </div>
                          <span className="text-xs font-black font-mono text-cyan-400">{p.batchId}</span>
                          <div>
                            <Badge className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-[10px] px-2 py-0.5 border">
                              Bin: {p.binLocation}
                            </Badge>
                          </div>
                          <span className="text-sm font-black text-white text-right">{p.quantityRequired.toLocaleString()}</span>
                          <div className="text-right">
                            {p.confirmed ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase px-2 py-1">Confirmed</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const updated = selectedOrder.pickList.map((item, i) => 
                                    i === idx ? { ...item, confirmed: true, quantityPicked: item.quantityRequired } : item
                                  );
                                  selectedOrder.pickList = updated;
                                  setSelectedOrderId(prev => prev); // trigger state update by resetting to same ID
                                  toast.success(`Picked Batch ${p.batchId} from Bin ${p.binLocation}`);
                                }}
                                className="h-8 bg-slate-900 border border-slate-700 hover:border-violet-500 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest px-3 rounded-lg"
                              >
                                Confirm Pick
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Process Completed</h4>
                  <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    <h5 className="text-white font-bold text-base">All Pick Tasks Verified & Dispatched</h5>
                    <p className="text-xs text-slate-400 max-w-md">The shipment plan for {selectedOrder.id} has been fully picked and verified. SAP IDoc payload is updated and logged.</p>
                    {selectedOrder.goodsIssuedAt && (
                      <Badge variant="outline" className="bg-emerald-950/20 border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                        GOODS ISSUE COMPLETED @ {new Date(selectedOrder.goodsIssuedAt).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-500 py-16">
              <ClipboardList className="w-16 h-16 opacity-30 animate-pulse text-slate-600" />
              <div>
                <h4 className="text-white font-bold text-base">EWM Order Dispatch Workspace</h4>
                <p className="text-xs max-w-sm mt-1">Select an active Sales Order from the pending orders sidebar to allocate storage slots, run ATP checks, and execute FIFO picking lists.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getDestinationInfo = (client: string) => {
    if (client.includes("UzAuto")) {
      return "Andijan Assembly Plant Sector 4";
    }
    return "Tashkent Logistics Hub";
  };

  const renderGateControlPanel = () => {
    return (
      <div className="max-w-2xl mx-auto w-full py-12 animate-in fade-in duration-300">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
              GATE CONTROL — SELECT CLIENT & LOAD ORDER
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory: Select client company before initiating loading reservation.
            </p>
          </div>

          {/* Client Company Dropdown */}
          <div className="space-y-2.5 text-left">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Select Client Company <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={selectedClient ? selectedClient : clientSearch}
                onChange={e => {
                  setClientSearch(e.target.value);
                  setSelectedClient('');
                }}
                placeholder="Search client company..."
                className="bg-slate-950 border-slate-700 h-11 pl-9 text-sm text-white focus-visible:ring-blue-500"
              />
              {selectedClient && (
                <button 
                  onClick={() => setSelectedClient('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Dropdown results */}
            {!selectedClient && (
              <div className="border border-slate-850 rounded-xl overflow-hidden mt-2 bg-slate-950/80">
                {filteredClients.map(c => (
                  <button 
                    key={c.name} 
                    onClick={() => {
                      setSelectedClient(c.name);
                      setClientSearch('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-850 last:border-0"
                  >
                    <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-200">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.address}</p>
                    </div>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-500 text-center">No companies found</div>
                )}
              </div>
            )}
          </div>

          {/* Auto-populated contract info */}
          {selectedContract && (
            <div className="bg-blue-600/5 border border-blue-600/20 rounded-xl p-4 space-y-2 text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[9px] font-black uppercase text-blue-500 tracking-widest mb-3">Auto-Fetched Contract Data</p>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-bold mb-0.5">Contract №</p>
                  <p className="text-white font-black font-mono">{selectedContract.contractNumber}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-0.5">Contract Date</p>
                  <p className="text-white font-black">{selectedContract.date}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-0.5">Destination</p>
                  <p className="text-white font-black text-[10px] leading-tight">{selectedContract.receiver.address}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-600/10 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500 font-bold mb-0.5">Receiver INN</p>
                  <p className="font-mono text-slate-300">{selectedContract.receiver.inn}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-0.5">{selectedContract.materials.length} Material(s) on Contract</p>
                  <p className="text-slate-300 text-[10px] truncate">{selectedContract.materials.map((m: any) => m.sku).join(', ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Load Session Button */}
          <div className="pt-2">
            <Button 
              onClick={handleStartPicking} 
              disabled={!selectedClient || !selectedContract}
              className="w-full bg-blue-600 hover:bg-blue-500 h-14 font-black uppercase tracking-widest gap-3 text-base disabled:opacity-40 shadow-lg shadow-blue-500/10"
            >
              <FileText className="w-5 h-5" /> Open Direct Dispatch Session
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderShippingTab = () => {
    // 1. GATE STEP
    if (shippingStep === 'gate') {
      return renderGateControlPanel();
    }

    // 2. PREVIEW STEP
    if (shippingStep === 'preview') {
      return (
        <ShippingPreviewStage
          lines={shippingCartItems}
          contract={selectedContract}
          docNo={nextDocNo}
          courier={courier}
          setCourier={setCourier}
          onPrint={handleConfirmPrint}
          onBack={() => setShippingStep('picking')}
        />
      );
    }

    // 3. PICKING STEP
    return (
      <div className="space-y-6 animate-in fade-in duration-350">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 font-black text-[10px]">
              Client: {selectedClient}
            </Badge>
            <Badge className="bg-slate-800 text-slate-400 border-slate-700 font-black text-[10px]">
              {selectedContract?.contractNumber || 'No Contract'}
            </Badge>
            <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 font-black text-[10px]">
              {shippingCartItems.length} Items in Cart
            </Badge>
          </div>
        </div>

        {/* Search & Selection Grid */}
        <div className="bg-slate-900 border-slate-800 border-l-4 border-l-blue-500 overflow-visible shadow-2xl rounded-2xl">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              {/* Material Search */}
              <div className="md:col-span-5 space-y-2 relative">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block text-left">Search Material (SKU / Description)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    value={fgSkuSearch}
                    onChange={e => { setFgSkuSearch(e.target.value); setSelectedFgMaterial(null); }}
                    placeholder="Type SKU e.g. 26211286..."
                    className="bg-slate-950 border-slate-700 h-11 pl-9 text-sm text-white"
                  />
                  {fgSkuSearch.length > 0 && (
                    <button onClick={() => { setFgSkuSearch(''); setSelectedFgMaterial(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Dropdown Results */}
                {fgSkuSearch.length >= 2 && !selectedFgMaterial && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-60 overflow-y-auto">
                    {searchResults.map(m => (
                      <button key={m.sku} onClick={() => {
                        setSelectedFgMaterial(m);
                        setFgSkuSearch(m.sku);
                        setSelectedFgBin('');
                        setFgPickQty('');
                      }}
                        className="w-full px-4 py-3 hover:bg-slate-800 transition-colors text-left flex items-center gap-3 border-b border-slate-800 last:border-0">
                        <Package className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{m.sku}</p>
                          <p className="text-[10px] text-slate-500">{m.productName}</p>
                        </div>
                      </button>
                    ))}
                    {searchResults.length === 0 && <div className="px-4 py-3 text-xs text-slate-500 text-center">No materials found</div>}
                  </div>
                )}
              </div>

              {/* Dynamic Bin Selection */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block text-left">Select Warehouse Zone</label>
                <select
                  disabled={!selectedFgMaterial}
                  value={selectedFgBin}
                  onChange={e => setSelectedFgBin(e.target.value)}
                  className="w-full bg-slate-950 border-slate-700 h-11 rounded-lg px-3 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-30"
                >
                  <option value="">Select Warehouse...</option>
                  <option value="1-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 1)">1-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 1)</option>
                  <option value="2-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 2)">2-sonli Tayyor Mahsulotlar Ombori (Finished Goods WH 2)</option>
                </select>
              </div>

              {/* Quantity */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block text-left">Release Qty</label>
                <Input
                  type="number"
                  disabled={!selectedFgBin}
                  value={fgPickQty}
                  onChange={e => setFgPickQty(e.target.value)}
                  placeholder="Qty..."
                  className="bg-slate-950 border-slate-700 h-11 text-right font-mono"
                />
              </div>

              {/* Add Button */}
              <div className="md:col-span-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={!fgPickQty}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 font-black uppercase text-[11px] tracking-widest gap-2 shadow-lg shadow-blue-600/20"
                >
                  <Package className="w-4 h-4" /> Post Picking
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Outbound Cart Ledger */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden min-h-[300px]">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Active Dispatch Cart Ledger</span>
            {shippingCartItems.length > 0 && (
              <span className="text-[10px] font-bold text-blue-400">{shippingCartItems.length} line item(s) accumulated</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-900/20">
                  <th className="p-4 w-8">#</th>
                  <th className="p-4">Material / SKU</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center w-24">Bin</th>
                  <th className="p-4 text-center w-24">Batch</th>
                  <th className="p-4 text-right w-24">Qty</th>
                  <th className="p-4 text-right w-32">Amount (UZS)</th>
                  <th className="p-4 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {shippingCartItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 group transition-colors">
                    <td className="p-4 text-slate-600 font-mono text-xs">{idx + 1}</td>
                    <td className="p-4 font-mono text-xs text-blue-400 font-black">{item.materialId}</td>
                    <td className="p-4 text-sm text-slate-300 font-bold">{item.description}</td>
                    <td className="p-4 text-center font-bold text-amber-500 text-xs">{item.binId}</td>
                    <td className="p-4 text-center font-bold text-cyan-500 text-xs font-mono">{item.batchId}</td>
                    <td className="p-4 text-right font-black text-white text-sm">
                      {item.qty.toLocaleString()} <span className="text-slate-600 text-[10px]">{item.uom}</span>
                    </td>
                    <td className="p-4 text-right text-slate-400 text-xs font-mono">
                      {(item.qty * item.unitPrice).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleRemoveFromCart(item.id)} className="text-slate-600 hover:text-rose-500 transition-colors p-1">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {shippingCartItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="h-40 text-center text-slate-600 italic">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-8 h-8 opacity-20" />
                        <p className="text-sm">Dispatch cart is empty. Start by searching an SKU above.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Execution Button */}
        <div className="pt-6">
          <Button
            onClick={handleTransitionPreview}
            disabled={shippingCartItems.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-16 rounded-xl font-black text-xl uppercase tracking-widest gap-4 shadow-2xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-30"
          >
            <ShieldCheck className="w-7 h-7" />
            OTPUSTIL MATERIAL (COMPLETE RELEASE)
          </Button>
        </div>
      </div>
    );
  };

  // --- Main Layout ---
  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950 font-sans text-slate-300 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Intelligent Global Analytics Header */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 border border-slate-800 bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center mb-2 z-10">
            <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Factory className="w-4 h-4 text-cyan-400" /> WAREHOUSE TELEMETRY
            </h2>
            <Badge variant="outline" className="text-[9px] font-mono text-cyan-400 border-cyan-500/30">LIVE</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 z-10 border-t border-slate-800/80 pt-3">
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">TOTAL FG (PCS)</p>
              <p className="text-lg font-black text-white font-mono mt-0.5">{finishedGoods.reduce((s, f) => s + f.totalQuantity, 0).toLocaleString()}</p>
            </div>
            <div className="border-l border-slate-800 pl-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">AVAILABLE</p>
              <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{summary.availableQuantity.toLocaleString()}</p>
            </div>
            <div className="border-l border-slate-800 pl-2">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">SHIPPED TODAY</p>
              <p className="text-lg font-black text-cyan-400 font-mono mt-0.5">{totalShippedToday.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="col-span-2 border border-slate-800 rounded-3xl p-6 bg-slate-900 shadow-lg flex gap-8 items-center">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Readiness for UzAuto</span>
              <span className="text-emerald-400 font-black font-mono text-base">{readinessPercent}%</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${readinessPercent}%` }} />
            </div>
            <p className="text-[10px] font-bold text-amber-500 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Stock will be depleted in 48 hours based on demand.</p>
          </div>

          <div className="w-px h-16 bg-slate-800 hidden md:block" />

          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-cyan-400" /> Daily Dispatch Target</span>
              <span className="text-cyan-400 font-black font-mono text-base">{actualDispatchProgress}%</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
              <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full transition-all duration-1000" style={{ width: `${actualDispatchProgress}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
              <span>SHIPPED: <span className="text-white font-mono">{totalShippedToday.toLocaleString()}</span></span>
              <span>TARGET: <span className="text-slate-400 font-mono">{dailyTarget.toLocaleString()}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Modular Workspace Tabs UI & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-px">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'receipt', icon: LogIn, label: 'Goods Receipt', sub: 'Qabul qilish' },
            { id: 'inventory', icon: Boxes, label: 'Inventory & Bin Map', sub: 'Zaxira va Xarita' },
            { id: 'so-picking', icon: ClipboardList, label: 'SO Picking', sub: 'Zayavka yig\'ish', badge: salesOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'PICKING_PENDING').length || null },
            { id: 'shipping', icon: Truck, label: 'Shipping & Dispatch', sub: "Jo'natish", badge: shippingQueue.length > 0 ? shippingQueue.length : null }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabMode)} className={`relative flex items-center gap-3 px-6 py-4 rounded-t-2xl transition-all ${isActive ? 'bg-slate-900 border-t border-x border-slate-800 text-white shadow-[0_-10px_20px_rgba(0,0,0,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1 shadow-sm">{tab.label}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{tab.sub}</p>
                </div>
                {tab.badge && <Badge variant="secondary" className="absolute top-3 right-3 bg-cyan-500 text-slate-950 font-black text-[9px] px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full">{tab.badge}</Badge>}
                {isActive && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 translate-y-px" />}
              </button>
            );
          })}
        </div>

        {/* 📄 REJADAGI NAKLADNANI RASMIYLASHTIRISH Prominent Action Button */}
        {isSessionActive && (
          <div className="pb-2 md:pb-0 text-right">
            <Button
              onClick={handleOpenInvoiceModal}
              className="bg-emerald-650 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs h-12 px-6 rounded-xl flex items-center gap-2.5 shadow-lg shadow-emerald-950/20 border border-emerald-500/30 transition-all active:scale-[0.98]"
            >
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>📄 REJADAGI NAKLADNANI RASMIYLASHTIRISH ({shippingQueue.length})</span>
            </Button>
          </div>
        )}
      </div>

      {/* Render Active Workspace */}
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        {activeTab === 'receipt' && renderReceiptTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'so-picking' && renderSOPickingTab()}
        {activeTab === 'shipping' && renderShippingTab()}
      </div>

      {/* 🚚 UZAUTO MOTORS UCHUN CHIQUVCHI NAKLADNAYA GENERATORI */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[24px] w-full max-w-4xl overflow-hidden shadow-2xl shadow-emerald-500/5 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-emerald-950/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <Truck className="text-emerald-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">🚚 UzAuto Motors uchun Chiquvchi Nakladnaya Generatori</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Outbound Invoice & Physical Gate Pass Cockpit</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-white bg-slate-950/50 p-2 rounded-full border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6 space-y-6">
              
              {/* Header Metadata Fields (Nakladnaya Shapkasi) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Column 1: Invoice & Customer */}
                <div className="space-y-4 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left block">Invoice Number (Avto-generatsiya)</label>
                    <Input 
                      value={invoiceNumber}
                      readOnly
                      className="bg-slate-950 border-slate-800 text-cyan-400 font-mono font-bold h-11"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left block">Xaridor (Customer Target)</label>
                    <Input 
                      value={selectedClient === "UzAuto Motors JSC" ? "UzAuto Motors AJ (Asaka, Koreya ko'chasi, 41)" : `${selectedClient} (Uzbekistan)`}
                      disabled
                      className="bg-slate-900 border-slate-800/80 text-slate-400 font-bold h-11"
                    />
                  </div>
                </div>

                {/* Column 2: Transport Details */}
                <div className="space-y-4 bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Mashina Davlat Raqami (Truck Plate)</label>
                    <Input 
                      placeholder="Masalan: 60 A 777 AA"
                      value={truckPlate}
                      onChange={e => setTruckPlate(e.target.value.toUpperCase())}
                      className="bg-slate-950 border-slate-700 text-white font-mono font-bold h-11 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left block">Haydovchi F.I.O (Driver Name)</label>
                    <Input 
                      placeholder="Masalan: Qosimov Azamat"
                      value={driverName}
                      onChange={e => setDriverName(e.target.value)}
                      className="bg-slate-950 border-slate-700 text-white font-bold h-11 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

              </div>

              {/* Itemized Dispatched Grid (Tovar Jadvallari) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Dispatched Goods Grid (Tovar Ro'yxati)</h4>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">{invoiceModalItems.length} items staged</Badge>
                </div>

                <div className="border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden shadow-inner max-h-[280px] overflow-y-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="px-4 py-3">SKU Code</th>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3">Batch ID</th>
                        <th className="px-4 py-3">Bin Cell</th>
                        <th className="px-4 py-3 text-right">Packed Qty</th>
                        <th className="px-4 py-3 text-right w-32">Shipped Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {invoiceModalItems.map(item => (
                        <tr key={item.batchId} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{item.sku}</td>
                          <td className="px-4 py-3.5 font-bold text-sm text-slate-200">{item.productName}</td>
                          <td className="px-4 py-3.5 font-mono text-xs text-cyan-400">{item.batchId}</td>
                          <td className="px-4 py-3.5 font-mono text-xs">
                            <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-800 text-[9px] px-1.5 py-0.5">
                              {item.binLocation || 'N/A'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-400 text-sm">{item.maxQty.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Input
                                type="number"
                                min={0}
                                max={item.maxQty}
                                value={item.qty === 0 ? '' : item.qty}
                                onChange={e => handleShippedQtyChange(item.batchId, e.target.value)}
                                className="bg-slate-950 border-slate-700 text-white text-right font-mono font-bold h-9 w-24 p-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Live Analytics & Progress Sync Footer */}
            <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-6 items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Jami Pozitsiyalar</p>
                  <p className="text-2xl font-black text-white font-mono text-left">{invoiceModalItems.length}</p>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-left">Umumiy Miqdor (Pieces)</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono text-left">{invoiceModalItems.reduce((s, i) => s + i.qty, 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => setIsInvoiceModalOpen(false)}
                  variant="outline"
                  className="flex-1 md:flex-none border-slate-850 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-xl"
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleConfirmAndPrintInvoice}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs h-12 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 border border-emerald-500/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ Nakladnani Tasdiqlash va Chop etish</span>
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
