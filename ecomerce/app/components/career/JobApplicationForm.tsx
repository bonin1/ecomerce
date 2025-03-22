"use client";
import React, { useState, useRef } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  CircularProgress,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface JobApplicationFormProps {
  jobId: number;
  jobTitle: string;
  onApplicationSuccess: () => void;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ jobId, jobTitle, onApplicationSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors(prev => ({
          ...prev,
          resume: 'File size exceeds 10MB limit'
        }));
        return;
      }
      
      // Check file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx'];
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        setFieldErrors(prev => ({
          ...prev,
          resume: 'Only PDF, DOC, and DOCX files are allowed'
        }));
        return;
      }
      
      setResumeFile(file);
      
      // Clear error if exists
      if (fieldErrors.resume) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.resume;
          return newErrors;
        });
      }
    }
  };

  const handleCoverLetterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setFieldErrors(prev => ({
          ...prev,
          coverLetter: 'File size exceeds 10MB limit'
        }));
        return;
      }
      
      // Check file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx'];
      
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        setFieldErrors(prev => ({
          ...prev,
          coverLetter: 'Only PDF, DOC, and DOCX files are allowed'
        }));
        return;
      }
      
      setCoverLetterFile(file);
      
      // Clear error if exists
      if (fieldErrors.coverLetter) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.coverLetter;
          return newErrors;
        });
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate phone
    const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    // Validate resume
    if (!resumeFile) {
      newErrors.resume = 'Resume is required';
    }
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const formSubmitData = new FormData();
      

      formSubmitData.append('name', formData.name.trim());
      formSubmitData.append('email', formData.email.trim());
      formSubmitData.append('phone', formData.phone.trim());
      
      // Add files with debugging
      if (resumeFile) {
        formSubmitData.append('resume', resumeFile);
      }
      
      if (coverLetterFile) {
        formSubmitData.append('cover_letter', coverLetterFile);
      }
      

      
      // Make API request without the custom header that's causing CORS issues
      const response = await apiClient(`/careers/apply/${jobId}`, {
        method: 'POST',
        body: formSubmitData,
        skipAuth: true,
        // Remove the X-Debug-Info header causing CORS issues
      });
      
      if (response.success) {
        onApplicationSuccess();
      } else {
        // Handle validation errors from the server
        if (response.errors && Array.isArray(response.errors)) {
          const serverFieldErrors: Record<string, string> = {};
          response.errors.forEach((err: any) => {
            const field = err.param || 'form';
            serverFieldErrors[field] = err.msg || err.message;
          });
          setFieldErrors(serverFieldErrors);
          setError('Please correct the errors in the form');
        } else {
          setError(response.message || 'Failed to submit application');
        }
      }
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'An error occurred while submitting your application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate mt={3}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="subtitle1" gutterBottom fontWeight="500">
        Applying for: {jobTitle}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Full Name"
            name="name"
            required
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            fullWidth
            value={formData.email}
            onChange={handleInputChange}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Phone Number"
            name="phone"
            required
            fullWidth
            value={formData.phone}
            onChange={handleInputChange}
            error={!!fieldErrors.phone}
            helperText={fieldErrors.phone}
            placeholder="+1 (555) 123-4567"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom fontWeight="500" sx={{ mt: 2 }}>
            Upload Documents
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            ref={resumeInputRef}
            onChange={handleResumeChange}
          />
          
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 120,
              borderColor: fieldErrors.resume ? 'error.main' : resumeFile ? 'success.main' : 'divider',
              borderWidth: fieldErrors.resume || resumeFile ? 2 : 1,
              bgcolor: 'background.paper',
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: resumeFile ? 'success.main' : 'primary.main',
              }
            }}
            onClick={() => resumeInputRef.current?.click()}
          >
            {resumeFile ? (
              <>
                <CheckCircleIcon color="success" sx={{ mb: 1, fontSize: 30 }} />
                <Typography variant="body2" align="center" fontWeight="medium" gutterBottom>
                  {resumeFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click to change file
                </Typography>
              </>
            ) : (
              <>
                <CloudUploadIcon color="primary" sx={{ mb: 1, fontSize: 30 }} />
                <Typography variant="body2" align="center" fontWeight="medium">
                  Upload Resume*
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF, DOC, DOCX (Max 10MB)
                </Typography>
              </>
            )}
          </Paper>
          
          {fieldErrors.resume && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {fieldErrors.resume}
            </Typography>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            ref={coverLetterInputRef}
            onChange={handleCoverLetterChange}
          />
          
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 120,
              borderColor: fieldErrors.coverLetter ? 'error.main' : coverLetterFile ? 'success.main' : 'divider',
              borderWidth: fieldErrors.coverLetter || coverLetterFile ? 2 : 1,
              bgcolor: 'background.paper',
              transition: 'border-color 0.2s',
              '&:hover': {
                borderColor: coverLetterFile ? 'success.main' : 'primary.main',
              }
            }}
            onClick={() => coverLetterInputRef.current?.click()}
          >
            {coverLetterFile ? (
              <>
                <CheckCircleIcon color="success" sx={{ mb: 1, fontSize: 30 }} />
                <Typography variant="body2" align="center" fontWeight="medium" gutterBottom>
                  {coverLetterFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click to change file
                </Typography>
              </>
            ) : (
              <>
                <CloudUploadIcon color="action" sx={{ mb: 1, fontSize: 30 }} />
                <Typography variant="body2" align="center" fontWeight="medium">
                  Upload Cover Letter (Optional)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF, DOC, DOCX (Max 10MB)
                </Typography>
              </>
            )}
          </Paper>
          
          {fieldErrors.coverLetter && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {fieldErrors.coverLetter}
            </Typography>
          )}
        </Grid>
      </Grid>
      
      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </Button>
      </Box>
    </Box>
  );
};

export default JobApplicationForm;
