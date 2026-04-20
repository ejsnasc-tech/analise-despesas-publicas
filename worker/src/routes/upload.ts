import { analisarDocumento } from "../analise";
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

  const ALLOWED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv", "application/xml", "text/xml"];
  const fileType = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.includes(fileType)) {
    return Response.json({ ok: false, message: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const key = `documentos/${username}/${timestamp}/${sanitizedName}`;

  try {
    await salvarArquivo(env.BUCKET, key, file);

    let conteudo: string | undefined;
    let conteudoPdf: ArrayBuffer | undefined;
    const tiposTexto = ["text/csv", "application/xml", "text/xml", "text/plain"];
    if (tiposTexto.some((t) => fileType.includes(t)) || file.name.endsWith(".csv")) {
      conteudo = await file.text();
    } else if (fileType.includes("pdf") || file.name.endsWith(".pdf")) {
      conteudoPdf = await file.arrayBuffer();
    }

    const resultado = await analisarDocumento({ nomeArquivo: file.name, tipo: fileType, tamanho: file.size, conteudo, conteudoPdf, db: env.DB, ai: env.AI });

    const insert = await env.DB
      .prepare(
        `INSERT INTO documentos (nome_arquivo, tipo, tamanho, data_upload, status, score, nivel, alertas, r2_key, usuario)
         VALUES (?, ?, ?, datetime('now'), 'concluido', ?, ?, ?, ?, ?)`
      )
      .bind(sanitizedName, fileType, file.size, resultado.score, resultado.nivel, JSON.stringify({ alertas: resultado.alertas, resumo: resultado.resumo }), key, username)
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
