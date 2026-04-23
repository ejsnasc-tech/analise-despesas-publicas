import { analisarDocumento, analisarImagem } from "../analise";

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI?: Ai;
}

export async function reanaliseRoute(env: Env, username: string, id: number): Promise<Response> {
  const doc = await env.DB
    .prepare("SELECT * FROM documentos WHERE id = ? AND usuario = ?")
    .bind(id, username)
    .first<{ id: number; nome_arquivo: string; tipo: string; tamanho: number; r2_key: string }>();

  if (!doc) {
    return Response.json({ ok: false, message: "Documento não encontrado" }, { status: 404 });
  }

  const obj = await env.BUCKET.get(doc.r2_key);
  if (!obj) {
    return Response.json({ ok: false, message: "Arquivo não encontrado no storage" }, { status: 404 });
  }

  let conteudo: string | undefined;
  let conteudoPdf: ArrayBuffer | undefined;
  const tipo = doc.tipo || "";
  const nomeExt = doc.nome_arquivo.split(".").pop()?.toLowerCase() ?? "";
  const EXTS_IMAGEM = ["jpg", "jpeg", "png", "webp", "tiff", "tif", "bmp"];
  const isImagem = tipo.startsWith("image/") || EXTS_IMAGEM.includes(nomeExt);

  let resultado;
  if (isImagem) {
    const conteudoImagem = await obj.arrayBuffer();
    resultado = await analisarImagem({ nomeArquivo: doc.nome_arquivo, tipo, tamanho: doc.tamanho, conteudoImagem, db: env.DB, ai: env.AI });
  } else if (tipo.includes("csv") || tipo.includes("text") || doc.nome_arquivo.endsWith(".csv")) {
    conteudo = await obj.text();
    resultado = await analisarDocumento({ nomeArquivo: doc.nome_arquivo, tipo, tamanho: doc.tamanho, conteudo, db: env.DB, ai: env.AI });
  } else if (tipo.includes("pdf") || doc.nome_arquivo.endsWith(".pdf")) {
    conteudoPdf = await obj.arrayBuffer();
    resultado = await analisarDocumento({ nomeArquivo: doc.nome_arquivo, tipo, tamanho: doc.tamanho, conteudoPdf, db: env.DB, ai: env.AI });
  } else {
    resultado = await analisarDocumento({ nomeArquivo: doc.nome_arquivo, tipo, tamanho: doc.tamanho, conteudo: "", db: env.DB, ai: env.AI });
  }

  await env.DB
    .prepare("UPDATE documentos SET score = ?, nivel = ?, alertas = ?, status = 'concluido' WHERE id = ?")
    .bind(resultado.score, resultado.nivel, JSON.stringify({ alertas: resultado.alertas, resumo: resultado.resumo, detalhesExtraidos: resultado.detalhesExtraidos }), id)
    .run();

  return Response.json({ ok: true, resultado });
}
