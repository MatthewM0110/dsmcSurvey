import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  InputAdornment,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PersonIcon from '@mui/icons-material/Person';

function Notification() {
  const [surveys, setSurveys] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'open', or 'closed'
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const [respondents, setRespondents] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);

  // Update handleOpenDialog to fetch respondents
  const handleOpenDialog = async (survey) => {
    setSelectedSurvey(survey);
    setOpenDialog(true);
    try {
      const { data } = await axios.get(`/api/survey-respondents/${survey.id}`);
      setRespondents(data);
    } catch (error) {
      console.error("Error fetching respondents:", error);
    }
  };

  // Function to handle adding an email to the recipient list
  const handleAddEmail = (email) => {
    setRecipientEmail(recipientEmail ? `${recipientEmail};${email}` : email);
  };

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

  const filteredSurveys = surveys.filter(survey => {
    if (filterStatus === 'open') {
      const now = new Date();
      const end = new Date(survey.end_date);
      return now < end;
    } else if (filterStatus === 'closed') {
      const now = new Date();
      const end = new Date(survey.end_date);
      return now >= end;
    }
    return true; // 'all' status or no filter
  }).filter(survey => {
    const lowerCaseTitle = survey.title.toLowerCase();
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return lowerCaseTitle.includes(lowerCaseSearchTerm);
  });

  const calculateStatusAndTime = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneHour = 60 * 60 * 1000; // milliseconds in an hour
    const oneDay = 24 * oneHour; // milliseconds in a day

    let difference, unit;
    if (now < start) {
      difference = start - now;
      unit = difference < oneDay ? 'hour(s)' : 'day(s)';
      difference = unit === 'day(s)' ? Math.round(difference / oneDay) : Math.round(difference / oneHour);
      return `Idle - Opens in ${difference} ${unit}`;
    } else if (now >= start && now <= end) {
      difference = end - now;
      unit = difference < oneDay ? 'hour(s)' : 'day(s)';
      difference = unit === 'day(s)' ? Math.round(difference / oneDay) : Math.round(difference / oneHour);
      return `Open - Closes in ${difference} ${unit}`;
    } else {
      difference = now - end;
      unit = difference < oneDay ? 'hour(s)' : 'day(s)';
      difference = unit === 'day(s)' ? Math.round(difference / oneDay) : Math.round(difference / oneHour);
      return `Closed - Closed ${difference} ${unit} ago`;
    }
  };

  const handleSendEmail = () => {
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
    window.open(mailtoLink, '_blank');
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEmailSubject('');
    setEmailMessage('');
    setRecipientEmail('');
    setSelectedSurvey(null);
  };



  const isSurveyClosed = (survey) => {
    const now = new Date();
    const end = new Date(survey.end_date);
    return now > end;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Survey Notification Page
      </Typography>

      {/* Filter Buttons */}
      <ToggleButtonGroup
        value={filterStatus}
        exclusive
        onChange={(event, newValue) => setFilterStatus(newValue)}
        aria-label="survey status filter"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="all" aria-label="all surveys">
          All
        </ToggleButton>
        <ToggleButton value="open" aria-label="open surveys">
          Open
        </ToggleButton>
        <ToggleButton value="closed" aria-label="closed surveys">
          Closed
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Search Bar */}
      <TextField
        label="Search Surveys"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
<Grid container spacing={2} >
  {surveys.map((survey) => (
    <Grid item xs={12} sm={6} md={4} key={survey.id}> {/* Adjust grid sizes for responsiveness */}
      <Card sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          height: '100%', // Ensure cards have equal height
        }}>
        <CardContent>
          <Typography variant="h5" sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
            {survey.title}
          </Typography>
          <Typography sx={{ mb: 1.5, color: 'text.secondary' }}>
            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
              <FiberManualRecordIcon sx={{ 
                  color: getStatusColor(survey.start_date, survey.end_date, theme), 
                  marginRight: 1, 
                  fontSize: '1rem' 
                }} />
              {calculateStatusAndTime(survey.start_date, survey.end_date)}
            </Box>
          </Typography>
          <Typography variant="body2" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3, // Limit text to 3 lines
              WebkitBoxOrient: 'vertical'
            }}>
            {survey.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between', padding: '8px 16px' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={() => handleOpenDialog(survey)}
            disabled={isSurveyClosed(survey)}
          >
            Send
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ fontSize: 20, color: theme.palette.primary.main, mr: 1 }} />
            <Typography variant="body2" sx={{ color: theme.palette.primary.main }}>
              {survey.respondents ? `${survey.totalCompleted}/${survey.respondents.length} Completed` : 'Loading...'}
            </Typography>
          </Box>
        </CardActions>
      </Card>
    </Grid>
  ))}
</Grid>



      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Send Email</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2 }}>Select Recipients:</Typography>
          {respondents.map((respondent, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography>{respondent.email} - {respondent.completed ? 'Completed' : 'Not Completed'}</Typography>
              <Button variant="contained" size="small" onClick={() => handleAddEmail(respondent.email)}>+</Button>
            </Box>
          ))}
          {/* Recipient Email */}
          <TextField
            autoFocus
            margin="dense"
            label="Recipient Email"
            type="email"
            fullWidth
            variant="outlined"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            sx={{ mt: 2 }}
          />
          {/* Email Subject */}
          <TextField
            margin="dense"
            label="Subject"
            type="text"
            fullWidth
            variant="outlined"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
          {/* Email Message */}
          <TextField
            margin="dense"
            label="Message"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSendEmail}>Send Email</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );

  function getStatusColor(startDate, endDate, theme) {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return theme.palette.grey[500]; // Idle
    } else if (now >= start && now <= end) {
      return theme.palette.success.main; // Open
    } else {
      return theme.palette.error.main; // Closed
    }
  }
}

export default Notification;
