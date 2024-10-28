import { task } from '@stackpress/ingest/dist/helpers';
import Exception from '@stackpress/ingest/dist/Exception';
export default task(function UserError(req, res) {
  try {
    throw Exception.for('Not implemented');
  } catch (e) {
    const error = e as Exception;
    res.code = error.code;
    res.status = error.message;
    res.stack = error.trace();
  }
});