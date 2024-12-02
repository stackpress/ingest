import { Exception } from '@stackpress/ingest';
import { router } from '@stackpress/ingest/fetch';

const route = router();

/**
 * Error handlers
 */
route.get('/catch', function ErrorResponse(req, res) {
  try {
    throw Exception.for('Not implemented');
  } catch (e) {
    const error = e as Exception;
    res.setError({ 
      code: error.code, 
      error: error.message,
      stack: error.trace()
    });
  }
});

/**
 * Error handlers
 */
route.get('/error', function ErrorResponse(req, res) {
  throw Exception.for('Not implemented');
});

/**
 * 404 handler
 */
route.get('/**', function NotFound(req, res) {
  if (!res.code && !res.status && !res.sent) {
    //send the response
    res.setHTML('Not Found');
  }
});

route.on('error', function Error(req, res) {
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
});

export default route;