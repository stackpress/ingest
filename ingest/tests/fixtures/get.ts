import type Request from '../../src/Request';
import type Response from '../../src/Response';

export default function(req: Request, res: Response) {
  console.log('-- get --')
  res.setBody('text/plain', req.url.pathname);
}