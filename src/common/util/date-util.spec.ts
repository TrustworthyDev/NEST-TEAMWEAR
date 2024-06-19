import { dateToYYYYMMDD, getGMTOffset } from './date-util';

describe('Date util', () => {
  describe('dateToYYYYMMDD', () => {
    it('should work for a date with single digit month', () => {
      // This date constructor interprets the date to be UTC
      const testDate = new Date('2022-01-12');
      const result = dateToYYYYMMDD(testDate);
      expect(result).toBe('20220112');
    });

    it('should work for a date with single digit day', () => {
      const testDate = new Date('2022-11-03');
      const result = dateToYYYYMMDD(testDate);
      expect(result).toBe('20221103');
    });

    /**
     * Dates used in the system don't have time information,
     * meaning they are aligned to UTC 00:00:00. A naive conversion
     * to string could turn these into the wrong date.
     * This test is meant to catch that, but uses crafted dates which cannot
     * occur in the system.
     */
    it("shouldn't matter which timezone the software is running in", () => {
      const testDate1 = new Date(1667779140000); //Sun Nov 06 2022 23:59:00 GMT+0000
      const testDate2 = new Date(1667779500000); //Mon Nov 07 2022 00:05:00 GMT+0000
      const result1 = dateToYYYYMMDD(testDate1);
      const result2 = dateToYYYYMMDD(testDate2);
      expect(result1).toBe('20221106');
      expect(result2).toBe('20221107');
    });
  });

  // [...Array(48).keys()].map(e => (e%2 ? -(e+1) : e) / 2).map(e => e*30)
  const minuteOffsetToGMTMap = {
    '-30': 'GMT+00:30',
    '-60': 'GMT+01:00',
    '-90': 'GMT+01:30',
    '-120': 'GMT+02:00',
    '-150': 'GMT+02:30',
    '-180': 'GMT+03:00',
    '-210': 'GMT+03:30',
    '-240': 'GMT+04:00',
    '-270': 'GMT+04:30',
    '-300': 'GMT+05:00',
    '-330': 'GMT+05:30',
    '-360': 'GMT+06:00',
    '-390': 'GMT+06:30',
    '-420': 'GMT+07:00',
    '-450': 'GMT+07:30',
    '-480': 'GMT+08:00',
    '-510': 'GMT+08:30',
    '-540': 'GMT+09:00',
    '-570': 'GMT+09:30',
    '-600': 'GMT+10:00',
    '-630': 'GMT+10:30',
    '-660': 'GMT+11:00',
    '-690': 'GMT+11:30',
    '-720': 'GMT+12:00',
    '0': 'GMT+00:00',
    '30': 'GMT-00:30',
    '60': 'GMT-01:00',
    '90': 'GMT-01:30',
    '120': 'GMT-02:00',
    '150': 'GMT-02:30',
    '180': 'GMT-03:00',
    '210': 'GMT-03:30',
    '240': 'GMT-04:00',
    '270': 'GMT-04:30',
    '300': 'GMT-05:00',
    '330': 'GMT-05:30',
    '360': 'GMT-06:00',
    '390': 'GMT-06:30',
    '420': 'GMT-07:00',
    '450': 'GMT-07:30',
    '480': 'GMT-08:00',
    '510': 'GMT-08:30',
    '540': 'GMT-09:00',
    '570': 'GMT-09:30',
    '600': 'GMT-10:00',
    '630': 'GMT-10:30',
    '660': 'GMT-11:00',
    '690': 'GMT-11:30',
  };

  describe('getSystemGMTOffset', () => {
    it('Returns the correct offset', () => {
      const oneOffset = new Date('2023-07-27').getTimezoneOffset();
      const anotherOffset = new Date('2023-02-13').getTimezoneOffset();
      expect(getGMTOffset(oneOffset)).toEqual(minuteOffsetToGMTMap[oneOffset]);
      expect(getGMTOffset(anotherOffset)).toEqual(
        minuteOffsetToGMTMap[anotherOffset],
      );
    });

    it("Let's just do them all", () => {
      for (const [offset, result] of Object.entries(minuteOffsetToGMTMap)) {
        expect(getGMTOffset(parseInt(offset))).toEqual(result);
      }
    });
  });
});
