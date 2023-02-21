import { action, computed, observable } from 'mobx';
import {
  rule,
  Rule,
  trigger,
  TriggerCondition,
  validate,
  Validation,
} from './validation';

export interface IEditableTableColumnType<T> {
  key: string;
  value?: T;
  editing?: boolean;
  errors?: string[];
  triggerCondition?: TriggerCondition;
  rules?: Rule[];
}
export interface IEditableTableRowType<T> {
  rowIndex: number;
  editing?: boolean;
  value?: Partial<T>;
  columns?: IEditableTableColumnType<T[keyof T]>[];
}
export interface IEditableTableType<T> {
  rows?: IEditableTableRowType<T>[];
}

export class EditableTableColumn<T> extends Validation {
  private _validateKey = '_draftD';
  private _isPrepared?: boolean = false;
  private _columnKey: string;
  @observable private _d: T | undefined;
  @observable private _draftD: T | undefined;
  @observable public editing?: boolean = false;
  @observable public errors?: string[];
  @observable public triggerCondition?: TriggerCondition;
  @observable public rules?: Rule[];
  @computed public get d() {
    return this._d;
  }
  @computed public get data(): IEditableTableColumnType<T> {
    return {
      key: this._columnKey,
      value: this._d,
      editing: this.editing,
      errors: this.errors,
      triggerCondition: this.triggerCondition,
      rules: this.rules,
    };
  }
  @computed public get value(): T | undefined {
    return this._d;
  }
  @computed public get draftValue(): T | undefined {
    return this._draftD;
  }
  @computed public get verror() {
    return this.unsafe_getFieldErrorString(this._validateKey);
  }
  @computed public get verrors() {
    return this.unsafe_getFieldErrors(this._validateKey);
  }
  public get columnKey() {
    return this._columnKey;
  }
  public get isPrepared() {
    return this._isPrepared;
  }

  public setIsPrepared(isPrepared = true) {
    this._isPrepared = isPrepared;
  }

  @action.bound public setEditing(editing?: boolean) {
    this.editing = editing;
  }

  @action.bound public setColumnValue(d?: T) {
    this._d = d;
  }

  @action.bound
  @validate('_draftD')
  public setColumnDraftValue(d?: T) {
    this._draftD = d;
  }

  constructor(
    columnKey: string,
    initialData?: Partial<IEditableTableColumnType<T>>
  ) {
    super();
    this._columnKey = columnKey;
    this.initColumn(initialData);
  }

  @action.bound public initColumn(
    initialData?: Partial<IEditableTableColumnType<T>>
  ) {
    this.resetColumn();
    this._d = initialData?.value;
    this._draftD = initialData?.value;
    this.unsafe_setFieldValue(this._validateKey, initialData?.value);
    this.setEditing(initialData?.editing ?? true);
    this.setTriggerCondition(initialData?.triggerCondition);
    this.setRules(initialData?.rules);
    this.setErrors(initialData?.errors);
  }

  @action.bound public resetColumn() {
    this._d = undefined;
    this._draftD = undefined;
    this.editing = false;
    this.errors = undefined;
    this.rules = undefined;
    this.triggerCondition = undefined;
  }

  @action.bound public editColumn() {
    this._draftD = this._d;
    this.setEditing(true);
  }

  @action.bound public saveColumn() {
    this._d = this._draftD;
    this.restoreColumn();
  }

  @action.bound public restoreColumn() {
    this._draftD = undefined;
    this.setEditing(false);
    this.unsafe_setFieldErrors(this._validateKey, undefined);
  }

  public async validateColumn(): Promise<T | undefined> {
    try {
      const values = this.draftValue;
      await this.unsafe_validate();
      return values;
    } catch (e) {
      const errors = (e as Map<string, string[]>)?.get(this._validateKey);
      throw errors;
    }
  }

  @action.bound public setErrors(errors?: string[]) {
    this.errors = errors;
  }
  @action.bound public setRules(rules?: Rule[]) {
    this.rules = rules;
    rule(...(rules ?? []))(this, this._validateKey);
    this.unsafe_setField(this._validateKey, {
      ...this.unsafe_getField(this._validateKey),
      path: this._validateKey,
      rules,
    });
  }
  @action.bound public setTriggerCondition(
    triggerCondition?: TriggerCondition
  ) {
    this.triggerCondition = triggerCondition;
    trigger(triggerCondition)(this, this._validateKey);
    const pre = this.unsafe_getField(this._validateKey);
    this.unsafe_setField(this._validateKey, {
      ...pre,
      path: this._validateKey,
      options: {
        ...pre?.options,
        triggerCondition,
      },
    });
  }
}

export class EditableTableRow<T extends object = object> {
  private _rowIdx: number;
  @observable private _d: Map<string, EditableTableColumn<T[keyof T]>> =
    new Map();
  @observable public editing?: boolean = false;
  @computed public get d() {
    return this._d;
  }
  @computed public get columns() {
    return Array.from(this._d).map(([_, item]) => {
      return item;
    });
  }
  @computed public get data(): IEditableTableRowType<T> {
    return {
      rowIndex: this._rowIdx,
      editing: this.editing,
      columns: this.columns.map((column) => column.data),
      value: this.value,
    };
  }
  @computed public get value(): Partial<T> {
    return this.columns.reduce<Partial<T>>((o, column) => {
      // @ts-ignore
      o[column.key] = column.value;
      return o;
    }, {} as T);
  }
  @computed public get draftValue(): Partial<T> {
    return Array.from(this._d.values()).reduce<Partial<T>>((o, column) => {
      // @ts-ignore
      o[column.columnKey] = column.draftValue;
      return o;
    }, {} as T);
  }

