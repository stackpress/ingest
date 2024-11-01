import type { FetchPayload } from './types';

import BaseRouter from '@stackpress/types/dist/Router';

export default class Router extends BaseRouter<FetchPayload[0], FetchPayload[1]> {}