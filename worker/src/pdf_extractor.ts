/* ── Extrator de texto PDF para Cloudflare Workers ───────────────
 *  Usa DecompressionStream (Web API) para descomprimir FlateDecode.
 *  Suporta ToUnicode CMap para decodificar fontes com encoding customizado.
 *  Extrai texto dos operadores Tj, TJ, ', " dentro de blocos BT/ET.
 *  Não depende de Node.js nem de bibliotecas externas.
 * ────────────────────────────────────────────────────────────────── */

/** Descomprime dados usando a Web Streams API. Tenta deflate (zlib) primeiro, depois deflate-raw. */
async function inflate(data: Uint8Array): Promise<Uint8Array> {
  for (const fmt of ["deflate", "deflate-raw"] as CompressionFormat[]) {
    try {
      const ds = new DecompressionStream(fmt);
      const writer = ds.writable.getWriter();
      writer.write(data as unknown as BufferSource);
      writer.close();
      const reader = ds.readable.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLen = chunks.reduce((s, c) => s + c.length, 0);
      const result = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        result.set(c, offset);
        offset += c.length;
      }
      if (result.length > 0) return result;
    } catch { /* tenta próximo formato */ }
  }
  return new Uint8Array(0);
}

/** Encontra posições de todas as ocorrências de needle em haystack (bytes). */
function findAll(haystack: Uint8Array, needle: string): number[] {
  const enc = new TextEncoder();
  const nb = enc.encode(needle);
  const positions: number[] = [];
  for (let i = 0; i <= haystack.length - nb.length; i++) {
    let match = true;
    for (let j = 0; j < nb.length; j++) {
      if (haystack[i + j] !== nb[j]) { match = false; break; }
    }
    if (match) positions.push(i);
  }
  return positions;
}

/* ── ToUnicode CMap Parser ─────────────────────────────────────── */

/** Mapa de glyph ID → string Unicode, por nome de fonte */
type CMapTable = Map<number, string>;

/** Parseia um stream ToUnicode CMap e retorna a tabela de mapeamento */
function parseCMap(cmapText: string): CMapTable {
  const table: CMapTable = new Map();

  // Parse beginbfchar/endbfchar: <srcCode> <dstUnicode>
  const bfcharRegex = /beginbfchar\s*([\s\S]*?)endbfchar/g;
  for (const block of cmapText.matchAll(bfcharRegex)) {
    const entries = block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g);
    for (const e of entries) {
      const srcCode = parseInt(e[1], 16);
      const dstHex = e[2];
      // Dst pode ser multi-byte Unicode (ex: <006100620063> = "abc")
      let dstStr = "";
      for (let i = 0; i < dstHex.length; i += 4) {
        const chunk = dstHex.substring(i, Math.min(i + 4, dstHex.length));
        dstStr += String.fromCodePoint(parseInt(chunk, 16));
      }
      table.set(srcCode, dstStr);
    }
  }

  // Parse beginbfrange/endbfrange: <srcLo> <srcHi> <dstStart> ou <srcLo> <srcHi> [<dst1> <dst2>...]
  const bfrangeRegex = /beginbfrange\s*([\s\S]*?)endbfrange/g;
  for (const block of cmapText.matchAll(bfrangeRegex)) {
    // Formato com array: <srcLo> <srcHi> [<dst1> <dst2> ...]
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

    // Formato simples: <srcLo> <srcHi> <dstStart>
    const simpleEntries = block[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>(?!\s*\[)/g);
    for (const e of simpleEntries) {
      const lo = parseInt(e[1], 16);
      const hi = parseInt(e[2], 16);
      let dstStart = parseInt(e[3], 16);
      const dstLen = e[3].length; // número de hex chars do destino
      for (let code = lo; code <= hi; code++) {
        if (dstLen <= 4) {
          table.set(code, String.fromCodePoint(dstStart));
        } else {
          // Multi-char destination: incrementa o último char
          let dstStr = "";
          for (let i = 0; i < dstLen; i += 4) {
            const chunk = dstStart.toString(16).padStart(dstLen, "0").substring(i, i + 4);
            dstStr += String.fromCodePoint(parseInt(chunk, 16));
          }
          table.set(code, dstStr);
        }
        dstStart++;
      }
    }
  }

  return table;
}

