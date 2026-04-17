import { useState } from 'react'
import * as api from '../api'

export function useDataset() {
  const [dataset, setDataset] = useState(null)
  const [columnStats, setColumnStats] = useState(null)

  async function loadDataset(data) {
    setDataset(data)
    setColumnStats(null)
    try {
      setColumnStats(await api.getColumnStats(data.id))
    } catch {
      setColumnStats({})
    }
  }

  function resetDataset() {
    setDataset(null)
    setColumnStats(null)
  }

  return { dataset, columnStats, loadDataset, resetDataset }
}
