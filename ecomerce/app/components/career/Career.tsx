"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Career } from '@/app/types';
import { apiClient } from '@/app/utils/apiClient';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Grid,
  TextField,
  MenuItem,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import './Career.scss';

const CareerList: React.FC = () => {
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState<string[]>([]);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '6'); // Show 6 jobs per page
      params.append('status', 'active'); // Only show active jobs
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (selectedLocation) {
        params.append('location', selectedLocation);
      }
      
      const response = await apiClient(`/careers/listings?${params.toString()}`);
      
      if (response.success) {
        setCareers(response.data);
        setTotalPages(response.totalPages || 1);
        
        // Extract unique locations for filter dropdown
        const uniqueLocations = Array.from(
          new Set(response.data.map((career: Career) => career.location as string))
        ) as string[];
        
        // Check if we need to update the locations array
        if (locations.length === 0 && uniqueLocations.length > 0) {
          setLocations(uniqueLocations);
        }
      } else {
        setError('Failed to load job listings');
      }
    } catch (err) {
      console.error('Error fetching careers:', err);
      setError('Failed to load job listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, [page, selectedLocation]);

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchCareers();
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedLocation(event.target.value);
    setPage(1); // Reset to first page when changing location
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCardClick = (careerId: number) => {
    router.push(`/careers/${careerId}`);
  };

  return (
    <div className="career-listing">
      <Box className="filters-container" mb={4}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              label="Search Jobs"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Location"
              value={selectedLocation}
              onChange={handleLocationChange}
              variant="outlined"
              fullWidth
            >
              <MenuItem value="">All Locations</MenuItem>
              {locations.map((location, index) => (
                <MenuItem key={index} value={location}>
                  {location}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button 
              variant="contained" 
              onClick={handleSearch}
              fullWidth
              sx={{ height: '56px' }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : careers.length === 0 ? (
        <Box textAlign="center" py={8} className="no-jobs-found">
          <Typography variant="h5" gutterBottom>
            No job listings found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please try different search criteria or check back later for new opportunities
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3} className="careers-grid">
            {careers.map((career) => (
              <Grid item xs={12} md={6} lg={4} key={career.id}>
                <Card 
                  className="career-card" 
                  onClick={() => handleCardClick(career.id)}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box mb={2}>
                      <Typography variant="h6" component="h3" gutterBottom fontWeight="600">
                        {career.title}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {career.location}
                        </Typography>
                      </Box>
                      
                      {career.salary && (
                        <Chip 
                          label={career.salary} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2, 
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: 3,
                        lineHeight: 1.5,
                        height: '4.5em'
                      }}
                    >
                      {career.description}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center">
                        <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          Posted: {new Date(career.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      <Button 
                        variant="outlined" 
                        size="small"
                        className="view-job-btn"
                      >
                        View Job
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={6}>
              <Pagination 
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </div>
  );
};

export default CareerList;
