import LibRequest from '@stackpress/lib/Request';
//Any: Type unknown is not assignable to type IncomingMessage
export default class Request<R = any> extends LibRequest<R> {}