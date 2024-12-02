import { ServerRequest, Response } from '@stackpress/ingest';

export default async function HomePage(req: ServerRequest, res: Response) { 
  const project = req.context.plugin<{ welcome: string }>('project');
  res.setHTML(project.welcome);
};