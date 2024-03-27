
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

  const filterStatusOptions = ['idle', 'open', 'closed'];

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const { data } = await axios.get('/api/surveys');
        setSurveys(data);
      } catch (error) {
        console.error("Error fetching surveys:", error);
      }
    }
    fetchSurveys();
  }, []);
  useEffect(() => {
    async function fetchSurveyData() {
      const surveyDataPromises = surveys.map(async (survey) => {
        try {
          // Fetch respondents for the current survey
          const { data } = await axios.get(`/api/survey-respondents/${survey.id}`);
          
          // Calculate total assigned by taking the length of the respondents array
          const totalAssigned = data.length;
  
          // Update the survey object with the totalAssigned property
          return { ...survey, respondents: data, totalAssigned };
        } catch (error) {
          console.error(`Error fetching respondents for survey ${survey.id}:`, error);
          return survey; // Return the original survey if fetching fails
        }
      });
      const updatedSurveys = await Promise.all(surveyDataPromises);
      setFilteredSurveys(updatedSurveys);
    }
    fetchSurveyData();
  }, [surveys]);
  
  useEffect(() => {
    const applyFilters = () => {
      let result = surveys;

      if (filterName) {
        result = result.filter(survey => survey.title.includes(filterName));
      }

      if (filterStartDate) {
        result = result.filter(survey => new Date(survey.start_date) >= new Date(filterStartDate));
      }

      if (filterStatus) {
        result = result.filter(survey => {
          const now = new Date();
          const start = new Date(survey.start_date);
          const end = new Date(survey.end_date);
          let status = '';
          if (now < start) status = 'idle';
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
    idle: 'warning', // Yellow
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
      statusColor = 'warning'; // Yellow for idle
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Survey Status Portal
      </Typography>


      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          label="Filter by Name"
          variant="outlined"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <TextField
          type="date"
          label="Start Date"
          variant="outlined"
          value={filterStartDate}
          onChange={(e) => setFilterStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
        />
        <TextField
          type="date"
          label="End Date"
          variant="outlined"
          value={filterEndDate}
          onChange={(e) => setFilterEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            label="Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {Object.entries(statusColorMap).map(([status, color]) => (
              <MenuItem key={status} value={status}>
                <FiberManualRecordIcon sx={{ color: theme.palette[color].main, mr: 1, verticalAlign: 'middle' }} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredSurveys.map((survey) => (
          <Grid item xs={12} md={4} key={survey.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <CardContent>
  <Typography variant="h5" sx={{
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }}>
    {survey.title}
  </Typography>
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
  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
    Start Date: {new Date(survey.start_date).toLocaleDateString()}
  </Typography>
  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
    End Date: {new Date(survey.end_date).toLocaleDateString()}
  </Typography>
  <Box sx={{ position: 'relative' }}>
    <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center' }}>
      <PersonIcon sx={{ fontSize: 16, verticalAlign: 'bottom', marginRight: 1 }} />
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {survey.respondents ? `${survey.respondents.length}/${survey.totalAssigned}` : 'Loading...'}
      </Typography>
    </Box>
  </Box>
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
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </Container>
  );
}

export default SurveyStatus;
