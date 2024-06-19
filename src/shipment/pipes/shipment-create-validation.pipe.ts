import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { PackingListService } from 'src/packing-list/packing-list.service';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { makeEntityCrudRequest } from 'src/common/util/crud-request-util';
import { PackingList } from 'src/packing-list/entities/packing-list.entity';

@Injectable()
export class ShipmentCreateValidationPipe implements PipeTransform {
  constructor(private readonly packingListService: PackingListService) {}

  async transform(value: CreateShipmentDto, metadata: ArgumentMetadata) {
    const { metatype } = metadata;
    if (!metatype || !this.shouldValidateValue(metatype)) {
      return value;
    }

    const ids = value.packingLists.map((pl) => pl.id);
    const queryRequest = makeEntityCrudRequest<PackingList>();
    queryRequest.parsed.search = {
      id: { $in: ids },
    };
    const packingLists = (await this.packingListService.getMany(
      queryRequest,
    )) as PackingList[];
    if (packingLists.some((packingList) => Boolean(packingList.shipmentId))) {
      throw new BadRequestException(
        'Cannot create shipment. Some packing lists are already in another shipment',
      );
    }

    // if packingLists survive this, they all have the same address
    packingLists.reduce((acc, curr) => {
      if (
        curr.shipToAddressLine1 !== acc.shipToAddressLine1 ||
        curr.shipToAddressLine2 !== acc.shipToAddressLine2 ||
        curr.shipToCity !== acc.shipToCity ||
        curr.shipToCountryCode !== acc.shipToCountryCode ||
        curr.shipToPostalCode !== acc.shipToPostalCode ||
        curr.shipToGLN !== acc.shipToGLN
      ) {
        throw new BadRequestException(
          'All packing lists must have the same shipTo info',
        );
      }
      return acc;
    });
    return value;
  }

  shouldValidateValue(metatype: Type<any>): boolean {
    return metatype === CreateShipmentDto;
  }
}