/** Detecta se um stream é um ToUnicode CMap */
function isCMapStream(text: string): boolean {
  return text.includes("beginbfchar") || text.includes("beginbfrange") ||
         text.includes("/CMapType") || text.includes("begincmap");
}

/* ── Encoding tables built-in ─────────────────────────────────── */

/** Tabela Differences do PDF Encoding — resolve nomes de glyph para Unicode */
const GLYPH_NAME_TO_UNICODE: Record<string, number> = {
  space: 0x20, exclam: 0x21, quotedbl: 0x22, numbersign: 0x23, dollar: 0x24,
  percent: 0x25, ampersand: 0x26, quotesingle: 0x27, parenleft: 0x28, parenright: 0x29,
  asterisk: 0x2A, plus: 0x2B, comma: 0x2C, hyphen: 0x2D, period: 0x2E, slash: 0x2F,
  zero: 0x30, one: 0x31, two: 0x32, three: 0x33, four: 0x34, five: 0x35, six: 0x36,
  seven: 0x37, eight: 0x38, nine: 0x39, colon: 0x3A, semicolon: 0x3B, less: 0x3C,
  equal: 0x3D, greater: 0x3E, question: 0x3F, at: 0x40,
  A: 0x41, B: 0x42, C: 0x43, D: 0x44, E: 0x45, F: 0x46, G: 0x47, H: 0x48,
  I: 0x49, J: 0x4A, K: 0x4B, L: 0x4C, M: 0x4D, N: 0x4E, O: 0x4F, P: 0x50,
  Q: 0x51, R: 0x52, S: 0x53, T: 0x54, U: 0x55, V: 0x56, W: 0x57, X: 0x58,
  Y: 0x59, Z: 0x5A, bracketleft: 0x5B, backslash: 0x5C, bracketright: 0x5D,
  asciicircum: 0x5E, underscore: 0x5F, grave: 0x60,
  a: 0x61, b: 0x62, c: 0x63, d: 0x64, e: 0x65, f: 0x66, g: 0x67, h: 0x68,
  i: 0x69, j: 0x6A, k: 0x6B, l: 0x6C, m: 0x6D, n: 0x6E, o: 0x6F, p: 0x70,
  q: 0x71, r: 0x72, s: 0x73, t: 0x74, u: 0x75, v: 0x76, w: 0x77, x: 0x78,
  y: 0x79, z: 0x7A, braceleft: 0x7B, bar: 0x7C, braceright: 0x7D, asciitilde: 0x7E,
  bullet: 0x2022, endash: 0x2013, emdash: 0x2014, fi: 0xFB01, fl: 0xFB02,
  Agrave: 0xC0, Aacute: 0xC1, Acircumflex: 0xC2, Atilde: 0xC3, Adieresis: 0xC4,
  Ccedilla: 0xC7, Egrave: 0xC8, Eacute: 0xC9, Ecircumflex: 0xCA, Edieresis: 0xCB,
  Igrave: 0xCC, Iacute: 0xCD, Icircumflex: 0xCE, Idieresis: 0xCF,
  Ntilde: 0xD1, Ograve: 0xD2, Oacute: 0xD3, Ocircumflex: 0xD4, Otilde: 0xD5,
  Odieresis: 0xD6, Ugrave: 0xD9, Uacute: 0xDA, Ucircumflex: 0xDB, Udieresis: 0xDC,
  agrave: 0xE0, aacute: 0xE1, acircumflex: 0xE2, atilde: 0xE3, adieresis: 0xE4,
  ccedilla: 0xE7, egrave: 0xE8, eacute: 0xE9, ecircumflex: 0xEA, edieresis: 0xEB,
  igrave: 0xEC, iacute: 0xED, icircumflex: 0xEE, idieresis: 0xEF,
  ntilde: 0xF1, ograve: 0xF2, oacute: 0xF3, ocircumflex: 0xF4, otilde: 0xF5,
  odieresis: 0xF6, ugrave: 0xF9, uacute: 0xFA, ucircumflex: 0xFB, udieresis: 0xFC,
  germandbls: 0xDF, oslash: 0xF8, Oslash: 0xD8, aring: 0xE5, Aring: 0xC5,
  ae: 0xE6, AE: 0xC6, thorn: 0xFE, Thorn: 0xDE, eth: 0xF0, Eth: 0xD0,
  copyright: 0xA9, registered: 0xAE, trademark: 0x2122, degree: 0xB0,
  sterling: 0xA3, yen: 0xA5, Euro: 0x20AC, cent: 0xA2,
  quotedblleft: 0x201C, quotedblright: 0x201D, quoteleft: 0x2018, quoteright: 0x2019,
  guillemotleft: 0xAB, guillemotright: 0xBB, ellipsis: 0x2026,
  minus: 0x2212, multiply: 0xD7, divide: 0xF7, plusminus: 0xB1,
  fraction: 0x2044, periodcentered: 0xB7, dagger: 0x2020, daggerdbl: 0x2021,
  section: 0xA7, paragraph: 0xB6, ordfeminine: 0xAA, ordmasculine: 0xBA,
};

