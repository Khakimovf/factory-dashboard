import { create } from 'zustand';

const getMaterialPrice = (sku: string): number => {
    const prices: Record<string, number> = {
        'DT-FL-001': 90,
        'DT-FR-002': 90,
        'HS-MT-003': 15,
        'PL-AB-004': 25,
        'SC-M8-005': 1.5,
        'RB-SL-006': 2,
        'WH-CV-007': 45,
        'FB-GR-008': 12,
        '26211286': 90,
        '26211284': 90,
        '26211277': 15,
        '26211281': 32,
        '13536589': 1.2,
        '13555291': 0.85
    };
    return prices[sku] || 25;
};

export interface GLEntry {
    id: string;
    date: string;
    account: string;
    description: string;
    debit: number;
    credit: number;
    costCenter?: string;
    status: 'posted';
}

export interface B2BContract {
    id: string;
    partyName: string;
    contractNo: string;
    subject: string;
    totalVolume: number;
    deliveredVolume: number;
    contractSum: number; // USD
    paidAmount: number;  // USD
    status: 'ACTIVE' | 'COMPLETED' | 'HOLD';
}

export interface AllocatedItem {
    sku: string;
    contractPrice: number;
    maxLimit: number;
    currentQty: number;
}

export interface OCRContract {
    id: string;
    party: string;
    type: 'SALES (SOTUV)' | 'PURCHASE (XARID)';
    vatRate: number;
    validUntil: string;
    totalVolumeValue: string;
    allocatedItems: AllocatedItem[];
}

interface FinanceState {
    entries: GLEntry[];
    contracts: B2BContract[];
    ocrContracts: OCRContract[];
    addVoucher: (
        debitAccount: string,
        creditAccount: string,
        amount: number,
        description: string,
        costCenter?: string,
        date?: string
    ) => void;
    recordContractProgress: (
        partyName: string,
        quantity: number,
        paidAmt?: number
    ) => void;
    addOcrContract: (contract: OCRContract) => void;
    incrementOcrContractQty: (contractId: string, sku: string, qty: number) => void;
}

const INITIAL_ENTRIES: GLEntry[] = [
    { id: 'GL-100', date: '2026-06-05', account: '1010 - Raw Material Inventory', description: 'Purchase: Plastic Granules', debit: 45000, credit: 0, status: 'posted' },
    { id: 'GL-100', date: '2026-06-05', account: '6010 - Accounts Payable / Vendor', description: 'Purchase: Plastic Granules', debit: 0, credit: 45000, status: 'posted' },
    { id: 'GL-099', date: '2026-06-04', account: '2010 - Work-In-Progress Balance', description: 'Issue raw stock to Assembly Line A', debit: 12000, credit: 0, status: 'posted', costCenter: 'Ishlab Chiqarish' },
    { id: 'GL-099', date: '2026-06-04', account: '1010 - Raw Material Inventory', description: 'Issue raw stock to Assembly Line A', debit: 0, credit: 12000, status: 'posted' },
    { id: 'GL-098', date: '2026-06-03', account: '6100 - Salary Expense', description: 'May operating wages distribution', debit: 85000, credit: 0, status: 'posted', costCenter: 'HR & Kadrlar' },
    { id: 'GL-098', date: '2026-06-03', account: '5010 - Cash', description: 'May operating wages distribution', debit: 0, credit: 85000, status: 'posted' },
    { id: 'GL-097', date: '2026-06-02', account: '5010 - Cash', description: 'GM Uzbekistan customer receipt', debit: 150000, credit: 0, status: 'posted' },
    { id: 'GL-097', date: '2026-06-02', account: '7010 - Sales Revenue', description: 'GM Uzbekistan customer receipt', debit: 0, credit: 150000, status: 'posted' }
];

