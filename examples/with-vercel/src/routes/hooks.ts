import { Exception } from '@stackpress/ingest';
import { ServerRouter } from '@stackpress/ingest';

const router = new ServerRouter();

/**
 * Error handlers
 */
router.get('/error', function ErrorResponse(req, res) {
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
router.get('/**', function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});

export default router;