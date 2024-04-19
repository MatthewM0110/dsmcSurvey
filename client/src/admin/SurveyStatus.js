
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

  const filterStatusOptions = ['pending', 'open', 'closed'];

  
useEffect(() => {
  async function fetchSurveysAndRespondents() {
    try {
      const { data: surveysData } = await axios.get('/api/surveys');
      const surveysWithRespondentsPromises = surveysData.map(async (survey) => {
        try {
          const { data: respondentsData } = await axios.get(`/api/survey-respondents/${survey.id}`);
          return { 
            ...survey, 
            respondents: respondentsData, 
            totalCompleted: respondentsData.filter(r => r.completed).length 
          };
        } catch (error) {
          console.error(`Error fetching respondents for survey ${survey.id}:`, error);
          return survey; // Return survey without respondents in case of error
        }
      });
      const surveysWithRespondents = await Promise.all(surveysWithRespondentsPromises);
      setSurveys(surveysWithRespondents);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  }

  fetchSurveysAndRespondents();
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

      if (filterStatus) {
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  {/* Title with truncation */}
                  <Typography variant="h5" sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    marginRight: '16px', // Add some margin to ensure space between title and date,
                    color: theme.palette.primary.main, // Using the primary color from the theme

                  }}>
                    {survey.title}
                  </Typography>

                  {/* Date range */}
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




              </CardContent>

              <CardActions>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PeopleIcon />}
                    onClick={() => handleOpenDialog(survey.id)}
                  >
                    View Respondents
                  </Button>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ fontSize: 20, mr: 1, verticalAlign: 'bottom', color: theme.palette.primary.main }} />
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontSize: '1rem' }}>
                      {survey.respondents ? `${survey.totalCompleted}/${survey.respondents.length}` : 'Loading...'}
                    </Typography>

                  </Box>
                </Box>
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