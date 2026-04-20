// Testa a extração de texto do PDF - versão com mapeamento de fontes via estrutura PDF
import { readFileSync, readdirSync, statSync } from 'fs';
import { inflateSync, inflateRawSync } from 'zlib';

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

function parseCMap(cmapText) {
  const table = new Map();
  const bfcharRegex = /beginbfchar\s*([\s\S]*?)endbfchar/g;
  for (const block of cmapText.matchAll(bfcharRegex)) {
    const entries = block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g);
    for (const e of entries) {
      const srcCode = parseInt(e[1], 16);
      const dstHex = e[2];
      let dstStr = "";
      for (let i = 0; i < dstHex.length; i += 4) {
        const chunk = dstHex.substring(i, Math.min(i + 4, dstHex.length));
        dstStr += String.fromCodePoint(parseInt(chunk, 16));
      }
      table.set(srcCode, dstStr);
    }
  }
  const bfrangeRegex = /beginbfrange\s*([\s\S]*?)endbfrange/g;
  for (const block of cmapText.matchAll(bfrangeRegex)) {
    const arrayEntries = block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([^\]]+)\]/g);
    for (const e of arrayEntries) {
      const lo = parseInt(e[1], 16);
      const hi = parseInt(e[2], 16);
      const dstList = [...e[3].matchAll(/<([0-9a-fA-F]+)>/g)];
      for (let code = lo; code <= hi && code - lo < dstList.length; code++) {
        const dstHex = dstList[code - lo][1];
        let dstStr = "";
        for (let i = 0; i < dstHex.length; i += 4) {
          const chunk = dstHex.substring(i, Math.min(i + 4, dstHex.length));
          dstStr += String.fromCodePoint(parseInt(chunk, 16));
        }
        table.set(code, dstStr);
      }
    }
    const simpleEntries = block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>(?!\s*\[)/g);
    for (const e of simpleEntries) {
      const lo = parseInt(e[1], 16);
      const hi = parseInt(e[2], 16);
      let dstStart = parseInt(e[3], 16);
      for (let code = lo; code <= hi; code++) {
        table.set(code, String.fromCodePoint(dstStart));
        dstStart++;
      }
    }
  }
  return table;
}

function isCMapStream(text) {
  return text.includes("beginbfchar") || text.includes("beginbfrange") || text.includes("begincmap");
}

function decodeHexString(hex, cmap) {
  const clean = hex.replace(/\s/g, "");
  if (!cmap || cmap.size === 0) {
    let result = "";
    for (let i = 0; i < clean.length - 1; i += 2) result += String.fromCharCode(parseInt(clean.substring(i, i + 2), 16));
    return result;
  }
  let maxKey = 0;
  for (const k of cmap.keys()) { if (k > maxKey) maxKey = k; }
  const is2Byte = maxKey > 0xFF || clean.length >= 4;
  let result = "";
  const step = is2Byte ? 4 : 2;
  for (let i = 0; i + step - 1 < clean.length; i += step) {
    const code = parseInt(clean.substring(i, i + step), 16);
    const mapped = cmap.get(code);
    if (mapped) { result += mapped; }
    else if (!is2Byte) { result += String.fromCharCode(code); }
    else if (code >= 0x20 && code < 0xFFFE) { result += String.fromCodePoint(code); }
  }
  return result;
}

function decodeLiteralString(s) {
  let result = "", i = 0;
  while (i < s.length) {
    if (s[i] === "\\") {
      i++;
      if (i >= s.length) break;
      switch (s[i]) {
        case "n": result += "\n"; break;
        case "r": result += "\r"; break;
        case "t": result += "\t"; break;
        case "(": result += "("; break;
        case ")": result += ")"; break;
        case "\\": result += "\\"; break;
        default:
          if (/[0-7]/.test(s[i])) {
            let oct = s[i];
            if (i + 1 < s.length && /[0-7]/.test(s[i + 1])) oct += s[++i];
            if (i + 1 < s.length && /[0-7]/.test(s[i + 1])) oct += s[++i];
            result += String.fromCharCode(parseInt(oct, 8));
          } else result += s[i];
      }
    } else result += s[i];
    i++;
  }
  return result;
}

