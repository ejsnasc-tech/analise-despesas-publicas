-- ═══════════════════════════════════════════════════════════════
-- SEED COMPLETO: Todos os elementos e subelementos de despesa
-- Portaria STN 448/2002, Portaria 163/2001, Manual SIAFI
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 3 - DESPESAS CORRENTES
-- GRUPO 3 - OUTRAS DESPESAS CORRENTES
-- Modalidade 90 - Aplicações Diretas
-- ═══════════════════════════════════════════════════════════════

-- ── 3.3.90.14 - Diárias ──────────────────────────────────────
INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('339014', '3.3.90.14', 'ELEMENTO', 'Diárias - Civil', '["GERAL"]',
 'Cobertura de despesas com pousada, alimentação e locomoção urbana do servidor a serviço fora de sua sede. Manual CGM: exige relatório de viagem em 5 dias úteis.'),
('33901401', '3.3.90.14.01', 'SUBELEMENTO', 'Diárias no País', '["GERAL"]', NULL),
('33901402', '3.3.90.14.02', 'SUBELEMENTO', 'Diárias no Exterior', '["GERAL"]', NULL),

-- ── 3.3.90.15 - Diárias Militar ──────────────────────────────
('339015', '3.3.90.15', 'ELEMENTO', 'Diárias - Militar', '["MILITAR"]', NULL),

-- ── 3.3.90.18 - Auxílio Financeiro a Estudantes ─────────────
('339018', '3.3.90.18', 'ELEMENTO', 'Auxílio Financeiro a Estudantes', '["GERAL"]',
 'Bolsas de estudo, auxílio-transporte e alimentação a estudantes'),

-- ── 3.3.90.20 - Auxílio Financeiro a Pesquisadores ──────────
('339020', '3.3.90.20', 'ELEMENTO', 'Auxílio Financeiro a Pesquisadores', '["GERAL"]', NULL),

-- ── 3.3.90.30 - Material de Consumo ─────────────────────────
('339030', '3.3.90.30', 'ELEMENTO', 'Material de Consumo', '["GERAL"]',
 'Aquisição de materiais que, em razão de seu uso corrente, perdem normalmente sua identidade física e/ou têm sua utilização limitada a dois anos. Portaria STN 448/2002 Art. 2º.'),
('33903001', '3.3.90.30.01', 'SUBELEMENTO', 'Combustíveis e Lubrificantes Automotivos', '["GERAL"]', 'Gasolina, diesel, etanol, GNV, lubrificantes'),
('33903002', '3.3.90.30.02', 'SUBELEMENTO', 'Combustíveis e Lubrificantes de Aviação', '["GERAL"]', NULL),
('33903003', '3.3.90.30.03', 'SUBELEMENTO', 'Combustíveis e Lubrificantes para Outras Finalidades', '["GERAL"]', 'GLP, lenha, carvão'),
('33903004', '3.3.90.30.04', 'SUBELEMENTO', 'Gás e Outros Materiais Engarrafados', '["GERAL"]', 'Oxigênio, acetileno, nitrogênio'),
('33903005', '3.3.90.30.05', 'SUBELEMENTO', 'Explosivos e Munições', '["GERAL"]', NULL),
('33903006', '3.3.90.30.06', 'SUBELEMENTO', 'Alimentos para Animais', '["GERAL"]', 'Ração, sal mineral'),
('33903007', '3.3.90.30.07', 'SUBELEMENTO', 'Gêneros de Alimentação', '["GERAL"]', 'Carnes, cereais, frutas, verduras, café, açúcar, merenda escolar'),
('33903008', '3.3.90.30.08', 'SUBELEMENTO', 'Animais para Pesquisa e Abate', '["GERAL"]', NULL),
('33903009', '3.3.90.30.09', 'SUBELEMENTO', 'Material Farmacológico', '["GERAL"]', 'Medicamentos, soros, vacinas'),
('33903010', '3.3.90.30.10', 'SUBELEMENTO', 'Material Odontológico', '["GERAL"]', NULL),
('33903011', '3.3.90.30.11', 'SUBELEMENTO', 'Material Químico', '["GERAL"]', 'Reagentes, solventes, cloro'),
('33903012', '3.3.90.30.12', 'SUBELEMENTO', 'Material de Couros e Peles', '["GERAL"]', NULL),
('33903013', '3.3.90.30.13', 'SUBELEMENTO', 'Material de Caça e Pesca', '["GERAL"]', NULL),
('33903014', '3.3.90.30.14', 'SUBELEMENTO', 'Material Educativo e Esportivo', '["GERAL"]', 'Livros didáticos, bolas, redes'),
('33903015', '3.3.90.30.15', 'SUBELEMENTO', 'Material para Festividades e Homenagens', '["GERAL"]', NULL),
('33903016', '3.3.90.30.16', 'SUBELEMENTO', 'Material de Expediente', '["GERAL"]', 'Papel, canetas, envelopes, toner, grampos, pastas, clipes'),
('33903017', '3.3.90.30.17', 'SUBELEMENTO', 'Material de Processamento de Dados', '["GERAL"]', 'Pen drives, HD externo, mídias, cabos, teclados, mouses (consumo)'),
('33903019', '3.3.90.30.19', 'SUBELEMENTO', 'Material de Acondicionamento e Embalagem', '["GERAL"]', NULL),
('33903020', '3.3.90.30.20', 'SUBELEMENTO', 'Material de Cama, Mesa e Banho', '["GERAL"]', NULL),
('33903021', '3.3.90.30.21', 'SUBELEMENTO', 'Material de Copa e Cozinha', '["GERAL"]', 'Copos, pratos, talheres, panelas'),
('33903022', '3.3.90.30.22', 'SUBELEMENTO', 'Material de Limpeza e Produção de Higienização', '["GERAL"]', 'Detergente, desinfetante, sabão, papel higiênico, álcool'),
('33903023', '3.3.90.30.23', 'SUBELEMENTO', 'Uniformes, Tecidos e Aviamentos', '["GERAL"]', NULL),
('33903024', '3.3.90.30.24', 'SUBELEMENTO', 'Material para Manutenção de Bens Imóveis', '["GERAL"]', 'Cimento, areia, tintas, ferragens, canos, conexões'),
('33903025', '3.3.90.30.25', 'SUBELEMENTO', 'Material para Manutenção de Bens Móveis', '["GERAL"]', 'Peças, parafusos, soldas'),
('33903026', '3.3.90.30.26', 'SUBELEMENTO', 'Material Elétrico e Eletrônico', '["GERAL"]', 'Fios, lâmpadas, reatores, disjuntores, tomadas'),
('33903027', '3.3.90.30.27', 'SUBELEMENTO', 'Material de Manobra e Patrulhamento', '["GERAL"]', NULL),
('33903028', '3.3.90.30.28', 'SUBELEMENTO', 'Material de Proteção e Segurança', '["GERAL"]', 'EPIs: luvas, capacetes, botas, óculos'),
('33903029', '3.3.90.30.29', 'SUBELEMENTO', 'Material para Áudio, Vídeo e Foto', '["GERAL"]', NULL),
('33903030', '3.3.90.30.30', 'SUBELEMENTO', 'Material para Comunicações', '["GERAL"]', 'Cabos de rede, conectores, patch cords'),
('33903031', '3.3.90.30.31', 'SUBELEMENTO', 'Sementes, Mudas de Plantas e Insumos', '["GERAL"]', NULL),
('33903032', '3.3.90.30.32', 'SUBELEMENTO', 'Suprimento de Aviação', '["GERAL"]', NULL),
('33903033', '3.3.90.30.33', 'SUBELEMENTO', 'Material para Produção Industrial', '["GERAL"]', NULL),
('33903035', '3.3.90.30.35', 'SUBELEMENTO', 'Material Laboratorial', '["GERAL"]', NULL),
('33903036', '3.3.90.30.36', 'SUBELEMENTO', 'Material Hospitalar', '["GERAL"]', 'Seringas, luvas cirúrgicas, curativos, sondas'),
('33903039', '3.3.90.30.39', 'SUBELEMENTO', 'Material para Manutenção de Veículos', '["GERAL"]', 'Pneus, câmaras, filtros, correias, óleo de motor'),
('33903041', '3.3.90.30.41', 'SUBELEMENTO', 'Material para Utilização em Gráfica', '["GERAL"]', NULL),
('33903042', '3.3.90.30.42', 'SUBELEMENTO', 'Ferramentas', '["GERAL"]', 'Martelos, chaves, alicates, serras (de consumo)'),
('33903044', '3.3.90.30.44', 'SUBELEMENTO', 'Material de Sinalização Visual e Afins', '["GERAL"]', 'Placas, cones, fitas'),
('33903046', '3.3.90.30.46', 'SUBELEMENTO', 'Material Bibliográfico não Imobilizável', '["GERAL"]', 'Jornais, revistas, periódicos'),
('33903050', '3.3.90.30.50', 'SUBELEMENTO', 'Bandeiras, Flâmulas e Insígnias', '["GERAL"]', NULL),
('33903099', '3.3.90.30.99', 'SUBELEMENTO', 'Outros Materiais de Consumo', '["GERAL"]', NULL),

