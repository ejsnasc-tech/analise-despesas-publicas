CREATE TABLE IF NOT EXISTS documentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome_arquivo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  data_upload TEXT NOT NULL,
  status TEXT DEFAULT 'analisando',
  score REAL DEFAULT 0,
  nivel TEXT DEFAULT 'BAIXO',
  alertas TEXT DEFAULT '[]',
  r2_key TEXT,
  usuario TEXT DEFAULT 'andre'
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  nome_completo TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  criado_em TEXT NOT NULL
);

INSERT OR IGNORE INTO usuarios (username, nome_completo, email, password_hash, criado_em)
VALUES ('andre', 'Andre de Jesus Oliveira', '', 'c4776115426be5e3e1a8b79c7adaa7d6af3fc916681881363342b3b5406a6c9c', datetime('now'));

-- ═══════════════════════════════════════════════════════════════
-- Tabela: resolucoes - Normas legais de referência
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS resolucoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,          -- Ex: "PORTARIA_STN_448_2002", "RES_TCE_SE_267_2011"
  tipo TEXT NOT NULL,                   -- "PORTARIA", "RESOLUCAO", "LEI", "DECRETO"
  orgao TEXT NOT NULL,                  -- "STN", "TCE_SE", "SOF"
  numero TEXT NOT NULL,                 -- "448", "267"
  ano INTEGER NOT NULL,                 -- 2002, 2011
  ementa TEXT NOT NULL,                 -- Descrição resumida
  vigente INTEGER DEFAULT 1             -- 1=sim, 0=revogada
);

-- ═══════════════════════════════════════════════════════════════
-- Tabela: elementos_despesa - Portaria STN 448/2002 + 163/2001
-- Classificação de elementos e subelementos de despesa
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS elementos_despesa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL,                 -- "319011", "31901101", etc. (sem pontos)
  codigo_formatado TEXT NOT NULL,       -- "3.1.90.11", "3.1.90.11.01"
  nivel TEXT NOT NULL,                  -- "ELEMENTO" ou "SUBELEMENTO"
  descricao TEXT NOT NULL,              -- "Vencimentos e Vantagens Fixas"
  vinculos TEXT NOT NULL,               -- JSON: ["EFETIVO","COMISSIONADO"] - tipos de servidor
  resolucao_id INTEGER,                -- FK para resolucoes
  observacao TEXT,                      -- Notas adicionais
  UNIQUE(codigo)
);

-- ═══════════════════════════════════════════════════════════════
-- Tabela: regras_classificacao - Res. TCE/SE 267/2011
-- Regras de validação cruzada vínculo × classificação
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS regras_classificacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_ato TEXT NOT NULL,               -- "RESCISAO", "FERIAS", "13_SALARIO", "VENCIMENTO"
  vinculo_servidor TEXT NOT NULL,       -- "EFETIVO", "COMISSIONADO", "TEMPORARIO"
  elemento_correto TEXT NOT NULL,       -- "319094", "319011", "319004"
  subelemento_correto TEXT,             -- "01", "03", "04"
  codigo_completo TEXT NOT NULL,        -- "31909401"
  descricao TEXT NOT NULL,              -- "Indenizações e Restituições Trabalhistas"
  fundamentacao TEXT NOT NULL,          -- "Portaria STN 448/2002, Art. X + Res. TCE/SE 267/2011"
  resolucao_id INTEGER
);

-- ═══════════════════════════════════════════════════════════════
-- DADOS: Resoluções e Portarias
-- ═══════════════════════════════════════════════════════════════
INSERT OR IGNORE INTO resolucoes (codigo, tipo, orgao, numero, ano, ementa) VALUES
('PORTARIA_STN_448_2002', 'PORTARIA', 'STN', '448', 2002,
 'Divulga o detalhamento das naturezas de despesas 339030, 339036, 339039 e demais elementos, fixando subelementos de despesa conforme classificação orçamentária federal'),
('RES_TCE_SE_267_2011', 'RESOLUCAO', 'TCE_SE', '267', 2011,
 'Dispõe sobre critérios de classificação de despesas com pessoal no âmbito do Estado de Sergipe e seus municípios, vinculando tipo de servidor ao elemento/subelemento correto'),
