export interface Alerta {
  tipo: string;
  descricao: string;
  pontuacao: number;
  detalhes?: string;
  fundamentacao?: string; // Lei, artigo, decreto, portaria, etc
}

export interface RegistroEmpenho {
  [key: string]: string;
}

export interface ResultadoAnalise {
  score: number;
  nivel: "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
  alertas: Alerta[];
  resumo: {
    totalRegistros: number;
    valorTotal: number;
    registrosAnalisados: number;
    textoExtraido?: string;
    totalPaginas?: number;
    paginas?: { pagina: number; texto: string }[];
  };
  detalhesExtraidos?: {
    cnpjs?: Array<{
      cnpj: string;
      razao_social?: string;
      situacao?: string;
      data_abertura?: string;
      porte?: string;
      natureza_juridica?: string;
      capital_social?: number;
      cnae_principal?: string;
      socios?: Array<{ nome: string; qualificacao: string }>;
    }>;
    valores?: number[];
    datas?: string[];
    empenhos?: string[];
    nds?: string[];
    termos?: string[];
  };
}

/* ── Limites legais (Lei 14.133/2021, art. 75) ──────────────────── */
const LIMITE_DISPENSA_SERVICOS = 59906.02;   // Art. 75, II – atualizado Decreto 12.343/2024
const LIMITE_DISPENSA_OBRAS = 119812.03;     // Art. 75, I – atualizado Decreto 12.343/2024
const LIMITE_DISPENSA_PEQUENO_VALOR = 59906.02;
const ZSCORE_THRESHOLD = 3.0;
const JANELA_FRACIONAMENTO_DIAS = 30;
const LIMITE_MEI = 81000;

/* ── Classificação de Natureza da Despesa / Subelemento ─────────
 *  Portaria STN nº 448/2002 + Resolução TCE/SE nº 267/2011
 *  Formato: CDMMEESS  (Cat.Grupo.Mod.Elemento.Subelemento)
 *  Exemplo: 31901101 = 3.1.90.11.01 = Vencimento servidor efetivo
 * ─────────────────────────────────────────────────────────────── */

type VinculoServidor = "EFETIVO" | "COMISSIONADO" | "TEMPORARIO" | "TODOS";

interface ClassificacaoDespesa {
  codigo: string;       // Elemento (6 dígitos) ou Elemento+Sub (8 dígitos)
  descricao: string;
  vinculos: VinculoServidor[];
}

interface RegraClassificacaoDB {
  tipo_ato: string;
  vinculo_servidor: string;
  codigo_completo: string;
  descricao: string;
  fundamentacao: string;
}

/**
 * Tabela de classificação da despesa de pessoal conforme
 * Portaria STN 448/2002 e Resolução TCE/SE 267/2011.
 * Cada entrada mapeia um código de natureza/subelemento aos vínculos válidos.
 */
const CLASSIFICACAO_PESSOAL: ClassificacaoDespesa[] = [
  // ── 3.1.90.04 – Contratação por Tempo Determinado ──────────────
  { codigo: "319004",   descricao: "Contratação por Tempo Determinado",          vinculos: ["TEMPORARIO"] },
  { codigo: "31900401", descricao: "Contratação por Tempo Determinado",          vinculos: ["TEMPORARIO"] },

  // ── 3.1.90.11 – Vencimentos e Vantagens Fixas – Pessoal Civil ──
  { codigo: "319011",   descricao: "Vencimentos e Vantagens Fixas",              vinculos: ["EFETIVO", "COMISSIONADO"] },
  { codigo: "31901101", descricao: "Vencimento",                                 vinculos: ["EFETIVO"] },
  { codigo: "31901102", descricao: "Soldo",                                      vinculos: ["EFETIVO"] },
  { codigo: "31901103", descricao: "Subsídio",                                   vinculos: ["COMISSIONADO", "EFETIVO"] },
  { codigo: "31901113", descricao: "Gratificação por exercício de cargo",         vinculos: ["COMISSIONADO"] },
  { codigo: "31901122", descricao: "Gratificação de tempo de serviço",            vinculos: ["EFETIVO"] },
  { codigo: "31901130", descricao: "Vencimentos de cargo em comissão",            vinculos: ["COMISSIONADO"] },
  { codigo: "31901134", descricao: "Gratificação natalina (13º)",                 vinculos: ["EFETIVO", "COMISSIONADO"] },
  { codigo: "31901140", descricao: "Salário-família",                             vinculos: ["EFETIVO"] },
  { codigo: "31901141", descricao: "Férias – abono constitucional",               vinculos: ["EFETIVO", "COMISSIONADO"] },
  { codigo: "31901144", descricao: "Férias indenizadas",                          vinculos: ["EFETIVO", "COMISSIONADO"] },
  { codigo: "31901146", descricao: "Auxílio-alimentação",                         vinculos: ["EFETIVO", "COMISSIONADO"] },
  { codigo: "31901199", descricao: "Outras vantagens fixas – pessoal civil",      vinculos: ["EFETIVO"] },

  // ── 3.1.90.13 – Obrigações Patronais ───────────────────────────
  { codigo: "319013",   descricao: "Obrigações Patronais",                       vinculos: ["EFETIVO", "COMISSIONADO", "TEMPORARIO"] },

  // ── 3.1.90.16 – Outras Despesas Variáveis – Pessoal Civil ─────
  { codigo: "319016",   descricao: "Outras Despesas Variáveis – Pessoal Civil",  vinculos: ["EFETIVO"] },
  { codigo: "31901601", descricao: "Horas-extras",                               vinculos: ["EFETIVO"] },

  // ── 3.1.90.91 – Sentenças Judiciais ───────────────────────────
  { codigo: "319091",   descricao: "Sentenças Judiciais",                        vinculos: ["EFETIVO", "COMISSIONADO", "TEMPORARIO"] },

  // ── 3.1.90.92 – Despesas de Exercícios Anteriores ─────────────
  { codigo: "319092",   descricao: "Despesas de Exercícios Anteriores",          vinculos: ["EFETIVO", "COMISSIONADO", "TEMPORARIO"] },

  // ── 3.1.90.94 – Indenizações e Restituições Trabalhistas ──────
  { codigo: "319094",   descricao: "Indenizações e Restituições Trabalhistas",   vinculos: ["EFETIVO"] },
  { codigo: "31909401", descricao: "Indenizações Trabalhistas – servidor efetivo", vinculos: ["EFETIVO"] },

  // ── 3.1.91.13 – Obrigações Patronais – Intra-OFSS ─────────────
  { codigo: "319113",   descricao: "Obrigações Patronais – Intra-OFSS (RPPS)",   vinculos: ["EFETIVO"] },

  // ── 3.1.90.96 – Ressarcimento de Desp. de Pessoal Requisitado ─
  { codigo: "319096",   descricao: "Ressarcimento de Pessoal Requisitado",       vinculos: ["EFETIVO"] },
];

