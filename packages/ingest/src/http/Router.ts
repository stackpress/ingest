import type { HTTPPayload } from './types';

import BaseRouter from '@stackpress/types/dist/Router';

export default class Router extends BaseRouter<HTTPPayload[0], HTTPPayload[1]> {}