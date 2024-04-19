require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createTables = async () => {
  const queries = [
    // Adding roles
    `
    INSERT INTO roles (name, created_at, created_by) VALUES
    ('Admin', NOW(), 1),
    ('Surveyor', NOW(), 1),
    ('Respondent', NOW(), 1);
    `,
    // Adding permissions
    `
    INSERT INTO permissions (name, created_at, created_by) VALUES
    ('CREATE_SURVEY', NOW(), 1),
    ('EDIT_SURVEY', NOW(), 1),
    ('DELETE_SURVEY', NOW(), 1),
    ('READ_SURVEY', NOW(), 1),
    ('MANAGE_SURVEYORS', NOW(), 1),
    ('MANAGE_RESPONDENTS', NOW(), 1),
    ('SEND_NOTIFICATIONS', NOW(), 1),
    ('COMPLETE_SURVEY', NOW(), 1),
    ('VIEW_ASSIGNED_SURVEY', NOW(), 1);
    `,
    // Adding Administrator roles
    `
    INSERT INTO role_permissions (role_id, permission_id, created_at, created_by) VALUES
    (1, 1, NOW(), 1), 
    (1, 2, NOW(), 1), 
    (1, 3, NOW(), 1), 
    (1, 4, NOW(), 1), 
    (1, 5, NOW(), 1); 
    `,
    // Adding Surveyor roles
    `
    INSERT INTO role_permissions (role_id, permission_id, created_at, created_by) VALUES
    (2, 6, NOW(), 1), 
    (2, 7, NOW(), 1); 
    `,
    // Adding Respondent roles
    `
    INSERT INTO role_permissions (role_id, permission_id, created_at, created_by) VALUES
    (3, 8, NOW(), 1), 
    (3, 9, NOW(), 1); 
    `,
    // Adding users and assigning them roles
    `
    INSERT INTO "users" (username, email, created_at, created_by) VALUES
    ('Admin', 'admin@example.com', NOW(), 1),
    ('Surveyor1', 'surveyor1@example.com', NOW(), 1),
    ('Surveyor2', 'surveyor2@example.com', NOW(), 1),
    ('Respondent1', 'respondent1@example.com', NOW(), 1),
    ('Respondent2', 'respondent2@example.com', NOW(), 1),
    ('Respondent3', 'respondent3@example.com', NOW(), 1),
    ('Respondent4', 'respondent4@example.com', NOW(), 1),
    ('Respondent5', 'respondent5@example.com', NOW(), 1),
    ('Respondent6', 'respondent6@example.com', NOW(), 1),
    ('Respondent7', 'respondent7@example.com', NOW(), 1),
    ('Respondent8', 'respondent8@example.com', NOW(), 1),
    ('Respondent9', 'respondent9@example.com', NOW(), 1);


    `,
    // Adding user roles
    `
    INSERT INTO user_roles (user_id, role_id, created_at, created_by) VALUES
    (1, 1, NOW(), 1),   -- Admin
    (2, 2, NOW(), 1),   -- Surveyor1
    (3, 2, NOW(), 1),   -- Surveyor2
    (4, 3, NOW(), 1),   -- Respondent1
    (5, 3, NOW(), 1),   -- Respondent2
    (6, 3, NOW(), 1),   -- Respondent3
    (7, 3, NOW(), 1),   -- Respondent4
    (8, 3, NOW(), 1),   -- Respondent5
    (9, 3, NOW(), 1),   -- Respondent6
    (10, 3, NOW(), 1),   -- Respondent7
    (11, 3, NOW(), 1),   -- Respondent8
    (12, 3, NOW(), 1);   -- Respondent9



    

    `,
    // Adding question types
    `
    INSERT INTO question_types (name, created_at, created_by) VALUES 
    ('Likert Scale', NOW(), 1), 
    ('Multiple Choice', NOW(), 1), 
    ('True or False', NOW(), 1), 
    ('Short Answer', NOW(), 1);
    `, 
    `INSERT INTO organizations (name, created_at, created_by) VALUES
    ('DSMMCX', NOW(), 1), 
    ('DSPC', NOW(), 1), 
    ('CELRH-PM-PD', NOW(), 1), 
    ('OR', NOW(), 1), 
    ('PMD', NOW(), 1), 
    ('MCX', NOW(), 1), 
    ('Geotechnical', NOW(), 1);

    `,
    `INSERT INTO projects (name, created_at, created_by) VALUES
    ('Project 1', NOW(), 1), 
    ('Project 2', NOW(), 1), 
    ('Project 3', NOW(), 1), 
    ('Project 4', NOW(), 1);
    `,
    
    `INSERT INTO surveyor_roles (name, created_at, created_by) VALUES
    ('Advisor', NOW(), 1), 
    ('Safety Expert', NOW(), 1), 
    ('Programmer', NOW(), 1), 
    ('Manager', NOW(), 1);
    `
  ];




  for (const query of queries) {
    try {
      await pool.query(query);
      console.log('Query executed successfully.');
    } catch (error) {
      console.error('Error executing query:', error.stack);
    }
  }
};

const addData = async () => {
  try {
    await createTables();
    console.log('All tables created successfully.');
  } catch (error) {
    console.error('Failed to create tables:', error);
  } finally {
    await pool.end();
  }
};

addData();