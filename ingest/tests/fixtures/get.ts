import type Request from '../../src/Request';
import type Response from '../../src/Response';

export default function(
  { req, res }: { req: Request, res: Response }
) {
  res.set('text/plain', req.url.pathname);
}
