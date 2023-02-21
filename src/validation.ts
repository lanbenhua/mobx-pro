/* eslint-disable @typescript-eslint/no-explicit-any */
import { observable, action } from 'mobx';

import 'reflect-metadata';

enum TriggerCondition {
  Change = 'change',
  Emit = 'emit',
}
type ValidationOptions = {
  validateFirstOnly?: boolean;
  triggerCondition?: TriggerCondition;
};
type ValidateError = string | null | undefined;
type Rule = (
  path: string,
  value: any,
  instance: Validation
) => ValidateError | Promise<ValidateError>;
type Rules = Rule[];
type ValidateResult = {
  path: string;
  rules?: Rules | null;
  options?: ValidationOptions;
  value?: any;
  validating?: boolean;
  errors?: ValidateError[];
};

export const DecoratorKey = {
  Keys: Symbol('$$keys'),
  Rules: Symbol('$$rules'),
  Results: Symbol('$$results'),
  TriggerCondition: Symbol('$$triggerCondition'),
  OnlyFirst: Symbol('$$onlyFirst'),
};

class Validation {
  @observable protected __unsafe_resultMap = new Map<string, ValidateResult>();

  constructor(
    initialValues?: { path: string; value: unknown }[] | Record<string, unknown>
  ) {
    const keys: string[] | undefined = Reflect.getMetadata(
      DecoratorKey.Keys,
      this
    );
    keys?.forEach((key) => this.__unsafe_initField(key));
    if (initialValues) this.unsafe_setFieldsValue(initialValues);
  }

  private __unsafe_initField(path: string) {
    const rules = this.__unsafe_getFieldRules(path);
    const onlyFirst = this.__unsafe_getFieldValidateOnlyFirst(path);
    const triggerCondition =
      this.__unsafe_getFieldValidateTriggerCondition(path);
    this.unsafe_setField(path, {
      path,
      rules,
      errors: undefined,
      value: undefined,
      validating: undefined,
      options: {
        validateFirstOnly: onlyFirst,
        triggerCondition,
      },
    });
  }
  private __unsafe_getFieldRules(path: string): Rules | null | undefined {
    const rules: Rules | null | undefined = Reflect.getMetadata(
      DecoratorKey.Rules,
      this,
      path
    );
    return rules;
  }
  private __unsafe_getFieldValidateOnlyFirst(
    path: string
  ): boolean | undefined {
    const onlyFirst: boolean | undefined = Reflect.getMetadata(
      DecoratorKey.OnlyFirst,
      this,
      path
    );
    return onlyFirst;
  }
  private __unsafe_getFieldValidateTriggerCondition(
    path: string
  ): TriggerCondition | undefined {
    const triggerCondition: TriggerCondition | undefined =
      Reflect.getMetadata(DecoratorKey.TriggerCondition, this, path) ??
      TriggerCondition.Change;
    return triggerCondition;
  }

  @action.bound
  private __unsafe_setFieldValidating(path: string, validating: boolean) {
    this.unsafe_setField(path, {
      ...this.unsafe_getField(path),
      path,
      validating,
    });
  }

  @action.bound
  private __unsafe_setFieldsValidating(
    values?: { path: string; validating: boolean }[] | Record<string, boolean>
  ) {
    if (Array.isArray(values))
      return values?.forEach((item) =>
        this.__unsafe_setFieldValidating(item.path, item.validating)
      );

    if (values)
      Object.entries(values).forEach(([key, value]) => {
        this.__unsafe_setFieldValidating(key, value);
      });
  }

  public unsafe_getFieldValue(path: string): unknown | undefined {
    return this.__unsafe_resultMap.get(path)?.value;
  }

  public unsafe_getFieldsValue(paths?: string[]): (unknown | undefined)[] {
    if (!paths)
      return Array.from(this.__unsafe_resultMap.values()).map(
        (item) => item.value
      );
    return paths.map((path) => this.unsafe_getFieldValue(path));
  }

