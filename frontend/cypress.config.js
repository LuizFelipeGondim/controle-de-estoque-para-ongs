import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    // Aumenta o timeout padrão para acomodar operações de banco em teste
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    setupNodeEvents(on, config) {
      // Nenhum plugin necessário por enquanto
    },
  },
  env: {
    apiUrl: 'http://localhost:3333',
  },
})