/** Parse Differences array do PDF Encoding para construir mapeamento code→char */
function parseDifferences(raw: string): CMapTable {
  const table: CMapTable = new Map();
  const tokens = raw.match(/\d+|\/\w+/g);
  if (!tokens) return table;
  let code = 0;
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      code = parseInt(t);
    } else if (t.startsWith("/")) {
      const name = t.substring(1);
      const unicode = GLYPH_NAME_TO_UNICODE[name];
      if (unicode !== undefined) {
        table.set(code, String.fromCodePoint(unicode));
      }
      code++;
    }
  }
  return table;
}

/* ── String decoders ─────────────────────────────────────────── */

/** Decodifica string literal PDF: (texto\)escapado) */
function decodeLiteralString(s: string): string {
  let result = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === "\\") {
      i++;
      if (i >= s.length) break;
      switch (s[i]) {
        case "n": result += "\n"; break;
        case "r": result += "\r"; break;
        case "t": result += "\t"; break;
        case "b": result += "\b"; break;
        case "f": result += "\f"; break;
        case "(": result += "("; break;
        case ")": result += ")"; break;
        case "\\": result += "\\"; break;
        default:
          if (/[0-7]/.test(s[i])) {
            let oct = s[i];
            if (i + 1 < s.length && /[0-7]/.test(s[i + 1])) { oct += s[++i]; }
            if (i + 1 < s.length && /[0-7]/.test(s[i + 1])) { oct += s[++i]; }
            result += String.fromCharCode(parseInt(oct, 8));
          } else {
            result += s[i];
          }
      }
    } else {
      result += s[i];
    }
    i++;
  }
  return result;
}

/** Decodifica string hexadecimal PDF com suporte a CMap (glyph IDs de 1 ou 2 bytes) */
function decodeHexString(hex: string, cmap?: CMapTable): string {
  const clean = hex.replace(/\s/g, "");
  if (!cmap || cmap.size === 0) {
    // Fallback: decode como bytes simples
    let result = "";
    for (let i = 0; i < clean.length - 1; i += 2) {
      result += String.fromCharCode(parseInt(clean.substring(i, i + 2), 16));
    }
    return result;
  }

  // Detecta se o CMap usa IDs de 2 bytes (valores > 0xFF nas chaves)
  let maxKey = 0;
  for (const k of cmap.keys()) { if (k > maxKey) maxKey = k; }
  const is2Byte = maxKey > 0xFF || clean.length >= 4;

  let result = "";
  const step = is2Byte ? 4 : 2;
  for (let i = 0; i + step - 1 < clean.length; i += step) {
    const code = parseInt(clean.substring(i, i + step), 16);
    const mapped = cmap.get(code);
    if (mapped) {
      result += mapped;
    } else if (!is2Byte) {
      result += String.fromCharCode(code);
    } else {
      // Tenta como 2 bytes separados se 2-byte falhou
      const hi = parseInt(clean.substring(i, i + 2), 16);
      const lo = parseInt(clean.substring(i + 2, i + 4), 16);
      const mappedHi = cmap.get(hi);
      const mappedLo = cmap.get(lo);
      if (mappedHi || mappedLo) {
        result += (mappedHi || String.fromCharCode(hi)) + (mappedLo || String.fromCharCode(lo));
      } else if (code >= 0x20 && code < 0xFFFE) {
        result += String.fromCodePoint(code);
      }
    }
  }
  return result;
}

/** Aplica CMap a uma literal string (cada byte é um glyph ID) */
function applyLiteralCmap(s: string, cmap?: CMapTable): string {
  if (!cmap || cmap.size === 0) return s;
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    const mapped = cmap.get(code);
    result += mapped ?? s[i];
  }
  return result;
}

