# Proposta de Testes End-to-End — ONGConecta

## Contexto

O sistema ONGConecta já possui testes de integração cobrindo cada rota da API individualmente (arquivos `.spec.ts` no backend). Os testes E2E propostos aqui têm um objetivo diferente: **validar fluxos completos do ponto de vista do usuário**, interagindo com a aplicação React através do navegador, exatamente como um colaborador da ONG faria no dia a dia.

### Ferramenta: Cypress

Os testes serão implementados com **Cypress**, executando contra o frontend React (porta `5173`) com o backend Fastify em execução (porta `3333`). O Cypress controlará o navegador, interagindo com elementos reais da interface — campos de formulário, botões, modais e tabelas — e verificando os resultados visuais e de estado.

> **Diferença dos testes existentes:** os `.spec.ts` testam a **API diretamente via HTTP**. Os testes Cypress testam a **jornada do colaborador na interface**, passando por login, navegação entre páginas, preenchimento de formulários e verificação de feedbacks visuais.

---

## Configuração Esperada

```
frontend/
├── cypress/
│   ├── e2e/
│   │   ├── 01_item_management.cy.js
│   │   ├── 02_batch_stock_control.cy.js
│   │   ├── 03_donation_flow.cy.js
│   │   └── 04_alerts_monitoring.cy.js
│   ├── support/
│   │   ├── commands.js   # Comandos customizados (ex: cy.login())
│   │   └── e2e.js
│   └── fixtures/
│       └── users.json    # Credenciais de teste
├── cypress.config.js     # baseUrl: http://localhost:5173
└── package.json
```

### Comando customizado sugerido (`support/commands.js`)

```js
// Encapsula o fluxo de login para reuso entre todos os testes
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');
  cy.get('#login-email').type(email);
  cy.get('#login-password').type(password);
  cy.get('#btn-login-submit').click();
  cy.contains('Visão Geral').should('be.visible'); // aguarda o dashboard carregar
});
```

> **Pré-condição para todos os testes:** o banco de dados de teste deve conter ao menos um usuário colaborador cadastrado com e-mail e senha conhecidos (ex.: `colaborador@teste.com` / `senha123`). O backend deve estar rodando em `http://localhost:3333` e o frontend em `http://localhost:5173`.

---

## Teste E2E 1 — Cadastro e Gerenciamento Completo de Item

### Objetivo
Validar que um colaborador autenticado consegue criar, visualizar, editar e remover um tipo de item através da interface, e que a regra de negócio de bloqueio de remoção (item com lote vinculado) é exibida corretamente na tela.

### Arquivo: `cypress/e2e/01_item_management.cy.js`

### Fluxo

```
[Login]
1. Acessar http://localhost:5173
2. Preencher e-mail e senha válidos
3. Clicar em "Entrar"
4. Verificar redirecionamento para o dashboard (StockOverview)

[Navegação para Itens]
5. Clicar no botão "Itens" na barra de navegação
6. Verificar que a página de itens é exibida

[Criar Item]
7. Clicar no botão "Novo Item"
8. Verificar que o modal de cadastro é aberto
9. Preencher: Nome = "Feijão Carioca", Categoria = "grão", Unidade = "kg"
10. Clicar em "Salvar"
11. Verificar que o modal fecha e "Feijão Carioca" aparece na listagem

[Editar Item]
12. Localizar o card de "Feijão Carioca" e clicar no ícone de edição
13. Verificar que o modal abre com os dados pré-preenchidos
14. Alterar o nome para "Feijão Preto"
15. Clicar em "Salvar"
16. Verificar que a listagem exibe "Feijão Preto" no lugar de "Feijão Carioca"

[Tentar Remover Item Com Lote Vinculado]
17. Adicionar um lote para "Feijão Preto" via interface (página de Lotes)
18. Voltar para a página de Itens
19. Tentar deletar "Feijão Preto"
20. Verificar que uma mensagem de erro/bloqueio é exibida na tela
    (ex.: toast ou mensagem "Item não pode ser removido com lotes vinculados")

[Remover Item Após Excluir Lote]
21. Navegar para a página de Lotes e excluir o lote de "Feijão Preto"
22. Voltar para Itens e deletar "Feijão Preto"
23. Verificar que o item desaparece da listagem

[Logout]
24. Clicar em "Sair"
25. Verificar retorno à tela de login
```

### Critérios de Sucesso
- O formulário de criação/edição de itens funciona e persiste dados corretamente.
- A listagem se atualiza em tempo real após criar e editar.
- O sistema exibe feedback visual quando a exclusão é bloqueada por Foreign Key.
- O item é removido com sucesso após desvincular o lote.

---

## Teste E2E 2 — Entrada de Lote e Controle de Estoque

### Objetivo
Validar o fluxo de registro de chegada de uma doação (lote): preencher o formulário de novo lote, verificar que o estoque é atualizado na interface, e confirmar que o status do lote muda para "Esgotado" quando a quantidade chega a zero.

### Arquivo: `cypress/e2e/02_batch_stock_control.cy.js`

