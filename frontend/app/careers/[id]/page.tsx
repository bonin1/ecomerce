"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Career } from '@/app/types';
import { apiClient } from '@/app/utils/apiClient';
import JobApplicationForm from '@/app/components/career/JobApplicationForm';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const JobDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Career | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      try {
        const response = await apiClient(`/careers/listings/${id}`);
        if (response.success) {
          setJob(response.data);
        } else {
          setError('Failed to load job details');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('An error occurred while loading the job. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const handleApplyClick = () => {
    setShowApplicationForm(true);
    // Smooth scroll to application form
    setTimeout(() => {
      const applicationFormElement = document.getElementById('application-form');
      if (applicationFormElement) {
        applicationFormElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleApplicationSuccess = () => {
    setApplicationSuccess(true);
    setShowApplicationForm(false);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !job) {
    return (
      <>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error || 'Job not found'}
          </Alert>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push('/careers')}
            variant="outlined"
          >
            Back to Careers
          </Button>
        </Container>
      </>
    );
  }

  // Check if job is inactive
  if (job.status !== 'active') {
    return (
      <>
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Alert severity="info" sx={{ mb: 4 }}>
            This job position is no longer accepting applications.
          </Alert>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push('/careers')}
            variant="outlined"
          >
            Back to Careers
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {applicationSuccess && (
          <Alert severity="success" sx={{ mb: 4 }}>
            Your application has been submitted successfully! We'll review your application and contact you soon.
          </Alert>
        )}

        <Box mb={3}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push('/careers')}
            variant="outlined"
            sx={{ mb: 3 }}
          >
            Back to Careers
          </Button>

          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" mb={3}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  {job.title}
                </Typography>

                <Box display="flex" gap={2} flexWrap="wrap" mt={2}>
                  <Box display="flex" alignItems="center">
                    <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body1" color="text.secondary">
                      {job.location}
                    </Typography>
                  </Box>

                  {job.salary && (
                    <Box display="flex" alignItems="center">
                      <MonetizationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body1" color="text.secondary">
                        {job.salary}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center">
                    <WorkIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Chip 
                      label="Full Time" 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </Box>

                  <Box display="flex" alignItems="center">
                    <CalendarTodayIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Posted: {new Date(job.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                onClick={handleApplyClick}
                sx={{ mt: { xs: 2, md: 0 } }}
              >
                Apply Now
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom fontWeight="bold">
              Job Description
            </Typography>

            <Typography 
              variant="body1" 
              component="div" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.8
              }}
            >
              {job.description}
            </Typography>
          </Paper>
        </Box>

        {showApplicationForm && (
          <Box id="application-form" mt={6}>
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                Apply for this Position
              </Typography>
              <JobApplicationForm 
                jobId={parseInt(id as string)} 
                jobTitle={job.title}
                onApplicationSuccess={handleApplicationSuccess}
              />
            </Paper>
          </Box>
        )}
      </Container>
    </>
  );
};

export default JobDetailsPage;
