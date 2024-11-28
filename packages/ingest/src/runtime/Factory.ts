//stackpress
import type { UnknownNest } from '@stackpress/types';
//common
import type { PluginLoaderOptions } from '../types';
import FactoryBase from '../Factory';

export default class Factory<C extends UnknownNest = UnknownNest> 
  extends FactoryBase<C>
{
  /**
   * Loads the plugins and returns the factory
   */
  public static async bootstrap<
    C extends UnknownNest = UnknownNest
  >(options: PluginLoaderOptions = {}) {
    const factory = new Factory<C>(options);
    return await factory.bootstrap();
  }
}