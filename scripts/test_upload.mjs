// Testa upload do PDF via API para verificar alertas
import { readFileSync, readdirSync, statSync } from 'fs';

const BASE = 'http://127.0.0.1:8787';

// 1. Login
const loginResp = await fetch(`${BASE}/api/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'andre', password: 'fiscaliza2026' })
});
const loginData = await loginResp.json();
console.log('Login:', loginData.ok ? 'OK' : 'FALHOU', loginData.message || '');
if (!loginData.ok) process.exit(1);

// Extrai cookie da resposta
const setCookie = loginResp.headers.get('set-cookie');
const cookie = setCookie?.split(';')[0];
console.log('Cookie:', cookie?.substring(0, 50) + '...');

// 2. Encontra o PDF
const blobDir = '.wrangler/state/v3/r2/andre-fiscaliza-docs/blobs';
const files = readdirSync(blobDir).map(f => ({
  path: `${blobDir}/${f}`, mtime: statSync(`${blobDir}/${f}`).mtimeMs
})).sort((a, b) => b.mtime - a.mtime);

let pdfPath = null;
for (const f of files) {
  const bytes = readFileSync(f.path);
  if (bytes.slice(0, 5).toString() === '%PDF-') { pdfPath = f.path; break; }
}
if (!pdfPath) { console.log("PDF não encontrado"); process.exit(1); }
console.log('PDF:', pdfPath);

// 3. Upload
const pdfBytes = readFileSync(pdfPath);
const blob = new Blob([pdfBytes], { type: 'application/pdf' });
const formData = new FormData();
formData.append('file', blob, 'rescisao_lucio.pdf');

const uploadResp = await fetch(`${BASE}/api/upload`, {
  method: 'POST',
  headers: { Cookie: cookie },
  body: formData
});
const result = await uploadResp.json();
console.log('\n=== RESULTADO ===');
console.log(JSON.stringify(result, null, 2));
