import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const LoginScreen = () => {
  const { 
    loginWithRedirect, 
    isAuthenticated, 
    user, 
    isLoading,
    getAccessTokenSilently
  } = useAuth0();
  
  const navigate = useNavigate();

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect({
        appState: {
          returnTo: '/dashboard',
        },
      });
    }
    
    // Si está autenticado, puedes acceder a la información del usuario
    if (isAuthenticated && user) {
      console.log('User info:', user);
      // El user_id suele estar en user.sub
      const user_id = user.sub;
      console.log('User ID:', user_id);
      
      // También puedes obtener el token de acceso para llamar a tu API
      const fetchTokenAndUserInfo = async () => {
        try {
          const accessToken = await getAccessTokenSilently();
          console.log('Access Token:', accessToken);
          
          // Aquí puedes hacer llamadas a tu backend con el token
          // Ejemplo:
          // const response = await fetch('/api/user', {
          //   headers: {
          //     Authorization: `Bearer ${accessToken}`
          //   }
          // });
          // const data = await response.json();
          
          // Navegar al dashboard después de obtener lo necesario
          navigate('/dashboard');
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      };
      
      fetchTokenAndUserInfo();
    }
  }, [isAuthenticated, isLoading, user, loginWithRedirect, navigate, getAccessTokenSilently]);

  return (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
    >
      <CircularProgress />
      <Typography mt={2}>Redirecting to login...</Typography>
    </Box>
  );
};

export default LoginScreen;