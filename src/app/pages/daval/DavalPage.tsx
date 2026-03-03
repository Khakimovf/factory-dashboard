/**
 * Daval — xom ashyo hisobi (frontend-only MVP).
 * Mock data, no API. Status colors: RED (kam), YELLOW (yaqin), BLUE (yetarli).
 */
import { useState } from 'react';
import { Package, FileDown, ListPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { cn } from '../../components/ui/utils';

// Mock material row: static fields + user input (box count)
interface MockMaterial {
  id: string;
  detalKodi: string;
  detalNomi: string;
  qutida: number;
  minimalZaxira: number;
}

const MOCK_MATERIALS: MockMaterial[] = [
  { id: '1', detalKodi: '26211281', detalNomi: 'Bolt M8x20', qutida: 100, minimalZaxira: 500 },
  { id: '2', detalKodi: '26211282', detalNomi: 'Gayka M8', qutida: 200, minimalZaxira: 800 },
  { id: '3', detalKodi: '26211283', detalNomi: 'Shayba 8mm', qutida: 500, minimalZaxira: 1000 },
  { id: '4', detalKodi: '26211284', detalNomi: 'Prokladka A', qutida: 50, minimalZaxira: 200 },
  { id: '5', detalKodi: '26211285', detalNomi: 'Shtamp B', qutida: 30, minimalZaxira: 150 },
  { id: '6', detalKodi: '26211286', detalNomi: 'Klammer C', qutida: 100, minimalZaxira: 400 },
  { id: '7', detalKodi: '26211287', detalNomi: 'Konsol D', qutida: 20, minimalZaxira: 80 },
  { id: '8', detalKodi: '26211288', detalNomi: 'Sim armatura 1m', qutida: 25, minimalZaxira: 120 },
];

type StatusVariant = 'red' | 'yellow' | 'blue';

function getStatus(jamiQoldiq: number, minimalZaxira: number): StatusVariant {
  if (jamiQoldiq < minimalZaxira) return 'red';
  const lower = minimalZaxira * 0.8;
  const upper = minimalZaxira * 1.2;
  if (jamiQoldiq >= lower && jamiQoldiq <= upper) return 'yellow';
  return 'blue';
}

const rowBg: Record<StatusVariant, string> = {
  red: 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500',
  yellow: 'bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500',
  blue: 'bg-blue-50/50 dark:bg-blue-950/10 border-l-4 border-l-blue-400',
};

export function DavalPage() {
  // boxCountByMaterialId[id] = number of boxes (user input)
  const [boxCounts, setBoxCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    MOCK_MATERIALS.forEach((m) => { init[m.id] = 0; });
    return init;
  });

  const setBoxCount = (id: string, value: number) => {
    setBoxCounts((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  };

  return (
    <div className="min-h-screen p-6 bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Daval — xom ashyo hisobi
          </h1>
          <p className="text-muted-foreground mt-1">
            Qoldiqlarni tekshirish va yetkazib berish ro‘yxatini tayyorlash
          </p>
        </div>

        {/* Actions (placeholder) */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" size="sm">
            <ListPlus className="w-4 h-4 mr-2" />
            Daval ro‘yxatiga qo‘shish
          </Button>
          <Button variant="outline" size="sm" disabled>
            <FileDown className="w-4 h-4 mr-2" />
            PDF ga tayyorlash
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Detal kodi</TableHead>
                <TableHead>Detal nomi</TableHead>
                <TableHead className="text-right">Qutida (dona)</TableHead>
                <TableHead className="text-right">Minimal zaxira</TableHead>
                <TableHead className="text-right">Joriy qoldiq (quti)</TableHead>
                <TableHead className="text-right">Jami qoldiq</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_MATERIALS.map((m) => {
                const boxes = boxCounts[m.id] ?? 0;
                const jamiQoldiq = m.qutida * boxes;
                const status = getStatus(jamiQoldiq, m.minimalZaxira);
                const statusLabel =
                  status === 'red' ? 'Kam' : status === 'yellow' ? 'Yaqin' : 'Yetarli';
                return (
                  <TableRow key={m.id} className={rowBg[status]}>
                    <TableCell className="font-mono text-sm">{m.detalKodi}</TableCell>
                    <TableCell>{m.detalNomi}</TableCell>
                    <TableCell className="text-right">{m.qutida}</TableCell>
                    <TableCell className="text-right">{m.minimalZaxira}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        value={boxes || ''}
                        onChange={(e) => {
                          const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          if (!Number.isNaN(v)) setBoxCount(m.id, v);
                        }}
                        className="w-20 text-right h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">{jamiQoldiq}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded',
                          status === 'red' && 'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200',
                          status === 'yellow' && 'bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200',
                          status === 'blue' && 'bg-blue-200 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                        )}
                      >
                        {statusLabel}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

