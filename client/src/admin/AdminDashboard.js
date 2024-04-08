import React from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Card, CardActionArea, CardContent, Typography, Grid, Container } from '@mui/material';
import { DARK_THEME_COLORS } from './constants';
import CreateIcon from '@mui/icons-material/Create';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import HistoryToggleOffIcon from '@mui/icons-material/HistoryToggleOff';
import BuildIcon from '@mui/icons-material/Build';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsIcon from '@mui/icons-material/Notifications';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const pages = [
        { title: 'Create Survey', path: '/createSurvey', icon: CreateIcon },
        { title: 'Manage Survey Templates', path: '/manageSurvey', icon: ManageSearchIcon },
        { title: 'Survey Status', path: '/surveyStatus', icon: HistoryToggleOffIcon },
        { title: 'Admin Tools', path: '/adminTools', icon: BuildIcon },
        { title: 'Analyze Results', path: '/analyzeResults', icon: AnalyticsIcon },
        { title: 'View Results', path: '/viewResults', icon: VisibilityIcon },
        { title: 'Send Notifications', path: '/sendNotification', icon: NotificationsIcon},
    ];

    const BackgroundImageCard = styled(Card)({
        height: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: DARK_THEME_COLORS.CARD_BACKGROUND,
        color: DARK_THEME_COLORS.TEXT_PRIMARY,
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: `0 4px 20px 0 ${DARK_THEME_COLORS.HOVER_SHADOW}`,
        },
    });

    return (
        <Container>
            <Typography variant="h4" gutterBottom align="center" style={{ color: DARK_THEME_COLORS.TEXT_PRIMARY, fontWeight: 'bold', marginBottom: '20px' }}>
                Admin Dashboard
            </Typography>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Grid container spacing={3} justifyContent="center" style={{ maxWidth: 1200 }}>
                    {pages.map((page, index) => (
                        <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
                            <BackgroundImageCard>
                                <CardActionArea onClick={() => navigate(page.path)} style={{ height: '100%' }}>
                                    <CardContent style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        {React.createElement(page.icon, { style: { fontSize: 60, color: DARK_THEME_COLORS.TEXT_SECONDARY }, color: "inherit" })}
                                        <Typography variant="h5" component="div" style={{ fontWeight: 'bold', marginTop: '20px', color: DARK_THEME_COLORS.TEXT_PRIMARY }}>
                                            {page.title}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </BackgroundImageCard>
                        </Grid>
                    ))}
                </Grid>
            </div>
        </Container>
    );
};

export default AdminDashboard;
