import type { ResponseStatus } from '@stackpress/lib/types';
import { getStatus } from '@stackpress/lib/Status';
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
    const status = getStatus(error.code) as ResponseStatus;
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
router.on('response', function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});

export default router;