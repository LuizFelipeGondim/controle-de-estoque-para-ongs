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

```
Login  →  [clica Entrar]  →  StockOverview
                                   ↓
                             [clica Sair]
                                   ↓
                               Login
```

---

## Estado Atual

### Página de Login de Colaboradores (concluída)
A tela principal do frontend é a página de login da **Área do Colaborador**. Construída em React com design premium (glassmorphism + tema escuro), inclui:

- **Card glassmorphism** — container centralizado com backdrop blur, borda sutil e linha de acento gradiente no topo.
- **Identidade visual** — logo 🌱 ONGConecta, badge pulsante "Área do Colaborador".
- **Campo Nome do colaborador** — input de texto com ícone e foco estilizado.
- **Campo Senha** — input de senha com botão de mostrar/ocultar (👁️ / 🙈).
- **Botão Entrar** — ativo, navega para a página de visão geral dos estoques (`StockOverview`).
- **Fundo animado** — dois orbs com gradiente em movimento suave (`orb-drift`).
- **Responsivo** — layout adaptado para telas menores que 500px.

> A landing page institucional (Navbar, Hero, Stats, About, Values, Donation Banner, Footer) foi removida do fluxo principal e pode ser reintegrada futuramente como rota separada.

### Visão Geral dos Estoques — `StockOverview` (placeholder)
Página de destino após o login. Ainda sem conteúdo funcional, exibe:

- **Header fixo** — logo ONGConecta e botão "Sair" (retorna ao login).
- **Placeholder central** — ícone 📦, título "Visão Geral dos Estoques", descrição e badge "Em breve".

Esta página será desenvolvida nas próximas iterações para exibir os dados reais do estoque.

### Sistema de Estoque (em desenvolvimento)
As funcionalidades de autenticação real, CRUD de itens, controle de entradas/saídas, alertas e dashboard estão planejadas no backlog e serão implementadas nas próximas iterações.

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
