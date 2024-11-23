//stackpress
import BaseRouter from '@stackpress/types/dist/Router';
//local
import type { HTTPPayload } from './types';

export default class Router extends BaseRouter<HTTPPayload[0], HTTPPayload[1]> {}