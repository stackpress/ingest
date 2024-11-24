//stackpress
import BaseRouter from '@stackpress/types/dist/Router';
//common
import type { FetchRequest } from '../../types';
import type Request from '../../Request';
import type Response from '../../Response';

export default class Router<C = unknown> 
  extends BaseRouter<Request<FetchRequest, C>, Response<undefined>> 
{}