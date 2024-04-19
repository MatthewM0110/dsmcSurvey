import React, { useEffect, useState } from 'react';
import { Container, Typography, Select, MenuItem, FormControl, InputLabel, Card, CardContent } from '@mui/material';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import WordCloud from 'react-wordcloud';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function AnalyzeResults() {
  const [data, setData] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState("All Surveys");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [chartType, setChartType] = useState('Pie');

  useEffect(() => {
    const fetchResponses = async () => {
      const response = await fetch('/api/survey-responses');
      if (response.ok) {
        const fetchedData = await response.json();
        setData(fetchedData);
      } else {
        console.error('Failed to fetch responses');
      }
    };

    fetchResponses();
  }, []);

  // Build a unique list of all questions from all surveys
  const questionsMap = {};
  data.forEach(item => {
    if (!questionsMap[item.question_id]) {
      questionsMap[item.question_id] = {
        id: item.question_id,
        text: item.question,
        type: item.question_type
      };
    }
  });
  const questions = Object.values(questionsMap);

  // Optionally filter by selected survey
  const surveys = ["All Surveys", ...new Set(data.map(item => item.survey_name))];
  const getChartData = () => {
    const filteredData = data.filter(item => 
      (selectedSurvey === "All Surveys" || item.survey_name === selectedSurvey) &&
      item.question_id === selectedQuestion
    );
  
    const responseCounts = filteredData.reduce((acc, { response, question_type }) => {
      if (question_type === "Likert Scale") {
        const scale = {
          '1': 'Strongly Disagree',
          '2': 'Disagree',
          '3': 'Neutral',
          '4': 'Agree',
          '5': 'Strongly Agree'
        };
        response = scale[response];
      }
      acc[response] = (acc[response] || 0) + 1;
      return acc;
    }, {});
  
    return {
      labels: Object.keys(responseCounts),
      datasets: [{
        data: Object.values(responseCounts),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
      }]
    };
  };
  

  const getWordCloudData = () => {
    const filteredData = data.filter(item => 
      (selectedSurvey === "All Surveys" || item.survey_name === selectedSurvey) &&
      item.question_id === selectedQuestion
    ).map(({ response }) => ({ text: response, value: 1 }));

    return filteredData;
  };

  const renderChart = () => {
    const questionType = questions.find(q => q.id === selectedQuestion)?.type;
    const chartData = getChartData();

    if (questionType === "Likert Scale" || questionType === "Multiple Choice" || questionType === "True or False") {
      if (chartType === 'Bar') {
        return <Bar data={chartData} options={{ responsive: true }} />;
      }
      return <Pie data={chartData} options={{ responsive: true }} />;
    } else if (questionType === "Short Answer") {
      const wordCloudData = getWordCloudData();
      return <WordCloud words={wordCloudData} />;
    }
    return null;
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Analyze Survey Results</Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel id="select-survey-label">Filter by Survey (optional)</InputLabel>
        <Select
          labelId="select-survey-label"
          value={selectedSurvey}
          onChange={(e) => setSelectedSurvey(e.target.value)}
          label="Filter by Survey (optional)"
        >
          {surveys.map((survey, index) => (
            <MenuItem key={index} value={survey}>{survey}</MenuItem>
          ))}
        </Select>
        <Select maxWidth="md"
    labelId="chart-type-label"
    value={chartType}
    onChange={(e) => setChartType(e.target.value)}
    label="Chart Type"
  >
    <MenuItem value="Pie">Pie Chart</MenuItem>
    <MenuItem value="Bar">Bar Chart</MenuItem>
  </Select>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel id="select-question-label">Select a Question</InputLabel>
        <Select
          labelId="select-question-label"
          value={selectedQuestion}
          onChange={(e) => {
            setSelectedQuestion(e.target.value);
            setChartType('Pie');  // Reset chart type on question change
          }}
          label="Select a Question"
          disabled={!questions.length}
        >
          {questions.map((question) => (
            <MenuItem key={question.id} value={question.id}>{question.text}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedQuestion && (
        <Card>
          <CardContent>
            {renderChart()}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default AnalyzeResults;
