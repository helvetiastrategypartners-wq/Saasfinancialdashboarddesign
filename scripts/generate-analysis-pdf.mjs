import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';

const inputPath = path.resolve('deliverables/proposition_amelioration_complete.md');
const outputPath = path.resolve('deliverables/proposition_amelioration_complete.pdf');

const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.split('\n');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Proposition d’amélioration complète — SaaS Financial Dashboard',
    Author: 'Codex AI',
    Subject: 'Audit technique et recommandations',
  },
});

doc.pipe(fs.createWriteStream(outputPath));

for (const line of lines) {
  if (line.startsWith('# ')) {
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(18).text(line.replace(/^#\s+/, ''), { align: 'left' });
    doc.moveDown(0.4);
    continue;
  }

  if (line.startsWith('## ')) {
    doc.moveDown(0.25);
    doc.font('Helvetica-Bold').fontSize(14).text(line.replace(/^##\s+/, ''), { align: 'left' });
    doc.moveDown(0.2);
    continue;
  }

  if (line.startsWith('### ')) {
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').fontSize(12).text(line.replace(/^###\s+/, ''), { align: 'left' });
    doc.moveDown(0.1);
    continue;
  }

  if (line.trim() === '---') {
    doc.moveDown(0.3);
    doc.strokeColor('#999999').lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();
    doc.moveDown(0.5);
    continue;
  }

  const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
  const numberedMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);

  if (bulletMatch) {
    doc.font('Helvetica').fontSize(10.5).text(`• ${bulletMatch[1]}`, { align: 'left' });
    continue;
  }

  if (numberedMatch) {
    doc.font('Helvetica').fontSize(10.5).text(`${numberedMatch[1]}. ${numberedMatch[2]}`, { align: 'left' });
    continue;
  }

  if (line.trim() === '') {
    doc.moveDown(0.5);
    continue;
  }

  doc.font('Helvetica').fontSize(10.5).text(line, { align: 'left' });
}

doc.end();
console.log(`PDF généré: ${outputPath}`);
