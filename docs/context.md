# Contexto do Projeto — Controle de Estoque para ONGs

## Visão Geral

O **ONGConecta** é um sistema web de gerenciamento de estoque e doações desenvolvido como Trabalho Prático 1 (TP1) da disciplina de Engenharia de Software I da UFMG. O projeto nasce da necessidade real de ONGs que recebem doações valiosas mas carecem de ferramentas adequadas para gerenciá-las — fazendo com que itens se percam, vençam ou deixem de chegar às pessoas corretas.

A proposta central é: **tecnologia a serviço do bem social**. Ferramentas de gestão de estoque devem estar ao alcance de organizações que trabalham pelo impacto social.

---

## Problema

Organizações sem fins lucrativos frequentemente lidam com:

- **Falta de rastreabilidade** das doações recebidas e distribuídas.
- **Perda de itens perecíveis** por ausência de controle de validade.
- **Ausência de alertas** quando itens essenciais atingem nível crítico.
- **Dificuldade de prestação de contas** por falta de histórico de movimentações.
- **Ineficiência operacional** no momento de alta demanda, sem filtros ou buscas adequadas.

---

## Solução

Um sistema web com autenticação de colaboradores que permite:

1. Cadastrar e gerenciar itens (CRUD) com nome, categoria e unidade de medida.
2. Registrar entradas de lotes com data de validade.
3. Registrar saídas para doação, rastreando destino e responsável.
4. Visualizar o inventário central com saldos atualizados.
5. Receber alertas de estoque crítico e lotes próximos ao vencimento.
6. Consultar o histórico completo de movimentações.
7. Acompanhar um dashboard de impacto mensal (kg doados, itens recebidos).
8. Filtrar e buscar itens por nome, categoria ou validade.

---

## Contexto Acadêmico

| Campo           | Valor                                      |
|-----------------|--------------------------------------------|
| Instituição     | Universidade Federal de Minas Gerais (UFMG) |
| Disciplina      | Engenharia de Software I (ES1)             |
| Trabalho        | TP1                                        |
| Repositório     | `LuizFelipeGondim/controle-de-estoque-para-ongs` |

---

## Stack Tecnológica

### Frontend
| Tecnologia              | Versão   | Função                          |
|-------------------------|----------|---------------------------------|
| React                   | ^19.2.4  | Framework de UI                 |
| Vite                    | ^8.0.1   | Bundler e dev server            |
| Vanilla CSS             | —        | Estilização                     |
| ESLint                  | ^9.39.4  | Linting e qualidade de código   |

### Backend *(planejado)*
| Tecnologia   | Função                             |
|--------------|------------------------------------|
| Node.js      | Runtime JavaScript no servidor     |
| TypeScript   | Tipagem estática                   |
| Express      | Framework HTTP / Rotas da API      |

### Testes *(planejado)*
- **Vitest** — cobertura de testes unitários no frontend e backend.

### Versionamento
- **Git** com repositórios separados para frontend e backend.

---

## Estrutura do Projeto

```
controle-de-estoque-para-ongs/
├── docs/               # Documentação do projeto
│   └── context.md
├── frontend/           # Aplicação React + Vite
│   ├── src/
│   │   ├── App.jsx             # Roteador por estado (login ↔ stock)
│   │   ├── LoginPage.jsx       # Página de login de colaboradores
│   │   ├── LoginPage.css       # Estilos da página de login
│   │   ├── StockOverview.jsx   # Página de visão geral dos estoques (placeholder)
│   │   ├── StockOverview.css   # Estilos da visão geral
│   │   ├── ItemsPage.jsx       # Página de visualização de todos os itens do estoque
│   │   ├── ItemsPage.css       # Estilos da página de itens
│   │   └── index.css           # Estilos globais e design tokens
│   ├── index.html      # Entry point HTML
│   ├── vite.config.js
│   └── package.json
├── backend/            # API Node.js + TypeScript (em desenvolvimento)
└── README.md
```

---

## Navegação (Roteamento por Estado)

O projeto não utiliza React Router. A navegação é controlada por `useState` em `App.jsx`:

```text
Login  →  [clica Entrar]  →  StockOverview  → [clica Ver todos os itens] → ItemsPage
                                   ↓                                          ↓
                             [clica Sair]                               [clica Voltar]
                                   ↓                                          ↓
                               Login                                    StockOverview
```

---

## Estado Atual

### Página de Login de Colaboradores (concluída)
A tela principal do frontend é a página de login da **Área do Colaborador**. Construída em React com design premium (glassmorphism + tema escuro), inclui:

- **Card glassmorphism** — container centralizado com backdrop blur, borda sutil e linha de acento gradiente no topo.
- **Identidade visual** — logo 🌱 ONGConecta, badge pulsante "Área do Colaborador".
- **Campo E-mail** — input de e-mail integrado e estilizado.
- **Campo Senha** — input de senha com botão de mostrar/ocultar (👁️ / 🙈).
- **Botão Entrar** — ativo, com feedback de carregamento, realiza requisição `POST` com Fetch API para a URL base do backend (na porta `3333` via `/auth/login`) para validar as credenciais. Navega para a página de visão geral dos estoques (`StockOverview`) em caso de sucesso.
- **Tratamento de Erros** — exibe mensagens para falha de conexão e credenciais incorretas (erro 404/CORS devido a ausência da rota tratada, agora corrigido no app Fastify).
- **Fundo animado** — dois orbs com gradiente em movimento suave (`orb-drift`).
- **Responsivo** — layout adaptado para telas menores que 500px.

