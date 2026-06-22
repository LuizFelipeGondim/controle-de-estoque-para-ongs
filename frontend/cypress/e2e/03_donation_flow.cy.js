/**
 * E2E Teste 3 — Fluxo de Saída e Doações
 *
 * Fluxo: Login → Criar pacote de doação → Adicionar itens ao pacote →
 *        Validar bloqueio de exclusão em pacote finalizado →
 *        Cancelar pacote e verificar estorno ao estoque → Logout
 *
 * Histórias de Usuário cobertas: HU 1 (Autenticação), HU 5 (Saída de Lotes/Doações)
 */

describe('Teste E2E 3 — Fluxo de Saída e Doações', () => {
  it('deve executar o fluxo completo de doação e estorno com sucesso', () => {
    cy.clearCookies()
    cy.clearLocalStorage()

    // ─────────────────────────────────────────────────────────
    // Bloco 1: Preparação (Item e Lote para doação)
    // ─────────────────────────────────────────────────────────
    cy.log('--- 1. Preparação (Item e Lote para doação) ---')
    cy.fixture('users').then((users) => {
      cy.login(users.testUser.email, users.testUser.password)
    })

    cy.navigateTo('Itens')
    cy.contains('button', 'Novo Item').click()
    cy.get('input#name').type('Leite Integral')
    cy.get('select#category').select('laticínio')
    cy.get('select#unit_of_measure').select('litro')
    cy.get('input#min_stock_level').clear().type('50')
    cy.contains('button', 'Salvar Item').click()
    cy.contains('.item-card__name', 'Leite Integral').should('be.visible')

    cy.navigateTo('Lotes')
    cy.contains('button', 'Adicionar Lote').click()
    cy.get('select#modal-item').select('Leite Integral (litro) - laticínio')
    cy.get('input#modal-qty').type('100')

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const isoDate = futureDate.toISOString().split('T')[0]
    
    cy.get('input#modal-date').type(isoDate)
    cy.contains('button', 'Confirmar Registro').click()
    cy.contains('h2', 'Adicionar Lote').should('not.exist')
    cy.contains('.item-name-primary', 'Leite Integral').should('be.visible')

    // ─────────────────────────────────────────────────────────
    // Bloco 2: Criação de Pacote de Doação
    // ─────────────────────────────────────────────────────────
    cy.log('--- 2. Criação do Pacote de Doação ---')
    cy.navigateTo('Doações')
    cy.contains('h1', 'Pacotes de Doação').should('be.visible')

    cy.contains('button', 'Novo Pacote').click()
    
    cy.get('input#destination').type('Orfanato Esperança')
    cy.get('input#destination_address').type('Rua da Paz, 123')
    cy.get('textarea#notes').type('Doação mensal')
    
    cy.contains('button', 'Confirmar').click()

    cy.contains('.packet-destination', 'Orfanato Esperança').should('be.visible')
    cy.contains('.packet-status', 'preparando').should('be.visible')

    // ─────────────────────────────────────────────────────────
    // Bloco 3: Adição de Itens ao Pacote e Baixa no Estoque
    // ─────────────────────────────────────────────────────────
    cy.log('--- 3. Gerenciamento de Itens no Pacote ---')
    cy.contains('.packet-destination', 'Orfanato Esperança')
      .closest('.packet-card')
      .find('button.packet-action-btn')
      .contains('Gerenciar Itens')
      .click()

    cy.contains('h1', 'Orfanato Esperança').should('be.visible')
    cy.contains('p', 'Este pacote está vazio.').should('be.visible')

    cy.contains('button', '+ Adicionar Alimento').click()
    cy.get('select').contains('option', 'Leite Integral').should('contain', 'Disp: 100').invoke('val').then((val) => {
      cy.get('select').select(val)
    })
    cy.get('input#qty').type('40')
    cy.contains('button', 'Adicionar ao Pacote').click()

    cy.contains('.col-item', 'Leite Integral').should('be.visible')
    cy.contains('.col-qty', '40').should('be.visible')
    cy.contains('.summary-pill', '40.0').should('be.visible')

    cy.contains('button', 'Voltar para Lista').click()
    cy.navigateTo('Lotes')
    cy.contains('.item-name-primary', 'Leite Integral')
      .closest('.batch-row')
      .within(() => {
        cy.get('.col-qty').eq(1).should('contain', '60.0')
      })

    // ─────────────────────────────────────────────────────────
    // Bloco 4: Finalização e Validação
    // ─────────────────────────────────────────────────────────
    cy.log('--- 4. Finalização do Pacote ---')
    cy.navigateTo('Doações')

    cy.contains('.packet-destination', 'Orfanato Esperança')
      .closest('.packet-card')
      .find('button.packet-action-btn')
      .click() 

    cy.on('window:confirm', () => true)
    cy.contains('button', 'Finalizar Doação').click()

    cy.contains('h1', 'Pacotes de Doação').should('be.visible')
    cy.contains('.packet-destination', 'Orfanato Esperança')
      .closest('.packet-card')
      .find('.packet-status')
      .should('contain', 'finalizado')

    cy.contains('.packet-destination', 'Orfanato Esperança')
      .closest('.packet-card')
      .find('.packet-delete-btn')
      .should('not.exist')

    cy.contains('.packet-destination', 'Orfanato Esperança')
      .closest('.packet-card')
      .find('button.packet-action-btn')
      .contains('Ver Detalhes')
      .click()

    cy.contains('button', '+ Adicionar Alimento').should('not.exist')
    cy.contains('button', 'Finalizar Doação').should('not.exist')
    cy.contains('button', 'Cancelar Pacote').should('not.exist')
    cy.get('.item-remove-btn').should('not.exist')
    cy.contains('button', 'Voltar para Lista').click()

    // ─────────────────────────────────────────────────────────
    // Bloco 5: Teste de Estorno (Cancelamento)
    // ─────────────────────────────────────────────────────────
    cy.log('--- 5. Cancelamento de Pacote e Estorno de Estoque ---')
    cy.contains('button', 'Novo Pacote').click()
    cy.get('input#destination').type('Pacote Cancelado')
    cy.contains('button', 'Confirmar').click()

    cy.contains('.packet-destination', 'Pacote Cancelado')
      .closest('.packet-card')
      .find('button.packet-action-btn')
      .click()

    cy.contains('button', '+ Adicionar Alimento').click()
    cy.get('select').contains('option', 'Leite Integral').should('contain', 'Disp: 60').invoke('val').then((val) => {
      cy.get('select').select(val)
    })
    cy.get('input#qty').type('10')
    cy.contains('button', 'Adicionar ao Pacote').click()
    cy.contains('.col-qty', '10').should('be.visible')

    cy.on('window:confirm', () => true)
    cy.contains('button', 'Cancelar Pacote').click()

    cy.contains('.packet-destination', 'Pacote Cancelado')
      .closest('.packet-card')
      .find('.packet-status')
      .should('contain', 'cancelado')

    cy.navigateTo('Lotes')
    cy.contains('.item-name-primary', 'Leite Integral')
      .closest('.batch-row')
      .within(() => {
        cy.get('.col-qty').eq(1).should('contain', '60.0') // Voltou para 60
      })

    // ─────────────────────────────────────────────────────────
    // Bloco 6: Teardown
    // ─────────────────────────────────────────────────────────
    cy.log('--- 6. Teardown e Logout ---')
    cy.logout()
  })
})
