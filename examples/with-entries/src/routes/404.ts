import { action } from '@stackpress/ingest';

export default action(function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});