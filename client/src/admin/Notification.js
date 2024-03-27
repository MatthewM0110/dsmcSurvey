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

  const handleOpenDialog = (survey) => {
    setSelectedSurvey(survey);
    setOpenDialog(true);
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

      <Grid container spacing={2} justifyContent="center">
        {filteredSurveys.map((survey) => (
          <Grid item xs={12} key={survey.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent>
                <Typography variant="h5">
                  {survey.title}
                </Typography>
                <Typography sx={{ mb: 1.5, color: 'text.secondary' }}>
                  <Box component="span" sx={{ color: getStatusColor(survey.start_date, survey.end_date, theme) }}>
                    {calculateStatusAndTime(survey.start_date, survey.end_date)}
                  </Box>
                </Typography>
                <Typography variant="body2">
                  {survey.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<SendIcon/>}
                    style={{ marginLeft: '10px' }}
                    onClick={() => handleOpenDialog(survey)}
                    disabled={isSurveyClosed(survey)} // Disable for closed surveys
                  >
                    Send
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
  
        {/* Email Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Send Email</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Recipient Email"
              type="email"
              fullWidth
              variant="outlined"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Subject"
              type="text"
              fullWidth
              variant="outlined"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
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
