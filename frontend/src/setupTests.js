import '@testing-library/jest-dom'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Recharts ResponsiveContainer needs a real DOM size; fake it in tests
jest.mock('recharts', () => {
  const Recharts = jest.requireActual('recharts')
  return {
    ...Recharts,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 600, height: 400 }}>{children}</div>
    ),
  }
})
