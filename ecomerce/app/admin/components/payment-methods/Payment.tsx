'use client';
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/app/utils/apiClient';
import { 
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControlLabel, Switch, CircularProgress, Stack,
  Alert, Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import './Payment.scss';

interface PaymentMethod {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  processing_time: string | null;
  fee_percentage: number | null;
  fee_fixed: number | null;
  min_amount: number | null;
  max_amount: number | null;
  display_order: number;
}

const emptyPaymentMethod: PaymentMethod = {
  id: 0,
  name: '',
  description: '',
  icon: '',
  is_active: true,
  processing_time: '',
  fee_percentage: null,
  fee_fixed: null,
  min_amount: null,
  max_amount: null,
  display_order: 999
};

const PaymentMethodsManager = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod>({...emptyPaymentMethod});
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await apiClient('/payment-methods');
      if (response.success) {
        setPaymentMethods(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      showSnackbar('Failed to load payment methods', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setCurrentMethod({...method});
      setIsEditing(true);
    } else {
      setCurrentMethod({...emptyPaymentMethod});
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setCurrentMethod(prev => ({...prev, [name]: checked}));
    } else if (['fee_percentage', 'fee_fixed', 'min_amount', 'max_amount', 'display_order'].includes(name)) {
      // Convert to number or null if empty
      const numValue = value === '' ? null : Number(value);
      setCurrentMethod(prev => ({...prev, [name]: numValue}));
    } else {
      setCurrentMethod(prev => ({...prev, [name]: value}));
    }
  };

  const handleSave = async () => {
    try {
      if (!currentMethod.name) {
        showSnackbar('Payment method name is required', 'error');
        return;
      }

      const endpoint = isEditing 
        ? `/payment-methods/${currentMethod.id}`
        : '/payment-methods';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await apiClient(endpoint, {
        method: method,
        body: JSON.stringify(currentMethod)
      });
      
      if (response.success) {
        showSnackbar(
          isEditing 
            ? `Payment method "${currentMethod.name}" updated successfully` 
            : `Payment method "${currentMethod.name}" created successfully`,
          'success'
        );
        fetchPaymentMethods();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      showSnackbar(`Failed to ${isEditing ? 'update' : 'create'} payment method`, 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete payment method "${name}"? This action cannot be undone.`)) {
      try {
        const response = await apiClient(`/payment-methods/${id}`, {
          method: 'DELETE'
        });
        
        if (response.success) {
          showSnackbar(`Payment method "${name}" deleted successfully`, 'success');
          fetchPaymentMethods();
        }
      } catch (error) {
        console.error('Error deleting payment method:', error);
        showSnackbar(`Failed to delete payment method "${name}"`, 'error');
      }
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container className="payment-methods-container">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">Payment Methods</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Payment Method
        </Button>
      </Stack>

      {loading ? (
        <div className="loading-container">
          <CircularProgress />
        </div>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Processing Time</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Display Order</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentMethods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No payment methods found</TableCell>
                </TableRow>
              ) : (
                paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="method-name">
                        {method.icon && (
                          <span className="method-icon">{method.icon}</span>
                        )}
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell>{method.description || '-'}</TableCell>
                    <TableCell>{method.processing_time || '-'}</TableCell>
                    <TableCell>
                      {method.fee_percentage ? `${method.fee_percentage}%` : ''} 
                      {(method.fee_percentage && method.fee_fixed) ? ' + ' : ''}
                      {method.fee_fixed ? `$${method.fee_fixed.toFixed(2)}` : ''}
                      {!method.fee_percentage && !method.fee_fixed ? 'No fee' : ''}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${method.is_active ? 'active' : 'inactive'}`}>
                        {method.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{method.display_order}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(method)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDelete(method.id, method.name)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? `Edit Payment Method: ${currentMethod.name}` : 'Add New Payment Method'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              name="name"
              label="Name"
              fullWidth
              value={currentMethod.name}
              onChange={handleInputChange}
              required
              helperText="Name of the payment method (e.g., Credit Card, PayPal)"
            />
            
            <TextField
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={currentMethod.description || ''}
              onChange={handleInputChange}
              helperText="Optional description of the payment method"
            />
            
            <TextField
              name="icon"
              label="Icon"
              fullWidth
              value={currentMethod.icon || ''}
              onChange={handleInputChange}
              helperText="Icon representation (emoji or icon code)"
            />
            
            <TextField
              name="processing_time"
              label="Processing Time"
              fullWidth
              value={currentMethod.processing_time || ''}
              onChange={handleInputChange}
              helperText="e.g., 'Instant', '1-2 business days'"
            />
            
            <div className="fee-container">
              <TextField
                name="fee_percentage"
                label="Fee Percentage (%)"
                type="number"
                value={currentMethod.fee_percentage === null ? '' : currentMethod.fee_percentage}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                helperText="Percentage fee (e.g., 2.9%)"
              />
              
              <TextField
                name="fee_fixed"
                label="Fixed Fee ($)"
                type="number"
                value={currentMethod.fee_fixed === null ? '' : currentMethod.fee_fixed}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                helperText="Fixed fee (e.g., $0.30)"
              />
            </div>
            
            <div className="amount-container">
              <TextField
                name="min_amount"
                label="Min Amount ($)"
                type="number"
                value={currentMethod.min_amount === null ? '' : currentMethod.min_amount}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                helperText="Minimum transaction amount"
              />
              
              <TextField
                name="max_amount"
                label="Max Amount ($)"
                type="number"
                value={currentMethod.max_amount === null ? '' : currentMethod.max_amount}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                helperText="Maximum transaction amount"
              />
            </div>
            
            <TextField
              name="display_order"
              label="Display Order"
              type="number"
              value={currentMethod.display_order}
              onChange={handleInputChange}
              InputProps={{ inputProps: { min: 0, step: 1 } }}
              helperText="Order in which this payment method appears (lower numbers first)"
            />
            
            <FormControlLabel
              control={
                <Switch
                  name="is_active"
                  checked={currentMethod.is_active}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PaymentMethodsManager;
