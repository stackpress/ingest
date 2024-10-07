//framework
import FrameworkRoute from '../../framework/Route';
//gateway
import type { IM, SR, GatewayAction } from './types';

export default class Route extends FrameworkRoute<GatewayAction, IM, SR> {}