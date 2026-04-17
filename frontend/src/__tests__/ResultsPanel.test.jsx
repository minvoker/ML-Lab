import { render, screen } from '@testing-library/react'
import ResultsPanel from '../components/ResultsPanel'

const regressionResults = {
  task_type: 'Regression',
  metrics: { MAE: 0.25, MSE: 0.1, RMSE: 0.316, R2: 0.91, train_score: 0.95, test_score: 0.88 },
  scatter_data: [{ truth: 1.0, predictions: 1.1 }, { truth: 2.0, predictions: 1.9 }],
  line_data: [{ index: 0, truth: 1.0, predictions: 1.1 }, { index: 1, truth: 2.0, predictions: 1.9 }],
}

const clusterResults = {
  task_type: 'Clustering',
  num_clusters: 3,
  num_noise: 5,
  cluster_counts: { '0': 40, '1': 30, '2': 25, '-1': 5 },
  pca_data: [{ pc1: 1.0, pc2: 0.5, cluster: '0' }],
}

const anomalyResults = {
  task_type: 'Anomaly Detection',
  anomaly_count: 12,
  normal_count: 88,
  pca_data: [{ pc1: 1.0, pc2: 0.5, anomaly: 'Normal' }],
}

describe('ResultsPanel', () => {
  it('renders regression metrics', () => {
    render(<ResultsPanel results={regressionResults} />)
    expect(screen.getByTestId('results-panel')).toBeInTheDocument()
    expect(screen.getByText('0.2500')).toBeInTheDocument() // MAE
    expect(screen.getByText('0.8800')).toBeInTheDocument() // test_score
  })

  it('renders cluster summary', () => {
    render(<ResultsPanel results={clusterResults} />)
    expect(screen.getByText('Clusters: 3')).toBeInTheDocument()
    expect(screen.getByText('Noise points: 5')).toBeInTheDocument()
  })

  it('renders anomaly summary', () => {
    render(<ResultsPanel results={anomalyResults} />)
    expect(screen.getByText('Anomalies: 12')).toBeInTheDocument()
    expect(screen.getByText('Normal: 88')).toBeInTheDocument()
  })
})