  @action.bound
  public unsafe_setFieldValue(path: string, value: unknown) {
    this.unsafe_setField(path, {
      ...this.unsafe_getField(path),
      path,
      value,
    });
  }

  @action.bound
  public unsafe_setFieldsValue(
    values: { path: string; value: unknown }[] | Record<string, unknown>
  ) {
    if (Array.isArray(values))
      return values?.forEach((item) =>
        this.unsafe_setFieldValue(item.path, item.value)
      );
    if (values)
      Object.entries(values).forEach(([key, value]) => {
        this.unsafe_setFieldValue(key, value);
      });
  }

  public unsafe_getField(path: string): ValidateResult | undefined {
    return this.__unsafe_resultMap.get(path);
  }

  @action.bound
  public unsafe_setField(path: string, result: ValidateResult) {
    this.__unsafe_resultMap.set(path, result);
  }

  public unsafe_getFields(paths?: string[]): (ValidateResult | undefined)[] {
    if (!paths) return Array.from(this.__unsafe_resultMap.values());
    return paths.map((path) => this.unsafe_getField(path));
  }

  @action.bound
  public unsafe_setFields(
    values:
      | { path: string; result: ValidateResult }[]
      | Record<string, ValidateResult>
  ) {
    if (Array.isArray(values))
      return values?.forEach((item) =>
        this.unsafe_setField(item.path, item.result)
      );
    if (values)
      Object.entries(values).forEach(([key, value]) => {
        this.unsafe_setField(key, value);
      });
  }

  public unsafe_getFieldErrors(path: string): ValidateError[] | undefined {
    return this.__unsafe_resultMap.get(path)?.errors?.filter(Boolean);
  }

  @action.bound
  public unsafe_setFieldErrors(path: string, errors?: ValidateError[]) {
    this.unsafe_setField(path, {
      ...this.unsafe_getField(path),
      path,
      errors,
    });
  }

  public unsafe_getFieldErrorString(path: string): ValidateError {
    return this.__unsafe_resultMap.get(path)?.errors?.filter(Boolean)?.[0];
  }

  public unsafe_getFieldsErrors(
    paths?: string[]
  ): (ValidateError[] | undefined)[] {
    if (!paths)
      return Array.from(this.__unsafe_resultMap.values()).map(
        (item) => item.errors
      );
    return paths.map((path) => this.unsafe_getFieldErrors(path));
  }

  @action.bound
  public unsafe_setFieldsErrors(
    values:
      | { path: string; errors?: ValidateError[] }[]
      | Record<string, ValidateError[] | undefined>
  ) {
    if (Array.isArray(values))
      return values?.forEach((item) =>
        this.unsafe_setFieldErrors(item.path, item.errors)
      );
    if (values)
      Object.entries(values).forEach(([key, value]) => {
        this.unsafe_setFieldErrors(key, value);
      });
  }

  public unsafe_getFieldsErrorString(paths?: string[]): ValidateError[] {
    if (!paths)
      return Array.from(this.__unsafe_resultMap.values()).map(
        (item) => item.errors?.[0]
      );
    return paths.map((path) => this.unsafe_getFieldErrorString(path));
  }

  @action.bound
  public unsafe_reset(paths?: string[]) {
    const keys: string[] | undefined = Reflect.getMetadata(
      DecoratorKey.Keys,
      this
    );
    const names = paths ?? keys;
    names?.forEach((name) => {
      const pre = this.unsafe_getField(name);
      this.unsafe_setField(name, {
        ...pre,
        path: pre?.path ?? name,
        errors: undefined,
        validating: false,
        value: undefined,
      });
    });
  }