  public get rowIndex() {
    return this._rowIdx;
  }

  @action.bound public setEditing(editing?: boolean) {
    this.editing = editing;
  }

  constructor(rowIdx: number, initialData?: Partial<IEditableTableRowType<T>>) {
    this._rowIdx = rowIdx;
    this.initRow(initialData);
  }

  @action.bound public resetRow() {
    this._d.clear();
    this.editing = false;
  }

  @action.bound public initRow(
    initialData?: Partial<IEditableTableRowType<T>>
  ) {
    this.resetRow();
    this.setEditing(initialData?.editing ?? true);
    this.addColumns(initialData?.columns);
  }

  @action.bound public editRow() {
    this.setEditing(true);
    this._d.forEach((column) => column.editColumn());
  }

  @action.bound public saveRow() {
    this.setEditing(false);
    this._d.forEach((column) => column.saveColumn());
  }

  @action.bound public restoreRow() {
    this.setEditing(false);
    this._d.forEach((column) => column.restoreColumn());
  }

  public async validateRow(): Promise<Partial<T> | undefined> {
    const values = this.draftValue;
    const errors = new Map<string, string[]>();
    const columnKeys: string[] = [];
    const res = await Promise.allSettled(
      Array.from(this._d.values()).map((column) => {
        columnKeys.push(column.columnKey);
        return column.validateColumn();
      })
    );
    res.forEach((result, index) => {
      const { status } = result;
      if (status === 'rejected') {
        const reason = result.reason;
        const columnKey = columnKeys[index];
        errors.set(columnKey, reason);
      }
    });
    if (errors.size > 0) throw errors;
    return values;
  }

  @action.bound public prepareColumn(
    columnKey: string,
    d?: Partial<IEditableTableColumnType<T[keyof T]>>
  ) {
    const column =
      this._d.get(columnKey) ?? new EditableTableColumn(columnKey, d);

    if (column.isPrepared) return column;
    column.setIsPrepared(true);
    column.initColumn({ ...column.data, ...d });
    this._d.set(columnKey, column);

    return column;
  }

  @action.bound public addColumns(
    columns?: IEditableTableColumnType<T[keyof T]>[]
  ) {
    columns?.forEach((column) => this.addColumn(column));
  }

  @action.bound public addColumn(d: IEditableTableColumnType<T[keyof T]>) {
    this._d.set(d.key, new EditableTableColumn(d.key, d));
  }

  @action.bound public getColumn<ValueType extends T[keyof T]>(
    columnKey: string
  ): EditableTableColumn<ValueType | T[keyof T]> | undefined {
    return this._d.get(columnKey);
  }

  @action.bound public getColumns(): EditableTableColumn<T[keyof T]>[] {
    return Array.from(this._d.values());
  }
}

export class EditableTable<T extends object = object> {
  protected _rowIdx = 0;
  @observable private _d: Map<number, EditableTableRow<T>> = new Map();
  @computed public get size(): number {
    return this._d.size;
  }
  @computed public get d() {
    return this._d;
  }
  @computed public get rows(): EditableTableRow<T>[] {
    return Array.from(this._d).map(([_, item]) => item);
  }
  @computed public get data(): IEditableTableType<T> {
    return { rows: Array.from(this._d).map(([_, item]) => item.data) };
  }
  @computed public get value(): Partial<T>[] | undefined {
    return Array.from(this._d).map(([_, item]) => item.value);
  }
  @computed public get draftValue(): Partial<T>[] | undefined {
    return Array.from(this._d).map(([_, item]) => item.draftValue);
  }

  @action.bound public resetRowIndex() {
    this._rowIdx = 0;
  }

  constructor(initialData?: IEditableTableType<T>) {
    this.initTable(initialData);
  }

  @action.bound public resetTable() {
    this.resetRowIndex();
    this._d.clear();
  }

  @action.bound public initTable(initialData?: IEditableTableType<T>) {
    this.resetTable();
    this.addRows(initialData?.rows);
  }

  @action.bound public restoreTable() {
    this.d.forEach((row) => row.restoreRow());
  }

  public async validateTable(): Promise<
    (Partial<T> | undefined)[] | undefined
  > {
    const values = this.draftValue;
    const errors = new Map<number, Map<string, string[]>>();
    const rowKeys: number[] = [];
    const res = await Promise.allSettled(
      Array.from(this._d.values()).map((row) => {
        rowKeys.push(row.rowIndex);
        return row.validateRow();
      })
    );
    res.forEach((result, index) => {
      const { status } = result;
      if (status === 'rejected') {
        const reason = result.reason;
        const rowKey = rowKeys[index];
        errors.set(rowKey, reason);
      }
    });
    if (errors.size > 0) throw errors;
    return values;
  }

  @action.bound addRows(rows?: Omit<IEditableTableRowType<T>, 'rowIndex'>[]) {
    rows?.forEach((row) => this.addRow(row));
  }

  @action.bound public addRow(d?: Partial<IEditableTableRowType<T>>) {
    this._d.set(this._rowIdx, new EditableTableRow(this._rowIdx, d));
    this._rowIdx++;
  }

  @action.bound public removeRow(rowIndx: number) {
    this._d.delete(rowIndx);
  }

  @action.bound public getRow(rowIndx: number) {
    return this._d.get(rowIndx);
  }

  @action.bound public getRows() {
    return Array.from(this._d.values());
  }
}

export default EditableTable;