function applyLiteralCmap(s, cmap) {
  if (!cmap || cmap.size === 0) return s;
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    result += cmap.get(code) ?? s[i];
  }
  return result;
}

// ── Main ──

const blobDir = '.wrangler/state/v3/r2/andre-fiscaliza-docs/blobs';
const files = readdirSync(blobDir).map(f => ({
  name: f, path: `${blobDir}/${f}`, mtime: statSync(`${blobDir}/${f}`).mtimeMs
})).sort((a, b) => b.mtime - a.mtime);

let pdfPath = null;
for (const f of files) {
  const bytes = readFileSync(f.path);
  if (bytes.slice(0, 5).toString() === '%PDF-') { pdfPath = f.path; break; }
}
if (!pdfPath) { console.log("PDF não encontrado"); process.exit(1); }

const bytes = readFileSync(pdfPath);
const pdfRawText = bytes.toString('latin1');
const streamStarts = findAllBytes(bytes, 'stream');
const endStreams = findAllBytes(bytes, 'endstream');

// Extrai todos os streams
const streams = [];
for (const start of streamStarts) {
  if (start >= 3 && bytes[start - 3] === 0x65 && bytes[start - 2] === 0x6E && bytes[start - 1] === 0x64) continue;
  const lookback = Math.max(0, start - 500);
  const header = bytes.slice(lookback, start).toString('latin1');
  const isFlate = header.includes('FlateDecode');
  let actualStart = start + 6;
  if (bytes[actualStart] === 0x0D && bytes[actualStart + 1] === 0x0A) actualStart += 2;
  else if (bytes[actualStart] === 0x0A) actualStart += 1;
  let end = -1;
  for (const es of endStreams) { if (es > actualStart) { end = es; break; } }
  if (end === -1 || end - actualStart > 5_000_000) continue;
  let actualEnd = end;
  if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0A) actualEnd--;
  if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0D) actualEnd--;
  const streamData = bytes.slice(actualStart, actualEnd);
  let decoded;
  if (isFlate) {
    try { decoded = inflateSync(streamData).toString('latin1'); }
    catch { try { decoded = inflateRawSync(streamData).toString('latin1'); } catch { continue; } }
  } else {
    decoded = streamData.toString('latin1');
  }
  streams.push({ header, data: decoded });
}

// Fase 1: Mapeia obj number → stream data
const streamByObjNum = new Map();
for (const s of streams) {
  const allMatches = [...s.header.matchAll(/(\d+)\s+0\s+obj/g)];
  if (allMatches.length > 0) {
    const lastMatch = allMatches[allMatches.length - 1];
    streamByObjNum.set(parseInt(lastMatch[1]), s);
  }
}
console.log(`Streams com obj number: ${streamByObjNum.size}`);

// Fase 2: Associa fontes → CMaps via estrutura PDF
const fontCMaps = new Map();

// 2a: Encontra objetos de fonte com ToUnicode
const fontObjToUnicode = new Map();
const fontObjMatches = pdfRawText.matchAll(/(\d+)\s+0\s+obj\b((?:(?!endobj)[\s\S])*?)\/ToUnicode\s+(\d+)\s+0\s+R/g);
for (const m of fontObjMatches) {
  fontObjToUnicode.set(parseInt(m[1]), parseInt(m[3]));
}
console.log('Font obj -> ToUnicode:', Object.fromEntries(fontObjToUnicode));

// 2b: Nomes de fontes → objetos
const fontNameToObj = new Map();
const fontRefMatches = pdfRawText.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g);
for (const m of fontRefMatches) {
  fontNameToObj.set(m[1], parseInt(m[2]));
}
console.log('Font names -> obj:', Object.fromEntries(fontNameToObj));

// 2c: Parseia CMap de cada ToUnicode object pelo número do objeto
const toUnicodeObjToTable = new Map();
for (const [, toUnicodeObjId] of fontObjToUnicode) {
  const stream = streamByObjNum.get(toUnicodeObjId);
  if (stream && isCMapStream(stream.data)) {
    const table = parseCMap(stream.data);
    if (table.size > 0) {
      toUnicodeObjToTable.set(toUnicodeObjId, table);
      console.log(`ToUnicode obj ${toUnicodeObjId} -> CMap ${table.size} entries`);
    }
  }
}