  @action.bound
  public async unsafe_validate(
    fn?: (
      err: Map<string, string[]> | null | undefined,
      values: Record<string, any>
    ) => void,
    paths?: string[]
  ) {
    const keys: string[] | undefined = Reflect.getMetadata(
      DecoratorKey.Keys,
      this
    );
    const names = paths ?? keys ?? [];
    this.__unsafe_setFieldsValidating(
      names?.map((name) => ({ path: name, validating: true }))
    );

    const errors = new Map<string, string[]>();
    const values: Record<string, any> = {};

    const res = await Promise.all(
      names.map((name) => {
        const field = this.unsafe_getField(name);
        const path = field?.path ?? name;
        return makeValidationResult({ ...field, path }, this);
      })
    );
    res.forEach((field) => {
      const { path, errors: err } = field;
      this.unsafe_setField(path, field);
      values[path] = field.value;
      const e: string[] = err?.filter(Boolean) as string[];
      e && e.length > 0 && errors.set(path, e);
    });

    this.__unsafe_setFieldsValidating(
      names?.map((name) => ({ path: name, validating: false }))
    );

    if (fn) fn(errors.size > 0 ? errors : null, values);

    if (errors.size > 0) throw errors;
    return values;
  }
}

async function execValidation(
  path: string,
  value: any,
  rules: Rules | null | undefined,
  options: ValidationOptions | undefined,
  instance: Validation
): Promise<ValidateError[] | undefined> {
  if (!rules || rules.length === 0) return;

  let isBreak = false;
  const errors: ValidateError[] = [];
  if (options?.validateFirstOnly) {
    for await (const rule of rules) {
      if (isBreak) continue;
      let e: ValidateError;
      try {
        e = await rule(path, value, instance);
      } catch (err) {
        e = String(err);
      } finally {
        errors.push(e);
        if (e) isBreak = true;
      }
    }
    return errors;
  }

  const promises = rules.map((rule) => rule(path, value, instance));
  return await Promise.all(promises);
}

async function makeValidationResult(
  result: ValidateResult,
  instance: Validation
): Promise<ValidateResult> {
  const { path, value, rules, options } = result;
  try {
    const errors = await execValidation(path, value, rules, options, instance);
    return { ...result, errors };
  } catch (e) {
    return { ...result, errors: [String(e)] };
  }
}

function validate(path: string) {
  return function (
    target: any,
    property: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    descriptor =
      descriptor || Object.getOwnPropertyDescriptor(target, property);
    if (!descriptor) return;

    if (!(target instanceof Validation))
      throw Error(`${target} is not a Validate`);

    const original = descriptor.value;
    if (typeof original !== 'function')
      throw Error(`${original} is not a function, but ${typeof original}`);

    descriptor.value = function () {
      const self = this as Validation;
      const rules: Rules | null | undefined = Reflect.getMetadata(
        DecoratorKey.Rules,
        this,
        path
      );
      const onlyFirst: boolean | undefined = Reflect.getMetadata(
        DecoratorKey.OnlyFirst,
        this,
        path
      );
      const triggerCondition: TriggerCondition | undefined =
        Reflect.getMetadata(DecoratorKey.TriggerCondition, this, path) ??
        TriggerCondition.Change;

      // @ts-ignore
      self.__unsafe_setFieldValidating(path, true);
      // eslint-disable-next-line prefer-rest-params
      const res = original.apply(this, arguments);

      // execute original function to update value
      Promise.resolve()
        .then(() => {
          // @ts-ignore
          const value = this[path];
          const result: ValidateResult = {
            path,
            value,
            rules,
            options: { validateFirstOnly: onlyFirst, triggerCondition },
          };
          const r =
            triggerCondition !== TriggerCondition.Change
              ? { ...result, value }
              : makeValidationResult({ ...result, value }, this as Validation);
          Promise.resolve(r).then((r) => self.unsafe_setField?.(path, r));
        })
        .finally(() => {
          // @ts-ignore
          self.__unsafe_setFieldValidating(path, false);
        });

      return res;
    };
  };
}

