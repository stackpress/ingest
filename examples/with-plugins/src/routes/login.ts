import { Context, Response } from '@stackpress/ingest';

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

export default function Login(req: Context, res: Response) {
  //send the response
  res.setHTML(template.trim());
};