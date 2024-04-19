import React, { useState } from 'react';
import { Container, Typography, Grid, TextField, Button, List, ListItem, ListItemText, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import axios from 'axios';

function ListManager({ title, items, setItems, submitEndpoint }) {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem && !items.includes(newItem)) {
      setItems([...items, newItem]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  const submitItems = async () => {
    try {
      for (const item of items) {
        await axios.post(submitEndpoint, { name: item });
      }
      setItems([]);
      alert('Items added successfully!');
    } catch (error) {
      alert(`Failed to add items: ${error.message}`);
    }
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <TextField
          fullWidth
          label={`New ${title.slice(0, -1)}`}
          variant="outlined"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          margin="normal"
        />
        <Button variant="contained" onClick={handleAddItem} sx={{ mt: 1 }}>
          Add
        </Button>
        <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
          {items.map((item, index) => (
            <ListItem key={index} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(item)}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
        {items.length > 0 && (
          <Button variant="contained" onClick={submitItems} sx={{ mt: 1 }}>
            Submit {title}
          </Button>
        )}
      </Paper>
    </Grid>
  );
}

function AdminTools() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [surveyors, setSurveyors] = useState([]);

  return (
    <Container maxWidth="xl" style={{ marginTop: '2rem', textAlign: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Tool Box
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        <ListManager title="Users" items={users} setItems={setUsers} submitEndpoint="/api/add-users" />
        <ListManager title="Organizations" items={organizations} setItems={setOrganizations} submitEndpoint="/api/create-organization" />
        <ListManager title="Projects" items={projects} setItems={setProjects} submitEndpoint="/api/create-project" />
        <ListManager title="Surveyor Roles" items={surveyors} setItems={setSurveyors} submitEndpoint="/api/create-surveyor-role" />
      </Grid>
    </Container>
  );
}

export default AdminTools;
