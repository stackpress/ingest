import type { StatusCode } from './types';

/**
 * Status Codes
 */
export default {
  get ABORT(): StatusCode {
    return { code: 308, message: 'Aborted' };
  },

  get ERROR(): StatusCode {
    return { code: 500, message: 'Internal Error' };
  },

  get NOT_FOUND(): StatusCode {
    return { code: 404, message: 'Not Found' };
  },

  get OK(): StatusCode {
    return { code: 200, message: 'OK' };
  }
}