describe('Stock Overview Page', () => {
  beforeEach(() => {
    // Intercept API calls for the overview
    cy.intercept('GET', '**/batch', {
      body: [
        {
          id: 'batch-1',
          item_type_id: 'item-1',
          item_name: 'Arroz',
          item_category: 'cereal',
          item_unit_of_measure: 'kg',
          item_conversion_factor: 1,
          current_quantity: 40,
          initial_quantity: 50,
          expiration_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
          status: 'ativo',
          created_at: new Date().toISOString()
        },
        {
          id: 'batch-2',
          item_type_id: 'item-2',
          item_name: 'Feijão',
          item_category: 'grão',
          item_unit_of_measure: 'kg',
          item_conversion_factor: 1,
          current_quantity: 35,
          initial_quantity: 35,
          expiration_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days from now
          status: 'ativo',
          created_at: new Date().toISOString()
        }
      ]
    }).as('getBatches');

    cy.intercept('GET', '**/items', {
      body: [
        {
          id: 'item-1',
          name: 'Arroz',
          category: 'cereal',
          min_stock_level: 50,
          unit_of_measure: 'kg'
        },
        {
          id: 'item-2',
          name: 'Feijão',
          category: 'grão',
          min_stock_level: 30,
          unit_of_measure: 'kg'
        }
      ]
    }).as('getItems');

    cy.intercept('GET', '**/donation-packets?status=finalizado', {
      body: [
        {
          id: 'packet-1',
          status: 'finalizado',
          destination: 'Comunidade Sol',
          donation_date: new Date().toISOString().split('T')[0]
        }
      ]
    }).as('getPackets');

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

    // Intercept login
    cy.intercept('POST', '**/auth/login', { statusCode: 200 }).as('login');

    // Perform login to access dashboard
    cy.visit('/');
    cy.get('input#login-email').type('admin@ong.com');
    cy.get('input#login-password').type('admin123');
    cy.get('button#btn-login-submit').click();
    cy.wait('@login');
    cy.wait(['@getBatches', '@getItems', '@getPackets', '@getDonationItems']);
  });

  it('renders the Stock Overview layout correctly', () => {
    cy.get('.so-page-header__title').should('contain', 'Visão Geral dos Estoques');
    cy.get('.so-header__nav').should('be.visible');
  });

  it('displays active alerts for low stock and near expiry', () => {
    // Validity warning for Arroz (batch-1) which expires in 5 days
    cy.get('.so-alert-panel--expiry').within(() => {
      cy.get('.so-alert-panel__count').should('contain', '1');
      cy.get('.so-alert-item').should('contain', 'Arroz');
    });

    // Critical stock warning for Arroz (totalQty 40 < min_stock_level 50)
    cy.get('.so-alert-panel--critical').within(() => {
      cy.get('.so-alert-panel__count').should('contain', '1');
      cy.get('.so-alert-item').should('contain', 'Arroz');
    });
  });

  it('displays the categories and their stock quantities correctly', () => {
    cy.get('.so-categories-grid').within(() => {
      // Arroz under cereal (40.0 kg)
      cy.get('.so-cat-card').eq(0).within(() => {
        cy.get('.so-cat-card__name').should('contain', 'cereal');
        cy.get('.so-cat-card__kg').should('contain', '40.0');
      });

      // Feijão under grão (35.0 kg)
      cy.get('.so-cat-card').eq(1).within(() => {
        cy.get('.so-cat-card__name').should('contain', 'grão');
        cy.get('.so-cat-card__kg').should('contain', '35.0');
      });
    });
  });

  it('displays the monthly donation and received impact charts correctly', () => {
    cy.get('.so-dash-card--donations').within(() => {
      cy.get('.so-dash-card__total').should('contain', '10.0');
    });

    cy.get('.so-dash-card--received').within(() => {
      cy.get('.so-dash-card__total').should('contain', '85.0'); // 50 (Arroz) + 35 (Feijão)
    });
  });
});
