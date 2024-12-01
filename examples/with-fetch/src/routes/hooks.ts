import { Exception } from '@stackpress/ingest';
import { router } from '@stackpress/ingest/fetch';

const route = router();

/**
 * Error handlers
 */
route.get('/error', function ErrorResponse(req, res) {
  try {
    throw Exception.for('Not implemented');
  } catch (e) {
    const error = e as Exception;
    res.setError({ 
      code: error.code, 
      error: error.message,
      stack: error.trace()
    });
  }
});

/**
 * 404 handler
 */
route.get('/**', function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});

export default route;