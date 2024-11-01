import type { IM, SR } from '../http/types';

import BaseRouter from '@stackpress/types/dist/Router';

/**
 * Event driven routing system using Node HTTP Request and Response
 */
export default class Router extends BaseRouter<IM, SR> {};