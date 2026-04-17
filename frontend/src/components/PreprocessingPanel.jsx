import {
  Box, Checkbox, Divider, FormControl, FormControlLabel,
  InputLabel, MenuItem, Select, Slider, TextField, Typography,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'

export default function PreprocessingPanel({ columns, dtypes, value, onChange }) {
  const categoricalCols = columns.filter(c => !dtypes[c]?.includes('int') && !dtypes[c]?.includes('float'))
  const numericCols = columns.filter(c => dtypes[c]?.includes('int') || dtypes[c]?.includes('float'))

  function update(path, val) {
    const parts = path.split('.')
    if (parts.length === 1) {
      onChange({ ...value, [parts[0]]: val })
    } else {
      onChange({ ...value, [parts[0]]: { ...value[parts[0]], [parts[1]]: val } })
    }
  }

  const mv = value.missing_values
  const ov = value.outliers

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>Preprocessing</Typography>

      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
        DATA CLEANING
      </Typography>

      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
        <InputLabel>Missing values</InputLabel>
        <Select
          value={mv?.action === 'drop' ? 'drop' : mv?.strategy ? 'impute' : 'none'}
          onChange={e => {
            const v = e.target.value
            if (v === 'none') update('missing_values', {})
            else if (v === 'drop') update('missing_values', { action: 'drop', columns: [] })
            else update('missing_values', { strategy: 'mean', columns: [] })
          }}
          label="Missing values"
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="drop">Drop rows</MenuItem>
          <MenuItem value="impute">Impute values</MenuItem>
        </Select>
      </FormControl>

      {mv?.strategy && (
        <>
          <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
            <InputLabel>Strategy</InputLabel>
            <Select
              value={mv.strategy}
              onChange={e => update('missing_values', { ...mv, strategy: e.target.value })}
              label="Strategy"
            >
              <MenuItem value="mean">Mean</MenuItem>
              <MenuItem value="median">Median</MenuItem>
              <MenuItem value="most_frequent">Most frequent</MenuItem>
            </Select>
          </FormControl>
          <Autocomplete
            multiple
            size="small"
            options={numericCols}
            value={mv.columns || []}
            onChange={(_, val) => update('missing_values', { ...mv, columns: val })}
            renderInput={params => <TextField {...params} label="Columns (empty = all numeric)" />}
            sx={{ mb: 1.5 }}
          />
        </>
      )}

      {mv?.action === 'drop' && (
        <Autocomplete
          multiple
          size="small"
          options={columns}
          value={mv.columns || []}
          onChange={(_, val) => update('missing_values', { ...mv, columns: val })}
          renderInput={params => <TextField {...params} label="Columns (empty = all)" />}
          sx={{ mb: 1.5 }}
        />
      )}

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={ov.enabled}
            onChange={e => update('outliers', { ...ov, enabled: e.target.checked })}
          />
        }
        label={<Typography variant="body2">Remove outliers (IQR)</Typography>}
      />

      {ov.enabled && (
        <Box pl={1} mt={0.5} mb={1.5}>
          <Typography variant="caption" color="text.secondary">IQR factor: {ov.factor}</Typography>
          <Slider
            size="small"
            min={0.5} max={3.0} step={0.1}
            value={ov.factor}
            onChange={(_, v) => update('outliers', { ...ov, factor: v })}
          />
          <Autocomplete
            multiple
            size="small"
            options={numericCols}
            value={ov.columns || []}
            onChange={(_, val) => update('outliers', { ...ov, columns: val })}
            renderInput={params => <TextField {...params} label="Columns (empty = all numeric)" />}
          />
        </Box>
      )}

      <Divider sx={{ my: 1.5 }} />

      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
        TRANSFORMATION
      </Typography>

      <Autocomplete
        multiple
        size="small"
        options={categoricalCols}
        value={value.one_hot_cols || []}
        onChange={(_, val) => update('one_hot_cols', val)}
        renderInput={params => <TextField {...params} label="One-hot encode" />}
        sx={{ mb: 1.5 }}
      />

      <Autocomplete
        multiple
        size="small"
        options={numericCols}
        value={value.scale?.columns || []}
        onChange={(_, val) => update('scale', { ...value.scale, columns: val })}
        renderInput={params => <TextField {...params} label="Scale columns" />}
        sx={{ mb: 1 }}
      />

      {(value.scale?.columns?.length ?? 0) > 0 && (
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Scale factor"
          value={value.scale?.factor ?? 1}
          onChange={e => update('scale', { ...value.scale, factor: parseFloat(e.target.value) || 1 })}
        />
      )}
    </Box>
  )
}
