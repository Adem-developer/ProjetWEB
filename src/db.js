const { Pool } = require("pg");

const pool = new Pool({
  user: 'admin1',
  host: 'localhost',
  database: 'foodydb',
  password: 'admin1',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
