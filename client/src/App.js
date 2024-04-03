import React, { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, AuthContext } from './components/AuthContext';
import Login from './components/Login';
import AdminDashboard from './admin/AdminDashboard';
import SurveyorDashboard from './surveyor/SurveyorDashboard';
import RespondentDashboard from './respondent/RespondentDashboard';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import SurveyCreationPage from './admin/CreateSurveyPage';
import SurveyHistory from './surveyor/SurveyHistory';
import SurveyPage from './respondent/SurveyPage';
import SendSurvey from './surveyor/SendSurvey';
import AdminTools from './admin/AdminTools';
import AnalyzeResults from './admin/AnalyzeResults'
import ViewResults from './admin/ViewResults'
import ManageSurvey from './admin/ManageSurvey'
import Notification from './admin/Notification'
import PreviewSurvey from './surveyor/PreviewSurvey';
import EmailSurvey from './surveyor/EmailSurvey';
import SurveyStatus from './admin/SurveyStatus';


const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const { user } = useContext(AuthContext);

  return (
    <AuthProvider>
      <ThemeProvider theme={darkTheme}>
        <BrowserRouter>
          <Routes>

            <Route path="/login" element={<Login />} />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/surveyor/dashboard" element={
              <ProtectedRoute roles={['Surveyor']}>
                <Layout><SurveyorDashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/respondent/dashboard" element={
              <ProtectedRoute roles={['Respondent']}>
                <Layout><RespondentDashboard /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/createSurvey" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><SurveyCreationPage /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/manageSurvey" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><ManageSurvey /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/surveyHistory" element={
              <ProtectedRoute roles={['Surveyor']}>
                <Layout><SurveyHistory /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/surveyStatus" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><SurveyStatus /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/adminTools" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><AdminTools /></Layout>
              </ProtectedRoute>
            } />


            <Route path="/sendSurvey" element={
              <ProtectedRoute roles={['Surveyor']}>
                <Layout><SendSurvey /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/analyzeResults" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><AnalyzeResults /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/viewResults" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><ViewResults /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/survey" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><SurveyPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/sendNotification" element={
              <ProtectedRoute roles={['Admin']}>
                <Layout><Notification /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/fill-survey/:templateId" element={
              <ProtectedRoute roles={['Respondent']}>
                <Layout><SurveyPage /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/preview-survey/:templateId" element={
              <ProtectedRoute roles={['Surveyor','Admin']}>
                <Layout><PreviewSurvey /></Layout>
              </ProtectedRoute>
            } />

            <Route path ="/email-survey/:templateId" element={
              <ProtectedRoute roles={['Surveyor']}>
                <Layout><EmailSurvey /></Layout>
              </ProtectedRoute>
            } />

            {/* Catch-all route to handle undefined paths */}
            <Route path="*" element={<Navigate to={!user ? "/login" : `/${user.role.toLowerCase()}/dashboard`} replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
