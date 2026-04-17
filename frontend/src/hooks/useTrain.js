import { useState } from 'react'
import * as api from '../api'

export function useTrain() {
  const [results, setResults] = useState(null)
  const [training, setTraining] = useState(false)
  const [error, setError] = useState(null)

  async function train(sessionId, modelConfig, preprocessing) {
    setTraining(true)
    setError(null)
    setResults(null)
    try {
      setResults(await api.trainModel({ session_id: sessionId, ...modelConfig, preprocessing }))
    } catch (e) {
      setError(e.message)
    } finally {
      setTraining(false)
    }
  }

  function reset() {
    setResults(null)
    setError(null)
  }

  return { results, training, error, train, reset }
}