const INITIAL_CONTRACTS: B2BContract[] = [
    { id: 'CON-001', partyName: 'UzAuto Motors JSC', contractNo: '№120-A', subject: 'Door Trim Supply', totalVolume: 50000, deliveredVolume: 32000, contractSum: 4500000, paidAmount: 3200000, status: 'ACTIVE' },
    { id: 'CON-002', partyName: 'Hardware Supply Co.', contractNo: '№85-B', subject: 'Raw Material Procurement', totalVolume: 100000, deliveredVolume: 78000, contractSum: 1200000, paidAmount: 950000, status: 'ACTIVE' },
    { id: 'CON-003', partyName: 'Metallurgiya TMC', contractNo: '№64-T', subject: 'Steel Sheet Supply', totalVolume: 20000, deliveredVolume: 15000, contractSum: 750000, paidAmount: 600000, status: 'ACTIVE' },
    { id: 'CON-004', partyName: 'GM Uzbekistan', contractNo: '№145-C', subject: 'Component Supply', totalVolume: 10000, deliveredVolume: 10000, contractSum: 850000, paidAmount: 850000, status: 'COMPLETED' }
];

const INITIAL_OCR_CONTRACTS: OCRContract[] = [
    {
        id: "Contract №120-A",
        party: "UzAuto Motors JSC",
        type: "SALES (SOTUV)",
        vatRate: 0.12,
        validUntil: "2027-12-31",
        totalVolumeValue: "500 000 000 UZS",
        allocatedItems: [
            { sku: "26211286", contractPrice: 45000, maxLimit: 5000, currentQty: 1250 },
            { sku: "26211284", contractPrice: 45000, maxLimit: 5000, currentQty: 980 }
        ]
    },
    {
        id: "PO-8821",
        party: "Hardware Supply Co.",
        type: "PURCHASE (XARID)",
        vatRate: 0.12,
        validUntil: "2026-11-30",
        totalVolumeValue: "120 000 000 UZS",
        allocatedItems: [
            { sku: "13536589", contractPrice: 1200, maxLimit: 100000, currentQty: 45000 }
        ]
    }
];

export const useFinanceStore = create<FinanceState>((set) => ({
    entries: INITIAL_ENTRIES,
    contracts: INITIAL_CONTRACTS,
    ocrContracts: INITIAL_OCR_CONTRACTS,
    addVoucher: (debitAccount, creditAccount, amount, description, costCenter, date) => set((state) => {
        const nextIdNum = state.entries.reduce((max, entry) => {
            const num = parseInt(entry.id.replace('GL-', ''));
            return isNaN(num) ? max : Math.max(max, num);
        }, 100) + 1;
        const journalId = `GL-${nextIdNum.toString().padStart(3, '0')}`;
        const postingDate = date || new Date().toISOString().split('T')[0];

        const debitLeg: GLEntry = {
            id: journalId,
            date: postingDate,
            account: debitAccount,
            description,
            debit: amount,
            credit: 0,
            costCenter,
            status: 'posted'
        };

        const creditLeg: GLEntry = {
            id: journalId,
            date: postingDate,
            account: creditAccount,
            description,
            debit: 0,
            credit: amount,
            costCenter,
            status: 'posted'
        };

        let updatedContracts = [...state.contracts];
        if (debitAccount.startsWith('6010') || creditAccount.startsWith('6010')) {
            const party = description.includes('Supplier') || costCenter ? (costCenter || 'Hardware Supply Co.') : 'Hardware Supply Co.';
            updatedContracts = updatedContracts.map(c => 
                c.partyName.toLowerCase().includes(party.toLowerCase()) || party.toLowerCase().includes(c.partyName.toLowerCase())
                    ? { ...c, paidAmount: c.paidAmount + amount }
                    : c
            );
        } else if (debitAccount.startsWith('5010') && creditAccount.startsWith('7010')) {
            const party = description.includes('GM') ? 'GM Uzbekistan' : 'UzAuto Motors JSC';
            updatedContracts = updatedContracts.map(c => 
                c.partyName.toLowerCase().includes(party.toLowerCase())
                    ? { ...c, paidAmount: c.paidAmount + amount }
                    : c
            );
        }

        return {
            entries: [debitLeg, creditLeg, ...state.entries],
            contracts: updatedContracts
        };
    }),
    recordContractProgress: (partyName, quantity, paidAmt) => set((state) => ({
        contracts: state.contracts.map(c => {
            const match = c.partyName.toLowerCase().includes(partyName.toLowerCase()) || 
                          partyName.toLowerCase().includes(c.partyName.toLowerCase());
            if (match) {
                const newDelivered = Math.min(c.totalVolume, c.deliveredVolume + quantity);
                const newPaid = paidAmt ? c.paidAmount + paidAmt : c.paidAmount;
                const status = newDelivered >= c.totalVolume ? 'COMPLETED' as const : c.status;
                return {
                    ...c,
                    deliveredVolume: newDelivered,
                    paidAmount: newPaid,
                    status
                };
            }
            return c;
        })
    })),
    addOcrContract: (contract) => set((state) => {
        if (state.ocrContracts.some(c => c.id === contract.id)) {
            return {
                ocrContracts: state.ocrContracts.map(c => c.id === contract.id ? contract : c)
            };
        }
        return {
            ocrContracts: [contract, ...state.ocrContracts]
        };
    }),
    incrementOcrContractQty: (contractId, sku, qty) => set((state) => ({
        ocrContracts: state.ocrContracts.map(c => {
            if (c.id === contractId) {
                return {
                    ...c,
                    allocatedItems: c.allocatedItems.map(item => 
                        item.sku === sku
                            ? { ...item, currentQty: item.currentQty + qty }
                            : item
                    )
                };
            }
            return c;
        })
    }))
}));

