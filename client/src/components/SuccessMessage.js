import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const SuccessMessage = ({ open, message, onClose }) => {
  return (
    <Snackbar open={open} autoHideDuration={6000} onClose={onClose}>
      <MuiAlert elevation={6} variant="filled" severity="success" onClose={onClose}>
        {message}
      </MuiAlert>
    </Snackbar>
  );
};

export default SuccessMessage;
