describe('Batches Page', () => {
  beforeEach(() => {
    // Intercept initial loads
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
          status: 'ativo',
          entry_date: '2026-06-20T12:00:00Z',
          created_at: '2026-06-20T12:00:00Z'
        }
      ]
    }).as('getBatches');

    // Intercept login
    cy.intercept('POST', '**/auth/login', { statusCode: 200 }).as('login');

    // Go to batches page
    cy.visit('/');
    cy.get('input#login-email').type('admin@ong.com');
    cy.get('input#login-password').type('admin123');
    cy.get('button#btn-login-submit').click();
    cy.wait('@login');
    cy.wait(['@getItems', '@getBatches']);
    
    // Navigate to Batches page
    cy.get('.so-header__nav-btn').contains('Lotes').click();
  });

  it('lists existing batches grouped by entry date', () => {
    cy.get('.batches-page-header__title').should('contain', 'Visão de Lotes');
    cy.get('.batch-date-group').should('have.length', 1);
    
    cy.get('.batch-row').within(() => {
      cy.get('.col-item').should('contain', 'Arroz Agulhinha');
      cy.get('.qty-val').eq(0).should('contain', '50.0'); // initial
      cy.get('.qty-val').eq(1).should('contain', '40.0'); // current
    });
  });

  it('filters batches by search text', () => {
    cy.get('.batches-filter-input').eq(0).type('Feijão');
    cy.get('.batch-row').should('not.exist');
  });

  it('allows adding a new batch', () => {
    cy.intercept('POST', '**/batch', {
      statusCode: 201,
      body: { id: 'batch-2' }
    }).as('createBatch');

    // Mock refreshing batches
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
          status: 'ativo',
          entry_date: '2026-06-20T12:00:00Z',
          created_at: '2026-06-20T12:00:00Z'
        },
        {
          id: 'batch-2',
          item_type_id: 'item-1',
          item_name: 'Arroz Agulhinha',
          item_category: 'cereal',
          item_unit_of_measure: 'kg',
          item_conversion_factor: 1,
          current_quantity: 30,
          initial_quantity: 30,
          expiration_date: '2026-11-30',
          status: 'ativo',
          entry_date: '2026-06-20T12:00:00Z',
          created_at: '2026-06-20T12:00:00Z'
        }
      ]
    }).as('getRefreshedBatches');

    cy.get('.batches-header__new-btn').click();
    cy.get('select#modal-item').select('item-1');
    cy.get('input#modal-qty').type('30');
    cy.get('input#modal-date').type('2026-11-30');

    cy.get('button[type="submit"].batch-modal-form__submit').click();
    cy.wait('@createBatch');
    cy.wait('@getRefreshedBatches');

    // Assert both batches display
    cy.get('.batch-row').should('have.length', 2);
  });

  it('allows viewing details and deleting a batch', () => {
    cy.intercept('DELETE', '**/batch/batch-1', {
      statusCode: 204
    }).as('deleteBatch');

    cy.on('window:confirm', () => true);

    // Click batch row to view modal
    cy.get('.batch-row').click();
    cy.get('.batch-modal-content--large').should('be.visible');

    // Click Delete Lote button
    cy.get('.batch-modal-form__delete-btn').click();
    cy.wait('@deleteBatch');

    // Assert batch is removed from view
    cy.get('.batch-row').should('not.exist');
  });
});