// ─── Executive CFO Selectors ──────────────────────────────────────────────────

export const getMonetaryStockVal = (stock: any[]) => {
    if (!stock || stock.length === 0) return 645000;

    const totalVal = stock.reduce((sum: number, item: any) => {
        const val = item.totalStock * getMaterialPrice(item.materialId);
        return sum + val;
    }, 0);

    return totalVal || 645000;
};

export const getDailyDispatchRevenue = (entries: GLEntry[]) => {
    const today = new Date().toISOString().split('T')[0];
    let dailySum = 0;

    entries.forEach(e => {
        if (e.date === today && e.account.startsWith('2010') && e.credit > 0) {
            dailySum += e.credit;
        } else if (e.date === today && e.account.startsWith('7010') && e.credit > 0) {
            dailySum += e.credit;
        }
    });

    return dailySum > 0 ? dailySum : 45000;
};

export const getVendorPaymentsSummary = (contracts: B2BContract[]) => {
    let totalOutstanding = 0;

    contracts.forEach(c => {
        if (c.subject.toLowerCase().includes('procurement') || c.subject.toLowerCase().includes('supply')) {
            const outstanding = Math.max(0, c.contractSum - c.paidAmount);
            totalOutstanding += outstanding;
        }
    });

    return {
        paidToday: 12500,
        totalOutstanding
    };
};

export const getFunnelPipelineData = (entries: GLEntry[], stock: any[]) => {
    if (!stock || stock.length === 0) {
        return {
            rawVal: 210000,
            wipVal: 342000,
            fgVal: 540000,
            exportVal: 4120000
        };
    }

    const rawVal = stock
        .filter((item: any) => item.category === 'RAW_MATERIAL' || item.category === 'SPARE_PART')
        .reduce((sum: number, item: any) => sum + item.totalStock * getMaterialPrice(item.materialId), 0);

    const wipVal = stock
        .filter((item: any) => item.category === 'WIP' || item.category === 'SEMI_FINISHED')
        .reduce((sum: number, item: any) => sum + item.totalStock * getMaterialPrice(item.materialId), 0);

    const fgVal = stock
        .filter((item: any) => item.category === 'FINISHED_GOODS')
        .reduce((sum: number, item: any) => sum + item.totalStock * getMaterialPrice(item.materialId), 0);

    const baseRevenue = 3970000;
    let newRevenue = 0;
    entries.forEach(e => {
        const idNum = parseInt(e.id.replace('GL-', ''));
        if (idNum > 100 && e.account.startsWith('7010')) {
            newRevenue += e.credit - e.debit;
        }
    });

    const exportVal = baseRevenue + newRevenue + 150000;

    return {
        rawVal: rawVal > 0 ? rawVal : 210000,
        wipVal: wipVal > 0 ? wipVal : 342000,
        fgVal: fgVal > 0 ? fgVal : 540000,
        exportVal
    };
};

