'use client';
import React, { useState } from 'react';
import { Career } from '@/app/types';
import { apiClient } from '@/app/utils/apiClient';
import { 
    TextField, 
    Button, 
    Box, 
    FormControl, 
    FormControlLabel, 
    RadioGroup, 
    Radio, 
    Paper, 
    Typography,
    CircularProgress
} from '@mui/material';

interface CareerFormProps {
    initialData?: Career;
    onSubmitSuccess: () => void;
    onCancel: () => void;
}

const CareerForm: React.FC<CareerFormProps> = ({ initialData, onSubmitSuccess, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Career>>(
        initialData || {
            title: '',
            description: '',
            location: '',
            salary: '',
            status: 'active'
        }
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.title?.trim()) {
            newErrors.title = 'Job title is required';
        } else if (formData.title.length < 3) {
            newErrors.title = 'Job title must be at least 3 characters';
        }
        
        if (!formData.description?.trim()) {
            newErrors.description = 'Job description is required';
        } else if (formData.description.length < 50) {
            newErrors.description = 'Job description must be at least 50 characters';
        }
        
        if (!formData.location?.trim()) {
            newErrors.location = 'Job location is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        setLoading(true);
        try {
            if (initialData?.id) {
                // Update existing career
                await apiClient(`/careers/update/${initialData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new career
                await apiClient('/careers/create', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }
            
            onSubmitSuccess();
        } catch (error) {
            console.error('Error saving career:', error);
            setErrors({ 
                submit: 'Failed to save job listing. Please try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" mb={2}>
                {initialData ? 'Edit Job Listing' : 'Create New Job Listing'}
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                    name="title"
                    label="Job Title"
                    fullWidth
                    margin="normal"
                    value={formData.title}
                    onChange={handleChange}
                    error={!!errors.title}
                    helperText={errors.title}
                    required
                />
                
                <TextField
                    name="location"
                    label="Location"
                    fullWidth
                    margin="normal"
                    value={formData.location}
                    onChange={handleChange}
                    error={!!errors.location}
                    helperText={errors.location}
                    required
                />
                
                <TextField
                    name="salary"
                    label="Salary (optional)"
                    fullWidth
                    margin="normal"
                    value={formData.salary || ''}
                    onChange={handleChange}
                    placeholder="e.g., $50,000 - $70,000 per year"
                />
                
                <TextField
                    name="description"
                    label="Job Description"
                    fullWidth
                    multiline
                    rows={8}
                    margin="normal"
                    value={formData.description}
                    onChange={handleChange}
                    error={!!errors.description}
                    helperText={errors.description}
                    required
                />
                
                <FormControl component="fieldset" margin="normal">
                    <Typography variant="subtitle2" mb={1}>Status</Typography>
                    <RadioGroup
                        row
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <FormControlLabel 
                            value="active" 
                            control={<Radio />} 
                            label="Active" 
                        />
                        <FormControlLabel 
                            value="inactive" 
                            control={<Radio />} 
                            label="Inactive" 
                        />
                    </RadioGroup>
                </FormControl>
                
                {errors.submit && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {errors.submit}
                    </Typography>
                )}
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button 
                        variant="outlined" 
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            initialData ? 'Update Job' : 'Create Job'
                        )}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default CareerForm;
