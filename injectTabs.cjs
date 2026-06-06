const fs = require('fs');
const file = 'src/app/pages/finished-goods/FinishedGoodsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const injectionCode = `
        {/* Sales Module Tabs Merged into FG */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input value={salesSearch} onChange={e => setSalesSearch(e.target.value)} placeholder="Search orders, customers..." className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 rounded-xl w-full" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2 outline-none focus:border-violet-500">
                  <option value="ALL">All Statuses</option>
                  {FLOW_STEPS.map(s => (<option key={s} value={s}>{STATUS_CONFIG[s].label}</option>))}
                </select>
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-violet-400" /> Sales Order Management
                </h2>
                <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 font-mono">{filteredOrders.length} Orders</Badge>
              </div>
              <div className="divide-y divide-slate-800/50">
                {filteredOrders.length > 0 ? filteredOrders.map(o => <OrderRow key={o.id} order={o} />) : (
                  <div className="p-8 text-center"><ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-500 font-bold">No orders found</p></div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'atp' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {salesOrders.filter(o => o.status === 'DRAFT').length === 0 ? (
                <div className="md:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                  <h3 className="text-white font-bold mb-2">Caught Up!</h3>
                  <p className="text-slate-500 text-sm">All draft orders have had availability checked.</p>
                </div>
              ) : (
                salesOrders.filter(o => o.status === 'DRAFT').map(o => (
                  <div key={o.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-sky-400 font-black tracking-widest font-mono mb-1 block">PENDING ATP</span>
                        <h3 className="text-lg font-black text-white">{o.id}</h3>
                      </div>
                      <Badge variant="outline" className="bg-slate-900 text-slate-400 font-mono">{o.lines.length} Line(s)</Badge>
                    </div>
                    <p className="text-sm font-bold text-slate-300 mb-4">{o.customer}</p>
                    <ATPModal orderId={o.id} onClose={() => {}} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'idoc' && (
          <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)] min-h-[500px]">
             <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col hidden lg:flex">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50"><h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Send className="w-4 h-4 text-cyan-400" /> Dispatch Interface</h3></div>
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                   {salesOrders.filter(o => o.status === 'GOODS_ISSUED').length === 0 ? <div className="text-center p-8 text-slate-500"><Send className="w-8 h-8 mx-auto mb-2 opacity-50" />No Pending Dispatches</div> : salesOrders.filter(o => o.status === 'GOODS_ISSUED').map(o => (
                      <div key={o.id} onClick={() => setIdocOrderId(o.id)} className={\`p-4 rounded-xl border cursor-pointer transition-all \${idocOrderId === o.id ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}\`}>
                         <div className="flex justify-between mb-2"><span className="font-mono font-black text-sm text-white">{o.id}</span><span className="text-xs text-slate-400">{o.customer}</span></div>
                         <div className="flex items-center gap-3 text-[10px] font-mono text-cyan-400"><Shield className="w-3.5 h-3.5" />{o.sapPartnerNumber} | DELVRY03</div>
                      </div>
                   ))}
                </div>
             </div>
             <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between"><h3 className="text-sm font-black text-white uppercase">IDoc JSON Viewer</h3>
                   {idocPayload && <Button onClick={copyIdoc} size="sm" variant="outline" className="h-8 gap-2 border-slate-700 text-slate-300 hover:text-white"><Copy className="w-3.5 h-3.5" /> {idocCopied ? 'Copied' : 'Copy'}</Button>}
                </div>
                <div className="p-4 flex-1 bg-slate-950/50 font-mono text-xs overflow-y-auto text-emerald-400/80 p-6 whitespace-pre-wrap">
                   {idocPayload ? JSON.stringify(idocPayload, null, 2) : <div className="flex h-full items-center justify-center text-slate-600">Select an order</div>}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CUSTOMERS.map(c => (
              <div key={c.partnerNum} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center"><Building className="w-5 h-5 text-indigo-400" /></div>
                  <Badge variant="outline" className={\`font-mono \${c.segment === 'Platinum' ? 'bg-slate-300 text-slate-800' : c.segment === 'Gold' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400'}\`}>{c.segment}</Badge>
                </div>
                <h3 className="text-lg font-black text-white mb-1">{c.name}</h3>
                <p className="text-xs font-mono text-slate-500 mb-6">Partner: {c.partnerNum}</p>
                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                   <div className="flex items-center gap-3 text-sm text-slate-300"><Users className="w-4 h-4 text-slate-500" />{c.contact}</div>
                   <div className="flex items-center gap-3 text-sm text-slate-300 truncate"><FileText className="w-4 h-4 text-slate-500" />{c.email}</div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 border-dashed flex justify-between items-center group-hover:text-indigo-400 cursor-pointer">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">Order History</span>
                   <ArrowUpRight className="w-4 h-4 text-slate-600 transition-colors" /></div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Revenue (UZS)', value: (salesStats.totalRevenue / 1000000).toFixed(2) + 'M', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Orders Shipped', value: salesStats.shippedOrders, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Items Shipped', value: salesStats.shippedItems, icon: Boxes, color: 'text-violet-400', bg: 'bg-violet-500/10' }
              ].map(k => (
                <div key={k.label} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{k.label}</p>
                    <div className={\`w-8 h-8 rounded-lg flex items-center justify-center \${k.bg}\`}><k.icon className={\`w-4 h-4 \${k.color}\`} /></div>
                  </div>
                  <h3 className={\`text-3xl font-black font-mono \${k.color}\`}>{k.value}</h3>
                </div>
              ))}
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-[400px]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Revenue Trend (Simulated)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{name: 'Mon', rev: 45}, {name: 'Tue', rev: 52}, {name: 'Wed', rev: 38}, {name: 'Thu', rev: 65}, {name: 'Fri', rev: 48}]}>
                  <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v + 'M'} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '0.75rem' }} />
                  <Area type="monotone" dataKey="rev" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
`;

// Insert the code just before the shipping tab in the switch logic
const targetMarker = "{activeTab === 'shipping' && (";
if (code.includes(targetMarker)) {
    code = code.replace(targetMarker, injectionCode + '\\n\\n' + targetMarker);
    fs.writeFileSync(file, code, 'utf8');
    console.log('Tabs injection successful');
} else {
    console.log('Target marker not found');
}
