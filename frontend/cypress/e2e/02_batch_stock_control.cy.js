/**
 * E2E Teste 2 — Entrada de Lote e Controle de Estoque
 *
 * Fluxo: Login → Criar item → Criar lote via formulário → Validar formulário →
 *        Verificar saldo no StockOverview → Verificar modal de detalhes do lote →
 *        Verificar aba lateral no modal do item → Logout
 *
 * Histórias de Usuário cobertas: HU 1 (Autenticação), HU 4 (Entrada de Lotes), HU 3 (Inventário)
 */

describe('Teste E2E 2 — Entrada de Lote e Controle de Estoque', () => {
  it('deve executar o fluxo completo de registro de lote com sucesso', () => {
    cy.clearCookies()
    cy.clearLocalStorage()

    // ─────────────────────────────────────────────────────────
    // Bloco 1: Preparação
    // ─────────────────────────────────────────────────────────
    cy.log('--- 1. Login e Preparação do Item ---')
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password)
    })

    cy.navigateTo('Itens')
    cy.contains('button', 'Novo Item').click()
    cy.get('input#name').type('Arroz Integral')
    cy.get('select#category').select('cereal')
    cy.get('select#unit_of_measure').select('kg')
    cy.get('input#min_stock_level').clear().type('100')
    cy.contains('button', 'Salvar Item').click()
    cy.contains('.item-card__name', 'Arroz Integral').should('be.visible')

    // ─────────────────────────────────────────────────────────
    // Bloco 2: Validação e Registro de Entrada de Lote
    // ─────────────────────────────────────────────────────────
    cy.log('--- 2. Registro de Entrada de Lote ---')
    cy.navigateTo('Lotes')
    cy.contains('button', 'Adicionar Lote').click()

    cy.contains('button', 'Confirmar Registro').click()
    cy.contains('.batch-modal-form__error', 'Por favor, preencha todos os campos.').should('be.visible')

    cy.get('select#modal-item').select('Arroz Integral (kg) - cereal')
    cy.get('input#modal-qty').type('200')

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 60)
    const isoDate = futureDate.toISOString().split('T')[0]

    cy.get('input#modal-date').type(isoDate)
    cy.contains('button', 'Confirmar Registro').click()
    cy.contains('h2', 'Adicionar Lote').should('not.exist')

    cy.contains('.item-name-primary', 'Arroz Integral').should('be.visible')
    cy.contains('.item-name-primary', 'Arroz Integral')
      .closest('.batch-row')
      .within(() => {
        cy.get('.col-qty').eq(0).should('contain', '200.0')
        cy.get('.col-qty').eq(1).should('contain', '200.0')
        cy.get('.col-status').should('contain', 'Disponível')
      })

    // ─────────────────────────────────────────────────────────
    // Bloco 3: Verificação de Saldos no Dashboard
    // ─────────────────────────────────────────────────────────
    cy.log('--- 3. Reflexo do Estoque no Dashboard ---')
    cy.navigateTo('Overview')
    cy.contains('.so-cat-card__name', 'cereal')
      .siblings('.so-cat-card__kg')
      .should('contain', '200.0')

    // ─────────────────────────────────────────────────────────
    // Bloco 4: Detalhes do Lote na BatchesPage
    // ─────────────────────────────────────────────────────────
    cy.log('--- 4. Detalhes do Lote ---')
    cy.navigateTo('Lotes')
    cy.contains('.item-name-primary', 'Arroz Integral').closest('.batch-row').click()

    cy.get('.batch-modal-content--large').should('be.visible')
    cy.get('.batch-modal-content--large').within(() => {
      cy.contains('.batch-detail-label', 'Qtd. Inicial:').siblings('span').should('contain', '200')
      cy.contains('.batch-detail-label', 'Qtd. Atual:').siblings('span').should('contain', '200')
      cy.contains('.batch-detail-label', 'Status:').siblings('.status-pill').should('contain', 'Disponível')
      cy.contains('.batch-item-category', 'cereal').should('exist')
      cy.contains('Mínimo:').parent().should('contain', '100')
    })
    cy.get('.batch-modal-content__close').click()

    // ─────────────────────────────────────────────────────────
    // Bloco 5: Lotes Vinculados na ItemsPage
    // ─────────────────────────────────────────────────────────
    cy.log('--- 5. Lotes Vinculados no Detalhe do Item ---')
    cy.navigateTo('Itens')
    cy.contains('.item-card__name', 'Arroz Integral').closest('.item-card').click()
    cy.get('.item-modal-content--large').should('be.visible')

    cy.get('.item-modal-content--large').within(() => {
      cy.contains('.details-label', 'Estoque Total:').siblings('.details-value').should('contain', '200')
      cy.contains('Lotes Ativos').should('exist')
      cy.get('.batch-item').should('have.length', 1)
      cy.get('.batch-item').should('contain', '200 kg')
    })
    cy.get('.item-modal-content__close').click()

    // ─────────────────────────────────────────────────────────
    // Bloco 6: Encerramento
    // ─────────────────────────────────────────────────────────
    cy.log('--- 6. Logout e Limpeza ---')
    cy.navigateTo('Lotes')
    cy.contains('.item-name-primary', 'Arroz Integral').closest('.batch-row').click()
    cy.on('window:confirm', () => true)
    cy.get('.batch-modal-form__delete-btn').contains('Excluir Lote').click()

    cy.navigateTo('Itens')
    cy.contains('.item-card__name', 'Arroz Integral').closest('.item-card').click()
    cy.on('window:confirm', () => true)
    cy.get('.item-modal-content--large').contains('button', 'Remover Item').click()

    cy.logout()
  })
})
