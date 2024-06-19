import { Exclude, Expose } from 'class-transformer';
import * as util from 'src/common/util/misc-util';
import { LineItem } from '../entities/line-item.entity';

export class LineItemMessageOut {
  @Expose()
  itemNumber: string;

  @Exclude()
  itemNumberType: string;

  @Expose()
  orderedQuantity: number;

  @Expose()
  netPrice: number;

  copyValues(lineItem: LineItem): LineItemMessageOut {
    const names = [
      'itemNumber',
      'itemNumberType',
      'orderedQuantity',
      'netPrice',
    ];
    util.copyValues(this, lineItem, names);
    return this;
  }
}