> A landing page institucional (Navbar, Hero, Stats, About, Values, Donation Banner, Footer) foi removida do fluxo principal e pode ser reintegrada futuramente como rota separada.

### Visão Geral dos Estoques — `StockOverview` (concluída com dados mock)
Página de destino após o login. Composta por três seções principais, com dados estáticos (mock) até a integração com o backend:

**Header fixo** — logo ONGConecta e botão "Sair" (retorna à tela de login).

**Seção 1 — ⚠️ Avisos**
Dois painéis lado a lado com alertas operacionais:
- *Validade Próxima* — lista itens com vencimento iminente, com badge de urgência colorido: vermelho (≤ 3 dias), âmbar (≤ 7 dias), verde (≤ 15 dias).
- *Estoque Crítico* — lista categorias abaixo da quantidade mínima configurada, exibindo o saldo atual vs. o mínimo esperado.

**Seção 2 — 📦 Estoque por Categoria**
Grid de cards para cada categoria de alimento: Arroz, Feijão, Macarrão, Grãos, Carne, Legume e Verdura. Cada card exibe:
- Emoji identificador, nome e quantidade atual em kg.
- Barra de progresso (verde = ok, vermelho = crítico).
- Badge "Crítico" quando o estoque está abaixo do mínimo.

**Seção 3 — 📊 Dashboard**
Dois cards de métrica de impacto social:
- *Doações realizadas* — total em kg acumulado.
- *Alimentos recebidos* — total em kg acumulado.
- *Tags de categorias* — exibindo as categorias dos alimentos recebidos ou doados.

> A funcionalidade de Overview continua parcialmente com dados mock.

### Página de Itens — `ItemsPage` (integrada ao backend)
Acessível a partir do painel de Visão Geral, esta página lista todos os tipos de itens através de uma requisição HTTP real ao endpoint `GET /items`:
- Utiliza cookies de sessão com segurança para acesso restrito.
- Faz o agrupamento automático de acordo com todas as matrizes de produtos retornados pela API (ex: cereal, grão, enlatado).
- Os cards individuais contém avisos de item essencial, níveis mínimos e unidade de contagem.

### Sistema de Autenticação e Backend (Integrado)
O roteamento de login interage em fluxo constante com o backend com uso de cookies para gerenciar os tokens de sessão (`credentials: 'include'`). As liberações de segurança na nuvem (CORS origens/credenciais) do sistema rodando sob o Fastify foram expandidas para assegurar uma interação completa com frontend de terceiros.

---

## Histórias de Usuário (Backlog)

| # | História                        | Descrição Resumida                                                                 |
|---|---------------------------------|------------------------------------------------------------------------------------|
| 1 | Autenticação de Colaboradores   | Login/logout com e-mail e senha para controle de acesso                            |
| 2 | Gerenciamento de Itens (CRUD)   | Cadastrar, editar e remover produtos com nome, categoria e unidade                 |
| 3 | Visualização de Inventário      | Lista de todos os itens com quantidade total e status                              |
| 4 | Registro de Entrada de Lotes    | Registrar chegada de doações com quantidade e data de validade                     |
| 5 | Registro de Saída para Doação   | Retirar itens do estoque registrando quantidade e destino                          |
| 6 | Monitoramento de Validade       | Filtrar lotes que vencem nos próximos 15 dias                                      |
| 7 | Alertas de Estoque Crítico      | Avisos visuais quando itens essenciais atingem quantidade mínima                   |
| 8 | Histórico de Movimentações      | Log com data, tipo, quantidade e colaborador responsável                           |
| 9 | Dashboard de Impacto Mensal     | Indicadores rápidos de kg doados e itens recebidos no mês                          |
|10 | Busca e Filtros Avançados       | Filtrar inventário por nome, categoria ou data de validade                         |

---

## Organização do Time

| Membro       | Área       | Responsabilidades                                                          |
|--------------|------------|----------------------------------------------------------------------------|
| João         | Backend    | Rotas Node/Express, banco de dados, lógica de cálculo de saldos            |
| Luiz Felipe  | Backend    | Rotas Node/Express, banco de dados, validações                             |
| Luis         | Frontend   | Tabelas dinâmicas, formulários de entrada/saída, alertas visuais           |
| Matheus      | Frontend   | Tabelas dinâmicas, formulários de entrada/saída, alertas visuais           |

---

## Padrões de Desenvolvimento

### Commits Git
| Prefixo  | Uso                                          |
|----------|----------------------------------------------|
| `add`    | Novas funcionalidades ou arquivos            |
| `fix`    | Correção de erros e bugs                     |
| `update` | Melhorias em código ou funções existentes    |
| `delete` | Remoção de arquivos ou trechos obsoletos     |

### Protocolo de IA
1. **Contexto** — iniciar sempre detalhando a história de usuário em foco.
2. **Especificidade** — cada prompt foca em um único detalhe técnico.
3. **Segurança** — não realizar alterações diretas no código sem revisão.
4. **Validação** — aprovação humana obrigatória antes de aplicar cada etapa gerada.

---

## Contato do Projeto

| Canal    | Informação                        |
|----------|-----------------------------------|
| E-mail   | contato@ongconecta.org.br         |
| Telefone | (31) 3000-0000                    |
| Cidade   | Belo Horizonte, MG — Brasil       |
| Horário  | Seg–Sex, 08h às 18h               |
