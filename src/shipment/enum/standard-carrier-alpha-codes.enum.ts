import { Courier } from './courier.enum';

export const StandardCarrierAlphaCodes: Record<Courier, string> = {
  ups: 'UPSN',
  dhl: 'DHLC',
  tnt: 'TNTXX',
  fake: 'FAKE',
};
