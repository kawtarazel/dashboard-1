import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';

const VerifyEmailNotice = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Verify Your Email
          </Typography>
          <Typography variant="body1" align="center">
            Thank you for signing up!<br />
            Please check your email and click the verification link before logging in.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmailNotice;