('PORTARIA_STN_SOF_163_2001', 'PORTARIA', 'STN_SOF', '163', 2001,
 'Dispõe sobre normas gerais de consolidação das Contas Públicas. Define a estrutura da classificação da natureza da receita e da despesa (C.G.MM.EE.SS)'),
('LEI_4320_1964', 'LEI', 'FEDERAL', '4320', 1964,
 'Estatui normas gerais de direito financeiro para elaboração e controle dos orçamentos e balanços da União, dos Estados, dos Municípios e do DF'),
('LEI_14133_2021', 'LEI', 'FEDERAL', '14133', 2021,
 'Lei de Licitações e Contratos Administrativos');

-- ═══════════════════════════════════════════════════════════════
-- DADOS: Elementos de Despesa (Portaria STN 448/2002 + 163/2001)
-- Categoria 3 (Despesas Correntes), Grupo 1 (Pessoal e Encargos)
-- ═══════════════════════════════════════════════════════════════

-- ── Elemento 3.1.90.04 - Contratação por Tempo Determinado ──
INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('319004', '3.1.90.04', 'ELEMENTO', 'Contratação por Tempo Determinado', '["TEMPORARIO"]',
 'Despesas com contratação de pessoal por tempo determinado para atender necessidade temporária de excepcional interesse público (CF, art. 37, IX; Lei 8.745/93)'),
('31900401', '3.1.90.04.01', 'SUBELEMENTO', 'Vencimento ou Salário', '["TEMPORARIO"]', NULL),
('31900406', '3.1.90.04.06', 'SUBELEMENTO', 'Gratificações por Exercício de Funções', '["TEMPORARIO"]', NULL),
('31900413', '3.1.90.04.13', 'SUBELEMENTO', 'Adicional Noturno', '["TEMPORARIO"]', NULL),
('31900414', '3.1.90.04.14', 'SUBELEMENTO', 'Adicional de Insalubridade', '["TEMPORARIO"]', NULL),
('31900415', '3.1.90.04.15', 'SUBELEMENTO', 'Adicional de Periculosidade', '["TEMPORARIO"]', NULL),
('31900422', '3.1.90.04.22', 'SUBELEMENTO', '13º Salário', '["TEMPORARIO"]', NULL),
('31900425', '3.1.90.04.25', 'SUBELEMENTO', 'Férias - Abono Constitucional (1/3)', '["TEMPORARIO"]', NULL),
('31900499', '3.1.90.04.99', 'SUBELEMENTO', 'Outras Despesas de Contratação Temporária', '["TEMPORARIO"]', NULL),

-- ── Elemento 3.1.90.11 - Vencimentos e Vantagens Fixas ──
('319011', '3.1.90.11', 'ELEMENTO', 'Vencimentos e Vantagens Fixas - Pessoal Civil', '["EFETIVO","COMISSIONADO"]',
 'Despesas com vencimentos, vantagens fixas, 13º, férias e demais verbas remuneratórias de pessoal civil efetivo e comissionado'),
('31901101', '3.1.90.11.01', 'SUBELEMENTO', 'Vencimento', '["EFETIVO","COMISSIONADO"]', NULL),
('31901102', '3.1.90.11.02', 'SUBELEMENTO', 'Salário-Família', '["EFETIVO","COMISSIONADO"]', NULL),
('31901103', '3.1.90.11.03', 'SUBELEMENTO', 'Gratificação pela Chefia ou Direção (FG/DAS)', '["EFETIVO","COMISSIONADO"]', NULL),
('31901104', '3.1.90.11.04', 'SUBELEMENTO', 'Gratificação por Exercício de Funções', '["EFETIVO","COMISSIONADO"]', NULL),
('31901105', '3.1.90.11.05', 'SUBELEMENTO', 'Gratificação de Tempo de Serviço (anuênio/quinquênio)', '["EFETIVO"]',
 'Apenas servidores efetivos com tempo de serviço'),
