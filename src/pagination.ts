import { action, observable } from 'mobx';

interface PaginationConfig {
  pageSize?: number;
  current?: number;
  total?: number;
}

const defaultPagination = {
  pageSize: 10,
  current: 0,
  total: 0,
};

class Pagination {
  private _initPagination: PaginationConfig = defaultPagination;
  @observable public pagination: PaginationConfig = defaultPagination;

  // use when changing pager
  @observable public pager: { current?: number; pageSize?: number } = {
    pageSize: 10,
    current: 1,
  };

  constructor(pagination?: PaginationConfig) {
    const p = { ...defaultPagination, ...pagination };
    this.setPagination(p);
    this._initPagination = p;
  }

  @action.bound public setCurrent(current?: number) {
    this.pagination = { ...this.pagination, current };
  }

  @action.bound public setSize(size?: number) {
    this.pagination = { ...this.pagination, pageSize: size };
  }

  @action.bound public setTotal(total?: number) {
    this.pagination = { ...this.pagination, total };
  }

  @action.bound public setPagination(pagination?: PaginationConfig) {
    this.pagination = { ...this.pagination, ...pagination };
  }

  @action.bound public setPager(current = 1, pageSize = 10) {
    this.pager = { current, pageSize };
  }

  @action.bound public resetPager() {
    this.pager = { current: 1, pageSize: 10 };
  }

  @action.bound public resetPagination() {
    this.pagination = this._initPagination;
  }

  @action.bound public reset() {
    this.resetPager();
    this.resetPagination();
  }
}

export default Pagination;
