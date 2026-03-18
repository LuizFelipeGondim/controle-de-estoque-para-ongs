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

---

## HISTORIAS DE USUARIO (Backlog)

1. Autenticação de Colaboradores
O usuário deve realizar login e logout com e-mail e senha para garantir que apenas pessoas autorizadas gerenciem as doações da ONG.

2. Gerenciamento de Itens (CRUD)
O sistema deve permitir cadastrar, editar e remover produtos do catálogo, definindo nome, categoria (ex: grãos, higiene) e unidade de medida.

3. Visualização de Inventário Central
O usuário deve visualizar uma lista de todos os itens em estoque, mostrando a quantidade total acumulada e o status geral de cada produto.

4. Registro de Entrada de Lotes
O colaborador deve registrar a chegada de doações informando a quantidade recebida e, obrigatoriamente, a data de validade para controle de perecíveis.

5. Registro de Saída para Doação
O sistema deve permitir registrar a retirada de itens do estoque, subtraindo a quantidade do saldo total e registrando o destino da doação.

6. Monitoramento de Validade Próxima
O usuário deve acessar uma tela que filtre e destaque lotes de alimentos que vencerão nos próximos 15 dias para priorizar a distribuição.

7. Alertas de Estoque Crítico
O sistema deve exibir avisos visuais na interface sempre que um item essencial (ex: arroz) atingir uma quantidade mínima de segurança definida.

8. Histórico de Movimentações
O gestor deve visualizar um log detalhado contendo data, tipo (entrada/saída), quantidade e o colaborador responsável por cada alteração no estoque.

9. Dashboard de Impacto Mensal
A tela principal deve apresentar indicadores rápidos com o total de quilos doados e o número de itens recebidos dentro do mês atual.

10. Busca e Filtros Avançados
O usuário deve conseguir filtrar o inventário por nome, categoria ou data de validade para localizar itens rapidamente em momentos de alta demanda.

---

## ORGANIZAÇÃO DO TIME (4 Integrantes)

Para uma entrega eficiente, a divisão ideal seria:

* Backend (Joao e Luiz Felipe): Focam em Node/Express e Banco de Dados. Responsáveis pelas rotas de estoque, lógica de cálculo de saldos e validações.
* Frontend (Luis e Matheus): Focam em React. Responsáveis pelas tabelas dinâmicas, formulários de entrada/saída e alertas visuais de validade.
