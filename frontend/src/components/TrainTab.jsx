import { useEffect } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl,
  InputLabel, MenuItem, Paper, Select, Slider, TextField, Typography,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import {
  AlertTriangle, BarChart2, Play, Wrench,
} from 'lucide-react'
import { HYPERPARAM_DEFAULTS, MODEL_CONFIGS } from '../constants'
import { parseTrainError } from '../errorHelper'
import ScatterPlot from './charts/ScatterPlot'
import LinePlot from './charts/LinePlot'
import PCAPlot from './charts/PCAPlot'
import ErrorBoundary from './ErrorBoundary'

export default function TrainTab({ dataset, columnStats, config, onChange, onTrain, training, error, results }) {
  const { columns, dtypes } = dataset
  const numericCols = columns.filter(c => columnStats[c]?.type === 'numeric')
  const taskModels = MODEL_CONFIGS[config.task_type]
  const availableModels = Object.keys(taskModels)
  const requiredParams = taskModels[config.model_type]?.params ?? []

  useEffect(() => {
    const firstModel = Object.keys(MODEL_CONFIGS[config.task_type])[0]
    onChange({ ...config, model_type: firstModel, features: [], target: null, hyperparams: {} })
  }, [config.task_type]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const defaults = {}
    requiredParams.forEach(p => { defaults[p] = HYPERPARAM_DEFAULTS[p] })
    onChange({ ...config, hyperparams: defaults })
  }, [config.model_type]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(key, val) { onChange({ ...config, [key]: val }) }
  function setHp(key, val) { onChange({ ...config, hyperparams: { ...config.hyperparams, [key]: val } }) }

  const featureOptions = columns.filter(c => c !== config.target)
  const canTrain = config.features.length > 0 && (config.task_type !== 'Regression' || config.target)
  const parsedError = error ? parseTrainError(error) : null

  return (
    <Box display="flex" gap={2} p={3} height="100%" overflow="auto" alignItems="flex-start">
      {/* Left: config */}
      <Box width={340} flexShrink={0} display="flex" flexDirection="column" gap={2}>
        {/* Task + Model */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.5} mb={1.5} color="text.secondary">
            TASK & MODEL
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Task</InputLabel>
              <Select value={config.task_type} onChange={e => set('task_type', e.target.value)} label="Task">
                {Object.keys(MODEL_CONFIGS).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Model</InputLabel>
              <Select value={config.model_type} onChange={e => set('model_type', e.target.value)} label="Model">
                {availableModels.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Features + Target */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.5} mb={1.5} color="text.secondary">
            FEATURES
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {config.task_type === 'Regression' && (
              <FormControl fullWidth size="small">
                <InputLabel>Target column</InputLabel>
                <Select
                  value={config.target || ''}
                  onChange={e => set('target', e.target.value)}
                  label="Target column"
                >
                  {numericCols.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <Autocomplete
              multiple
              size="small"
              options={featureOptions}
              value={config.features}
              onChange={(_, val) => set('features', val)}
              renderInput={params => <TextField {...params} label="Feature columns" />}
            />
          </Box>
        </Paper>

        {/* Hyperparams */}
        {requiredParams.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} letterSpacing={0.5} mb={1.5} color="text.secondary">
              HYPERPARAMETERS
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {requiredParams.map(param => (
                <HyperparamInput key={param} param={param} config={config} onChange={setHp} />
              ))}
            </Box>
          </Paper>
        )}

        {/* Train button */}
        <Box display="flex" gap={1.5} alignItems="center">
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={training ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
            onClick={onTrain}
            disabled={training || !canTrain}
            sx={{ py: 1.2 }}
          >
            {training ? 'Training…' : 'Train Model'}
          </Button>
          <TextField
            size="small"
            type="number"
            label="Sample"
            title="Plot sample (0 = all)"
            value={config.sample}
            onChange={e => set('sample', parseInt(e.target.value) || 0)}
            sx={{ width: 90 }}
            inputProps={{ min: 0 }}
          />
        </Box>

        {/* Error card */}
        {parsedError && (
          <Box
            sx={{
              p: 2, borderRadius: 2,
              border: '1px solid rgba(239,68,68,0.3)',
              bgcolor: 'rgba(239,68,68,0.06)',
            }}
          >
            <Box display="flex" gap={1} alignItems="center" mb={0.5}>
              <AlertTriangle size={14} color="#EF4444" />
              <Typography variant="body2" fontWeight={700} color="error.main">{parsedError.title}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={parsedError.fix ? 0.75 : 0}>
              {parsedError.detail}
            </Typography>
            {parsedError.fix && (
              <Box display="flex" gap={0.75} alignItems="flex-start">
                <Wrench size={12} style={{ marginTop: 2, flexShrink: 0, color: '#F59E0B' }} />
                <Typography variant="caption" color="warning.main">{parsedError.fix}</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Right: results */}
      <Box flex={1} minWidth={0}>
        {results ? (
          <ResultsContent results={results} />
        ) : (
          <Box
            display="flex" flexDirection="column" alignItems="center" justifyContent="center"
            height={400} gap={2}
            sx={{ border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 2, color: 'text.secondary' }}
          >
            <BarChart2 size={40} strokeWidth={1} />
            <Typography variant="body2">Train a model to see results here</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

function ResultsContent({ results }) {
  if (results.task_type === 'Regression') return <RegressionResults results={results} />
  if (results.task_type === 'Clustering') return <ClusterResults results={results} />
  if (results.task_type === 'Anomaly Detection') return <AnomalyResults results={results} />
  return null
}

// fixed decimal places look bad when RMSE is 4000+ (same units as target) — scale instead
function fmtMetric(v) {
  if (typeof v !== 'number') return v
  const abs = Math.abs(v)
  if (abs === 0) return '0'
  if (abs >= 10000) return v.toFixed(0)
  if (abs >= 1000) return v.toFixed(1)
  if (abs >= 10) return v.toFixed(2)
  if (abs >= 1) return v.toFixed(3)
  return v.toFixed(4)
}

function MetricCard({ label, value, highlight }) {
  return (
    <Box
      sx={{
        p: 1.5, borderRadius: 1.5, textAlign: 'center',
        border: '1px solid',
        borderColor: highlight ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
        bgcolor: highlight ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.02)',
        minWidth: 90,
      }}
    >
      <Typography variant="h6" fontWeight={700} color={highlight ? 'primary.main' : 'text.primary'} sx={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {fmtMetric(value)}
      </Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  )
}

function RegressionResults({ results }) {
  const { metrics, scatter_data, line_data } = results
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" gap={1.5} flexWrap="wrap">
        {[['R²', metrics.R2, true], ['RMSE', metrics.RMSE], ['MAE', metrics.MAE], ['MSE', metrics.MSE],
          ['Train Score', metrics.train_score], ['Test Score', metrics.test_score]].map(([label, value, hi]) => (
          <MetricCard key={label} label={label} value={value} highlight={!!hi} />
        ))}
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Predicted vs Actual</Typography>
        <ErrorBoundary label="Scatter plot crashed">
          <ScatterPlot data={scatter_data} />
        </ErrorBoundary>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Truth vs Predictions Over Samples</Typography>
        <ErrorBoundary label="Line plot crashed">
          <LinePlot data={line_data} />
        </ErrorBoundary>
      </Paper>
    </Box>
  )
}

function ClusterResults({ results }) {
  const { num_clusters, num_noise, cluster_counts, pca_data } = results
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" gap={1.5} flexWrap="wrap">
        <MetricCard label="Clusters" value={num_clusters} highlight />
        <MetricCard label="Noise Points" value={num_noise} />
        {Object.entries(cluster_counts).map(([k, v]) => (
          <MetricCard key={k} label={`Cluster ${k}`} value={v} />
        ))}
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Cluster Plot (PCA 2D)</Typography>
        <ErrorBoundary label="Cluster plot crashed">
          <PCAPlot data={pca_data} colorKey="cluster" />
        </ErrorBoundary>
      </Paper>
    </Box>
  )
}

function AnomalyResults({ results }) {
  const { anomaly_count, normal_count, pca_data } = results
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" gap={1.5}>
        <MetricCard label="Anomalies" value={anomaly_count} highlight />
        <MetricCard label="Normal" value={normal_count} />
      </Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>Anomaly Detection Plot (PCA 2D)</Typography>
        <ErrorBoundary label="Anomaly plot crashed">
          <PCAPlot data={pca_data} colorKey="anomaly" colorMap={{ Anomaly: '#EF4444', Normal: '#34D399' }} />
        </ErrorBoundary>
      </Paper>
    </Box>
  )
}

function HyperparamInput({ param, config, onChange }) {
  const val = config.hyperparams[param] ?? HYPERPARAM_DEFAULTS[param]

  if (param === 'max_depth') {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">Tree depth: {val}</Typography>
        <Slider size="small" min={1} max={20} value={val} onChange={(_, v) => onChange(param, v)} />
      </Box>
    )
  }
  if (param === 'n_estimators') {
    const max = config.model_type === 'Isolation Forest' ? 500 : 300
    const step = config.model_type === 'Isolation Forest' ? 50 : 10
    const min = config.model_type === 'Isolation Forest' ? 50 : 10
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">Number of trees: {val}</Typography>
        <Slider size="small" min={min} max={max} step={step} value={val} onChange={(_, v) => onChange(param, v)} />
      </Box>
    )
  }
  if (param === 'contamination') {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary">Contamination (anomaly %): {val}</Typography>
        <Slider size="small" min={0.01} max={0.5} step={0.01} value={val} onChange={(_, v) => onChange(param, v)} />
      </Box>
    )
  }
  return (
    <TextField
      size="small"
      type="number"
      label={param === 'eps' ? 'Epsilon (neighborhood distance)' : 'Min samples per cluster'}
      value={val}
      onChange={e => onChange(param, parseFloat(e.target.value))}
      inputProps={{ min: param === 'eps' ? 0.01 : 1, step: param === 'eps' ? 0.1 : 1 }}
    />
  )
}
