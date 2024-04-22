import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Container,
  Grid,
  Button,
  useTheme,
  Box
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';

import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PreviewIcon from '@mui/icons-material/Preview';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { TextField, Autocomplete, DatePicker, MenuItem, Select, FormControl, InputLabel, ListItemIcon } from '@mui/material';

function SurveyStatus() {
  const [surveys, setSurveys] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();

  const [filteredSurveys, setFilteredSurveys] = useState(surveys);
  const [filterName, setFilterName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [respondents, setRespondents] = useState([]);
  const [currentSurveyId, setCurrentSurveyId] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState('');

  const [openDatePickerDialog, setOpenDatePickerDialog] = useState(false);
  const [currentEndDate, setCurrentEndDate] = useState(new Date());
  const [newEndDate, setNewEndDate] = useState(new Date());


  const filterStatusOptions = ['All Surveys', 'pending', 'open', 'closed']; // Added 'All Surveys' option

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await axios.get('/api/server-time');
        const { serverTime } = response.data;
        setCurrentEndDate(new Date(serverTime));
        setNewEndDate(new Date(serverTime));
      } catch (error) {
        console.error('Failed to fetch server time:', error);
      }
    };
  
    fetchServerTime();
  }, []);

  useEffect(() => {
    async function fetchSurveysAndRespondents() {
      try {
        const { data } = await axios.get('/api/surveys');
        const surveysWithRespondentsPromises = data.map(async (survey) => {
          const respondentsRes = await axios.get(`/api/survey-respondents/${survey.id}`);
          const respondents = respondentsRes.data;
          const totalCompleted = respondents.filter(r => r.completed).length;
          return { ...survey, respondents, totalCompleted };
        });
        const surveysWithRespondents = await Promise.all(surveysWithRespondentsPromises);
        setSurveys(surveysWithRespondents);
        setFilteredSurveys(surveysWithRespondents);
      } catch (error) {
        console.error("Error fetching surveys and respondents:", error);
      }
    }
    fetchSurveysAndRespondents();
  }, []);

  // Effect for filtering
  useEffect(() => {
    const applyFilters = () => {
      let result = surveys;

      if (filterName) {
        result = result.filter(survey => survey.title.toLowerCase().includes(filterName.toLowerCase()));
      }

      if (filterStartDate) {
        result = result.filter(survey => new Date(survey.start_date) >= new Date(filterStartDate));
      }

      if (filterStatus && filterStatus !== 'All Surveys') {
        result = result.filter(survey => {
          const now = new Date();
          const start = new Date(survey.start_date);
          const end = new Date(survey.end_date);
          let status = '';
          if (now < start) status = 'pending';
          else if (now >= start && now <= end) status = 'open';
          else status = 'closed';
          return status === filterStatus;
        });
      }

      setFilteredSurveys(result);
    };

    applyFilters();
  }, [surveys, filterName, filterStartDate, filterStatus]);


  const handleOpenDialog = (surveyId) => {
    setCurrentSurveyId(surveyId);
    fetchRespondents(surveyId);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setRespondents([]);
  };

  const fetchRespondents = async (surveyId) => {
    try {
      const { data } = await axios.get(`/api/survey-respondents/${surveyId}`);
      setRespondents(data);
      setOpenDialog(true);
    } catch (error) {
      console.error("Error fetching respondents:", error);
    }
  };
  const statusColorMap = {
    pending: 'warning', // Yellow
    open: 'success', // Green
    closed: 'error'  // Red
  };
  const renderStatusIndicator = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneHour = 60 * 60 * 1000; // milliseconds in an hour
    const oneDay = 24 * oneHour; // milliseconds in a day

    let difference, unit, statusColor, statusText;
    if (now < start) {
      difference = start - now;
      unit = difference < oneDay ? 'hour(s)' : 'day(s)';
      difference = unit === 'day(s)' ? Math.round(difference / oneDay) : Math.round(difference / oneHour);
      statusColor = 'warning'; // Yellow for pending
      statusText = `Opens in ${difference} ${unit}`;
    } else if (now >= start && now <= end) {
      difference = end - now;
      unit = difference < oneDay ? 'hour(s)' : 'day(s)';
      difference = unit === 'day(s)' ? Math.round(difference / oneDay) : Math.round(difference / oneHour);
      statusColor = 'success'; // Green for open
      statusText = `Closes in ${difference} ${unit}`;
    } else {
      difference = now - end;
      unit = difference < oneDay ? 'hour(s)' : 'day(s)';
      difference = unit === 'day(s)' ? Math.round(difference / oneDay) : Math.round(difference / oneHour);
      statusColor = 'error'; // Red for closed
      statusText = `Closed ${difference} ${unit} ago`;
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FiberManualRecordIcon sx={{ color: theme.palette[statusColor].main, marginRight: 1, fontSize: '1rem' }} />
        <Typography variant="body2" sx={{ color: theme.palette.grey[500] }}>
          {statusText}
        </Typography>
      </Box>
    );
  };

  const handleOpenDatePicker = (survey) => {
    console.log("Raw survey end date:", survey.end_date);
  
    // Directly parse the end date from the survey data
    const endDateUTC = new Date(survey.end_date);
    console.log("Parsed end date UTC:", endDateUTC);
  
    // Check if the date is valid
    if (isNaN(endDateUTC.getTime())) {
      console.error("Failed to parse the date: Invalid date parsed from survey data");
      alert("Failed to parse the date: Invalid date parsed from survey data");
      return;
    }
  
    setCurrentEndDate(endDateUTC);
    setNewEndDate(endDateUTC);
    setCurrentSurveyId(survey.id);
    setOpenDatePickerDialog(true);
  };
  
  const handleUpdateEndDate = async () => {
    if (newEndDate <= new Date()) {
      alert("The new end date must be after the current date.");
      return;
    }
    try {
      const response = await axios.patch(`/api/update-survey-end-date/${currentSurveyId}`, {
        // Send back to the server in ISO string format in UTC
        newEndDate: newEndDate.toISOString()
      });
      if (response.status === 200) {
        alert("End date updated successfully!");
        setOpenDatePickerDialog(false);
        // Optionally refresh the surveys list here
      } else {
        alert(`Failed to update: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Failed to update the end date:", error);
      alert(`Failed to update the end date: ${error.response.data.message || error.message}`);
    }
  };
  

return (
  <Container maxWidth="xl" sx={{ mt: 4 }}>
    <Typography variant="h4" align="center" gutterBottom>
      Survey Status Portal
    </Typography>

    <Grid container spacing={3}>
      {surveys.map((survey) => (
        <Grid item xs={12} md={4} key={survey.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Typography variant="h5" sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  marginRight: '16px',
                  color: theme.palette.primary.main,
                }}>
                  {survey.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <EventIcon sx={{ fontSize: '1rem', mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="body2" color="primary" sx={{ whiteSpace: 'nowrap' }}>
                    {new Date(survey.start_date).toLocaleDateString()} - {new Date(survey.end_date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ mb: 1.5, color: 'text.secondary' }}>
                {renderStatusIndicator(survey.start_date, survey.end_date)}
              </Typography>
              <Typography variant="body2" sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {survey.description}
              </Typography>
              {/* Display surveyor name */}
              <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2 }}>
                Sent by: {survey.surveyor}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PeopleIcon />}
                onClick={() => handleOpenDialog(survey.id)}
              >
                View Respondents
              </Button>
              <Typography sx={{ mx: 2 }}>{survey.respondents ? `${survey.totalCompleted}/${survey.respondents.length}` : 'Loading...'}</Typography>
              <Button
                variant="outlined"
                startIcon={<EventIcon />}
                onClick={() => handleOpenDatePicker(survey)}
              >
                Change Date
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Dialogs for respondents and changing the end date */}
    <Dialog open={openDialog} onClose={handleCloseDialog}>
      <DialogTitle>{"Survey Respondents"}</DialogTitle>
      <DialogContent>
        <List>
          {respondents.map((respondent) => (
            <ListItem key={respondent.user_id}>
              <ListItemText primary={respondent.email} secondary={respondent.completed ? 'Completed' : 'Not Completed'} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Close</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={openDatePickerDialog} onClose={() => setOpenDatePickerDialog(false)}>
      <DialogTitle>Change End Date</DialogTitle>
      <DialogContent>
        <Typography>Current End Date: {currentEndDate.toLocaleDateString()}</Typography>
        <TextField
          type="datetime-local"
          label="New End Date"
          value={newEndDate.toISOString().slice(0, 16)}
          onChange={(e) => setNewEndDate(new Date(e.target.value + 'Z'))}
          sx={{ mt: 2, width: '100%' }}
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDatePickerDialog(false)}>Cancel</Button>
        <Button onClick={handleUpdateEndDate}>Submit</Button>
      </DialogActions>
    </Dialog>
  </Container>
);
}

export default SurveyStatus;