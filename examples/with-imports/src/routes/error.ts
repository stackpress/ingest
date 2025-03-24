import { Request, Response } from '@stackpress/ingest';
import Error from '../error';

export default function ErrorResponse(req: Request, res: Response) {
  Error('Not implemented');
};