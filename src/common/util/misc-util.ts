/**
 * Copies the specified properties from a source object to a destination,
 * only if they exist on the source.
 * @param destination The object to copy the properties into
 * @param source The object to copy the properties from
 * @param names The names of the properties that should be copied
 * @returns The destination object, with the new properties
 */
export function copyValues(
  destination: any,
  source: any,
  names: Array<string>,
): any {
  for (const property in source) {
    if (source[property] !== undefined && names.includes(property)) {
      destination[property] = source[property];
    }
  }
  return destination;
}

/**
 * Turns an array into a Map with keys the group keys
 * and value an an array of all the objects with that key.
 * Basically it can turn this
 * [
 *     {prop1: "hello", prop2: {prop3: "world"}},
 *     {prop1: "goodbye", prop2: {prop3: "world"}},
 *     {prop1: "hello", prop2: {prop3: "darkness"}},
 * ]
 * into this
 * {
 *     hello: [
 *         {prop1: "hello", prop2: {prop3: "world"}},
 *         {prop1: "hello", prop2: {prop3: "darkness"}},
 *     ],
 *     goodbye: [
 *         {prop1: "goodbye", prop2: {prop3: "world"}},
 *     ],
 * }
 * or this
 * {
 *     world: [
 *         {prop1: "hello", prop2: {prop3: "world"}},
 *         {prop1: "goodbye", prop2: {prop3: "world"}},
 *     ],
 *     darkness: [
 *         {prop1: "hello", prop2: {prop3: "darkness"}},
 *     ],
 * }
 * and much more
 * @param src An array
 * @param groupFunction A function which must return the group an object belongs to, as a string
 */
export function groupArrayByFunction<T>(
  src: Array<T>,
  groupFunction: (value: T, index: number) => string,
): Map<string, Array<T>> {
  return src.reduce(function (previous: Map<string, Array<T>>, current, index) {
    const val = groupFunction(current, index);
    previous.set(val, previous.get(val) || []);
    previous.get(val).push(current);
    return previous;
  }, new Map());
}

/**
 * Allows deduplication of array elements. One can choose when elements are considered duplicates,
 * and if duplicates should be discarded or reduced to a single element.
 * @param src An array
 * @param groupFunction A function which must return the group an element belongs to.
 * Duplicate elements must belong to the same group to be deduplicated
 * @param reduceFunction A function which is called on duplicate elements to reduce them to a single element.
 * If not given, only the last instance is kept.
 * @param initialValueFunction A function that provides the initial value for each group.
 * If undefined, there will be no initial value explicitly defined in each group's reduction.
 * Receives the group name and elements as parameters. **These must not be mutated.**
 * The group is guaranteed to contain at least one element.
 * @returns An array of exactly one element for each group defined by the group function.
 * Each element is obtained by reducing duplicates with the reduce function.
 */
export function dedupeReduce<T>(
  src: Array<T>,
  groupFunction: (value: T, index: number) => string,
  reduceFunction?: (accumulator: T, current: T) => T,
  initialValueFunction?: (groupName: string, group: Array<T>) => T,
): Array<T> {
  // Default reduce function keeps the last copy
  reduceFunction = reduceFunction || ((a, c) => c);
  const groups = groupArrayByFunction(src, groupFunction);
  const result = [];
  for (const [key, group] of groups.entries()) {
    if (initialValueFunction !== undefined) {
      result.push(
        group.reduce(reduceFunction, initialValueFunction(key, group)),
      );
    } else {
      result.push(group.reduce(reduceFunction));
    }
  }
  return result;
}

/**
 * Returns a string that contains the base64 representation
 * of the concatenation of the base64 string target and the plain text text.
 * @param target The base64 string to append to
 * @param text The plain text to append
 * @returns target extended with text
 */
export function concatToBase64String(target: string, text: string): string {
  const base = Buffer.from(target, 'base64').toString('utf-8');
  return Buffer.from(base.concat(text)).toString('base64');
}

/**
 * You may want to take a number and turn into a string representation with fixed
 * implied number of decimal places. Say you want `23.54` to turn into `23540` or `0002354`
 * or `0000000235` or `35400` (why?), this function does them all.
 *
 * Be reasonable with totalLength because this function will truncate the integer part
 * if the length ends up not being enough to hold the string representation.
 *
 * @param value Positive number.
 * @param totalLength Positive integer.
 * @param decimalLength Positive integer.
 */
export function numberToFixedLengthVirtualPointString(
  value: number,
  totalLength: number,
  decimalLength: number,
) {
  if (
    value === undefined ||
    totalLength === undefined ||
    totalLength < 0 ||
    decimalLength === undefined ||
    decimalLength < 0
  ) {
    throw new TypeError(
      `Incompatible types ${value}, ${totalLength}, ${decimalLength}`,
    );
  }

  if (value < 0) {
    throw new Error('Cannot convert a negative number');
  }

  if (totalLength < decimalLength) {
    throw new Error('totalLength cannot be less than decimalLength');
  }

  const padded = value
    .toFixed(decimalLength)
    .replace('.', '')
    .padStart(totalLength, '0');
  const toRemove = -totalLength || padded.length;
  return padded.slice(toRemove);
}
