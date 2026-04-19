/* ── Extrator de texto PDF para Cloudflare Workers ───────────────
 *  Usa DecompressionStream (Web API) para descomprimir FlateDecode.
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

/** Decodifica string hexadecimal PDF: <48656C6C6F> */
function decodeHexString(hex: string): string {
  let result = "";
  const clean = hex.replace(/\s/g, "");
  for (let i = 0; i < clean.length - 1; i += 2) {
    result += String.fromCharCode(parseInt(clean.substring(i, i + 2), 16));
  }
  return result;
}

/** Extrai textos dos operadores Tj, TJ, ', " em um bloco de conteúdo de página PDF. */
function extractTextFromContent(content: string): string {
  const lines: string[] = [];
  let currentLine = "";
  let inBT = false;

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

    // Operadores de posicionamento que indicam nova linha
    if (/^.*\bTd\b/.test(trimmed) || /^.*\bTD\b/.test(trimmed) || /^.*\bT\*\b/.test(trimmed)) {
      // Td com deslocamento Y significativo = nova linha
      const tdMatch = trimmed.match(/(-?[\d.]+)\s+(-?[\d.]+)\s+Td/);
      if (tdMatch) {
        const ty = parseFloat(tdMatch[2]);
        if (Math.abs(ty) > 1) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }
      }
    }

    // Operador Tj: (texto) Tj
    const tjMatches = trimmed.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g);
    for (const m of tjMatches) {
      currentLine += decodeLiteralString(m[1]);
    }

    // Operador ': (texto) '
    const quoteMatches = trimmed.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*'/g);
    for (const m of quoteMatches) {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = decodeLiteralString(m[1]);
    }

    // Operador TJ: [(texto) 123 (texto2)] TJ
    const tjArrayMatch = trimmed.match(/\[(.*)\]\s*TJ/s);
    if (tjArrayMatch) {
      const arr = tjArrayMatch[1];
      const parts = arr.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)|<([0-9a-fA-F\s]+)>/g);
      for (const p of parts) {
        if (p[1] !== undefined) {
          currentLine += decodeLiteralString(p[1]);
        } else if (p[2] !== undefined) {
          currentLine += decodeHexString(p[2]);
        }
      }
    }

    // Hex strings: <hex> Tj
    const hexTjMatches = trimmed.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g);
    for (const m of hexTjMatches) {
      currentLine += decodeHexString(m[1]);
    }
  }

  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines.join("\n");
}

/**
 * Extrai texto de um arquivo PDF (ArrayBuffer).
 * Funciona em Cloudflare Workers sem dependências externas.
 */
export async function extrairTextoPdf(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const allTexts: string[] = [];

  // Encontra todos os blocos stream/endstream
  const streamStarts = findAll(bytes, "stream");
  const endStreamPositions = findAll(bytes, "endstream");

  for (const start of streamStarts) {
    // Ignora "endstream" (verifica se 'end' precede 'stream')
    if (start >= 3 && bytes[start - 3] === 0x65 && bytes[start - 2] === 0x6E && bytes[start - 1] === 0x64) continue;

    // Verifica se tem FlateDecode antes (em algum lugar nas ~200 bytes anteriores)
    const lookback = Math.max(0, start - 300);
    const header = new TextDecoder("latin1").decode(bytes.slice(lookback, start));
    const isFlate = header.includes("FlateDecode");
    const isText = header.includes("/Type /Page") || header.includes("/Type/Page") ||
                   !header.includes("/Type /") || header.includes("/Subtype /Form");

    // Encontra o fim do stream
    const streamDataStart = start + "stream".length;
    let actualStart = streamDataStart;
    // Pula \r\n ou \n após "stream"
    if (bytes[actualStart] === 0x0D && bytes[actualStart + 1] === 0x0A) actualStart += 2;
    else if (bytes[actualStart] === 0x0A) actualStart += 1;

    // Encontra o endstream correspondente
    let end = -1;
    for (const es of endStreamPositions) {
      if (es > actualStart) { end = es; break; }
    }
    if (end === -1 || end - actualStart > 5_000_000) continue;

    // Pula \r\n antes de endstream
    let actualEnd = end;
    if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0A) actualEnd--;
    if (actualEnd > 0 && bytes[actualEnd - 1] === 0x0D) actualEnd--;

    const streamData = bytes.slice(actualStart, actualEnd);
    let decoded: string;

    if (isFlate) {
      const inflated = await inflate(streamData);
      if (inflated.length === 0) continue;
      decoded = new TextDecoder("latin1").decode(inflated);
    } else {
      decoded = new TextDecoder("latin1").decode(streamData);
    }

    // Só processa se parece conteúdo de página (tem operadores de texto)
    if (decoded.includes("BT") && (decoded.includes("Tj") || decoded.includes("TJ"))) {
      const text = extractTextFromContent(decoded);
      if (text.trim()) allTexts.push(text);
    }
  }

  return allTexts.join("\n\n");
}