export const getFinanceKPIs = (entries: GLEntry[]) => {
    const baseRevenue = 3970000;
    const baseExpense = 2753000;
    const baseWIP = 330000;

    let newRevenue = 0;
    let newExpense = 0;
    let newWIP = 0;

    entries.forEach(entry => {
        const idNum = parseInt(entry.id.replace('GL-', ''));
        if (idNum > 100) {
            if (entry.account.startsWith('7010')) {
                newRevenue += entry.credit - entry.debit;
            }
            if (entry.account.startsWith('6100') || entry.account.startsWith('4010')) {
                newExpense += entry.debit - entry.credit;
            }
            if (entry.account.startsWith('2010')) {
                newWIP += entry.debit - entry.credit;
            }
        }
    });

    const totalRevenue = baseRevenue + newRevenue + 150000;
    const totalExpense = baseExpense + newExpense + 85000;
    const totalWIP = baseWIP + newWIP + 12000;
    const netProfit = totalRevenue - totalExpense;

    return {
        revenue: totalRevenue,
        expense: totalExpense,
        netProfit,
        wip: totalWIP,
        revenueStr: `$${(totalRevenue / 1000000).toFixed(2)}M`,
        expenseStr: `$${(totalExpense / 1000000).toFixed(2)}M`,
        netProfitStr: `$${(netProfit / 1000000).toFixed(2)}M`,
        wipStr: `$${(totalWIP / 1000).toFixed(0)}K`
    };
};

export const getMonthlyCashflow = (entries: GLEntry[]) => {
    const base = [
        { month: 'Yan', income: 480000, expense: 310000 },
        { month: 'Fev', income: 520000, expense: 340000 },
        { month: 'Mar', income: 490000, expense: 290000 },
        { month: 'Apr', income: 610000, expense: 420000 },
        { month: 'May', income: 580000, expense: 380000 },
        { month: 'Iyn', income: 720000, expense: 460000 },
    ];

    entries.forEach(entry => {
        const idNum = parseInt(entry.id.replace('GL-', ''));
        if (idNum > 100) {
            const dateObj = new Date(entry.date);
            const monthIndex = dateObj.getMonth();
            
            if (monthIndex >= 0 && monthIndex < 6) {
                if (entry.account.startsWith('7010')) {
                    base[monthIndex].income += entry.credit;
                } else if (entry.account.startsWith('6100') || entry.account.startsWith('4010') || entry.account.startsWith('2010')) {
                    base[monthIndex].expense += entry.debit;
                }
            }
        }
    });

    return base;
};

export const getBudgetBreakdown = (entries: GLEntry[]) => {
    const base = [
        { name: 'Ishlab Chiqarish', budget: 300000, spent: 245000, color: '#6366f1' },
        { name: 'HR & Kadrlar', budget: 150000, spent: 132000, color: '#8b5cf6' },
        { name: 'Ta\'minot', budget: 200000, spent: 175000, color: '#06b6d4' },
        { name: 'Texozlash', budget: 80000, spent: 67000, color: '#f59e0b' },
        { name: 'Boshqaruv', budget: 60000, spent: 42000, color: '#10b981' },
    ];

    entries.forEach(entry => {
        if (entry.costCenter && entry.debit > 0) {
            const cc = entry.costCenter;
            const found = base.find(b => 
                b.name.toLowerCase() === cc.toLowerCase() || 
                (cc.toLowerCase().includes('tpa') && b.name === 'Ishlab Chiqarish')
            );
            if (found) {
                found.spent += entry.debit;
            }
        }
    });

    return base;
};
