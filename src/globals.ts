import dotenv from 'dotenv';

// * Dotenv(계정 아이디/비밀번호, API key 등)
dotenv.config();

const UDEMY_API_USERNAME = process.env.UDEMY_API_USERNAME;
const UDEMY_API_PASSWORD = process.env.UDEMY_API_PASSWORD;

const UDEMY_WEB_EMAIL = process.env.UDEMY_WEB_EMAIL;
const UDEMY_WEB_PASSWORD = process.env.UDEMY_WEB_PASSWORD;

export {
  UDEMY_API_USERNAME, // udemy api username
  UDEMY_API_PASSWORD, // udemy api password
  UDEMY_WEB_EMAIL, // udemy(web) email
  UDEMY_WEB_PASSWORD // udemy(web) password
};