### Fluxo

```
[Login e Preparação]
1. Realizar login com credenciais válidas
2. Criar o tipo de item "Arroz Integral" (categoria: cereal, unidade: kg)
   via formulário da página de Itens

[Registro de Entrada de Lote]
3. Navegar para a página de Lotes ("Ver Lotes")
4. Clicar em "Adicionar Lote"
5. Verificar que o modal de registro de lote é aberto
6. Preencher:
   - Item: "Arroz Integral"
   - Quantidade: 200
   - Data de validade: 60 dias a partir de hoje
7. Clicar em "Salvar"
8. Verificar que o novo lote aparece na listagem com:
   - Quantidade Inicial = 200
   - Quantidade Atual = 200
   - Status = "Disponível"

[Validação de Campos Obrigatórios]
9. Clicar em "Adicionar Lote" novamente
10. Tentar submeter o formulário sem preencher a data de validade
11. Verificar que o formulário exibe uma mensagem de validação
    e não é submetido

[Verificação no Dashboard]
12. Navegar para o StockOverview (Visão Geral)
13. Verificar que a categoria "cereal" exibe saldo atualizado
    refletindo os 200kg recém-adicionados

[Detalhes do Lote]
14. Voltar para a página de Lotes
15. Clicar no lote de "Arroz Integral" para abrir o modal de detalhes
16. Verificar que o modal exibe:
    - Quantidade Inicial: 200
    - Quantidade Atual: 200
    - Status: Disponível
    - Nome do item: Arroz Integral

[Verificação de Lote na Página de Itens]
17. Navegar para Itens e clicar no card de "Arroz Integral"
18. Verificar que o modal de detalhes do item exibe o lote vinculado
    no painel lateral "Lotes Vinculados"

[Logout]
19. Clicar em "Sair" e verificar retorno ao login
```

### Critérios de Sucesso
- O modal de adição de lote valida campos obrigatórios antes de submeter.
- O lote criado aparece imediatamente na listagem com dados corretos.
- O dashboard (StockOverview) reflete o novo saldo da categoria em tempo real.
- O modal de detalhes do item lista o lote recém-criado no painel lateral.

---

## Teste E2E 3 — Fluxo Completo de Doação com Estorno

### Objetivo
Validar o fluxo de maior impacto social do sistema: registrar a saída de itens para doação. O teste cobre a criação de um pacote de doação, a adição de itens com débito automático de estoque, o estorno de um item e a finalização do pacote, verificando todos os feedbacks visuais ao longo do processo.

### Arquivo: `cypress/e2e/03_donation_flow.cy.js`

### Fluxo

```
[Preparação via Interface]
1. Realizar login
2. Criar item "Farinha de Trigo" (unidade: kg) em Itens
3. Criar lote com 100kg de "Farinha de Trigo" em Lotes
   (validade: 90 dias a partir de hoje)

[Criação do Pacote de Doação]
4. Navegar para a página de Doações ("Doações" no menu)
5. Clicar em "Novo Pacote"
6. Preencher:
   - Destino: "Abrigo São José"
   - Endereço: "Rua das Flores, 100"
   - Data de Doação: amanhã
   - Observações: "Urgente"
7. Clicar em "Criar Pacote"
8. Verificar que o pacote "Abrigo São José" aparece na listagem
   com status "Preparando"

[Adição de Itens ao Pacote]
9. Abrir o pacote "Abrigo São José"
10. Clicar em "Adicionar Item"
11. Selecionar o lote de "Farinha de Trigo" (100kg disponíveis)
12. Informar quantidade: 30
13. Confirmar adição
14. Verificar que o item aparece na lista do pacote (30kg de Farinha)
15. Verificar que o peso total do pacote exibe "30 kg"

[Verificação de Débito no Estoque]
16. Navegar para Lotes
17. Localizar o lote de "Farinha de Trigo"
18. Verificar que a Quantidade Atual é 70 (100 - 30)

[Tentativa de Exceder Estoque]
19. Voltar ao pacote de doação
20. Tentar adicionar 80kg de "Farinha de Trigo" (excede os 70 restantes)
21. Verificar que uma mensagem de erro é exibida:
    (ex.: "Quantidade solicitada supera o estoque atual do lote")

[Estorno de Item]
22. Remover o item de 30kg do pacote (estornar)
23. Verificar que o item desaparece da lista do pacote
24. Verificar que o peso total volta a "0 kg"
25. Navegar para Lotes e confirmar que a Farinha voltou para 100kg

[Finalização do Pacote]
26. Adicionar novamente 50kg de "Farinha de Trigo" ao pacote
27. Finalizar o pacote (mudar status para "Finalizado")
28. Verificar que o status exibido na listagem muda para "Finalizado"
29. Tentar adicionar novo item ao pacote finalizado
30. Verificar que o sistema bloqueia a ação e exibe mensagem de erro

[Logout]
31. Clicar em "Sair" e verificar retorno à tela de login
```

