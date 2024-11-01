import { task } from '@stackpress/ingest/dist/helpers';

export default task(function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.mimetype = 'text/html';
    res.body = 'Not Found';
  }
});