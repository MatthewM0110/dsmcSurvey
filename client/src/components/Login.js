import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; 
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ErrorSnackbar from './ErrorMessage';
import { CssBaseline, createTheme, ThemeProvider } from '@mui/material';
import DamImage from '../components/Dam.webp'; 

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'Admin':
          navigate('/admin/dashboard');
          break;
        case 'Surveyor':
          navigate('/surveyor/dashboard');
          break;
        case 'Respondent':
          navigate('/respondent/dashboard');
          break;
        default:
          navigate('/login');
          break;
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(username); 
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
  };

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          backgroundImage: `url(${DamImage})`, 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container component="main" maxWidth="sm">
          <CssBaseline />
          <Box
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <Typography component="h1" variant="h4" sx={{ color: 'white' }}>
              Sign in
            </Typography>
            <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 3 }}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username or Email"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ backgroundColor: 'transparent', borderRadius: '5px', color: 'white' }} 
                InputProps={{
                  sx: { border: 'none' }, 
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, backgroundColor: '#4CAF50', color: 'white' }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
          <ErrorSnackbar open={!!error} message={error} onClose={handleCloseSnackbar} />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