/* ── Content stream text extractor ──────────────────────────── */

/** Extrai textos dos operadores Tj, TJ, ', " com CMap por fonte */
function extractTextFromContent(content: string, fontCMaps: Map<string, CMapTable>, defaultCMap?: CMapTable): string {
  const lines: string[] = [];
  let currentLine = "";
  let inBT = false;
  let currentFont = "";

  const getCMap = (): CMapTable | undefined => {
    return fontCMaps.get(currentFont) || defaultCMap;
  };

  const contentLines = content.split(/\r?\n/);
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed === "BT") { inBT = true; continue; }
    if (trimmed === "ET") {
      inBT = false;
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = "";
      continue;
    }
    if (!inBT) continue;

    // Tf: seleciona fonte — /F1 12 Tf
    const tfMatch = trimmed.match(/\/(\S+)\s+[\d.]+\s+Tf/);
    if (tfMatch) {
      currentFont = tfMatch[1];
    }

    // Operadores de posicionamento que indicam nova linha
    if (/^.*\bTd\b/.test(trimmed) || /^.*\bTD\b/.test(trimmed) || /^.*\bT\*\b/.test(trimmed)) {
      const tdMatch = trimmed.match(/(-?[\d.]+)\s+(-?[\d.]+)\s+Td/);
      if (tdMatch) {
        const ty = parseFloat(tdMatch[2]);
        if (Math.abs(ty) > 1) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }
      }
    }

    // Tm (text matrix) – geralmente indica nova posição
    const tmMatch = trimmed.match(/([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm/);
    if (tmMatch) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
    }

    const cmap = getCMap();

    // Operador Tj: (texto) Tj ou <hex> Tj
    const tjLitMatches = trimmed.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g);
    for (const m of tjLitMatches) {
      const decoded = decodeLiteralString(m[1]);
      currentLine += applyLiteralCmap(decoded, cmap);
    }

    const tjHexMatches = trimmed.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g);
    for (const m of tjHexMatches) {
      currentLine += decodeHexString(m[1], cmap);
    }

    // Operador ': (texto) '
    const quoteMatches = trimmed.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*'/g);
    for (const m of quoteMatches) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      const decoded = decodeLiteralString(m[1]);
      currentLine = applyLiteralCmap(decoded, cmap);
    }

    // Operador TJ: [(texto) 123 (texto2)] TJ
    const tjArrayMatch = trimmed.match(/\[(.*)\]\s*TJ/s);
    if (tjArrayMatch) {
      const arr = tjArrayMatch[1];
      const parts = arr.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)|<([0-9a-fA-F\s]+)>|([-]?\d+)/g);
      for (const p of parts) {
        if (p[1] !== undefined) {
          const decoded = decodeLiteralString(p[1]);
          currentLine += applyLiteralCmap(decoded, cmap);
        } else if (p[2] !== undefined) {
          currentLine += decodeHexString(p[2], cmap);
        }
        if (p[3] !== undefined) {
          const kern = parseInt(p[3]);
          if (kern < -200) currentLine += " ";
        }
      }
    }
  }

  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines.join("\n");
}

/* ── Font/CMap extraction from PDF structure ─────────────────── */

interface StreamInfo {
  header: string;
  data: string;
  rawData: Uint8Array;
}

/** Extrai e descomprime todos os streams do PDF */
async function extractAllStreams(bytes: Uint8Array): Promise<StreamInfo[]> {
  const streams: StreamInfo[] = [];
  const streamStarts = findAll(bytes, "stream");
  const endStreamPositions = findAll(bytes, "endstream");

  for (const start of streamStarts) {
    // Ignora "endstream"
    if (start >= 3 && bytes[start - 3] === 0x65 && bytes[start - 2] === 0x6E && bytes[start - 1] === 0x64) continue;

    const lookback = Math.max(0, start - 500);
    const header = new TextDecoder("latin1").decode(bytes.slice(lookback, start));
    const isFlate = header.includes("FlateDecode");

    const streamDataStart = start + "stream".length;
    let actualStart = streamDataStart;
    if (bytes[actualStart] === 0x0D && bytes[actualStart + 1] === 0x0A) actualStart += 2;
    else if (bytes[actualStart] === 0x0A) actualStart += 1;

    let end = -1;
    for (const es of endStreamPositions) {
      if (es > actualStart) { end = es; break; }
    }
    if (end === -1 || end - actualStart > 5_000_000) continue;

    let actualEnd = end;
    if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0A) actualEnd--;
    if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0D) actualEnd--;

    const streamData = bytes.slice(actualStart, actualEnd);
    let decoded: string;

    if (isFlate) {
      const inflated = await inflate(streamData);
      if (inflated.length === 0) continue;
      decoded = new TextDecoder("latin1").decode(inflated);
      streams.push({ header, data: decoded, rawData: inflated });
    } else {
      decoded = new TextDecoder("latin1").decode(streamData);
      streams.push({ header, data: decoded, rawData: streamData });
    }
  }
  return streams;
}

