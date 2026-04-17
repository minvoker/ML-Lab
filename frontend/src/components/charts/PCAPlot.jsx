import {
  CartesianGrid, Legend, ResponsiveContainer, Scatter,
  ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts'
import { CLUSTER_COLORS } from '../../constants'

export default function PCAPlot({ data, colorKey, colorMap }) {
  if (!data?.length) return null

  const groups = {}
  data.forEach(d => {
    const key = d[colorKey]
    if (!groups[key]) groups[key] = []
    groups[key].push({ x: d.pc1, y: d.pc2 })
  })

  const keys = Object.keys(groups).sort()

  function getColor(key, i) {
    if (colorMap) return colorMap[key] ?? CLUSTER_COLORS[i % CLUSTER_COLORS.length]
    return CLUSTER_COLORS[i % CLUSTER_COLORS.length]
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 8, right: 24, bottom: 24, left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="x" type="number" name="PC1" label={{ value: 'PC1', position: 'insideBottom', offset: -12 }} tickFormatter={v => v.toFixed(1)} />
        <YAxis dataKey="y" type="number" name="PC2" label={{ value: 'PC2', angle: -90, position: 'insideLeft' }} tickFormatter={v => v.toFixed(1)} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={v => v.toFixed(3)}
          contentStyle={{ background: '#13141F', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#F0F0F5' }}
          itemStyle={{ color: '#F0F0F5' }}
          labelStyle={{ color: '#F0F0F5' }}
        />
        <Legend verticalAlign="top" />
        {keys.map((key, i) => (
          <Scatter
            key={key}
            name={key}
            data={groups[key]}
            fill={getColor(key, i)}
            opacity={0.7}
            r={3}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  )
}