function trigger(triggerCondition: TriggerCondition = TriggerCondition.Change) {
  return function (target: any, property: string | symbol) {
    // collect trigger into metadata according to the property
    Reflect.defineMetadata(
      DecoratorKey.TriggerCondition,
      triggerCondition,
      target,
      property
    );
    return target;
  };
}

function onlyFirst(first?: boolean) {
  return function (target: any, property: string | symbol) {
    // collect trigger into metadata according to the property
    Reflect.defineMetadata(DecoratorKey.OnlyFirst, first, target, property);
    return target;
  };
}

function rule(...rules: Rules) {
  return function (target: any, property: string | symbol) {
    // collect rules into metadata according to the property
    const keys = Reflect.getMetadata(DecoratorKey.Keys, target) ?? [];
    Reflect.defineMetadata(DecoratorKey.Keys, keys.concat(property), target);
    Reflect.defineMetadata(DecoratorKey.Rules, rules, target, property);

    return target;
  };
}

const getType = (target: any): string => Object.prototype.toString.call(target);
const isMap = (target: any): boolean => getType(target) === '[object Map]';
const isSet = (target: any): boolean => getType(target) === '[object Set]';

const required = (message: string) => (_: string, val: any) => {
  const isNil =
    val === undefined ||
    val === '' ||
    val === null ||
    (Array.isArray(val) && val.length === 0) ||
    (isMap(val) && val.size === 0) ||
    (isSet(val) && val.size === 0);
  if (isNil) return message;
  return null;
};

const max = (maximum: number, message: string) => (_: string, val: any) => {
  if (typeof val === 'string' && val.length > maximum) return message;
  if (typeof val === 'number' && val > maximum) return message;
  if (Array.isArray(val) && val.length > maximum) return message;
  if (isMap(val) && val.size > maximum) return message;
  if (isSet(val) && val.size > maximum) return message;
  return null;
};

const min = (minimum: number, message: string) => (_: string, val: any) => {
  if (typeof val === 'string' && val.length < minimum) return message;
  if (typeof val === 'number' && val < minimum) return message;
  if (Array.isArray(val) && val.length < minimum) return message;
  if (isMap(val) && val.size < minimum) return message;
  if (isSet(val) && val.size < minimum) return message;
  return null;
};

const len = (length: number, message: string) => (_: string, val: any) => {
  if (typeof val === 'string' && val.length !== length) return message;
  if (typeof val === 'number' && val !== length) return message;
  if (Array.isArray(val) && val.length !== length) return message;
  if (isMap(val) && val.size !== length) return message;
  if (isSet(val) && val.size !== length) return message;
  return null;
};

const trim = (message: string) => (_: string, val: any) => {
  if (val && typeof val === 'string' && val.trim() !== val) return message;
  return null;
};

const duplicate =
  (list: Array<any>, message: string) => (_: string, val: any) => {
    if (Array.isArray(list) && list.includes(val))
      return message.replace('$', val);
    return null;
  };

const regExp =
  (pattern: RegExp, message: string, allowEmpty?: boolean) =>
  (_: string, val: any) => {
    if (!!allowEmpty && !val) return null;
    if (!pattern.test(val)) return message.replace('$', val);
    return null;
  };

const validator =
  (
    callback: (
      path: any,
      val: any,
      instance?: Validation
    ) => ValidateError | Promise<ValidateError>
  ) =>
  (path: string, val: any, instance?: Validation) => {
    return callback(path, val, instance);
  };

