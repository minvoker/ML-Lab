import {
  CartesianGrid, ComposedChart, Line, ResponsiveContainer,
  Scatter, Tooltip, XAxis, YAxis,
} from 'recharts'

export default function ScatterPlot({ data }) {
  if (!data?.length) return null

  const vals = data.flatMap(d => [d.truth, d.predictions])
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const refLine = [{ x: min, y: min }, { x: max, y: max }]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart margin={{ top: 8, right: 24, bottom: 24, left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="x" type="number" domain={[min, max]} name="True Values" label={{ value: 'True Values', position: 'insideBottom', offset: -12 }} tickFormatter={v => v.toFixed(0)} />
        <YAxis dataKey="y" type="number" domain={[min, max]} name="Predicted Values" label={{ value: 'Predicted', angle: -90, position: 'insideLeft' }} tickFormatter={v => v.toFixed(0)} />
        <Tooltip
          formatter={v => v.toFixed(4)}
          contentStyle={{ background: '#13141F', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#F0F0F5' }}
          itemStyle={{ color: '#F0F0F5' }}
          labelStyle={{ color: '#F0F0F5' }}
        />
        <Line data={refLine} dataKey="y" dot={false} stroke="#F97316" strokeDasharray="5 5" strokeWidth={1.5} legendType="none" />
        <Scatter data={data.map(d => ({ x: d.truth, y: d.predictions }))} fill="#EF4444" opacity={0.6} r={3} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
