import { loadExampleDataset, loadDatasetUrl, trainModel } from '../api'

global.fetch = jest.fn()

function mockFetch(data, ok = true) {
  fetch.mockResolvedValueOnce({
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
  })
}

describe('api', () => {
  afterEach(() => fetch.mockClear())

  it('loadExampleDataset sends correct body', async () => {
    mockFetch({ id: '123', columns: [], rows: [], shape: [0, 0], dtypes: {} })
    await loadExampleDataset('medical_insurance')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/datasets/load-example',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'medical_insurance' }),
      })
    )
  })

  it('loadDatasetUrl sends correct body', async () => {
    mockFetch({ id: '456', columns: [], rows: [], shape: [0, 0], dtypes: {} })
    await loadDatasetUrl('https://example.com/data.csv')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/datasets/load-url',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/data.csv' }),
      })
    )
  })

  it('trainModel sends correct payload', async () => {
    mockFetch({ task_type: 'Regression', metrics: {}, scatter_data: [], line_data: [] })
    const payload = { session_id: 'abc', task_type: 'Regression', model_type: 'Linear Regression', features: ['age'], target: 'charges', hyperparams: {}, sample: 0 }
    await trainModel(payload)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/train',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
  })

  it('throws on non-ok response', async () => {
    mockFetch('Bad request', false)
    await expect(loadExampleDataset('bad')).rejects.toThrow()
  })
})
