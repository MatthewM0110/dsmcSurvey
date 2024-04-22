require('dotenv').config()
const express = require('express')
const { Pool } = require('pg')
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express()
const saltRounds = 10; //const for hashing

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(express.json());



//Async functions

async function findOrCreateUserByEmail(email, roleId) {
  const findUserQuery = 'SELECT id FROM users WHERE email = $1 LIMIT 1;';
  const findResult = await pool.query(findUserQuery, [email]);

  let userId;
  if (findResult.rows.length > 0) {
    // User exists, return the user's ID
    userId = findResult.rows[0].id;
  } else {
    const username = email.split('@')[0];

    const createUserQuery = 'INSERT INTO "users" (username, email, created_at) VALUES ($1, $2, NOW()) RETURNING id;';
    const createResult = await pool.query(createUserQuery, [username, email]);
    userId = createResult.rows[0].id;

    // Insert into user_roles during user creation
    const createUserRoleQuery = 'INSERT INTO user_roles (user_id, role_id, created_at, created_by) VALUES ($1, $2, NOW(), 1);';
    await pool.query(createUserRoleQuery, [userId, roleId]);
  }

  return userId;
}


async function questionExists(question, pool) {
  // Attempt to find an existing question that matches the submitted question exactly
  const questionQuery = `
    SELECT q.id
    FROM questions q
    WHERE q.question = $1 AND q.question_type_id = $2 AND q.is_required = $3;
  `;

  const res = await pool.query(questionQuery, [question.text, question.questionType, question.isRequired]);

  // If the question exists, return its ID; otherwise, return false
  return res.rows.length > 0 ? res.rows[0].id : false;
}


function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    console.log(user);
    req.user = user;
    next();
  });

}

// Authenticates users by email or username, generates JWT token
app.post('/login', async (req, res) => {
  const { emailOrUsername } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM "users" WHERE email = $1 OR username = $1', [emailOrUsername]);
    if (userQuery.rows.length > 0) {
      const user = userQuery.rows[0];

      const roleQuery = await pool.query(`
        SELECT r.name FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
      `, [user.id]);

      const role = roleQuery.rows.length > 0 ? roleQuery.rows[0].name : null;

      const token = jwt.sign({ userId: user.id, role: role }, process.env.SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, role: role });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error during login');
  }
});

//======================================================================================//
//Survey Templates

// Creates a new survey template with provided details and questions