-- ── 3.3.90.31 - Premiações ──────────────────────────────────
('339031', '3.3.90.31', 'ELEMENTO', 'Premiações Culturais, Artísticas, Científicas, Desportivas e Outras', '["GERAL"]', NULL),

-- ── 3.3.90.32 - Material, Bem ou Serviço p/ Distribuição Gratuita
('339032', '3.3.90.32', 'ELEMENTO', 'Material, Bem ou Serviço para Distribuição Gratuita', '["GERAL"]',
 'Aquisição de materiais/bens para distribuição gratuita (cestas básicas, kits, etc.)'),

-- ── 3.3.90.33 - Passagens e Despesas com Locomoção ──────────
('339033', '3.3.90.33', 'ELEMENTO', 'Passagens e Despesas com Locomoção', '["GERAL"]',
 'Aquisição de passagens, taxas de embarque, pedágios, seguros e despesas com locomoção'),
('33903301', '3.3.90.33.01', 'SUBELEMENTO', 'Passagens para o País', '["GERAL"]', NULL),
('33903302', '3.3.90.33.02', 'SUBELEMENTO', 'Passagens para o Exterior', '["GERAL"]', NULL),
('33903303', '3.3.90.33.03', 'SUBELEMENTO', 'Locomoção Urbana (táxi, aplicativos)', '["GERAL"]', NULL),
('33903399', '3.3.90.33.99', 'SUBELEMENTO', 'Outras Despesas com Locomoção', '["GERAL"]', NULL),

-- ── 3.3.90.34 - Outras Despesas de Pessoal (Terceirização) ──
-- Já existe como 319034 para pessoal. Este é o de custeio.

-- ── 3.3.90.35 - Serviços de Consultoria ─────────────────────
('339035', '3.3.90.35', 'ELEMENTO', 'Serviços de Consultoria', '["GERAL"]',
 'Consultoria técnica/especializada. Exige TR, pesquisa de preços e justificativa.'),

-- ── 3.3.90.36 - Outros Serviços de Terceiros - PF ──────────
('339036', '3.3.90.36', 'ELEMENTO', 'Outros Serviços de Terceiros - Pessoa Física', '["GERAL"]',
 'Serviços prestados por pessoa física. Exige retenção de INSS (11%) e IR na fonte. Portaria STN 448/2002.'),
