//stackpress
import type { UnknownNest } from '@stackpress/types';
//common
import FactoryBase from '../Factory';

export default class Factory<C extends UnknownNest = UnknownNest> 
  extends FactoryBase<C>
{}