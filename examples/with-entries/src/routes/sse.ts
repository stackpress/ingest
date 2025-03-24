import { action } from '@stackpress/ingest';

export default action(async function SSE(req, res) {
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