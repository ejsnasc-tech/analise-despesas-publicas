export interface Alerta {
  tipo: string;
  descricao: string;
  pontuacao: number;
}

export interface ResultadoAnalise {
  score: number;
  nivel: "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
  alertas: Alerta[];
}

const REGRAS = [
  { nome: "CONTRATO_SEM_LICITACAO", pontos: 10, descricao: "Contrato sem processo licitatório" },
  { nome: "VALOR_ACIMA_LIMITE", pontos: 20, descricao: "Valor acima do limite legal" },
  { nome: "FORNECEDOR_SUSPEITO", pontos: 15, descricao: "Fornecedor com histórico suspeito" },
  { nome: "DUPLICIDADE", pontos: 25, descricao: "Possível pagamento duplicado" },
  { nome: "SUPERFATURAMENTO", pontos: 30, descricao: "Indício de superfaturamento" }
] as const;

function nivelPorScore(score: number): ResultadoAnalise["nivel"] {
  if (score <= 20) return "BAIXO";
  if (score <= 40) return "MEDIO";
  if (score <= 70) return "ALTO";
  return "CRITICO";
}

export function analisarDocumento(input: { nomeArquivo: string; tipo: string; tamanho: number }): ResultadoAnalise {
  const nome = input.nomeArquivo.toLowerCase();
  const tipo = input.tipo.toLowerCase();
  const alertas: Alerta[] = [];

  if (nome.includes("dispensa") || nome.includes("emergencial")) {
    alertas.push({ ...REGRAS[0], tipo: REGRAS[0].nome, pontuacao: REGRAS[0].pontos });
  }
  if (nome.includes("aditivo") || input.tamanho > 5_000_000) {
    alertas.push({ ...REGRAS[1], tipo: REGRAS[1].nome, pontuacao: REGRAS[1].pontos });
  }
  if (nome.includes("consultoria") || tipo.includes("xml")) {
    alertas.push({ ...REGRAS[2], tipo: REGRAS[2].nome, pontuacao: REGRAS[2].pontos });
  }
  if (nome.includes("copia") || nome.includes("duplicado")) {
    alertas.push({ ...REGRAS[3], tipo: REGRAS[3].nome, pontuacao: REGRAS[3].pontos });
  }
  if (nome.includes("superfatur") || input.tamanho > 20_000_000) {
    alertas.push({ ...REGRAS[4], tipo: REGRAS[4].nome, pontuacao: REGRAS[4].pontos });
  }

  const score = Math.min(100, alertas.reduce((total, alerta) => total + alerta.pontuacao, 0));
  return { score, nivel: nivelPorScore(score), alertas };
}
