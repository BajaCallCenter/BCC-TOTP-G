
import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';

interface TOTPAccount {
  id: string;
  name: string;
  email: string;
  algorithm: string;
  code: string;
  timeRemaining: number;
  progress: number;
}

interface TOTPCardProps {
  account: TOTPAccount;
  onCopy: (code: string) => void;
}

const getServiceIcon = (name: string) => {
  const firstLetter = name.charAt(0).toUpperCase();
  const colors: { [key: string]: string } = {
    'G': '#4285f4', // Google
    'M': '#00a1f1', // Microsoft
    'A': '#ff9900', // AWS
    'default': '#1976d2',
  };
  
  return colors[firstLetter] || colors.default;
};

const TOTPCard: React.FC<TOTPCardProps> = ({ account, onCopy }) => {
  const { name, email, algorithm, code, timeRemaining, progress } = account;

  const formatCode = (code: string) => {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  };

  return (
    <Card
      sx={{
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <Avatar
              sx={{
                bgcolor: getServiceIcon(name),
                width: 40,
                height: 40,
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {name.charAt(0)}
            </Avatar>
            
            <Box flex={1}>
              <Typography variant="h6" fontWeight="600">
                {name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {email}
              </Typography>
            </Box>
          </Box>

          <Stack alignItems="flex-end" spacing={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={algorithm}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
              <IconButton size="small">
                <MoreIcon />
              </IconButton>
            </Box>
          </Stack>
        </Box>

        <Box mt={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography
              variant="h3"
              component="div"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing={2}
              sx={{ userSelect: 'all' }}
            >
              {formatCode(code)}
            </Typography>
            <IconButton
              onClick={() => onCopy(code)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <CopyIcon />
            </IconButton>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <Box flex={1}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: progress > 30 ? 'success.main' : 'warning.main',
                  },
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" minWidth={60}>
              {timeRemaining}s restantes
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TOTPCard;
