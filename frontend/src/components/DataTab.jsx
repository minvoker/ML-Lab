import { useState } from 'react'
import {
  Box, Chip, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography, Button, CircularProgress,
} from '@mui/material'
import { Hash, Type, AlertTriangle, RefreshCw, BarChart2 } from 'lucide-react'
import * as api from '../api'
import CorrelationMatrix from './CorrelationMatrix'

export default function DataTab({ dataset, columnStats, onReset }) {
  const { columns, rows, shape, dtypes } = dataset
  const [selectedCol, setSelectedCol] = useState(null)
  const [corr, setCorr] = useState(null)
  const [corrLoading, setCorrLoading] = useState(false)

  const numericCols = columns.filter(c => columnStats[c]?.type === 'numeric')
  const categoricalCols = columns.filter(c => columnStats[c]?.type === 'categorical')
  const colsWithNulls = columns.filter(c => (columnStats[c]?.null_count ?? 0) > 0)
  const totalMissing = colsWithNulls.reduce((s, c) => s + (columnStats[c]?.null_count ?? 0), 0)

  async function loadCorr() {
    setCorrLoading(true)
    try { setCorr(await api.getCorrelation(dataset.id)) } catch { /* ignore */ }
    finally { setCorrLoading(false) }
  }

  const stats = selectedCol ? columnStats[selectedCol] : null

  return (
    <Box display="flex" flexDirection="column" gap={2} p={3} height="100%" overflow="auto">
      {/* Summary strip */}
      <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
        <Chip label={`${shape[0].toLocaleString()} rows`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }} />
        <Chip label={`${shape[1]} columns`} size="small" variant="outlined" />
        <Chip label={`${numericCols.length} numeric`} size="small" icon={<Hash size={12} />} variant="outlined" />
        <Chip label={`${categoricalCols.length} categorical`} size="small" icon={<Type size={12} />} variant="outlined" />
        {totalMissing > 0 && (
          <Chip label={`${totalMissing} missing values`} size="small" icon={<AlertTriangle size={12} />} color="warning" />
        )}
        <Box flex={1} />
        <Button size="small" startIcon={<RefreshCw size={13} />} onClick={onReset} color="inherit" sx={{ opacity: 0.6 }}>
          Change dataset
        </Button>
      </Box>

      {/* Main content */}
      <Box display="flex" gap={2} flex={1} minHeight={0}>
        {/* Column browser */}
        <Box width={200} flexShrink={0} display="flex" flexDirection="column" gap={0.5}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={1} mb={0.5} display="block">
            COLUMNS
          </Typography>
          <Box overflow="auto" flex={1}>
            {columns.map(col => {
              const s = columnStats[col]
              const isNum = s?.type === 'numeric'
              const isSelected = selectedCol === col
              return (
                <Box
                  key={col}
                  onClick={() => setSelectedCol(isSelected ? null : col)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 1.5, py: 0.75, borderRadius: 1, cursor: 'pointer', mb: 0.5,
                    bgcolor: isSelected ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid',
                    borderColor: isSelected ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    transition: 'all 0.15s',
                  }}
                >
                  <Box
                    sx={{
                      width: 18, height: 18, borderRadius: '4px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: isNum ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                      color: isNum ? '#EF4444' : '#F97316',
                      fontSize: 10, fontWeight: 700,
                    }}
                  >
                    {isNum ? '#' : 'A'}
                  </Box>
                  <Typography variant="body2" noWrap flex={1} fontSize={12}>{col}</Typography>
                  {(s?.null_count ?? 0) > 0 && (
                    <AlertTriangle size={11} color="#F59E0B" />
                  )}
                </Box>
              )
            })}
          </Box>

          {/* Selected column stats */}
          {stats && (
            <Box
              sx={{
                mt: 1, p: 1.5, borderRadius: 1,
                border: '1px solid rgba(239,68,68,0.2)',
                bgcolor: 'rgba(239,68,68,0.04)',
              }}
            >
              <Typography variant="caption" fontWeight={700} color="primary.main" display="block" mb={1}>
                {selectedCol}
              </Typography>
              {stats.type === 'numeric' ? (
                <Box display="flex" flexDirection="column" gap={0.5}>
                  {[
                    ['mean', stats.mean],
                    ['min', stats.min],
                    ['max', stats.max],
                    ['std', stats.std],
                    ['nulls', stats.null_count],
                    ['unique', stats.unique],
                  ].map(([k, v]) => (
                    <Box key={k} display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">{k}</Typography>
                      <Typography variant="caption" fontWeight={600}>{v ?? '—'}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">unique</Typography>
                    <Typography variant="caption" fontWeight={600}>{stats.unique}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">nulls</Typography>
                    <Typography variant="caption" fontWeight={600}>{stats.null_count}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" mt={0.5} display="block">Top values</Typography>
                  {Object.entries(stats.top_values ?? {}).slice(0, 4).map(([k, v]) => (
                    <Box key={k} display="flex" justifyContent="space-between">
                      <Typography variant="caption" noWrap sx={{ maxWidth: 90 }}>{k}</Typography>
                      <Typography variant="caption" color="text.secondary">{v}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Table + correlation */}
        <Box flex={1} display="flex" flexDirection="column" gap={2} minWidth={0}>
          <Paper sx={{ overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map(col => (
                      <TableCell
                        key={col}
                        sx={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => setSelectedCol(selectedCol === col ? null : col)}
                      >
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Box sx={{
                            width: 14, height: 14, borderRadius: '3px', fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            bgcolor: columnStats[col]?.type === 'numeric' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                            color: columnStats[col]?.type === 'numeric' ? '#EF4444' : '#F97316',
                          }}>
                            {columnStats[col]?.type === 'numeric' ? '#' : 'A'}
                          </Box>
                          <span>{col}</span>
                          {(columnStats[col]?.null_count ?? 0) > 0 && <AlertTriangle size={10} color="#F59E0B" />}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} hover>
                      {columns.map(col => (
                        <TableCell key={col} sx={{ whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>
                          {row[col] ?? <span style={{ color: '#F59E0B', fontSize: 10 }}>null</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={corrLoading ? <CircularProgress size={13} /> : <BarChart2 size={13} />}
              onClick={loadCorr}
              disabled={corrLoading}
            >
              {corr ? 'Refresh' : 'Show'} Correlation Matrix
            </Button>
            {corr && <CorrelationMatrix data={corr} />}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
