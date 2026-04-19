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
