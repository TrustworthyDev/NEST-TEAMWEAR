import { Expose } from 'class-transformer';
import { TaxLine } from '../entities/tax-line.entity';
import * as util from 'src/common/util/misc-util';

export class InvoiceMessageSummaryLineOut {
  @Expose()
  VATRate: number;

  @Expose()
  taxAmount: number;

  @Expose()
  taxableAmount: number;

  copyValues(taxLine: TaxLine): InvoiceMessageSummaryLineOut {
    const names = ['VATRate', 'taxAmount', 'taxableAmount'];
    return util.copyValues(this, taxLine, names);
  }
}
