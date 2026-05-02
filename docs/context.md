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

### Backend (Integrado)
| Tecnologia      | Função                             |
|-----------------|------------------------------------|
| Node.js         | Runtime JavaScript no servidor     |
| Fastify         | Framework HTTP (Performance)       |
| TypeScript      | Tipagem estática                   |
| Better-Sqlite3  | Banco de dados local               |
| Zod             | Validação de schemas               |

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
│   │   ├── BatchesPage.jsx     # Gestão detalhada de lotes (visão agrupada por item)
│   │   ├── BatchesPage.css     # Estilos premium (glassmorphism/cards) para lotes
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
Login  →  [clica Entrar]  →  StockOverview  → [clica Ver itens] → ItemsPage
                                    ↓     ↘                       ↓ (Modal)
                              [clica Sair]  ↘[clica Ver lotes] → BatchesPage
                                    ↓                                ↑ (Modal)
                                Login                           [Adicionar Lote]
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

### Visão Geral dos Estoques — `StockOverview` (concluída e integrada)
Página de destino após o login. Composta por seções dinâmicas que fornecem inteligência operacional em tempo real:

**Header fixo** — logo ONGConecta, barra de navegação com acesso rápido (Histórico, Doações, Lotes, Itens) e botão "Sair" (retorna à tela de login).

**Fundo Animado** — A tela principal agora utiliza um efeito de degradê dinâmico nas laterais (bordas), criando uma atmosfera translúcida de *Glassmorphism* através de filtros CSS e `mask-image`.

**Seção 1 — ⚠️ Avisos**
Painéis automáticos de tamanho fixo com rolagem interna inteligente (scroll), empilhamento responsivo, e cores de urgência. Alertam sobre:
- *Validade Próxima* — lista lotes com vencimento iminente (até 15 dias).
- *Estoque Crítico* — lista itens operando abaixo da quantidade mínima segura.
- *Lotes Vencidos* — painel em destaque vermelho listando lotes expirados. **Novidade**: Os itens desta lista agora são clicáveis (`deep linking`), levando o usuário diretamente ao card de detalhes do lote na página de Lotes.

**Seção 2 — 📦 Estoque por Categoria**
Grid de cards que exibe o saldo atual em tempo real por tipo de alimento, incluindo a exibição dinâmica da **unidade de medida**. Adicionalmente, todas as categorias recebem tratamento visual com primeira letra maiúscula (*Capitalize*) para melhor legibilidade.

**Seção 3 — 📊 Dashboard de Performance Mensal (Integrado)**
Dividido em duas áreas de análise de impacto social:
- **Itens Recebidos**: Integrado ao backend (`GET /batch`), exibe o total em kg recebido no mês atual e um gráfico de barras com a distribuição por categoria (Real).
- **Itens Doados**: Exibe o impacto de retiradas mensais com placeholders realistas, preparando a interface para a futura integração do módulo de doações.
- **Gráficos de Impacto**: Componente visual customizado que mostra a proporção de alimentos por categoria através de barras horizontais animadas.

### Página de Itens — `ItemsPage` (concluída e integrada)
Acessível a partir do painel de Visão Geral, esta página lista todos os tipos de itens através de requisições HTTP em tempo real:
- **Busca e Filtros Inteligentes**: Implementação de barra de busca textual e dropdown seletor de categorias, filtrando os resultados exibidos na tela de forma reativa e instantânea.
- **Gestão de Itens (Criar e Editar)**: Inclusão de botão "Novo Item" que abre um modal de cadastro integrado ao `POST /items`. Conta também com funcionalidade de **Edição**, reaproveitando o mesmo modal com requisição `PUT /items/:id`.
- **Exclusão Segura**: Opção de remover itens diretamente da lista, com trava de segurança que bloqueia a remoção de alimentos que ainda possuam lotes vinculados.
- **Interatividade Total (Card de Detalhes)**: Os cards de itens agora são clicáveis. Ao clicar, abre-se um modal expansivo (`item-modal-content--large`) que organiza as informações em:
  - **Informações Gerais**: Categoria, Estoque Total Ativo, Nível de Segurança e Informação Nutricional.
  - **Lotes Vinculados (Painel Lateral)**: Uma lista dedicada com rolagem interna que exibe todos os lotes ativos e vencidos para aquele item específico, permitindo uma conferência detalhada sem sair da página.
  - **Ação de Edição**: Atalho direto para abrir o modal de edição do cadastro do item.
