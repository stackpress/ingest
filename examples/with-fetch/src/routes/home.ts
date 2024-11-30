import { Context, Response } from '@stackpress/ingest';

import bootstrap from '../client';

export default async function HomePage(req: Context, res: Response) { 
  const client = await bootstrap(req, res);
  const project = client.plugin<{ welcome: string }>('project');
  res.setHTML(project.welcome);
};