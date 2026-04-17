import {
  Box, Chip, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Typography,
} from '@mui/material'
import ScatterPlot from './charts/ScatterPlot'
import LinePlot from './charts/LinePlot'
import PCAPlot from './charts/PCAPlot'

export default function ResultsPanel({ results }) {
  return (
    <Paper sx={{ p: 3 }} data-testid="results-panel">
      <Typography variant="h6" fontWeight={600} gutterBottom>Results</Typography>
      {results.task_type === 'Regression' && <RegressionResults results={results} />}
      {results.task_type === 'Clustering' && <ClusterResults results={results} />}
      {results.task_type === 'Anomaly Detection' && <AnomalyResults results={results} />}
    </Paper>
  )
}

function RegressionResults({ results }) {
  const { metrics, scatter_data, line_data } = results
  const metricKeys = ['MAE', 'MSE', 'RMSE', 'R2', 'train_score', 'test_score']

  return (
    <>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Metrics</Typography>
      <Box overflow="auto" mb={3}>
        <Table size="small" sx={{ width: 'auto' }}>
          <TableHead>
            <TableRow>
              {metricKeys.map(k => (
                <TableCell key={k} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{k}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {metricKeys.map(k => (
                <TableCell key={k}>{metrics[k]?.toFixed(4)}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Predicted vs Actual</Typography>
      <ScatterPlot data={scatter_data} />
      <Typography variant="subtitle2" fontWeight={600} gutterBottom mt={2}>Truth vs Predictions Over Samples</Typography>
      <LinePlot data={line_data} />
    </>
  )
}

function ClusterResults({ results }) {
  const { num_clusters, num_noise, cluster_counts, pca_data } = results
  return (
    <>
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        <Chip label={`Clusters: ${num_clusters}`} color="primary" />
        <Chip label={`Noise points: ${num_noise}`} variant="outlined" />
      </Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Cluster Sizes</Typography>
      <Box overflow="auto" mb={3}>
        <Table size="small" sx={{ width: 'auto' }}>
          <TableHead>
            <TableRow>
              {Object.keys(cluster_counts).map(k => (
                <TableCell key={k} sx={{ fontWeight: 600 }}>Cluster {k}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {Object.values(cluster_counts).map((v, i) => (
                <TableCell key={i}>{v}</TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Cluster Plot (PCA 2D)</Typography>
      <PCAPlot data={pca_data} colorKey="cluster" />
    </>
  )
}

function AnomalyResults({ results }) {
  const { anomaly_count, normal_count, pca_data } = results
  return (
    <>
      <Box display="flex" gap={1} mb={2}>
        <Chip label={`Anomalies: ${anomaly_count}`} color="error" />
        <Chip label={`Normal: ${normal_count}`} color="success" />
      </Box>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Anomaly Detection Plot (PCA 2D)</Typography>
      <PCAPlot
        data={pca_data}
        colorKey="anomaly"
        colorMap={{ Anomaly: '#EF4444', Normal: '#34D399' }}
      />
    </>
  )
}
