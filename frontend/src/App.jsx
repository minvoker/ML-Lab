import { useState } from 'react'
import {
  AppBar, Box, CssBaseline, Tab, Tabs, ThemeProvider, Toolbar, Typography,
  createTheme,
} from '@mui/material'
import { BarChart2, Database, FlaskConical, Settings } from 'lucide-react'
import DataLoader from './components/DataLoader'
import DataTab from './components/DataTab'
import PrepareTab from './components/PrepareTab'
import TrainTab from './components/TrainTab'
import { useDataset } from './hooks/useDataset'
import { useTrain } from './hooks/useTrain'

const RED = '#EF4444'
const RED_DIM = 'rgba(239,68,68,0.12)'
const GLASS_BG = 'rgba(15,15,20,0.75)'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: RED, dark: '#DC2626', contrastText: '#fff' },
    secondary: { main: '#F97316' },
    background: { default: '#080A0F', paper: '#0F1018' },
    divider: 'rgba(255,255,255,0.07)',
    text: { primary: '#F0F0F5', secondary: '#7A7A90' },
  },
  typography: {
    fontFamily: "'Lato', system-ui, sans-serif",
    h1: { fontFamily: "'Space Grotesk', sans-serif" },
    h2: { fontFamily: "'Space Grotesk', sans-serif" },
    h3: { fontFamily: "'Space Grotesk', sans-serif" },
    h4: { fontFamily: "'Space Grotesk', sans-serif" },
    h5: { fontFamily: "'Space Grotesk', sans-serif" },
    h6: { fontFamily: "'Space Grotesk', sans-serif" },
    subtitle1: { fontFamily: "'Space Grotesk', sans-serif" },
    subtitle2: { fontFamily: "'Space Grotesk', sans-serif" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: GLASS_BG,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: GLASS_BG,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          boxShadow: '0 0 20px rgba(239,68,68,0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
            boxShadow: '0 0 28px rgba(239,68,68,0.4)',
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(239,68,68,0.4)',
          '&:hover': { borderColor: RED, background: RED_DIM },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backdropFilter: 'none' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#111318',
            borderBottom: '1px solid rgba(239,68,68,0.15)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontFamily: "'Space Grotesk', sans-serif" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { backdropFilter: 'blur(8px)' },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '0 0 10px 10px',
          borderTop: 'none',
          marginTop: '1px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(239,68,68,0.5)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: RED },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: RED },
        thumb: { boxShadow: '0 0 8px rgba(239,68,68,0.5)' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
          '& .MuiTabs-indicator': {
            backgroundColor: RED,
            height: 2,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          textTransform: 'none',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          color: 'rgba(240,240,245,0.45)',
          '&.Mui-selected': { color: '#F0F0F5' },
        },
      },
    },
  },
})

const DEFAULT_PREPROCESSING = {
  missing_values: {},
  outliers: { enabled: false, factor: 1.5, columns: [] },
  one_hot_cols: [],
  scale: { columns: [], factor: 1 },
}

const DEFAULT_MODEL = {
  task_type: 'Regression',
  model_type: 'Linear Regression',
  features: [],
  target: null,
  hyperparams: {},
  sample: 0,
}

export default function App() {
  const { dataset, columnStats, loadDataset, resetDataset } = useDataset()
  const { results, training, error: trainError, train, reset: resetTrain } = useTrain()
  const [preprocessing, setPreprocessing] = useState(DEFAULT_PREPROCESSING)
  const [modelConfig, setModelConfig] = useState(DEFAULT_MODEL)
  const [tab, setTab] = useState(0)

  function handleDatasetLoaded(data) {
    loadDataset(data)
    setPreprocessing(DEFAULT_PREPROCESSING)
    setModelConfig(DEFAULT_MODEL)
    resetTrain()
    setTab(0)
  }

  function handleTrain() {
    train(dataset.id, modelConfig, preprocessing)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Ambient background blobs */}
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden',
        background: '#080A0F',
      }}>
        <Box sx={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: '#080A0F',
            borderBottom: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <Toolbar variant="dense" sx={{ gap: 3 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <FlaskConical size={18} style={{ color: RED }} />
              <Typography
                variant="h6"
                fontWeight={700}
                letterSpacing={2}
                sx={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F0F0F5' }}
              >
                ML LAB
              </Typography>
            </Box>

            {dataset && columnStats && (
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flex: 1 }}>
                <Tab icon={<Database size={14} />} iconPosition="start" label="Data" />
                <Tab icon={<Settings size={14} />} iconPosition="start" label="Prepare" />
                <Tab icon={<BarChart2 size={14} />} iconPosition="start" label="Train" />
              </Tabs>
            )}
          </Toolbar>
        </AppBar>

        {!dataset || !columnStats ? (
          <Box display="flex" justifyContent="center" alignItems="center" flex={1} p={3}>
            <DataLoader onLoad={handleDatasetLoaded} />
          </Box>
        ) : (
          <Box flex={1} overflow="hidden" display="flex" flexDirection="column">
            {tab === 0 && (
              <DataTab
                dataset={dataset}
                columnStats={columnStats}
                onReset={resetDataset}
              />
            )}
            {tab === 1 && (
              <PrepareTab
                dataset={dataset}
                columnStats={columnStats}
                value={preprocessing}
                onChange={setPreprocessing}
              />
            )}
            {tab === 2 && (
              <TrainTab
                dataset={dataset}
                columnStats={columnStats}
                config={modelConfig}
                onChange={setModelConfig}
                onTrain={handleTrain}
                training={training}
                error={trainError}
                results={results}
              />
            )}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  )
}
