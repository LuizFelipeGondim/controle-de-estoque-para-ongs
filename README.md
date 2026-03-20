# CONTROLE DE ESTOQUE PARA ONGS

Este documento define as diretrizes, tecnologias e o planejamento do backlog para o desenvolvimento do sistema de gerenciamento de insumos e doações.

---

## STACK
- Backend: Node.js + TypeScript
- Frontend: React.js + MCP Figma
- Testes: Vitest (front e back)
- Versionamento: Git (Repositório configurado)

---

## PADRÕES DE DESENVOLVIMENTO

### Versionamento (Git)
- Repositorios: Um para o frontend e outro para o backend
- Branches: Divisao entre ambientes e histórias.
- Padrão de Commits:
    - add: Novas funcionalidades ou arquivos.
    - fix: Correção de erros/bugs.
    - update: Melhorias em códigos ou funções existentes.
    - delete: Remoção de arquivos ou trechos obsoletos.

### Protocolo de Prompts (IA)
1. Contexto: Iniciar sempre detalhando a história de usuário.
2. Especificidade: Cada prompt posterior deve focar em detalhes técnicos únicos.
3. Segurança: Não realizar alterações de imediato no código.
4. Validação: Aprovação humana obrigatória para cada etapa gerada.
5. Agente: Claude Sonnet 4.6

### Reuniões
Uma reunião semanal na sexta às 16:00 (podendo ser mais de uma, se necessário).

---

## HISTORIAS DE USUARIO (Backlog)

1. Autenticação de Colaboradores: O usuário deve realizar login e logout com e-mail e senha para garantir que apenas pessoas autorizadas gerenciem as doações da ONG.

2. Criação/remoção de tipos de itens a serem doados: O sistema deve permitir cadastrar e remover produtos do catálogo, definindo nome, categoria (ex: grãos, higiene), informações nutricionais, entre outros.

3. Edição de tipos de itens: O sistema deve permitir editar do catálogo.

4. Registro de Entrada de Lotes: O colaborador deve registrar a chegada de doações informando a quantidade recebida e, obrigatoriamente, a data de validade para controle de perecíveis.

5. Registro de Saída para Doação: O sistema deve permitir registrar a retirada de itens do estoque em lotes, subtraindo a quantidade do saldo total e registrando o destino da doação.

6. Visualizar lote: O sistema deve permitir visualizar as informações de um lote em específico (dados do tipo de itens).

7. Visualização de inventário central: O usuário deve visualizar uma lista de todos os lotes em estoque, mostrando a quantidade e o status geral de cada produto.

8. Filtro de lotes de alimentos: O usuário podera filtrar lotes de alimentos por tipo de itens, data de validade, etc.

9. Seleção de itens em lotes para doação: O usuário poderá selecionar itens de cada lote para realizar a doação (pacote de doação).

10. Dashboard com informações gerais: O usuário deve visualizar indicadores rápidos com o total de quilos doados por item, acumulado de itens recebidos por período de tempo e alimentos essenciais em falta.

---

## ORGANIZAÇÃO DO TIME (4 Integrantes)

Para uma entrega eficiente, a divisão ideal seria:

* Backend (João e Luiz Felipe): Focam em Node/Express e Banco de Dados. Responsáveis pelas rotas de estoque, lógica de cálculo de saldos e validações.
* Frontend (Luís e Matheus): Focam em React. Responsáveis pelas tabelas dinâmicas, formulários de entrada/saída e alertas visuais de validade.
