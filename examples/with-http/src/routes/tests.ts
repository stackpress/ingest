import fs from 'fs';
import path from 'path';

import { router } from '@stackpress/ingest/http';

const template = `
<!DOCTYPE html>
<html>
  <head>
    <title>SSE</title>
  </head>
  <body>
    <ul></ul>
    <script>
      const ul = document.querySelector('ul');
      const evtSource = new EventSource('/__sse__');
      evtSource.onmessage = (event) => {
        const li = document.createElement('li');
        li.textContent = event.data;
        ul.appendChild(li);
      };
    </script>
  </body>
</html>
`;

const route = router();

/**
 * Redirect test
 */
route.get('/redirect', function Redirect(req, res) {
  res.redirect('/user');
});

/**
 * Static file test
 */
route.get('/icon.png', function Icon(req, res) {
  if (res.code || res.status || res.body) return; 
  const file = path.resolve(process.cwd(), 'icon.png'); 
  if (fs.existsSync(file)) {
    res.setBody('image/png', fs.createReadStream(file));
  }
});

/**
 * Stream template for SSE test
 */
route.get('/stream', function Stream(req, res) {
  //send the response
  res.setHTML(template.trim());
});

/**
 * SSE test
 */
route.get('/__sse__', function SSE(req, res) {
  res.headers
    .set('Cache-Control', 'no-cache')
    .set('Content-Encoding', 'none')
    .set('Connection', 'keep-alive')
    .set('Access-Control-Allow-Origin', '*');

  let timerId: any;
  const msg = new TextEncoder().encode("data: hello\r\n\r\n");
  res.setBody('text/event-stream', new ReadableStream({
    start(controller) {
      timerId = setInterval(() => {
        controller.enqueue(msg);
      }, 2500);
    },
    cancel() {
      if (typeof timerId === 'number') {
        clearInterval(timerId);
      }
    },
  }));
});

export default route;