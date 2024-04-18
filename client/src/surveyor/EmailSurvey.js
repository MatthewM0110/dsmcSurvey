import React, { useState, useEffect } from 'react';
import { Autocomplete, Container, Typography, Paper, TextField, Button, Grid, List, ListItem, ListItemText, IconButton, Modal, Backdrop, Fade, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailModal from './EmailModal';
import ErrorMessage from '../components/ErrorMessage'; // Adjust the path as necessary
import SuccessMessage from '../components/SuccessMessage'; // Adjust the path as necessary
import { useParams } from 'react-router-dom'; 
import axios from 'axios';

const EmailSurveyPage = () => {
  
  // Selected values
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSurveyorRole, setSelectedSurveyorRole] = useState(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  // Survey detail states
  const [organizationName, setOrganizationName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [surveyorRoleName, setSurveyorRoleName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { templateId } = useParams();
  // States for the dropdown data
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [surveyorRoles, setSurveyorRoles] = useState([]);
  const [userEmails, setUserEmails] = useState([]);

  // Recipients management
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);


  //Validation Messages States
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await axios.get('/api/server-time');
        const { serverTime } = response.data;
        setStartDate(new Date(serverTime));
        setEndDate(new Date(serverTime));
      } catch (error) {
        console.error('Failed to fetch server time:', error);
      }
    };
  
    fetchServerTime();
  }, []);


  const handleSurveySubmissionAttempt = () => {
    // Reset previous error states
    setErrorOpen(false);
    setErrorMessage('');

    // Validation checks
    if (!organizationName || !projectName || !surveyorRoleName) {
      setErrorMessage("The organization, project, and surveyor role all need to be filled.");
      setErrorOpen(true);
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage("The start date and end date must be there.");
      setErrorOpen(true);
      return;
    } else if (new Date(startDate) >= new Date(endDate)) {
      setErrorMessage("The start date must be before the end date.");
      setErrorOpen(true);
      return;
    }

    if (recipients.length === 0) {
      setErrorMessage("There must be at least 1 respondent.");
      setErrorOpen(true);
      return;
    }

    // If all validations pass, proceed to confirm the survey submission
    setOpenConfirmDialog(true);
  };


  const handleAddRecipient = () => {
    if (selectedUserEmail && !recipients.includes(selectedUserEmail.email)) {
      setRecipients([...recipients, selectedUserEmail.email]);
      setSelectedUserEmail(null); // Clear the selected email after adding
    }
  };

  const handleRemoveRecipient = (emailToRemove) => {
    setRecipients(recipients.filter(email => email !== emailToRemove));
  };

  const toggleEmailModal = () => {
    setIsModalOpen(!isModalOpen);
  };
  const handleSubmitSurvey = async () => {
    try {
      // Create organization
      const orgResponse = await fetch('/api/create-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: organizationName }),
      });
      if (!orgResponse.ok) throw new Error('Failed to create organization');
      const orgData = await orgResponse.json();

      // Create project
      const projResponse = await fetch('/api/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      });
      if (!projResponse.ok) throw new Error('Failed to create project');
      const projData = await projResponse.json();

      // Create surveyor role
      const roleResponse = await fetch('/api/create-surveyor-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: surveyorRoleName }),
      });
      if (!roleResponse.ok) throw new Error('Failed to create surveyor role');
      const roleData = await roleResponse.json();

      // Prepare the survey data with obtained IDs
      const surveyData = {
        surveyTemplateId: parseInt(templateId, 10),
        surveyorId: 1, // This should be dynamically set based on the actual user or surveyor
        organizationId: orgData.organizationId,
        projectId: projData.projectId,
        surveyorRoleId: roleData.surveyorRoleId,
        startDate: startDate,
        endDate: endDate,
        respondentEmails: recipients,
      };

      const surveyResponse = await fetch('/api/create-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      });

      if (!surveyResponse.ok) throw new Error('Failed to create survey');

      console.log('Survey created successfully');
      clearFormFields();
      setSuccessMessage('Survey and all dependencies created successfully!');
      setSuccessOpen(true); //sucess message
      setIsModalOpen(true);  //opens the email modal (./EmailModal)

    } catch (error) {
      console.error('Error in creating survey or dependencies:', error);
      setErrorMessage(error.message);
      setErrorOpen(true);
    }
  };

  const clearFormFields = () => {
    setOrganizationName('');
    setProjectName('');
    setSurveyorRoleName('');
    setStartDate('');
    setEndDate('');
    setRecipients([]);
  };
  
  useEffect(() => {
    const fetchOrganizations = async () => {
      console.log("Fetching organizations...");
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        const data = await response.json();
        console.log("Data parsed", data);
        setOrganizations(data);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      console.log("Fetching projects...");
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        const data = await response.json();
        console.log("Data parsed", data);
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchSurveyorRoles = async () => {
      console.log("Fetching surveyor roles...");
      try {
        const response = await fetch('/api/surveyor-roles');
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        const data = await response.json();
        console.log("Data parsed", data);
        setSurveyorRoles(data);
      } catch (error) {
        console.error("Error fetching surveyor roles:", error);
      }
    };
    fetchSurveyorRoles();
  }, []);

  useEffect(() => {
    const fetchUserEmails = async () => {
      console.log("Fetching user emails...");
      try {
        const response = await fetch('/api/user-emails');
        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        const data = await response.json();
        console.log("Data parsed", data);
        setUserEmails(data);
      } catch (error) {
        console.error("Error fetching user emails:", error);
      }
    };
    fetchUserEmails();
  }, []);
  

  return (
    <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h4" gutterBottom>Email Survey Configuration</Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Survey Details</Typography>
        <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
        <Autocomplete
          options={organizations}
          getOptionLabel={(option) => option.name || 'No Organization provided'}
          value={selectedOrganization}
          onChange={(event, newValue) => {
            setSelectedOrganization(newValue);
            setOrganizationName(newValue ? newValue.name : '');  // Update organizationName state
          }}
          renderInput={(params) => <TextField {...params} label="Organization" variant="outlined" />}
         />
          </Grid>
          <Grid item xs={12} sm={4}>
          <Autocomplete
           options={projects}
           getOptionLabel={(option) => option.name || 'No Project provided'}
           value={selectedProject}
           onChange={(event, newValue) => {
             setSelectedProject(newValue);
             setProjectName(newValue ? newValue.name : '');  // Update projectName state
           }}
           renderInput={(params) => <TextField {...params} label="Project" variant="outlined" />}
         />         
          </Grid>
          <Grid item xs={12} sm={4}>
          <Autocomplete
            options={surveyorRoles}
            getOptionLabel={(option) => option.name || 'No Surveyor Role provided'}
            value={selectedSurveyorRole}
            onChange={(event, newValue) => {
              setSelectedSurveyorRole(newValue);
              setSurveyorRoleName(newValue ? newValue.name : '');
            }}
            renderInput={(params) => <TextField {...params} label="Surveyor Role" variant="outlined" />}
         />  
        </Grid>
          <Grid item xs={12} sm={6}>
            <TextField type="date" label="Survey Start Date" fullWidth value={startDate} onChange={e => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField type="date" label="Survey End Date" fullWidth value={endDate} onChange={e => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Manage Respondents</Typography>
        <Autocomplete
          options={userEmails}
          getOptionLabel={(option) => option.email || 'No Email provided'}
          value={selectedUserEmail}
          onChange={(event, newValue) => {
            setSelectedUserEmail(newValue);
          }}
          renderInput={(params) => <TextField {...params} label="Respondent Email" variant="outlined" />}
         />          
         <Button variant="contained" onClick={handleAddRecipient} sx={{ mt: 1 }}>Add Respondent</Button>
        <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
          {recipients.map((email, index) => (
            <ListItem key={index} secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleRemoveRecipient(email)}><DeleteIcon /></IconButton>}>
              <ListItemText primary={email} />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{"Confirm Survey Submission"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Are you sure you want to submit the survey?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button onClick={() => {
            setOpenConfirmDialog(false); 
            handleSubmitSurvey(); // Proceed to submit the survey
          }} autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>


      <Button variant="contained" onClick={handleSurveySubmissionAttempt}>
        Send Survey
      </Button>



      <EmailModal
        open={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        recipients={recipients}
      />
      <ErrorMessage open={errorOpen} message={errorMessage} onClose={() => setErrorOpen(false)} />
      <SuccessMessage open={successOpen} message={successMessage} onClose={() => setSuccessOpen(false)} />

    </Container>
  );
};

export default EmailSurveyPage;
