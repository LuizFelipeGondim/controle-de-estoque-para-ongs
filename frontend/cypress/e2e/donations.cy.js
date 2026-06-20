describe('Donations Page', () => {
  beforeEach(() => {
    // Intercept initial loads
    cy.intercept('GET', '**/donation-packets', {
      body: [
        {
          id: 'packet-1',
          status: 'preparando',
          destination: 'Creche Feliz',
          destination_address: 'Rua Principal, 123',
          donation_date: '2026-06-25T00:00:00.000Z',
          notes: 'Doação de alimentos básicos'
        }
      ]
    }).as('getPackets');

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
          status: 'disponivel',
          entry_date: '2026-06-20T12:00:00Z',
          created_at: '2026-06-20T12:00:00Z'
        }
      ]
    }).as('getBatches');

    // Intercept login
    cy.intercept('POST', '**/auth/login', { statusCode: 200 }).as('login');

    // Go to donations page
    cy.visit('/');
    cy.get('input#login-email').type('admin@ong.com');
    cy.get('input#login-password').type('admin123');
    cy.get('button#btn-login-submit').click();
    cy.wait('@login');
    cy.wait(['@getBatches', '@getItems']);
    
    // Navigate to Donations page
    cy.get('.so-header__nav-btn').contains('Doações').click();
    cy.wait('@getPackets');
  });

  it('lists existing donation packets', () => {
    cy.get('.donations-page-header__title').should('contain', 'Pacotes de Doação');
    cy.get('.packet-card').should('have.length', 1);
    cy.get('.packet-destination').should('contain', 'Creche Feliz');
  });

  it('allows registering a new packet', () => {
    cy.intercept('POST', '**/donation-packets', {
      statusCode: 201,
      body: { id: 'packet-2' }
    }).as('createPacket');

    cy.intercept('GET', '**/donation-packets', {
      body: [
        {
          id: 'packet-1',
          status: 'preparando',
          destination: 'Creche Feliz',
          destination_address: 'Rua Principal, 123',
          donation_date: '2026-06-25T00:00:00.000Z',
          notes: ''
        },
        {
          id: 'packet-2',
          status: 'preparando',
          destination: 'Asilo da Paz',
          destination_address: 'Avenida das Flores, 456',
          donation_date: '2026-06-27T00:00:00.000Z',
          notes: ''
        }
      ]
    }).as('getRefreshedPackets');

    cy.get('.donations-page-header').contains('Novo Pacote').click();
    cy.get('input#destination').type('Asilo da Paz');
    cy.get('input#destination_address').type('Avenida das Flores, 456');
    cy.get('input#donation_date').type('2026-06-27');
    cy.get('button[type="submit"].donation-modal-form__submit').click();

    cy.wait('@createPacket');
    cy.wait('@getRefreshedPackets');

    cy.get('.packet-card').should('have.length', 2);
    cy.get('.packet-card').should('contain', 'Asilo da Paz');
  });

  it('allows managing items inside a packet and finalizing it', () => {
    cy.intercept('GET', '**/donation-items?donation_packet_id=packet-1', {
      body: []
    }).as('getPacketItemsEmpty');

    cy.intercept('GET', '**/batch?status=disponivel', {
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
          status: 'disponivel'
        }
      ]
    }).as('getAvailableBatches');

    // Click Gerenciar Itens
    cy.get('.packet-action-btn').click();
    cy.wait('@getPacketItemsEmpty');

    cy.get('.donations-page-header__title').should('contain', 'Creche Feliz');

    // Mock adding item
    cy.intercept('POST', '**/donation-items', {
      statusCode: 201,
      body: { id: 'di-1' }
    }).as('addDonationItem');

    cy.intercept('GET', '**/donation-packets/packet-1', {
      body: {
        id: 'packet-1',
        status: 'preparando',
        destination: 'Creche Feliz',
        destination_address: 'Rua Principal, 123',
        donation_date: '2026-06-25T00:00:00.000Z',
        notes: 'Doação de alimentos básicos'
      }
    }).as('getUpdatedPacket');

    cy.intercept('GET', '**/donation-items?donation_packet_id=packet-1', {
      body: [
        {
          id: 'di-1',
          donation_packet_id: 'packet-1',
          batch_id: 'batch-1',
          quantity_removed: 15
        }
      ]
    }).as('getPacketItemsWithItem');

    cy.intercept('GET', '**/batch/batch-1', {
      body: {
        id: 'batch-1',
        item_name: 'Arroz Agulhinha',
        item_unit_of_measure: 'kg',
        item_conversion_factor: 1,
        current_quantity: 25,
        initial_quantity: 50,
        expiration_date: '2026-12-31',
        status: 'disponivel'
      }
    }).as('getBatchDetails');

    // Click Add Alimento
    cy.get('.donations-header__new-btn').click();
    cy.wait('@getAvailableBatches');

    cy.get('select').select('batch-1');
    cy.get('input#qty').type('15');
    cy.get('button[type="submit"].donation-modal-form__submit').click();

    cy.wait('@addDonationItem');
    cy.wait('@getUpdatedPacket');
    cy.wait('@getPacketItemsWithItem');
    cy.wait('@getBatchDetails');

    // Assert item displays in table
    cy.get('.packet-items-row').should('have.length', 1);
    cy.get('.packet-items-row').should('contain', 'Arroz Agulhinha');
    cy.get('.packet-items-row').should('contain', '15 kg');

    // Mock finalization
    cy.intercept('PATCH', '**/donation-packets/packet-1/status', {
      statusCode: 200,
      body: { success: true }
    }).as('finalizePacket');

    cy.intercept('GET', '**/donation-packets', {
      body: [
        {
          id: 'packet-1',
          status: 'finalizado',
          destination: 'Creche Feliz',
          destination_address: 'Rua Principal, 123',
          donation_date: '2026-06-25T00:00:00.000Z',
          notes: 'Doação de alimentos básicos'
        }
      ]
    }).as('getFinalizedPackets');

    cy.on('window:confirm', () => true);

    // Finalize
    cy.get('.btn-finish').click();
    cy.wait('@finalizePacket');
    cy.wait('@getFinalizedPackets');

    // Assert we are back to list view and status is finalizado
    cy.get('.donations-page-header__title').should('contain', 'Pacotes de Doação');
    cy.get('.packet-status').should('contain', 'finalizado');
  });
});