('31901106', '3.1.90.11.06', 'SUBELEMENTO', 'Gratificação por Regime Especial de Trabalho', '["EFETIVO","COMISSIONADO"]', NULL),
('31901107', '3.1.90.11.07', 'SUBELEMENTO', 'Gratificação de Representação de Gabinete', '["COMISSIONADO"]', NULL),
('31901108', '3.1.90.11.08', 'SUBELEMENTO', 'Gratificação Adicional de Tempo de Serviço', '["EFETIVO"]', NULL),
('31901109', '3.1.90.11.09', 'SUBELEMENTO', 'Gratificação de Magistério', '["EFETIVO"]', NULL),
('31901113', '3.1.90.11.13', 'SUBELEMENTO', 'Adicional Noturno', '["EFETIVO","COMISSIONADO"]', NULL),
('31901114', '3.1.90.11.14', 'SUBELEMENTO', 'Adicional de Insalubridade', '["EFETIVO","COMISSIONADO"]', NULL),
('31901115', '3.1.90.11.15', 'SUBELEMENTO', 'Adicional de Periculosidade', '["EFETIVO","COMISSIONADO"]', NULL),
('31901122', '3.1.90.11.22', 'SUBELEMENTO', '13º Salário', '["EFETIVO","COMISSIONADO"]', NULL),
('31901125', '3.1.90.11.25', 'SUBELEMENTO', 'Férias - Abono Constitucional (1/3)', '["EFETIVO","COMISSIONADO"]', NULL),
('31901126', '3.1.90.11.26', 'SUBELEMENTO', 'Férias - Abono Pecuniário', '["EFETIVO","COMISSIONADO"]', NULL),
('31901129', '3.1.90.11.29', 'SUBELEMENTO', 'Adicional de Férias', '["EFETIVO","COMISSIONADO"]', NULL),
('31901130', '3.1.90.11.30', 'SUBELEMENTO', 'Subsídio (Lei 11.784/2008)', '["EFETIVO","COMISSIONADO"]', NULL),
('31901199', '3.1.90.11.99', 'SUBELEMENTO', 'Outras Vantagens Fixas', '["EFETIVO","COMISSIONADO"]', NULL),

