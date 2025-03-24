import { action } from '@stackpress/ingest';
import Error from '../error';

export default action(function ErrorResponse(req, res) {
  Error('Not implemented');
});