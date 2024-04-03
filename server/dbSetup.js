require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const resetDatabase = async () => {
  try {
    // Drops the current schema and all of its contents, then recreates it
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('CREATE SCHEMA public');
    console.log('Database reset successfully.');
  } catch (error) {
    console.error('Error resetting database:', error.stack);
  }
};

const createTables = async () => {

  const queries = [
    `
    CREATE TABLE IF NOT EXISTS "users" (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255),
      email VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS surveyor_roles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS question_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      question_type_id INTEGER,
      question VARCHAR(255),
      is_required BOOLEAN,
      is_saved BOOLEAN,
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER,
      FOREIGN KEY (question_type_id) REFERENCES question_types (id)
    );`,
   
    `
    CREATE TABLE IF NOT EXISTS role_permissions (
      id SERIAL PRIMARY KEY,
      permission_id INTEGER,
      role_id INTEGER,
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER,
      FOREIGN KEY (permission_id) REFERENCES permissions (id),
      FOREIGN KEY (role_id) REFERENCES roles (id)
    );`,
    `
    CREATE TABLE IF NOT EXISTS user_roles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      role_id INTEGER,
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER,
      FOREIGN KEY (user_id) REFERENCES "users" (id),
      FOREIGN KEY (role_id) REFERENCES roles (id)
    );`,
    `
    CREATE TABLE IF NOT EXISTS survey_templates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      description VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER
    );`,
    `
    CREATE TABLE IF NOT EXISTS survey_template_questions (
      id SERIAL PRIMARY KEY,
      question_id INTEGER,
      survey_template_id INTEGER,
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER,
      FOREIGN KEY (question_id) REFERENCES questions (id),
      FOREIGN KEY (survey_template_id) REFERENCES survey_templates (id)
    );`,
    `
    CREATE TABLE IF NOT EXISTS surveys (
      id SERIAL PRIMARY KEY,
      survey_template_id INTEGER,
      surveyor_id INTEGER,
      organization_id INTEGER,
      project_id INTEGER,
      surveyor_role_id INTEGER,
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER, 
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      FOREIGN KEY (survey_template_id) REFERENCES survey_templates (id),
      FOREIGN KEY (surveyor_id) REFERENCES users (id),
      FOREIGN KEY (organization_id) REFERENCES organizations (id),
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (surveyor_role_id) REFERENCES surveyor_roles (id)
    );`,
    `
    CREATE TABLE IF NOT EXISTS responses (
      id SERIAL PRIMARY KEY,
      question_id INTEGER,
      survey_id INTEGER,
      response VARCHAR(255),
      created_at TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER,
      user_id INTEGER, 
      FOREIGN KEY (question_id) REFERENCES questions (id),
      FOREIGN KEY (survey_id) REFERENCES surveys (id),
      FOREIGN KEY (user_id) REFERENCES users (id) 
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS choices (
      id SERIAL PRIMARY KEY,
      question_id INTEGER,
      choice_text VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      updated_at TIMESTAMP,
      updated_by INTEGER,
      deleted_at TIMESTAMP,
      deleted_by INTEGER,
      FOREIGN KEY (question_id) REFERENCES questions (id)
    );
  `, 
  `CREATE TABLE IF NOT EXISTS "user_surveys" (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    survey_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (survey_id) REFERENCES surveys(id)
  );
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


const runMigrations = async () => {
  try {
    await resetDatabase(); // Reset the database before creating tables
    await createTables();
    console.log('All tables created successfully.');
  } catch (error) {
    console.error('Failed to create tables:', error);
  } finally {
    await pool.end();
  }
};

runMigrations();