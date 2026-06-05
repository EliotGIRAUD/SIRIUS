import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = path.join(__dirname, '../../storage/attestations');

function ensureStorage() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export async function generateAttestationPdf({
  simulation,
  user,
  shelter,
  logs,
  attestation,
}) {
  ensureStorage();
  const filename = `attestation-${simulation._id}.pdf`;
  const filePath = path.join(STORAGE_DIR, filename);
  const verifyUrl = `${process.env.ATTESTATION_BASE_URL || 'http://localhost:3000'}/pro/client/${user._id}/metrics`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(22).text('Attestation de simulation — SIRIUS', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Refuge : ${shelter?.name ?? 'N/A'}`);
    doc.text(`Adoptant : ${user.displayName} (${user.email})`);
    doc.text(`Date : ${new Date(attestation.validatedAt).toLocaleDateString('fr-FR')}`);
    doc.moveDown();
    doc.fontSize(16).text(`Score final : ${simulation.finalScore}/100`);
    doc.moveDown();

    doc.fontSize(14).text('Synthèse des erreurs');
    doc.moveDown(0.5);
    const allPenalties = logs.flatMap((l) =>
      (l.penalties || []).map((p) => `Jour ${l.dayNumber} — ${p.message} (${p.points})`),
    );
    if (allPenalties.length === 0) {
      doc.fontSize(11).text('Aucune erreur majeure détectée.');
    } else {
      allPenalties.slice(0, 20).forEach((line) => doc.fontSize(10).text(`• ${line}`));
    }

    doc.moveDown();
    doc.fontSize(11).text('Simulation 30 jours — Labrador Retriever');
    doc.text(`Budget initial : ${simulation.initialBudget}€ | Restant : ${simulation.budgetRemaining}€`);

    const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
    doc.image(Buffer.from(qrBase64, 'base64'), doc.page.width - 150, doc.page.height - 150, {
      width: 80,
    });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return filePath;
}

export function getAttestationPath(simulationId) {
  return path.join(STORAGE_DIR, `attestation-${simulationId}.pdf`);
}
