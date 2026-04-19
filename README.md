# Andre Fiscaliza

Sistema de análise de despesas públicas reescrito em JavaScript/TypeScript para executar 100% na infraestrutura Cloudflare.

## Arquitetura

```text
Cloudflare Pages (Frontend HTML/CSS/JS)
         ↕
Cloudflare Workers (Backend API - TypeScript)
         ↕
Cloudflare D1 (SQLite) + Cloudflare R2 (Arquivos)
```

## Estrutura principal

```text
andre-fiscaliza/
├── wrangler.toml
├── package.json
├── tsconfig.json
├── worker/src
├── frontend/public
├── frontend/assets
└── schema.sql
```

## Deploy

1. `npm install`
2. `wrangler d1 create andre-fiscaliza-db`
3. `wrangler r2 bucket create andre-fiscaliza-docs`
4. `wrangler d1 execute andre-fiscaliza-db --file=schema.sql`
5. `wrangler secret put ADMIN_PASSWORD_HASH` (valor: `c4776115426be5e3e1a8b79c7adaa7d6af3fc916681881363342b3b5406a6c9c`)
6. `wrangler secret put JWT_SECRET` (valor: segredo aleatório forte)
7. `wrangler deploy`

## Credenciais padrão

- Usuário: `andre`
- Senha: `fiscaliza2026`

## Identidade visual

- Nome: **Andre Fiscaliza**
- Proprietário: **Andre de Jesus Oliveira**
- Cores: azul escuro `#1a237e`, dourado `#ffd600` e branco