/**
 * Extrai texto de um arquivo PDF (ArrayBuffer).
 * Funciona em Cloudflare Workers sem dependências externas.
 * Suporta ToUnicode CMap para fontes com encoding customizado.
 */
export async function extrairTextoPdf(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const allTexts: string[] = [];

  // Texto bruto do PDF (para parsear estrutura de fontes)
  const pdfRawText = new TextDecoder("latin1").decode(bytes);

  // Extrai e descomprime todos os streams
  const streams = await extractAllStreams(bytes);

  // Fase 1: Mapeia número de objeto → stream (extraído do header)
  const streamByObjNum = new Map<number, { header: string; data: string }>();
  for (const s of streams) {
    // O header pode conter vários "N 0 obj" — pega o ÚLTIMO (mais próximo do stream)
    const allMatches = [...s.header.matchAll(/(\d+)\s+0\s+obj/g)];
    if (allMatches.length > 0) {
      const lastMatch = allMatches[allMatches.length - 1];
      streamByObjNum.set(parseInt(lastMatch[1]), s);
    }
  }

  // Fase 2: Associa fontes aos CMaps via estrutura de objetos do PDF
  const fontCMaps = new Map<string, CMapTable>();

  // Passo 2a: Encontra objetos de fonte com /ToUnicode X 0 R
  // Usa regex que não cruza limites de endobj
  const fontObjToUnicode = new Map<number, number>(); // obj_id → toUnicode_obj_id
  const fontObjMatches = pdfRawText.matchAll(/(\d+)\s+0\s+obj\b((?:(?!endobj)[\s\S])*?)\/ToUnicode\s+(\d+)\s+0\s+R/g);
  for (const m of fontObjMatches) {
    fontObjToUnicode.set(parseInt(m[1]), parseInt(m[3]));
  }

  // Passo 2b: Encontra /Font resources que mapeiam nomes (/F10, /F11) a objetos
  const fontNameToObj = new Map<string, number>();
  const fontRefMatches = pdfRawText.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g);
  for (const m of fontRefMatches) {
    fontNameToObj.set(m[1], parseInt(m[2]));
  }

  // Passo 2c: Parseia CMap de cada ToUnicode object diretamente pelo número do objeto
  const toUnicodeObjToTable = new Map<number, CMapTable>();
  for (const [, toUnicodeObjId] of fontObjToUnicode) {
    const stream = streamByObjNum.get(toUnicodeObjId);
    if (stream && isCMapStream(stream.data)) {
      const table = parseCMap(stream.data);
      if (table.size > 0) {
        toUnicodeObjToTable.set(toUnicodeObjId, table);
      }
    }
  }

  // Passo 2d: Associa nomes de fonte → CMap
  for (const [fontName, fontObjId] of fontNameToObj) {
    // Caso 1: O objeto da fonte tem /ToUnicode diretamente
    const toUnicodeObjId = fontObjToUnicode.get(fontObjId);
    if (toUnicodeObjId !== undefined) {
      const table = toUnicodeObjToTable.get(toUnicodeObjId);
      if (table) {
        fontCMaps.set(fontName, table);
        continue;
      }
    }
    // Caso 2: Segue a referência do objeto da fonte para encontrar /ToUnicode
    const fontObjPattern = new RegExp(`\\b${fontObjId}\\s+0\\s+obj\\b[\\s\\S]*?endobj`);
    const fontObjMatch = pdfRawText.match(fontObjPattern);
    if (fontObjMatch) {
      const toUMatch = fontObjMatch[0].match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
      if (toUMatch) {
        const tuId = parseInt(toUMatch[1]);
        // Tenta pegar da tabela já parseada
        let table = toUnicodeObjToTable.get(tuId);
        if (!table) {
          // Parseia sob demanda
          const stream = streamByObjNum.get(tuId);
          if (stream && isCMapStream(stream.data)) {
            table = parseCMap(stream.data);
            if (table && table.size > 0) {
              toUnicodeObjToTable.set(tuId, table);
            }
          }
        }
        if (table) {
          fontCMaps.set(fontName, table);
        }
      }
    }
  }

  // Fallback: se nenhum mapeamento encontrado, usa o maior CMap para tudo
  let defaultCMap: CMapTable | undefined;
  if (fontCMaps.size === 0) {
    // Parseia todos os CMap streams disponíveis e usa o maior
    let bestSize = 0;
    for (const s of streams) {
      if (isCMapStream(s.data)) {
        const table = parseCMap(s.data);
        if (table.size > bestSize) { bestSize = table.size; defaultCMap = table; }
      }
    }
  }

  // Também tenta Differences encoding
  const diffBlocks = pdfRawText.matchAll(/\/Differences\s*\[([^\]]+)\]/g);
  for (const m of diffBlocks) {
    const diffTable = parseDifferences(m[1]);
    if (diffTable.size > 0 && !defaultCMap) defaultCMap = diffTable;
  }

  // Fase 3: Extrai texto de content streams
  for (const s of streams) {
    if (s.data.includes("BT") && (s.data.includes("Tj") || s.data.includes("TJ"))) {
      const text = extractTextFromContent(s.data, fontCMaps, defaultCMap);
      if (text.trim()) {
        const cleanText = text
          .split("\n")
          .filter(line => {
            const printable = line.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
            return printable.length > 0 && printable.length >= line.trim().length * 0.3;
          })
          .join("\n");
        if (cleanText.trim()) allTexts.push(cleanText);
      }
    }
  }

  return allTexts.join("\n\n");
}

