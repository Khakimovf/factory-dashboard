import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '../../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import { ContainerModalHeader } from './ContainerModalHeader';
import { ContainerModalFooter } from './ContainerModalFooter';
import { BasicInfoTab } from './tabs/BasicInfoTab';
import { CustomsTab } from './tabs/CustomsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { FinanceTab } from './tabs/FinanceTab';
import { TimelineTab } from './tabs/TimelineTab';
import { StatusPanel } from './sidebar/StatusPanel';
import { CargoList } from './sidebar/CargoList';
import { QuickActions } from './sidebar/QuickActions';
import { toast } from 'sonner';

const containerSchema = z.object({
    id: z.string().min(1, 'Konteyner raqami majburiy'),
    type: z.string().min(1, 'Tip majburiy'),
    origin: z.string().min(1, 'Mamlakat majburiy'),
    port: z.string().min(1, 'Port majburiy'),
    carrier: z.string().min(1, 'Tashuvchi majburiy'),
    seal: z.string().optional(),
    shipmentDate: z.string().optional(),
    etaDate: z.string().optional(),
    gtd: z.string().regex(/^GTD-\d{4}-\d{5}$/, 'Format: GTD-YYYY-XXXXX').or(z.literal('—')).or(z.literal('')),
    declarant: z.string().optional(),
    customsPayment: z.coerce.number().min(0, 'Musbat son bo\'lishi kerak'),
    inspectionDate: z.string().optional(),
    fobPrice: z.coerce.number().min(0),
    freightCost: z.coerce.number().min(0),
    insuranceCost: z.coerce.number().min(0),
    customsDuty: z.coerce.number().min(0),
    vatCost: z.coerce.number().min(0),
    status: z.string(),
});

type ContainerFormValues = z.infer<typeof containerSchema>;

interface ContainerModalProps {
    isOpen: boolean;
    onClose: () => void;
    container?: any; // If null, it's "Add New"
    onSave: (data: any) => void;
}

export const ContainerModal: React.FC<ContainerModalProps> = ({
    isOpen,
    onClose,
    container,
    onSave,
}) => {
    const [isEditMode, setIsEditMode] = useState(!container);

    const methods = useForm<any>({
        resolver: zodResolver(containerSchema),
        defaultValues: container || {
            id: '',
            type: "40' HC",
            origin: 'Xitoy',
            port: '',
            carrier: 'MAERSK',
            seal: '',
            shipmentDate: '',
            etaDate: '',
            gtd: '',
            declarant: 'Toshmatov Jasur',
            customsPayment: 0,
            inspectionDate: '',
            fobPrice: 0,
            freightCost: 0,
            insuranceCost: 0,
            customsDuty: 0,
            vatCost: 0,
            status: 'KUTILMOQDA',
        },
    });

    const { handleSubmit, formState: { isDirty }, reset, watch } = methods;

    const watchedId = watch('id');
    const watchedStatus = watch('status');

    useEffect(() => {
        if (isOpen) {
            reset(container || {
                id: '',
                type: "40' HC",
                origin: 'Xitoy',
                port: '',
                carrier: 'MAERSK',
                seal: '',
                shipmentDate: '',
                etaDate: '',
                gtd: '',
                declarant: 'Toshmatov Jasur',
                customsPayment: 0,
                inspectionDate: '',
                fobPrice: 0,
                freightCost: 0,
                insuranceCost: 0,
                customsDuty: 0,
                vatCost: 0,
                status: 'KUTILMOQDA',
            });
            setIsEditMode(!container);
        }
    }, [isOpen, container, reset]);

    const handleCloseAttempt = () => {
        if (isEditMode && isDirty) {
            if (window.confirm('O\'zgarishlar saqlanmadi. Baribir yopilsinmi?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const onFormSubmit = (data: ContainerFormValues) => {
        onSave(data);
        toast.success('Ma\'lumotlar saqlandi');
        setIsEditMode(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseAttempt()}>
            <DialogPortal>
                <DialogOverlay className="bg-black/80 backdrop-blur-md z-[150]" />
                <DialogContent className="fixed left-[50%] top-[50%] z-[160] w-full max-w-[1200px] h-[90vh] translate-x-[-50%] translate-y-[-50%] bg-[#0B1220] border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl p-0 gap-0 outline-none flex flex-col">
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full">
                            {/* Header */}
                            <ContainerModalHeader
                                containerId={watchedId}
                                status={watchedStatus}
                                isEditMode={isEditMode}
                                onToggleEditMode={setIsEditMode}
                                onClose={handleCloseAttempt}
                            />

                            {/* Main Content Area: 2-Column Layout */}
                            <div className="flex-1 overflow-hidden flex bg-[#0d1525]">
                                {/* Left Column: 60% Tabs */}
                                <div className="w-[60%] border-r border-slate-800/50 flex flex-col">
                                    <Tabs defaultValue="basic" className="flex-1 flex flex-col">
                                        <div className="px-8 pt-4">
                                            <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-auto rounded-xl">
                                                <TabsTrigger value="basic" className="px-6 py-2.5 text-[10px] font-black uppercase italic data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all">📦 Asosiy</TabsTrigger>
                                                <TabsTrigger value="customs" className="px-6 py-2.5 text-[10px] font-black uppercase italic data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all">🛃 Bojxona</TabsTrigger>
                                                <TabsTrigger value="docs" className="px-6 py-2.5 text-[10px] font-black uppercase italic data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all">📄 Hujjatlar</TabsTrigger>
                                                <TabsTrigger value="finance" className="px-6 py-2.5 text-[10px] font-black uppercase italic data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all">📊 Moliya</TabsTrigger>
                                                <TabsTrigger value="timeline" className="px-6 py-2.5 text-[10px] font-black uppercase italic data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-lg transition-all">⏱ Vaqt</TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                                            <TabsContent value="basic" className="mt-0 outline-none">
                                                <BasicInfoTab isEditMode={isEditMode} />
                                            </TabsContent>
                                            <TabsContent value="customs" className="mt-0 outline-none">
                                                <CustomsTab isEditMode={isEditMode} />
                                            </TabsContent>
                                            <TabsContent value="docs" className="mt-0 outline-none">
                                                <DocumentsTab isEditMode={isEditMode} />
                                            </TabsContent>
                                            <TabsContent value="finance" className="mt-0 outline-none">
                                                <FinanceTab isEditMode={isEditMode} />
                                            </TabsContent>
                                            <TabsContent value="timeline" className="mt-0 outline-none">
                                                <TimelineTab isEditMode={isEditMode} />
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </div>

                                {/* Right Column: 40% Sidebar */}
                                <div className="w-[40%] bg-[#0f172a]/30 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                    <StatusPanel isEditMode={isEditMode} />
                                    <CargoList isEditMode={isEditMode} />
                                    <QuickActions />
                                </div>
                            </div>

                            {/* Footer */}
                            <ContainerModalFooter
                                isEditMode={isEditMode}
                                hasChanges={isDirty}
                                onSave={handleSubmit(onFormSubmit)}
                                onCancel={() => {
                                    reset();
                                    setIsEditMode(false);
                                }}
                                onClose={handleCloseAttempt}
                                onEdit={() => setIsEditMode(true)}
                            />
                        </form>
                    </FormProvider>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );

    function watchId() {
        return methods.watch('id');
    }
    function watchStatus() {
        return methods.watch('status');
    }
};
