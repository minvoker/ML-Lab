// empty string in production (same origin), localhost in dev — set via .env.production
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const data = await res.json()
      message = data.detail || data.message || JSON.stringify(data)
    } catch {
      const text = await res.text().catch(() => '')
      if (text) message = text
    }
    throw new Error(message)
  }
  return res.json()
}

export const listExampleDatasets = () => request('/datasets')

export const loadExampleDataset = name =>
  request('/datasets/load-example', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

export const loadDatasetUrl = url =>
  request('/datasets/load-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

export const uploadDataset = file => {
  const form = new FormData()
  form.append('file', file)
  return request('/datasets/upload', { method: 'POST', body: form })
}


export const loadKaggleDataset = slug =>
  request('/datasets/load-kaggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  })

export const getMissingSummary = sid => request(`/datasets/${sid}/missing-summary`)
export const getCorrelation = sid => request(`/datasets/${sid}/correlation`)
export const getColumnStats = sid => request(`/datasets/${sid}/column-stats`)

export const trainModel = payload =>
  request('/train', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
