import { Expose, Transform } from 'class-transformer';
import { undefineIf } from 'src/common/util/class-transformer-util';
import * as util from 'src/common/util/misc-util';
import { LineItemAcknowledgement } from '../entities/line-item-acknowledgement.entity';

export class LineItemAcknowledgementMessageOut {
  @Expose()
  itemNumber: string;

  @Expose()
  itemNumberType: string;

  @Transform(undefineIf(({ value }) => value === 0))
  @Expose()
  quantityDispatching: number;

  @Transform(undefineIf(({ value }) => value === 0))
  @Expose()
  quantityBackorder: number;

  @Transform(undefineIf(({ value }) => value === 0))
  @Expose()
  quantityHardReject: number;

  @Transform(undefineIf(({ value }) => value === 0))
  @Expose()
  quantitySoftReject: number;

  @Expose()
  netPrice: number;

  @Transform(undefineIf(({ value }) => value === 0))
  @Expose()
  vatRate: number;

  @Expose()
  get containsChanges(): boolean {
    return this.quantitySoftReject > 0 || this.quantityHardReject > 0;
  }

  copyValues(
    lineItemAcknowledgement: LineItemAcknowledgement,
  ): LineItemAcknowledgementMessageOut {
    util.copyValues(this, lineItemAcknowledgement.lineItem, [
      'itemNumber',
      'itemNumberType',
    ]);
    const names = [
      'quantityDispatching',
      'quantityBackorder',
      'quantityHardReject',
      'quantitySoftReject',
      'netPrice',
      'vatRate',
    ];
    return util.copyValues(this, lineItemAcknowledgement, names);
  }
}