// 2d: Font name → CMap
for (const [fontName, fontObjId] of fontNameToObj) {
  const toUnicodeObjId = fontObjToUnicode.get(fontObjId);
  if (toUnicodeObjId !== undefined) {
    const table = toUnicodeObjToTable.get(toUnicodeObjId);
    if (table) {
      fontCMaps.set(fontName, table);
      console.log(`${fontName} (obj ${fontObjId}) -> ToUnicode ${toUnicodeObjId} -> CMap ${table.size} entries`);
      continue;
    }
  }
  // Tenta seguir a referência indireta
  const fontObjPattern = new RegExp(`\\b${fontObjId}\\s+0\\s+obj\\b[\\s\\S]*?endobj`);
  const fontObjMatch = pdfRawText.match(fontObjPattern);
  if (fontObjMatch) {
    const toUMatch = fontObjMatch[0].match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
    if (toUMatch) {
      const tuId = parseInt(toUMatch[1]);
      let table = toUnicodeObjToTable.get(tuId);
      if (!table) {
        const stream = streamByObjNum.get(tuId);
        if (stream && isCMapStream(stream.data)) {
          table = parseCMap(stream.data);
          if (table && table.size > 0) toUnicodeObjToTable.set(tuId, table);
        }
      }
      if (table) {
        fontCMaps.set(fontName, table);
        console.log(`${fontName} (obj ${fontObjId}) -> indirect ToUnicode ${tuId} -> CMap ${table.size} entries`);
      }
    }
  }
}

console.log('\nFinal font->CMap mapping:', [...fontCMaps.entries()].map(([k,v]) => `${k}:${v.size}`).join(', '));

// Fase 3: Extrai texto
const allTexts = [];
for (const s of streams) {
  if (!s.data.includes('BT') || (!s.data.includes('Tj') && !s.data.includes('TJ'))) continue;
  
  const lines = [];
  let currentLine = "";
  let inBT = false;
  let currentFont = "";
  
  const getCMap = () => fontCMaps.get(currentFont) || undefined;
  
  for (const line of s.data.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'BT') { inBT = true; continue; }
    if (trimmed === 'ET') { inBT = false; if (currentLine.trim()) lines.push(currentLine.trim()); currentLine = ""; continue; }
    if (!inBT) continue;
    
    const tfMatch = trimmed.match(/\/(\S+)\s+[\d.]+\s+Tf/);
    if (tfMatch) currentFont = tfMatch[1];
    
    const tdMatch = trimmed.match(/(-?[\d.]+)\s+(-?[\d.]+)\s+Td/);
    if (tdMatch && Math.abs(parseFloat(tdMatch[2])) > 1) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = "";
    }
    
    if (trimmed.includes(' Tm')) {
      if (currentLine.trim()) { lines.push(currentLine.trim()); currentLine = ""; }
    }
    
    const cmap = getCMap();
    
    const tjLit = trimmed.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g);
    for (const m of tjLit) { currentLine += applyLiteralCmap(decodeLiteralString(m[1]), cmap); }
    
    const tjHex = trimmed.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g);
    for (const m of tjHex) { currentLine += decodeHexString(m[1], cmap); }
    
    const tjArr = trimmed.match(/\[(.*)\]\s*TJ/s);
    if (tjArr) {
      const parts = tjArr[1].matchAll(/\(([^)]*(?:\\.[^)]*)*)\)|<([0-9a-fA-F\s]+)>|([-]?\d+)/g);
      for (const p of parts) {
        if (p[1] !== undefined) currentLine += applyLiteralCmap(decodeLiteralString(p[1]), cmap);
        else if (p[2] !== undefined) currentLine += decodeHexString(p[2], cmap);
        if (p[3] !== undefined && parseInt(p[3]) < -200) currentLine += " ";
      }
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  
  const text = lines.join('\n');
  if (text.trim()) {
    const clean = text.split('\n').filter(l => {
      const p = l.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
      return p.length > 0 && p.length >= l.trim().length * 0.3;
    }).join('\n');
    if (clean.trim()) allTexts.push(clean);
  }
}

const fullText = allTexts.join('\n\n');
console.log(`\n=== TEXTO EXTRAÍDO (${fullText.length} chars) ===`);
console.log(fullText);

