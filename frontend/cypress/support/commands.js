// ***********************************************
// Comandos customizados globais para os testes E2E do ONGConecta.
// Importado automaticamente pelo e2e.js.
// ***********************************************

/**
 * cy.login(email, password)
 * Realiza o login completo pela interface e aguarda o dashboard carregar.
 * Reutilizável em todos os testes E2E para evitar repetição de código.
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/')
  cy.get('#login-email').should('be.visible').type(email)
  cy.get('#login-password').should('be.visible').type(password)
  cy.get('#btn-login-submit').click()
  // Aguarda o dashboard (StockOverview) carregar verificando elemento do header
  cy.contains('button', 'Sair').should('be.visible')
})

/**
 * cy.navigateTo(page)
 * Navega para uma página via clique no botão de navegação do header.
 * Valores aceitos: 'Itens' | 'Lotes' | 'Doações' | 'Histórico' | 'Overview'
 */
Cypress.Commands.add('navigateTo', (page) => {
  cy.contains('button', page).click()
})

/**
 * cy.logout()
 * Clica no botão "Sair" e confirma o retorno à tela de login.
 */
Cypress.Commands.add('logout', () => {
  cy.contains('button', 'Sair').click()
  cy.get('#login-email').should('be.visible')
})
