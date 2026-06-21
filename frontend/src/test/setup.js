import '@testing-library/jest-dom'
import React from 'react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// Disponibiliza React globalmente para o transform JSX do Vitest
globalThis.React = React

// Inicia o servidor MSW antes de qualquer teste
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Reseta os handlers após cada teste (evita contaminação entre testes)
afterEach(() => server.resetHandlers())

// Para o servidor MSW após todos os testes
afterAll(() => server.close())