app.post('/create-survey-template', async (req, res) => {
  const { surveyTitle, surveyDescription, questions } = req.body;

  try {
    await pool.query('BEGIN');

    // Insert the survey template
    const surveyTemplateResult = await pool.query(
      'INSERT INTO survey_templates (name, description) VALUES ($1, $2) RETURNING id',
      [surveyTitle, surveyDescription]
    );
    const surveyTemplateID = surveyTemplateResult.rows[0].id;

    for (const question of questions) {
      let questionID = await questionExists(question, pool);

      if (!questionID) { // If the question doesn't exist, insert it
        const questionInsertResult = await pool.query(
          'INSERT INTO questions (question, question_type_id, is_required) VALUES ($1, $2, $3) RETURNING id',
          [question.text, question.questionType, question.isRequired]
        );
        questionID = questionInsertResult.rows[0].id;

        // Insert choices for the new question
        if (question.choices && question.choices.length > 0) {
          for (const choice of question.choices) {
            await pool.query(
              'INSERT INTO choices (question_id, choice_text) VALUES ($1, $2)',
              [questionID, choice]
            );
          }
        }
      }

      // Link the question (new or existing) to the survey template
      await pool.query(
        'INSERT INTO survey_template_questions (survey_template_id, question_id) VALUES ($1, $2)',
        [surveyTemplateID, questionID]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Survey template created successfully!', surveyTemplateID: surveyTemplateID });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error during survey template creation:', error);
    res.status(500).json({ message: 'Error creating survey template', error: error.message });
  }
});


//Gets not deleted survey templates for use in Manage Survey Admin view
app.get('/api/survey-templates', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id AS surveyTemplateID, name AS title, description FROM survey_templates WHERE deleted_at IS NULL'
    );
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch surveys:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetches details of a specific survey template by ID
app.get('/api/survey-template/:templateId', async (req, res) => {
  const { templateId } = req.params;

  try {
    await pool.query('BEGIN');

    const surveyTemplateQuery = `
      SELECT name, description
      FROM survey_templates
      WHERE id = $1;
    `;
    const surveyTemplateResult = await pool.query(surveyTemplateQuery, [templateId]);

    if (surveyTemplateResult.rows.length === 0) {
      res.status(404).json({ message: 'Survey template not found' });
      return;
    }

    const surveyTemplate = surveyTemplateResult.rows[0];

    const questionsQuery = `
      SELECT q.id AS questionID, q.question, qt.name AS questionType, qv.is_required, qv.version_number
      FROM survey_template_questions sq
      JOIN question_versions qv ON sq.question_version_id = qv.id
      JOIN questions q ON qv.question_id = q.id
      JOIN question_types qt ON qv.question_type_id = qt.id
      WHERE sq.survey_template_id = $1;
    `;
    const questionsResult = await pool.query(questionsQuery, [templateId]);

    // Enhance questions with choices if necessary
    for (let question of questionsResult.rows) {
      if (['Multiple Choice', 'Likert Scale'].includes(question.questiontype)) {
        const choicesQuery = `
          SELECT choice_text
          FROM choices
          WHERE question_version_id = $1;
        `;
        const choicesResult = await pool.query(choicesQuery, [question.questionid]);
        question.choices = choicesResult.rows;
      } else {
        question.choices = []; // Ensure all questions have a choices key for consistency
      }
    }

    await pool.query('COMMIT');

    res.json({
      id: templateId,
      name: surveyTemplate.name,
      description: surveyTemplate.description,
      questions: questionsResult.rows
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error fetching survey template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetches detailed information about a specific survey template, including choices
app.get('/api/survey-template-details/:templateId', async (req, res) => {
  const { templateId } = req.params;

  try {
    const surveyDetailsQuery = `
      SELECT st.id AS surveyTemplateID, st.name AS title, st.description, q.id AS questionID, q.question, 
      q.is_required, qt.name AS questionType
      FROM survey_templates st
      JOIN survey_template_questions sq ON st.id = sq.survey_template_id
      JOIN questions q ON sq.question_id = q.id
      JOIN question_types qt ON q.question_type_id = qt.id
      WHERE st.id = $1;
    `;

    const surveyDetailsResult = await pool.query(surveyDetailsQuery, [templateId]);

    if (surveyDetailsResult.rows.length === 0) {
      return res.status(404).json({ message: "Survey template not found" });
    }

    const surveyDetails = [];

    for (const question of surveyDetailsResult.rows) {
      const choicesQuery = `
        SELECT choice_text
        FROM choices
        WHERE question_id = $1;
      `;
      const choicesResult = await pool.query(choicesQuery, [question.questionid]);

      surveyDetails.push({
        ...question,
        choices: choicesResult.rows.map(choiceRow => choiceRow.choice_text)
      });
    }

    res.json(surveyDetails);
  } catch (error) {
    console.error('Failed to fetch survey details:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



app.patch('/api/survey-template/:templateId/delete', async (req, res) => {
  const { templateId } = req.params;

  try {
    const result = await pool.query(
      'UPDATE survey_templates SET deleted_at = NOW() WHERE id = $1 RETURNING *',
      [templateId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Survey template not found or already deleted." });
    }

    res.json({ message: 'Survey template marked as deleted successfully.', surveyTemplate: result.rows[0] });
  } catch (error) {
    console.error('Failed to mark survey as deleted:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


//Question Pool

// Route to fetch all saved questions
app.get('/api/saved-questions', async (req, res) => {
  try {
    const savedQuestionsQuery = `
      SELECT q.id, q.question_type_id, q.question, q.is_required, q.is_saved, 
      COALESCE(json_agg(c.choice_text) FILTER (WHERE c.choice_text IS NOT NULL), '[]') AS choices
      FROM questions q
      LEFT JOIN choices c ON q.id = c.question_id
      GROUP BY q.id;
    `;
    const { rows } = await pool.query(savedQuestionsQuery);
    res.json(rows.map(row => ({
      ...row,
      choices: row.choices === '[]' ? [] : row.choices
    })));
  } catch (error) {
    console.error('Failed to fetch saved questions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Saves a new question to the question bank
app.post('/api/save-question', async (req, res) => {
  try {
    await pool.query('BEGIN');

    const insertQuestionQuery = `
      INSERT INTO questions (question, question_type_id, is_saved, is_required)
      VALUES ($1, $2, true, $3)
      RETURNING id;
    `;
    const questionResult = await pool.query(insertQuestionQuery, [questionText, questionTypeId, isRequired]);
    const questionID = questionResult.rows[0].id;

    if (choices) {
      for (const choiceText of choices) {
        const insertChoiceQuery = `
          INSERT INTO choices (question_id, choice_text)
          VALUES ($1, $2);
        `;
        await pool.query(insertChoiceQuery, [questionID, choiceText]);
      }
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Question saved successfully!' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving question:', error);
    res.status(500).json({ message: 'Error saving question' });
  }
});


//==========================================================================================//
//Surveys

//Creates a SURVEY From the template survey data, with some additional parameters including respondents and project data. 
app.post('/api/create-survey', async (req, res) => {
  const { surveyTemplateId, surveyorId, organizationId, projectId, surveyorRoleId, startDate, endDate, respondentEmails } = req.body;

  try {
    const insertSurveyQuery = `
      INSERT INTO surveys (survey_template_id, surveyor_id, organization_id, project_id, surveyor_role_id, start_date, end_date, created_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $2) RETURNING id;
    `;
    const surveyResult = await pool.query(insertSurveyQuery, [surveyTemplateId, surveyorId, organizationId, projectId, surveyorRoleId, startDate, endDate]);
    const surveyId = surveyResult.rows[0].id;

    for (const email of respondentEmails) {
      const username = email.split('@')[0];
      const userId = await findOrCreateUserByEmail(email, 3, username); // Role ID 3 for respondents

      const userSurveyInsertQuery = `
        INSERT INTO user_surveys (user_id, survey_id)
        VALUES ($1, $2);
      `;
      await pool.query(userSurveyInsertQuery, [userId, surveyId]);
    }

    res.status(201).json({ message: 'Survey created successfully and respondents added!', surveyId: surveyId });
  } catch (error) {
    console.error('Failed to create survey or add respondents:', error);
    res.status(500).json({ message: 'Failed to create survey or add respondents', error: error.message });
  }
});

// Fetches details of a specific survey by ID
app.get('/api/survey-details/:surveyId', async (req, res) => {
  const { surveyId } = req.params;

  try {
    const surveyDetailsQuery = `
      SELECT s.id AS surveyID, st.name AS title, st.description, q.id AS questionID, q.question, 
      q.is_required, qt.name AS questionType
      FROM surveys s
      JOIN survey_templates st ON s.survey_template_id = st.id
      JOIN survey_template_questions sq ON st.id = sq.survey_template_id
      JOIN questions q ON sq.question_id = q.id
      JOIN question_types qt ON q.question_type_id = qt.id
      WHERE s.id = $1;
    `;

    const surveyDetailsResult = await pool.query(surveyDetailsQuery, [surveyId]);

    if (surveyDetailsResult.rows.length === 0) {
      return res.status(404).json({ message: "Survey not found" });
    }

    const surveyDetails = [];

    for (const question of surveyDetailsResult.rows) {
      const choicesQuery = `
        SELECT choice_text
        FROM choices
        WHERE question_id = $1;
      `;
      const choicesResult = await pool.query(choicesQuery, [question.questionid]);

      surveyDetails.push({
        ...question,
        choices: choicesResult.rows.map(choiceRow => choiceRow.choice_text)
      });
    }

    res.json(surveyDetails);
  } catch (error) {
    console.error('Failed to fetch survey details:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



//CREATE Project and ORganization 

// Endpoint to create an organization and return its ID
app.post('/api/create-organization', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO organizations (name) VALUES ($1) RETURNING id', [name]);
    res.json({ organizationId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating organization');
  }
});

// Fetch organizations for emailsurvey page
app.get('/api/organizations', async (req, res) => {
  try {
    const query = 'SELECT id, name FROM organizations';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    res.status(500).json({ message: 'Failed to fetch organizations', error: error.message });
  }
});


// Endpoint to create a project and return its ID
app.post('/api/create-project', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO projects (name) VALUES ($1) RETURNING id', [name]);
    res.json({ projectId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating project');
  }
});

// Fetch project for emailsurvey page
app.get('/api/projects', async (req, res) => {
  try {
    const query = 'SELECT id, name FROM projects';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
});

// Fetch surveyor roles for emailsurvey page
app.get('/api/surveyor-roles', async (req, res) => {
  try {
    const query = 'SELECT id, name FROM surveyor_roles';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch surveyor roles:', error);
    res.status(500).json({ message: 'Failed to fetch surveyor roles', error: error.message });
  }
});

// Endpoint to create a surveyor role and return its ID
app.post('/api/create-surveyor-role', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query('INSERT INTO surveyor_roles (name) VALUES ($1) RETURNING id', [name]);
    res.json({ surveyorRoleId: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating surveyor role');
  }
});

// Fetch user emails for emailsurvey page
app.get('/api/user-emails', async (req, res) => {
  try {
    const query = 'SELECT id, email FROM users';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch user emails:', error);
    res.status(500).json({ message: 'Failed to fetch user emails', error: error.message });
  }
});


//returns all  Surveys despite activeness
app.get('/api/surveys', async (req, res) => {
  try {
      const { rows } = await pool.query(
          `SELECT s.id, s.start_date, s.end_date, st.name AS title, st.description, u.username AS surveyor
          FROM surveys s
          JOIN survey_templates st ON s.survey_template_id = st.id
          JOIN users u ON s.surveyor_id = u.id
          WHERE s.deleted_at IS NULL`
      );
      res.json(rows);
  } catch (error) {
      console.error('Failed to fetch surveys:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


// Fetches surveys assigned to the authenticated user
app.get('/api/mySurveys', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  console.log("Authenticated User ID:", req.user.userId);

  try {
    const surveysQuery = `
      SELECT s.id, s.start_date, s.end_date, st.name AS title, st.description, u.username AS surveyor,
       EXISTS(SELECT 1 FROM responses WHERE user_id = $1 AND survey_id = s.id) AS completed
       FROM surveys s
       JOIN survey_templates st ON s.survey_template_id = st.id
       JOIN user_surveys us ON s.id = us.survey_id
       JOIN users u ON s.surveyor_id = u.id
       WHERE s.deleted_at IS NULL AND us.user_id = $1 AND CURRENT_DATE BETWEEN s.start_date AND s.end_date
    `;

    const surveysResult = await pool.query(surveysQuery, [userId]);

    for (let survey of surveysResult.rows) {
      if (survey.completed) {
        const responsesQuery = `
          SELECT q.question, r.response
          FROM responses r
          JOIN questions q ON r.question_id = q.id
          WHERE r.user_id = $1 AND r.survey_id = $2
        `;
        const responsesResult = await pool.query(responsesQuery, [userId, survey.id]);
        survey.responses = responsesResult.rows;

      } else {
        survey.responses = [];
      }
    }

    res.json(surveysResult.rows);
  } catch (error) {
    console.error('Failed to fetch surveys for user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




//====================================================================================//
//Surey Respone data

// Submits responses to a survey with verification
app.post('/api/survey-response/:surveyId', authenticateToken, async (req, res) => {
  const { surveyId } = req.params;
  const { responses } = req.body;
  const userId = req.user.userId;

  try {
    await pool.query('BEGIN');

    for (const [questionId, response] of Object.entries(responses)) {
      await pool.query(
        'INSERT INTO responses (question_id, survey_id, response, user_id) VALUES ($1, $2, $3, $4)',
        [questionId, surveyId, response, userId]
      );
    }

    await pool.query('COMMIT');
    res.json({ message: 'Responses submitted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Failed to submit responses:', error);
    res.status(500).json({ message: 'Failed to submit responses', error: error.message });
  }
});


// Fetches all survey responses (used in Admin response view)
app.get('/api/survey-responses', async (req, res) => {
  try {
    const responsesQuery = `
          SELECT 
              r.id,
              r.question_id,
              r.response,
              q.question,
              qt.name AS question_type,
              st.name AS survey_name,
              u.email AS respondent_email  -- Add this line to select the email
          FROM responses r
          JOIN questions q ON r.question_id = q.id
          JOIN question_types qt ON q.question_type_id = qt.id
          JOIN surveys s ON r.survey_id = s.id
          JOIN survey_templates st ON s.survey_template_id = st.id
          JOIN users u ON r.user_id = u.id  -- Join the responses with the users table
          ORDER BY r.id ASC;
      `;

    const { rows } = await pool.query(responsesQuery);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No responses found." });
    }

    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});



// Fetches completion status of respondents for a specific survey
app.get('/api/survey-respondents/:surveyId', async (req, res) => {
  const { surveyId } = req.params;

  try {
    const respondentsQuery = `
      SELECT us.user_id, u.email, EXISTS(SELECT 1 FROM responses WHERE user_id = us.user_id AND survey_id = $1) AS completed
      FROM user_surveys us
      JOIN users u ON us.user_id = u.id
      WHERE us.survey_id = $1;
    `;
    const { rows } = await pool.query(respondentsQuery, [surveyId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "No respondents found for the survey." });
    }

    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch respondents:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Patch route to update the end date of a survey
app.patch('/api/update-survey-end-date/:surveyId', async (req, res) => {
  const { surveyId } = req.params;
  const { newEndDate } = req.body;
  try {
    const result = await pool.query(
      'UPDATE surveys SET end_date = $1 WHERE id = $2 RETURNING *',
      [newEndDate, surveyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Survey not found.' });
    }
    res.json({ message: 'End date updated successfully.', survey: result.rows[0] });
  } catch (error) {
    console.error('Error updating survey end date:', error);
    res.status(500).json({ message: 'Failed to update end date', error: error.message });
  }
});

// make a server time that has the surveys use it instead of client time
app.get('/api/server-time', (req, res) => {
  res.json({ serverTime: new Date() });
});

//create users in the admins tool page
app.post('/api/add-users', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const username = email.substring(0, email.indexOf('@'));

  try {
    const createUserQuery = `
      INSERT INTO users (username, email, created_at, created_by)
      VALUES ($1, $2, NOW(), $3) RETURNING *;
    `;
    const createdUser = await pool.query(createUserQuery, [username, email, 1]); // Ensure '1' is a valid `created_by` ID or use authenticated user ID
    res.status(201).json({
      message: 'User added successfully!',
      user: createdUser.rows[0]
    });
  } catch (error) {
    console.error('Failed to add user:', error);
    res.status(500).json({
      message: 'Error adding user',
      error: error.message
    });
  }
});

// Fetch all users who could be added as respondents
app.get('/api/all-respondents', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, username, email FROM users ORDER BY username');
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch all potential respondents:', error);
    res.status(500).json({ message: 'Failed to fetch respondents', error: error.message });
  }
});


// Add respondents to a specific survey
app.post('/api/add-respondents/:surveyId', async (req, res) => {
  const { surveyId } = req.params;
  const { respondents } = req.body; // This should be an array of IDs

  if (!Array.isArray(respondents) || !respondents.every(id => typeof id === 'number')) {
    return res.status(400).json({ message: "Invalid respondents list: Must be an array of numbers." });
  }

  // If validation passes, proceed with database operations...
  try {
    await pool.query('BEGIN');
    const queries = respondents.map(userId =>
      pool.query('INSERT INTO survey_respondents (survey_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [surveyId, userId])
    );
    await Promise.all(queries);
    await pool.query('COMMIT');
    res.status(200).json({ message: 'Respondents added successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Failed to add respondents:', error);
    res.status(500).json({ message: 'Failed to add respondents', error: error.message });
  }
});


app.listen(5003, () => { console.log("Server started on port 5003") })