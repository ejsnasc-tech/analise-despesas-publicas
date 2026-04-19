import { analisarDocumento } from "../analise";
import { salvarArquivo } from "../r2";

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

export async function uploadRoute(request: Request, env: Env, username: string): Promise<Response> {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const body = await request.formData();
  const file = body.get("file");

  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Arquivo não enviado" }, { status: 400 });
  }

  const timestamp = Date.now();
  const key = `documentos/${username}/${timestamp}/${file.name}`;
  await salvarArquivo(env.BUCKET, key, file);

  const resultado = analisarDocumento({ nomeArquivo: file.name, tipo: file.type || "application/octet-stream", tamanho: file.size });

  const insert = await env.DB
    .prepare(
      `INSERT INTO documentos (nome_arquivo, tipo, tamanho, data_upload, status, score, nivel, alertas, r2_key, usuario)
       VALUES (?, ?, ?, datetime('now'), 'concluido', ?, ?, ?, ?, ?)`
    )
    .bind(file.name, file.type || "application/octet-stream", file.size, resultado.score, resultado.nivel, JSON.stringify(resultado.alertas), key, username)
    .run();

  return Response.json({
    ok: true,
    documentoId: insert.meta.last_row_id,
    arquivo: file.name,
    resultado
  });
}
