var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .wrangler/tmp/bundle-NYVqgT/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  ".wrangler/tmp/bundle-NYVqgT/strip-cf-connecting-ip-header.js"() {
    "use strict";
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// worker/src/pdf_extractor.ts
var pdf_extractor_exports = {};
__export(pdf_extractor_exports, {
  extrairTextoPdf: () => extrairTextoPdf
});
async function inflate(data) {
  for (const fmt of ["deflate", "deflate-raw"]) {
    try {
      const ds = new DecompressionStream(fmt);
      const writer = ds.writable.getWriter();
      writer.write(data);
      writer.close();
      const reader = ds.readable.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        chunks.push(value);
      }
      const totalLen = chunks.reduce((s, c) => s + c.length, 0);
      const result = new Uint8Array(totalLen);
      let offset = 0;
      for (const c of chunks) {
        result.set(c, offset);
        offset += c.length;
      }
      if (result.length > 0)
        return result;
    } catch {
    }
  }
  return new Uint8Array(0);
}
function findAll(haystack, needle) {
  const enc = new TextEncoder();
  const nb = enc.encode(needle);
  const positions = [];
  for (let i = 0; i <= haystack.length - nb.length; i++) {
    let match = true;
    for (let j = 0; j < nb.length; j++) {
      if (haystack[i + j] !== nb[j]) {
        match = false;
        break;
      }
    }
    if (match)
      positions.push(i);
  }
  return positions;
}
function decodeLiteralString(s) {
  let result = "";
  let i = 0;
  while (i < s.length) {
    if (s[i] === "\\") {
      i++;
      if (i >= s.length)
        break;
      switch (s[i]) {
        case "n":
          result += "\n";
          break;
        case "r":
          result += "\r";
          break;
        case "t":
          result += "	";
          break;
        case "b":
          result += "\b";
          break;
        case "f":
          result += "\f";
          break;
        case "(":
          result += "(";
          break;
        case ")":
          result += ")";
          break;
        case "\\":
          result += "\\";
          break;
        default:
          if (/[0-7]/.test(s[i])) {
            let oct = s[i];
            if (i + 1 < s.length && /[0-7]/.test(s[i + 1])) {
              oct += s[++i];
            }
            if (i + 1 < s.length && /[0-7]/.test(s[i + 1])) {
              oct += s[++i];
            }
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
function decodeHexString(hex) {
  let result = "";
  const clean = hex.replace(/\s/g, "");
  for (let i = 0; i < clean.length - 1; i += 2) {
    result += String.fromCharCode(parseInt(clean.substring(i, i + 2), 16));
  }
  return result;
}
function extractTextFromContent(content) {
  const lines = [];
  let currentLine = "";
  let inBT = false;
  const contentLines = content.split(/\r?\n/);
  for (const line of contentLines) {
    const trimmed = line.trim();
    if (trimmed === "BT") {
      inBT = true;
      continue;
    }
    if (trimmed === "ET") {
      inBT = false;
      if (currentLine.trim())
        lines.push(currentLine.trim());
      currentLine = "";
      continue;
    }
    if (!inBT)
      continue;
    if (/^.*\bTd\b/.test(trimmed) || /^.*\bTD\b/.test(trimmed) || /^.*\bT\*\b/.test(trimmed)) {
      const tdMatch = trimmed.match(/(-?[\d.]+)\s+(-?[\d.]+)\s+Td/);
      if (tdMatch) {
        const ty = parseFloat(tdMatch[2]);
        if (Math.abs(ty) > 1) {
          if (currentLine.trim())
            lines.push(currentLine.trim());
          currentLine = "";
        }
      }
    }
    const tjMatches = trimmed.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*Tj/g);
    for (const m of tjMatches) {
      currentLine += decodeLiteralString(m[1]);
    }
    const quoteMatches = trimmed.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)\s*'/g);
    for (const m of quoteMatches) {
      if (currentLine.trim())
        lines.push(currentLine.trim());
      currentLine = decodeLiteralString(m[1]);
    }
    const tjArrayMatch = trimmed.match(/\[(.*)\]\s*TJ/s);
    if (tjArrayMatch) {
      const arr = tjArrayMatch[1];
      const parts = arr.matchAll(/\(([^)]*(?:\\.[^)]*)*)\)|<([0-9a-fA-F\s]+)>/g);
      for (const p of parts) {
        if (p[1] !== void 0) {
          currentLine += decodeLiteralString(p[1]);
        } else if (p[2] !== void 0) {
          currentLine += decodeHexString(p[2]);
        }
      }
    }
    const hexTjMatches = trimmed.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g);
    for (const m of hexTjMatches) {
      currentLine += decodeHexString(m[1]);
    }
  }
  if (currentLine.trim())
    lines.push(currentLine.trim());
  return lines.join("\n");
}
async function extrairTextoPdf(buffer) {
  const bytes = new Uint8Array(buffer);
  const allTexts = [];
  const streamStarts = findAll(bytes, "stream");
  const endStreamPositions = findAll(bytes, "endstream");
  for (const start of streamStarts) {
    if (start >= 3 && bytes[start - 3] === 101 && bytes[start - 2] === 110 && bytes[start - 1] === 100)
      continue;
    const lookback = Math.max(0, start - 300);
    const header = new TextDecoder("latin1").decode(bytes.slice(lookback, start));
    const isFlate = header.includes("FlateDecode");
    const isText = header.includes("/Type /Page") || header.includes("/Type/Page") || !header.includes("/Type /") || header.includes("/Subtype /Form");
    const streamDataStart = start + "stream".length;
    let actualStart = streamDataStart;
    if (bytes[actualStart] === 13 && bytes[actualStart + 1] === 10)
      actualStart += 2;
    else if (bytes[actualStart] === 10)
      actualStart += 1;
    let end = -1;
    for (const es of endStreamPositions) {
      if (es > actualStart) {
        end = es;
        break;
      }
    }
    if (end === -1 || end - actualStart > 5e6)
      continue;
    let actualEnd = end;
    if (actualEnd > 0 && bytes[actualEnd - 1] === 10)
      actualEnd--;
    if (actualEnd > 0 && bytes[actualEnd - 1] === 13)
      actualEnd--;
    const streamData = bytes.slice(actualStart, actualEnd);
    let decoded;
    if (isFlate) {
      const inflated = await inflate(streamData);
      if (inflated.length === 0)
        continue;
      decoded = new TextDecoder("latin1").decode(inflated);
    } else {
      decoded = new TextDecoder("latin1").decode(streamData);
    }
    if (decoded.includes("BT") && (decoded.includes("Tj") || decoded.includes("TJ"))) {
      const text = extractTextFromContent(decoded);
      if (text.trim())
        allTexts.push(text);
    }
  }
  return allTexts.join("\n\n");
}
var init_pdf_extractor = __esm({
  "worker/src/pdf_extractor.ts"() {
    "use strict";
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    __name(inflate, "inflate");
    __name(findAll, "findAll");
    __name(decodeLiteralString, "decodeLiteralString");
    __name(decodeHexString, "decodeHexString");
    __name(extractTextFromContent, "extractTextFromContent");
    __name(extrairTextoPdf, "extrairTextoPdf");
  }
});

// .wrangler/tmp/bundle-NYVqgT/middleware-loader.entry.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// .wrangler/tmp/bundle-NYVqgT/middleware-insertion-facade.js
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// worker/src/index.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// worker/src/auth.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var COOKIE_NAME = "af_session";
function base64UrlEncode(value) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlEncodeBytes(bytes) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (const b of arr)
    binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(base64UrlEncodeBytes, "base64UrlEncodeBytes");
