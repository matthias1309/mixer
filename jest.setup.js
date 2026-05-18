// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for Node.js test environment
// Some libraries (like JWT) need TextEncoder which isn't available in test environment
import { TextEncoder, TextDecoder } from 'util'

Object.assign(global, {
  TextEncoder,
  TextDecoder,
})
