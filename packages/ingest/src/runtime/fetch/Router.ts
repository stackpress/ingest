//stackpress
import BaseRouter from '@stackpress/types/dist/Router';
//local
import type { FetchPayload } from './types';

export default class Router extends BaseRouter<FetchPayload[0], FetchPayload[1]> {}