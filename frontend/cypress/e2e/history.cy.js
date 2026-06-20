describe('History Page', () => {
  beforeEach(() => {
    // Intercept initial loads
    cy.intercept('GET', '**/batch', {
      body: [
        {
          id: 'batch-1',
          item_type_id: 'item-1',
          item_name: 'Arroz Agulhinha',
          item_category: 'cereal',
          item_unit_of_measure: 'kg',
          item_conversion_factor: 1,
          current_quantity: 40,
          initial_quantity: 50,
          expiration_date: '2026-12-31',
          status: 'disponivel',
          created_at: '2026-06-20T12:00:00.000Z'
        }
      ]
    }).as('getBatches');

    cy.intercept('GET', '**/donation-packets?status=finalizado', {
      body: [
        {
          id: 'packet-1',
          status: 'finalizado',
          destination: 'Creche Feliz',
          destination_address: 'Rua Principal, 123',
          donation_date: '2026-06-20T14:30:00.000Z',
          notes: 'Doação básica'
        }
      ]
    }).as('getFinalizedPackets');

    cy.intercept('GET', '**/donation-items', {
      body: [
        {
          id: 'di-1',
          donation_packet_id: 'packet-1',
          batch_id: 'batch-1',
          quantity_removed: 10
        }
      ]
    }).as('getDonationItems');

    cy.intercept('GET', '**/items', {
      body: [
        {
          id: 'item-1',
          name: 'Arroz Agulhinha',
          category: 'cereal',
          min_stock_level: 50,
          unit_of_measure: 'kg'
        }
      ]
    }).as('getItems');

    // Intercept login
    cy.intercept('POST', '**/auth/login', { statusCode: 200 }).as('login');

    // Go to history page
    cy.visit('/');
    cy.get('input#login-email').type('admin@ong.com');
    cy.get('input#login-password').type('admin123');
    cy.get('button#btn-login-submit').click();
    cy.wait('@login');
    cy.wait(['@getBatches', '@getItems']);
    
    // Navigate to History page
    cy.get('.so-header__nav-btn').contains('Histórico').click();
    cy.wait(['@getFinalizedPackets', '@getDonationItems']);
  });

  it('lists unifications of entries and exits in chronological order', () => {
    cy.get('.history-page-header__title').should('contain', 'Histórico de Movimentações');
    cy.get('.history-table tbody tr').should('have.length', 2);

    // Assert first row is output (saida) because it occurred at 14:30:00 (after 12:00:00)
    cy.get('.history-table tbody tr').eq(0).within(() => {
      cy.get('.col-type').should('contain', 'Saída');
      cy.get('.col-item').should('contain', 'Arroz Agulhinha');
      cy.get('.qty-val').should('contain', '-10.0');
      cy.get('.col-partner').should('contain', 'Creche Feliz');
    });

    // Assert second row is input (entrada)
    cy.get('.history-table tbody tr').eq(1).within(() => {
      cy.get('.col-type').should('contain', 'Entrada');
      cy.get('.col-item').should('contain', 'Arroz Agulhinha');
      cy.get('.qty-val').should('contain', '+50.0');
      cy.get('.col-partner').should('contain', 'Doador/Fornecedor');
    });
  });

  it('filters history by search query', () => {
    cy.get('.history-filter-input').type('Feijão');
    cy.get('.history-table tbody tr').should('not.exist');
  });

  it('filters history by transaction type', () => {
    cy.get('select.history-filter-select').select('entrada');
    cy.get('.history-table tbody tr').should('have.length', 1);
    cy.get('.history-table tbody tr').should('contain', 'Entrada');
    cy.get('.history-table tbody tr').should('not.contain', 'Saída');
  });
});
