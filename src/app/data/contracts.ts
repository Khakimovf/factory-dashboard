export interface CompanyDetails {
    name: string;
    address: string;
    inn: string;
    mfo: string;
    account: string;
    bank: string;
}

export interface ContractMaterial {
    sku: string;
    description: string;
    uom: string;
    unitPrice: number;
    expectedQty?: number; // For Inbound
}

export interface Contract {
    id: string;
    contractNumber: string;
    date: string;
    supplier: CompanyDetails;
    receiver: CompanyDetails;
    materials: ContractMaterial[];
}

export const mockContracts: Contract[] = [
    {
        id: 'CON-120A',
        contractNumber: 'Contract №120-A',
        date: '2026-04-10',
        supplier: {
            name: 'UZ-TONG HONG CO., LTD',
            address: 'Andijan region, Asaka city, Uzbekistan',
            inn: '201234567',
            mfo: '00440',
            account: '20208000600123456001',
            bank: 'Asaka Bank'
        },
        receiver: {
            name: 'UzAuto Motors JSC',
            address: 'Asaka, Andijan region, Uzbekistan',
            inn: '200112233',
            mfo: '00821',
            account: '20210000300987654321',
            bank: 'NBU Bank'
        },
        materials: [
            { sku: 'DT-FL-001', description: 'Door Trim Front Left', uom: 'шт', unitPrice: 45000, expectedQty: 500 },
            { sku: 'DT-FR-002', description: 'Door Trim Front Right', uom: 'шт', unitPrice: 45000, expectedQty: 500 },
        ]
    },
    {
        id: 'CON-445B',
        contractNumber: 'Contract №445-B',
        date: '2026-05-15',
        supplier: {
            name: 'Kwangjin Auto Parts',
            address: 'Seoul, South Korea',
            inn: '302334455',
            mfo: '00980',
            account: '20208000600987654002',
            bank: 'KDB Bank'
        },
        receiver: {
            name: 'UzAuto Motors JSC',
            address: 'Asaka, Andijan region, Uzbekistan',
            inn: '200112233',
            mfo: '00821',
            account: '20210000300987654321',
            bank: 'NBU Bank'
        },
        materials: [
            { sku: 'HS-MT-003', description: 'Metal Sheet 2mm', uom: 'кг', unitPrice: 12500, expectedQty: 10000 },
            { sku: 'RB-SL-006', description: 'Rubber Seal Ring', uom: 'шт', unitPrice: 2100, expectedQty: 2500 },
        ]
    }
];
