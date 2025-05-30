import { Status } from '@stackpress/lib'
import { Request, Response, Exception } from '@stackpress/ingest';

export default function ErrorResponse(req: Request, res: Response) {
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
};