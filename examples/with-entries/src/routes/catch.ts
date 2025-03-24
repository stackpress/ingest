import { action, Status, Exception } from '@stackpress/ingest';

export default action(function ErrorResponse(req, res) {
  try {
    throw Exception.for('Not implemented');
  } catch (e) {
    const error = e as Exception;
    res.setError({ 
      code: error.code, 
      status: Status.get(error.code)?.status || 'Internal Server Error',
      error: error.message,
      stack: error.trace()
    });
  }
});