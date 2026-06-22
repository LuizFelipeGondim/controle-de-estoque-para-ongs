/**
 * E2E Teste 4 — Monitoramento de Alertas e Deep Linking
 *
 * Fluxo: Login → Criar cenário de lote com validade crítica →
 *        Validar exibição do alerta na tela de Visão Geral →
 *        Clicar no alerta (Deep Linking) → Validar abertura do modal na BatchesPage →
 *        Logout
 *
 * Histórias de Usuário cobertas: HU 1 (Autenticação), HU 6 (Deep Linking de Alertas), HU 7 (Dashboard)
 */

describe('Teste E2E 4 — Monitoramento de Alertas e Deep Linking', () => {
  it('deve executar o fluxo completo de alertas e deep linking', () => {
    cy.clearCookies()
    cy.clearLocalStorage()

    // ─────────────────────────────────────────────────────────
    // Bloco 1: Preparação
    // ─────────────────────────────────────────────────────────
    cy.log('--- 1. Preparação (Criar cenário crítico) ---')
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password)
    })

    cy.navigateTo('Itens')
    cy.contains('button', 'Novo Item').click()
    cy.get('input#name').type('Iogurte Natural')
    cy.get('select#category').select('laticínio')
    cy.get('select#unit_of_measure').select('unidade')
    cy.get('input#min_stock_level').clear().type('10')
    cy.contains('button', 'Salvar Item').click()
    cy.contains('.item-card__name', 'Iogurte Natural').should('be.visible')

    cy.navigateTo('Lotes')
    cy.contains('button', 'Adicionar Lote').click()
    cy.get('select#modal-item').select('Iogurte Natural (unidade) - laticínio')
    cy.get('input#modal-qty').type('20')

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2) // Vence em 2 dias (urgente)
    const isoDate = futureDate.toISOString().split('T')[0]

    cy.get('input#modal-date').type(isoDate)
    cy.contains('button', 'Confirmar Registro').click()

    cy.contains('.item-name-primary', 'Iogurte Natural').should('be.visible')

    // ─────────────────────────────────────────────────────────
    // Bloco 2: Validação no Dashboard
    // ─────────────────────────────────────────────────────────
    cy.log('--- 2. Monitoramento no Dashboard ---')
    cy.navigateTo('Overview')

    cy.get('.so-alert-panel--expiry').within(() => {
      cy.contains('.so-alert-item__name', 'Iogurte Natural').should('be.visible')
      cy.get('li').contains('Iogurte Natural').closest('li').should('have.class', 'so-alert-item--urgent')
      cy.contains('.so-alert-item__days', 'Vence em 2 dias').should('be.visible')
    })

    // ─────────────────────────────────────────────────────────
    // Bloco 3: Teste de Deep Linking
    // ─────────────────────────────────────────────────────────
    cy.log('--- 3. Teste de Deep Linking ---')
    cy.get('.so-alert-panel--expiry').within(() => {
      cy.contains('.so-alert-item__name', 'Iogurte Natural').closest('li').click()
    })

    cy.contains('h1', 'Visão de Lotes').should('be.visible')
    cy.get('.batch-modal-content--large').should('be.visible')

    cy.get('.batch-modal-content--large').within(() => {
      cy.contains('h4', 'Iogurte Natural').should('be.visible')
      cy.contains('.batch-detail-label', 'Qtd. Atual:').siblings('span').should('contain', '20 unidade')
    })

    cy.get('.batch-modal-content__close').click()

    // ─────────────────────────────────────────────────────────
    // Bloco 4: Limpeza
    // ─────────────────────────────────────────────────────────
    cy.log('--- 4. Limpeza e Logout ---')
    cy.contains('.item-name-primary', 'Iogurte Natural').closest('.batch-row').click()
    cy.on('window:confirm', () => true)
    cy.get('.batch-modal-form__delete-btn').contains('Excluir Lote').click()

    cy.navigateTo('Itens')
    cy.contains('.item-card__name', 'Iogurte Natural').closest('.item-card').click()
    cy.on('window:confirm', () => true)
    cy.get('.item-modal-content--large').contains('button', 'Remover Item').click()

    cy.logout()
  })
})
