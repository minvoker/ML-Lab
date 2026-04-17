import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress,
  FormControl, InputLabel, MenuItem, Select, TextField, Typography,
} from '@mui/material'
import { Database, Link, Package, Upload } from 'lucide-react'
import * as api from '../api'

export default function DataLoader({ onLoad }) {
  const [method, setMethod] = useState('example')
  const [exampleName, setExampleName] = useState('medical_insurance')
  const [examples, setExamples] = useState([])
  const [url, setUrl] = useState('')
  const [kaggleSlug, setKaggleSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.listExampleDatasets().then(setExamples).catch(() => {})
  }, [])

  async function handleLoad() {
    setLoading(true)
    setError(null)
    try {
      const data = method === 'example'
        ? await api.loadExampleDataset(exampleName)
        : method === 'kaggle'
        ? await api.loadKaggleDataset(kaggleSlug)
        : await api.loadDatasetUrl(url)
      onLoad(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      onLoad(await api.uploadDataset(file))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card sx={{ width: 460 }} data-testid="data-loader">
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Load Dataset
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Method</InputLabel>
          <Select value={method} onChange={e => setMethod(e.target.value)} label="Method">
            <MenuItem value="example">
              <Box display="flex" alignItems="center" gap={1}><Database size={15} /> Example dataset</Box>
            </MenuItem>
            <MenuItem value="url">
              <Box display="flex" alignItems="center" gap={1}><Link size={15} /> URL</Box>
            </MenuItem>
            <MenuItem value="kaggle">
              <Box display="flex" alignItems="center" gap={1}><Package size={15} /> Kaggle</Box>
            </MenuItem>
            <MenuItem value="upload">
              <Box display="flex" alignItems="center" gap={1}><Upload size={15} /> Upload CSV</Box>
            </MenuItem>
          </Select>
        </FormControl>

        {method === 'example' && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Dataset</InputLabel>
            <Select value={exampleName} onChange={e => setExampleName(e.target.value)} label="Dataset">
              {examples.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        {method === 'url' && (
          <TextField
            fullWidth
            label="CSV URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/data.csv"
            sx={{ mb: 2 }}
            size="small"
          />
        )}

        {method === 'kaggle' && (
          <TextField
            fullWidth
            label="Kaggle dataset slug"
            value={kaggleSlug}
            onChange={e => setKaggleSlug(e.target.value)}
            placeholder="owner/dataset-name"
            helperText="e.g. harishkumardatalab/medical-insurance-price-prediction"
            sx={{ mb: 2 }}
            size="small"
          />
        )}


        {method === 'upload' ? (
          <Button variant="outlined" component="label" fullWidth startIcon={<Upload size={15} />} disabled={loading}>
            Choose CSV File
            <input type="file" accept=".csv" hidden onChange={handleFile} />
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            onClick={handleLoad}
            disabled={loading || (method === 'url' && !url.trim()) || (method === 'kaggle' && !kaggleSlug.trim())}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Load Dataset'}
          </Button>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </CardContent>
    </Card>
  )
}
