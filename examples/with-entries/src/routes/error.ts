import { ServerRequest, Response } from '@stackpress/ingest';
import Error from '../error';

export default function ErrorResponse(req: ServerRequest, res: Response) {
  Error('Not implemented');
};