/* ── Parser CSV simples ─────────────────────────────────────────── */
function parseCsv(text: string): RegistroEmpenho[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const separador = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separador).map((h) => h.trim().toLowerCase().replace(/["\u00EF\u00BB\u00BF]/g, ""));
  const rows: RegistroEmpenho[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separador).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2) continue;
    const row: RegistroEmpenho = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

/* ── Normalizar nome de campo ──────────────────────────────────── */
function campo(row: RegistroEmpenho, ...nomes: string[]): string {
  for (const n of nomes) {
    const chave = Object.keys(row).find((k) => k.includes(n));
    if (chave && row[chave]) return row[chave];
  }
  return "";
}

function valorNumerico(row: RegistroEmpenho, ...nomes: string[]): number {
  const raw = campo(row, ...nomes);
  if (!raw) return 0;
  let limpo = raw.replace(/[R$\s]/g, "").trim();

  // Detecta formato: se tem vírgula como decimal (ex: 1.234,56) → formato BR
  // Se tem ponto como decimal (ex: 1,234.56 ou 7500.00) → formato EN
  if (/,\d{1,2}$/.test(limpo)) {
    // Formato BR: 1.234,56 → remove pontos, troca vírgula por ponto
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/\.\d{1,2}$/.test(limpo)) {
    // Formato EN: 1,234.56 ou 7500.00 → remove vírgulas
    limpo = limpo.replace(/,/g, "");
  } else {
    // Sem decimais: remove pontos e vírgulas de milhar
    limpo = limpo.replace(/[.,]/g, "");
  }

  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

/* ── CNPJ – Utilitários ─────────────────────────────────────────── */
function limparCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

function validarCnpj(cnpj: string): boolean {
  const d = limparCnpj(cnpj);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (pesos: number[]): number => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += parseInt(d[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (d1 !== parseInt(d[12])) return false;
  const d2 = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d2 === parseInt(d[13]);
}

function extrairCnpjsUnicos(rows: RegistroEmpenho[]): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    const limpo = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (limpo.length === 14) set.add(limpo);
  }
  return [...set];
}

/* ── Consulta de CNPJs via APIs públicas ────────────────────────── */
interface DadosCnpj {
  razao_social: string;
  descricao_situacao_cadastral: string;
  data_inicio_atividade: string;
  porte: string;
  natureza_juridica: string;
  capital_social: number;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  qsa: Array<{
    nome_socio: string;
    cnpj_cpf_do_socio: string;
    qualificacao_socio: string;
  }>;
}

async function consultarCnpjsBrasilApi(cnpjs: string[]): Promise<Map<string, DadosCnpj>> {
  const cache = new Map<string, DadosCnpj>();
  await Promise.allSettled(
    cnpjs.slice(0, 15).map(async (cnpj) => {
      try {
        const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (r.ok) cache.set(cnpj, (await r.json()) as DadosCnpj);
      } catch { /* API indisponível – análise continua sem dados online */ }
    })
  );
  return cache;
}

async function consultarSancoesCGU(cnpjs: string[], apiKey?: string): Promise<Set<string>> {
  const sancionados = new Set<string>();
  if (!apiKey) return sancionados;
  await Promise.allSettled(
    cnpjs.slice(0, 15).map(async (cnpj) => {
      try {
        const r1 = await fetch(
          `https://api.portaldatransparencia.gov.br/api-de-dados/ceis?cnpjSancionado=${cnpj}`,
          { headers: { "chave-api-dados": apiKey, Accept: "application/json" } }
        );
        if (r1.ok && ((await r1.json()) as unknown[]).length > 0) sancionados.add(cnpj);
      } catch { /* ignore */ }
      try {
        const r2 = await fetch(
          `https://api.portaldatransparencia.gov.br/api-de-dados/cnep?cnpjSancionado=${cnpj}`,
          { headers: { "chave-api-dados": apiKey, Accept: "application/json" } }
        );
        if (r2.ok && ((await r2.json()) as unknown[]).length > 0) sancionados.add(cnpj);
      } catch { /* ignore */ }
    })
  );
  return sancionados;
}

/* ── Regras de detecção ─────────────────────────────────────────── */
function regraValorInvalido(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  for (const row of rows) {
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if (valor <= 0) {
      alertas.push({
        tipo: "VALOR_ZERADO_OU_NEGATIVO",
        descricao: "Empenho com valor zerado ou negativo",
        pontuacao: 5,
        detalhes: `Registro: ${campo(row, "empenho", "numero", "nota", "id") || "N/D"} | Valor: ${valor}`,
        fundamentacao: "Art. 62, Lei 4.320/64"
      });
    }
  }
  return alertas;
}

function regraDispensaSemLicitacao(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  for (const row of rows) {
    const modalidade = campo(row, "modalidade", "mod", "tipo_licitacao").toUpperCase();
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if ((modalidade.includes("DISPENSA") || modalidade.includes("INEXIGIB")) && valor > LIMITE_DISPENSA_SERVICOS) {
      alertas.push({
        tipo: "CONTRATO_SEM_LICITACAO_INDEVIDO",
        descricao: `Dispensa/inexigibilidade acima do limite (R$ ${LIMITE_DISPENSA_SERVICOS.toLocaleString("pt-BR")})`,
        pontuacao: 15,
        detalhes: `Valor: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Modalidade: ${modalidade} | Fornecedor: ${campo(row, "fornecedor", "credor", "razao", "nome")}`,
        fundamentacao: "Art. 75, Lei 14.133/2021; Decreto 12.343/2024"
      });
    }
  }
  return alertas;
}

function regraPagamentoDuplicado(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  const vistos = new Map<string, number>();

  for (const row of rows) {
    const fornecedor = campo(row, "cnpj", "cpf", "fornecedor", "credor");
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const data = campo(row, "data", "dt_empenho", "dt_pagamento", "emissao");
    const objeto = campo(row, "objeto", "descricao", "historico", "item");
    if (!fornecedor && !valor) continue;

    const chave = `${fornecedor}|${valor}|${data}|${objeto}`.toLowerCase();
    const count = (vistos.get(chave) || 0) + 1;
    vistos.set(chave, count);
    if (count === 2) {
      alertas.push({
        tipo: "PAGAMENTO_DUPLICADO",
        descricao: "Possível pagamento duplicado detectado",
        pontuacao: 20,
        detalhes: `Fornecedor: ${fornecedor} | Valor: R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Data: ${data}`,
        fundamentacao: "Art. 63, Lei 4.320/64"
      });
    }
  }
  return alertas;
}

function regraSuperfaturamento(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  const porObjeto = new Map<string, number[]>();

  for (const row of rows) {
    const objeto = campo(row, "objeto", "descricao", "historico", "item").toLowerCase().substring(0, 60);
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const subelemento = campo(row, "subelemento", "sub_elemento", "elemento", "natureza");
    if (valor <= 0) continue;
    // Agrupa por subelemento (mesmo ramo de atividade, conforme Manual §2.5 e Portaria STN 448/2002)
    const chave = subelemento || objeto;
    if (!chave) continue;
    const lista = porObjeto.get(chave) || [];
    lista.push(valor);
    porObjeto.set(chave, lista);
  }

  for (const [objeto, valores] of porObjeto) {
    if (valores.length < 3) continue;
    const media = valores.reduce((s, v) => s + v, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length);
    if (desvio === 0) continue;

    for (const v of valores) {
      const zscore = (v - media) / desvio;
      if (zscore > ZSCORE_THRESHOLD) {
        alertas.push({
          tipo: "SUPERFATURAMENTO",
          descricao: "Valor significativamente acima da média para o mesmo objeto",
          pontuacao: 20,
          detalhes: `Objeto: ${objeto} | Valor: R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Média: R$ ${media.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Z-score: ${zscore.toFixed(1)}`
        });
      }
    }
  }
  return alertas;
}

function regraFracionamento(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  const grupos = new Map<string, { valor: number; data: string }[]>();

  for (const row of rows) {
    const fornecedor = campo(row, "cnpj", "cpf", "fornecedor", "credor");
    const objeto = campo(row, "objeto", "descricao", "historico", "item").toLowerCase().substring(0, 40);
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const data = campo(row, "data", "dt_empenho", "emissao");
    if (!fornecedor || valor <= 0) continue;

    const chave = `${fornecedor}|${objeto}`;
    const lista = grupos.get(chave) || [];
    lista.push({ valor, data });
    grupos.set(chave, lista);
  }

  for (const [chave, itens] of grupos) {
    if (itens.length < 2) continue;
    const total = itens.reduce((s, i) => s + i.valor, 0);
    const maiorIndividual = Math.max(...itens.map((i) => i.valor));

    if (total > LIMITE_DISPENSA_SERVICOS && maiorIndividual <= LIMITE_DISPENSA_SERVICOS) {
      const [fornecedor] = chave.split("|");
      alertas.push({
        tipo: "FRACIONAMENTO_LICITACAO",
        descricao: "Possível fracionamento de licitação para evitar limite de dispensa",
        pontuacao: 20,
        detalhes: `Fornecedor: ${fornecedor} | ${itens.length} empenhos | Total: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (cada um abaixo de R$ ${LIMITE_DISPENSA_SERVICOS.toLocaleString("pt-BR")})`
      });
    }
  }
  return alertas;
}

function regraConcentracaoFimAno(rows: RegistroEmpenho[]): Alerta[] {
  if (rows.length < 5) return [];
  let total = 0;
  let fimAno = 0;
  let valorFimAno = 0;
  let valorTotal = 0;

  for (const row of rows) {
    const data = campo(row, "data", "dt_empenho", "emissao", "dt_pagamento");
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const match = data.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})|(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (!match) continue;

    total++;
    valorTotal += valor;
    const mes = match[2] ? parseInt(match[2]) : parseInt(match[5]!);
    if (mes >= 11) {
      fimAno++;
      valorFimAno += valor;
    }
  }

  if (total > 0 && fimAno / total > 0.5) {
    return [{
      tipo: "CONCENTRACAO_FIM_EXERCICIO",
      descricao: "Concentração anormal de empenhos no fim do exercício (nov/dez)",
      pontuacao: 10,
      detalhes: `${fimAno} de ${total} registros (${(fimAno / total * 100).toFixed(0)}%) | Valor: R$ ${valorFimAno.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    }];
  }
  return [];
}

/* ── Regras de CNPJ ─────────────────────────────────────────────── */
function regraCnpjInvalido(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  const verificados = new Set<string>();
  for (const row of rows) {
    const raw = campo(row, "cnpj", "cpf_cnpj", "documento");
    const limpo = limparCnpj(raw);
    if (limpo.length !== 14 || verificados.has(limpo)) continue;
    verificados.add(limpo);
    if (!validarCnpj(limpo)) {
      alertas.push({
        tipo: "CNPJ_INVALIDO",
        descricao: "CNPJ com dígitos verificadores inválidos",
        pontuacao: 15,
        detalhes: `CNPJ: ${raw} | Fornecedor: ${campo(row, "razao", "nome", "credor")}`
      });
    }
  }
  return alertas;
}

function regraConcentracaoFornecedor(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  const porFornecedor = new Map<string, { valor: number; razao: string }>();
  let valorGeral = 0;
  for (const row of rows) {
    const cnpj = campo(row, "cnpj", "cpf_cnpj", "documento", "fornecedor");
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const razao = campo(row, "razao", "nome", "credor");
    if (!cnpj || valor <= 0) continue;
    valorGeral += valor;
    const atual = porFornecedor.get(cnpj);
    porFornecedor.set(cnpj, { valor: (atual?.valor ?? 0) + valor, razao: razao || atual?.razao || cnpj });
  }
  if (valorGeral === 0) return alertas;
  for (const [cnpj, { valor, razao }] of porFornecedor) {
    const pct = (valor / valorGeral) * 100;
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

/* ── Regras do Manual CGM Estância (Lei 14.133/2021) ────────────── */

/** Manual §2.6 - NF emitida antes do empenho (proibido empenho a posteriori) */
function regraNFAnteriorEmpenho(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  for (const row of rows) {
    const dtNF = campo(row, "data_nf", "dt_nota", "data_nota_fiscal", "emissao_nf");
    const dtEmp = campo(row, "data", "dt_empenho", "data_empenho", "emissao");
    if (!dtNF || !dtEmp) continue;
    const parseData = (s: string): Date | null => {
      const m = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
      if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
      const m2 = s.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
      if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
      return null;
    };
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

/** Manual §2.6 - Empenho sem dotação orçamentária / saldo insuficiente */
function regraEmpSemDotacao(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  for (const row of rows) {
    const dotacao = campo(row, "dotacao", "dotação", "classificacao", "funcional");
    const fonte = campo(row, "fonte", "fonte_recurso", "fr");
    const elemento = campo(row, "elemento", "natureza", "nd", "nat_despesa");
    // Se CSV tem campos de dotação/elemento e estão vazios
    const temCamposDotacao = Object.keys(row).some(k =>
      k.includes("dotacao") || k.includes("dotação") || k.includes("elemento") || k.includes("natureza") || k.includes("fonte")
    );
    if (temCamposDotacao && !dotacao && !fonte && !elemento) {
      alertas.push({
        tipo: "EMPENHO_SEM_DOTACAO",
        descricao: "Empenho sem classificação orçamentária identificada",
        pontuacao: 15,
        detalhes: `Registro: ${campo(row, "empenho", "numero", "nota", "id") || "N/D"} | Manual CGM §2.6 - Dotação orçamentária obrigatória`
      });
    }
  }
  return alertas;
}

/** Manual §2.5 - Fracionamento por subelemento de despesa no exercício (Res. TCE/SE 267/2011) */
function regraFracionamentoSubelemento(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  const porSubelemento = new Map<string, { valor: number; count: number; fornecedores: Set<string> }>();

  for (const row of rows) {
    const sub = campo(row, "subelemento", "sub_elemento", "sub-elemento", "subelemento_despesa");
    if (!sub) continue;
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    const fornecedor = campo(row, "cnpj", "cpf_cnpj", "fornecedor");
    const atual = porSubelemento.get(sub) || { valor: 0, count: 0, fornecedores: new Set<string>() };
    atual.valor += valor;
    atual.count++;
    if (fornecedor) atual.fornecedores.add(fornecedor);
    porSubelemento.set(sub, atual);
  }

  for (const [sub, info] of porSubelemento) {
    if (info.valor > LIMITE_DISPENSA_SERVICOS && info.fornecedores.size > 1) {
      // Mesmo subelemento, vários fornecedores, total acima do limite
      alertas.push({
        tipo: "FRACIONAMENTO_SUBELEMENTO",
        descricao: "Possível fracionamento de despesa no mesmo subelemento (Res. TCE/SE 267/2011)",
        pontuacao: 20,
        detalhes: `Subelemento: ${sub} | ${info.count} empenhos | ${info.fornecedores.size} fornecedores | Total: R$ ${info.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Limite dispensa: R$ ${LIMITE_DISPENSA_SERVICOS.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      });
    }
  }
  return alertas;
}

/** Res. TCE/SE 267/2011 + Portaria STN 448/2002 – Subelemento incorreto para o vínculo do servidor */
function regraSubelementoIncorreto(rows: RegistroEmpenho[], classificacoes: ClassificacaoDespesa[]): Alerta[] {
  const alertas: Alerta[] = [];

  for (const row of rows) {
    // Identifica o vínculo do servidor
    const vinculoRaw = campo(row, "vinculo", "vínculo", "tipo_vinculo", "regime", "tipo_servidor", "tipo_contratacao", "categoria")
      .toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (!vinculoRaw) continue;

    let vinculo: VinculoServidor | null = null;
    if (/EFETIVO|ESTATUT|CONCURSADO|ESTAVEL|PERMANENTE/.test(vinculoRaw)) {
      vinculo = "EFETIVO";
    } else if (/COMISSION|COMISSAO|CC[- ]|DAS[- ]|CARGO EM COMISS|LIVRE NOMEAC|LIVRE PROVIMENTO/.test(vinculoRaw)) {
      vinculo = "COMISSIONADO";
    } else if (/TEMPORAR|TEMPO DETERMINADO|ACT |CONTRATO TEMP|PROCESSO SELETIVO|SELETIVO SIMPLIF/.test(vinculoRaw)) {
      vinculo = "TEMPORARIO";
    }

    if (!vinculo) continue;

    // Identifica o código de natureza/subelemento
    const natureza = campo(row, "natureza", "nat_despesa", "nd", "natureza_despesa", "classificacao_despesa");
    const subelemento = campo(row, "subelemento", "sub_elemento", "sub-elemento", "subelemento_despesa");
    const elemento = campo(row, "elemento", "elemento_despesa", "ed");

    // Monta o código completo (remove pontos/separadores)
    let codigoCompleto = "";
    if (natureza) {
      codigoCompleto = natureza.replace(/[.\-\/\s]/g, "");
    } else if (elemento && subelemento) {
      codigoCompleto = (elemento + subelemento).replace(/[.\-\/\s]/g, "");
    } else if (elemento) {
      codigoCompleto = elemento.replace(/[.\-\/\s]/g, "");
    }

    if (!codigoCompleto || codigoCompleto.length < 6) continue;

    // Verifica se é despesa de pessoal (categoria 3, grupo 1)
    if (!codigoCompleto.startsWith("31")) continue;

    // Procura o código na tabela de classificações
    // Tenta primeiro com subelemento (8 dígitos), depois só elemento (6 dígitos)
    const codigoElemento = codigoCompleto.substring(0, 6);
    const codigoFull = codigoCompleto.substring(0, 8);

    const classificacao = classificacoes.find(c => c.codigo === codigoFull)
      || classificacoes.find(c => c.codigo === codigoElemento);

    if (!classificacao) continue;

    // Verifica se o vínculo do servidor é compatível com a classificação
    if (!classificacao.vinculos.includes(vinculo)) {
      // Encontra as classificações corretas para este vínculo
      const corretas = classificacoes
        .filter(c => c.vinculos.includes(vinculo) && c.codigo.length >= 6)
        .map(c => `${c.codigo} (${c.descricao})`)
        .slice(0, 3)
        .join("; ");

      alertas.push({
        tipo: "SUBELEMENTO_INCORRETO",
        descricao: `Subelemento de despesa incompatível com vínculo do servidor (Res. TCE/SE 267/2011 + Portaria STN 448/2002)`,
        pontuacao: 20,
        detalhes: `Servidor: ${campo(row, "nome", "servidor", "credor", "beneficiario") || "N/D"} | Vínculo: ${vinculo} | Classificação usada: ${codigoCompleto} (${classificacao.descricao}) | Vínculos válidos p/ esta classificação: ${classificacao.vinculos.join(", ")} | Classificações corretas p/ ${vinculo}: ${corretas}`
      });
    }
  }
  return alertas;
}

/** Res. TCE/SE 267/2011 + Portaria STN 448/2002 – Detecção em PDF de subelemento incorreto */
function regraSubelementoIncorretoPdf(texto: string, classificacoes: ClassificacaoDespesa[], regrasDb: RegraClassificacaoDB[]): Alerta[] {
  const alertas: Alerta[] = [];
  const textoLower = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // ── 1. Detecta menções a vínculo de servidor ──────────────────
  const temEfetivo = /servidor\s+efetivo|cargo\s+efetivo|estatut[aá]rio|concursado|efetivo/i.test(texto);
  const temComissionado = /comission|cargo\s+em\s+comiss|comissao|livre\s+nomea/i.test(texto);
  const temTemporario = /contrata[cç][aã]o.*tempo\s+determinado|temporar|contrato\s+temp|seletivo\s+simplif/i.test(texto);

  // ── 2. Detecta tipo de documento/ato de pessoal ───────────────
  const temRescisao = /rescis[aã]o|rescisao|rescindir|rescindido/i.test(texto);
  const temServidor = /servidor|servidora|funcionario|funcionaria/i.test(texto);
  const temSolicitacaoDespesa = /solicita[cç][aã]o\s+de\s+despesa|solicitacao de despesa/i.test(texto);

  // ── 3. Extrai códigos de natureza da despesa do texto ─────────
  const codigosNd = new Set<string>();
  const regexPontuado = /\b3\.1\.9[01]\.\d{2}(?:\.\d{2})?\b/g;
  for (const m of texto.matchAll(regexPontuado)) {
    codigosNd.add(m[0].replace(/\./g, ""));
  }
  const regexContinuo = /\b31(?:90|91)\d{2,4}\b/g;
  for (const m of texto.matchAll(regexContinuo)) {
    if (m[0].length >= 6) codigosNd.add(m[0]);
  }

  // ── 4. Validação cruzada: código ND + vínculo detectado ───────
  for (const codigo of codigosNd) {
    const codigoElemento = codigo.substring(0, 6);
    const codigoFull = codigo.length >= 8 ? codigo.substring(0, 8) : codigo;

    const classificacao = classificacoes.find(c => c.codigo === codigoFull)
      || classificacoes.find(c => c.codigo === codigoElemento);

    if (!classificacao) continue;

    if (temEfetivo && !classificacao.vinculos.includes("EFETIVO") && classificacao.vinculos.includes("TEMPORARIO")) {
      alertas.push({
        tipo: "SUBELEMENTO_INCORRETO",
        descricao: "Servidor efetivo com classificação de despesa de temporário (Res. TCE/SE 267/2011 + Portaria STN 448/2002)",
        pontuacao: 20,
        detalhes: `Classificação encontrada: ${codigo} (${classificacao.descricao}) | Vínculo detectado: EFETIVO | Classificação esperada: 31909401 (Indenizações) ou 31901101 (Vencimento)`
      });
    }

    if (temTemporario && !classificacao.vinculos.includes("TEMPORARIO") && classificacao.vinculos.includes("EFETIVO")) {
      alertas.push({
        tipo: "SUBELEMENTO_INCORRETO",
        descricao: "Servidor temporário com classificação de despesa de efetivo (Res. TCE/SE 267/2011 + Portaria STN 448/2002)",
        pontuacao: 20,
        detalhes: `Classificação encontrada: ${codigo} (${classificacao.descricao}) | Vínculo detectado: TEMPORARIO | Classificação esperada: 319004/31900401 (Contratação por Tempo Determinado)`
      });
    }

    if (temComissionado && !classificacao.vinculos.includes("COMISSIONADO") && classificacao.vinculos.includes("EFETIVO") && !classificacao.vinculos.includes("TEMPORARIO")) {
      alertas.push({
        tipo: "SUBELEMENTO_INCORRETO",
        descricao: "Servidor comissionado com classificação de despesa exclusiva de efetivo (Res. TCE/SE 267/2011 + Portaria STN 448/2002)",
        pontuacao: 20,
        detalhes: `Classificação encontrada: ${codigo} (${classificacao.descricao}) | Vínculo detectado: COMISSIONADO | Classificação esperada: 31901130 (Venc. cargo em comissão) ou 31901113 (Gratificação)`
      });
    }
  }

  // ── 5. Detecção de rescisão de servidor ────────────────────────
  // Quando o documento trata de rescisão de servidor, alerta sobre a 
  // classificação obrigatória conforme Res. TCE/SE 267/2011
  if (temRescisao && temServidor) {
// Monta detalhes usando regras do DB quando disponível
      let detalhesRescisao = "Rescisão de servidor efetivo: classificação correta é 3.1.90.94.01 (Indenizações e Restituições Trabalhistas). " +
        "Rescisão de servidor temporário: classificação correta é 3.1.90.04.01 (Contratação por Tempo Determinado). " +
        "Verificar se o subelemento de despesa está correto conforme o vínculo do servidor.";

      if (regrasDb.length > 0) {
        const regrasRescisao = regrasDb.filter(r => r.tipo_ato === "RESCISAO");
        if (regrasRescisao.length > 0) {
          detalhesRescisao = regrasRescisao
            .map(r => `${r.vinculo_servidor}: ${r.codigo_completo} (${r.descricao}) — ${r.fundamentacao}`)
            .join(" | ");
        }
      }

      alertas.push({
        tipo: "VERIFICAR_CLASSIFICACAO_RESCISAO",
        descricao: "Documento de rescisão de servidor — verificar classificação orçamentária (Res. TCE/SE 267/2011 + Portaria STN 448/2002)",
        pontuacao: 15,
        detalhes: detalhesRescisao
    });

    // Se também menciona Solicitação de Despesa, reforça o alerta
    if (temSolicitacaoDespesa) {
      alertas.push({
        tipo: "RESCISAO_SOLICITA_DESPESA",
        descricao: "Rescisão com Solicitação de Despesa — conferir natureza da despesa e subelemento",
        pontuacao: 10,
        detalhes: "A Solicitação de Despesa (SD) para rescisão deve conter o subelemento correto: " +
          "31909401 para servidor efetivo, 31900401 para temporário. " +
          "Conferir se o empenho foi classificado corretamente no Sistema Contabilis."
      });
    }
  }

  // ── 6. Detecção direta de termos de irregularidade ─────────────
  if (textoLower.includes("subelemento incorreto") || textoLower.includes("sub-elemento incorreto") || textoLower.includes("natureza da despesa incorreta")) {
    alertas.push({
      tipo: "SUBELEMENTO_INCORRETO",
      descricao: "Documento menciona subelemento ou natureza da despesa incorreta",
      pontuacao: 15,
      detalhes: "Verificar classificação conforme Res. TCE/SE 267/2011 e Portaria STN 448/2002"
    });
  }

  return alertas;
}

/** Manual §2.9 - Ordem cronológica de pagamentos */
function regraOrdemCronologica(rows: RegistroEmpenho[]): Alerta[] {
  const alertas: Alerta[] = [];
  const parseData = (s: string): Date | null => {
    const m = s.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const m2 = s.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
    return null;
  };

  // Agrupa por fornecedor
  const porFornecedor = new Map<string, { dtLiq: Date; dtPag: Date; empenho: string }[]>();
  for (const row of rows) {
    const fornecedor = campo(row, "cnpj", "cpf_cnpj", "fornecedor", "credor");
    const dtLiqStr = campo(row, "data_liquidacao", "dt_liquidacao", "liquidacao");
    const dtPagStr = campo(row, "data_pagamento", "dt_pagamento", "pagamento");
    if (!fornecedor || !dtLiqStr || !dtPagStr) continue;
    const dtLiq = parseData(dtLiqStr);
    const dtPag = parseData(dtPagStr);
    if (!dtLiq || !dtPag) continue;
    const lista = porFornecedor.get(fornecedor) || [];
    lista.push({ dtLiq, dtPag, empenho: campo(row, "empenho", "numero", "nota") });
    porFornecedor.set(fornecedor, lista);
  }

  for (const [fornecedor, itens] of porFornecedor) {
    if (itens.length < 2) continue;
    // Ordena por data de liquidação
    itens.sort((a, b) => a.dtLiq.getTime() - b.dtLiq.getTime());
    for (let i = 1; i < itens.length; i++) {
      // Se um empenho liquidado depois foi pago antes de um anterior
      if (itens[i].dtPag < itens[i - 1].dtPag) {
        alertas.push({
          tipo: "QUEBRA_ORDEM_CRONOLOGICA",
          descricao: "Pagamento fora da ordem cronológica de liquidação (Art. 141 Lei 14.133/2021)",
          pontuacao: 15,
          detalhes: `Fornecedor: ${fornecedor} | Empenho ${itens[i].empenho} pago antes de ${itens[i - 1].empenho}`
        });
        break; // um alerta por fornecedor
      }
    }
  }
  return alertas;
}

/** Manual §2.4/§2.5 - CNAE incompatível com objeto (atividade social vs objeto contratado) */
function regraCnaeIncompativel(rows: RegistroEmpenho[], dados: Map<string, DadosCnpj>): Alerta[] {
  const alertas: Alerta[] = [];
  const verificados = new Set<string>();

  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (cnpj.length !== 14 || verificados.has(cnpj)) continue;
    verificados.add(cnpj);
    const info = dados.get(cnpj);
    if (!info?.cnae_fiscal_descricao) continue;

    const objeto = campo(row, "objeto", "descricao", "historico", "item").toLowerCase();
    if (!objeto || objeto.length < 5) continue;
    const cnae = info.cnae_fiscal_descricao.toLowerCase();

    // Verificação básica: categorias completamente distintas
    const categoriasObjeto = extrairCategorias(objeto);
    const categoriasCnae = extrairCategorias(cnae);
    if (categoriasObjeto.size > 0 && categoriasCnae.size > 0) {
      let temOverlap = false;
      for (const c of categoriasObjeto) {
        if (categoriasCnae.has(c)) { temOverlap = true; break; }
      }
      if (!temOverlap) {
        alertas.push({
          tipo: "CNAE_INCOMPATIVEL",
          descricao: "Objeto social (CNAE) possivelmente incompatível com o objeto contratado",
          pontuacao: 10,
          detalhes: `CNPJ: ${cnpj} | ${info.razao_social} | CNAE: ${info.cnae_fiscal_descricao} | Objeto: ${objeto.substring(0, 80)}`
        });
      }
    }
  }
  return alertas;
}

function extrairCategorias(texto: string): Set<string> {
  const cats = new Set<string>();
  const mapa: Record<string, string[]> = {
    "construcao": ["obra", "constru", "reforma", "edifica", "engenharia", "pavimenta"],
    "alimentacao": ["aliment", "refei", "merenda", "comida", "lanch", "cafe"],
    "informatica": ["comput", "software", "sistema", "inform", "tecnologia", "rede", "ti "],
    "saude": ["saude", "sa├║de", "medic", "hospitalar", "farmac", "enferm"],
    "educacao": ["educa", "escol", "ensino", "pedagog", "didatic"],
    "limpeza": ["limpeza", "conserva", "higien", "asseio"],
    "transporte": ["transport", "veicul", "ve├¡cul", "locomo", "combust", "frota"],
    "escritorio": ["escritorio", "papel", "material de expediente", "toner", "impressora"],
    "assessoria": ["assessor", "consultoria", "consult"],
    "comunicacao": ["comunica", "publicidade", "propaganda", "midiia"],
    "combustivel": ["combust", "gasolina", "diesel", "etanol", "abastec"],
    "locacao": ["aluguel", "loca├º├úo", "locacao"],
  };
  for (const [cat, termos] of Object.entries(mapa)) {
    for (const t of termos) {
      if (texto.includes(t)) { cats.add(cat); break; }
    }
  }
  return cats;
}

function regraEmpresaRecenteCriada(rows: RegistroEmpenho[], dados: Map<string, DadosCnpj>): Alerta[] {
  const alertas: Alerta[] = [];
  const verificados = new Set<string>();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (cnpj.length !== 14 || verificados.has(cnpj)) continue;
    verificados.add(cnpj);
    const info = dados.get(cnpj);
    if (!info?.data_inicio_atividade) continue;
    const dataEmp = campo(row, "data", "dt_empenho", "emissao");
    const m = dataEmp.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (!m) continue;
    const dtEmpenho = new Date(+m[3], +m[2] - 1, +m[1]);
    const dtAbertura = new Date(info.data_inicio_atividade);
    const meses = (dtEmpenho.getTime() - dtAbertura.getTime()) / (1000 * 60 * 60 * 24 * 30);
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

function regraSituacaoIrregular(_rows: RegistroEmpenho[], dados: Map<string, DadosCnpj>): Alerta[] {
  const alertas: Alerta[] = [];
  for (const [cnpj, info] of dados) {
    if (!info.descricao_situacao_cadastral) continue;
    const situacao = info.descricao_situacao_cadastral.toUpperCase();
    if (situacao !== "ATIVA") {
      alertas.push({
        tipo: "SITUACAO_CADASTRAL_IRREGULAR",
        descricao: "Empresa com situação cadastral irregular na Receita Federal",
        pontuacao: 25,
        detalhes: `CNPJ: ${cnpj} | ${info.razao_social} | Situação: ${situacao}`
      });
    }
  }
  return alertas;
}

function regraPorteIncompativel(rows: RegistroEmpenho[], dados: Map<string, DadosCnpj>): Alerta[] {
  const alertas: Alerta[] = [];
  const totalPorCnpj = new Map<string, number>();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if (cnpj.length !== 14) continue;
    totalPorCnpj.set(cnpj, (totalPorCnpj.get(cnpj) ?? 0) + valor);
  }
  for (const [cnpj, total] of totalPorCnpj) {
    const info = dados.get(cnpj);
    if (!info) continue;
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

function regraSociosEmComum(_rows: RegistroEmpenho[], dados: Map<string, DadosCnpj>): Alerta[] {
  const alertas: Alerta[] = [];
  const socioPorEmpresa = new Map<string, Set<string>>();
  for (const [cnpj, info] of dados) {
    if (!info.qsa?.length) continue;
    for (const socio of info.qsa) {
      const nome = (socio.nome_socio || "").trim().toUpperCase();
      if (!nome || nome.length < 5) continue;
      const empresas = socioPorEmpresa.get(nome) ?? new Set();
      empresas.add(cnpj);
      socioPorEmpresa.set(nome, empresas);
    }
  }
  const reportados = new Set<string>();
  for (const [nome, empresas] of socioPorEmpresa) {
    if (empresas.size < 2) continue;
    const key = [...empresas].sort().join("|");
    if (reportados.has(key)) continue;
    reportados.add(key);
    const nomes = [...empresas].map((c) => dados.get(c)?.razao_social || c);
    alertas.push({
      tipo: "SOCIOS_EM_COMUM",
      descricao: "Fornecedores diferentes com sócios em comum",
      pontuacao: 20,
      detalhes: `Sócio: ${nome} | Empresas: ${nomes.join(", ")}`
    });
  }
  return alertas;
}

function regraCapitalSocialBaixo(rows: RegistroEmpenho[], dados: Map<string, DadosCnpj>): Alerta[] {
  const alertas: Alerta[] = [];
  const totalPorCnpj = new Map<string, number>();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    const valor = valorNumerico(row, "valor", "vlr", "montante", "total");
    if (cnpj.length !== 14) continue;
    totalPorCnpj.set(cnpj, (totalPorCnpj.get(cnpj) ?? 0) + valor);
  }
  for (const [cnpj, total] of totalPorCnpj) {
    const info = dados.get(cnpj);
    if (!info || !info.capital_social || info.capital_social <= 0) continue;
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

function regraEmpresaSancionada(rows: RegistroEmpenho[], sancionados: Set<string>): Alerta[] {
  if (sancionados.size === 0) return [];
  const alertas: Alerta[] = [];
  const verificados = new Set<string>();
  for (const row of rows) {
    const cnpj = limparCnpj(campo(row, "cnpj", "cpf_cnpj", "documento"));
    if (cnpj.length !== 14 || verificados.has(cnpj)) continue;
    verificados.add(cnpj);
    if (sancionados.has(cnpj)) {
      alertas.push({
        tipo: "EMPRESA_SANCIONADA",
        descricao: "Empresa consta no CEIS/CNEP (Cadastro de Inidôneas/Suspensas/Punidas)",
        pontuacao: 30,
        detalhes: `CNPJ: ${cnpj} | Fornecedor: ${campo(row, "razao", "nome", "credor")}`
      });
    }
  }
  return alertas;
}

/* ── Parser de texto livre (PDF) → registros estruturados ───────── */
function parseValorBR(s: string): number {
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

interface DadosTextoLivre {
  cnpjs: string[];
  valores: number[];
  datas: string[];
  termos: string[];
  empenhos: string[];
  rows: RegistroEmpenho[];
}

function parseTextoLivre(texto: string): DadosTextoLivre {
  const cnpjSet = new Set<string>();
  const valores: number[] = [];
  const datas: string[] = [];
  const termos: string[] = [];
  const empenhos: string[] = [];
  const rows: RegistroEmpenho[] = [];

  // Extrai CNPJs formatados (XX.XXX.XXX/XXXX-XX) - exige pelo menos / ou - para evitar falsos positivos
  const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-?\d{2}/g;
  for (const m of texto.matchAll(cnpjRegex)) {
    const limpo = m[0].replace(/\D/g, "");
    if (limpo.length === 14 && validarCnpj(limpo)) cnpjSet.add(limpo);
  }

  // Extrai valores monetários (R$ X.XXX,XX ou variações)
  const valorRegex = /R\$\s*[\d.,]+|\d{1,3}(?:\.\d{3})*,\d{2}/g;
  for (const m of texto.matchAll(valorRegex)) {
    const v = parseValorBR(m[0]);
    if (v > 0) valores.push(v);
  }

  // Extrai datas
  const dataRegex = /\d{2}\/\d{2}\/\d{4}/g;
  for (const m of texto.matchAll(dataRegex)) datas.push(m[0]);

  // Extrai números de empenho
  const empenhoRegex = /\d{4}NE\d{6}/gi;
  for (const m of texto.matchAll(empenhoRegex)) empenhos.push(m[0]);

  // Detecta termos relevantes (expandido com Manual CGM)
  const termosChave = [
    "dispensa", "inexigibilidade", "emergencial", "licitação", "pregão",
    "tomada de preço", "convite", "concorrência", "aditivo", "contrato",
    "empenho", "liquidação", "pagamento", "nota fiscal", "reembolso",
    "fracionamento", "sobrepreço", "superfaturamento",
    "dfd", "etp", "termo de referência", "projeto básico", "matriz de risco",
    "certidão", "atesto", "fiscal de contrato", "gestor", "art ", "rrt",
    "cno", "alvará", "medição", "diária", "retenção", "ir ", "iss",
    "inss", "fgts", "darf", "gps", "ordem cronológica"
  ];
  const textoLower = texto.toLowerCase();
  for (const t of termosChave) {
    if (textoLower.includes(t)) termos.push(t);
  }

  // Cria registros sintéticos para alimentar as regras existentes
  for (const cnpj of cnpjSet) {
    // Tenta encontrar contexto próximo ao CNPJ para extrair valor associado
    const cnpjFormatado = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    const idx = texto.indexOf(cnpjFormatado) !== -1 ? texto.indexOf(cnpjFormatado) : texto.indexOf(cnpj);
    let valorAssociado = 0;
    let dataAssociada = "";
    let modalidade = "";

    if (idx !== -1) {
      const contexto = texto.substring(Math.max(0, idx - 300), Math.min(texto.length, idx + 500));
      const valorMatch = contexto.match(/R\$\s*([\d.,]+)/);
      if (valorMatch) valorAssociado = parseValorBR(valorMatch[0]);
      const dataMatch = contexto.match(/\d{2}\/\d{2}\/\d{4}/);
      if (dataMatch) dataAssociada = dataMatch[0];
      const modMatch = contexto.match(/\b(dispensa|inexigibilidade|preg[aã]o|tomada|convite|concorr[eê]ncia)\b/i);
      if (modMatch) modalidade = modMatch[1].toUpperCase();
    }

    const row: RegistroEmpenho = {
      cnpj_fornecedor: cnpj,
      valor: valorAssociado.toString(),
      data_empenho: dataAssociada,
      modalidade: modalidade,
      objeto: "",
      razao_social: "",
    };
    rows.push(row);
  }

  return { cnpjs: [...cnpjSet], valores, datas, termos, empenhos, rows };
}

function regrasTextoLivre(texto: string, dados: DadosTextoLivre): Alerta[] {
  const alertas: Alerta[] = [];
  const textoLower = texto.toLowerCase();

  // Detecta termos de irregularidade no documento (Manual CGM Estância + Lei 14.133/2021)
  const termosRisco: { termo: string; tipo: string; desc: string; pts: number; fundamentacao?: string }[] = [
    // Modalidades e contratação
    { termo: "dispensa de licitação", tipo: "MENCAO_DISPENSA", desc: "Documento menciona dispensa de licitação", pts: 5, fundamentacao: "Lei 14.133/2021, art. 75" },
    { termo: "inexigibilidade", tipo: "MENCAO_INEXIGIBILIDADE", desc: "Documento menciona inexigibilidade de licitação", pts: 5, fundamentacao: "Lei 14.133/2021, art. 74" },
    { termo: "emergencial", tipo: "MENCAO_EMERGENCIAL", desc: "Documento menciona contratação emergencial", pts: 10, fundamentacao: "Lei 14.133/2021, art. 75, VIII" },
    { termo: "sem licitação", tipo: "MENCAO_SEM_LICITACAO", desc: "Documento menciona contratação sem licitação", pts: 10, fundamentacao: "Lei 14.133/2021, art. 75" },
    { termo: "sigilo", tipo: "MENCAO_SIGILO", desc: "Documento menciona sigilo", pts: 10, fundamentacao: "Lei 14.133/2021, art. 24" },
    // Documentos obrigatórios (Manual §DFD/ETP/TR)
    { termo: "sem dfd", tipo: "AUSENCIA_DFD", desc: "Indica ausência de Documento de Formalização da Demanda (DFD)", pts: 15, fundamentacao: "Lei 14.133/2021, art. 18" },
    { termo: "sem etp", tipo: "AUSENCIA_ETP", desc: "Indica ausência de Estudo Técnico Preliminar (ETP)", pts: 15, fundamentacao: "Lei 14.133/2021, art. 18" },
    { termo: "sem termo de referência", tipo: "AUSENCIA_TR", desc: "Indica ausência de Termo de Referência", pts: 15, fundamentacao: "Lei 14.133/2021, art. 18" },
    { termo: "sem projeto básico", tipo: "AUSENCIA_PB", desc: "Indica ausência de Projeto Básico", pts: 15, fundamentacao: "Lei 14.133/2021, art. 18" },
    // Empenho e liquidação (Manual §2.6, §2.8)
    { termo: "empenho a posteriori", tipo: "EMPENHO_POSTERIORI", desc: "Empenho emitido após execução da despesa (Art. 60 Lei 4.320/64)", pts: 20, fundamentacao: "Art. 60, Lei 4.320/64" },
    { termo: "empenho posterior", tipo: "EMPENHO_POSTERIORI", desc: "Empenho emitido após execução da despesa", pts: 20, fundamentacao: "Art. 60, Lei 4.320/64" },
    { termo: "sem empenho", tipo: "SEM_EMPENHO", desc: "Despesa realizada sem empenho prévio", pts: 25, fundamentacao: "Art. 60, Lei 4.320/64" },
    { termo: "sem atesto", tipo: "SEM_ATESTO", desc: "Liquidação sem atesto do fiscal/responsável (Manual §2.8)", pts: 15, fundamentacao: "Lei 14.133/2021, art. 117" },
    { termo: "sem fiscal", tipo: "SEM_FISCAL_CONTRATO", desc: "Contrato sem fiscal designado (Art. 117 Lei 14.133/2021)", pts: 15, fundamentacao: "Lei 14.133/2021, art. 117" },
    { termo: "sem gestor", tipo: "SEM_GESTOR_CONTRATO", desc: "Contrato sem gestor designado", pts: 10, fundamentacao: "Lei 14.133/2021, art. 117" },
    // Aditivos (Manual §2.5)
    { termo: "aditivo", tipo: "MENCAO_ADITIVO", desc: "Documento menciona aditivo contratual", pts: 5, fundamentacao: "Lei 14.133/2021, art. 125" },
    { termo: "termo aditivo", tipo: "MENCAO_ADITIVO", desc: "Documento menciona termo aditivo", pts: 5, fundamentacao: "Lei 14.133/2021, art. 125" },
    { termo: "acréscimo de 25%", tipo: "ADITIVO_LIMITE", desc: "Referência ao limite de 25% de acréscimo em aditivos (Art. 125 Lei 14.133)", pts: 10, fundamentacao: "Lei 14.133/2021, art. 125" },
    // Certidões (Manual Check Lists)
    { termo: "certidão vencida", tipo: "CERTIDAO_VENCIDA", desc: "Certidão com validade expirada", pts: 15, fundamentacao: "Lei 14.133/2021, art. 69" },
    { termo: "certidão negativa", tipo: "INFO_CERTIDAO", desc: "Documento menciona certidão negativa", pts: 0 },
    { termo: "cnd", tipo: "INFO_CERTIDAO", desc: "Referência a CND (Certidão Negativa de Débitos)", pts: 0 },
    // Retenções tributárias (Manual §2.9/§2.12)
    { termo: "sem retenção", tipo: "AUSENCIA_RETENCAO", desc: "Possível ausência de retenção tributária obrigatória", pts: 10, fundamentacao: "Lei 14.133/2021, art. 122" },
    { termo: "sem retenção de ir", tipo: "AUSENCIA_RETENCAO_IR", desc: "Ausência de retenção de Imposto de Renda (IN RFB 1.234/2012)", pts: 15, fundamentacao: "IN RFB 1.234/2012" },
    { termo: "sem retenção de iss", tipo: "AUSENCIA_RETENCAO_ISS", desc: "Ausência de retenção de ISS", pts: 10, fundamentacao: "Lei Complementar 116/2003" },
    { termo: "sem retenção previdenc", tipo: "AUSENCIA_RETENCAO_INSS", desc: "Ausência de retenção previdenciária (IN RFB 2.110/2022)", pts: 15, fundamentacao: "IN RFB 2.110/2022" },
    // Ordem cronológica (Manual §2.9)
    { termo: "ordem cronológica", tipo: "INFO_ORDEM_CRONOLOGICA", desc: "Referência à ordem cronológica de pagamentos (Art. 141 Lei 14.133)", pts: 0, fundamentacao: "Lei 14.133/2021, art. 141" },
    { termo: "fora da ordem", tipo: "QUEBRA_ORDEM_CRONOLOGICA", desc: "Pagamento fora da ordem cronológica", pts: 15, fundamentacao: "Lei 14.133/2021, art. 141" },
    // Cotação (Manual §2.4)
    { termo: "cotação única", tipo: "COTACAO_INSUFICIENTE", desc: "Apenas uma cotação de preços (mínimo 3 obrigatório - IN SEGES/ME 65/2021)", pts: 15, fundamentacao: "IN SEGES/ME 65/2021" },
    { termo: "pesquisa de preço insuficiente", tipo: "COTACAO_INSUFICIENTE", desc: "Pesquisa de preços insuficiente", pts: 15, fundamentacao: "IN SEGES/ME 65/2021" },
    // Obras (Manual Check Lists)
    { termo: "sem art", tipo: "AUSENCIA_ART", desc: "Obra sem ART (Anotação de Responsabilidade Técnica)", pts: 15, fundamentacao: "Lei 6.496/1977" },
    { termo: "sem rrt", tipo: "AUSENCIA_RRT", desc: "Obra sem RRT (Registro de Responsabilidade Técnica)", pts: 15, fundamentacao: "Resolução CAU/BR 51/2013" },
    { termo: "sem cno", tipo: "AUSENCIA_CNO", desc: "Obra sem CNO (Cadastro Nacional de Obras)", pts: 10, fundamentacao: "IN RFB 1.845/2018" },
    { termo: "sem alvará", tipo: "AUSENCIA_ALVARA", desc: "Obra sem alvará de construção", pts: 15, fundamentacao: "Lei 14.133/2021, art. 8º" },
    { termo: "sem medição", tipo: "AUSENCIA_MEDICAO", desc: "Obra sem medição/boletim de medição", pts: 15, fundamentacao: "Lei 14.133/2021, art. 140" },
    // Diárias (Manual Check Lists)
    { termo: "sem relatório de viagem", tipo: "AUSENCIA_RELATORIO_VIAGEM", desc: "Diária sem relatório de viagem (prazo: 5 dias úteis)", pts: 10, fundamentacao: "Lei 14.133/2021, art. 74" },
    { termo: "diária", tipo: "INFO_DIARIA", desc: "Documento menciona diárias", pts: 0 },
    // Fracionamento
    { termo: "fracionamento", tipo: "MENCAO_FRACIONAMENTO", desc: "Documento menciona fracionamento de despesa", pts: 10, fundamentacao: "Lei 14.133/2021, art. 23, §5º" },
    { termo: "sobrepreço", tipo: "MENCAO_SOBREPRECO", desc: "Documento menciona sobrepreço", pts: 15, fundamentacao: "Lei 14.133/2021, art. 59" },
    { termo: "superfaturamento", tipo: "MENCAO_SUPERFATURAMENTO", desc: "Documento menciona superfaturamento", pts: 15, fundamentacao: "Lei 14.133/2021, art. 59" },
    // Matriz de risco
    { termo: "sem matriz de risco", tipo: "AUSENCIA_MATRIZ_RISCO", desc: "Ausência de Matriz de Risco (Art. 6º, XXVII, Lei 14.133)", pts: 10, fundamentacao: "Lei 14.133/2021, art. 6º, XXVII" },
    // Controle patrimonial
    { termo: "sem tombamento", tipo: "AUSENCIA_TOMBAMENTO", desc: "Material permanente sem tombamento patrimonial", pts: 10, fundamentacao: "Lei 4.320/64, art. 94" },
    // Classificação orçamentária (Res. TCE/SE 267/2011 + Portaria STN 448/2002)
    { termo: "natureza da despesa incorreta", tipo: "NATUREZA_DESPESA_INCORRETA", desc: "Natureza da despesa classificada incorretamente (Res. TCE/SE 267/2011)", pts: 20, fundamentacao: "Resolução TCE/SE 267/2011" },
    { termo: "subelemento incorreto", tipo: "SUBELEMENTO_INCORRETO_TEXTO", desc: "Subelemento de despesa classificado incorretamente (Portaria STN 448/2002)", pts: 20, fundamentacao: "Portaria STN 448/2002" },
    { termo: "sub-elemento incorreto", tipo: "SUBELEMENTO_INCORRETO_TEXTO", desc: "Subelemento de despesa classificado incorretamente (Portaria STN 448/2002)", pts: 20, fundamentacao: "Portaria STN 448/2002" },
    { termo: "classificação econômica incorreta", tipo: "CLASSIFICACAO_INCORRETA", desc: "Classificação econômica da despesa incorreta (Res. TCE/SE 267/2011)", pts: 20, fundamentacao: "Resolução TCE/SE 267/2011" },
    { termo: "elemento de despesa incorreto", tipo: "ELEMENTO_DESPESA_INCORRETO", desc: "Elemento de despesa incorreto (Portaria STN 448/2002)", pts: 20, fundamentacao: "Portaria STN 448/2002" },
  ];

  const tiposJaAdicionados = new Set<string>();
  for (const tr of termosRisco) {
    if (tr.pts === 0) continue; // termos informativos, não geram alerta
    if (tiposJaAdicionados.has(tr.tipo)) continue; // evita duplicatas do mesmo tipo
    if (textoLower.includes(tr.termo)) {
      tiposJaAdicionados.add(tr.tipo);
      alertas.push({ tipo: tr.tipo, descricao: tr.desc, pontuacao: tr.pts, fundamentacao: tr.fundamentacao });
    }
  }

  // Verifica valores altos encontrados no documento
  for (const v of dados.valores) {
    if (v > 500000) {
      alertas.push({
        tipo: "VALOR_ELEVADO_DOCUMENTO",
        descricao: "Valor elevado encontrado no documento (acima de R$ 500 mil)",
        pontuacao: 5,
        detalhes: `Valor: R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        fundamentacao: "Lei 14.133/2021, art. 23, §1º"
      });
    }
  }

  // Verifica se dispensa de pequeno valor está acima do limite (Art. 75, II, Lei 14.133)
  if (textoLower.includes("dispensa") && (textoLower.includes("pequeno valor") || textoLower.includes("art. 75"))) {
    for (const v of dados.valores) {
      if (v > LIMITE_DISPENSA_PEQUENO_VALOR) {
        alertas.push({
          tipo: "DISPENSA_ACIMA_LIMITE",
          descricao: `Valor acima do limite de dispensa por pequeno valor (R$ ${LIMITE_DISPENSA_PEQUENO_VALOR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`,
          pontuacao: 20,
          detalhes: `Valor encontrado: R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | Art. 75, II, Lei 14.133/2021`,
          fundamentacao: "Lei 14.133/2021, art. 75, II; Decreto 12.343/2024"
        });
        break;
      }
    }
  }

  // Verifica datas — NF antes de empenho mencionado no texto
  if (dados.datas.length >= 2 && dados.empenhos.length > 0) {
    const parseData = (s: string): Date | null => {
      const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
    };
    const datesParsed = dados.datas.map(d => ({ str: d, dt: parseData(d) })).filter(d => d.dt !== null);
    if (datesParsed.length >= 2) {
      datesParsed.sort((a, b) => a.dt!.getTime() - b.dt!.getTime());
      // Se texto menciona "nota fiscal" antes de "empenho" e a 1a data < 2a data
      const idxNF = textoLower.indexOf("nota fiscal");
      const idxEmp = textoLower.indexOf("empenho");
      if (idxNF !== -1 && idxEmp !== -1 && idxNF < idxEmp) {
        // Primeira data encontrada pode ser NF, segunda pode ser empenho
        if (datesParsed[0].dt!.getTime() < datesParsed[1].dt!.getTime()) {
          alertas.push({
            tipo: "NF_ANTERIOR_EMPENHO_PDF",
            descricao: "Possível NF emitida antes do empenho detectada no documento (Art. 60 Lei 4.320/64)",
            pontuacao: 15,
            detalhes: `Data anterior: ${datesParsed[0].str} | Data posterior: ${datesParsed[1].str}`,
            fundamentacao: "Art. 60, Lei 4.320/64"
          });
        }
      }
    }
  }

  return alertas;
}

/* ── Nível por pontuação ────────────────────────────────────────── */
function nivelPorScore(score: number): ResultadoAnalise["nivel"] {
  if (score <= 20) return "BAIXO";
  if (score <= 40) return "MEDIO";
  if (score <= 70) return "ALTO";
  return "CRITICO";
}

/* ── Função principal ───────────────────────────────────────────── */
export async function analisarDocumento(input: {
  nomeArquivo: string;
  tipo: string;
  tamanho: number;
  conteudo?: string;
  conteudoPdf?: ArrayBuffer;
  apiKeyTransparencia?: string;
  db?: D1Database;
  ai?: Ai;
}): Promise<ResultadoAnalise> {
  const alertas: Alerta[] = [];
  let totalRegistros = 0;
  let valorTotal = 0;
  let textoExtraido: string | undefined;
  let totalPaginas = 0;
  let paginasExtraidas: { pagina: number; texto: string }[] = [];

  // Carrega classificações do banco se disponível, senão usa hardcoded
  let classificacoes = CLASSIFICACAO_PESSOAL;
  let regrasDb: RegraClassificacaoDB[] = [];
  if (input.db) {
    try {
      const [elemRes, regrasRes] = await Promise.all([
        input.db.prepare("SELECT codigo, descricao, vinculos FROM elementos_despesa").all<{codigo: string; descricao: string; vinculos: string}>(),
        input.db.prepare("SELECT tipo_ato, vinculo_servidor, codigo_completo, descricao, fundamentacao FROM regras_classificacao").all<RegraClassificacaoDB>(),
      ]);
      if (elemRes.results.length > 0) {
        classificacoes = elemRes.results.map(r => ({
          codigo: r.codigo,
          descricao: r.descricao,
          vinculos: JSON.parse(r.vinculos) as VinculoServidor[],
        }));
      }
      regrasDb = regrasRes.results;
    } catch { /* DB indisponível — usa dados locais */ }
  }

  let detalhesExtraidos: ResultadoAnalise["detalhesExtraidos"] = {};
  if (input.conteudo && (input.tipo.includes("csv") || input.tipo.includes("text"))) {
    // ── Análise CSV estruturada ───────────────────────────────────
    const rows = parseCsv(input.conteudo);
    totalRegistros = rows.length;

    for (const row of rows) {
      valorTotal += valorNumerico(row, "valor", "vlr", "montante", "total");
    }

    // Regras offline (sem consulta externa)
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
      ...regraOrdemCronologica(rows),
      ...regraSubelementoIncorreto(rows, classificacoes)
    );

    // Regras com consulta a APIs públicas (BrasilAPI + Portal da Transparência)
    const cnpjs = extrairCnpjsUnicos(rows);
    if (cnpjs.length > 0) {
      const [dadosCnpj, sancionados] = await Promise.all([
        consultarCnpjsBrasilApi(cnpjs),
        consultarSancoesCGU(cnpjs, input.apiKeyTransparencia),
      ]);

      // Monta detalhes dos CNPJs
      detalhesExtraidos.cnpjs = cnpjs.map(cnpj => {
        const info = dadosCnpj.get(cnpj);
        return {
          cnpj,
          razao_social: info?.razao_social,
          situacao: info?.descricao_situacao_cadastral,
          data_abertura: info?.data_inicio_atividade,
          porte: info?.porte,
          natureza_juridica: info?.natureza_juridica,
          capital_social: info?.capital_social,
          cnae_principal: info?.cnae_fiscal_descricao,
          socios: info?.qsa?.map(s => ({ nome: s.nome_socio, qualificacao: s.qualificacao_socio }))
        };
      });

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
    // Outros dados extraídos
    detalhesExtraidos.valores = rows.map(r => valorNumerico(r, "valor", "vlr", "montante", "total")).filter(v => v > 0);
    detalhesExtraidos.datas = rows.map(r => campo(r, "data", "dt_empenho", "emissao", "dt_pagamento")).filter(Boolean);
    detalhesExtraidos.empenhos = rows.map(r => campo(r, "empenho", "numero", "nota", "id")).filter(Boolean);
    detalhesExtraidos.nds = rows.map(r => campo(r, "natureza", "nd", "natureza_despesa", "classificacao_despesa")).filter(Boolean);
  } else if (input.conteudoPdf && input.tipo.includes("pdf")) {
    // ── Análise PDF ───────────────────────────────────────────────
    const { extrairTextoPdfPorPagina, extrairImagensPdf } = await import("./pdf_extractor");
    const resultadoPdf = await extrairTextoPdfPorPagina(input.conteudoPdf);
    textoExtraido = resultadoPdf.textoCompleto;
    totalPaginas = resultadoPdf.totalPaginas;
    paginasExtraidas = resultadoPdf.paginas;

    // ── OCR: extrai texto de imagens escaneadas via Workers AI ───
    if (input.ai) {
      try {
        const imagens = extrairImagensPdf(input.conteudoPdf);
        if (imagens.length > 0) {
          const ocrPromises = imagens.slice(0, 10).map(async (img) => {
            try {
              const result = await input.ai!.run("@cf/llava-hf/llava-1.5-7b-hf", {
                image: [...new Uint8Array(img.data)],
                prompt: "Extract ALL text from this scanned document image. Include every word, number, date, and code you can see. Output the raw text only, no descriptions.",
                max_tokens: 2048,
              }) as { description?: string };
              return result?.description || "";
            } catch { return ""; }
          });
          const ocrTextos = await Promise.all(ocrPromises);
          const textoOcr = ocrTextos.filter(t => t.length > 10).join("\n");
          if (textoOcr.length > 0) {
            textoExtraido = (textoExtraido || "") + "\n\n--- TEXTO OCR (imagens escaneadas) ---\n" + textoOcr;
          }
        }
      } catch { /* OCR indisponível — continua com texto digital */ }
    }

    if (textoExtraido.trim().length > 0) {
      const dados = parseTextoLivre(textoExtraido);
      totalRegistros = dados.cnpjs.length || 1;
      valorTotal = dados.valores.reduce((s, v) => s + v, 0);

      // Regras de texto livre
      alertas.push(...regrasTextoLivre(textoExtraido, dados));

      // Regra de subelemento incorreto por análise de texto (Res. TCE/SE 267 + Portaria STN 448/2002)
      alertas.push(...regraSubelementoIncorretoPdf(textoExtraido, classificacoes, regrasDb));

      // Se encontrou CNPJs, aplica regras de CNPJ nos registros sintéticos
      if (dados.rows.length > 0) {
        alertas.push(
          ...regraCnpjInvalido(dados.rows),
          ...regraDispensaSemLicitacao(dados.rows)
        );

        // Consulta APIs para CNPJs encontrados no PDF
        if (dados.cnpjs.length > 0) {
          const [dadosCnpj, sancionados] = await Promise.all([
            consultarCnpjsBrasilApi(dados.cnpjs),
            consultarSancoesCGU(dados.cnpjs, input.apiKeyTransparencia),
          ]);

          detalhesExtraidos.cnpjs = dados.cnpjs.map(cnpj => {
            const info = dadosCnpj.get(cnpj);
            return {
              cnpj,
              razao_social: info?.razao_social,
              situacao: info?.descricao_situacao_cadastral,
              data_abertura: info?.data_inicio_atividade,
              porte: info?.porte,
              natureza_juridica: info?.natureza_juridica,
              capital_social: info?.capital_social,
              cnae_principal: info?.cnae_fiscal_descricao,
              socios: info?.qsa?.map(s => ({ nome: s.nome_socio, qualificacao: s.qualificacao_socio }))
            };
          });

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
        // Outros dados extraídos
        detalhesExtraidos.valores = dados.valores;
        detalhesExtraidos.datas = dados.datas;
        detalhesExtraidos.empenhos = dados.empenhos;
        detalhesExtraidos.nds = dados.nds;
        detalhesExtraidos.termos = dados.termos;
      }
    }
  }

  // Fallback: análise pelo nome quando não há conteúdo parseável
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
      ...(textoExtraido ? { textoExtraido: textoExtraido.substring(0, 15000) } : {}),
      ...(totalPaginas > 0 ? { totalPaginas } : {}),
      ...(paginasExtraidas.length > 0 ? {
        paginas: paginasExtraidas.map(p => ({
          pagina: p.pagina,
          texto: p.texto.substring(0, 5000),
        }))
      } : {}),
    },
    ...(Object.keys(detalhesExtraidos).length > 0 ? { detalhesExtraidos } : {})
  };
}
