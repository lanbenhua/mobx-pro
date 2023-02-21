/* eslint-disable @typescript-eslint/no-explicit-any */
import { observable, action } from 'mobx';

abstract class ModalAbstract<T> {
  @observable public ids: T[] = [];

  private _deferQueue: [(value: any) => void, (reason?: any) => void][] = [];

  @action.bound public open<TData = any>(key: T) {
    if (this.ids.includes(key)) return Promise.resolve(undefined);
    this.ids.push(key);
    return new Promise<TData | undefined>((resolve, reject) => {
      this._deferQueue.push([resolve, reject]);
    });
  }

  @action.bound
  public resolve<TData = any>(value?: TData) {
    // console.log(`ModalAbstract.resolve value=%o, this.ids=%o`, value, this.ids);
    if (this.ids.length === 0) return;
    const [resolve] = this._deferQueue.pop() ?? [];
    resolve?.(value);
  }

  @action.bound
  public reject<TData = any>(value?: TData) {
    // console.log(`ModalAbstract.reject value=%o, this.ids=%o`, value, this.ids);
    if (this.ids.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, reject] = this._deferQueue.pop() ?? [];
    reject?.(value);
  }

  @action.bound
  public close<TData = any>(value?: TData) {
    // console.log(`ModalAbstract.close value=%o, this.ids=%o`, value, this.ids);
    if (this.ids.length === 0) return;
    this.ids.pop();
    const executor = this._deferQueue.pop();
    executor?.[0]?.(value);
  }

  @action.bound
  public closeAndReject<TData = any>(value?: TData) {
    // console.log(
    //   `ModalAbstract.closeAndReject value=%o, this.ids=%o`,
    //   value,
    //   this.ids
    // );
    if (this.ids.length === 0) return;
    this.ids.pop();
    const executor = this._deferQueue.pop();
    executor?.[1]?.(value);
  }

  @action.bound public closeAll() {
    // console.log(`ModalAbstract.closeAll this.ids=%o`, this.ids);
    if (this.ids.length === 0) return;
    this.ids = [];
  }

  public abstract resetGlobalVar(): void;
}

export default ModalAbstract;