type ExpectedCondition = {
  path: string;
  value: any | ((value: any) => boolean);
};
enum ConditionKey {
  when = 'when',
  or = 'or',
  and = 'and',
}
type ConditionSet = {
  key: ConditionKey;
  expectedCondition: ExpectedCondition | ExpectedCondition[];
};
interface ConditionObject {
  when: (expectedCondition: ExpectedCondition) => ConditionObject;
  or: (expectedCondition: ExpectedCondition) => ConditionObject;
  and: (expectedCondition: ExpectedCondition) => ConditionObject;
  exe: (...rules: Rules) => Rule;
}
/*
  Case1: condition().when(condition1) - condition1 && fn();
  Case2: condition().when(condition1).or(condition2).exe(fn)  -  (condition1 || condition2) && fn();
  Case3: condition().when([condition1, condition2]).or([condition3, condition4]).exe(fn)  -  ((condition1 && condition2) || (condition3 && condition4)) && fn();
  Case4 not nessary: condition().when([condition1, condition2]).or([condition3, condition4]).and([condition5, condition6]).exe(fn)  
        -  ((condition1 && condition2) || (condition3 && condition4)) && (condition5 && condition6) && fn();
*/
const condition = () => {
  const conditionSet: ConditionSet[] = [];
  let currentResult = true;
  const ret: any = {};

  const when = (
    expectedCondition: ExpectedCondition | ExpectedCondition[]
  ): ConditionObject => {
    conditionSet.push({
      key: ConditionKey.when,
      expectedCondition: expectedCondition,
    });
    return ret;
  };
  const or = (
    expectedCondition: ExpectedCondition | ExpectedCondition[]
  ): ConditionObject => {
    conditionSet.push({
      key: ConditionKey.or,
      expectedCondition: expectedCondition,
    });
    return ret;
  };
  const and = (
    expectedCondition: ExpectedCondition | ExpectedCondition[]
  ): ConditionObject => {
    conditionSet.push({
      key: ConditionKey.and,
      expectedCondition: expectedCondition,
    });
    return ret;
  };

  const exe =
    (...rules: Rules) =>
    async (path: string, val: any, instance: Validation) => {
      currentResult = true;
      conditionSet.forEach((condition) => {
        if (
          condition.key === ConditionKey.when ||
          condition.key === ConditionKey.and
        ) {
          const expectedCondition = condition.expectedCondition;
          let conditions: ExpectedCondition[] = [];
          if (Array.isArray(expectedCondition)) {
            conditions = conditions.concat(expectedCondition);
          } else {
            conditions.push(expectedCondition);
          }
          for (let i = 0; i < conditions.length; i++) {
            const current = conditions[i];
            // @ts-ignore
            const currentExtraPathValue = instance?.[current.path];
            let result = true;
            if (typeof current.value === 'function') {
              result = current.value(currentExtraPathValue);
            } else {
              result = currentExtraPathValue === current.value;
            }
            if (!result) {
              currentResult = false;
              break;
            }
          }
        }
        if (condition.key === ConditionKey.or) {
          const expectedCondition = condition.expectedCondition;
          let conditions: ExpectedCondition[] = [];
          if (Array.isArray(expectedCondition)) {
            conditions = conditions.concat(expectedCondition);
          } else {
            conditions.push(expectedCondition);
          }
          let orResult = true;
          for (let i = 0; i < conditions.length; i++) {
            const current = conditions[i];
            // @ts-ignore
            const currentExtraPathValue = instance?.[current.path];
            let result = true;
            if (typeof current.value === 'function') {
              result = current.value(currentExtraPathValue);
            } else {
              result = currentExtraPathValue === current.value;
            }
            if (!result) {
              orResult = false;
              break;
            }
          }
          currentResult = currentResult || orResult;
        }
      });

      if (currentResult) {
        for await (const rule of rules) {
          const r = await rule(path, val, instance);
          if (r) return r;
        }
      }
      return null;
    };

  ret.when = when;
  ret.or = or;
  ret.and = and;
  ret.exe = exe;

  return ret as ConditionObject;
};

export {
  ExpectedCondition,
  ConditionKey,
  ConditionSet,
  ConditionObject,
  TriggerCondition,
  ValidationOptions,
  ValidateResult,
  Rule,
  Validation,
  validate,
  rule,
  trigger,
  onlyFirst,
  required,
  max,
  min,
  len,
  trim,
  duplicate,
  regExp,
  validator,
  condition,
};
