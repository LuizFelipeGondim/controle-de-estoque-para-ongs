describe('Items Page', () => {
  beforeEach(() => {
    // Intercept initial loads
    cy.intercept('GET', '**/items', {
      body: [
        {
          id: 'item-1',
          name: 'Arroz Agulhinha',
          category: 'cereal',
          min_stock_level: 50,
          unit_of_measure: 'kg',
          is_essential: true,
          nutritional_info: 'Rico em carboidratos'
        },
        {
          id: 'item-2',
          name: 'Feijão Carioca',
          category: 'grão',
          min_stock_level: 30,
          unit_of_measure: 'kg',
          is_essential: false,
          nutritional_info: ''
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
          expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'ativo',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getBatches');

    // Intercept login
    cy.intercept('POST', '**/auth/login', { statusCode: 200 }).as('login');

    // Go to items page
    cy.visit('/');
    cy.get('input#login-email').type('admin@ong.com');
    cy.get('input#login-password').type('admin123');
    cy.get('button#btn-login-submit').click();
    cy.wait('@login');
    cy.wait(['@getItems', '@getBatches']);
    
    // Navigate to Items page
    cy.get('.so-header__nav-btn').contains('Itens').click();
  });

  it('lists existing items by category', () => {
    cy.get('.items-page-header__title').should('contain', 'Todos os Itens');
    cy.get('.items-category-section').should('have.length', 2);
    
    cy.get('.item-card').eq(0).within(() => {
      cy.get('.item-card__name').should('contain', 'Arroz Agulhinha');
      cy.get('.item-card__badge').should('contain', 'Essencial');
    });
  });

  it('filters items by search', () => {
    cy.get('.items-filter-input').type('Feijão');
    cy.get('.item-card').should('have.length', 1);
    cy.get('.item-card').should('contain', 'Feijão Carioca');
  });

  it('allows adding a new item', () => {
    cy.intercept('POST', '**/items', {
      statusCode: 201,
      body: { id: 'item-3' }
    }).as('createItem');

    cy.get('.items-header__new-btn').click();
    cy.get('input#name').type('Macarrão Espaguete');
    cy.get('select#category').select('massa');
    cy.get('select#unit_of_measure').select('unidade');
    cy.get('input#min_stock_level').clear().type('20');
    cy.get('input[name="is_essential"]').check();
    cy.get('input#nutritional_info').type('Contém glúten');

    cy.get('button[type="submit"].item-modal-form__submit').click();
    cy.wait('@createItem');

    // Assert it appears in list
    cy.get('.item-card').should('contain', 'Macarrão Espaguete');
  });

  it('allows viewing and editing an item', () => {
    cy.intercept('PUT', '**/items/item-1', {
      statusCode: 200,
      body: { success: true }
    }).as('updateItem');

    // Click item card to view details
    cy.get('.item-card').contains('Arroz Agulhinha').click();
    cy.get('.item-modal-content--large').should('be.visible');

    // Click Edit button
    cy.get('.details-edit-btn').click();
    cy.get('input#name').clear().type('Arroz Integral');
    cy.get('button[type="submit"].item-modal-form__submit').click();
    cy.wait('@updateItem');

    // Assert name is updated in list
    cy.get('.item-card').should('contain', 'Arroz Integral');
  });

  it('allows removing an item', () => {
    cy.intercept('DELETE', '**/items/item-2', {
      statusCode: 204
    }).as('deleteItem');

    // Stub window:confirm dialog
    cy.on('window:confirm', () => true);

    // Click second item card to view details
    cy.get('.item-card').contains('Feijão Carioca').click();
    cy.get('.details-delete-btn').click();
    cy.wait('@deleteItem');

    // Assert item is removed from list
    cy.get('.item-card').should('have.length', 1);
    cy.get('.item-card').should('not.contain', 'Feijão Carioca');
  });
});
