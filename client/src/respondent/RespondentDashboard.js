import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';
import { Grid, Card, CardContent, Typography, Container, CardActions, Button, List, ListItem, ListItemText, Divider, Chip, Box } from '@mui/material';
import { format, parseISO } from 'date-fns';

const RespondentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [surveys, setSurveys] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/mySurveys', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Fetched Surveys:', data);
        setSurveys(data);
      } catch (error) {
        console.error('Error fetching surveys:', error);
      }
    };
    fetchSurveys();
  }, []);

  return (
    <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" gutterBottom align="center" style={{ marginBottom: '2rem' }}>Respondent Dashboard</Typography>
      <Grid container spacing={4} justifyContent="center">
        {surveys.map((survey) => (
          <Grid item xs={12} sm={6} md={4} key={survey.id}>
            <Card elevation={3} style={{ height: '100%' }}>
              <CardContent style={{ height: 'auto', minHeight: '150px' }}>
                <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                  <Typography gutterBottom variant="h5" align="center" style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}>
                    {survey.title}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2 }}>
                Sent by: {survey.surveyor || 'Unkown'}
              </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="1rem">
                    <Chip
                      label={survey.completed ? 'Completed' : 'Needs Completed'}
                      color={survey.completed ? 'success' : 'warning'}
                      size="small"
                    />
                    {!survey.completed && <Typography variant="subtitle2">Due Date: {format(parseISO(survey.end_date), 'MMMM dd, yyyy')}</Typography>}
                  </Box>
                </div>
                {survey.completed && (
                  <>
                    <Typography variant="subtitle1" gutterBottom>Responses:</Typography>
                    <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                      <List dense>
                        {survey.responses.map((response, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem>
                              <ListItemText
                                primary={
                                  <Typography
                                    style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}
                                  >
                                    {`${response.question}: ${response.response}`}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    </div>
                  </>
                )}
              </CardContent>
              {!survey.completed && (
                <CardActions style={{ justifyContent: 'bottom' }}>
                  <Button  variant="contained" color="primary" onClick={() => navigate(`/fill-survey/${survey.id}`)}>
                    Fill Survey
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default RespondentDashboard;
