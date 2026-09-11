import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library leaves the rendered tree in the document otherwise, so the
// next test would query a DOM containing the previous test's components. Same class
// of leak as the API's module-level store; same fix.
afterEach(cleanup)
