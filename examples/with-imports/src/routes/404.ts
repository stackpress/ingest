import { action } from '@stackpress/ingest';

export default action(function NotFound({ res }) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.html('Not Found');
  }
});
