# Contexto do Projeto — Controle de Estoque para ONGs

_Última atualização: 2026-04-12_

---

## Stack Técnica

| Camada      | Tecnologia                              |
|-------------|-----------------------------------------|
| Runtime     | Node.js (ESM, `"type": "module"`)       |
| Linguagem   | TypeScript                              |
| Framework   | Fastify v5                              |
| ORM/Query   | Knex v3                                 |
| Banco       | better-sqlite3 (SQLite)                 |
| Validação   | Zod v4                                  |
| Dev runner  | tsx (watch mode)                        |

---

## Decisões Técnicas

- **ESM nativo**: `package.json` usa `"type": "module"`. Imports internos usam extensão `.js` (mesmo sendo `.ts`).
- **better-sqlite3** escolhido em vez de `sqlite3` por ser síncrono, mais estável e sem deprecation warnings.
- **Zod** valida variáveis de ambiente no startup via `src/env/index.ts`. Falha rápido se algo estiver errado.
- **Knex migrations** em `./db/migrations`, extensão `.ts`, executadas via `npm run knex -- migrate:latest`.
- **knexfile.ts** reaproveitado do `config` exportado em `src/database.ts` para evitar duplicação.
- **Variáveis de ambiente** necessárias: `NODE_ENV`, `DATABASE_URL`, `PORT` (default: 3333).

---

## Estrutura de Arquivos

```
backend/
├── db/
│   └── migrations/          # Migrations Knex (extensão .ts)
├── docs/
│   └── context.md           # Este arquivo
├── src/
│   ├── app.ts               # Fastify: registra plugins e rotas
│   ├── server.ts            # Entry point: sobe o servidor
│   ├── database.ts          # Config e instância do Knex
│   ├── env/
│   │   └── index.ts         # Validação de .env com Zod
│   ├── middlewares/         # (vazio — a implementar)
│   └── routes/
│       └── batch.ts         # 🚧 Rota de teste (remover antes de produção)
├── .env                     # DATABASE_URL + PORT
├── knexfile.ts              # Exporta config para CLI do Knex
├── package.json
└── tsconfig.json
```

---

## Estado Atual das Histórias de Usuário

| # | História                         | Status        |
|---|----------------------------------|---------------|
| 1 | Autenticação de Colaboradores    | ❌ Pendente   |
| 2 | Gerenciamento de Itens (CRUD)    | ❌ Pendente   |
| 3 | Visualização de Inventário       | ❌ Pendente   |
| 4 | Registro de Entrada de Lotes     | ❌ Pendente   |
| 5 | Registro de Saída para Doação    | ❌ Pendente   |
| 6 | Monitoramento de Validade        | ❌ Pendente   |
| 7 | Alertas de Estoque Crítico       | ❌ Pendente   |
| 8 | Histórico de Movimentações       | ❌ Pendente   |
| 9 | Dashboard de Impacto Mensal      | ❌ Pendente   |
|10 | Busca e Filtros Avançados        | ❌ Pendente   |

---

## Próximos Passos (Ordem Sugerida)

1. **Criar migrations** — definir schema das tabelas: `collaborators`, `items`, `batches`, `movements`
2. **H1 — Autenticação**: rota de login/logout, hash de senha, sessão via cookie
3. **H2 — CRUD de Itens**: criar, editar, remover, listar produtos do catálogo
4. **H4 — Entrada de Lotes**: registrar chegada de doações com validade obrigatória
5. **H5 — Saída para Doação**: subtrair do saldo e registrar destino

---

## Problemas Conhecidos / Pendências

- `src/routes/batch.ts` contém código de **teste** (insert mockado em tabela `users` inexistente) — deve ser limpo ou substituído.
- `src/middlewares/` está vazio — middleware de autenticação entra aqui na H1.
- Nenhuma migration foi executada ainda; o banco SQLite ainda não tem tabelas reais.
