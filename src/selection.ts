import { action, computed, observable } from 'mobx';

type RowKey<T extends object = object> =
  | keyof T
  | ((row: T) => string | number);
type ISelection<T extends object = object> = {
  selectAll?: boolean;
  excludedRows?: T[];
  selectedRows?: T[];
};

class Selection<T extends object = object> {
  @observable public selectAll?: boolean;
  @observable public excludedRows?: T[];
  @observable public selectedRows?: T[];

  @computed public get selection(): ISelection<T> {
    return {
      selectAll: this.selectAll,
      excludedRows: this.excludedRows,
      selectedRows: this.selectedRows,
    };
  }

  public rowKey: RowKey<T>;

  constructor(rowKey: RowKey<T>, selection?: ISelection<T>) {
    this.rowKey = rowKey;

    this.getRowKey = this.getRowKey.bind(this);

    this.setSelection(selection);
  }

  protected getRowKey(row: T): string | number {
    if (typeof this.rowKey === 'function') return this.rowKey(row);
    return row[this.rowKey] as unknown as string | number;
  }

  public getSelectedNum(total?: number): number {
    if (this.selectAll)
      return Math.max((total ?? 0) - (this.excludedRows?.length ?? 0), 0);
    return this.selectedRows?.length ?? 0;
  }

  public getSelectedRowKeys(list?: T[]) {
    if (this.selectAll)
      return list
        ?.filter(
          (row) =>
            !this.excludedRows?.find(
              (row2) => this.getRowKey(row2) === this.getRowKey(row)
            )
        )
        .map(this.getRowKey);
    return this.selectedRows?.map(this.getRowKey);
  }

  public getSelectedRows(list?: T[]) {
    if (this.selectAll)
      return list?.filter(
        (row) =>
          !this.excludedRows?.find(
            (row2) => this.getRowKey(row2) === this.getRowKey(row)
          )
      );
    return this.selectedRows;
  }

  @action.bound
  public resetSelection() {
    this.selectAll = false;
    this.selectedRows = undefined;
    this.excludedRows = undefined;
  }

  @action.bound
  public setSelection(selection?: ISelection<T>) {
    this.selectAll = selection?.selectAll;
    this.selectedRows = selection?.selectedRows;
    this.excludedRows = selection?.excludedRows;
  }

  @action.bound
  public setAll(selected: boolean) {
    this.selectAll = selected;
  }

  @action.bound
  public setRows(selected: boolean, rows: T[]) {
    const getRows = (selected: boolean, currentRows: T[], rows: T[]) =>
      selected
        ? currentRows.concat(...rows)
        : currentRows.filter(
            (row) =>
              !rows.find((row2) => this.getRowKey(row2) === this.getRowKey(row))
          );

    this.selectedRows = getRows(selected, this.selectedRows ?? [], rows);
    this.excludedRows = getRows(!selected, this.excludedRows ?? [], rows);
  }
}

export { ISelection };
export default Selection;
