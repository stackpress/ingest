import { server } from "@stackpress/ingest/fetch";
import pages from "../routes/pages";
import user from "../routes/user";
import tests from "../routes/tests";
import hooks from "../routes/hooks";

export async function handler(event: any, context: any) {
  const app = server();
  await app.bootstrap();

  app.use(pages).use(user).use(hooks).use(tests);

  const request = new Request(event.rawUrl, {
    method: event.httpMethod,
    headers: event.headers,
  });

  const response = await app.handle(request, undefined);

  return {
    statusCode: response?.status,
    headers: response?.headers
      ? Object.fromEntries(response.headers.entries())
      : {},
    body: await response?.text(),
    isBase64Encoded: false,
  };
}