- **Visualização Simplificada na Lista**: A listagem principal permanece limpa e organizada, focada em dados agregados, enquanto o detalhamento por lote foi movido para o modal interativo.
- **Cálculo de Estoque Real**: O saldo total exibido nos cards contabiliza apenas as quantidades dos lotes que estão dentro do prazo de validade.
- **Design Agrupado**: Agrupamento por categorias de alimentos direto no fluxo de visualização, sempre renderizando as chaves capitalizadas.

### Visualização de Lotes — `BatchesPage` (concluída e integrada)
Página dedicada à gestão refinada das doações recebidas no estoque:
- **Design Premium em Tabela**: Layout atualizado para uma lista flexível de linhas estruturadas, mantendo os efeitos **Glassmorphism**, fundos translúcidos e animações suaves.
- **Interatividade Total (Card de Detalhes)**: Cada linha da tabela de lotes agora é clicável. Ao clicar, abre-se um modal expansivo (`batch-modal-content--large`) com:
  - **Detalhes do Lote**: Status (Disponível/Vencido/Esgotado), Qtd. Inicial vs Atual, e datas formatadas.
  - **Informações do Item**: Card lateral integrado exibindo ícone da categoria, unidade de medida e nível de estoque mínimo do alimento atrelado.
  - **Ações Rápidas**: Opção de **Excluir Lote** movida para dentro do modal para evitar cliques acidentais na listagem principal.
- **Emojis Dinâmicos**: Utilização de ícones visuais baseados na categoria do alimento (ex: 🌾 para cereais, 🥩 para proteínas) tanto na lista quanto no modal.
- **Agrupamento por Data de Entrada**: Os lotes agora são agrupados automaticamente pelos dias em que foram recebidos no estoque, exibindo no cabeçalho o total recebido naquela data.
- **Busca e Filtros Dinâmicos**: Campos de busca por nome de alimento, filtro por categoria e seleção de **data limite de validade** integrados no painel superior.
- **Colunas de Quantidade Detalhadas**: Visualização clara dividindo a "Quantidade Inicial" e a "Quantidade Atual".
- **Gestão de Lotes**: Exclusão segura integrada com confirmação e recálculo de saldos.
- **Adição Integrada (Modal)**: O processo de "Adicionar Lote" acontece nativamente na página através de um modal flutuante imersivo.

### Gestão de Doações — `DonationsPage` (concluída e integrada)
Página responsável por registrar e monitorar a saída de itens do estoque:
- **Criação de Pacotes**: Permite gerenciar o destino, data de entrega e observações da doação.
- **Inclusão Segura de Itens**: O modal de seleção de estoque filtra inteligentemente os dados e impede totalmente o uso de lotes vencidos na montagem de pacotes.
- **Rastreabilidade e Estorno**: Permite gerenciar itens internamente, bem como cancelar o pacote inteiro, realizando o estorno automático das quantidades aos lotes originais no banco de dados.

### Sistema de Autenticação e Backend (Integrado)
O roteamento de login interage em fluxo constante com o backend com uso de cookies para gerenciar os tokens de sessão (`credentials: 'include'`). As liberações de segurança (CORS) foram expandidas para permitir explicitamente os métodos `GET`, `POST`, `PATCH`, `DELETE` e `OPTIONS`, assegurando a funcionalidade completa de gestão de dados.

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
