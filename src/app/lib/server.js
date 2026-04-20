// Express server — export endpoint (optionnel, l'export se fait côté client)
// Pour lancer : node src/app/lib/server.js (port 3001)
const express = require('express');
const pdfkit = require('pdfkit');
const XLSX = require('xlsx');
const app = express();

app.use(express.json({ limit: '5mb' }));

app.post('/api/export', async (req, res) => {
  const { format, title = 'Dashboard', metrics, monthlyChartData, expensesByCategory, transactions } = req.body;

  try {
    let buffer, contentType, ext;

    switch (format) {
      case 'pdf': {
        buffer = await buildPDF({ title, metrics, monthlyChartData, transactions });
        contentType = 'application/pdf';
        ext = 'pdf';
        break;
      }
      case 'csv': {
        const rows = buildCSVRows({ metrics, monthlyChartData, expensesByCategory, transactions });
        buffer = Buffer.from('\uFEFF' + rows.map(r => r.join(';')).join('\n'), 'utf-8');
        contentType = 'text/csv;charset=utf-8';
        ext = 'csv';
        break;
      }
      case 'xlsx': {
        buffer = buildXLSX({ title, metrics, monthlyChartData, expensesByCategory, transactions });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        ext = 'xlsx';
        break;
      }
      default:
        return res.status(400).json({ error: 'Format invalide. Utiliser pdf, csv ou xlsx.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${title}.${ext}"`);
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed', detail: err.message });
  }
});

function buildCSVRows({ metrics, monthlyChartData, expensesByCategory, transactions }) {
  return [
    ['Métrique', 'Valeur'],
    ['Cash disponible (CHF)', metrics.cash],
    ['Revenus mensuels (CHF)', metrics.monthlyRevenue],
    ['Dépenses mensuelles (CHF)', metrics.monthlyExpenses],
    ['Cashflow net (CHF)', metrics.netCashflow],
    ['Burn rate (CHF)', metrics.burnRate],
    ['Runway (mois)', metrics.runway],
    ['MRR (CHF)', metrics.mrr],
    ['Clients actifs', metrics.activeCustomers],
    [],
    ['--- Évolution mensuelle ---'],
    ['Mois', 'Revenus', 'Dépenses'],
    ...monthlyChartData.map(m => [m.month, m.revenue, m.expenses]),
    [],
    ['--- Dépenses par catégorie ---'],
    ['Catégorie', 'Montant'],
    ...expensesByCategory.map(e => [e.name, e.value]),
    [],
    ['--- Transactions ---'],
    ['Date', 'Libellé', 'Catégorie', 'Type', 'Montant', 'Statut'],
    ...transactions.map(t => [t.date, t.label, t.category, t.type, t.amount, t.payment_status]),
  ];
}

function buildXLSX({ title, metrics, monthlyChartData, expensesByCategory, transactions }) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Métrique', 'Valeur'],
    ['Cash disponible (CHF)', metrics.cash],
    ['Revenus mensuels (CHF)', metrics.monthlyRevenue],
    ['Dépenses mensuelles (CHF)', metrics.monthlyExpenses],
    ['Cashflow net (CHF)', metrics.netCashflow],
    ['Burn rate (CHF)', metrics.burnRate],
    ['Runway (mois)', metrics.runway],
    ['MRR (CHF)', metrics.mrr],
    ['Clients actifs', metrics.activeCustomers],
  ]), 'KPIs');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Date', 'Libellé', 'Catégorie', 'Type', 'Montant (CHF)', 'Statut'],
    ...transactions.map(t => [t.date, t.label, t.category, t.type, t.amount, t.payment_status]),
  ]), 'Transactions');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Mois', 'Revenus (CHF)', 'Dépenses (CHF)'],
    ...monthlyChartData.map(m => [m.month, m.revenue, m.expenses]),
  ]), 'Évolution');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function buildPDF({ title, metrics, monthlyChartData, transactions }) {
  return new Promise((resolve, reject) => {
    const doc = new pdfkit({ margin: 40 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('KPIs');
    doc.fontSize(10)
      .text(`Cash disponible : CHF ${metrics.cash?.toLocaleString('fr-CH')}`)
      .text(`Revenus mensuels : CHF ${metrics.monthlyRevenue?.toLocaleString('fr-CH')}`)
      .text(`Dépenses mensuelles : CHF ${metrics.monthlyExpenses?.toLocaleString('fr-CH')}`)
      .text(`Cashflow net : CHF ${metrics.netCashflow?.toLocaleString('fr-CH')}`)
      .text(`Burn rate : CHF ${metrics.burnRate?.toLocaleString('fr-CH')}`)
      .text(`Runway : ${metrics.runway?.toFixed(1)} mois`)
      .text(`MRR : CHF ${metrics.mrr?.toLocaleString('fr-CH')}`)
      .text(`Clients actifs : ${metrics.activeCustomers}`);

    doc.moveDown().fontSize(14).text('Évolution mensuelle');
    doc.fontSize(10);
    monthlyChartData.forEach(m => {
      doc.text(`${m.month} — Revenus: ${m.revenue?.toLocaleString('fr-CH')} | Dépenses: ${m.expenses?.toLocaleString('fr-CH')}`);
    });

    doc.moveDown().fontSize(14).text('Transactions récentes');
    doc.fontSize(10);
    transactions.slice(0, 20).forEach(t => {
      doc.text(`${t.date} | ${t.label} | ${t.category} | CHF ${t.amount?.toLocaleString('fr-CH')}`);
    });

    doc.end();
  });
}

app.listen(3001, () => console.log('Export server running on http://localhost:3001'));
