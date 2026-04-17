import { Component } from 'react'
import { Box, Typography } from '@mui/material'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { crashed: false }

  componentDidCatch(error) {
    this.setState({ crashed: true })
    console.error('ErrorBoundary caught:', error)
    // must be a class component — no hook equivalent for componentDidCatch yet
  }

  render() {
    if (this.state.crashed) {
      return (
        <Box
          display="flex" flexDirection="column" alignItems="center" justifyContent="center"
          gap={1} p={3}
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(239,68,68,0.2)',
            bgcolor: 'rgba(239,68,68,0.05)',
            minHeight: 120,
          }}
        >
          <AlertTriangle size={22} color="#EF4444" strokeWidth={1.5} />
          <Typography variant="body2" color="error.main" fontWeight={600}>
            {this.props.label ?? 'This component crashed'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Try retraining or selecting different features
          </Typography>
        </Box>
      )
    }
    return this.props.children
  }
}
