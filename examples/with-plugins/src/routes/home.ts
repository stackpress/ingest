import { route } from '@stackpress/ingest';

export default route(async function HomePage(req, res) { 
  const project = req.context.plugin<{ welcome: string }>('project');
  res.setHTML(project.welcome);
});