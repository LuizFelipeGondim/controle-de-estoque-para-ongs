describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders the login page correctly', () => {
    cy.get('h1#login-title').should('contain', 'Bem-vindo de volta');
    cy.get('input#login-email').should('be.visible');
    cy.get('input#login-password').should('be.visible');
    cy.get('button#btn-login-submit').should('be.visible').and('contain', 'Entrar');
  });

  it('shows error message with invalid credentials', () => {
    cy.get('input#login-email').type('wrong@ong.com');
    cy.get('input#login-password').type('wrongpassword');
    cy.get('button#btn-login-submit').click();

    // Verify error message is displayed
    cy.get('.login-form__error')
      .should('be.visible')
      .and('contain', 'E-mail ou senha incorretos.');
  });

  it('logs in successfully with valid admin credentials', () => {
    cy.get('input#login-email').type('admin@ong.com');
    cy.get('input#login-password').type('admin123');
    cy.get('button#btn-login-submit').click();

    // After login, it should transition to StockOverview dashboard
    cy.get('.so-page-header__title', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Visão Geral dos Estoques');
    
    // Check navigation buttons are present
    cy.get('.so-header__nav').should('be.visible');
    cy.get('.so-header__logout').should('be.visible');
  });
});