### Critérios de Sucesso
- A adição de itens ao pacote desconta o estoque do lote em tempo real.
- O peso total do pacote é calculado e exibido corretamente na interface.
- O sistema impede a adição de quantidade que excede o estoque disponível.
- O estorno restaura exatamente a quantidade ao lote de origem.
- Após finalização, o pacote fica bloqueado para novos itens.

---

## Teste E2E 4 — Monitoramento: Alertas de Validade e Estoque Crítico

### Objetivo
Validar que o painel de Visão Geral (StockOverview) exibe corretamente os alertas de **lotes próximos ao vencimento**, **lotes vencidos** e **estoque crítico**, refletindo os dados reais do banco em tempo real. Valida também o *deep linking*: clicar em um alerta de lote vencido e ser direcionado ao detalhe correto na página de Lotes.

### Arquivo: `cypress/e2e/04_alerts_monitoring.cy.js`

### Fluxo

```
[Preparação — Cenário de Alerta de Validade Próxima]
1. Realizar login
2. Criar item "Óleo de Soja" (categoria: óleo, unidade: litro)
3. Criar lote com 30 litros de "Óleo de Soja"
   com data de validade = hoje + 10 dias   ← deve aparecer no alerta

[Preparação — Cenário de Lote Vencido]
4. Criar item "Leite em Pó" (categoria: laticínio, unidade: kg,
   estoque mínimo: 50)
5. Criar lote com 10kg de "Leite em Pó"
   com data de validade = hoje - 1 dia (ontem)   ← lote vencido

[Preparação — Cenário de Estoque Crítico]
   (O lote de "Leite em Pó" já cumpre esse papel:
   10kg < 50kg de estoque mínimo configurado)

[Verificação dos Alertas no Dashboard]
6. Navegar para o StockOverview (Visão Geral)
7. Verificar que o painel "⚠️ Validade Próxima" está visível
8. Verificar que "Óleo de Soja" aparece listado nesse painel

9. Verificar que o painel "🔴 Lotes Vencidos" está visível
10. Verificar que "Leite em Pó" aparece listado nesse painel

11. Verificar que o painel "⚠️ Estoque Crítico" está visível
12. Verificar que "Leite em Pó" aparece listado nesse painel

[Verificação do Deep Linking (Lote Vencido → Página de Lotes)]
13. Clicar no item "Leite em Pó" dentro do painel "Lotes Vencidos"
14. Verificar que a página de Lotes é aberta automaticamente
15. Verificar que o modal de detalhes do lote vencido de "Leite em Pó"
    é aberto automaticamente (deep link com initialBatchId)

[Verificação de Lote Saudável Fora dos Alertas]
16. Criar item "Arroz" e lote com validade em 90 dias e 200kg
17. Voltar ao dashboard
18. Verificar que "Arroz" NÃO aparece nos painéis de alerta

[Verificação de Filtros na Página de Lotes]
19. Navegar para a página de Lotes
20. Usar o filtro de "Data limite de validade" com data = hoje + 15 dias
21. Verificar que "Óleo de Soja" aparece na listagem filtrada
22. Verificar que "Arroz" (vence em 90 dias) NÃO aparece

[Logout e Proteção de Rota]
23. Clicar em "Sair"
24. Tentar acessar manualmente uma página interna
    (ex.: forçar navegação clicando em botão sem estar logado)
25. Verificar que o sistema redireciona para a tela de login
```

### Critérios de Sucesso
- Os três painéis de alerta (Validade Próxima, Lotes Vencidos, Estoque Crítico) são renderizados e exibem os itens corretos.
- Lotes com validade > 15 dias e estoque acima do mínimo **não** aparecem nos painéis de alerta.
- O deep linking do painel "Lotes Vencidos" abre o modal do lote correto na página de Lotes.
- O filtro de data de validade na página de Lotes funciona corretamente via interface.
- Sem sessão ativa, o sistema impede o acesso às páginas internas.

---

## Resumo dos Testes Propostos

| # | Arquivo Cypress | Fluxo Principal | Histórias de Usuário Cobertas |
|---|-----------------|-----------------|-------------------------------|
| 1 | `01_item_management.cy.js` | Login → CRUD de item via UI → Bloqueio FK visual → Remoção | HU 1, HU 2 |
| 2 | `02_batch_stock_control.cy.js` | Login → Registrar lote via formulário → Verificar saldo no dashboard | HU 1, HU 3, HU 4 |
| 3 | `03_donation_flow.cy.js` | Login → Criar pacote → Adicionar itens → Estornar → Finalizar | HU 1, HU 5, HU 8 |
| 4 | `04_alerts_monitoring.cy.js` | Login → Criar cenários críticos → Verificar alertas e deep link | HU 1, HU 6, HU 7, HU 10 |

> **Teste mais crítico:** o **Teste 3** valida a integridade transacional das doações — o fluxo de maior impacto social do ONGConecta.

## Como executar?

```bash
# Na pasta frontend/, com frontend e backend rodando:
npm run cypress:open    # Interface gráfica (recomendado para desenvolvimento)
npm run cypress:run     # Headless (CI)
```
