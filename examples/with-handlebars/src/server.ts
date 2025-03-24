import fs from 'node:fs';
import path from 'node:path';
import handlebars from 'handlebars';

//ingest
import { server } from '@stackpress/ingest/http';

//make a new app
const app = server();
app.view.render = (filePath, props) => {
  const contents = fs.readFileSync(filePath, 'utf8');
  const template = handlebars.compile(contents);
  return template(props);
};
app.view.engine = (filePath, req, res, ctx) => {
  const html = ctx.view.render(filePath, { name: req.data.get('name') });
  if (typeof html === 'string') {
    res.setHTML(html);
  }
};
app.view.get('/', path.join(__dirname, 'home.hbs'));
//start the server
app.create().listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log('------------------------------');
});