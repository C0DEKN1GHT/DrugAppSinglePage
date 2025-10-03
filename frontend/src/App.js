import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Stack,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  Snackbar,
  LinearProgress,
  Skeleton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import FilterListIcon from '@mui/icons-material/FilterList';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  '& .MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
  },
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
}));

function App() {
  const [drugs, setDrugs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [tableConfig, setTableConfig] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const filterRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [selectedCompany, pagination.currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const configResponse = await axios.get('/api/table-config');
      setTableConfig(configResponse.data);

      const companiesResponse = await axios.get('/api/companies');
      setCompanies(companiesResponse.data);

      const drugsResponse = await axios.get('/api/drugs', {
        params: {
          ...(selectedCompany && { company: selectedCompany }),
          page: pagination.currentPage,
          limit: pagination.limit
        }
      });
      setDrugs(drugsResponse.data.data);
      setPagination(drugsResponse.data.pagination);
    } catch (err) {
      setError('Failed to fetch data. Please make sure the backend server is running.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openMenu = (event) => setMenuAnchor(event.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const closeSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

  const handleRefreshData = async () => {
    await fetchData();
    setSnackbar({ open: true, message: 'Data refreshed', severity: 'success' });
    closeMenu();
  };

  const handleGoToFilter = () => {
    if (filterRef.current) {
      filterRef.current.scrollIntoView({ behavior: 'smooth' });
      setSnackbar({ open: true, message: 'Moved to filter', severity: 'info' });
    }
    closeMenu();
  };

  const handleHealthCheck = async () => {
    try {
      const response = await axios.get('/api/health');
      setSnackbar({ open: true, message: `Health: ${response.data.status}`, severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Backend not reachable', severity: 'error' });
    } finally {
      closeMenu();
    }
  };

  const handleCompanyFilter = (company) => {
    setSelectedCompany(company);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading data...
          </Typography>
          <LinearProgress />
          <Box sx={{ mt: 3 }}>
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
          </Box>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar position="fixed" elevation={2} sx={{
        background: (theme) => `linear-gradient(90deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.main} 100%)`
      }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Drug Information
          </Typography>
          <IconButton color="inherit" onClick={openMenu} aria-label="menu">
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleRefreshData}>
              <RefreshIcon fontSize="small" style={{ marginRight: 8 }} /> Refresh Data
            </MenuItem>
            <MenuItem onClick={handleGoToFilter}>
              <FilterListIcon fontSize="small" style={{ marginRight: 8 }} /> Go to Filter
            </MenuItem>
            <MenuItem onClick={handleHealthCheck}>
              <HealthAndSafetyIcon fontSize="small" style={{ marginRight: 8 }} /> Health Check
            </MenuItem>
          </Menu>
        </Toolbar>
        {loading && (
          <LinearProgress color="inherit" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
        )}
      </AppBar>
      <Toolbar />
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      
      <Box sx={{ mb: 3 }} ref={filterRef}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Company</InputLabel>
          <Select
            value={selectedCompany}
            label="Filter by Company"
            onChange={(e) => handleCompanyFilter(e.target.value)}
          >
            <MenuItem value="">
              <em>All Companies</em>
            </MenuItem>
            {companies.map((company) => (
              <MenuItem key={company} value={company}>
                {company}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedCompany && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing drugs from: 
            <StyledChip 
              label={selectedCompany} 
              onDelete={() => handleCompanyFilter('')}
              deleteIcon={<span>×</span>}
              sx={{ ml: 1 }}
            />
          </Typography>
        </Box>
      )}

      <StyledTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {tableConfig?.columns.map((column) => (
                <TableCell key={column.id} style={{ width: column.width }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {drugs.map((drug) => (
              <TableRow key={drug.id} hover>
                <TableCell>{drug.id}</TableCell>
                <TableCell>{drug.code}</TableCell>
                <TableCell>{drug.name}</TableCell>
                <TableCell>
                  <StyledChip
                    label={drug.company}
                    variant="outlined"
                    onClick={() => handleCompanyClick(drug.company)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(drug.launchDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>

      {drugs.length === 0 && !loading && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No drugs found{selectedCompany ? ` for company "${selectedCompany}"` : ''}.
          </Typography>
        </Box>
      )}

      {pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of{' '}
              {pagination.totalRecords} records
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <InputLabel>Per page</InputLabel>
              <Select
                value={pagination.limit}
                label="Per page"
                onChange={(e) => handlePageSizeChange(e.target.value)}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={(event, page) => handlePageChange(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