function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}
__name(base64UrlDecode, "base64UrlDecode");
async function signHmac(data, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncodeBytes(signature);
}
__name(signHmac, "signHmac");
async function generateToken(username, secret, ttlSeconds = 60 * 60 * 8) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1e3) + ttlSeconds }));
  const signature = await signHmac(`${header}.${payload}`, secret);
  return `${header}.${payload}.${signature}`;
}
__name(generateToken, "generateToken");
async function verifyToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3)
    return null;
  const [header, payload, signature] = parts;
  const expected = await signHmac(`${header}.${payload}`, secret);
  if (expected !== signature)
    return null;
  try {
    const parsed = JSON.parse(base64UrlDecode(payload));
    if (!parsed.sub || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1e3))
      return null;
    return parsed;
  } catch {
    return null;
  }
}
__name(verifyToken, "verifyToken");
function readSessionToken(request) {
  const raw = request.headers.get("Cookie");
  if (!raw)
    return null;
  const cookie = raw.split(";").map((chunk) => chunk.trim()).find((chunk) => chunk.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : null;
}
__name(readSessionToken, "readSessionToken");
function buildSessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}
__name(buildSessionCookie, "buildSessionCookie");
function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
__name(clearSessionCookie, "clearSessionCookie");
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
function timingSafeEqual(a, b) {
  if (a.length !== b.length)
    return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function isSha256Hex(value) {
  return /^[a-f0-9]{64}$/i.test(value);
}
__name(isSha256Hex, "isSha256Hex");
async function authenticateUser(db, username, password) {
  const row = await db.prepare("SELECT username, nome_completo, password_hash FROM usuarios WHERE username = ? LIMIT 1").bind(username).first();
  const passwordHash = await sha256Hex(password);
  if (row) {
    if (isSha256Hex(row.password_hash)) {
      if (timingSafeEqual(row.password_hash, passwordHash)) {
        return { username: row.username, nomeCompleto: row.nome_completo };
      }
    } else if (timingSafeEqual(row.password_hash, password)) {
      await db.prepare("UPDATE usuarios SET password_hash = ? WHERE username = ? AND password_hash = ?").bind(passwordHash, row.username, row.password_hash).run();
      return { username: row.username, nomeCompleto: row.nome_completo };
    }
  }
  return null;
}
__name(authenticateUser, "authenticateUser");

// worker/src/routes/dashboard.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// worker/src/db.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function getDocumentoById(db, id, usuario) {
  const row = await db.prepare("SELECT * FROM documentos WHERE id = ? AND usuario = ? LIMIT 1").bind(id, usuario).first();
  return row ?? null;
}
__name(getDocumentoById, "getDocumentoById");
async function listDocumentos(db, usuario, filters) {
  const clauses = ["usuario = ?"];
  const params = [usuario];
  if (filters.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }
  if (filters.tipo) {
    clauses.push("tipo = ?");
    params.push(filters.tipo);
  }
  if (filters.busca) {
    clauses.push("nome_arquivo LIKE ?");
    params.push(`%${filters.busca}%`);
  }
  const where = clauses.join(" AND ");
  const totalRow = await db.prepare(`SELECT COUNT(*) as total FROM documentos WHERE ${where}`).bind(...params).first();
  const offset = (filters.page - 1) * filters.perPage;
  const items = await db.prepare(`SELECT * FROM documentos WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).bind(...params, filters.perPage, offset).all();
  return {
    items: items.results ?? [],
    total: totalRow?.total ?? 0,
    page: filters.page,
    perPage: filters.perPage
  };
}
__name(listDocumentos, "listDocumentos");
async function getDashboardStats(db, usuario) {
  const total = await db.prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ?").bind(usuario).first();
  const alertas = await db.prepare("SELECT COALESCE(SUM(json_array_length(alertas)), 0) total FROM documentos WHERE usuario = ?").bind(usuario).first();
  const semIrregularidades = await db.prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ? AND score = 0").bind(usuario).first();
  const comIrregularidades = await db.prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ? AND score > 0").bind(usuario).first();
  const emAnalise = await db.prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ? AND status = 'analisando'").bind(usuario).first();
  const recentes = await db.prepare("SELECT id, nome_arquivo, status, score, nivel, data_upload FROM documentos WHERE usuario = ? ORDER BY id DESC LIMIT 5").bind(usuario).all();
  return {
    totalDocumentos: total?.total ?? 0,
    totalAlertas: alertas?.total ?? 0,
    documentosSemIrregularidades: semIrregularidades?.total ?? 0,
    documentosComIrregularidades: comIrregularidades?.total ?? 0,
    documentosEmAnalise: emAnalise?.total ?? 0,
    recentes: recentes.results ?? []
  };
}
__name(getDashboardStats, "getDashboardStats");

// worker/src/routes/dashboard.ts
async function dashboardRoute(env, username) {
  const stats = await getDashboardStats(env.DB, username);
  return Response.json(stats);
}
__name(dashboardRoute, "dashboardRoute");

// worker/src/routes/documentos.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// worker/src/r2.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function salvarArquivo(bucket, key, file) {
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream"
    }
  });
}
__name(salvarArquivo, "salvarArquivo");
async function deletarArquivo(bucket, key) {
  await bucket.delete(key);
}
__name(deletarArquivo, "deletarArquivo");
async function getArquivo(bucket, key) {
  return bucket.get(key);
}
__name(getArquivo, "getArquivo");

// worker/src/routes/documentos.ts
function parseAlertasData(alertas) {
  if (!alertas)
    return { alertas: [] };
  try {
    const parsed = JSON.parse(alertas);
    if (Array.isArray(parsed))
      return { alertas: parsed };
    if (parsed && Array.isArray(parsed.alertas))
      return { alertas: parsed.alertas, resumo: parsed.resumo };
    return { alertas: [] };
  } catch {
    return { alertas: [] };
  }
}
__name(parseAlertasData, "parseAlertasData");
async function listDocumentosRoute(request, env, username) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const perPage = 10;
  const result = await listDocumentos(env.DB, username, {
    status: url.searchParams.get("status"),
    tipo: url.searchParams.get("tipo"),
    busca: url.searchParams.get("busca"),
    page,
    perPage
  });
  return Response.json({
    ...result,
    items: result.items.map((item) => {
      const data = parseAlertasData(item.alertas);
      return { ...item, alertas: data.alertas, resumo: data.resumo };
    })
  });
}
__name(listDocumentosRoute, "listDocumentosRoute");
async function getDocumentoRoute(env, username, id) {
  const doc = await getDocumentoById(env.DB, id, username);
  if (!doc)
    return Response.json({ ok: false, message: "Documento n\xE3o encontrado" }, { status: 404 });
  const data = parseAlertasData(doc.alertas);
  return Response.json({ ...doc, alertas: data.alertas, resumo: data.resumo });
}
__name(getDocumentoRoute, "getDocumentoRoute");
async function deleteDocumentoRoute(env, username, id) {
  const doc = await getDocumentoById(env.DB, id, username);
  if (!doc)
    return Response.json({ ok: false, message: "Documento n\xE3o encontrado" }, { status: 404 });
  await deletarArquivo(env.BUCKET, doc.r2_key);
  await env.DB.prepare("DELETE FROM documentos WHERE id = ? AND usuario = ?").bind(id, username).run();
  return Response.json({ ok: true });
}
__name(deleteDocumentoRoute, "deleteDocumentoRoute");
async function downloadDocumentoRoute(request, env, username, id) {
  const doc = await getDocumentoById(env.DB, id, username);
  if (!doc)
    return Response.json({ ok: false, message: "Documento n\xE3o encontrado" }, { status: 404 });
  const url = new URL(request.url);
  const direct = url.searchParams.get("direct") === "1";
  if (!direct) {
    return Response.json({ downloadUrl: `${new URL(request.url).origin}/api/documentos/${id}/download?direct=1`, expiresIn: 600 });
  }
  const obj = await getArquivo(env.BUCKET, doc.r2_key);
  if (!obj)
    return Response.json({ ok: false, message: "Arquivo n\xE3o encontrado no storage" }, { status: 404 });
  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType || "application/octet-stream");
  const safeName = doc.nome_arquivo.replace(/["\r\n]/g, "_");
  headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
  return new Response(obj.body, { headers });
}
__name(downloadDocumentoRoute, "downloadDocumentoRoute");

// worker/src/routes/auth.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function loginRoute(request, env) {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });
  let username = "";
  let password = "";
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    username = body.username?.trim() ?? "";
    password = body.password ?? "";
  } else {
    const body = await request.formData();
    username = String(body.get("username") ?? "").trim();
    password = String(body.get("password") ?? "");
  }
  const user = await authenticateUser(env.DB, username, password);
  if (!user) {
    return Response.json({ ok: false, message: "Credenciais inv\xE1lidas" }, { status: 401 });
  }
  const token = await generateToken(user.username, env.JWT_SECRET);
  const response = Response.json({ ok: true, user });
  response.headers.set("Set-Cookie", buildSessionCookie(token));
  return response;
}
__name(loginRoute, "loginRoute");
function logoutRoute() {
  const response = Response.redirect("/login", 302);
  response.headers.set("Set-Cookie", clearSessionCookie());
  return response;
}
__name(logoutRoute, "logoutRoute");

// worker/src/routes/upload.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// worker/src/analise.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var LIMITE_DISPENSA_SERVICOS = 59906.02;
var LIMITE_DISPENSA_PEQUENO_VALOR = 59906.02;
var ZSCORE_THRESHOLD = 3;
var LIMITE_MEI = 81e3;
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2)
    return [];
  const separador = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separador).map((h) => h.trim().toLowerCase().replace(/["\u00EF\u00BB\u00BF]/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separador).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2)
      continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}
__name(parseCsv, "parseCsv");
function campo(row, ...nomes) {
  for (const n of nomes) {
    const chave = Object.keys(row).find((k) => k.includes(n));
    if (chave && row[chave])
      return row[chave];
  }
  return "";
}
__name(campo, "campo");
function valorNumerico(row, ...nomes) {
  const raw = campo(row, ...nomes);
  if (!raw)
    return 0;
  let limpo = raw.replace(/[R$\s]/g, "").trim();
  if (/,\d{1,2}$/.test(limpo)) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/\.\d{1,2}$/.test(limpo)) {
    limpo = limpo.replace(/,/g, "");
  } else {
    limpo = limpo.replace(/[.,]/g, "");
  }
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}
__name(valorNumerico, "valorNumerico");
function limparCnpj(cnpj) {
  return cnpj.replace(/\D/g, "");
}
__name(limparCnpj, "limparCnpj");
function validarCnpj(cnpj) {
  const d = limparCnpj(cnpj);
  if (d.length !== 14)
    return false;
  if (/^(\d)\1{13}$/.test(d))
    return false;
  const calc = /* @__PURE__ */ __name((pesos) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++)
      soma += parseInt(d[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }, "calc");
  const d1 = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== parseInt(d[12]))
    return false;
  const d2 = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === parseInt(d[13]);
}
__name(validarCnpj, "validarCnpj");
function extrairCnpjsUnicos(rows) {
  const set = /* @__PURE__ */ new Set();
  for (const row of rows) {
    const limpo = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (limpo.length === 14)
      set.add(limpo);
  }
  return [...set];
}
__name(extrairCnpjsUnicos, "extrairCnpjsUnicos");
async function consultarCnpjsBrasilApi(cnpjs) {
  const cache = /* @__PURE__ */ new Map();
  await Promise.allSettled(
    cnpjs.slice(0, 15).map(async (cnpj) => {
      try {
        const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (r.ok)
          cache.set(cnpj, await r.json());
      } catch {
      }
    })
  );
  return cache;
}
__name(consultarCnpjsBrasilApi, "consultarCnpjsBrasilApi");
async function consultarSancoesCGU(cnpjs, apiKey) {
  const sancionados = /* @__PURE__ */ new Set();
  if (!apiKey)
    return sancionados;
  await Promise.allSettled(
    cnpjs.slice(0, 15).map(async (cnpj) => {
      try {
        const r1 = await fetch(
          `https://api.portaldatransparencia.gov.br/api-de-dados/ceis?cnpjSancionado=${cnpj}`,
          { headers: { "chave-api-dados": apiKey, Accept: "application/json" } }
        );
        if (r1.ok && (await r1.json()).length > 0)
          sancionados.add(cnpj);
      } catch {
      }
      try {
        const r2 = await fetch(
          `https://api.portaldatransparencia.gov.br/api-de-dados/cnep?cnpjSancionado=${cnpj}`,
          { headers: { "chave-api-dados": apiKey, Accept: "application/json" } }
        );
        if (r2.ok && (await r2.json()).length > 0)
          sancionados.add(cnpj);
      } catch {
      }
    })
  );
  return sancionados;
}
__name(consultarSancoesCGU, "consultarSancoesCGU");
function regraValorInvalido(rows) {
  const alertas = [];
  for (const row of rows) {
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if (valor <= 0) {
      alertas.push({
        tipo: "VALOR_ZERADO_OU_NEGATIVO",
        descricao: "Empenho com valor zerado ou negativo",
        pontuacao: 5,
        detalhes: `Registro: ${campo(row, "empenho", "numero", "nota", "id") || "N/D"} | Valor: ${valor}`
      });
    }
  }
  return alertas;
}
__name(regraValorInvalido, "regraValorInvalido");
function regraDispensaSemLicitacao(rows) {
  const alertas = [];
  for (const row of rows) {
    const modalidade = campo(row, "modalidade", "mod", "tipo_licitacao").toUpperCase();
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if ((modalidade.includes("DISPENSA") || modalidade.includes("INEXIGIB")) && valor > LIMITE_DISPENSA_SERVICOS) {
      alertas.push({
        tipo: "CONTRATO_SEM_LICITACAO_INDEVIDO",
        descricao: `Dispensa/inexigibilidade acima do limite (R$ ${LIMITE_DISPENSA_SERVICOS.toLocaleString("pt-BR")})`,
        pontuacao: 15,
        detalhes: `Valor: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Modalidade: ${modalidade} | Fornecedor: ${campo(row, "fornecedor", "credor", "razao", "nome")}`
      });
    }
  }
  return alertas;
}
__name(regraDispensaSemLicitacao, "regraDispensaSemLicitacao");
function regraPagamentoDuplicado(rows) {
  const alertas = [];
  const vistos = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const fornecedor = campo(row, "cnpj", "cpf", "fornecedor", "credor");
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const data = campo(row, "data", "dt_empenho", "dt_pagamento", "emissao");
    const objeto = campo(row, "objeto", "descricao", "historico", "item");
    if (!fornecedor && !valor)
      continue;
    const chave = `${fornecedor}|${valor}|${data}|${objeto}`.toLowerCase();
    const count = (vistos.get(chave) || 0) + 1;
    vistos.set(chave, count);
    if (count === 2) {
      alertas.push({
        tipo: "PAGAMENTO_DUPLICADO",
        descricao: "Poss\xEDvel pagamento duplicado detectado",
        pontuacao: 20,
        detalhes: `Fornecedor: ${fornecedor} | Valor: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Data: ${data}`
      });
    }
  }
  return alertas;
}
__name(regraPagamentoDuplicado, "regraPagamentoDuplicado");
function regraSuperfaturamento(rows) {
  const alertas = [];
  const porObjeto = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const objeto = campo(row, "objeto", "descricao", "historico", "item").toLowerCase().substring(0, 60);
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const subelemento = campo(row, "subelemento", "sub_elemento", "elemento", "natureza");
    if (valor <= 0)
      continue;
    const chave = subelemento || objeto;
    if (!chave)
      continue;
    const lista = porObjeto.get(chave) || [];
    lista.push(valor);
    porObjeto.set(chave, lista);
  }
  for (const [objeto, valores] of porObjeto) {
    if (valores.length < 3)
      continue;
    const media = valores.reduce((s, v) => s + v, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length);
    if (desvio === 0)
      continue;
    for (const v of valores) {
      const zscore = (v - media) / desvio;
      if (zscore > ZSCORE_THRESHOLD) {
        alertas.push({
          tipo: "SUPERFATURAMENTO",
          descricao: "Valor significativamente acima da m\xE9dia para o mesmo objeto",
          pontuacao: 20,
          detalhes: `Objeto: ${objeto} | Valor: R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | M\xE9dia: R$ ${media.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Z-score: ${zscore.toFixed(1)}`
        });
      }
    }
  }
  return alertas;
}
__name(regraSuperfaturamento, "regraSuperfaturamento");
function regraFracionamento(rows) {
  const alertas = [];
  const grupos = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const fornecedor = campo(row, "cnpj", "cpf", "fornecedor", "credor");
    const objeto = campo(row, "objeto", "descricao", "historico", "item").toLowerCase().substring(0, 40);
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const data = campo(row, "data", "dt_empenho", "emissao");
    if (!fornecedor || valor <= 0)
      continue;
    const chave = `${fornecedor}|${objeto}`;
    const lista = grupos.get(chave) || [];
    lista.push({ valor, data });
    grupos.set(chave, lista);
  }
  for (const [chave, itens] of grupos) {
    if (itens.length < 2)
      continue;
    const total = itens.reduce((s, i) => s + i.valor, 0);
    const maiorIndividual = Math.max(...itens.map((i) => i.valor));
    if (total > LIMITE_DISPENSA_SERVICOS && maiorIndividual <= LIMITE_DISPENSA_SERVICOS) {
      const [fornecedor] = chave.split("|");
      alertas.push({
        tipo: "FRACIONAMENTO_LICITACAO",
        descricao: "Poss\xEDvel fracionamento de licita\xE7\xE3o para evitar limite de dispensa",
        pontuacao: 20,
        detalhes: `Fornecedor: ${fornecedor} | ${itens.length} empenhos | Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (cada um abaixo de R$ ${LIMITE_DISPENSA_SERVICOS.toLocaleString("pt-BR")})`
      });
    }
  }
  return alertas;
}
__name(regraFracionamento, "regraFracionamento");
function regraConcentracaoFimAno(rows) {
  if (rows.length < 5)
    return [];
  let total = 0;
  let fimAno = 0;
  let valorFimAno = 0;
  let valorTotal = 0;
  for (const row of rows) {
    const data = campo(row, "data", "dt_empenho", "emissao", "dt_pagamento");
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const match = data.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})|(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (!match)
      continue;
    total++;
    valorTotal += valor;
    const mes = match[2] ? parseInt(match[2]) : parseInt(match[5]);
    if (mes >= 11) {
      fimAno++;
      valorFimAno += valor;
    }
  }
  if (total > 0 && fimAno / total > 0.5) {
    return [{
      tipo: "CONCENTRACAO_FIM_EXERCICIO",
      descricao: "Concentra\xE7\xE3o anormal de empenhos no fim do exerc\xEDcio (nov/dez)",
      pontuacao: 10,
      detalhes: `${fimAno} de ${total} registros (${(fimAno / total * 100).toFixed(0)}%) | Valor: R$ ${valorFimAno.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    }];
  }
  return [];
}
__name(regraConcentracaoFimAno, "regraConcentracaoFimAno");
function regraCnpjInvalido(rows) {
  const alertas = [];
  const verificados = /* @__PURE__ */ new Set();
  for (const row of rows) {
    const raw = campo(row, "cnpj", "cpf_cnpj", "documento");
    const limpo = limparCnpj(raw);
    if (limpo.length !== 14 || verificados.has(limpo))
      continue;
    verificados.add(limpo);
    if (!validarCnpj(limpo)) {
      alertas.push({
        tipo: "CNPJ_INVALIDO",
        descricao: "CNPJ com d\xEDgitos verificadores inv\xE1lidos",
        pontuacao: 15,
        detalhes: `CNPJ: ${raw} | Fornecedor: ${campo(row, "razao", "nome", "credor")}`
      });
    }
  }
  return alertas;
}
__name(regraCnpjInvalido, "regraCnpjInvalido");
function regraConcentracaoFornecedor(rows) {
  const alertas = [];
  const porFornecedor = /* @__PURE__ */ new Map();
  let valorGeral = 0;
  for (const row of rows) {
    const cnpj = campo(row, "cnpj", "cpf_cnpj", "documento", "fornecedor");
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const razao = campo(row, "razao", "nome", "credor");
    if (!cnpj || valor <= 0)
      continue;
    valorGeral += valor;
    const atual = porFornecedor.get(cnpj);
    porFornecedor.set(cnpj, { valor: (atual?.valor ?? 0) + valor, razao: razao || atual?.razao || cnpj });
  }
  if (valorGeral === 0)
    return alertas;
  for (const [cnpj, { valor, razao }] of porFornecedor) {
    const pct = valor / valorGeral * 100;
    if (pct > 40) {
      alertas.push({
        tipo: "CONCENTRACAO_FORNECEDOR",
        descricao: "Fornecedor concentra mais de 40% do valor total dos empenhos",
        pontuacao: 10,
        detalhes: `CNPJ: ${cnpj} | ${razao} | R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${pct.toFixed(1)}% do total)`
      });
    }
  }
  return alertas;
}
__name(regraConcentracaoFornecedor, "regraConcentracaoFornecedor");
function regraNFAnteriorEmpenho(rows) {
  const alertas = [];
  for (const row of rows) {
    const dtNF = campo(row, "data_nf", "dt_nota", "data_nota_fiscal", "emissao_nf");
    const dtEmp = campo(row, "data", "dt_empenho", "data_empenho", "emissao");
    if (!dtNF || !dtEmp)
      continue;
    const parseData = /* @__PURE__ */ __name((s) => {
      const m = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
      if (m)
        return new Date(+m[3], +m[2] - 1, +m[1]);
      const m2 = s.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
      if (m2)
        return new Date(+m2[1], +m2[2] - 1, +m2[3]);
      return null;
    }, "parseData");
    const dNF = parseData(dtNF);
    const dEmp = parseData(dtEmp);
    if (dNF && dEmp && dNF < dEmp) {
      alertas.push({
        tipo: "NF_ANTERIOR_EMPENHO",
        descricao: "Nota Fiscal emitida antes do empenho (empenho a posteriori)",
        pontuacao: 20,
        detalhes: `NF: ${dtNF} | Empenho: ${dtEmp} | Fornecedor: ${campo(row, "fornecedor", "credor", "razao", "nome")} | Art. 60 Lei 4.320/64`
      });
    }
  }
  return alertas;
}
__name(regraNFAnteriorEmpenho, "regraNFAnteriorEmpenho");
function regraEmpSemDotacao(rows) {
  const alertas = [];
  for (const row of rows) {
    const dotacao = campo(row, "dotacao", "dota\xE7\xE3o", "classificacao", "funcional");
    const fonte = campo(row, "fonte", "fonte_recurso", "fr");
    const elemento = campo(row, "elemento", "natureza", "nd", "nat_despesa");
    const temCamposDotacao = Object.keys(row).some(
      (k) => k.includes("dotacao") || k.includes("dota\xE7\xE3o") || k.includes("elemento") || k.includes("natureza") || k.includes("fonte")
    );
    if (temCamposDotacao && !dotacao && !fonte && !elemento) {
      alertas.push({
        tipo: "EMPENHO_SEM_DOTACAO",
        descricao: "Empenho sem classifica\xE7\xE3o or\xE7ament\xE1ria identificada",
        pontuacao: 15,
        detalhes: `Registro: ${campo(row, "empenho", "numero", "nota", "id") || "N/D"} | Manual CGM \xA72.6 - Dota\xE7\xE3o or\xE7ament\xE1ria obrigat\xF3ria`
      });
    }
  }
  return alertas;
}
__name(regraEmpSemDotacao, "regraEmpSemDotacao");
function regraFracionamentoSubelemento(rows) {
  const alertas = [];
  const porSubelemento = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const sub = campo(row, "subelemento", "sub_elemento", "sub-elemento", "subelemento_despesa");
    if (!sub)
      continue;
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const fornecedor = campo(row, "cnpj", "cpf_cnpj", "fornecedor");
    const atual = porSubelemento.get(sub) || { valor: 0, count: 0, fornecedores: /* @__PURE__ */ new Set() };
    atual.valor += valor;
    atual.count++;
    if (fornecedor)
      atual.fornecedores.add(fornecedor);
    porSubelemento.set(sub, atual);
  }
  for (const [sub, info] of porSubelemento) {
    if (info.valor > LIMITE_DISPENSA_SERVICOS && info.fornecedores.size > 1) {
      alertas.push({
        tipo: "FRACIONAMENTO_SUBELEMENTO",
        descricao: "Poss\xEDvel fracionamento de despesa no mesmo subelemento (Res. TCE/SE 267/2011)",
        pontuacao: 20,
        detalhes: `Subelemento: ${sub} | ${info.count} empenhos | ${info.fornecedores.size} fornecedores | Total: R$ ${info.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Limite dispensa: R$ ${LIMITE_DISPENSA_SERVICOS.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      });
    }
  }
  return alertas;
}
__name(regraFracionamentoSubelemento, "regraFracionamentoSubelemento");
function regraOrdemCronologica(rows) {
  const alertas = [];
  const parseData = /* @__PURE__ */ __name((s) => {
    const m = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m)
      return new Date(+m[3], +m[2] - 1, +m[1]);
    const m2 = s.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (m2)
      return new Date(+m2[1], +m2[2] - 1, +m2[3]);
    return null;
  }, "parseData");
  const porFornecedor = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const fornecedor = campo(row, "cnpj", "cpf_cnpj", "fornecedor", "credor");
    const dtLiqStr = campo(row, "data_liquidacao", "dt_liquidacao", "liquidacao");
    const dtPagStr = campo(row, "data_pagamento", "dt_pagamento", "pagamento");
    if (!fornecedor || !dtLiqStr || !dtPagStr)
      continue;
    const dtLiq = parseData(dtLiqStr);
    const dtPag = parseData(dtPagStr);
    if (!dtLiq || !dtPag)
      continue;
    const lista = porFornecedor.get(fornecedor) || [];
    lista.push({ dtLiq, dtPag, empenho: campo(row, "empenho", "numero", "nota") });
    porFornecedor.set(fornecedor, lista);
  }
  for (const [fornecedor, itens] of porFornecedor) {
    if (itens.length < 2)
      continue;
    itens.sort((a, b) => a.dtLiq.getTime() - b.dtLiq.getTime());
    for (let i = 1; i < itens.length; i++) {
      if (itens[i].dtPag < itens[i - 1].dtPag) {
        alertas.push({
          tipo: "QUEBRA_ORDEM_CRONOLOGICA",
          descricao: "Pagamento fora da ordem cronol\xF3gica de liquida\xE7\xE3o (Art. 141 Lei 14.133/2021)",
          pontuacao: 15,
          detalhes: `Fornecedor: ${fornecedor} | Empenho ${itens[i].empenho} pago antes de ${itens[i - 1].empenho}`
        });
        break;
      }
    }
  }
  return alertas;
}
__name(regraOrdemCronologica, "regraOrdemCronologica");
function regraCnaeIncompativel(rows, dados) {
  const alertas = [];
  const verificados = /* @__PURE__ */ new Set();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (cnpj.length !== 14 || verificados.has(cnpj))
      continue;
    verificados.add(cnpj);
    const info = dados.get(cnpj);
    if (!info?.cnae_fiscal_descricao)
      continue;
    const objeto = campo(row, "objeto", "descricao", "historico", "item").toLowerCase();
    if (!objeto || objeto.length < 5)
      continue;
    const cnae = info.cnae_fiscal_descricao.toLowerCase();
    const categoriasObjeto = extrairCategorias(objeto);
    const categoriasCnae = extrairCategorias(cnae);
    if (categoriasObjeto.size > 0 && categoriasCnae.size > 0) {
      let temOverlap = false;
      for (const c of categoriasObjeto) {
        if (categoriasCnae.has(c)) {
          temOverlap = true;
          break;
        }
      }
      if (!temOverlap) {
        alertas.push({
          tipo: "CNAE_INCOMPATIVEL",
          descricao: "Objeto social (CNAE) possivelmente incompat\xEDvel com o objeto contratado",
          pontuacao: 10,
          detalhes: `CNPJ: ${cnpj} | ${info.razao_social} | CNAE: ${info.cnae_fiscal_descricao} | Objeto: ${objeto.substring(0, 80)}`
        });
      }
    }
  }
  return alertas;
}
__name(regraCnaeIncompativel, "regraCnaeIncompativel");
function extrairCategorias(texto) {
  const cats = /* @__PURE__ */ new Set();
  const mapa = {
    "construcao": ["obra", "constru", "reforma", "edifica", "engenharia", "pavimenta"],
    "alimentacao": ["aliment", "refei", "merenda", "comida", "lanch", "cafe"],
    "informatica": ["comput", "software", "sistema", "inform", "tecnologia", "rede", "ti "],
    "saude": ["saude", "sa\u251C\u2551de", "medic", "hospitalar", "farmac", "enferm"],
    "educacao": ["educa", "escol", "ensino", "pedagog", "didatic"],
    "limpeza": ["limpeza", "conserva", "higien", "asseio"],
    "transporte": ["transport", "veicul", "ve\u251C\xA1cul", "locomo", "combust", "frota"],
    "escritorio": ["escritorio", "papel", "material de expediente", "toner", "impressora"],
    "assessoria": ["assessor", "consultoria", "consult"],
    "comunicacao": ["comunica", "publicidade", "propaganda", "midiia"],
    "combustivel": ["combust", "gasolina", "diesel", "etanol", "abastec"],
    "locacao": ["aluguel", "loca\u251C\xBA\u251C\xFAo", "locacao"]
  };
  for (const [cat, termos] of Object.entries(mapa)) {
    for (const t of termos) {
      if (texto.includes(t)) {
        cats.add(cat);
        break;
      }
    }
  }
  return cats;
}
__name(extrairCategorias, "extrairCategorias");
function regraEmpresaRecenteCriada(rows, dados) {
  const alertas = [];
  const verificados = /* @__PURE__ */ new Set();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (cnpj.length !== 14 || verificados.has(cnpj))
      continue;
    verificados.add(cnpj);
    const info = dados.get(cnpj);
    if (!info?.data_inicio_atividade)
      continue;
    const dataEmp = campo(row, "data", "dt_empenho", "emissao");
    const m = dataEmp.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (!m)
      continue;
    const dtEmpenho = new Date(+m[3], +m[2] - 1, +m[1]);
    const dtAbertura = new Date(info.data_inicio_atividade);
    const meses = (dtEmpenho.getTime() - dtAbertura.getTime()) / (1e3 * 60 * 60 * 24 * 30);
    if (meses >= 0 && meses < 6) {
      alertas.push({
        tipo: "EMPRESA_RECEM_CRIADA",
        descricao: "Empresa com menos de 6 meses de atividade na data do empenho",
        pontuacao: 15,
        detalhes: `CNPJ: ${cnpj} | ${info.razao_social} | Abertura: ${info.data_inicio_atividade} | ${Math.floor(meses)} meses de atividade`
      });
    }
  }
  return alertas;
}
__name(regraEmpresaRecenteCriada, "regraEmpresaRecenteCriada");
function regraSituacaoIrregular(_rows, dados) {
  const alertas = [];
  for (const [cnpj, info] of dados) {
    if (!info.descricao_situacao_cadastral)
      continue;
    const situacao = info.descricao_situacao_cadastral.toUpperCase();
    if (situacao !== "ATIVA") {
      alertas.push({
        tipo: "SITUACAO_CADASTRAL_IRREGULAR",
        descricao: "Empresa com situa\xE7\xE3o cadastral irregular na Receita Federal",
        pontuacao: 25,
        detalhes: `CNPJ: ${cnpj} | ${info.razao_social} | Situa\xE7\xE3o: ${situacao}`
      });
    }
  }
  return alertas;
}
__name(regraSituacaoIrregular, "regraSituacaoIrregular");
function regraPorteIncompativel(rows, dados) {
  const alertas = [];
  const totalPorCnpj = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if (cnpj.length !== 14)
      continue;
    totalPorCnpj.set(cnpj, (totalPorCnpj.get(cnpj) ?? 0) + valor);
  }
  for (const [cnpj, total] of totalPorCnpj) {
    const info = dados.get(cnpj);
    if (!info)
      continue;
    const porte = (info.porte || "").toUpperCase();
    if ((porte.includes("MICRO") || porte === "01") && total > LIMITE_MEI) {
      alertas.push({
        tipo: "PORTE_INCOMPATIVEL",
        descricao: "Microempresa com valor contratado acima do limite anual de faturamento (LC 123/2006)",
        pontuacao: 10,
        detalhes: `CNPJ: ${cnpj} | ${info.razao_social} | Porte: ${info.porte || "Micro"} | Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Limite MEI: R$ ${LIMITE_MEI.toLocaleString("pt-BR")}`
      });
    }
  }
  return alertas;
}
__name(regraPorteIncompativel, "regraPorteIncompativel");
function regraSociosEmComum(_rows, dados) {
  const alertas = [];
  const socioPorEmpresa = /* @__PURE__ */ new Map();
  for (const [cnpj, info] of dados) {
    if (!info.qsa?.length)
      continue;
    for (const socio of info.qsa) {
      const nome = (socio.nome_socio || "").trim().toUpperCase();
      if (!nome || nome.length < 5)
        continue;
      const empresas = socioPorEmpresa.get(nome) ?? /* @__PURE__ */ new Set();
      empresas.add(cnpj);
      socioPorEmpresa.set(nome, empresas);
    }
  }
  const reportados = /* @__PURE__ */ new Set();
  for (const [nome, empresas] of socioPorEmpresa) {
    if (empresas.size < 2)
      continue;
    const key = [...empresas].sort().join("|");
    if (reportados.has(key))
      continue;
    reportados.add(key);
    const nomes = [...empresas].map((c) => dados.get(c)?.razao_social || c);
    alertas.push({
      tipo: "SOCIOS_EM_COMUM",
      descricao: "Fornecedores diferentes com s\xF3cios em comum",
      pontuacao: 20,
      detalhes: `S\xF3cio: ${nome} | Empresas: ${nomes.join(", ")}`
    });
  }
  return alertas;
}
__name(regraSociosEmComum, "regraSociosEmComum");
function regraCapitalSocialBaixo(rows, dados) {
  const alertas = [];
  const totalPorCnpj = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if (cnpj.length !== 14)
      continue;
    totalPorCnpj.set(cnpj, (totalPorCnpj.get(cnpj) ?? 0) + valor);
  }
  for (const [cnpj, total] of totalPorCnpj) {
    const info = dados.get(cnpj);
    if (!info || !info.capital_social || info.capital_social <= 0)
      continue;
    if (total > info.capital_social * 10) {
      alertas.push({
        tipo: "CAPITAL_SOCIAL_BAIXO",
        descricao: "Valor contratado desproporcional ao capital social da empresa",
        pontuacao: 10,
        detalhes: `CNPJ: ${cnpj} | ${info.razao_social} | Capital: R$ ${info.capital_social.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Contratado: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      });
    }
  }
  return alertas;
}
__name(regraCapitalSocialBaixo, "regraCapitalSocialBaixo");
function regraEmpresaSancionada(rows, sancionados) {
  if (sancionados.size === 0)
    return [];
  const alertas = [];
  const verificados = /* @__PURE__ */ new Set();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (cnpj.length !== 14 || verificados.has(cnpj))
      continue;
    verificados.add(cnpj);
    if (sancionados.has(cnpj)) {
      alertas.push({
        tipo: "EMPRESA_SANCIONADA",
        descricao: "Empresa consta no CEIS/CNEP (Cadastro de Inid\xF4neas/Suspensas/Punidas)",
        pontuacao: 30,
        detalhes: `CNPJ: ${cnpj} | Fornecedor: ${campo(row, "razao", "nome", "credor")}`
      });
    }
  }
  return alertas;
}
__name(regraEmpresaSancionada, "regraEmpresaSancionada");
function parseValorBR(s) {
  let limpo = s.replace(/[R$\s]/g, "").trim();
  if (/,\d{1,2}$/.test(limpo)) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/\.\d{1,2}$/.test(limpo)) {
    limpo = limpo.replace(/,/g, "");
  } else {
    limpo = limpo.replace(/[.,]/g, "");
  }
  const n = parseFloat(limpo);
  return isNaN(n) ? 0 : n;
}
__name(parseValorBR, "parseValorBR");
function parseTextoLivre(texto) {
  const cnpjSet = /* @__PURE__ */ new Set();
  const valores = [];
  const datas = [];
  const termos = [];
  const empenhos = [];
  const rows = [];
  const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-?\d{2}/g;
  for (const m of texto.matchAll(cnpjRegex)) {
    const limpo = m[0].replace(/\D/g, "");
    if (limpo.length === 14 && validarCnpj(limpo))
      cnpjSet.add(limpo);
  }
  const valorRegex = /R\$\s*[\d.,]+|\d{1,3}(?:\.\d{3})*,\d{2}/g;
  for (const m of texto.matchAll(valorRegex)) {
    const v = parseValorBR(m[0]);
    if (v > 0)
      valores.push(v);
  }
  const dataRegex = /\d{2}\/\d{2}\/\d{4}/g;
  for (const m of texto.matchAll(dataRegex))
    datas.push(m[0]);
  const empenhoRegex = /\d{4}NE\d{6}/gi;
  for (const m of texto.matchAll(empenhoRegex))
    empenhos.push(m[0]);
  const termosChave = [
    "dispensa",
    "inexigibilidade",
    "emergencial",
    "licita\xE7\xE3o",
    "preg\xE3o",
    "tomada de pre\xE7o",
    "convite",
    "concorr\xEAncia",
    "aditivo",
    "contrato",
    "empenho",
    "liquida\xE7\xE3o",
    "pagamento",
    "nota fiscal",
    "reembolso",
    "fracionamento",
    "sobrepre\xE7o",
    "superfaturamento",
    "dfd",
    "etp",
    "termo de refer\xEAncia",
    "projeto b\xE1sico",
    "matriz de risco",
    "certid\xE3o",
    "atesto",
    "fiscal de contrato",
    "gestor",
    "art ",
    "rrt",
    "cno",
    "alvar\xE1",
    "medi\xE7\xE3o",
    "di\xE1ria",
    "reten\xE7\xE3o",
    "ir ",
    "iss",
    "inss",
    "fgts",
    "darf",
    "gps",
    "ordem cronol\xF3gica"
  ];
  const textoLower = texto.toLowerCase();
  for (const t of termosChave) {
    if (textoLower.includes(t))
      termos.push(t);
  }
  for (const cnpj of cnpjSet) {
    const cnpjFormatado = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    const idx = texto.indexOf(cnpjFormatado) !== -1 ? texto.indexOf(cnpjFormatado) : texto.indexOf(cnpj);
    let valorAssociado = 0;
    let dataAssociada = "";
    let modalidade = "";
    if (idx !== -1) {
      const contexto = texto.substring(Math.max(0, idx - 300), Math.min(texto.length, idx + 500));
      const valorMatch = contexto.match(/R\$\s*([\d.,]+)/);
      if (valorMatch)
        valorAssociado = parseValorBR(valorMatch[0]);
      const dataMatch = contexto.match(/\d{2}\/\d{2}\/\d{4}/);
      if (dataMatch)
        dataAssociada = dataMatch[0];
      const modMatch = contexto.match(/\b(dispensa|inexigibilidade|preg[aã]o|tomada|convite|concorr[eê]ncia)\b/i);
      if (modMatch)
        modalidade = modMatch[1].toUpperCase();
    }
    const row = {
      cnpj_fornecedor: cnpj,
      valor: valorAssociado.toString(),
      data_empenho: dataAssociada,
      modalidade,
      objeto: "",
      razao_social: ""
    };
    rows.push(row);
  }
  return { cnpjs: [...cnpjSet], valores, datas, termos, empenhos, rows };
}
__name(parseTextoLivre, "parseTextoLivre");
function regrasTextoLivre(texto, dados) {
  const alertas = [];
  const textoLower = texto.toLowerCase();
  const termosRisco = [
    // Modalidades e contratação
    { termo: "dispensa de licita\xE7\xE3o", tipo: "MENCAO_DISPENSA", desc: "Documento menciona dispensa de licita\xE7\xE3o", pts: 5 },
    { termo: "inexigibilidade", tipo: "MENCAO_INEXIGIBILIDADE", desc: "Documento menciona inexigibilidade de licita\xE7\xE3o", pts: 5 },
    { termo: "emergencial", tipo: "MENCAO_EMERGENCIAL", desc: "Documento menciona contrata\xE7\xE3o emergencial", pts: 10 },
    { termo: "sem licita\xE7\xE3o", tipo: "MENCAO_SEM_LICITACAO", desc: "Documento menciona contrata\xE7\xE3o sem licita\xE7\xE3o", pts: 10 },
    { termo: "sigilo", tipo: "MENCAO_SIGILO", desc: "Documento menciona sigilo", pts: 10 },
    // Documentos obrigatórios (Manual §DFD/ETP/TR)
    { termo: "sem dfd", tipo: "AUSENCIA_DFD", desc: "Indica aus\xEAncia de Documento de Formaliza\xE7\xE3o da Demanda (DFD)", pts: 15 },
    { termo: "sem etp", tipo: "AUSENCIA_ETP", desc: "Indica aus\xEAncia de Estudo T\xE9cnico Preliminar (ETP)", pts: 15 },
    { termo: "sem termo de refer\xEAncia", tipo: "AUSENCIA_TR", desc: "Indica aus\xEAncia de Termo de Refer\xEAncia", pts: 15 },
    { termo: "sem projeto b\xE1sico", tipo: "AUSENCIA_PB", desc: "Indica aus\xEAncia de Projeto B\xE1sico", pts: 15 },
    // Empenho e liquidação (Manual §2.6, §2.8)
    { termo: "empenho a posteriori", tipo: "EMPENHO_POSTERIORI", desc: "Empenho emitido ap\xF3s execu\xE7\xE3o da despesa (Art. 60 Lei 4.320/64)", pts: 20 },
    { termo: "empenho posterior", tipo: "EMPENHO_POSTERIORI", desc: "Empenho emitido ap\xF3s execu\xE7\xE3o da despesa", pts: 20 },
    { termo: "sem empenho", tipo: "SEM_EMPENHO", desc: "Despesa realizada sem empenho pr\xE9vio", pts: 25 },
    { termo: "sem atesto", tipo: "SEM_ATESTO", desc: "Liquida\xE7\xE3o sem atesto do fiscal/respons\xE1vel (Manual \xA72.8)", pts: 15 },
    { termo: "sem fiscal", tipo: "SEM_FISCAL_CONTRATO", desc: "Contrato sem fiscal designado (Art. 117 Lei 14.133/2021)", pts: 15 },
    { termo: "sem gestor", tipo: "SEM_GESTOR_CONTRATO", desc: "Contrato sem gestor designado", pts: 10 },
    // Aditivos (Manual §2.5)
    { termo: "aditivo", tipo: "MENCAO_ADITIVO", desc: "Documento menciona aditivo contratual", pts: 5 },
    { termo: "termo aditivo", tipo: "MENCAO_ADITIVO", desc: "Documento menciona termo aditivo", pts: 5 },
    { termo: "acr\xE9scimo de 25%", tipo: "ADITIVO_LIMITE", desc: "Refer\xEAncia ao limite de 25% de acr\xE9scimo em aditivos (Art. 125 Lei 14.133)", pts: 10 },
    // Certidões (Manual Check Lists)
    { termo: "certid\xE3o vencida", tipo: "CERTIDAO_VENCIDA", desc: "Certid\xE3o com validade expirada", pts: 15 },
    { termo: "certid\xE3o negativa", tipo: "INFO_CERTIDAO", desc: "Documento menciona certid\xE3o negativa", pts: 0 },
    { termo: "cnd", tipo: "INFO_CERTIDAO", desc: "Refer\xEAncia a CND (Certid\xE3o Negativa de D\xE9bitos)", pts: 0 },
    // Retenções tributárias (Manual §2.9/§2.12)
    { termo: "sem reten\xE7\xE3o", tipo: "AUSENCIA_RETENCAO", desc: "Poss\xEDvel aus\xEAncia de reten\xE7\xE3o tribut\xE1ria obrigat\xF3ria", pts: 10 },
    { termo: "sem reten\xE7\xE3o de ir", tipo: "AUSENCIA_RETENCAO_IR", desc: "Aus\xEAncia de reten\xE7\xE3o de Imposto de Renda (IN RFB 1.234/2012)", pts: 15 },
    { termo: "sem reten\xE7\xE3o de iss", tipo: "AUSENCIA_RETENCAO_ISS", desc: "Aus\xEAncia de reten\xE7\xE3o de ISS", pts: 10 },
    { termo: "sem reten\xE7\xE3o previdenc", tipo: "AUSENCIA_RETENCAO_INSS", desc: "Aus\xEAncia de reten\xE7\xE3o previdenci\xE1ria (IN RFB 2.110/2022)", pts: 15 },
    // Ordem cronológica (Manual §2.9)
    { termo: "ordem cronol\xF3gica", tipo: "INFO_ORDEM_CRONOLOGICA", desc: "Refer\xEAncia \xE0 ordem cronol\xF3gica de pagamentos (Art. 141 Lei 14.133)", pts: 0 },
    { termo: "fora da ordem", tipo: "QUEBRA_ORDEM_CRONOLOGICA", desc: "Pagamento fora da ordem cronol\xF3gica", pts: 15 },
    // Cotação (Manual §2.4)
    { termo: "cota\xE7\xE3o \xFAnica", tipo: "COTACAO_INSUFICIENTE", desc: "Apenas uma cota\xE7\xE3o de pre\xE7os (m\xEDnimo 3 obrigat\xF3rio - IN SEGES/ME 65/2021)", pts: 15 },
    { termo: "pesquisa de pre\xE7o insuficiente", tipo: "COTACAO_INSUFICIENTE", desc: "Pesquisa de pre\xE7os insuficiente", pts: 15 },
    // Obras (Manual Check Lists)
    { termo: "sem art", tipo: "AUSENCIA_ART", desc: "Obra sem ART (Anota\xE7\xE3o de Responsabilidade T\xE9cnica)", pts: 15 },
    { termo: "sem rrt", tipo: "AUSENCIA_RRT", desc: "Obra sem RRT (Registro de Responsabilidade T\xE9cnica)", pts: 15 },
    { termo: "sem cno", tipo: "AUSENCIA_CNO", desc: "Obra sem CNO (Cadastro Nacional de Obras)", pts: 10 },
    { termo: "sem alvar\xE1", tipo: "AUSENCIA_ALVARA", desc: "Obra sem alvar\xE1 de constru\xE7\xE3o", pts: 15 },
    { termo: "sem medi\xE7\xE3o", tipo: "AUSENCIA_MEDICAO", desc: "Obra sem medi\xE7\xE3o/boletim de medi\xE7\xE3o", pts: 15 },
    // Diárias (Manual Check Lists)
    { termo: "sem relat\xF3rio de viagem", tipo: "AUSENCIA_RELATORIO_VIAGEM", desc: "Di\xE1ria sem relat\xF3rio de viagem (prazo: 5 dias \xFAteis)", pts: 10 },
    { termo: "di\xE1ria", tipo: "INFO_DIARIA", desc: "Documento menciona di\xE1rias", pts: 0 },
    // Fracionamento
    { termo: "fracionamento", tipo: "MENCAO_FRACIONAMENTO", desc: "Documento menciona fracionamento de despesa", pts: 10 },
    { termo: "sobrepre\xE7o", tipo: "MENCAO_SOBREPRECO", desc: "Documento menciona sobrepre\xE7o", pts: 15 },
    { termo: "superfaturamento", tipo: "MENCAO_SUPERFATURAMENTO", desc: "Documento menciona superfaturamento", pts: 15 },
    // Matriz de risco
    { termo: "sem matriz de risco", tipo: "AUSENCIA_MATRIZ_RISCO", desc: "Aus\xEAncia de Matriz de Risco (Art. 6\xBA, XXVII, Lei 14.133)", pts: 10 },
    // Controle patrimonial
    { termo: "sem tombamento", tipo: "AUSENCIA_TOMBAMENTO", desc: "Material permanente sem tombamento patrimonial", pts: 10 }
  ];
  const tiposJaAdicionados = /* @__PURE__ */ new Set();
  for (const tr of termosRisco) {
    if (tr.pts === 0)
      continue;
    if (tiposJaAdicionados.has(tr.tipo))
      continue;
    if (textoLower.includes(tr.termo)) {
      tiposJaAdicionados.add(tr.tipo);
      alertas.push({ tipo: tr.tipo, descricao: tr.desc, pontuacao: tr.pts });
    }
  }
  for (const v of dados.valores) {
    if (v > 5e5) {
      alertas.push({
        tipo: "VALOR_ELEVADO_DOCUMENTO",
        descricao: "Valor elevado encontrado no documento (acima de R$ 500 mil)",
        pontuacao: 5,
        detalhes: `Valor: R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      });
    }
  }
  if (textoLower.includes("dispensa") && (textoLower.includes("pequeno valor") || textoLower.includes("art. 75"))) {
    for (const v of dados.valores) {
      if (v > LIMITE_DISPENSA_PEQUENO_VALOR) {
        alertas.push({
          tipo: "DISPENSA_ACIMA_LIMITE",
          descricao: `Valor acima do limite de dispensa por pequeno valor (R$ ${LIMITE_DISPENSA_PEQUENO_VALOR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`,
          pontuacao: 20,
          detalhes: `Valor encontrado: R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Art. 75, II, Lei 14.133/2021`
        });
        break;
      }
    }
  }
  if (dados.datas.length >= 2 && dados.empenhos.length > 0) {
    const parseData = /* @__PURE__ */ __name((s) => {
      const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
    }, "parseData");
    const datesParsed = dados.datas.map((d) => ({ str: d, dt: parseData(d) })).filter((d) => d.dt !== null);
    if (datesParsed.length >= 2) {
      datesParsed.sort((a, b) => a.dt.getTime() - b.dt.getTime());
      const idxNF = textoLower.indexOf("nota fiscal");
      const idxEmp = textoLower.indexOf("empenho");
      if (idxNF !== -1 && idxEmp !== -1 && idxNF < idxEmp) {
        if (datesParsed[0].dt.getTime() < datesParsed[1].dt.getTime()) {
          alertas.push({
            tipo: "NF_ANTERIOR_EMPENHO_PDF",
            descricao: "Poss\xEDvel NF emitida antes do empenho detectada no documento (Art. 60 Lei 4.320/64)",
            pontuacao: 15,
            detalhes: `Data anterior: ${datesParsed[0].str} | Data posterior: ${datesParsed[1].str}`
          });
        }
      }
    }
  }
  return alertas;
}
__name(regrasTextoLivre, "regrasTextoLivre");
function nivelPorScore(score) {
  if (score <= 20)
    return "BAIXO";
  if (score <= 40)
    return "MEDIO";
  if (score <= 70)
    return "ALTO";
  return "CRITICO";
}
__name(nivelPorScore, "nivelPorScore");
async function analisarDocumento(input) {
  const alertas = [];
  let totalRegistros = 0;
  let valorTotal = 0;
  let textoExtraido;
  if (input.conteudo && (input.tipo.includes("csv") || input.tipo.includes("text"))) {
    const rows = parseCsv(input.conteudo);
    totalRegistros = rows.length;
    for (const row of rows) {
      valorTotal += valorNumerico(row, "valor", "vlr", "montante", "total");
    }
    alertas.push(
      ...regraValorInvalido(rows),
      ...regraDispensaSemLicitacao(rows),
      ...regraPagamentoDuplicado(rows),
      ...regraSuperfaturamento(rows),
      ...regraFracionamento(rows),
      ...regraConcentracaoFimAno(rows),
      ...regraCnpjInvalido(rows),
      ...regraConcentracaoFornecedor(rows),
      ...regraNFAnteriorEmpenho(rows),
      ...regraEmpSemDotacao(rows),
      ...regraFracionamentoSubelemento(rows),
      ...regraOrdemCronologica(rows)
    );
    const cnpjs = extrairCnpjsUnicos(rows);
    if (cnpjs.length > 0) {
      const [dadosCnpj, sancionados] = await Promise.all([
        consultarCnpjsBrasilApi(cnpjs),
        consultarSancoesCGU(cnpjs, input.apiKeyTransparencia)
      ]);
      alertas.push(
        ...regraEmpresaRecenteCriada(rows, dadosCnpj),
        ...regraSituacaoIrregular(rows, dadosCnpj),
        ...regraPorteIncompativel(rows, dadosCnpj),
        ...regraSociosEmComum(rows, dadosCnpj),
        ...regraCapitalSocialBaixo(rows, dadosCnpj),
        ...regraEmpresaSancionada(rows, sancionados),
        ...regraCnaeIncompativel(rows, dadosCnpj)
      );
    }
  } else if (input.conteudoPdf && input.tipo.includes("pdf")) {
    const { extrairTextoPdf: extrairTextoPdf2 } = await Promise.resolve().then(() => (init_pdf_extractor(), pdf_extractor_exports));
    textoExtraido = await extrairTextoPdf2(input.conteudoPdf);
    if (textoExtraido.trim().length > 0) {
      const dados = parseTextoLivre(textoExtraido);
      totalRegistros = dados.cnpjs.length || 1;
      valorTotal = dados.valores.reduce((s, v) => s + v, 0);
      alertas.push(...regrasTextoLivre(textoExtraido, dados));
      if (dados.rows.length > 0) {
        alertas.push(
          ...regraCnpjInvalido(dados.rows),
          ...regraDispensaSemLicitacao(dados.rows)
        );
        if (dados.cnpjs.length > 0) {
          const [dadosCnpj, sancionados] = await Promise.all([
            consultarCnpjsBrasilApi(dados.cnpjs),
            consultarSancoesCGU(dados.cnpjs, input.apiKeyTransparencia)
          ]);
          alertas.push(
            ...regraEmpresaRecenteCriada(dados.rows, dadosCnpj),
            ...regraSituacaoIrregular(dados.rows, dadosCnpj),
            ...regraPorteIncompativel(dados.rows, dadosCnpj),
            ...regraSociosEmComum(dados.rows, dadosCnpj),
            ...regraCapitalSocialBaixo(dados.rows, dadosCnpj),
            ...regraEmpresaSancionada(dados.rows, sancionados),
            ...regraCnaeIncompativel(dados.rows, dadosCnpj)
          );
        }
      }
    }
  }
  if (alertas.length === 0 && totalRegistros === 0) {
    const nome = input.nomeArquivo.toLowerCase();
    if (nome.includes("dispensa") || nome.includes("emergencial")) {
      alertas.push({ tipo: "CONTRATO_SEM_LICITACAO", descricao: "Documento menciona dispensa/emergencial no nome", pontuacao: 10 });
    }
    if (nome.includes("aditivo")) {
      alertas.push({ tipo: "VALOR_ACIMA_LIMITE", descricao: "Documento de aditivo contratual", pontuacao: 10 });
    }
  }
  const score = Math.min(100, alertas.reduce((t, a) => t + a.pontuacao, 0));
  return {
    score,
    nivel: nivelPorScore(score),
    alertas,
    resumo: {
      totalRegistros,
      valorTotal,
      registrosAnalisados: totalRegistros,
      ...textoExtraido ? { textoExtraido: textoExtraido.substring(0, 5e3) } : {}
    }
  };
}
__name(analisarDocumento, "analisarDocumento");

