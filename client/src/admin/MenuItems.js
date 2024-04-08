import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CreateIcon from '@mui/icons-material/Create';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import SendIcon from '@mui/icons-material/Send';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PollIcon from '@mui/icons-material/Poll';
import SurveyStatus from './SurveyStatus';
import HomeIcon from '@mui/icons-material/Home';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { AuthContext } from '../components/AuthContext'; 


// Define menu items with their corresponding text, icons, routes, and allowed roles
export const menuItems = [
  {text: 'Home', icon: <HomeIcon />, route: '/dashboard', roles: ['Admin']},
  { text: 'Create Survey', icon: <CreateIcon />, route: '/createSurvey', roles: ['Admin'] },
  { text: 'Manage Survey Templates', icon: <AdminPanelSettingsIcon />, route: '/manageSurvey', roles: ['Admin'] },
  { text: 'Survey Status', icon: <HistoryIcon />, route: '/surveyStatus', roles: ['Admin'] },
  { text: 'Admin Tools', icon: <BuildIcon />, route: '/adminTools', roles: ['Admin'] },
  { text: 'Send Survey', icon: <SendIcon />, route: '/sendSurvey', roles: [ 'Surveyor'] },
  { text: 'Analyze Results', icon: <BarChartIcon />, route: '/analyzeResults', roles: ['Admin'] },
  {text: 'View Results', icon: <VisibilityIcon />, route: '/viewResults', roles: ['Admin']},
  { text: 'Send Notifications', icon: <NotificationsIcon />, route: '/sendNotification', roles: ['Admin'] },
  { text: 'Survey', icon: <PollIcon />, route: '/survey', roles: ['Respondent'] },
 

];


// Component to render menu items based on user roles
const MenuItemsComponent = () => {
  const { user } = useContext(AuthContext);
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));
  return (
    <div>
      {visibleMenuItems.map((item, index) => (
        <ListItem
          button
          key={item.text}
          component={Link}
          to={item.route}
          style={{
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: 'white', 
            margin: '10px 0', 
            borderRadius: '4px', 
          }}
        >
          <ListItemIcon style={{ color: 'white' }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </div>
  );
};

export default MenuItemsComponent;