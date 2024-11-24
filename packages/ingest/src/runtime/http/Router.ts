//stackpress
import BaseRouter from '@stackpress/types/dist/Router';
//common
import type { IM, SR } from '../../types';
import type Request from '../../Request';
import type Response from '../../Response';

export default class Router<C = unknown> 
  extends BaseRouter<Request<IM, C>, Response<SR>> 
{}