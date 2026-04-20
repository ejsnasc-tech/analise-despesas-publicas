import { readFileSync } from 'fs';
import { inflateSync, inflateRawSync } from 'zlib';
import { glob } from 'fs';

// Encontra o PDF mais recente no R2 local
const blobDir = '.wrangler/state/v3/r2/andre-fiscaliza-docs/blobs';
import { readdirSync, statSync } from 'fs';
const files = readdirSync(blobDir).map(f => ({
  name: f,
  path: `${blobDir}/${f}`,
  mtime: statSync(`${blobDir}/${f}`).mtimeMs
})).sort((a, b) => b.mtime - a.mtime);

let pdfPath = null;
for (const f of files) {
  const bytes = readFileSync(f.path);
  if (bytes.slice(0, 5).toString() === '%PDF-') {
    pdfPath = f.path;
    break;
  }
}

if (!pdfPath) { console.log("PDF não encontrado"); process.exit(1); }
console.log("PDF:", pdfPath);

const bytes = readFileSync(pdfPath);
const latin1 = bytes.toString('latin1');

// Encontra todos os streams
function findAllBytes(haystack, needle) {
  const nb = Buffer.from(needle);
  const positions = [];
  for (let i = 0; i <= haystack.length - nb.length; i++) {
    let match = true;
    for (let j = 0; j < nb.length; j++) {
      if (haystack[i + j] !== nb[j]) { match = false; break; }
    }
    if (match) positions.push(i);
  }
  return positions;
}

const streamStarts = findAllBytes(bytes, 'stream');
const endStreams = findAllBytes(bytes, 'endstream');

console.log(`\nTotal stream positions: ${streamStarts.length}`);
console.log(`Total endstream positions: ${endStreams.length}`);

let streamIdx = 0;
let cmapCount = 0;
let textStreamCount = 0;
let textStreams = [];

for (const start of streamStarts) {
  // Ignora "endstream"
  if (start >= 3 && bytes[start - 3] === 0x65 && bytes[start - 2] === 0x6E && bytes[start - 1] === 0x64) continue;

  const lookback = Math.max(0, start - 500);
  const header = latin1.substring(lookback, start);
  const isFlate = header.includes('FlateDecode');

  let actualStart = start + 6; // "stream".length
  if (bytes[actualStart] === 0x0D && bytes[actualStart + 1] === 0x0A) actualStart += 2;
  else if (bytes[actualStart] === 0x0A) actualStart += 1;

  let end = -1;
  for (const es of endStreams) {
    if (es > actualStart) { end = es; break; }
  }
  if (end === -1 || end - actualStart > 5_000_000) continue;

  let actualEnd = end;
  if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0A) actualEnd--;
  if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0D) actualEnd--;

  const streamData = bytes.slice(actualStart, actualEnd);
  let decoded;

  if (isFlate) {
    try { decoded = inflateSync(streamData).toString('latin1'); }
    catch {
      try { decoded = inflateRawSync(streamData).toString('latin1'); }
      catch { continue; }
    }
  } else {
    decoded = streamData.toString('latin1');
  }

  streamIdx++;

  const hasBT = decoded.includes('BT');
  const hasTj = decoded.includes('Tj') || decoded.includes('TJ');
  const isCMap = decoded.includes('beginbfchar') || decoded.includes('beginbfrange') || decoded.includes('begincmap');

  if (isCMap) {
    cmapCount++;
    console.log(`\n=== CMAP STREAM #${streamIdx} (${decoded.length} bytes) ===`);
    console.log(decoded.substring(0, 800));
    console.log('...');
  }

  if (hasBT && hasTj) {
    textStreamCount++;
    textStreams.push({ idx: streamIdx, decoded, header });
  }
}

console.log(`\n\n=== SUMMARY ===`);
console.log(`Total streams decoded: ${streamIdx}`);
console.log(`CMap streams: ${cmapCount}`);
console.log(`Text content streams: ${textStreamCount}`);

// Analisa os text streams em detalhe
for (const ts of textStreams) {
  console.log(`\n--- TEXT STREAM #${ts.idx} (${ts.decoded.length} bytes) ---`);
  
  // Mostra fontes usadas
  const fonts = [...ts.decoded.matchAll(/\/(\w+)\s+[\d.]+\s+Tf/g)].map(m => m[1]);
  console.log(`Fontes usadas: ${[...new Set(fonts)].join(', ')}`);
  
  // Mostra exemplos de operadores de texto
  const lines = ts.decoded.split('\n');
  let exampleCount = 0;
  for (const line of lines) {
    if ((line.includes('Tj') || line.includes('TJ')) && exampleCount < 5) {
      // Mostra a linha raw e o hex dos primeiros bytes se for string hex
      const hexMatch = line.match(/<([0-9a-fA-F\s]+)>/);
      if (hexMatch) {
        console.log(`  HEX: ${line.trim().substring(0, 200)}`);
      } else {
        const litMatch = line.match(/\(([^)]*)\)/);
        if (litMatch) {
          const raw = litMatch[1];
          const charCodes = [];
          for (let i = 0; i < Math.min(raw.length, 30); i++) {
            charCodes.push(raw.charCodeAt(i).toString(16).padStart(2, '0'));
          }
          console.log(`  LIT: charCodes=[${charCodes.join(',')}] display="${raw.substring(0, 50)}" full_line=${line.trim().substring(0, 200)}`);
        } else {
          console.log(`  ???: ${line.trim().substring(0, 200)}`);
        }
      }
      exampleCount++;
    }
  }
  
  // Conta tipos de operadores
  const hexTjCount = (ts.decoded.match(/<[0-9a-fA-F\s]+>\s*Tj/g) || []).length;
  const litTjCount = (ts.decoded.match(/\([^)]*\)\s*Tj/g) || []).length;
  const tjArrayCount = (ts.decoded.match(/\]\s*TJ/g) || []).length;
  console.log(`  Operadores: hex-Tj=${hexTjCount}, lit-Tj=${litTjCount}, TJ-arrays=${tjArrayCount}`);
}

// Analisa estrutura de fontes do PDF
console.log(`\n\n=== FONT STRUCTURE ===`);
const fontDefs = [...latin1.matchAll(/\/Type\s*\/Font[\s\S]{0,500}?(?=\/Type\s|endobj)/g)];
console.log(`Font definitions found: ${fontDefs.length}`);

// Procura /Encoding e /ToUnicode
const encodings = [...latin1.matchAll(/\/Encoding\s+([^\s\/>\]]+)/g)];
console.log(`Encoding references: ${encodings.map(e => e[1]).join(', ')}`);

const toUnicodes = [...latin1.matchAll(/\/ToUnicode\s+(\d+)\s+\d+\s+R/g)];
console.log(`ToUnicode references: ${toUnicodes.map(e => e[1]).join(', ')}`);

const differences = [...latin1.matchAll(/\/Differences\s*\[/g)];
console.log(`Differences arrays: ${differences.length}`);

// Mostra referências de fonte Resources
const fontResources = [...latin1.matchAll(/\/Font\s*<<([^>]+)>>/g)];
for (const fr of fontResources.slice(0, 5)) {
  console.log(`Font Resources: ${fr[1].trim().substring(0, 200)}`);
}