// worker/src/routes/upload.ts
async function uploadRoute(request, env, username) {
  if (request.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });
  const body = await request.formData();
  const file = body.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Arquivo n\xE3o enviado" }, { status: 400 });
  }
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ ok: false, message: "Arquivo excede o tamanho m\xE1ximo de 50MB" }, { status: 400 });
  }
  const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv", "application/xml", "text/xml"];
  const fileType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.includes(fileType)) {
    return Response.json({ ok: false, message: "Tipo de arquivo n\xE3o permitido" }, { status: 400 });
  }
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const key = `documentos/${username}/${timestamp}/${sanitizedName}`;
  try {
    await salvarArquivo(env.BUCKET, key, file);
    let conteudo;
    let conteudoPdf;
    const tiposTexto = ["text/csv", "application/xml", "text/xml", "text/plain"];
    if (tiposTexto.some((t) => fileType.includes(t)) || file.name.endsWith(".csv")) {
      conteudo = await file.text();
    } else if (fileType.includes("pdf") || file.name.endsWith(".pdf")) {
      conteudoPdf = await file.arrayBuffer();
    }
    const resultado = await analisarDocumento({ nomeArquivo: file.name, tipo: fileType, tamanho: file.size, conteudo, conteudoPdf });
    const insert = await env.DB.prepare(
      `INSERT INTO documentos (nome_arquivo, tipo, tamanho, data_upload, status, score, nivel, alertas, r2_key, usuario)
         VALUES (?, ?, ?, datetime('now'), 'concluido', ?, ?, ?, ?, ?)`
    ).bind(sanitizedName, fileType, file.size, resultado.score, resultado.nivel, JSON.stringify({ alertas: resultado.alertas, resumo: resultado.resumo }), key, username).run();
    return Response.json({
      ok: true,
      documentoId: insert.meta.last_row_id,
      arquivo: sanitizedName,
      resultado
    });
  } catch (err) {
    try {
      await deletarArquivo(env.BUCKET, key);
    } catch {
    }
    return Response.json({ ok: false, message: "Erro ao processar upload" }, { status: 500 });
  }
}
__name(uploadRoute, "uploadRoute");

