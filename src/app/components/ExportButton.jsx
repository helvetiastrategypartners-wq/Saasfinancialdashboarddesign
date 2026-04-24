import React, { useState, useMemo } from 'react';
import { useMetrics }   from '../contexts/MetricsContext';
import { useDateRange } from '../contexts/DateRangeContext';
import { calcPeriodMetrics } from '../lib/periodUtils';

const ExportButton = ({ title = 'Dashboard' }) => {
  const { metrics, transactions } = useMetrics();
  const { dateRange, comparisonRange } = useDateRange();
  const [loading, setLoading] = useState(null);

  const completedTx = useMemo(
    () => transactions.filter(t => t.payment_status === 'completed'),
    [transactions],
  );

  const inRange = (t, from, to) => {
    const d = new Date(t.date.length === 10 ? t.date + 'T00:00:00Z' : t.date);
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
    () => comparisonRange
      ? calcPeriodMetrics(transactions, { start: comparisonRange.from, end: comparisonRange.to })
      : null,
    [transactions, comparisonRange],
  );

  // Expenses by category for the selected period
  const periodExpByCategory = useMemo(() => {
    const map = {};
    periodTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodTx]);

  // Monthly evolution derived from period transactions
  const periodMonthlyData = useMemo(() => {
    const map = {};
    periodTx.forEach(t => {
      const d = new Date(t.date.length === 10 ? t.date + 'T00:00:00Z' : t.date);
      const ym = d.getUTCFullYear() * 100 + (d.getUTCMonth() + 1);
      const label = d.toLocaleDateString('fr-CH', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      if (!map[ym]) map[ym] = { ym, month: label, revenue: 0, expenses: 0 };
      if (t.type === 'income') map[ym].revenue += t.amount;
      else                     map[ym].expenses += t.amount;
    });
    return Object.values(map)
      .sort((a, b) => a.ym - b.ym)
      .map(({ month, revenue, expenses }) => ({ month, revenue, expenses }));
  }, [periodTx]);

  const fmtRange = (from, to) => {
    const f    = from.toLocaleDateString('fr-CH', { month: 'short', year: '2-digit' });
    const tEnd = new Date(to.getTime() - 86400000);
    const t    = tEnd.toLocaleDateString('fr-CH', { month: 'short', year: '2-digit' });
    return f === t ? f : `${f} – ${t}`;
  };

  const rangeLabel = useMemo(() => fmtRange(dateRange.from, dateRange.to),  [dateRange]);
  const compLabel  = useMemo(
    () => comparisonRange ? fmtRange(comparisonRange.from, comparisonRange.to) : null,
    [comparisonRange],
  );

  const periodDurationMonths = (dateRange.to.getTime() - dateRange.from.getTime()) / (30.44 * 86400000);
  const periodBurnRate = periodDurationMonths > 0.1 ? periodMetrics.exp / periodDurationMonths : metrics.burnRate;
  const periodRunway   = periodBurnRate > 0 ? metrics.cash / periodBurnRate : metrics.runway;

  const delta = (curr, prev) =>
    prev != null && prev !== 0 ? `${((curr - prev) / Math.abs(prev) * 100).toFixed(1)}%` : '—';

  // ─── CSV ─────────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const cell = v => {
      const s = String(v ?? '');
      return s.includes(';') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const row = cols => cols.map(cell).join(';');

    const hasComp = prevMetrics !== null;

    const rows = [
      row([`Rapport — ${rangeLabel}`, hasComp ? `vs ${compLabel}` : '', hasComp ? 'Variation' : '']),
      '',
      row(['--- Indicateurs financiers ---']),
      row(['Métrique', rangeLabel, ...(hasComp ? [compLabel, 'Variation'] : [])]),
      row(['Revenus (CHF)',        periodMetrics.rev,           ...(hasComp ? [prevMetrics.rev,  delta(periodMetrics.rev, prevMetrics.rev)]  : [])]),
      row(['Dépenses (CHF)',       periodMetrics.exp,           ...(hasComp ? [prevMetrics.exp,  delta(periodMetrics.exp, prevMetrics.exp)]  : [])]),
      row(['Cashflow net (CHF)',   periodMetrics.net,           ...(hasComp ? [prevMetrics.net,  delta(periodMetrics.net, prevMetrics.net)]  : [])]),
      row(['Marge brute (%)',      periodMetrics.gm.toFixed(2), ...(hasComp ? [prevMetrics.gm.toFixed(2), delta(periodMetrics.gm, prevMetrics.gm)] : [])]),
      '',
      row(['--- Indicateurs globaux (snapshot) ---']),
      row(['Métrique', 'Valeur']),
      row(['Cash disponible (CHF)', metrics.cash]),
      row(['Burn rate période (CHF)', periodBurnRate]),
      row(['Runway (mois)', periodRunway.toFixed(1)]),
      row(['MRR (CHF)', metrics.mrr]),
      row(['Clients actifs', metrics.activeCustomers]),
      row(['Nouveaux clients (mois)', metrics.newCustomersMonth]),
      '',
      row(['--- Évolution mensuelle ---']),
      row(['Mois', 'Revenus (CHF)', 'Dépenses (CHF)', 'Cashflow net (CHF)']),
      ...periodMonthlyData.map(m => row([m.month, m.revenue, m.expenses, (m.revenue ?? 0) - (m.expenses ?? 0)])),
      '',
      row(['--- Dépenses par catégorie ---']),
      row(['Catégorie', 'Montant (CHF)']),
      ...periodExpByCategory.map(e => row([e.name, e.value])),
      '',
      row([`--- Transactions (${rangeLabel}) ---`]),
      row(['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (CHF)', 'Statut']),
      ...periodTx.map(t => row([t.date, t.label, t.category, t.type, t.amount, t.payment_status])),
    ];

    const csv = '﻿' + rows.join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${title}_${rangeLabel}.csv`);
  };

  // ─── XLSX ─────────────────────────────────────────────────────────────────────
  const exportXLSX = async () => {
    setLoading('xlsx');
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const hasComp = prevMetrics !== null;

      // KPIs sheet
      const kpiHeader = ['Métrique', rangeLabel, ...(hasComp ? [compLabel, 'Variation'] : [])];
      const kpiRows = [
        ['Revenus (CHF)',        periodMetrics.rev,           ...(hasComp ? [prevMetrics.rev,  delta(periodMetrics.rev, prevMetrics.rev)]  : [])],
        ['Dépenses (CHF)',       periodMetrics.exp,           ...(hasComp ? [prevMetrics.exp,  delta(periodMetrics.exp, prevMetrics.exp)]  : [])],
        ['Cashflow net (CHF)',   periodMetrics.net,           ...(hasComp ? [prevMetrics.net,  delta(periodMetrics.net, prevMetrics.net)]  : [])],
        ['Marge brute (%)',      periodMetrics.gm,            ...(hasComp ? [prevMetrics.gm,   delta(periodMetrics.gm,  prevMetrics.gm)]  : [])],
        ['— Snapshot —',        ''],
        ['Cash disponible (CHF)',  metrics.cash],
        ['Burn rate période (CHF)', periodBurnRate],
        ['Runway (mois)',          periodRunway],
        ['MRR (CHF)',              metrics.mrr],
        ['Clients actifs',         metrics.activeCustomers],
        ['Nouveaux clients (mois)', metrics.newCustomersMonth],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([kpiHeader, ...kpiRows]), 'KPIs');

      // Transactions sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (CHF)', 'Statut'],
        ...periodTx.map(t => [t.date, t.label, t.category, t.type, t.amount, t.payment_status]),
      ]), `Transactions ${rangeLabel}`);

      // Monthly evolution sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Mois', 'Revenus (CHF)', 'Dépenses (CHF)', 'Cashflow net (CHF)'],
        ...periodMonthlyData.map(m => [m.month, m.revenue, m.expenses, (m.revenue ?? 0) - (m.expenses ?? 0)]),
      ]), 'Évolution');

      // Expenses by category sheet
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ['Catégorie', 'Montant (CHF)'],
        ...periodExpByCategory.map(e => [e.name, e.value]),
      ]), 'Dépenses catégories');

      XLSX.writeFile(wb, `${title}_${rangeLabel}.xlsx`);
    } catch (err) {
      console.error('XLSX export error:', err);
    } finally {
      setLoading(null);
    }
  };

  // ─── PDF ─────────────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    setLoading('pdf');
    try {
      const { default: jsPDF }    = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W       = doc.internal.pageSize.getWidth();
      const accent  = [220, 50, 50];
      const blue    = [59, 130, 246];
      const gray    = [100, 100, 100];
      const hasComp = prevMetrics !== null;

      // ── Header ──
      doc.setFillColor(...accent);
      doc.rect(0, 0, W, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${title.replace(/_/g, ' ')} — ${rangeLabel}`, 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-CH')}`, W - 14, 12, { align: 'right' });

      let y = 26;

      const num = v => {
        const n    = Number(v ?? 0);
        const sign = n < 0 ? '-' : '';
        const abs  = Math.abs(n);
        const hasCents = Math.round(abs * 100) % 100 !== 0;
        const [intPart, decPart] = abs.toFixed(hasCents ? 2 : 0).split('.');
        const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return sign + (hasCents ? `${intFormatted}.${decPart}` : intFormatted);
      };
      const chf = v => `CHF ${num(v)}`;

      // ── KPIs financiers (période) ──
      doc.setTextColor(...accent);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs financiers', 14, y);
      y += 5;

      const kpiHead = hasComp
        ? [['Métrique', rangeLabel, compLabel, 'Variation']]
        : [['Métrique', rangeLabel]];

      const kpiBody = hasComp
        ? [
            ['Revenus',        chf(periodMetrics.rev), chf(prevMetrics.rev), delta(periodMetrics.rev, prevMetrics.rev)],
            ['Dépenses',       chf(periodMetrics.exp), chf(prevMetrics.exp), delta(periodMetrics.exp, prevMetrics.exp)],
            ['Cashflow net',   chf(periodMetrics.net), chf(prevMetrics.net), delta(periodMetrics.net, prevMetrics.net)],
            ['Marge brute',    `${periodMetrics.gm.toFixed(1)}%`, `${prevMetrics.gm.toFixed(1)}%`, delta(periodMetrics.gm, prevMetrics.gm)],
          ]
        : [
            ['Revenus',      chf(periodMetrics.rev)],
            ['Dépenses',     chf(periodMetrics.exp)],
            ['Cashflow net', chf(periodMetrics.net)],
            ['Marge brute',  `${periodMetrics.gm.toFixed(1)}%`],
          ];

      autoTable(doc, {
        startY: y,
        head:   kpiHead,
        body:   kpiBody,
        theme:  'grid',
        headStyles: { fillColor: accent, fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 30, 30] },
        columnStyles: { 0: { fontStyle: 'bold', textColor: gray, cellWidth: 42 } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 6;

      // ── KPIs snapshot (globaux) ──
      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs globaux (snapshot)', 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        body: [
          ['Cash disponible',  chf(metrics.cash),                    'Burn rate période', chf(periodBurnRate)],
          ['Runway',          `${periodRunway.toFixed(1)} mois`,   'MRR',               chf(metrics.mrr)],
          ['Clients actifs',       `${metrics.activeCustomers}`,  'Nouveaux (mois)', `+${metrics.newCustomersMonth}`],
        ],
        theme:  'grid',
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

      // ── Évolution mensuelle ──
      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Évolution mensuelle', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head:  [['Mois', 'Revenus (CHF)', 'Dépenses (CHF)', 'Cashflow net (CHF)']],
        body:  periodMonthlyData.map(m => [m.month, num(m.revenue), num(m.expenses), num((m.revenue ?? 0) - (m.expenses ?? 0))]),
        theme: 'striped',
        headStyles: { fillColor: blue, fontSize: 8.5 },
        styles:     { fontSize: 8.5, cellPadding: 2.5 },
        margin:     { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;

      // ── Dépenses par catégorie ──
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setTextColor(...accent);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Dépenses par catégorie', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head:  [['Catégorie', 'Montant (CHF)', '% du total']],
        body:  (() => {
          const total = periodExpByCategory.reduce((s, e) => s + (e.value ?? 0), 0);
          return periodExpByCategory.map(e => [
            e.name,
            num(e.value),
            total > 0 ? `${((e.value / total) * 100).toFixed(1)}%` : '—',
          ]);
        })(),
        theme: 'striped',
        headStyles: { fillColor: accent, fontSize: 8.5 },
        styles:     { fontSize: 8.5, cellPadding: 2.5 },
        margin:     { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;

      // ── Transactions de la période ──
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Transactions — ${rangeLabel}`, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head:  [['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (CHF)']],
        body:  periodTx.slice(0, 30).map(t => [
          t.date,
          t.label,
          t.category,
          t.type === 'income' ? 'Revenu' : 'Dépense',
          (t.type === 'income' ? '+' : '-') + num(t.amount),
        ]),
        theme: 'striped',
        headStyles: { fillColor: blue, fontSize: 8.5 },
        styles:     { fontSize: 8, cellPadding: 2 },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: 14, right: 14 },
        didParseCell: data => {
          if (data.section === 'body' && data.column.index === 4) {
            data.cell.styles.textColor = data.row.raw[3] === 'Revenu' ? blue : accent;
          }
        },
      });

      // ── Footer ──
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(160, 160, 160);
        doc.text(`Page ${i} / ${pages}`, W / 2, 290, { align: 'center' });
      }

      doc.save(`${title}_${rangeLabel}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const buttons = [
    { format: 'pdf',  label: 'PDF',  action: exportPDF,  className: 'border-accent-red/30  text-accent-red  hover:bg-accent-red/10'  },
    { format: 'csv',  label: 'CSV',  action: exportCSV,  className: 'border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10' },
    { format: 'xlsx', label: 'XLSX', action: exportXLSX, className: 'border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10' },
  ];

  return (
    <div className="flex items-center gap-2">
      {buttons.map(({ format, label, action, className }) => (
        <button
          key={format}
          onClick={action}
          disabled={loading === format}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200 disabled:opacity-40 ${className}`}
        >
          {loading === format ? '…' : `↓ ${label}`}
        </button>
      ))}
    </div>
  );
};

export default ExportButton;
