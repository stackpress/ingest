import { Context, Response } from '@stackpress/ingest';

export default async function SSE(req: Context, res: Response) {
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
};