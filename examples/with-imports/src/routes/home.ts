import { action } from '@stackpress/ingest';

export default action(async function HomePage({ res, ctx }) { 
  const project = ctx.plugin<{ welcome: string }>('project');
  res.setHTML(project.welcome);
});