('33903601', '3.3.90.36.01', 'SUBELEMENTO', 'Assessoria e Consultoria Técnica ou Jurídica', '["GERAL"]', NULL),
('33903602', '3.3.90.36.02', 'SUBELEMENTO', 'Instrutoria', '["GERAL"]', 'Cursos, treinamentos, palestras'),
('33903604', '3.3.90.36.04', 'SUBELEMENTO', 'Comissões e Corretagens', '["GERAL"]', NULL),
('33903605', '3.3.90.36.05', 'SUBELEMENTO', 'Serviços Técnicos Profissionais', '["GERAL"]', 'Engenharia, contabilidade, advocacia, medicina'),
('33903606', '3.3.90.36.06', 'SUBELEMENTO', 'Estagiários', '["GERAL"]', 'Bolsa-estágio'),
('33903607', '3.3.90.36.07', 'SUBELEMENTO', 'Mão de Obra para Manutenção de Bens Imóveis', '["GERAL"]', 'Pedreiro, eletricista, encanador, pintor'),
('33903608', '3.3.90.36.08', 'SUBELEMENTO', 'Mão de Obra para Manutenção de Bens Móveis', '["GERAL"]', NULL),
('33903610', '3.3.90.36.10', 'SUBELEMENTO', 'Locação de Mão de Obra', '["GERAL"]', NULL),
('33903615', '3.3.90.36.15', 'SUBELEMENTO', 'Serviços de Copa e Cozinha', '["GERAL"]', NULL),
('33903620', '3.3.90.36.20', 'SUBELEMENTO', 'Serviços Médicos e Hospitalares', '["GERAL"]', NULL),
('33903622', '3.3.90.36.22', 'SUBELEMENTO', 'Serviços de Limpeza e Conservação', '["GERAL"]', NULL),
('33903625', '3.3.90.36.25', 'SUBELEMENTO', 'Serviços de Transporte', '["GERAL"]', 'Fretes, carretos'),
('33903635', '3.3.90.36.35', 'SUBELEMENTO', 'Serviços de Apoio Administrativo', '["GERAL"]', NULL),
('33903699', '3.3.90.36.99', 'SUBELEMENTO', 'Outros Serviços de Terceiros - PF', '["GERAL"]', NULL),

-- ── 3.3.90.37 - Locação de Mão de Obra ──────────────────────
('339037', '3.3.90.37', 'ELEMENTO', 'Locação de Mão de Obra', '["GERAL"]',
 'Despesas com prestação de serviços por empresa interposta (terceirização de atividade-meio). Exige retenção INSS/ISS/IR.'),
('33903701', '3.3.90.37.01', 'SUBELEMENTO', 'Apoio Administrativo, Técnico e Operacional', '["GERAL"]', NULL),
('33903702', '3.3.90.37.02', 'SUBELEMENTO', 'Limpeza e Conservação', '["GERAL"]', NULL),
('33903703', '3.3.90.37.03', 'SUBELEMENTO', 'Vigilância Ostensiva', '["GERAL"]', NULL),
('33903704', '3.3.90.37.04', 'SUBELEMENTO', 'Manutenção e Conservação de Bens Imóveis', '["GERAL"]', NULL),
('33903705', '3.3.90.37.05', 'SUBELEMENTO', 'Serviços de Copa e Cozinha', '["GERAL"]', NULL),
('33903706', '3.3.90.37.06', 'SUBELEMENTO', 'Manutenção e Conservação de Bens Móveis', '["GERAL"]', NULL),
('33903707', '3.3.90.37.07', 'SUBELEMENTO', 'Brigada de Incêndio', '["GERAL"]', NULL),
('33903799', '3.3.90.37.99', 'SUBELEMENTO', 'Outros Serviços de Locação de Mão de Obra', '["GERAL"]', NULL),

-- ── 3.3.90.38 - Arrendamento Mercantil ──────────────────────
('339038', '3.3.90.38', 'ELEMENTO', 'Arrendamento Mercantil', '["GERAL"]',
 'Leasing de veículos, equipamentos e máquinas'),

-- ── 3.3.90.39 - Outros Serviços de Terceiros - PJ ──────────
('339039', '3.3.90.39', 'ELEMENTO', 'Outros Serviços de Terceiros - Pessoa Jurídica', '["GERAL"]',
 'Serviços prestados por pessoa jurídica. Maior volume de empenhos em geral. Portaria STN 448/2002.'),
