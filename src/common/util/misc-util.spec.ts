import {
  concatToBase64String,
  dedupeReduce,
  numberToFixedLengthVirtualPointString,
} from './misc-util';

describe('Misc util', () => {
  describe('dedupeReduce', () => {
    it('works with primitive types', () => {
      const testArray = [
        1, 2, 1, 2, 3, 2, 1, 3, 4, 3, 2, 1, 2, 3, 4, 2, 1, 2, 3,
      ];

      const resultArray = dedupeReduce(testArray, (elem) => String(elem));

      expect(resultArray).toHaveLength(4);
      // result ⊇ expected, result has all expected elements
      expect(resultArray).toEqual(expect.arrayContaining([1, 2, 3, 4]));
      // expected ⊇ result, there's no extra elements
      expect([1, 2, 3, 4]).toEqual(expect.arrayContaining(resultArray));
    });

    it('with undefined reduce function, keeps the last copy of each equal element', () => {
      const testArray = [
        { name: 'one', value: 1 },
        { name: 'one', value: 2 },
        { name: 'two', value: 3 },
        { name: 'one', value: 4 },
        { name: 'two', value: 5 },
      ];
      const chosenOne = testArray[3];
      const chosenTwo = testArray[4];

      const resultArray = dedupeReduce(testArray, (elem) => elem.name);

      expect(resultArray).toHaveLength(2);
      expect(resultArray).toContain(chosenOne);
      expect(resultArray).toContain(chosenTwo);
    });

    it('reduce function is applied', () => {
      const testArray = [1, 2, 4, 3, 5, 6];

      // Equals condition: Same parity. Reduce operation: Sum.
      const resultArray = dedupeReduce(
        testArray,
        (v) => String(v % 2),
        (a, c) => a + c,
      );

      expect(resultArray).toHaveLength(2);
      expect(resultArray).toEqual([9, 12]);
      expect([9, 12]).toEqual(resultArray);
    });

    it('initial value is used if provided', () => {
      const testArray = [
        { name: 'hello', value: 1 },
        { name: 'goodbye', value: 2 },
      ];
      const initialValue = { name: 'poppo', value: 3 };

      // Leave only the first value, in this case the initial
      const result = dedupeReduce(
        testArray,
        () => 'same',
        (acc) => acc,
        () => initialValue,
      );

      expect(result).toContain(initialValue);
    });
  });

  describe('concatToBase64String', () => {
    it('appends text to a base64 string', () => {
      const start = 'Hello';
      const start64 = 'SGVsbG8=';
      const text = ' World!';

      const end = concatToBase64String(start64, text);

      expect(end).toEqual('SGVsbG8gV29ybGQh');
      expect(atob(end)).toEqual('Hello World!');
    });

    it('does not modify the original string', () => {
      const start = 'Hello';
      const start64 = 'SGVsbG8=';
      const text = ' World!';

      const end = concatToBase64String(start64, text);

      expect(start64).toEqual('SGVsbG8=');
    });
  });

  describe('numberToFixedLengthVirtualPointString', () => {
    it('turns a number into a string representation with fixed implied point and set length', () => {
      const value = 23.54;

      expect(numberToFixedLengthVirtualPointString(value, 5, 3)).toEqual(
        '23540',
      );
      expect(numberToFixedLengthVirtualPointString(value, 7, 2)).toEqual(
        '0002354',
      );
      expect(numberToFixedLengthVirtualPointString(value, 10, 1)).toEqual(
        '0000000235',
      );
      expect(numberToFixedLengthVirtualPointString(value, 5, 4)).toEqual(
        '35400',
      );
    });

    it('refuses to do something unreasonable', () => {
      expect(() => numberToFixedLengthVirtualPointString(12.5, 2, 13)).toThrow(
        'totalLength cannot be less than decimalLength',
      );
      expect(() => numberToFixedLengthVirtualPointString(-10, 3, 1)).toThrow(
        'Cannot convert a negative number',
      );
    });

    it('handles edge cases like this', () => {
      expect(numberToFixedLengthVirtualPointString(12.5, 3, 0)).toEqual('013');
      expect(numberToFixedLengthVirtualPointString(12.4, 3, 0)).toEqual('012');
      expect(numberToFixedLengthVirtualPointString(123, 0, 0)).toEqual('');
      expect(numberToFixedLengthVirtualPointString(0.45, 3, 0)).toEqual('000');
      expect(numberToFixedLengthVirtualPointString(0, 3, 0)).toEqual('000');
    });
  });
});
