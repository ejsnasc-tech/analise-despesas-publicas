import { analisarDocumento, analisarImagem } from "../analise";
import { deletarArquivo, salvarArquivo } from "../r2";

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI?: Ai;
}

export async function uploadRoute(request: Request, env: Env, username: string): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const body = await request.formData();
  const file = body.get("file");

  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Arquivo não enviado" }, { status: 400 });
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ ok: false, message: "Arquivo excede o tamanho máximo de 50MB" }, { status: 400 });
  }

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
    "application/xml",
    "text/xml",
    // Imagens para OCR
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/bmp",
  ];
  const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".xlsx", ".xml", ".json", ".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".bmp"];
  const fileExt = ("." + file.name.split(".").pop()!.toLowerCase()) as string;
  const fileType = file.type || "application/octet-stream";
  const isImage = fileType.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif", ".bmp"].includes(fileExt);

  if (!ALLOWED_TYPES.includes(fileType) && !ALLOWED_EXTENSIONS.includes(fileExt)) {
    return Response.json({ ok: false, message: "Tipo de arquivo não permitido. Aceitos: PDF, CSV, XLSX, XML, JPG, PNG, WEBP, TIFF" }, { status: 400 });
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const key = `documentos/${username}/${timestamp}/${sanitizedName}`;

  try {
    await salvarArquivo(env.BUCKET, key, file);

    let conteudo: string | undefined;
    let conteudoPdf: ArrayBuffer | undefined;
    let resultado;
    const tiposTexto = ["text/csv", "application/xml", "text/xml", "text/plain"];

    if (isImage) {
      // Imagem → OCR via Workers AI
      const conteudoImagem = await file.arrayBuffer();
      resultado = await analisarImagem({ nomeArquivo: file.name, tipo: fileType, tamanho: file.size, conteudoImagem, db: env.DB, ai: env.AI });
    } else if (tiposTexto.some((t) => fileType.includes(t)) || file.name.endsWith(".csv")) {
      conteudo = await file.text();
      resultado = await analisarDocumento({ nomeArquivo: file.name, tipo: fileType, tamanho: file.size, conteudo, db: env.DB, ai: env.AI });
    } else if (fileType.includes("pdf") || file.name.endsWith(".pdf")) {
      conteudoPdf = await file.arrayBuffer();
      resultado = await analisarDocumento({ nomeArquivo: file.name, tipo: fileType, tamanho: file.size, conteudoPdf, db: env.DB, ai: env.AI });
    } else {
      resultado = await analisarDocumento({ nomeArquivo: file.name, tipo: fileType, tamanho: file.size, conteudo: "", db: env.DB, ai: env.AI });
    }

    const insert = await env.DB
      .prepare(
        `INSERT INTO documentos (nome_arquivo, tipo, tamanho, data_upload, status, score, nivel, alertas, r2_key, usuario)
         VALUES (?, ?, ?, datetime('now'), 'concluido', ?, ?, ?, ?, ?)`
      )
      .bind(sanitizedName, fileType, file.size, resultado.score, resultado.nivel, JSON.stringify({ alertas: resultado.alertas, resumo: resultado.resumo, detalhesExtraidos: resultado.detalhesExtraidos }), key, username)
      .run();

    return Response.json({
      ok: true,
      documentoId: insert.meta.last_row_id,
      arquivo: sanitizedName,
      resultado
    });
  } catch (err) {
    try { await deletarArquivo(env.BUCKET, key); } catch { /* cleanup best effort */ }
    return Response.json({ ok: false, message: "Erro ao processar upload" }, { status: 500 });
  }
}