-- ── Elemento 3.1.90.13 - Obrigações Patronais ──
('319013', '3.1.90.13', 'ELEMENTO', 'Obrigações Patronais', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Contribuições patronais (INSS, FGTS, PIS/PASEP) incidentes sobre a folha de pagamento'),
('31901301', '3.1.90.13.01', 'SUBELEMENTO', 'FGTS', '["EFETIVO","COMISSIONADO","TEMPORARIO"]', NULL),
('31901302', '3.1.90.13.02', 'SUBELEMENTO', 'Contribuições Previdenciárias - INSS', '["EFETIVO","COMISSIONADO","TEMPORARIO"]', NULL),
('31901304', '3.1.90.13.04', 'SUBELEMENTO', 'Contribuição para o PIS/PASEP', '["EFETIVO","COMISSIONADO","TEMPORARIO"]', NULL),
('31901399', '3.1.90.13.99', 'SUBELEMENTO', 'Outras Obrigações Patronais', '["EFETIVO","COMISSIONADO","TEMPORARIO"]', NULL),

-- ── Elemento 3.1.90.16 - Outras Despesas Variáveis ──
('319016', '3.1.90.16', 'ELEMENTO', 'Outras Despesas Variáveis - Pessoal Civil', '["EFETIVO","COMISSIONADO"]',
 'Horas extras, substituições e outras despesas variáveis de pessoal civil'),
('31901601', '3.1.90.16.01', 'SUBELEMENTO', 'Horas Extras', '["EFETIVO","COMISSIONADO"]', NULL),
('31901602', '3.1.90.16.02', 'SUBELEMENTO', 'Substituições', '["EFETIVO","COMISSIONADO"]', NULL),
('31901699', '3.1.90.16.99', 'SUBELEMENTO', 'Outras Despesas Variáveis', '["EFETIVO","COMISSIONADO"]', NULL),

-- ── Elemento 3.1.90.34 - Outras Despesas de Pessoal (Terceirização) ──
('319034', '3.1.90.34', 'ELEMENTO', 'Outras Despesas de Pessoal decorrentes de Contratos de Terceirização', '["TERCEIRIZADO"]',
 'Despesas com contratos de terceirização de mão-de-obra que se refiram à substituição de servidores e empregados públicos'),

-- ── Elemento 3.1.90.91 - Sentenças Judiciais ──
('319091', '3.1.90.91', 'ELEMENTO', 'Sentenças Judiciais (Pessoal)', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Pagamento de sentenças judiciais transitadas em julgado de natureza trabalhista'),

-- ── Elemento 3.1.90.92 - Despesas de Exercícios Anteriores ──
('319092', '3.1.90.92', 'ELEMENTO', 'Despesas de Exercícios Anteriores (Pessoal)', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Despesas de pessoal referentes a exercícios anteriores (Art. 37, Lei 4.320/64)'),

-- ── Elemento 3.1.90.94 - Indenizações e Restituições Trabalhistas ──
('319094', '3.1.90.94', 'ELEMENTO', 'Indenizações e Restituições Trabalhistas', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Despesas com rescisões, indenizações, aviso prévio, férias indenizadas, 13º proporcional e multa FGTS'),
('31909401', '3.1.90.94.01', 'SUBELEMENTO', 'Indenização (Aviso Prévio Indenizado)', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Valor pago como aviso prévio indenizado na rescisão contratual'),
('31909402', '3.1.90.94.02', 'SUBELEMENTO', 'Restituições Trabalhistas', '["EFETIVO","COMISSIONADO","TEMPORARIO"]', NULL),
('31909403', '3.1.90.94.03', 'SUBELEMENTO', 'Férias Indenizadas', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Férias vencidas e proporcionais pagas na rescisão (não confundir com 3.1.90.11.25 que é férias em gozo)'),
('31909404', '3.1.90.94.04', 'SUBELEMENTO', '13º Salário Proporcional na Rescisão', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 '13º proporcional pago na rescisão (não confundir com 3.1.90.11.22 que é 13º regular)'),
('31909405', '3.1.90.94.05', 'SUBELEMENTO', 'Multa sobre FGTS (40%)', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Multa rescisória de 40% sobre o saldo do FGTS'),
('31909499', '3.1.90.94.99', 'SUBELEMENTO', 'Outras Indenizações Trabalhistas', '["EFETIVO","COMISSIONADO","TEMPORARIO"]', NULL),

-- ── Elemento 3.1.90.96 - Ressarcimento de Pessoal Requisitado ──
('319096', '3.1.90.96', 'ELEMENTO', 'Ressarcimento de Despesas de Pessoal Requisitado', '["EFETIVO"]',
 'Ressarcimento ao órgão cedente das despesas com servidor cedido/requisitado'),

-- ── Elemento 3.1.91.13 - Obrigações Patronais Intra-Orçamentárias ──
('319113', '3.1.91.13', 'ELEMENTO', 'Obrigações Patronais - Operações Intra-Orçamentárias', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Contribuições patronais ao RPPS do ente (intra-orçamentária)');

-- ═══════════════════════════════════════════════════════════════
-- DADOS: Regras de classificação (Res. TCE/SE 267/2011)
-- Tipo de ato × Vínculo → Classificação correta
-- ═══════════════════════════════════════════════════════════════
INSERT OR IGNORE INTO regras_classificacao (tipo_ato, vinculo_servidor, elemento_correto, subelemento_correto, codigo_completo, descricao, fundamentacao) VALUES
-- Rescisão
('RESCISAO', 'EFETIVO', '319094', '01', '31909401', 'Indenizações e Restituições Trabalhistas - Aviso Prévio', 'Portaria STN 448/2002 + Res. TCE/SE 267/2011'),
('RESCISAO', 'COMISSIONADO', '319094', '01', '31909401', 'Indenizações e Restituições Trabalhistas - Aviso Prévio', 'Portaria STN 448/2002 + Res. TCE/SE 267/2011'),
('RESCISAO', 'TEMPORARIO', '319094', '01', '31909401', 'Indenizações e Restituições Trabalhistas - Aviso Prévio', 'Portaria STN 448/2002 + Res. TCE/SE 267/2011'),
-- Férias indenizadas (na rescisão)
('FERIAS_INDENIZADAS', 'EFETIVO', '319094', '03', '31909403', 'Férias Indenizadas', 'Portaria STN 448/2002 + Res. TCE/SE 267/2011. NÃO usar 3.1.90.11.25 (férias em gozo)'),
('FERIAS_INDENIZADAS', 'COMISSIONADO', '319094', '03', '31909403', 'Férias Indenizadas', 'Portaria STN 448/2002'),
('FERIAS_INDENIZADAS', 'TEMPORARIO', '319094', '03', '31909403', 'Férias Indenizadas', 'Portaria STN 448/2002'),
-- 13º proporcional na rescisão
('13_PROPORCIONAL_RESCISAO', 'EFETIVO', '319094', '04', '31909404', '13º Salário Proporcional na Rescisão', 'Portaria STN 448/2002. NÃO usar 3.1.90.11.22 (13º regular)'),
('13_PROPORCIONAL_RESCISAO', 'COMISSIONADO', '319094', '04', '31909404', '13º Salário Proporcional na Rescisão', 'Portaria STN 448/2002'),
('13_PROPORCIONAL_RESCISAO', 'TEMPORARIO', '319094', '04', '31909404', '13º Salário Proporcional na Rescisão', 'Portaria STN 448/2002'),
-- Multa FGTS na rescisão
('MULTA_FGTS', 'EFETIVO', '319094', '05', '31909405', 'Multa sobre FGTS (40%)', 'Portaria STN 448/2002 + CLT art. 18 Lei 8.036/90'),
('MULTA_FGTS', 'COMISSIONADO', '319094', '05', '31909405', 'Multa sobre FGTS (40%)', 'Portaria STN 448/2002'),
('MULTA_FGTS', 'TEMPORARIO', '319094', '05', '31909405', 'Multa sobre FGTS (40%)', 'Portaria STN 448/2002'),
-- Vencimento regular
('VENCIMENTO', 'EFETIVO', '319011', '01', '31901101', 'Vencimento', 'Portaria STN 448/2002 + Res. TCE/SE 267/2011'),
('VENCIMENTO', 'COMISSIONADO', '319011', '01', '31901101', 'Vencimento ou Subsídio', 'Portaria STN 448/2002 + Res. TCE/SE 267/2011'),
('VENCIMENTO', 'TEMPORARIO', '319004', '01', '31900401', 'Contratação por Tempo Determinado - Vencimento', 'Portaria STN 448/2002. TEMPORÁRIO NÃO usa 3.1.90.11'),
-- 13º salário regular
('13_SALARIO', 'EFETIVO', '319011', '22', '31901122', '13º Salário', 'Portaria STN 448/2002'),
('13_SALARIO', 'COMISSIONADO', '319011', '22', '31901122', '13º Salário', 'Portaria STN 448/2002'),
('13_SALARIO', 'TEMPORARIO', '319004', '22', '31900422', '13º Salário (Temporário)', 'Portaria STN 448/2002. Temporário usa elemento 04, não 11'),
-- Férias em gozo
('FERIAS', 'EFETIVO', '319011', '25', '31901125', 'Férias - Abono Constitucional (1/3)', 'Portaria STN 448/2002'),
('FERIAS', 'COMISSIONADO', '319011', '25', '31901125', 'Férias - Abono Constitucional (1/3)', 'Portaria STN 448/2002'),
('FERIAS', 'TEMPORARIO', '319004', '25', '31900425', 'Férias - Abono Constitucional (Temporário)', 'Portaria STN 448/2002. Temporário usa elemento 04'),
-- Horas extras
('HORAS_EXTRAS', 'EFETIVO', '319016', '01', '31901601', 'Horas Extras', 'Portaria STN 448/2002'),
('HORAS_EXTRAS', 'COMISSIONADO', '319016', '01', '31901601', 'Horas Extras', 'Portaria STN 448/2002'),
-- Obrigações patronais
('OBRIGACAO_PATRONAL_INSS', 'EFETIVO', '319013', '02', '31901302', 'Contribuições Previdenciárias - INSS', 'Portaria STN 448/2002'),
('OBRIGACAO_PATRONAL_INSS', 'COMISSIONADO', '319013', '02', '31901302', 'Contribuições Previdenciárias - INSS', 'Portaria STN 448/2002'),
('OBRIGACAO_PATRONAL_INSS', 'TEMPORARIO', '319013', '02', '31901302', 'Contribuições Previdenciárias - INSS', 'Portaria STN 448/2002'),
('OBRIGACAO_PATRONAL_FGTS', 'EFETIVO', '319013', '01', '31901301', 'FGTS', 'Portaria STN 448/2002'),
('OBRIGACAO_PATRONAL_FGTS', 'COMISSIONADO', '319013', '01', '31901301', 'FGTS', 'Portaria STN 448/2002'),
('OBRIGACAO_PATRONAL_FGTS', 'TEMPORARIO', '319013', '01', '31901301', 'FGTS', 'Portaria STN 448/2002');
