
import { Box, CircularProgress } from '@mui/material';

const Index = () => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      bgcolor="background.default"
    >
      <CircularProgress />
    </Box>
  );
};

export default Index;
