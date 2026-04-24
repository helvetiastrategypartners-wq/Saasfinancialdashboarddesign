import React, { useState, useMemo } from 'react';
import { useMetrics } from '../contexts/MetricsContext';
import { useDateRange } from '../contexts/DateRangeContext';
import { calcPeriodMetrics } from '../lib/periodUtils';
import { downloadBlob } from '../lib/download';
import {
  appendPdfPageNumbers,
  createCsvRow,
  formatChfValue,
  formatCompactNumber,
  formatDeltaPercent,
  formatExportRange,
} from '../lib/exportUtils';
import { ExportActions } from './ExportActions';

const ExportButton = ({ title = 'Dashboard' }) => {
  const { metrics, transactions } = useMetrics();
  const { dateRange, comparisonRange } = useDateRange();
  const [loading, setLoading] = useState(null);

  const completedTx = useMemo(
    () => transactions.filter(t => t.payment_status === 'completed'),
    [transactions],
  );

  const inRange = (t, from, to) => {
    const d = new Date(t.date.length === 10 ? `${t.date}T00:00:00Z` : t.date);
    return d >= from && d < to;
  };

  const periodTx = useMemo(
    () => completedTx.filter(t => inRange(t, dateRange.from, dateRange.to)),
    [completedTx, dateRange],
  );

  const periodMetrics = useMemo(
    () => calcPeriodMetrics(transactions, { start: dateRange.from, end: dateRange.to }),
    [transactions, dateRange],
  );

  const prevMetrics = useMemo(
    () => (comparisonRange
      ? calcPeriodMetrics(transactions, { start: comparisonRange.from, end: comparisonRange.to })
      : null),
    [transactions, comparisonRange],
  );

  const periodExpByCategory = useMemo(() => {
    const map = {};
    periodTx
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodTx]);

  const periodMonthlyData = useMemo(() => {
    const map = {};

    periodTx.forEach(t => {
      const d = new Date(t.date.length === 10 ? `${t.date}T00:00:00Z` : t.date);
      const ym = d.getUTCFullYear() * 100 + (d.getUTCMonth() + 1);
      const label = d.toLocaleDateString('fr-CH', { month: 'short', year: '2-digit', timeZone: 'UTC' });

      if (!map[ym]) {
        map[ym] = { ym, month: label, revenue: 0, expenses: 0 };
      }

      if (t.type === 'income') {
        map[ym].revenue += t.amount;
      } else {
        map[ym].expenses += t.amount;
      }
    });

    return Object.values(map)
      .sort((a, b) => a.ym - b.ym)
      .map(({ month, revenue, expenses }) => ({ month, revenue, expenses }));
  }, [periodTx]);

  const rangeLabel = useMemo(() => formatExportRange(dateRange.from, dateRange.to), [dateRange]);
  const compLabel = useMemo(
    () => (comparisonRange ? formatExportRange(comparisonRange.from, comparisonRange.to) : null),
    [comparisonRange],
  );

  const periodDurationMonths = (dateRange.to.getTime() - dateRange.from.getTime()) / (30.44 * 86400000);
  const periodBurnRate = periodDurationMonths > 0.1 ? periodMetrics.exp / periodDurationMonths : metrics.burnRate;
  const periodRunway = periodBurnRate > 0 ? metrics.cash / periodBurnRate : metrics.runway;

  const exportCSV = () => {
    const hasComp = prevMetrics !== null;
    const rows = [
      createCsvRow([`Rapport - ${rangeLabel}`, hasComp ? `vs ${compLabel}` : '', hasComp ? 'Variation' : '']),
      '',
      createCsvRow(['--- Indicateurs financiers ---']),
      createCsvRow(['Metrique', rangeLabel, ...(hasComp ? [compLabel, 'Variation'] : [])]),
      createCsvRow(['Revenus (CHF)', periodMetrics.rev, ...(hasComp ? [prevMetrics.rev, formatDeltaPercent(periodMetrics.rev, prevMetrics.rev)] : [])]),
      createCsvRow(['Depenses (CHF)', periodMetrics.exp, ...(hasComp ? [prevMetrics.exp, formatDeltaPercent(periodMetrics.exp, prevMetrics.exp)] : [])]),
      createCsvRow(['Cashflow net (CHF)', periodMetrics.net, ...(hasComp ? [prevMetrics.net, formatDeltaPercent(periodMetrics.net, prevMetrics.net)] : [])]),
      createCsvRow(['Marge brute (%)', periodMetrics.gm.toFixed(2), ...(hasComp ? [prevMetrics.gm.toFixed(2), formatDeltaPercent(periodMetrics.gm, prevMetrics.gm)] : [])]),
      '',
      createCsvRow(['--- Indicateurs globaux (snapshot) ---']),
      createCsvRow(['Metrique', 'Valeur']),
      createCsvRow(['Cash disponible (CHF)', metrics.cash]),
      createCsvRow(['Burn rate periode (CHF)', periodBurnRate]),
      createCsvRow(['Runway (mois)', periodRunway.toFixed(1)]),
      createCsvRow(['MRR (CHF)', metrics.mrr]),
      createCsvRow(['Clients actifs', metrics.activeCustomers]),
      createCsvRow(['Nouveaux clients (mois)', metrics.newCustomersMonth]),
      '',
      createCsvRow(['--- Evolution mensuelle ---']),
      createCsvRow(['Mois', 'Revenus (CHF)', 'Depenses (CHF)', 'Cashflow net (CHF)']),
      ...periodMonthlyData.map(m => createCsvRow([m.month, m.revenue, m.expenses, (m.revenue ?? 0) - (m.expenses ?? 0)])),
      '',
      createCsvRow(['--- Depenses par categorie ---']),
      createCsvRow(['Categorie', 'Montant (CHF)']),
      ...periodExpByCategory.map(e => createCsvRow([e.name, e.value])),
      '',
      createCsvRow([`--- Transactions (${rangeLabel}) ---`]),
      createCsvRow(['Date', 'Libelle', 'Categorie', 'Type', 'Montant (CHF)', 'Statut']),
      ...periodTx.map(t => createCsvRow([t.date, t.label, t.category, t.type, t.amount, t.payment_status])),
    ];

    const csv = '\uFEFF' + rows.join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${title}_${rangeLabel}.csv`);
  };

  const exportPDF = async () => {
    setLoading('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const width = doc.internal.pageSize.getWidth();
      const accent = [220, 50, 50];
      const blue = [59, 130, 246];
      const gray = [100, 100, 100];
      const hasComp = prevMetrics !== null;

      doc.setFillColor(...accent);
      doc.rect(0, 0, width, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${title.replace(/_/g, ' ')} - ${rangeLabel}`, 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Genere le ${new Date().toLocaleDateString('fr-CH')}`, width - 14, 12, { align: 'right' });

      let y = 26;

      doc.setTextColor(...accent);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs financiers', 14, y);
      y += 5;

      const kpiHead = hasComp
        ? [['Metrique', rangeLabel, compLabel, 'Variation']]
        : [['Metrique', rangeLabel]];

      const kpiBody = hasComp
        ? [
            ['Revenus', formatChfValue(periodMetrics.rev), formatChfValue(prevMetrics.rev), formatDeltaPercent(periodMetrics.rev, prevMetrics.rev)],
            ['Depenses', formatChfValue(periodMetrics.exp), formatChfValue(prevMetrics.exp), formatDeltaPercent(periodMetrics.exp, prevMetrics.exp)],
            ['Cashflow net', formatChfValue(periodMetrics.net), formatChfValue(prevMetrics.net), formatDeltaPercent(periodMetrics.net, prevMetrics.net)],
            ['Marge brute', `${periodMetrics.gm.toFixed(1)}%`, `${prevMetrics.gm.toFixed(1)}%`, formatDeltaPercent(periodMetrics.gm, prevMetrics.gm)],
          ]
        : [
            ['Revenus', formatChfValue(periodMetrics.rev)],
            ['Depenses', formatChfValue(periodMetrics.exp)],
            ['Cashflow net', formatChfValue(periodMetrics.net)],
            ['Marge brute', `${periodMetrics.gm.toFixed(1)}%`],
          ];

      autoTable(doc, {
        startY: y,
        head: kpiHead,
        body: kpiBody,
        theme: 'grid',
        headStyles: { fillColor: accent, fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 30, 30] },
        columnStyles: { 0: { fontStyle: 'bold', textColor: gray, cellWidth: 42 } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;

      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs globaux (snapshot)', 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        body: [
          ['Cash disponible', formatChfValue(metrics.cash), 'Burn rate periode', formatChfValue(periodBurnRate)],
          ['Runway', `${periodRunway.toFixed(1)} mois`, 'MRR', formatChfValue(metrics.mrr)],
          ['Clients actifs', `${metrics.activeCustomers}`, 'Nouveaux (mois)', `+${metrics.newCustomersMonth}`],
        ],
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 30, 30] },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: gray, cellWidth: 42 },
          1: { cellWidth: 42 },
          2: { fontStyle: 'bold', textColor: gray, cellWidth: 42 },
          3: { cellWidth: 42 },
        },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;

      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Evolution mensuelle', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Mois', 'Revenus (CHF)', 'Depenses (CHF)', 'Cashflow net (CHF)']],
        body: periodMonthlyData.map(m => [m.month, formatCompactNumber(m.revenue), formatCompactNumber(m.expenses), formatCompactNumber((m.revenue ?? 0) - (m.expenses ?? 0))]),
        theme: 'striped',
        headStyles: { fillColor: blue, fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;

      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(...accent);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Depenses par categorie', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Categorie', 'Montant (CHF)', '% du total']],
        body: (() => {
          const total = periodExpByCategory.reduce((sum, item) => sum + (item.value ?? 0), 0);
          return periodExpByCategory.map(item => [
            item.name,
            formatCompactNumber(item.value),
            total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '-',
          ]);
        })(),
        theme: 'striped',
        headStyles: { fillColor: accent, fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;

      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Transactions - ${rangeLabel}`, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Libelle', 'Categorie', 'Type', 'Montant (CHF)']],
        body: periodTx.slice(0, 30).map(t => [
          t.date,
          t.label,
          t.category,
          t.type === 'income' ? 'Revenu' : 'Depense',
          `${t.type === 'income' ? '+' : '-'}${formatCompactNumber(t.amount)}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: blue, fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: 14, right: 14 },
        didParseCell: data => {
          if (data.section === 'body' && data.column.index === 4) {
            data.cell.styles.textColor = data.row.raw[3] === 'Revenu' ? blue : accent;
          }
        },
      });

      appendPdfPageNumbers(doc, width);

      doc.save(`${title}_${rangeLabel}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    { format: 'pdf', label: 'PDF', action: exportPDF, className: 'border-accent-red/30 text-accent-red hover:bg-accent-red/10' },
    { format: 'csv', label: 'CSV', action: exportCSV, className: 'border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10' },
  ];

  return (
    <div className="flex items-center gap-2">
      <ExportActions actions={buttons} loading={loading} />
    </div>
  );
};

export default ExportButton;
