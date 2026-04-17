import {
  CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

export default function LinePlot({ data }) {
  if (!data?.length) return null

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 24, left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="index" label={{ value: 'Sample Index', position: 'insideBottom', offset: -12 }} />
        <YAxis tickFormatter={v => v.toFixed(0)} />
        <Tooltip
          formatter={v => v.toFixed(4)}
          contentStyle={{ background: '#13141F', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#F0F0F5' }}
          itemStyle={{ color: '#F0F0F5' }}
          labelStyle={{ color: '#F0F0F5' }}
        />
        <Legend verticalAlign="top" />
        <Line type="monotone" dataKey="truth" stroke="#EF4444" dot={false} strokeWidth={1.5} />
        <Line type="monotone" dataKey="predictions" stroke="#F97316" dot={false} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  )
}
