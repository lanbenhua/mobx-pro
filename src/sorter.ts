import { action, observable } from 'mobx';

type IOrder = 'desc' | 'asc' | 'DESC' | 'ASC';
type ISortOrder = 'descend' | 'ascend';

class SortOrder {
  public static decode(order?: IOrder): ISortOrder | undefined {
    const orderMap: Record<IOrder, ISortOrder> = {
      asc: 'ascend',
      ASC: 'ascend',
      desc: 'descend',
      DESC: 'descend',
    };
    return order ? orderMap[order] : undefined;
  }

  public static encode(
    order?: ISortOrder,
    capital?: boolean
  ): IOrder | undefined {
    const orderMap: Record<ISortOrder, IOrder> = {
      ascend: capital ? 'ASC' : 'asc',
      descend: capital ? 'DESC' : 'desc',
    };
    return order ? orderMap[order] : undefined;
  }
}

interface SorterConfig {
  multiple?: boolean;
}

class Sorter<K extends string = string> {
  @observable public sorterMap?: Map<K, ISortOrder | undefined>;

  public config?: SorterConfig = {
    multiple: false,
  };

  constructor(
    init?: Partial<Record<K, ISortOrder | undefined>>,
    config?: SorterConfig
  ) {
    this.config = { ...this.config, ...config };
    if (init)
      Object.entries<ISortOrder | undefined>(init).forEach(([k, v]) => {
        this.setSorter(k as K, v);
      });
  }

  @action.bound setSorter(columnKey: K, order: ISortOrder | undefined) {
    if (!this.sorterMap) this.sorterMap = new Map<K, ISortOrder | undefined>();

    // If single mode, we should clear all sorter data, then set the current one
    // If multile mode, just update the current one
    if (!this.config?.multiple) this.sorterMap.clear();

    this.sorterMap.set(columnKey, order);
  }

  public getSorter(columnKey: K): ISortOrder | undefined {
    return this.sorterMap?.get(columnKey);
  }

  public getAllSorter():
    | { columnKey: string; order?: ISortOrder }[]
    | undefined {
    const s: { columnKey: string; order?: ISortOrder }[] = [];
    this.sorterMap?.forEach((v, k) => {
      s.push({ columnKey: k, order: v });
    });
    return s.length > 0 ? s : undefined;
  }

  public reset(init?: Partial<Record<K, ISortOrder | undefined>>) {
    this.sorterMap?.clear();

    if (init)
      Object.entries<ISortOrder | undefined>(init).forEach(([k, v]) => {
        this.setSorter(k as K, v);
      });
  }
}

export { IOrder, ISortOrder, SortOrder };
export default Sorter;