('33903901', '3.3.90.39.01', 'SUBELEMENTO', 'Assinaturas de Periódicos e Anuidades', '["GERAL"]', NULL),
('33903902', '3.3.90.39.02', 'SUBELEMENTO', 'Exposições, Congressos e Conferências', '["GERAL"]', NULL),
('33903903', '3.3.90.39.03', 'SUBELEMENTO', 'Comissões e Corretagens', '["GERAL"]', NULL),
('33903905', '3.3.90.39.05', 'SUBELEMENTO', 'Serviços Técnicos Profissionais', '["GERAL"]', 'Contabilidade, auditoria, engenharia, advocacia'),
('33903908', '3.3.90.39.08', 'SUBELEMENTO', 'Manutenção de Software', '["GERAL"]', 'Licenças, suporte, atualização de sistemas'),
('33903910', '3.3.90.39.10', 'SUBELEMENTO', 'Locação de Imóveis', '["GERAL"]', 'Aluguel de salas, galpões, terrenos'),
('33903911', '3.3.90.39.11', 'SUBELEMENTO', 'Locação de Máquinas e Equipamentos', '["GERAL"]', 'Impressoras, copiadoras, ar condicionado'),
('33903912', '3.3.90.39.12', 'SUBELEMENTO', 'Locação de Veículos', '["GERAL"]', 'Locação de frotas, ambulâncias, vans'),
('33903914', '3.3.90.39.14', 'SUBELEMENTO', 'Locação de Bens Móveis e Intangíveis', '["GERAL"]', NULL),
('33903916', '3.3.90.39.16', 'SUBELEMENTO', 'Manutenção e Conservação de Bens Imóveis', '["GERAL"]', NULL),
('33903917', '3.3.90.39.17', 'SUBELEMENTO', 'Manutenção e Conservação de Máquinas e Equipamentos', '["GERAL"]', NULL),
('33903919', '3.3.90.39.19', 'SUBELEMENTO', 'Manutenção e Conservação de Veículos', '["GERAL"]', 'Oficina, funilaria, borracharia'),
('33903920', '3.3.90.39.20', 'SUBELEMENTO', 'Manutenção e Conservação de Bens Móveis de Outras Naturezas', '["GERAL"]', NULL),
('33903922', '3.3.90.39.22', 'SUBELEMENTO', 'Exposição e Publicidade', '["GERAL"]', NULL),
('33903941', '3.3.90.39.41', 'SUBELEMENTO', 'Fornecimento de Alimentação', '["GERAL"]', 'Refeições prontas, marmitas, coffee break, merenda (empresa)'),
('33903943', '3.3.90.39.43', 'SUBELEMENTO', 'Serviços de Energia Elétrica', '["GERAL"]', NULL),
('33903944', '3.3.90.39.44', 'SUBELEMENTO', 'Serviços de Água e Esgoto', '["GERAL"]', NULL),
('33903945', '3.3.90.39.45', 'SUBELEMENTO', 'Serviços de Telecomunicação (Telefonia)', '["GERAL"]', NULL),
('33903947', '3.3.90.39.47', 'SUBELEMENTO', 'Serviços de Comunicação em Geral', '["GERAL"]', 'Internet, correios, portaria'),
('33903948', '3.3.90.39.48', 'SUBELEMENTO', 'Serviços de Seleção e Treinamento', '["GERAL"]', 'Concursos públicos, processos seletivos, capacitação'),
('33903949', '3.3.90.39.49', 'SUBELEMENTO', 'Produções Jornalísticas', '["GERAL"]', NULL),
('33903950', '3.3.90.39.50', 'SUBELEMENTO', 'Serviços Médico-Hospitalares, Odontológicos e Laboratoriais', '["GERAL"]', NULL),
('33903951', '3.3.90.39.51', 'SUBELEMENTO', 'Serviços de Análises e Pesquisas Científicas', '["GERAL"]', NULL),
('33903953', '3.3.90.39.53', 'SUBELEMENTO', 'Serviços de Reprografia', '["GERAL"]', NULL),
('33903956', '3.3.90.39.56', 'SUBELEMENTO', 'Serviços de Perícia Médica', '["GERAL"]', NULL),
('33903957', '3.3.90.39.57', 'SUBELEMENTO', 'Serviços de Processamento de Dados', '["GERAL"]', 'TI, sistemas, cloud, hospedagem, certificado digital'),
('33903058', '3.3.90.39.58', 'SUBELEMENTO', 'Serviços de Limpeza e Conservação', '["GERAL"]', NULL),
('33903959', '3.3.90.39.59', 'SUBELEMENTO', 'Serviços de Áudio, Vídeo e Foto', '["GERAL"]', NULL),
('33903960', '3.3.90.39.60', 'SUBELEMENTO', 'Serviços de Manobra e Patrulhamento', '["GERAL"]', NULL),
('33903961', '3.3.90.39.61', 'SUBELEMENTO', 'Serviços de Socorro e Salvamento', '["GERAL"]', NULL),
('33903963', '3.3.90.39.63', 'SUBELEMENTO', 'Serviços Gráficos e Editoriais', '["GERAL"]', NULL),
('33903965', '3.3.90.39.65', 'SUBELEMENTO', 'Serviços de Apoio ao Ensino', '["GERAL"]', NULL),
('33903966', '3.3.90.39.66', 'SUBELEMENTO', 'Seguros em Geral', '["GERAL"]', NULL),
('33903069', '3.3.90.39.69', 'SUBELEMENTO', 'Seguros de Veículos', '["GERAL"]', NULL),
('33903970', '3.3.90.39.70', 'SUBELEMENTO', 'Confecção de Uniformes, Bandeiras e Flâmulas', '["GERAL"]', NULL),
('33903974', '3.3.90.39.74', 'SUBELEMENTO', 'Fretes e Transportes de Encomendas', '["GERAL"]', NULL),
('33903976', '3.3.90.39.76', 'SUBELEMENTO', 'Vigilância Ostensiva/Monitorada', '["GERAL"]', NULL),
('33903977', '3.3.90.39.77', 'SUBELEMENTO', 'Serviços de Coleta de Lixo', '["GERAL"]', NULL),
('33903978', '3.3.90.39.78', 'SUBELEMENTO', 'Limpeza Urbana', '["GERAL"]', NULL),
('33903979', '3.3.90.39.79', 'SUBELEMENTO', 'Serviço de Iluminação Pública', '["GERAL"]', NULL),
('33903980', '3.3.90.39.80', 'SUBELEMENTO', 'Hospedagens', '["GERAL"]', NULL),
('33903981', '3.3.90.39.81', 'SUBELEMENTO', 'Serviços Bancários', '["GERAL"]', 'Tarifas, taxas de convênio, boletos'),
('33903983', '3.3.90.39.83', 'SUBELEMENTO', 'Serviços de Cópias e Reprodução de Documentos', '["GERAL"]', NULL),
('33903984', '3.3.90.39.84', 'SUBELEMENTO', 'Serviços de Publicidade Legal (publicação de atos)', '["GERAL"]', 'Diário Oficial, jornais'),
('33903997', '3.3.90.39.97', 'SUBELEMENTO', 'Despesas de Teleprocessamento', '["GERAL"]', NULL),
('33903999', '3.3.90.39.99', 'SUBELEMENTO', 'Outros Serviços de Terceiros - PJ', '["GERAL"]', NULL),

-- ── 3.3.90.40 - Serviços de TIC ─────────────────────────────
('339040', '3.3.90.40', 'ELEMENTO', 'Serviços de Tecnologia da Informação e Comunicação - PJ', '["GERAL"]',
 'Serviços de TIC prestados por PJ: cloud, SaaS, desenvolvimento, suporte, data center'),
