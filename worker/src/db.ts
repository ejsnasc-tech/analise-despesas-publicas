export interface Documento {
  id: number;
  nome_arquivo: string;
  tipo: string;
  tamanho: number;
  data_upload: string;
  status: string;
  score: number;
  nivel: "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
  alertas: string;
  r2_key: string;
  usuario: string;
}

export async function getDocumentoById(db: D1Database, id: number, usuario: string): Promise<Documento | null> {
  const row = await db
    .prepare("SELECT * FROM documentos WHERE id = ? AND usuario = ? LIMIT 1")
    .bind(id, usuario)
    .first<Documento>();
  return row ?? null;
}

export async function listDocumentos(
  db: D1Database,
  usuario: string,
  filters: { status?: string | null; tipo?: string | null; busca?: string | null; page: number; perPage: number }
): Promise<{ items: Documento[]; total: number; page: number; perPage: number }> {
  const clauses = ["usuario = ?"];
  const params: unknown[] = [usuario];

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
  const totalRow = await db.prepare(`SELECT COUNT(*) as total FROM documentos WHERE ${where}`).bind(...params).first<{ total: number }>();

  const offset = (filters.page - 1) * filters.perPage;
  const items = await db
    .prepare(`SELECT * FROM documentos WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .bind(...params, filters.perPage, offset)
    .all<Documento>();

  return {
    items: items.results ?? [],
    total: totalRow?.total ?? 0,
    page: filters.page,
    perPage: filters.perPage
  };
}

export async function getDashboardStats(db: D1Database, usuario: string) {
  const total = await db
    .prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ?")
    .bind(usuario)
    .first<{ total: number }>();
  const alertas = await db
    .prepare("SELECT COALESCE(SUM(json_array_length(alertas)), 0) total FROM documentos WHERE usuario = ?")
    .bind(usuario)
    .first<{ total: number }>();
  const semIrregularidades = await db
    .prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ? AND score = 0")
    .bind(usuario)
    .first<{ total: number }>();
  const comIrregularidades = await db
    .prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ? AND score > 0")
    .bind(usuario)
    .first<{ total: number }>();
  const emAnalise = await db
    .prepare("SELECT COUNT(*) total FROM documentos WHERE usuario = ? AND status = 'analisando'")
    .bind(usuario)
    .first<{ total: number }>();
  const recentes = await db
    .prepare("SELECT id, nome_arquivo, status, score, nivel, data_upload FROM documentos WHERE usuario = ? ORDER BY id DESC LIMIT 5")
    .bind(usuario)
    .all();

  return {
    totalDocumentos: total?.total ?? 0,
    totalAlertas: alertas?.total ?? 0,
    documentosSemIrregularidades: semIrregularidades?.total ?? 0,
    documentosComIrregularidades: comIrregularidades?.total ?? 0,
    documentosEmAnalise: emAnalise?.total ?? 0,
    recentes: recentes.results ?? []
  };
}
