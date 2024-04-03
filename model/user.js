const pgp = require('pg-promise')();

const userSchema = new pgp.helpers.ColumnSet([
  'name',
  'email',
  'password',
  'image_name',
  'image_url',
  'phone_no',
  'gender' 
], { table: 'users' });

module.exports = userSchema;
