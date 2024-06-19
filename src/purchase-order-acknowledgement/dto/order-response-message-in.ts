import { Type } from 'class-transformer';
import {
  Allow,
  IsDateString,
  IsNotEmpty,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { LineItemOrderResponseMessageIn } from 'src/line-item-acknowledgement/dto/line-item-order-response-message-in';

/**
 * Must be used with transform as a ValidationPipe option
 */
export class OrderResponseMessageIn {
  @IsNotEmpty()
  orderNumber: string;

  @Allow()
  amazonVendorCode?: string;

  @ValidateIf((ob: OrderResponseMessageIn, val) => val !== undefined)
  @IsDateString()
  deliveryDateStart?: string;

  @ValidateIf((ob: OrderResponseMessageIn, val) => val !== undefined)
  @IsDateString()
  deliveryDateEnd?: string;

  @Allow()
  shipToGLN?: string;

  @ValidateIf((ob: OrderResponseMessageIn) => !ob.isEmpty())
  @ValidateNested()
  @Type(() => LineItemOrderResponseMessageIn)
  lineItems?: LineItemOrderResponseMessageIn[];

  isEmpty(): boolean {
    return [
      this.amazonVendorCode,
      this.deliveryDateStart,
      this.deliveryDateEnd,
      this.shipToGLN,
    ].every((val) => val === undefined);
  }
}
