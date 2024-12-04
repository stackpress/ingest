import type Request from '../../src/Request';
import type Response from '../../src/Response';

export default function(req: Request, res: Response) {
  res.setBody('text/plain', `${req.method} ${req.url.pathname}`);
}