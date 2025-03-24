import LibResponse from '@stackpress/lib/Response';
//Any: Type unknown is not assignable to type ServerResponse
export default class Response<S = any> extends LibResponse<S> {}