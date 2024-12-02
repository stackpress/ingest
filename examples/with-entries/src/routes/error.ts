import { ServerRequest, Response, Exception } from '@stackpress/ingest';

export default function ErrorResponse(req: ServerRequest, res: Response) {
  throw Exception.for('Not implemented');
};