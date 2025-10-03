import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import App from './App';

jest.mock('axios');
const mockedAxios = axios;

describe('Drug Information App', () => {
  const mockTableConfig = {
    columns: [
      { id: 'id', label: 'Id', sortable: false, width: 80 },
      { id: 'code', label: 'Code', sortable: true, width: 120 },
      { id: 'name', label: 'Name', sortable: true, width: 250 },
      { id: 'company', label: 'Company', sortable: true, width: 200 },
      { id: 'launchDate', label: 'Launch Date', sortable: true, width: 150 }
    ],
    settings: {
      pageSize: 10,
      sortBy: 'launchDate',
      sortOrder: 'desc'
    }
  };

  const mockCompanies = [
    'Merck Sharp & Dohme Corp.',
    'Genentech, Inc.',
    'Novartis Pharmaceuticals Corporation',
    'AbbVie Inc.'
  ];

  const mockDrugs = [
    {
      id: 1,
      code: '0006-0568',
      name: 'vorinostat (ZOLINZA)',
      company: 'Merck Sharp & Dohme Corp.',
      launchDate: '2004-02-14T23:01:10Z'
    },
    {
      id: 2,
      code: '0006-1234',
      name: 'imatinib (GLEEVEC)',
      company: 'Novartis Pharmaceuticals Corporation',
      launchDate: '2001-05-10T00:00:00Z'
    },
    {
      id: 3,
      code: '0006-5678',
      name: 'trastuzumab (HERCEPTIN)',
      company: 'Genentech, Inc.',
      launchDate: '1998-09-25T00:00:00Z'
    }
  ];

  beforeEach(() => {
    mockedAxios.get.mockImplementation((url) => {
      switch (url) {
        case '/api/table-config':
          return Promise.resolve({ data: mockTableConfig });
        case '/api/companies':
          return Promise.resolve({ data: mockCompanies });
        case '/api/drugs':
          return Promise.resolve({ 
            data: {
              data: mockDrugs,
              pagination: {
                currentPage: 1,
                totalPages: 1,
                totalRecords: mockDrugs.length,
                limit: 10,
                hasNextPage: false,
                hasPrevPage: false
              }
            }
          });
        default:
          return Promise.reject(new Error('Not found'));
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders drug information table', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Drug Information')).toBeInTheDocument();
      expect(screen.getByText('Filter by Company')).toBeInTheDocument();
    });

    expect(screen.getByText('Id')).toBeInTheDocument();
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Launch Date')).toBeInTheDocument();
  });

  test('displays drug data in table', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('vorinostat (ZOLINZA)')).toBeInTheDocument();
      expect(screen.getByText('imatinib (GLEEVEC)')).toBeInTheDocument();
      expect(screen.getByText('trastuzumab (HERCEPTIN)')).toBeInTheDocument();
    });
  });

  test('filters drugs by company using dropdown', async () => {
    const user = userEvent.setup();
    
    const filteredDrugs = [mockDrugs[0]];
    mockedAxios.get.mockImplementation((url, config) => {
      if (url === '/api/drugs' && config?.params?.company === 'Merck Sharp & Dohme Corp.') {
        return Promise.resolve({ 
          data: {
            data: filteredDrugs,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalRecords: filteredDrugs.length,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }
      return mockedAxios.get.mockResolvedValue({ data: mockTableConfig });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Filter by Company')).toBeInTheDocument();
    });

    const dropdown = screen.getByLabelText('Filter by Company');
    await user.click(dropdown);
    
    await waitFor(() => {
      expect(screen.getByText('Merck Sharp & Dohme Corp.')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Merck Sharp & Dohme Corp.'));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/drugs', {
        params: { company: 'Merck Sharp & Dohme Corp.' }
      });
    });
  });

  test('filters drugs by clicking on company chip in table', async () => {
    const user = userEvent.setup();
    
    const filteredDrugs = [mockDrugs[2]];
    mockedAxios.get.mockImplementation((url, config) => {
      if (url === '/api/drugs' && config?.params?.company === 'Genentech, Inc.') {
        return Promise.resolve({ 
          data: {
            data: filteredDrugs,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalRecords: filteredDrugs.length,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }
      return mockedAxios.get.mockResolvedValue({ data: mockTableConfig });
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Genentech, Inc.')).toBeInTheDocument();
    });

    const companyChip = screen.getByText('Genentech, Inc.');
    await user.click(companyChip);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/drugs', {
        params: { company: 'Genentech, Inc.' }
      });
    });
  });

  test('clears company filter when clicking clear button', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Filter by Company')).toBeInTheDocument();
    });

    const dropdown = screen.getByLabelText('Filter by Company');
    await user.click(dropdown);
    await user.click(screen.getByText('Merck Sharp & Dohme Corp.'));

    await waitFor(() => {
      const clearButton = screen.getByText('×');
      expect(clearButton).toBeInTheDocument();
    });
    
    const clearButton = screen.getByText('×');
    await user.click(clearButton);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/drugs', {
        params: { page: 1, limit: 10 }
      });
    });
  });

  test('displays loading state initially', () => {
    render(<App />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when API fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch data/)).toBeInTheDocument();
    });
  });

  test('formats launch dates correctly', async () => {
    render(<App />);
    
    await waitFor(() => {
      const dateCells = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(dateCells.length).toBeGreaterThan(0);
    });
  });
});


