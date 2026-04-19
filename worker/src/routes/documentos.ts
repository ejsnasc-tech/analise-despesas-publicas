import { getDocumentoById, listDocumentos } from "../db";
import { deletarArquivo, getArquivo } from "../r2";

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

function parseAlertasData(alertas: string | null): { alertas: unknown[]; resumo?: unknown } {
  if (!alertas) return { alertas: [] };
  try {
    const parsed = JSON.parse(alertas);
    if (Array.isArray(parsed)) return { alertas: parsed };
    if (parsed && Array.isArray(parsed.alertas)) return { alertas: parsed.alertas, resumo: parsed.resumo };
    return { alertas: [] };
  } catch {
    return { alertas: [] };
  }
}

export async function listDocumentosRoute(request: Request, env: Env, username: string): Promise<Response> {
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

export async function getDocumentoRoute(env: Env, username: string, id: number): Promise<Response> {
  const doc = await getDocumentoById(env.DB, id, username);
  if (!doc) return Response.json({ ok: false, message: "Documento não encontrado" }, { status: 404 });

  const data = parseAlertasData(doc.alertas);
  return Response.json({ ...doc, alertas: data.alertas, resumo: data.resumo });
}

export async function deleteDocumentoRoute(env: Env, username: string, id: number): Promise<Response> {
  const doc = await getDocumentoById(env.DB, id, username);
  if (!doc) return Response.json({ ok: false, message: "Documento não encontrado" }, { status: 404 });

  await deletarArquivo(env.BUCKET, doc.r2_key);
  await env.DB.prepare("DELETE FROM documentos WHERE id = ? AND usuario = ?").bind(id, username).run();

  return Response.json({ ok: true });
}

export async function downloadDocumentoRoute(request: Request, env: Env, username: string, id: number): Promise<Response> {
  const doc = await getDocumentoById(env.DB, id, username);
  if (!doc) return Response.json({ ok: false, message: "Documento não encontrado" }, { status: 404 });

  const url = new URL(request.url);
  const direct = url.searchParams.get("direct") === "1";

  if (!direct) {
    return Response.json({ downloadUrl: `${new URL(request.url).origin}/api/documentos/${id}/download?direct=1`, expiresIn: 600 });
  }

  const obj = await getArquivo(env.BUCKET, doc.r2_key);
  if (!obj) return Response.json({ ok: false, message: "Arquivo não encontrado no storage" }, { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType || "application/octet-stream");
  const safeName = doc.nome_arquivo.replace(/["\r\n]/g, "_");
  headers.set("Content-Disposition", `attachment; filename="${safeName}"`);
  return new Response(obj.body, { headers });
}
