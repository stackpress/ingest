import { task } from '@stackpress/ingest/dist/helpers';

const template = `
<!DOCTYPE html>
<html>
  <head>
    <title>Login</title>
  </head>
  <body>
    <h1>Login</h1>
    <form action="/user/login" method="POST">
      <label for="username">Username:</label>
      <input type="text" id="username" name="username" required>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required>
      <button type="submit">Login</button>
    </form>
  </body>
</html>
`;

export default task(function UserLogin(req, res) {
  //send the response
  res.mimetype = 'text/html';
  res.body = template.trim();
});