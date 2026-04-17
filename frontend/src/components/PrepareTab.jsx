import { useState } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip,
  FormControl, InputLabel, MenuItem, OutlinedInput, Select, Slider,
  Switch, Typography,
} from '@mui/material'
import {
  AlertTriangle, CheckCircle, ChevronDown, Hash, Layers, Minus, Tag,
} from 'lucide-react'

function SectionHeader({ icon: Icon, title, badge, badgeColor = 'primary' }) {
  return (
    <Box display="flex" alignItems="center" gap={1} flex={1}>
      <Icon size={15} />
      <Typography variant="body2" fontWeight={600}>{title}</Typography>
      {badge != null && (
        <Chip label={badge} size="small" color={badgeColor} sx={{ height: 18, fontSize: 10, ml: 'auto', mr: 1 }} />
      )}
    </Box>
  )
}

function ColMultiSelect({ label, columns, value, onChange }) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={e => onChange(e.target.value)}
        input={<OutlinedInput label={label} />}
        renderValue={sel => (
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {sel.map(v => <Chip key={v} label={v} size="small" sx={{ height: 18, fontSize: 10 }} />)}
          </Box>
        )}
      >
        {columns.map(c => (
          <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default function PrepareTab({ dataset, columnStats, value, onChange }) {
  const { columns, dtypes } = dataset
  const [expanded, setExpanded] = useState('missing')

  const numericCols = columns.filter(c => columnStats[c]?.type === 'numeric')
  const categoricalCols = columns.filter(c => columnStats[c]?.type === 'categorical')
  const colsWithNulls = columns.filter(c => (columnStats[c]?.null_count ?? 0) > 0)

  const mv = value.missing_values ?? {}
  const ov = value.outliers ?? {}
  const ohe = value.one_hot_cols ?? []
  const scale = value.scale ?? { columns: [], factor: 1 }

  function patch(key, subPatch) {
    onChange({ ...value, [key]: { ...(value[key] ?? {}), ...subPatch } })
  }

  function toggle(panel) {
    setExpanded(expanded === panel ? false : panel)
  }

  const issues = []
  if (colsWithNulls.length > 0 && !mv.action && !mv.strategy)
    issues.push(`${colsWithNulls.length} column(s) have missing values`)
  if (categoricalCols.length > 0 && ohe.length === 0)
    issues.push(`${categoricalCols.length} categorical column(s) not encoded`)

  const accordionSx = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    '&:before': { display: 'none' },
    borderRadius: '8px !important',
    mb: 1,
  }

  return (
    <Box display="flex" flexDirection="column" gap={2} p={3} height="100%" overflow="auto" alignItems="center">
    <Box width="100%" maxWidth={720} display="flex" flexDirection="column" gap={2}>
      {/* Issue / status strip */}
      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
        {issues.length > 0 ? (
          issues.map((iss, i) => (
            <Chip
              key={i}
              icon={<AlertTriangle size={12} />}
              label={iss}
              size="small"
              color="warning"
              variant="outlined"
            />
          ))
        ) : (
          <Chip
            icon={<CheckCircle size={12} />}
            label="No issues detected"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
      </Box>

      {/* Missing Values */}
      <Accordion expanded={expanded === 'missing'} onChange={() => toggle('missing')} sx={accordionSx} disableGutters>
        <AccordionSummary expandIcon={<ChevronDown size={16} />}>
          <SectionHeader
            icon={Minus}
            title="Missing Values"
            badge={colsWithNulls.length > 0 ? colsWithNulls.length : undefined}
            badgeColor="warning"
          />
        </AccordionSummary>
        <AccordionDetails>
          {colsWithNulls.length === 0 ? (
            <Typography variant="caption" color="text.secondary">No missing values found.</Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {colsWithNulls.map(c => (
                  <Chip
                    key={c}
                    label={`${c} (${columnStats[c].null_count})`}
                    size="small"
                    icon={<AlertTriangle size={10} />}
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: 11 }}
                  />
                ))}
              </Box>

              <FormControl size="small" fullWidth>
                <InputLabel>Strategy</InputLabel>
                <Select
                  value={mv.action === 'drop' ? 'drop' : (mv.strategy || '')}
                  onChange={e => {
                    const v = e.target.value
                    if (v === 'drop') patch('missing_values', { action: 'drop', strategy: undefined })
                    else patch('missing_values', { action: undefined, strategy: v || undefined })
                  }}
                  label="Strategy"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  <MenuItem value="drop">Drop rows with nulls</MenuItem>
                  <MenuItem value="mean">Impute — mean</MenuItem>
                  <MenuItem value="median">Impute — median</MenuItem>
                  <MenuItem value="mode">Impute — mode</MenuItem>
                  <MenuItem value="ffill">Forward fill</MenuItem>
                </Select>
              </FormControl>

              {(mv.action === 'drop' || mv.strategy) && (
                <ColMultiSelect
                  label="Apply to columns (blank = all)"
                  columns={colsWithNulls}
                  value={mv.columns ?? []}
                  onChange={cols => patch('missing_values', { columns: cols })}
                />
              )}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Categorical Encoding */}
      <Accordion expanded={expanded === 'ohe'} onChange={() => toggle('ohe')} sx={accordionSx} disableGutters>
        <AccordionSummary expandIcon={<ChevronDown size={16} />}>
          <SectionHeader
            icon={Tag}
            title="Categorical Encoding"
            badge={ohe.length > 0 ? `${ohe.length} encoded` : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          {categoricalCols.length === 0 ? (
            <Typography variant="caption" color="text.secondary">No categorical columns detected.</Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Typography variant="caption" color="text.secondary">
                Select columns to one-hot encode. Encoded columns will be expanded into binary features during training.
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {categoricalCols.map(c => {
                  const active = ohe.includes(c)
                  return (
                    <Chip
                      key={c}
                      label={c}
                      size="small"
                      icon={<Tag size={10} />}
                      onClick={() => onChange({
                        ...value,
                        one_hot_cols: active ? ohe.filter(x => x !== c) : [...ohe, c],
                      })}
                      sx={{
                        fontSize: 11, cursor: 'pointer',
                        bgcolor: active ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                        borderColor: active ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)',
                        border: '1px solid',
                        color: active ? '#EF4444' : 'text.secondary',
                      }}
                    />
                  )
                })}
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Feature Scaling */}
      <Accordion expanded={expanded === 'scale'} onChange={() => toggle('scale')} sx={accordionSx} disableGutters>
        <AccordionSummary expandIcon={<ChevronDown size={16} />}>
          <SectionHeader
            icon={Hash}
            title="Feature Scaling"
            badge={scale.columns?.length > 0 && scale.factor !== 1 ? `×${scale.factor}` : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Typography variant="caption" color="text.secondary">
              Multiply selected numeric columns by a constant factor.
            </Typography>
            <ColMultiSelect
              label="Columns to scale"
              columns={numericCols}
              value={scale.columns ?? []}
              onChange={cols => patch('scale', { columns: cols })}
            />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Factor: {scale.factor ?? 1}
              </Typography>
              <Slider
                size="small"
                min={0.1} max={10} step={0.1}
                value={scale.factor ?? 1}
                onChange={(_, v) => patch('scale', { factor: v })}
                marks={[{ value: 1, label: '1' }]}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Outlier Removal */}
      <Accordion expanded={expanded === 'outliers'} onChange={() => toggle('outliers')} sx={accordionSx} disableGutters>
        <AccordionSummary expandIcon={<ChevronDown size={16} />}>
          <SectionHeader
            icon={Layers}
            title="Outlier Removal (IQR)"
            badge={ov.enabled ? `×${ov.factor ?? 1.5}` : undefined}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">Enable IQR outlier removal</Typography>
              <Switch
                size="small"
                checked={!!ov.enabled}
                onChange={e => patch('outliers', { enabled: e.target.checked })}
              />
            </Box>
            {ov.enabled && (
              <>
                <ColMultiSelect
                  label="Columns (blank = all numeric)"
                  columns={numericCols}
                  value={ov.columns ?? []}
                  onChange={cols => patch('outliers', { columns: cols })}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    IQR Factor: {ov.factor ?? 1.5} (lower = stricter)
                  </Typography>
                  <Slider
                    size="small"
                    min={0.5} max={4} step={0.1}
                    value={ov.factor ?? 1.5}
                    onChange={(_, v) => patch('outliers', { factor: v })}
                    marks={[{ value: 1.5, label: '1.5' }]}
                  />
                </Box>
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Reset */}
      <Box>
        <Button
          size="small"
          color="inherit"
          sx={{ opacity: 0.4 }}
          onClick={() => onChange({
            missing_values: {},
            outliers: { enabled: false, factor: 1.5, columns: [] },
            one_hot_cols: [],
            scale: { columns: [], factor: 1 },
          })}
        >
          Reset all preprocessing
        </Button>
      </Box>
    </Box>
    </Box>
  )
}
