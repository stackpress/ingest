import { ServerRequest, Response } from '@stackpress/ingest';

export default function Error(req: ServerRequest, res: Response) {
  const event = res.event;
  const html = [ `<h1>${res.error}</h1>` ];
  if (event) {
    const name = event.action.name || '&lt;anonymous&gt;';
    const args = JSON.stringify(req.data(), null, 2);
    html.push(`<pre>on('${event.event}', ${name}(${args}));</pre>`);
  }
  
  const stack = res.stack?.map((log, i) => {
    const { file, line, char } = log;
    const method = log.method
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `#${i + 1} ${method} - ${file}:${line}:${char}`;
  }) || [];
  html.push(`<pre>${stack.join('<br><br>')}</pre>`);

  res.setHTML(html.join('<br>'));
}