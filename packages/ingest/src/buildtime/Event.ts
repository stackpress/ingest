//framework
import type { ActionFile } from '../framework/types';
import FrameworkEvent from '../framework/Event';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';

export default class Event 
  extends FrameworkEvent<ActionFile, Request, Response> 
{
}