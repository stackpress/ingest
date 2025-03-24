import { 
  type ResponseStatus, 
  Exception,
  Status,
  router 
} from '@stackpress/ingest';

const route = router();

/**
 * Error handlers
 */
route.get('/error', function ErrorResponse(req, res) {
  try {
    throw Exception.for('Not implemented');
  } catch (e) {
    const error = e as Exception;
    const status = Status.get(error.code) as ResponseStatus;
    res.setError({ 
      code: status.code, 
      status: status.status, 
      error: error.message,
      stack: error.trace()
    });
  }
});

/**
 * 404 handler
 */
route.on('response', function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});

export default route;