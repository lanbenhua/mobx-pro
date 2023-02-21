/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { action, observable } from 'mobx';

declare abstract class LoadingProviderAbstract {
  abstract getLoading(key: string): boolean | undefined;
  abstract setLoading(key: string, loading?: boolean): void;
}

class LoadingProvider {
  @observable protected __loadingMap: Map<string, boolean> = new Map<
    string,
    boolean
  >();

  constructor() {
    this.getLoading = this.getLoading.bind(this);
    this.setLoading = this.setLoading.bind(this);
  }

  public getLoading(key: string): boolean | undefined {
    return this.__loadingMap.get(key);
  }

  @action.bound public setLoading(key: string, loading?: boolean) {
    if (loading === undefined) return this.__loadingMap.delete(key), void 0;
    this.__loadingMap.set(key, loading);
  }
}

function injectLoadingProvider<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  class A extends constructor implements LoadingProviderAbstract {
    @observable protected __loadingMap: Map<string, boolean> = new Map();

    public getLoading(key: string): boolean | undefined {
      return this.__loadingMap.get(key);
    }

    @action.bound public setLoading(key: string, loading?: boolean) {
      if (loading === undefined) return this.__loadingMap.delete(key), void 0;
      this.__loadingMap.set(key, loading);
    }
  }
  return A;
}

function loading(key: string) {
  // @ts-ignore
  return function (target: any, proporty: any, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    // or throw an error
    if (typeof original !== 'function')
      throw Error(`${original} is not a function, but ${typeof original}`);

    descriptor.value = function () {
      // @ts-ignore
      if (!this.__loadingMap || !this.__loadingMap instanceof Map)
        return original.apply(this, arguments);
      // @ts-ignore
      if (!this.setLoading || typeof this.setLoading !== 'function')
        return original.apply(this, arguments);

      if (!(this instanceof LoadingProvider))
        return original.apply(this, arguments);

      const setLoading: (
        key: string,
        loading?: boolean
      ) => // @ts-ignore
      void = this.setLoading.bind(this);

      setLoading(key, true);
      try {
        const res = original.apply(this, arguments);
        Promise.resolve(res).finally(() => {
          setLoading(key, false);
        });
        return res;
      } catch (e) {
        setLoading(key, false);
        throw e;
      }
    };
  };
}

export {
  LoadingProvider,
  LoadingProviderAbstract,
  injectLoadingProvider,
  loading,
};