// worker/src/routes/reanalise.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function reanaliseRoute(env, username, id) {
  const doc = await env.DB.prepare("SELECT * FROM documentos WHERE id = ? AND usuario = ?").bind(id, username).first();
  if (!doc) {
    return Response.json({ ok: false, message: "Documento n\xE3o encontrado" }, { status: 404 });
  }
  const obj = await env.BUCKET.get(doc.r2_key);
  if (!obj) {
    return Response.json({ ok: false, message: "Arquivo n\xE3o encontrado no storage" }, { status: 404 });
  }
  let conteudo;
  let conteudoPdf;
  const tipo = doc.tipo || "";
  if (tipo.includes("csv") || tipo.includes("text") || doc.nome_arquivo.endsWith(".csv")) {
    conteudo = await obj.text();
  } else if (tipo.includes("pdf") || doc.nome_arquivo.endsWith(".pdf")) {
    conteudoPdf = await obj.arrayBuffer();
  }
  const resultado = await analisarDocumento({
    nomeArquivo: doc.nome_arquivo,
    tipo,
    tamanho: doc.tamanho,
    conteudo,
    conteudoPdf
  });
  await env.DB.prepare("UPDATE documentos SET score = ?, nivel = ?, alertas = ?, status = 'concluido' WHERE id = ?").bind(resultado.score, resultado.nivel, JSON.stringify({ alertas: resultado.alertas, resumo: resultado.resumo }), id).run();
  return Response.json({ ok: true, resultado });
}
__name(reanaliseRoute, "reanaliseRoute");