/** Extrai imagens embutidas em um PDF (JPEG/PNG).
 *  Procura streams com /Subtype /Image e extrai os dados brutos. */
export function extrairImagensPdf(buffer: ArrayBuffer): { data: ArrayBuffer; type: string }[] {
  const bytes = new Uint8Array(buffer);
  const imagens: { data: ArrayBuffer; type: string }[] = [];

  // Busca marcadores JPEG (FFD8...FFD9) diretamente nos bytes
  const jpegStart = [0xFF, 0xD8, 0xFF];
  const jpegEnd = [0xFF, 0xD9];

  for (let i = 0; i < bytes.length - 3; i++) {
    if (bytes[i] === jpegStart[0] && bytes[i + 1] === jpegStart[1] && bytes[i + 2] === jpegStart[2]) {
      // Encontrou início JPEG, procura fim
      for (let j = i + 3; j < bytes.length - 1 && j < i + 10_000_000; j++) {
        if (bytes[j] === jpegEnd[0] && bytes[j + 1] === jpegEnd[1]) {
          const imgData = bytes.slice(i, j + 2);
          // Apenas imagens maiores que 5KB (evita thumbnails)
          if (imgData.length > 5000) {
            imagens.push({ data: imgData.buffer, type: "image/jpeg" });
          }
          i = j + 1; // avança para depois desta imagem
          break;
        }
      }
    }
  }

  // Busca marcadores PNG (89504E47...IEND)
  const pngSig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  const iend = new TextEncoder().encode("IEND");

  for (let i = 0; i < bytes.length - 8; i++) {
    let isPng = true;
    for (let k = 0; k < 8; k++) {
      if (bytes[i + k] !== pngSig[k]) { isPng = false; break; }
    }
    if (!isPng) continue;

    // Procura IEND chunk
    for (let j = i + 8; j < bytes.length - 8 && j < i + 10_000_000; j++) {
      let found = true;
      for (let k = 0; k < iend.length; k++) {
        if (bytes[j + k] !== iend[k]) { found = false; break; }
      }
      if (found) {
        const imgData = bytes.slice(i, j + 12); // IEND + CRC (4 bytes)
        if (imgData.length > 5000) {
          imagens.push({ data: imgData.buffer, type: "image/png" });
        }
        i = j + 11;
        break;
      }
    }
  }

  return imagens;
}
