import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Button, Stack, AppBar, Toolbar, Avatar, IconButton, Menu, MenuItem,
  TextField, InputAdornment, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert,
} from '@mui/material';
import { Logout as LogoutIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import TOTPCard from './TOTPCard';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import { useTOTP } from '@/hooks/useTOTP';
import { useAuthRoutes } from '@/lib/authRoutes';

const TOTPDashboard: React.FC = () => {
  const { user } = useAuth0(); // Solo necesitamos user aquí
  const {
    totpAccounts,
    loading,
    error,
    fetchTOTPs,
    createTOTP
  } = useTOTP();
  
  // Renombramos la función de logout importada para evitar shadowing
  const { handleLogout: authLogout } = useAuthRoutes();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTOTP, setNewTOTP] = useState({ name: '', secret: '' });
  const [formErrors, setFormErrors] = useState({ name: false, secret: false });

  useEffect(() => {
    fetchTOTPs();
  }, []); // El hook useTOTP ya gestiona las dependencias de fetchTOTPs

  const validateSecret = (secret: string): boolean => {
    const base32Regex = /^[A-Z2-7]+=*$/i;
    return base32Regex.test(secret.replace(/\s+/g, '')) && secret.length >= 16;
  };

  const handleCreateTOTP = async () => {
    setFormErrors({ name: false, secret: false });
    
    const errors = {
      name: !newTOTP.name.trim(),
      secret: !newTOTP.secret.trim() || !validateSecret(newTOTP.secret),
    };
    setFormErrors(errors);

    if (errors.name || errors.secret) {
      toast.error(errors.secret ? 'Invalid TOTP secret format (must be base32)' : 'Name and secret are required');
      return;
    }

    setIsCreating(true);
    try {
      const success = await createTOTP(
        newTOTP.name.trim(),
        newTOTP.secret.trim().replace(/\s+/g, '').toUpperCase()
      );
      
      if (success) {
        toast.success('TOTP account added successfully');
        handleDialogClose();
        await fetchTOTPs(); // Actualizar la lista después de agregar
      } else {
        toast.error('Failed to add TOTP account');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while adding the TOTP account';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setNewTOTP({ name: '', secret: '' });
    setFormErrors({ name: false, secret: false });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Esta es la función que se llama al hacer clic en el botón de logout
  const handleLogoutClick = () => {
    handleMenuClose();
    toast.success('Logged out successfully');
    authLogout(); // Llama a la función de logout correcta desde useAuthRoutes
  };

  const filteredAccounts = totpAccounts.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            TOTP Auth
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box
            component="img"
            src="/Baja_logo-_orange.avif"
            alt="Baja Call Center Logo"
            sx={{ height: 40, mr: 2 }}
          />
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar
              sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
              src={user?.picture}
            >
              {getInitials(user?.name)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{ sx: { minWidth: 200 } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogoutClick}> {/* Llama a la función corregida */}
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1" fontWeight="bold">
              Authentication Codes
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2 }}
              onClick={() => setOpenDialog(true)}
            >
              Add TOTP Key
            </Button>
          </Box>

          <TextField
            fullWidth
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Your TOTP Keys ({filteredAccounts.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Codes refresh every 30s
            </Typography>
          </Box>

          {loading && !isCreating && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Stack spacing={2}>
              {filteredAccounts.map((account) => (
                <TOTPCard
                  key={account.name}
                  account={{
                    id: account.name,
                    name: account.name,
                    email: user?.email || '',
                    algorithm: 'SHA1',
                    code: account.otp,
                    timeRemaining: account.time_remaining,
                    progress: Math.round((account.time_remaining / 30) * 100),
                  }}
                  onCopy={(code) => {
                    navigator.clipboard.writeText(code);
                    toast.success('Code copied to clipboard!');
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Add TOTP Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Add New TOTP Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="TOTP Key Name"
            fullWidth
            value={newTOTP.name}
            onChange={(e) => setNewTOTP({ ...newTOTP, name: e.target.value })}
            sx={{ mt: 2 }}
            error={formErrors.name}
            helperText={formErrors.name ? 'This field is required' : 'Google'}
          />
          <TextField
            margin="dense"
            label="TOTP Secret"
            fullWidth
            value={newTOTP.secret}
            onChange={(e) => setNewTOTP({ ...newTOTP, secret: e.target.value })}
            sx={{ mt: 2 }}
            error={formErrors.secret}
            helperText={
              formErrors.secret
                ? 'Invalid TOTP secret (must be base32 format)'
                : 'Enter the secret key (usually 32 characters, A-Z, 2-7)'
            }
            placeholder="e.g. JBSWY3DPEHPK3PXP"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTOTP}
            variant="contained"
            disabled={!newTOTP.name || !newTOTP.secret || isCreating}
            startIcon={isCreating ? <CircularProgress size={20} /> : null}
          >
            {isCreating ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TOTPDashboard;