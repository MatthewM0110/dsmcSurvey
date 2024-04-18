import React from 'react';
import {useState} from 'react';
import { Autocomplete, Container, Typography, Paper, TextField, Button, Grid, List, ListItem, ListItemText, IconButton, Modal, Backdrop, Fade, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorMessage from '../components/ErrorMessage'; // Adjust the path as necessary
import SuccessMessage from '../components/SuccessMessage'; // Adjust the path as necessary
import { useParams } from 'react-router-dom'; 

function AdminTools() {

  // Recipients management
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');

  const handleAddRecipient = () => {
    if (newRecipient && !recipients.includes(newRecipient)) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (emailToRemove) => {
    setRecipients(recipients.filter(email => email !== emailToRemove));
  };

  return (
    <Container maxWidth="xl" style={{ marginTop: '2rem', textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom>
      Admin Tool Box
      </Typography>
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Add Users</Typography>
        <TextField fullWidth label="Add Respondent Email" variant="outlined" value={newRecipient} onChange={e => setNewRecipient(e.target.value)} margin="normal" />
        <Button variant="contained" onClick={handleAddRecipient} sx={{ mt: 1 }}>Add User</Button>
        <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
          {recipients.map((email, index) => (
            <ListItem key={index} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleRemoveRecipient(email)}><DeleteIcon /></IconButton>}>
              <ListItemText primary={email} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>

       
  );
};
export default AdminTools;