('33904001', '3.3.90.40.01', 'SUBELEMENTO', 'Serviços de Desenvolvimento de Software', '["GERAL"]', NULL),
('33904002', '3.3.90.40.02', 'SUBELEMENTO', 'Serviços de Suporte a Infraestrutura de TIC', '["GERAL"]', NULL),
('33904003', '3.3.90.40.03', 'SUBELEMENTO', 'Comunicação de Dados', '["GERAL"]', NULL),
('33904004', '3.3.90.40.04', 'SUBELEMENTO', 'Serviço de Hosting e Colocation', '["GERAL"]', NULL),
('33904005', '3.3.90.40.05', 'SUBELEMENTO', 'Computação em Nuvem (IaaS/PaaS/SaaS)', '["GERAL"]', NULL),
('33904099', '3.3.90.40.99', 'SUBELEMENTO', 'Outros Serviços de TIC', '["GERAL"]', NULL),

-- ── 3.3.90.46 - Auxílio-Alimentação ─────────────────────────
('339046', '3.3.90.46', 'ELEMENTO', 'Auxílio-Alimentação', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Benefício de alimentação pago ao servidor (vale-refeição/alimentação)'),

-- ── 3.3.90.47 - Obrigações Tributárias e Contributivas ──────
('339047', '3.3.90.47', 'ELEMENTO', 'Obrigações Tributárias e Contributivas', '["GERAL"]',
 'Impostos, taxas e contribuições devidas pelo ente: IPTU, taxa de licenciamento, COSIP, etc.'),

-- ── 3.3.90.48 - Outros Auxílios Financeiros a PF ───────────
('339048', '3.3.90.48', 'ELEMENTO', 'Outros Auxílios Financeiros a Pessoas Físicas', '["GERAL"]',
 'Auxílio-funeral, natalidade, creche, moradia'),

-- ── 3.3.90.49 - Auxílio-Transporte ──────────────────────────
('339049', '3.3.90.49', 'ELEMENTO', 'Auxílio-Transporte', '["EFETIVO","COMISSIONADO","TEMPORARIO"]',
 'Benefício de transporte pago ao servidor'),

-- ── 3.3.90.91 - Sentenças Judiciais (Custeio) ──────────────
('339091', '3.3.90.91', 'ELEMENTO', 'Sentenças Judiciais', '["GERAL"]',
 'Sentenças judiciais transitadas em julgado de natureza corrente (não pessoal)'),

-- ── 3.3.90.92 - Despesas de Exercícios Anteriores (Custeio) ─
('339092', '3.3.90.92', 'ELEMENTO', 'Despesas de Exercícios Anteriores', '["GERAL"]',
 'Despesas correntes de exercícios anteriores (Art. 37, Lei 4.320/64)'),

-- ── 3.3.90.93 - Indenizações e Restituições (Custeio) ──────
('339093', '3.3.90.93', 'ELEMENTO', 'Indenizações e Restituições', '["GERAL"]',
 'Indenizações e restituições não trabalhistas; danos a terceiros'),

-- ── 3.3.90.95 - Indenização pela Execução de Trabalhos de Campo
('339095', '3.3.90.95', 'ELEMENTO', 'Indenização pela Execução de Trabalhos de Campo', '["GERAL"]', NULL);

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 3 - DESPESAS CORRENTES
-- GRUPO 3 - OUTRAS DESPESAS CORRENTES
-- Modalidade 91 - Aplicações Diretas Intra-Orçamentárias
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('339139', '3.3.91.39', 'ELEMENTO', 'Outros Serviços de Terceiros PJ - Intra-Orçamentário', '["GERAL"]',
 'Serviços prestados entre órgãos do mesmo ente (operação intra-orçamentária)'),
('339147', '3.3.91.47', 'ELEMENTO', 'Obrigações Tributárias e Contributivas - Intra', '["GERAL"]', NULL);

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 3 - DESPESAS CORRENTES
-- GRUPO 2 - JUROS E ENCARGOS DA DÍVIDA
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('329021', '3.2.90.21', 'ELEMENTO', 'Juros sobre a Dívida por Contrato', '["GERAL"]', NULL),
('329022', '3.2.90.22', 'ELEMENTO', 'Outros Encargos sobre a Dívida por Contrato', '["GERAL"]', NULL);

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 3 - DESPESAS CORRENTES
-- GRUPO 3 - Modalidade 50 - Transferências a Instituições Privadas
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('335041', '3.3.50.41', 'ELEMENTO', 'Contribuições', '["GERAL"]',
 'Contribuições a entidades privadas sem fins lucrativos (ONGs, OSCIPs, OSs)'),
('335043', '3.3.50.43', 'ELEMENTO', 'Subvenções Sociais', '["GERAL"]',
 'Transferências a instituições de assistência social, médica, educacional sem fins lucrativos');

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 3 - DESPESAS CORRENTES
-- GRUPO 3 - Modalidade 71 - Transferências a Consórcios Públicos
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('337041', '3.3.71.41', 'ELEMENTO', 'Contribuições a Consórcios Públicos', '["GERAL"]',
 'Rateio de despesas de consórcio público (Lei 11.107/2005)'),
('337070', '3.3.71.70', 'ELEMENTO', 'Rateio pela Participação em Consórcio Público', '["GERAL"]', NULL);

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 4 - DESPESAS DE CAPITAL
-- GRUPO 4 - INVESTIMENTOS
-- Modalidade 90 - Aplicações Diretas
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
-- ── 4.4.90.30 - Material de Consumo (Capital) ──────────────
('449030', '4.4.90.30', 'ELEMENTO', 'Material de Consumo (vinculado a obra/investimento)', '["GERAL"]',
 'Material de consumo quando vinculado diretamente a investimento (ex: material para obra)'),

-- ── 4.4.90.39 - Outros Serviços de Terceiros PJ (Investimento)
('449039', '4.4.90.39', 'ELEMENTO', 'Outros Serviços de Terceiros PJ (Investimento)', '["GERAL"]', NULL),

-- ── 4.4.90.40 - Serviços de TIC (Capital) ──────────────────
('449040', '4.4.90.40', 'ELEMENTO', 'Serviços de TIC - PJ (Investimento)', '["GERAL"]', NULL),

-- ── 4.4.90.51 - Obras e Instalações ────────────────────────
('449051', '4.4.90.51', 'ELEMENTO', 'Obras e Instalações', '["GERAL"]',
 'Construção, ampliação, reforma de bens imóveis. Exige ART/RRT, alvará, CNO, projeto básico, boletim de medição. Manual CGM Check Lists.'),
('44905101', '4.4.90.51.01', 'SUBELEMENTO', 'Obras em Andamento', '["GERAL"]', NULL),
('44905102', '4.4.90.51.02', 'SUBELEMENTO', 'Instalações', '["GERAL"]', 'Elétricas, hidráulicas, sanitárias, de rede'),
('44905103', '4.4.90.51.03', 'SUBELEMENTO', 'Benfeitorias em Propriedade de Terceiros', '["GERAL"]', NULL),
('44905104', '4.4.90.51.04', 'SUBELEMENTO', 'Construção em Terreno Próprio', '["GERAL"]', NULL),
('44905105', '4.4.90.51.05', 'SUBELEMENTO', 'Ampliações e Reformas', '["GERAL"]', NULL),
('44905199', '4.4.90.51.99', 'SUBELEMENTO', 'Outras Obras e Instalações', '["GERAL"]', NULL),

-- ── 4.4.90.52 - Equipamentos e Material Permanente ──────────
('449052', '4.4.90.52', 'ELEMENTO', 'Equipamentos e Material Permanente', '["GERAL"]',
 'Bens que, em razão de seu uso corrente, NÃO perdem sua identidade física e/ou têm durabilidade superior a dois anos. Exige tombamento patrimonial. Portaria STN 448/2002.'),
('44905201', '4.4.90.52.01', 'SUBELEMENTO', 'Aparelhos de Medição e Orientação', '["GERAL"]', NULL),
('44905202', '4.4.90.52.02', 'SUBELEMENTO', 'Aparelhos e Equipamentos de Comunicação', '["GERAL"]', 'Rádios, centrais telefônicas'),
('44905203', '4.4.90.52.03', 'SUBELEMENTO', 'Aparelhos e Equip. Médico-Odonto-Laboratoriais', '["GERAL"]', NULL),
('44905204', '4.4.90.52.04', 'SUBELEMENTO', 'Aparelhos e Equipamentos para Esportes e Diversões', '["GERAL"]', NULL),
('44905206', '4.4.90.52.06', 'SUBELEMENTO', 'Aparelhos e Utensílios Domésticos', '["GERAL"]', 'Geladeira, fogão, bebedouro, ar-condicionado, ventilador'),
('44905208', '4.4.90.52.08', 'SUBELEMENTO', 'Aparelhos, Equipamentos e Utensílios de Informática', '["GERAL"]', 'Computadores, notebooks, impressoras, servidores, switches, roteadores'),
('44905209', '4.4.90.52.09', 'SUBELEMENTO', 'Armamentos', '["GERAL"]', NULL),
('44905210', '4.4.90.52.10', 'SUBELEMENTO', 'Coleções e Materiais Bibliográficos', '["GERAL"]', 'Livros para acervo/biblioteca'),
('44905212', '4.4.90.52.12', 'SUBELEMENTO', 'Equipamentos de Proteção, Segurança e Socorro', '["GERAL"]', NULL),
('44905214', '4.4.90.52.14', 'SUBELEMENTO', 'Máquinas e Equipamentos Energéticos', '["GERAL"]', 'Geradores, transformadores'),
('44905215', '4.4.90.52.15', 'SUBELEMENTO', 'Máquinas e Equipamentos Gráficos', '["GERAL"]', NULL),
('44905218', '4.4.90.52.18', 'SUBELEMENTO', 'Máquinas, Equipamentos e Utensílios Diversos', '["GERAL"]', NULL),
('44905219', '4.4.90.52.19', 'SUBELEMENTO', 'Equipamentos de Áudio, Vídeo e Foto', '["GERAL"]', 'TV, projetores, câmeras, caixas de som'),
('44905220', '4.4.90.52.20', 'SUBELEMENTO', 'Máquinas, Utensílios e Equipamentos de Oficina', '["GERAL"]', NULL),
('44905221', '4.4.90.52.21', 'SUBELEMENTO', 'Máquinas e Equipamentos Agrícolas e Rodoviários', '["GERAL"]', 'Tratores, retroescavadeiras, roçadeiras'),
('44905224', '4.4.90.52.24', 'SUBELEMENTO', 'Mobiliário em Geral', '["GERAL"]', 'Mesas, cadeiras, armários, estantes, arquivos'),
('44905226', '4.4.90.52.26', 'SUBELEMENTO', 'Instrumentos Musicais e Artísticos', '["GERAL"]', NULL),
('44905228', '4.4.90.52.28', 'SUBELEMENTO', 'Máquinas, Ferramentas e Utensílios de Oficina', '["GERAL"]', NULL),
('44905232', '4.4.90.52.32', 'SUBELEMENTO', 'Máquinas Industriais', '["GERAL"]', NULL),
('44905233', '4.4.90.52.33', 'SUBELEMENTO', 'Equipamentos para Processamento de Dados (mainframe)', '["GERAL"]', NULL),
('44905234', '4.4.90.52.34', 'SUBELEMENTO', 'Máquinas, Equipamentos e Acessórios Hospitalares', '["GERAL"]', NULL),
('44905235', '4.4.90.52.35', 'SUBELEMENTO', 'Equipamentos de Uso Militar', '["GERAL"]', NULL),
('44905236', '4.4.90.52.36', 'SUBELEMENTO', 'Equipamentos Hidráulicos e Elétricos', '["GERAL"]', NULL),
('44905238', '4.4.90.52.38', 'SUBELEMENTO', 'Máquinas e Equipamentos para Construção', '["GERAL"]', NULL),
('44905240', '4.4.90.52.40', 'SUBELEMENTO', 'Material Permanente para Uso Hospitalar', '["GERAL"]', NULL),
('44905241', '4.4.90.52.41', 'SUBELEMENTO', 'Peças não Incorporáveis a Imóveis', '["GERAL"]', NULL),
('44905242', '4.4.90.52.42', 'SUBELEMENTO', 'Veículos Diversos', '["GERAL"]', 'Carros, ambulâncias, motocicletas, ônibus, caminhões'),
('44905244', '4.4.90.52.44', 'SUBELEMENTO', 'Embarcações', '["GERAL"]', NULL),
('44905248', '4.4.90.52.48', 'SUBELEMENTO', 'Veículos de Tração Mecânica', '["GERAL"]', NULL),
('44905251', '4.4.90.52.51', 'SUBELEMENTO', 'Acessórios para Automóveis', '["GERAL"]', NULL),
('44905252', '4.4.90.52.52', 'SUBELEMENTO', 'Bandeiras, Flâmulas e Insígnias (permanente)', '["GERAL"]', NULL),
('44905299', '4.4.90.52.99', 'SUBELEMENTO', 'Outros Materiais Permanentes', '["GERAL"]', NULL),

-- ── 4.4.90.61 - Aquisição de Imóveis ───────────────────────
('449061', '4.4.90.61', 'ELEMENTO', 'Aquisição de Imóveis', '["GERAL"]',
 'Compra de terrenos, prédios, casas, apartamentos para uso público'),

-- ── 4.4.90.92 - Despesas de Exercícios Anteriores (Capital) ─
('449092', '4.4.90.92', 'ELEMENTO', 'Despesas de Exercícios Anteriores (Capital)', '["GERAL"]', NULL),

-- ── 4.4.90.93 - Indenizações e Restituições (Capital) ──────
('449093', '4.4.90.93', 'ELEMENTO', 'Indenizações e Restituições (Capital)', '["GERAL"]', NULL);

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 4 - DESPESAS DE CAPITAL
-- GRUPO 5 - INVERSÕES FINANCEIRAS
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('459061', '4.5.90.61', 'ELEMENTO', 'Aquisição de Imóveis (Inversão)', '["GERAL"]', NULL),
('459066', '4.5.90.66', 'ELEMENTO', 'Concessão de Empréstimos e Financiamentos', '["GERAL"]', NULL);

-- ═══════════════════════════════════════════════════════════════
-- CATEGORIA 4 - DESPESAS DE CAPITAL
-- GRUPO 6 - AMORTIZAÇÃO DA DÍVIDA
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO elementos_despesa (codigo, codigo_formatado, nivel, descricao, vinculos, observacao) VALUES
('469071', '4.6.90.71', 'ELEMENTO', 'Principal da Dívida Contratual Resgatado', '["GERAL"]', NULL),
('469072', '4.6.90.72', 'ELEMENTO', 'Principal da Dívida Mobiliária Resgatado', '["GERAL"]', NULL);

-- ═══════════════════════════════════════════════════════════════
-- NORMAS ADICIONAIS (resolucoes)
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO resolucoes (codigo, tipo, orgao, numero, ano, ementa) VALUES
('LC_101_2000', 'LEI_COMPLEMENTAR', 'FEDERAL', '101', 2000,
 'Lei de Responsabilidade Fiscal – estabelece normas de finanças públicas voltadas para a responsabilidade na gestão fiscal'),
('LEI_8666_1993', 'LEI', 'FEDERAL', '8666', 1993,
 'Lei anterior de Licitações e Contratos – revogada pela Lei 14.133/2021 mas ainda referenciada em contratos vigentes'),
('IN_SEGES_65_2021', 'INSTRUCAO_NORMATIVA', 'SEGES_ME', '65', 2021,
 'Pesquisa de preços para aquisições e contratações – mínimo 3 fontes de pesquisa'),
('IN_RFB_1234_2012', 'INSTRUCAO_NORMATIVA', 'RFB', '1234', 2012,
 'Retenção de tributos federais nos pagamentos efetuados por órgãos públicos a PJ (IR, CSLL, PIS, COFINS)'),
('IN_RFB_2110_2022', 'INSTRUCAO_NORMATIVA', 'RFB', '2110', 2022,
 'Normas sobre contribuições previdenciárias – retenção de 11% INSS nos serviços de PF e cessão de mão de obra'),
('DECRETO_12343_2024', 'DECRETO', 'FEDERAL', '12343', 2024,
 'Atualiza os limites de dispensa de licitação (Art. 75 Lei 14.133): R$ 59.906,02 serviços, R$ 119.812,03 obras'),
('LEI_11107_2005', 'LEI', 'FEDERAL', '11107', 2005,
 'Dispõe sobre normas gerais de contratação de consórcios públicos'),
('LEI_8036_1990', 'LEI', 'FEDERAL', '8036', 1990,
 'Dispõe sobre o FGTS – multa rescisória de 40%'),
('LEI_8745_1993', 'LEI', 'FEDERAL', '8745', 1993,
 'Contratação por tempo determinado para atender necessidade temporária de excepcional interesse público (CF art. 37, IX)');

-- ═══════════════════════════════════════════════════════════════
-- REGRAS ADICIONAIS DE CLASSIFICAÇÃO
-- Validações de custeio e capital
-- ═══════════════════════════════════════════════════════════════

INSERT OR IGNORE INTO regras_classificacao (tipo_ato, vinculo_servidor, elemento_correto, subelemento_correto, codigo_completo, descricao, fundamentacao) VALUES
-- Material: consumo vs. permanente
('MATERIAL_CONSUMO', 'GERAL', '339030', NULL, '339030', 'Material de Consumo – perde identidade física ou durabilidade < 2 anos', 'Portaria STN 448/2002 Art. 2º – critérios: durabilidade, fragilidade, perecibilidade, incorporabilidade, transformabilidade'),
('MATERIAL_PERMANENTE', 'GERAL', '449052', NULL, '449052', 'Equipamento e Material Permanente – NÃO perde identidade e durabilidade > 2 anos', 'Portaria STN 448/2002 Art. 3º – exige tombamento patrimonial'),

-- Serviços PF vs PJ
('SERVICO_PF', 'GERAL', '339036', NULL, '339036', 'Serviço de Terceiro Pessoa Física', 'Portaria STN 448/2002 – exige retenção INSS 11% (IN RFB 2.110/2022) + IR fonte'),
('SERVICO_PJ', 'GERAL', '339039', NULL, '339039', 'Serviço de Terceiro Pessoa Jurídica', 'Portaria STN 448/2002 – exige retenção IR/CSLL/PIS/COFINS (IN RFB 1.234/2012)'),
('SERVICO_TIC_PJ', 'GERAL', '339040', NULL, '339040', 'Serviço de TIC - PJ', 'Elemento criado por atualização. Sistemas, cloud, SaaS, suporte de TI'),

-- Terceirização de mão de obra
('TERCEIRIZACAO', 'GERAL', '339037', NULL, '339037', 'Locação de Mão de Obra (PJ interposta)', 'Portaria STN 448/2002 – atividade-meio. Retenção INSS sobre NF (IN 2.110/2022)'),

-- Obras
('OBRA', 'GERAL', '449051', NULL, '449051', 'Obras e Instalações', 'Portaria STN 448/2002 – exige ART/RRT, alvará, CNO, projeto básico, boletim de medição, as-built'),

-- Diárias
('DIARIA', 'EFETIVO', '339014', '01', '33901401', 'Diárias no País', 'Manual CGM – exige relatório de viagem em 5 dias úteis, passagens anexas'),
('DIARIA', 'COMISSIONADO', '339014', '01', '33901401', 'Diárias no País', 'Manual CGM – exige relatório de viagem em 5 dias úteis'),

-- Passagens
('PASSAGEM', 'GERAL', '339033', '01', '33903301', 'Passagens para o País', 'Manual CGM – compra pela administração, não reembolso'),

-- Auxílios
('AUXILIO_ALIMENTACAO', 'EFETIVO', '339046', NULL, '339046', 'Auxílio-Alimentação', 'Portaria STN 448/2002'),
('AUXILIO_ALIMENTACAO', 'COMISSIONADO', '339046', NULL, '339046', 'Auxílio-Alimentação', 'Portaria STN 448/2002'),
('AUXILIO_ALIMENTACAO', 'TEMPORARIO', '339046', NULL, '339046', 'Auxílio-Alimentação', 'Portaria STN 448/2002'),
('AUXILIO_TRANSPORTE', 'EFETIVO', '339049', NULL, '339049', 'Auxílio-Transporte', 'Portaria STN 448/2002'),
('AUXILIO_TRANSPORTE', 'COMISSIONADO', '339049', NULL, '339049', 'Auxílio-Transporte', 'Portaria STN 448/2002'),
('AUXILIO_TRANSPORTE', 'TEMPORARIO', '339049', NULL, '339049', 'Auxílio-Transporte', 'Portaria STN 448/2002'),

-- Exercícios anteriores
('EXERCICIO_ANTERIOR_CUSTEIO', 'GERAL', '339092', NULL, '339092', 'Despesas de Exercícios Anteriores (Custeio)', 'Art. 37 Lei 4.320/64 – despesa corrente reconhecida após encerramento do exercício'),
('EXERCICIO_ANTERIOR_CAPITAL', 'GERAL', '449092', NULL, '449092', 'Despesas de Exercícios Anteriores (Capital)', 'Art. 37 Lei 4.320/64 – despesa de capital reconhecida após encerramento do exercício'),

-- Transferências
('SUBVENCAO_SOCIAL', 'GERAL', '335043', NULL, '335043', 'Subvenções Sociais a Entidades Privadas', 'Portaria 163/2001 – exige plano de trabalho, prestação de contas (Lei 13.019/2014)'),
('CONTRIBUICAO_ENTE_PRIVADO', 'GERAL', '335041', NULL, '335041', 'Contribuições a Instituições Privadas', 'Portaria 163/2001 – ONGs, OSCIPs, OSs'),
('RATEIO_CONSORCIO', 'GERAL', '337070', NULL, '337070', 'Rateio de Consórcio Público', 'Lei 11.107/2005 – contrato de rateio obrigatório'),

-- Veículos: consumo vs permanente  
('PNEU_FILTRO', 'GERAL', '339030', '39', '33903039', 'Material para Manutenção de Veículos (consumo: pneus, filtros, correias)', 'Portaria STN 448/2002 – peça de reposição é material de consumo'),
('VEICULO', 'GERAL', '449052', '42', '44905242', 'Aquisição de Veículo (permanente)', 'Portaria STN 448/2002 – exige tombamento patrimonial'),

-- Informática: consumo vs permanente
('INFORMATICA_CONSUMO', 'GERAL', '339030', '17', '33903017', 'Material de Processamento de Dados (consumo: pen drive, cabo, mouse)', 'Portaria STN 448/2002 – se valor unitário baixo ou durabilidade < 2 anos'),
('INFORMATICA_PERMANENTE', 'GERAL', '449052', '08', '44905208', 'Equipamento de Informática (permanente: computador, notebook, servidor)', 'Portaria STN 448/2002 – durabilidade > 2 anos, exige tombamento'),

-- Mobiliário
('MOBILIARIO', 'GERAL', '449052', '24', '44905224', 'Mobiliário em Geral (mesas, cadeiras, armários)', 'Portaria STN 448/2002 – material permanente, tombamento obrigatório');
