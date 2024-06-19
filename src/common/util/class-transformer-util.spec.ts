import { undefineIf } from './class-transformer-util';

describe('class-transformer-util', () => {
  describe('undefineIf', () => {
    it('should return a function', () => {
      const result = undefineIf(({ value }) => value === 3);
      expect(result).toBeDefined();
      expect(Object.getPrototypeOf(result).constructor).toBe(Function);
    });
    it('The returned function should return undefined when the predicate is true', () => {
      const signalValue = 3;
      const transformFunction = undefineIf(
        ({ value }) => value === signalValue,
      );

      const result = transformFunction({
        value: 3,
        key: undefined,
        obj: undefined,
        options: undefined,
        type: undefined,
      });
      expect(result).toBeUndefined();
    });
    it('The returned function should return the original value when the predicate is false', () => {
      const signalValue = 'hello';
      const transformFunction = undefineIf(() => false);
      const result = transformFunction({
        value: signalValue,
        key: undefined,
        obj: undefined,
        options: undefined,
        type: undefined,
      });
      expect(result).toEqual(signalValue);
    });
  });
});
