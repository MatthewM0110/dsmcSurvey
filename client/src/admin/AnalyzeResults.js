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
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  IconButton
} from '@mui/material';
import { DARK_THEME_COLORS } from './constants';


function AnalyzeResults() {

return(
  <Container>
     <Typography variant="h4" align="center" gutterBottom>
        Analyze Results
      </Typography>
  
  </Container>
)
  

}

export default AnalyzeResults;
