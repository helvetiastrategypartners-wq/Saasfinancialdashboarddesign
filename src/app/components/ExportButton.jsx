import React, { useState } from 'react';
import { useMetrics } from '../contexts/MetricsContext';

const ExportButton = ({ title = 'Dashboard' }) => {
  const { metrics, monthlyChartData, expensesByCategory, transactions } = useMetrics();
  const [loading, setLoading] = useState(null);

  const completedTx = transactions.filter(t => t.payment_status === 'completed');

  const exportCSV = () => {
    // Wrap cell in quotes and escape internal quotes to prevent CSV corruption
    const cell = v => {
      const s = String(v ?? '');
      return s.includes(';') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const row = cols => cols.map(cell).join(';');

    const rows = [
      row(['Métrique', 'Valeur']),
      row(['Cash disponible (CHF)', metrics.cash]),
      row(['Revenus mensuels (CHF)', metrics.monthlyRevenue]),
      row(['Dépenses mensuelles (CHF)', metrics.monthlyExpenses]),
      row(['Cashflow net (CHF)', metrics.netCashflow]),
      row(['Burn rate 3 mois (CHF)', metrics.burnRate]),
      row(['Runway (mois)', metrics.runway.toFixed(1)]),
      row(['MRR (CHF)', metrics.mrr]),
      row(['Marge brute (CHF)', metrics.grossMargin]),
      row(['Marge brute (%)', metrics.grossMarginPercent.toFixed(2)]),
      row(['Clients actifs', metrics.activeCustomers]),
      row(['Nouveaux clients (mois)', metrics.newCustomersMonth]),
      '',
      row(['--- Évolution mensuelle ---']),
      row(['Mois', 'Revenus (CHF)', 'Dépenses (CHF)', 'Cashflow net (CHF)']),
      ...monthlyChartData.map(m => row([m.month, m.revenue, m.expenses, (m.revenue ?? 0) - (m.expenses ?? 0)])),
      '',
      row(['--- Répartition dépenses ---']),
      row(['Catégorie', 'Montant (CHF)']),
      ...expensesByCategory.map(e => row([e.name, e.value])),
      '',
      row(['--- Transactions ---']),
      row(['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (CHF)', 'Statut']),
      ...completedTx.map(t => row([t.date, t.label, t.category, t.type, t.amount, t.payment_status])),
    ];

    const csv = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${title}.csv`);
  };

  const exportXLSX = async () => {
    setLoading('xlsx');
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const kpiSheet = XLSX.utils.aoa_to_sheet([
        ['Métrique', 'Valeur'],
        ['Cash disponible (CHF)', metrics.cash],
        ['Revenus mensuels (CHF)', metrics.monthlyRevenue],
        ['Dépenses mensuelles (CHF)', metrics.monthlyExpenses],
        ['Cashflow net (CHF)', metrics.netCashflow],
        ['Burn rate 3 mois (CHF)', metrics.burnRate],
        ['Runway (mois)', metrics.runway],
        ['MRR (CHF)', metrics.mrr],
        ['Marge brute (CHF)', metrics.grossMargin],
        ['Marge brute (%)', metrics.grossMarginPercent],
        ['Clients actifs', metrics.activeCustomers],
        ['Nouveaux clients (mois)', metrics.newCustomersMonth],
      ]);
      XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');

      const txSheet = XLSX.utils.aoa_to_sheet([
        ['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (CHF)', 'Statut'],
        ...completedTx.map(t => [t.date, t.label, t.category, t.type, t.amount, t.payment_status]),
      ]);
      XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

      const monthSheet = XLSX.utils.aoa_to_sheet([
        ['Mois', 'Revenus (CHF)', 'Dépenses (CHF)', 'Cashflow net (CHF)'],
        ...monthlyChartData.map(m => [m.month, m.revenue, m.expenses, (m.revenue ?? 0) - (m.expenses ?? 0)]),
      ]);
      XLSX.utils.book_append_sheet(wb, monthSheet, 'Évolution');

      const catSheet = XLSX.utils.aoa_to_sheet([
        ['Catégorie', 'Montant (CHF)'],
        ...expensesByCategory.map(e => [e.name, e.value]),
      ]);
      XLSX.utils.book_append_sheet(wb, catSheet, 'Dépenses par catégorie');

      XLSX.writeFile(wb, `${title}.xlsx`);
    } catch (err) {
      console.error('XLSX export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const exportPDF = async () => {
    setLoading('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const accent = [220, 50, 50];
      const blue = [59, 130, 246];
      const gray = [100, 100, 100];

      // ── Header ──
      doc.setFillColor(...accent);
      doc.rect(0, 0, W, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title.replace(/_/g, ' '), 14, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-CH')}`, W - 14, 12, { align: 'right' });

      let y = 26;

      // ── KPIs section ──
      doc.setTextColor(...accent);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicateurs clés (KPIs)', 14, y);
      y += 5;

      // Format numbers manually — avoids locale-dependent thousand separators
      // (fr-CH outputs U+2019 apostrophe which jsPDF/Helvetica renders as "/").
      const num = v => {
        const n = Number(v ?? 0);
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        const hasCents = Math.round(abs * 100) % 100 !== 0;
        const [intPart, decPart] = abs.toFixed(hasCents ? 2 : 0).split('.');
        const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return sign + (hasCents ? `${intFormatted}.${decPart}` : intFormatted);
      };
      const chf = v => `CHF ${num(v)}`;
      const kpis = [
        ['Cash disponible',      chf(metrics.cash),              'Revenus mensuels',      chf(metrics.monthlyRevenue)],
        ['Dépenses mensuelles',  chf(metrics.monthlyExpenses),   'Cashflow net',          chf(metrics.netCashflow)],
        ['Burn rate (3 mois)',   chf(metrics.burnRate),          'Runway',                `${metrics.runway?.toFixed(1)} mois`],
        ['MRR',                  chf(metrics.mrr),               'Marge brute',           chf(metrics.grossMargin)],
        ['Clients actifs',       `${metrics.activeCustomers}`,   'Nouveaux (mois)',        `+${metrics.newCustomersMonth}`],
      ];

      autoTable(doc, {
        startY: y,
        body: kpis,
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

      // ── Évolution mensuelle ──
      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Évolution mensuelle', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Mois', 'Revenus (CHF)', 'Dépenses (CHF)', 'Cashflow net (CHF)']],
        body: monthlyChartData.map(m => [
          m.month,
          num(m.revenue),
          num(m.expenses),
          num((m.revenue ?? 0) - (m.expenses ?? 0)),
        ]),
        theme: 'striped',
        headStyles: { fillColor: blue, fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
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
        head: [['Catégorie', 'Montant (CHF)', '% du total']],
        body: (() => {
          const total = expensesByCategory.reduce((s, e) => s + (e.value ?? 0), 0);
          return expensesByCategory.map(e => [
            e.name,
            num(e.value),
            total > 0 ? `${((e.value / total) * 100).toFixed(1)}%` : '—',
          ]);
        })(),
        theme: 'striped',
        headStyles: { fillColor: accent, fontSize: 8.5 },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;

      // ── Transactions récentes ──
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setTextColor(...blue);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Transactions récentes', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (CHF)']],
        body: completedTx.slice(0, 30).map(t => [
          t.date,
          t.label,
          t.category,
          t.type === 'income' ? 'Revenu' : 'Dépense',
          (t.type === 'income' ? '+' : '-') + num(t.amount),
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

      // ── Footer ──
      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(160, 160, 160);
        doc.text(`Page ${i} / ${pages}`, W / 2, 290, { align: 'center' });
      }

      doc.save(`${title}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const buttons = [
    {
      format: 'pdf',
      label: 'PDF',
      action: exportPDF,
      className: 'border-accent-red/30 text-accent-red hover:bg-accent-red/10',
    },
    {
      format: 'csv',
      label: 'CSV',
      action: exportCSV,
      className: 'border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10',
    },
    {
      format: 'xlsx',
      label: 'XLSX',
      action: exportXLSX,
      className: 'border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10',
    },
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
