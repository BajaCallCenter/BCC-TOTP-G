import { useAuth0 } from '@auth0/auth0-react';

export const useAuthRoutes = () => {
  const { loginWithRedirect, logout } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        // Usa el origen actual para construir la URL de redirección.
        // Esto es más robusto que usar una IP hardcodeada.
        redirect_uri: `${window.location.origin}/callback`
      }
    });
  };

  const handleLogout = () => {
    logout({
      logoutParams: {
        // Redirige al origen después del logout.
        returnTo: window.location.origin
      }
    });
  };

  // getAuthToken se puede obtener directamente del hook useTOTP, por lo que se elimina para simplificar.

  return {
    handleLogin,
    handleLogout,
  };
};