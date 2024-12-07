import type { ResponseStatus } from '@stackpress/types/dist/types';
import { getStatus } from '@stackpress/types/dist/Status';
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
router.get('/**', function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});

export default router;