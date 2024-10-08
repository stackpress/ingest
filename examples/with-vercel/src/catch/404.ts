import { task } from '@stackpress/ingest/dist/helpers';

export default task(function NotFound(req, res) {
  if (!res.mimetype && !res.body) {
    //send the response
    res.mimetype = 'text/html';
    res.body = 'Not Found';
  }
});