// worker/src/index.ts
function isPublicPath(pathname) {
  return pathname === "/login" || pathname === "/login.html" || pathname === "/" || pathname === "/index.html" || pathname.startsWith("/assets/") || pathname.startsWith("/img/");
}
__name(isPublicPath, "isPublicPath");
async function getUserFromRequest(request, env) {
  const token = readSessionToken(request);
  if (!token)
    return null;
  const payload = await verifyToken(token, env.JWT_SECRET);
  return payload?.sub ?? null;
}
__name(getUserFromRequest, "getUserFromRequest");
async function serveStatic(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/") {
    return Response.redirect(`${url.origin}/login`, 302);
  }
  if (env.ASSETS) {
    return env.ASSETS.fetch(request);
  }
  return new Response("Static assets binding n\xE3o configurado.", { status: 500 });
}
__name(serveStatic, "serveStatic");
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === "/login") {
      if (request.method === "GET")
        return serveStatic(new Request(`${url.origin}/login.html`, request), env);
      if (request.method === "POST")
        return loginRoute(request, env);
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (pathname === "/api/login" && request.method === "POST") {
      return loginRoute(request, env);
    }
    if (pathname === "/logout")
      return logoutRoute();
    const username = await getUserFromRequest(request, env);
    const isApi = pathname.startsWith("/api/");
    if (!username && !isPublicPath(pathname)) {
      if (isApi)
        return Response.json({ ok: false, message: "N\xE3o autenticado" }, { status: 401 });
      return Response.redirect(`${url.origin}/login`, 302);
    }
    if (isApi && !username) {
      return Response.json({ ok: false, message: "N\xE3o autenticado" }, { status: 401 });
    }
    const authUser = username ?? "";
    if (pathname === "/api/upload")
      return uploadRoute(request, env, authUser);
    if (pathname === "/api/dashboard")
      return dashboardRoute(env, authUser);
    if (pathname === "/api/documentos" && request.method === "GET")
      return listDocumentosRoute(request, env, authUser);
    const docMatch = pathname.match(/^\/api\/documentos\/(\d+)$/);
    if (docMatch) {
      const id = Number(docMatch[1]);
      if (request.method === "GET")
        return getDocumentoRoute(env, authUser, id);
      if (request.method === "DELETE")
        return deleteDocumentoRoute(env, authUser, id);
    }
    const downloadMatch = pathname.match(/^\/api\/documentos\/(\d+)\/download$/);
    if (downloadMatch && request.method === "GET") {
      return downloadDocumentoRoute(request, env, authUser, Number(downloadMatch[1]));
    }
    const reanaliseMatch = pathname.match(/^\/api\/documentos\/(\d+)\/reanalisar$/);
    if (reanaliseMatch && request.method === "POST") {
      return reanaliseRoute(env, authUser, Number(reanaliseMatch[1]));
    }
    return serveStatic(request, env);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-NYVqgT/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-NYVqgT/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
