//stackpress
import type { UnknownNest } from '@stackpress/types';
//common
import type { PluginLoaderOptions } from '../types';
import FactoryBase from '../Factory';

export function bootstrap<
  C extends UnknownNest = UnknownNest
>(options: PluginLoaderOptions = {}) {
  return RuntimeFactory.bootstrap<C>(options);
}

export function runtime<
  C extends UnknownNest = UnknownNest
>(options: PluginLoaderOptions = {}) {
  return new RuntimeFactory<C>(options);
}

export default class RuntimeFactory<C extends UnknownNest = UnknownNest> 
  extends FactoryBase<C>
{
  /**
   * Loads the plugins and returns the factory
   */
  public static async bootstrap<
    C extends UnknownNest = UnknownNest
  >(options: PluginLoaderOptions = {}) {
    const factory = new RuntimeFactory<C>(options);
    return await factory.bootstrap();
  }
}