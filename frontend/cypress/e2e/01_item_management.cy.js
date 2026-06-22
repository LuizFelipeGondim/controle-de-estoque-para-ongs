/**
 * E2E Teste 1 — Cadastro e Gerenciamento Completo de Item
 *
 * Fluxo: Login → Criar item → Visualizar na listagem → Abrir detalhes →
 *        Editar via modal → Confirmar persistência → Criar lote vinculado →
 *        Tentar deletar item (bloqueado por FK) → Deletar lote primeiro →
 *        Deletar item com sucesso → Logout
 *
 * Histórias de Usuário cobertas: HU 1 (Autenticação), HU 2 (CRUD de Itens)
 *
 * Pré-condições:
 *   - Backend rodando em http://localhost:3333
 *   - Frontend rodando em http://localhost:5173
 *   - Usuário "admin@ong.com" / "admin123" cadastrado no banco de dados
 */

describe('Teste E2E 1 — Cadastro e Gerenciamento Completo de Item', () => {
  it('deve executar todo o fluxo de gerenciamento de itens com sucesso', () => {
    // Garante que partimos sempre de uma sessão limpa
    cy.clearCookies()
    cy.clearLocalStorage()

    // ─────────────────────────────────────────────────────────
    // Bloco 1: Autenticação
    // ─────────────────────────────────────────────────────────
    cy.log('--- 1. Autenticação ---')
    cy.visit('/')
    cy.get('#login-email').should('be.visible')
    cy.get('#login-password').should('be.visible')
    cy.get('#btn-login-submit').should('be.visible').and('contain', 'Entrar')

    cy.get('#login-email').type('admin@ong.com')
    cy.get('#login-password').type('senha_errada')
    cy.get('#btn-login-submit').click()
    cy.contains('E-mail ou senha incorretos.').should('be.visible')

    cy.get('#login-password').clear().type('admin123')
    cy.get('#btn-login-submit').click()
    cy.contains('button', 'Itens').should('be.visible')
    cy.contains('button', 'Lotes').should('be.visible')
    cy.contains('button', 'Sair').should('be.visible')

    // ─────────────────────────────────────────────────────────
    // Bloco 2: Navegação para a página de Itens
    // ─────────────────────────────────────────────────────────
    cy.log('--- 2. Navegação para a Página de Itens ---')
    cy.navigateTo('Itens')
    cy.contains('h1', 'Todos os Itens').should('be.visible')
    cy.contains('button', 'Novo Item').should('be.visible')

    // ─────────────────────────────────────────────────────────
    // Bloco 3: Criação de novo item
    // ─────────────────────────────────────────────────────────
    cy.log('--- 3. Criação de Novo Item ---')
    cy.contains('button', 'Novo Item').click()
    cy.contains('h2', 'Cadastrar Novo Item').should('be.visible')
    cy.get('input#name').should('be.visible')

    // Fechar para testar
    cy.get('.item-modal-content__close').click()
    cy.contains('h2', 'Cadastrar Novo Item').should('not.exist')

    // Criar de fato
    cy.contains('button', 'Novo Item').click()
    cy.get('input#name').type('Feijão Carioca')
    cy.get('select#category').select('grão')
    cy.get('select#unit_of_measure').select('kg')
    cy.get('input#min_stock_level').clear().type('10')
    cy.contains('button', 'Salvar Item').click()
    cy.contains('h2', 'Cadastrar Novo Item').should('not.exist')
    cy.contains('.item-card__name', 'Feijão Carioca').should('be.visible')
    cy.contains('.items-category-section', 'grão')
      .find('.item-card__name')
      .should('contain', 'Feijão Carioca')

    // ─────────────────────────────────────────────────────────
    // Bloco 4: Busca e Filtros
    // ─────────────────────────────────────────────────────────
    cy.log('--- 4. Busca e Filtros na Listagem ---')
    cy.get('.items-filter-input').type('Feijão')
    cy.contains('.item-card__name', 'Feijão Carioca').should('be.visible')
    cy.contains('button', 'Limpar Filtros').click()
    cy.get('.items-filter-input').should('have.value', '')

    // ─────────────────────────────────────────────────────────
    // Bloco 5: Modal de detalhes do item
    // ─────────────────────────────────────────────────────────
    cy.log('--- 5. Modal de Detalhes do Item ---')
    cy.contains('.item-card__name', 'Feijão Carioca').closest('.item-card').click()
    cy.get('.item-modal-content--large').should('be.visible')
    cy.get('.item-modal-content--large').contains('h2', 'Feijão Carioca').should('be.visible')
    cy.get('.item-modal-content--large')
      .contains('.details-label', 'Categoria:')
      .siblings('.details-value')
      .should('contain', 'grão')
    cy.get('.item-modal-content--large')
      .contains('.details-label', 'Mínimo de Segurança:')
      .siblings('.details-value')
      .should('contain', '10')
    cy.get('.item-modal-content--large')
      .contains('Nenhum lote disponível.')
      .should('exist')

    // Fechar detalhes
    cy.get('.item-modal-content--large .item-modal-content__close').click()
    cy.get('.item-modal-content--large').should('not.exist')

    // ─────────────────────────────────────────────────────────
    // Bloco 6: Edição do item
    // ─────────────────────────────────────────────────────────
    cy.log('--- 6. Edição do Item ---')
    cy.contains('.item-card__name', 'Feijão Carioca').closest('.item-card').click()
    cy.get('.item-modal-content--large').contains('button', 'Editar Cadastro').click()
    cy.contains('h2', 'Editar Item').should('be.visible')
    cy.get('input#name').should('have.value', 'Feijão Carioca')
    cy.get('select#category').should('have.value', 'grão')

    cy.get('input#name').clear().type('Feijão Preto')
    cy.get('select#category').select('proteína')
    cy.contains('button', 'Salvar Alterações').click()
    cy.contains('h2', 'Editar Item').should('not.exist')
    cy.contains('.item-card__name', 'Feijão Preto').should('be.visible')
    cy.contains('.item-card__name', 'Feijão Carioca').should('not.exist')
    cy.contains('.items-category-section', 'proteína')
      .find('.item-card__name')
      .should('contain', 'Feijão Preto')

    // ─────────────────────────────────────────────────────────
    // Bloco 7: Criar lote vinculado ao item
    // ─────────────────────────────────────────────────────────
    cy.log('--- 7. Criação de Lote Vinculado ---')
    cy.navigateTo('Lotes')
    cy.contains('h1', 'Visão de Lotes').should('be.visible')
    cy.contains('button', 'Adicionar Lote').click()
    cy.contains('h2', 'Adicionar Lote').should('be.visible')
    cy.get('select#modal-item').select('Feijão Preto (kg) - proteína')
    cy.get('input#modal-qty').type('50')

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 60)
    const isoDate = futureDate.toISOString().split('T')[0]
    cy.get('input#modal-date').type(isoDate)

    cy.contains('button', 'Confirmar Registro').click()
    cy.contains('h2', 'Adicionar Lote').should('not.exist')
    cy.contains('.item-name-primary', 'Feijão Preto').should('be.visible')

    // ─────────────────────────────────────────────────────────
    // Bloco 8: Tentativa de exclusão com lote vinculado
    // ─────────────────────────────────────────────────────────
    cy.log('--- 8. Bloqueio de Exclusão por Foreign Key ---')
    cy.navigateTo('Itens')
    cy.contains('h1', 'Todos os Itens').should('be.visible')
    cy.contains('.item-card__name', 'Feijão Preto').closest('.item-card').click()
    cy.get('.item-modal-content--large').should('be.visible')

    cy.on('window:confirm', () => true)
    cy.get('.item-modal-content--large').contains('button', 'Remover Item').click()
    cy.contains('Este tipo de item não pode ser deletado pois existem lotes ativos vinculados a ele.').should('be.visible')

    // Fechar a mensagem de erro clicando nela
    cy.get('.items-action-error').click()
    cy.get('.items-action-error').should('not.exist')

    // ─────────────────────────────────────────────────────────
    // Bloco 9: Excluir lote e depois excluir o item
    // ─────────────────────────────────────────────────────────
    cy.log('--- 9. Exclusão do Lote e do Item ---')
    cy.navigateTo('Lotes')
    cy.contains('h1', 'Visão de Lotes').should('be.visible')
    cy.contains('.item-name-primary', 'Feijão Preto').closest('.batch-row').click()
    cy.get('.batch-modal-content--large').should('be.visible')

    cy.on('window:confirm', () => true)
    cy.get('.batch-modal-form__delete-btn').contains('Excluir Lote').click()
    cy.contains('.item-name-primary', 'Feijão Preto').should('not.exist')

    cy.navigateTo('Itens')
    cy.contains('.item-card__name', 'Feijão Preto').closest('.item-card').click()
    cy.get('.item-modal-content--large').should('be.visible')
    cy.on('window:confirm', () => true)
    cy.get('.item-modal-content--large').contains('button', 'Remover Item').click()
    cy.contains('.item-card__name', 'Feijão Preto').should('not.exist')
    cy.get('.items-action-error').should('not.exist')

    // ─────────────────────────────────────────────────────────
    // Bloco 10: Logout
    // ─────────────────────────────────────────────────────────
    cy.log('--- 10. Logout ---')
    cy.logout()
    cy.get('#login-email').should('be.visible')
    cy.get('#btn-login-submit').should('be.visible')
  })
})
