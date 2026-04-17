import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DataLoader from '../components/DataLoader'
import * as api from '../api'

jest.mock('../api')

describe('DataLoader', () => {
  beforeEach(() => {
    api.listExampleDatasets.mockResolvedValue(['medical_insurance', 'cali_house', 'test'])
  })

  it('renders without crashing', async () => {
    render(<DataLoader onLoad={jest.fn()} />)
    expect(screen.getByTestId('data-loader')).toBeInTheDocument()
  })

  it('shows example dataset selector by default', async () => {
    render(<DataLoader onLoad={jest.fn()} />)
    expect(screen.getByRole('button', { name: /load dataset/i })).toBeInTheDocument()
  })

  it('calls onLoad with dataset data on success', async () => {
    const mockData = { id: 'abc123', columns: ['a', 'b'], rows: [], shape: [10, 2], dtypes: {} }
    api.loadExampleDataset.mockResolvedValue(mockData)
    const onLoad = jest.fn()

    render(<DataLoader onLoad={onLoad} />)
    fireEvent.click(screen.getByRole('button', { name: /load dataset/i }))
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith(mockData))
  })

  it('shows error message when load fails', async () => {
    api.loadExampleDataset.mockRejectedValue(new Error('Network error'))
    render(<DataLoader onLoad={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /load dataset/i }))
    await waitFor(() => expect(screen.getByText('Network error')).toBeInTheDocument())
  })
})
