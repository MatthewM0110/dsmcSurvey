import React from 'react';
import {useState} from 'react';
import { Autocomplete, Container, Typography, Paper, TextField, Button, Grid, List, ListItem, ListItemText, IconButton, Modal, Backdrop, Fade, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorMessage from '../components/ErrorMessage'; // Adjust the path as necessary
import SuccessMessage from '../components/SuccessMessage'; // Adjust the path as necessary
import { useParams } from 'react-router-dom'; 
import axios from 'axios';

function AdminTools() {

  // States for managing lists and new item inputs
  const [newUser, setNewUser] = useState('');
  const [users, setUsers] = useState([]);
  const [newOrganization, setNewOrganization] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [newProject, setNewProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [newSurveyorRole, setNewSurveyorRole] = useState('');
  const [surveyors, setSurveyors] = useState([]);

    // States for success and error messages
    const [successOpen, setSuccessOpen] = useState(false);
    const [errorOpen, setErrorOpen] = useState(false);
    const [message, setMessage] = useState('');
  

  const handleAddser = () => {
    if (newUser && !users.includes(newUser)) {
      setUsers([...users, newUser]);
      setNewUser('');
    }
  };

  const handleRemoveUser = (emailToRemove) => {
    setUsers(users.filter(email => email !== emailToRemove));
  };

  const handleAddOrganization = () => {
    if (newOrganization && !organizations.includes(newOrganization)) {
      setOrganizations([...organizations, newOrganization]);
      setNewOrganization('');
    }
  };

  const handleRemoveOrganization = (organizationToRemove) => {
    setOrganizations(organizations.filter(organization => organization !== organizationToRemove));
  };

  const handleAddProject = () => {
    if (newProject && !projects.includes(newProject)) {
      setProjects([...projects, newProject]);
      setNewProject('');
    }
  };

  const handleRemoveProject = (projectToRemove) => {
    setProjects(projects.filter(project => project !== projectToRemove));
  };

  const handleAddSurveyorRole = () => {
    if (newSurveyorRole && !surveyors.includes(newSurveyorRole)) {
      setSurveyors([...surveyors, newSurveyorRole]);
      setNewSurveyorRole('');
    }
  };

  const handleRemoveSurveyorRole = (roleToRemove) => {
    setSurveyors(surveyors.filter(role => role !== roleToRemove));
  };

  const handleAddUser = async () => {
    if (!newUser || !newUser.includes('@')) {
      alert("Please enter a valid email.");
      return;
    }
    try {
      const response = await axios.post('/api/add-users', { email: newUser });
      if (response.data) {
        // Handle success
        console.log('User added:', response.data);
      }
    } catch (error) {
      console.error('Error adding user:', error.response ? error.response.data : error.message);
    }
  };

    // Function to submit new users, organizations, projects, and roles
  // The functions will loop through all items in their respective lists and make an API call for each
  const submitEntities = async (entities, setEntities, endpoint) => {
    try {
      for (const entity of entities) {
        await axios.post(endpoint, { name: entity });
      }
      setEntities([]); // Clear the list once all are added
      // Here, add your success message logic or state updates as needed
    } catch (error) {
      // Here, add your error handling logic or state updates as needed
      console.error(`Error adding entities to ${endpoint}:`, error);
    }
  };

    // Function to handle adding items to lists
    const handleAddItem = (setter, items, value) => {
      if (value && !items.includes(value)) {
        setter([...items, value]);
      }
    };
  
    // Function to remove items from lists
    const handleRemoveItem = (setter, items, value) => {
      setter(items.filter(item => item !== value));
    };
  
    // Function to submit items to the server
    const submitItems = async (items, endpoint, clearItems) => {
      try {
        for (const item of items) {
          await axios.post(endpoint, { name: item });
        }
        clearItems([]);
        setMessage('Items added successfully!');
        setSuccessOpen(true);
      } catch (error) {
        setMessage(`Failed to add items: ${error.message}`);
        setErrorOpen(true);
      }
    };


    return (
      <Container maxWidth="xl" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Tool Box
        </Typography>
    
        {/* Section to add new users */}
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Add Users</Typography>
          <TextField fullWidth label="User Email" variant="outlined" value={newUser} onChange={e => setNewUser(e.target.value)} margin="normal" />
          <Button variant="contained" onClick={() => handleAddItem(setUsers, users, newUser)} sx={{ mt: 1 }}>Add User</Button>
          <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            {users.map((user, index) => (
              <ListItem key={index} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(setUsers, users, user)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={user} />
              </ListItem>
            ))}
          </List>
          {users.length > 0 && (
            <Button variant="contained" onClick={() => submitItems(users, '/api/add-users', setUsers)} sx={{ mt: 1 }}>
              Submit Users
            </Button>
          )}
        </Paper>
    
        {/* Section to add new organizations */}
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Add Organizations</Typography>
          <TextField fullWidth label="Organization Name" variant="outlined" value={newOrganization} onChange={e => setNewOrganization(e.target.value)} margin="normal" />
          <Button variant="contained" onClick={() => handleAddItem(setOrganizations, organizations, newOrganization)} sx={{ mt: 1 }}>Add Organization</Button>
          <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            {organizations.map((org, index) => (
              <ListItem key={index} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(setOrganizations, organizations, org)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={org} />
              </ListItem>
            ))}
          </List>
          {organizations.length > 0 && (
            <Button variant="contained" onClick={() => submitItems(organizations, '/api/create-organization', setOrganizations)} sx={{ mt: 1 }}>
              Submit Organizations
            </Button>
          )}
        </Paper>
    
        {/* Section to add new projects */}
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Add Projects</Typography>
          <TextField fullWidth label="Project Name" variant="outlined" value={newProject} onChange={e => setNewProject(e.target.value)} margin="normal" />
          <Button variant="contained" onClick={() => handleAddItem(setProjects, projects, newProject)} sx={{ mt: 1 }}>Add Project</Button>
          <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            {projects.map((project, index) => (
              <ListItem key={index} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(setProjects, projects, project)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={project} />
              </ListItem>
            ))}
          </List>
          {projects.length > 0 && (
            <Button variant="contained" onClick={() => submitItems(projects, '/api/create-project', setProjects)} sx={{ mt: 1 }}>
              Submit Projects
            </Button>
          )}
        </Paper>
    
        {/* Section to add new surveyor roles */}
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Add Surveyor Roles</Typography>
          <TextField fullWidth label="Surveyor Role" variant="outlined" value={newSurveyorRole} onChange={e => setNewSurveyorRole(e.target.value)} margin="normal" />
          <Button variant="contained" onClick={() => handleAddItem(setSurveyors, surveyors, newSurveyorRole)} sx={{ mt: 1 }}>Add Role</Button>
          <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            {surveyors.map((role, index) => (
              <ListItem key={index} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleRemoveItem(setSurveyors, surveyors, role)}><DeleteIcon /></IconButton>}>
                <ListItemText primary={role} />
              </ListItem>
            ))}
          </List>
          {surveyors.length > 0 && (
            <Button variant="contained" onClick={() => submitItems(surveyors, '/api/create-surveyor-role', setSurveyors)} sx={{ mt: 1 }}>
              Submit Roles
            </Button>
          )}
        </Paper>
    
        {/* Success and Error Message Components */}
        <SuccessMessage open={successOpen} message={message} onClose={() => setSuccessOpen(false)} />
        <ErrorMessage open={errorOpen} message={message} onClose={() => setErrorOpen(false)} />
      </Container>
    );
};
export default AdminTools;