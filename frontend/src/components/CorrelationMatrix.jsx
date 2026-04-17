import { Box, Typography } from '@mui/material'

function cellColor(value) {
  if (value === null) return '#1A1B20'
  const v = Math.max(-1, Math.min(1, value))
  if (v >= 0) {
    const t = v
    return `rgba(239,68,68,${0.1 + t * 0.75})`
  }
  const t = -v
  return `rgba(249,115,22,${0.1 + t * 0.75})`
}

function textColor(value) {
  if (value === null) return '#555'
  return Math.abs(value) > 0.4 ? '#F1F1F5' : '#8B8BA0'
}

export default function CorrelationMatrix({ data }) {
  const { columns, matrix } = data
  const cellSize = Math.max(52, Math.min(80, Math.floor(520 / columns.length)))

  return (
    <Box mt={2} overflow="auto">
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Correlation Matrix</Typography>
      <Box display="inline-block" border="1px solid" borderColor="divider" borderRadius={1} overflow="hidden">
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ width: cellSize, minWidth: cellSize }} />
              {columns.map(col => (
                <th
                  key={col}
                  style={{
                    width: cellSize,
                    padding: '4px 2px',
                    textAlign: 'center',
                    fontWeight: 600,
                    background: 'rgba(239,68,68,0.06)',
                    color: '#7A7A90',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: cellSize,
                  }}
                  title={col}
                >
                  {col.length > 8 ? col.slice(0, 7) + '…' : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={columns[i]}>
                <td
                  style={{
                    padding: '4px 6px',
                    fontWeight: 600,
                    background: 'rgba(239,68,68,0.06)',
                    color: '#7A7A90',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    maxWidth: cellSize,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={columns[i]}
                >
                  {columns[i].length > 8 ? columns[i].slice(0, 7) + '…' : columns[i]}
                </td>
                {row.map((val, j) => (
                  <td
                    key={j}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      textAlign: 'center',
                      background: cellColor(val),
                      color: textColor(val),
                      fontWeight: 500,
                    }}
                  >
                    {val !== null ? val.toFixed(2) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  )
}
