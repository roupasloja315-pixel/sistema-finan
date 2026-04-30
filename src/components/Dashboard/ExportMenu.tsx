import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RawRecord {
  id: string;
  unit_id: string | null;
  category_id: string | null;
  value: number;
  observation: string;
  date: string;
  type: 'expense' | 'revenue';
  units?: { id: string; name: string; color: string } | null;
  categories?: { id: string; name: string } | null;
  subcategories?: { id: string; name: string } | null;
}

interface UnitSummary {
  name: string;
  revenueTotal: number;
  expenseTotal: number;
}

interface Props {
  records: RawRecord[];
  unitSummary: UnitSummary[];
  totalRevenues: number;
  totalExpenses: number;
  netResult: number;
  margin: number | null;
  dateRange: { start: string; end: string };
}

const fmtBRL = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
const fmtDateRange = (start: string, end: string) =>
  `${fmtDate(start)} a ${fmtDate(end)}`;

export default function ExportMenu({ records, unitSummary, totalRevenues, totalExpenses, netResult, margin, dateRange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function exportExcel() {
    setOpen(false);
    const wb = XLSX.utils.book_new();

    const summaryData = [
      ['RESUMO FINANCEIRO'],
      [`Periodo: ${fmtDateRange(dateRange.start, dateRange.end)}`],
      [],
      ['Indicador', 'Valor'],
      ['Total de Receitas', fmtBRL(totalRevenues)],
      ['Total de Despesas', fmtBRL(totalExpenses)],
      ['Resultado Liquido', `${netResult >= 0 ? '+' : '-'}${fmtBRL(netResult)}`],
      ['Margem', margin !== null ? `${margin.toFixed(1)}%` : '—'],
      ['Qtd. Receitas', records.filter(r => r.type === 'revenue').length],
      ['Qtd. Despesas', records.filter(r => r.type === 'expense').length],
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(summaryData);
    wsResumo['!cols'] = [{ wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    const revenueRows = [
      ['Data', 'Unidade', 'Categoria', 'Subcategoria', 'Observacao', 'Valor (R$)'],
      ...records
        .filter(r => r.type === 'revenue')
        .map(r => [
          fmtDate(r.date),
          r.units?.name || '—',
          r.categories?.name || '—',
          r.subcategories?.name || '—',
          r.observation || '—',
          Number(r.value),
        ]),
    ];
    const wsReceitas = XLSX.utils.aoa_to_sheet(revenueRows);
    wsReceitas['!cols'] = [{ wch: 13 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 40 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsReceitas, 'Receitas');

    const expenseRows = [
      ['Data', 'Unidade', 'Categoria', 'Subcategoria', 'Observacao', 'Valor (R$)'],
      ...records
        .filter(r => r.type === 'expense')
        .map(r => [
          fmtDate(r.date),
          r.units?.name || '—',
          r.categories?.name || '—',
          r.subcategories?.name || '—',
          r.observation || '—',
          Number(r.value),
        ]),
    ];
    const wsDespesas = XLSX.utils.aoa_to_sheet(expenseRows);
    wsDespesas['!cols'] = [{ wch: 13 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 40 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');

    const unitRows = [
      ['Unidade', 'Receita (R$)', 'Despesa (R$)', 'Resultado (R$)', 'Margem (%)'],
      ...unitSummary.map(u => {
        const n = u.revenueTotal - u.expenseTotal;
        const m = u.revenueTotal > 0 ? ((n / u.revenueTotal) * 100).toFixed(1) + '%' : '—';
        return [
          u.name,
          Number(u.revenueTotal),
          Number(u.expenseTotal),
          Number(n),
          m,
        ];
      }),
    ];
    const wsUnidades = XLSX.utils.aoa_to_sheet(unitRows);
    wsUnidades['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsUnidades, 'Por Unidade');

    const allRows = [
      ['Data', 'Tipo', 'Unidade', 'Categoria', 'Subcategoria', 'Observacao', 'Valor (R$)'],
      ...records.map(r => [
        fmtDate(r.date),
        r.type === 'revenue' ? 'Receita' : 'Despesa',
        r.units?.name || '—',
        r.categories?.name || '—',
        r.subcategories?.name || '—',
        r.observation || '—',
        Number(r.value),
      ]),
    ];
    const wsAll = XLSX.utils.aoa_to_sheet(allRows);
    wsAll['!cols'] = [{ wch: 13 }, { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 40 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsAll, 'Todos os Lancamentos');

    XLSX.writeFile(wb, `relatorio-financeiro-${dateRange.start}-${dateRange.end}.xlsx`);
  }

  function exportPDF() {
    setOpen(false);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();

    doc.setFillColor(13, 18, 33);
    doc.rect(0, 0, pageW, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatorio Financeiro', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Periodo: ${fmtDateRange(dateRange.start, dateRange.end)}`, 14, 18);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 23);

    doc.setFillColor(30, 42, 64);
    doc.roundedRect(14, 32, 60, 22, 2, 2, 'F');
    doc.roundedRect(80, 32, 60, 22, 2, 2, 'F');
    doc.roundedRect(146, 32, 60, 22, 2, 2, 'F');
    doc.roundedRect(212, 32, 60, 22, 2, 2, 'F');

    const drawCard = (x: number, label: string, value: string, color: [number, number, number]) => {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(label, x + 4, 39);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...color);
      doc.text(value, x + 4, 47);
    };

    drawCard(14, 'TOTAL RECEITAS', fmtBRL(totalRevenues), [52, 211, 153]);
    drawCard(80, 'TOTAL DESPESAS', fmtBRL(totalExpenses), [248, 113, 113]);
    drawCard(146, 'RESULTADO LIQUIDO', `${netResult >= 0 ? '+' : '-'}${fmtBRL(netResult)}`, netResult >= 0 ? [34, 211, 238] : [248, 113, 113]);
    drawCard(212, 'MARGEM', margin !== null ? `${margin.toFixed(1)}%` : '—', margin !== null && margin >= 20 ? [52, 211, 153] : [251, 191, 36]);

    autoTable(doc, {
      startY: 60,
      head: [['Unidade', 'Receita', 'Despesa', 'Resultado', 'Margem']],
      body: unitSummary.map(u => {
        const n = u.revenueTotal - u.expenseTotal;
        const m = u.revenueTotal > 0 ? `${((n / u.revenueTotal) * 100).toFixed(1)}%` : '—';
        return [u.name, fmtBRL(u.revenueTotal), fmtBRL(u.expenseTotal), `${n >= 0 ? '+' : '-'}${fmtBRL(n)}`, m];
      }),
      headStyles: { fillColor: [13, 18, 33], textColor: [148, 163, 184], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fillColor: [20, 28, 46], textColor: [226, 232, 240], fontSize: 8 },
      alternateRowStyles: { fillColor: [25, 35, 56] },
      margin: { left: 14, right: 14 },
      tableLineColor: [30, 42, 64],
      tableLineWidth: 0.2,
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const val = String(data.cell.raw);
          data.cell.styles.textColor = val.startsWith('+') ? [52, 211, 153] : [248, 113, 113];
        }
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = [52, 211, 153];
        }
        if (data.section === 'body' && data.column.index === 2) {
          data.cell.styles.textColor = [248, 113, 113];
        }
      },
    });

    const revenueRecords = records.filter(r => r.type === 'revenue');
    if (revenueRecords.length > 0) {
      doc.addPage();
      doc.setFillColor(13, 18, 33);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 211, 153);
      doc.text('Receitas', 14, 12);

      autoTable(doc, {
        startY: 22,
        head: [['Data', 'Unidade', 'Categoria', 'Subcategoria', 'Observacao', 'Valor']],
        body: revenueRecords.map(r => [
          fmtDate(r.date),
          r.units?.name || '—',
          r.categories?.name || '—',
          r.subcategories?.name || '—',
          r.observation || '—',
          fmtBRL(Number(r.value)),
        ]),
        headStyles: { fillColor: [13, 18, 33], textColor: [148, 163, 184], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fillColor: [20, 28, 46], textColor: [226, 232, 240], fontSize: 7.5 },
        alternateRowStyles: { fillColor: [25, 35, 56] },
        columnStyles: { 5: { textColor: [52, 211, 153], fontStyle: 'bold', halign: 'right' } },
        margin: { left: 14, right: 14 },
        tableLineColor: [30, 42, 64],
        tableLineWidth: 0.2,
      });
    }

    const expenseRecords = records.filter(r => r.type === 'expense');
    if (expenseRecords.length > 0) {
      doc.addPage();
      doc.setFillColor(13, 18, 33);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(248, 113, 113);
      doc.text('Despesas', 14, 12);

      autoTable(doc, {
        startY: 22,
        head: [['Data', 'Unidade', 'Categoria', 'Subcategoria', 'Observacao', 'Valor']],
        body: expenseRecords.map(r => [
          fmtDate(r.date),
          r.units?.name || '—',
          r.categories?.name || '—',
          r.subcategories?.name || '—',
          r.observation || '—',
          fmtBRL(Number(r.value)),
        ]),
        headStyles: { fillColor: [13, 18, 33], textColor: [148, 163, 184], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fillColor: [20, 28, 46], textColor: [226, 232, 240], fontSize: 7.5 },
        alternateRowStyles: { fillColor: [25, 35, 56] },
        columnStyles: { 5: { textColor: [248, 113, 113], fontStyle: 'bold', halign: 'right' } },
        margin: { left: 14, right: 14 },
        tableLineColor: [30, 42, 64],
        tableLineWidth: 0.2,
      });
    }

    doc.save(`relatorio-financeiro-${dateRange.start}-${dateRange.end}.pdf`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-sm font-semibold rounded-xl transition-all duration-200"
      >
        <Download size={15} />
        Exportar
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <button
            onClick={exportExcel}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FileSpreadsheet size={15} className="text-emerald-400" />
            <div className="text-left">
              <p className="font-semibold">Exportar Excel</p>
              <p className="text-xs text-slate-500">4 abas organizadas</p>
            </div>
          </button>
          <div className="border-t border-slate-800" />
          <button
            onClick={exportPDF}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <FileText size={15} className="text-red-400" />
            <div className="text-left">
              <p className="font-semibold">Exportar PDF</p>
              <p className="text-xs text-slate-500">Relatorio formatado</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
