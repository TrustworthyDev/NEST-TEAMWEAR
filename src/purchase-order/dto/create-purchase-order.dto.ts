import { Type } from 'class-transformer';
import {
  Allow,
  IsDateString,
  IsNotEmpty,
  IsNumberString,
  ValidateNested,
} from 'class-validator';
import { CreateLineItemDto } from 'src/line-item/dto/create-line-item.dto';

export class CreatePurchaseOrderDto {
  @IsNotEmpty()
  marketplace: string;

  @IsNotEmpty()
  orderNumber: string;

  @IsDateString()
  dateIssued: string;

  @IsDateString()
  deliveryDateStart: string;

  @IsDateString()
  deliveryDateEnd: string;

  @Allow()
  firstOrderStatus?: string;

  @Allow()
  promotionDealNumber?: string;

  @IsNotEmpty()
  amazonVendorCode: string;

  @IsNotEmpty()
  buyerGLN: string;

  @IsNotEmpty()
  supplierGLN: string;

  @IsNotEmpty()
  shipToGLN: string;

  @IsNotEmpty()
  shipToCountryCode: string;

  @IsNotEmpty()
  invoiceeGLN: string;

  @IsNotEmpty()
  invoiceeName1: string;

  @Allow()
  invoiceeName2?: string;

  @IsNotEmpty()
  invoiceeAddress1: string;

  @Allow()
  invoiceeAddress2: string;

  @IsNotEmpty()
  invoiceeCity: string;

  @Allow()
  invoiceeState?: string;

  @IsNotEmpty()
  invoiceePostcode: string;

  @IsNotEmpty()
  invoiceeCountry: string;

  @IsNotEmpty()
  VATNumber: string;

  @IsNotEmpty()
  currencyISOCode: string;

  @IsNumberString()
  totalLineItemsControl: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];
}
