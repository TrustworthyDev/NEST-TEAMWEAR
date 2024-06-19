import { UPSApi } from '@babbiorsetto/ups-typescript-fetch-client';
import {
  ShipmentApi as DHLShipmentApi,
  PickupApi as DHLPickupApi,
  Configuration as DHLConfiguration,
  SupermodelIoLogisticsExpressCreateShipmentResponse,
  SupermodelIoLogisticsExpressAccount,
  SupermodelIoLogisticsExpressCreateShipmentRequestOutputImageProperties,
  SupermodelIoLogisticsExpressCreateShipmentRequestContent,
  SupermodelIoLogisticsExpressCreateShipmentRequest,
  EstimatedDeliveryDate,
  SupermodelIoLogisticsExpressErrorResponse,
  SupermodelIoLogisticsExpressCreateShipmentRequestOutputImagePropertiesImageOptions,
  SupermodelIoLogisticsExpressPackageReference,
  SupermodelIoLogisticsExpressCreateShipmentRequestShipmentNotification,
} from '@babbiorsetto/dhl-typescript-fetch-client';
import { PAPERLESSDOCUMENTUploadResponseWrapper } from '@babbiorsetto/ups-typescript-fetch-client/dist/paperless-document';
import {
  SHIPRequestWrapper,
  SHIPResponseWrapper,
  VOIDSHIPMENTResponseWrapper,
} from '@babbiorsetto/ups-typescript-fetch-client/dist/shipping';
import {
  TimeInTransitRequest,
  TimeInTransitResponse,
} from '@babbiorsetto/ups-typescript-fetch-client/dist/time-in-transit';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  dateToISODatestring,
  dateToYYYYMMDD,
  getGMTOffset,
} from 'src/common/util/date-util';
import { numberToFixedLengthVirtualPointString } from 'src/common/util/misc-util';
import { ConfigKeys } from 'src/config/config-keys.enum';
import { CustomsDocument } from 'src/customs-document/entities/customs-document.entity';
import { ShipmentPackage } from 'src/shipment-package/entities/shipment-package.entity';
import { Shipment } from 'src/shipment/entities/shipment.entity';
import { Courier } from 'src/shipment/enum/courier.enum';
import {
  ActionType,
  AddressTypeType,
  CommissionType,
  ConsignmentTypeType,
  DivisionType,
  PackageTypeType,
  ProductType,
  TNTClient,
  tntLabelsMessage,
  tntLabelsMessageDimensions,
  tntLabelsResponse,
  tntLabelsResponseComplete,
} from 'src/tntClient';
import { string } from 'joi';

@Injectable()
export class ShippingClient {
  referencePlaceholder = 'XxXReferenceXxX';
  upsClient: UPSApi;
  tntClient: TNTClient;
  dhlClient: {
    shipment: DHLShipmentApi;
    pickup: DHLPickupApi;
  };

  constructor(private readonly configService: ConfigService<ConfigKeys>) {
    this.upsClient = new UPSApi(
      {
        client_id: configService.get('UPS_CLIENT_ID'),
        client_secret: configService.get('UPS_CLIENT_SECRET'),
      },
      configService.get('UPS_API_URL'),
    );
    this.tntClient = new TNTClient();
    const DHLConfig: DHLConfiguration = {
      username: configService.get('DHL_API_KEY'),
      password: configService.get('DHL_API_SECRET'),
    };
    const DHLBaseURL = configService.get('DHL_API_URL');
    this.dhlClient = {
      shipment: new DHLShipmentApi(DHLConfig, DHLBaseURL),
      pickup: new DHLPickupApi(DHLConfig, DHLBaseURL),
    };
  }

  async ship(shipment: Shipment) {
    switch (shipment.courier) {
      case Courier.UPS:
        let response: SHIPResponseWrapper;
        try {
          response = await this.upsClient
            .shipping()
            .shipment(this.getUpsShipRequest(shipment), 'v1');
        } catch (err) {
          try {
            shipment.error = (await err.json()).response.errors[0].message;
          } catch (jsonErr) {
            shipment.error = await err.text();
          }
          throw new Error('UPS shipping error');
        }
        shipment = this.updateShipmentUps(shipment, response);
        break;
      case Courier.TNT:
        let tntResponse: tntLabelsResponse;
        try {
          tntResponse = await this.tntClient.shipment(
            this.getTntShipRequest(shipment),
          );
        } catch (err) {
          shipment.error = err?.message || 'Error reading TNT error';
          throw new Error('TNT shipping error');
        }
        shipment = this.updateShipmentTnt(shipment, tntResponse);
        break;
      case Courier.DHL:
        let dhlResponse: SupermodelIoLogisticsExpressCreateShipmentResponse;
        try {
          dhlResponse = await this.dhlClient.shipment.expApiShipments(
            this.getDhlShipRequest(shipment),
          );
        } catch (err) {
          try {
            const errBody: SupermodelIoLogisticsExpressErrorResponse =
              await err.json();
            shipment.error = errBody.detail;
          } catch (jsonErr) {
            shipment.error = await err.text();
          }
          throw new Error('DHL shipping error');
        }
        shipment = this.updateShipmentDhl(shipment, dhlResponse);
        break;
      case Courier.FAKE:
        shipment = this.updateShipmentFake(shipment);
        break;
    }
    return shipment;
  }

  async voidShipment(shipment: Shipment) {
    switch (shipment.courier) {
      case Courier.UPS:
        let response: VOIDSHIPMENTResponseWrapper;
        try {
          response = await this.upsClient
            .shipping()
            .voidShipment('v1', shipment.shipmentIdentificationNumber);
        } catch (err) {
          let errorText;
          try {
            errorText = (await err.json()).response.errors[0].message;
          } catch (jsonErr) {
            errorText = await err.text();
          }
          throw new Error(`UPS void shipment error: ${errorText}`);
        }
        break;
      case Courier.TNT:
        let tntResponse: boolean;
        try {
          tntResponse = await this.tntClient.voidShipment(
            shipment.shipmentIdentificationNumber,
          );
        } catch (err) {
          const errorText = err?.message || 'Error reading TNT error';
          throw new Error(`TNT void shipment error: ${errorText}`);
        }
        break;
      case Courier.DHL:
        let dhlResponse;
        try {
          dhlResponse = await this.dhlClient.pickup.expApiPickupsCancel(
            shipment.shipmentIdentificationNumber,
            'Umberto',
            'Changed conditions',
          );
        } catch (err) {
          const error: SupermodelIoLogisticsExpressErrorResponse =
            await err.json();
          const errorText = error.detail;
          throw new Error(`DHL cancel pickup error: ${errorText}`);
        }
      case Courier.FAKE:
        return;
    }
  }

  async estimateDeliveryDate(shipment: Shipment) {
    switch (shipment.courier) {
      case Courier.UPS:
        let response: TimeInTransitResponse;
        try {
          response = await this.upsClient
            .timeInTransit()
            .timeInTransit(
              this.getUpsTimeInTransitRequest(shipment),
              'v1',
              '0001',
              'application',
            );
        } catch (err) {
          try {
            shipment.error = (await err.json()).response.errors[0].message;
          } catch (jsonErr) {
            shipment.error = await err.text();
          }
          throw new Error('UPS timeInTransit error');
        }
        try {
          shipment = this.updateTimeInTransitUps(shipment, response);
        } catch (err) {
          shipment.error = err.message;
          throw new Error('UPS timeInTransit error');
        }
        break;
      case Courier.TNT:
        const now = new Date();
        // A date that has the same date component as local now and 0 time component UTC
        const todayUTC = Date.UTC(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        // A datestring that is today's day of the month local + 3 days
        shipment.estimatedDeliveryDate = dateToISODatestring(
          new Date(todayUTC + 60 * 60 * 72 * 1000),
        );
        break;
      case Courier.FAKE:
        shipment = this.updateTimeInTransitFake(shipment);
        break;
    }
    return shipment;
  }

  async uploadCustomsDocuments(shipment: Shipment) {
    switch (shipment.courier) {
      case Courier.UPS:
        let response: PAPERLESSDOCUMENTUploadResponseWrapper;
        for (const customsDocument of shipment.customsDocuments) {
          try {
            response = await this.upsClient
              .paperlessDocument()
              .upload(
                this.getUpsPaperlessUploadRequest(customsDocument),
                'v1',
                'F42602',
              );
          } catch (err) {
            try {
              shipment.error = (await err.json()).response.errors[0].message;
            } catch (jsonErr) {
              shipment.error = await err.text();
            }
            throw new Error('UPS paperlessDocument error');
          }
          try {
            this.updateCustomsDocumentUps(customsDocument, response);
          } catch (err) {
            shipment.error = err.message;
            throw new Error('UPS paperlessDocument error');
          }
        }
        break;
    }
    return shipment;
  }

  getUpsShipRequest(shipment: Shipment): SHIPRequestWrapper {
    const addressLines = [shipment.packingLists[0].shipToAddressLine1];
    if (shipment.packingLists[0].shipToAddressLine2) {
      addressLines.push(shipment.packingLists[0].shipToAddressLine2);
    }
    return {
      ShipmentRequest: {
        Request: {
          RequestOption: 'nonvalidate',
        },
        Shipment: {
          Description: 'Clothing',
          PaymentInformation: {
            ShipmentCharge: [
              {
                Type: '02',
                BillShipper: {
                  AccountNumber: 'F42602',
                },
              },
              {
                Type: '01',
                BillShipper: {
                  AccountNumber: 'F42602',
                },
              },
            ] as any,
          },
          Shipper: {
            EMailAddress: 'spedizioniamazon@ggteamwear.com',
            Name: 'GGTeamwear',
            AttentionName: 'Umberto',
            Address: {
              AddressLine: [
                'Località Boscofangone',
                'Cis Nola isola3 lotto 338',
              ] as any,
              City: 'nola',
              CountryCode: 'IT',
              PostalCode: '80035',
              StateProvinceCode: 'ITALIA',
            },
            ShipperNumber: 'F42602',
            Phone: {
              Number: '+3908119935182',
            },
          },
          ShipFrom: {
            Name: 'GGTeamwear',
            AttentionName: 'Umberto',
            Address: {
              AddressLine: [
                'Località Boscofangone',
                'Cis Nola isola3 lotto 338',
              ] as any,
              City: 'nola',
              CountryCode: 'IT',
              PostalCode: '80035',
            },
            Phone: {
              Number: '+3908119935182',
            },
          },
          ShipTo: {
            Address: {
              AddressLine: addressLines as any,
              City: shipment.packingLists[0].shipToCity,
              CountryCode: shipment.packingLists[0].shipToCountryCode,
              PostalCode: shipment.packingLists[0].shipToPostalCode,
            },
            Name: shipment.packingLists[0].shipToName,
            AttentionName: shipment.packingLists[0].shipToName,
            EMailAddress: 'spedizioniamazon@ggteamwear.com',
            Phone: {
              Number: '08119935182',
            },
          },
          Service: {
            Code: '11',
            Description: 'UPS Standard',
          },
          Package: shipment.packingLists
            .map((pl) => pl.packages)
            .flat()
            .map((pck) => ({
              Packaging: {
                Code: '02',
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: 'CM',
                },
                Height: pck.height.toFixed(0),
                Length: pck.length.toFixed(0),
                Width: pck.width.toFixed(0),
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: 'KGS',
                  Description: 'Kilograms',
                },
                Weight: pck.weight.toFixed(0),
              },
              ReferenceNumber: [
                {
                  Value: pck.packingList.documentNumber,
                },
                {
                  Value: pck.packageNumber,
                },
              ] as any,
            })),
          ShipmentRatingOptions: {
            NegotiatedRatesIndicator: '',
          },
          RatingMethodRequestedIndicator: '',
          TaxInformationIndicator: '',
          ShipmentServiceOptions: {
            LabelDelivery: {
              LabelLinksIndicator: '',
            },
            ...(shipment.customsDocuments.length > 0
              ? ({
                  InternationalForms: {
                    FormType: '07',
                    UserCreatedForm: {
                      DocumentID: shipment.customsDocuments[0].documentID,
                    },
                  },
                } as any)
              : {}),
            // CommercialInvoiceRemovalIndicator: "",
          },
        },
        LabelSpecification: {
          LabelImageFormat: { Code: 'ZPL' },
          LabelStockSize: { Height: '6', Width: '4' },
        },
        // ReceiptSpecification: { ImageFormat: { Code: "pdf" } },
      },
    };
  }

  getTntShipRequest(shipment: Shipment): tntLabelsMessage {
    const allPackages = shipment.packingLists.map((pl) => pl.packages).flat();
    const shipmentWeight = allPackages.reduce(
      (acc, curr) => acc + curr.weight,
      0,
    );

    return {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'utf-8',
        '@_standalone': 'no',
      },
      shipment: {
        software: {
          application: 'MYRTL',
          version: '1.0',
        },
        security: {
          customer: 'G10736',
          user: this.configService.get('TNT_CLIENT_USER'),
          password: this.configService.get('TNT_CLIENT_PASSWORD'),
          langid: 'IT',
        },
        consignment: {
          '@_action': ActionType.INSERT,
          '@_Internazionale': 'N',
          '@_insurance': 'N',
          '@_hazardous': 'N',
          '@_cashondeliver': 'N',
          '@_operationaloption': '0',
          laroseDepot: '',
          senderAccId: '11060398',
          consignmentno: '',
          consignmenttype: ConsignmentTypeType.TNT,
          actualweight: numberToFixedLengthVirtualPointString(
            shipmentWeight,
            8,
            3,
          ),
          actualvolume: '',
          totalpackages: allPackages.length.toString(),
          packagetype: PackageTypeType.CARTON,
          division: DivisionType.D_USE_THIS,
          product: ProductType.N_USE_THIS,
          vehicle: '',
          insurancevalue: '',
          insurancecurrency: '',
          packingdesc: '',
          reference: '',
          collectiondate: dateToYYYYMMDD(new Date()),
          collectiontime: '',
          invoicevalue: '',
          invoicecurrency: '',
          specialinstructions: '',
          options: {
            option: ['', '', ''],
          },
          termsofpayment: CommissionType.SENDER,
          systemcode: 'RL',
          systemversion: '1.0',
          codofvalue: '',
          codofcurrency: '',
          goodsdesc: 'Abbigliamento',
          eomenclosure: '',
          eomofferno: '',
          eomdivision: '',
          eomunification: '',
          dropoffpoint: '',
          addresses: {
            address: [
              {
                addressType: AddressTypeType.SENDER_USE_THIS,
                vatno: '',
                addrline1: 'Cis Nola isola3 lotto 338',
                addrline2: '',
                addrline3: '',
                postcode: '80035',
                phone1: '+39',
                phone2: '08119935182',
                name: 'GGTeamwear',
                country: 'IT',
                town: 'Nola',
                contactname: '',
                fax1: '',
                fax2: '',
                email: '',
                telex: '',
                province: 'NA',
                custcountry: '',
                title: '',
              },
              {
                addressType: AddressTypeType.RECIPIENT_USE_THIS,
                vatno: '',
                addrline1: shipment.packingLists[0].shipToAddressLine1,
                addrline2: '',
                addrline3: '',
                postcode: shipment.packingLists[0].shipToPostalCode,
                phone1: '+39',
                phone2: '08119935182',
                name: shipment.packingLists[0].shipToName,
                country: shipment.packingLists[0].shipToCountryCode,
                town: shipment.packingLists[0].shipToCity,
                contactname: '',
                fax1: '',
                fax2: '',
                email: '',
                telex: '',
                province: '',
                custcountry: '',
                title: '',
              },
            ],
          },
          dimensions: allPackages.map<tntLabelsMessageDimensions>((pck, i) => ({
            '@_itemaction': ActionType.INSERT,
            itemsequenceno: (i + 1).toString(),
            itemtype: PackageTypeType.CARTON,
            itemreference: `${pck.packingList.documentNumber} ${pck.packageNumber}`,
            volume: '',
            weight: numberToFixedLengthVirtualPointString(pck.weight, 8, 3),
            length: numberToFixedLengthVirtualPointString(pck.length, 6, 3),
            height: numberToFixedLengthVirtualPointString(pck.height, 6, 3),
            width: numberToFixedLengthVirtualPointString(pck.width, 6, 3),
            quantity: '1',
          })),
        },
        articles: {
          origCountry: '',
          tariff: '',
        },
      },
    };
  }

  getDhlShipRequest(
    shipment: Shipment,
  ): SupermodelIoLogisticsExpressCreateShipmentRequest {
    const shipmentDate = new Date(Date.now() + 3600000);
    const plannedDateString =
      shipmentDate.toLocaleString('sv').replace(' ', 'T') +
      getGMTOffset(shipmentDate.getTimezoneOffset());
    const address2 = shipment.packingLists[0].shipToAddressLine2;
    return {
      plannedShippingDateAndTime: plannedDateString,
      pickup: {
        isRequested: true,
      },
      productCode: 'W',
      accounts: [
        {
          typeCode: SupermodelIoLogisticsExpressAccount.TypeCodeEnum.Shipper,
          number: '106879456',
        },
        {
          typeCode: SupermodelIoLogisticsExpressAccount.TypeCodeEnum.Payer,
          number: '106879456',
        },
        {
          typeCode:
            SupermodelIoLogisticsExpressAccount.TypeCodeEnum.DutiesTaxes,
          number: '106879456',
        },
      ],
      valueAddedServices: [{ serviceCode: 'FF' }],
      outputImageProperties: {
        encodingFormat:
          SupermodelIoLogisticsExpressCreateShipmentRequestOutputImageProperties
            .EncodingFormatEnum.Zpl,
        splitDocumentsByPages: true,
        imageOptions: [
          {
            typeCode:
              SupermodelIoLogisticsExpressCreateShipmentRequestOutputImagePropertiesImageOptions
                .TypeCodeEnum.Label,
            isRequested: true,
            templateName: 'ECOM26_A6_002',
          },
        ],
      },
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            addressLine1: 'Cis Nola isola5 lotto 537',
            cityName: 'nola',
            countryCode: 'IT',
            postalCode: '80035',
          },
          contactInformation: {
            fullName: 'Umberto',
            companyName: 'GGTeamwear',
            phone: '+3908119935182',
          },
        },
        receiverDetails: {
          postalAddress: {
            addressLine1: shipment.packingLists[0].shipToAddressLine1,
            ...(address2 ? { addressLine2: address2 } : {}),
            cityName: shipment.packingLists[0].shipToCity,
            countryCode: shipment.packingLists[0].shipToCountryCode,
            postalCode: shipment.packingLists[0].shipToPostalCode,
          },
          contactInformation: {
            fullName: shipment.packingLists[0].shipToName,
            companyName: shipment.packingLists[0].shipToName,
            phone: '+3908119935182',
          },
        },
      },
      content: {
        packages: shipment.packingLists
          .map((pl) => pl.packages)
          .flat()
          .map((pck) => ({
            weight: pck.weight,
            dimensions: {
              length: pck.length,
              width: pck.width,
              height: pck.height,
            },
            customerReferences: [
              {
                value: this.referencePlaceholder,
                typeCode:
                  SupermodelIoLogisticsExpressPackageReference.TypeCodeEnum.CU,
              },
            ],
          })),
        isCustomsDeclarable: false,
        description: 'Clothing',
        incoterm:
          SupermodelIoLogisticsExpressCreateShipmentRequestContent.IncotermEnum
            .DAP,
        unitOfMeasurement:
          SupermodelIoLogisticsExpressCreateShipmentRequestContent
            .UnitOfMeasurementEnum.Metric,
      },
      shipmentNotification: [
        {
          typeCode:
            SupermodelIoLogisticsExpressCreateShipmentRequestShipmentNotification
              .TypeCodeEnum.Email,
          receiverId: 'spedizioniamazon@ggteamwear.com',
        },
      ],
      estimatedDeliveryDate: {
        isRequested: true,
        typeCode: EstimatedDeliveryDate.TypeCodeEnum.QDDF,
      },
    };
  }

  getUpsTimeInTransitRequest(shipment: Shipment): TimeInTransitRequest {
    const allPackages = shipment.packingLists.map((pl) => pl.packages).flat();

    return {
      originCountryCode: 'IT',
      originCityName: 'nola',
      originPostalCode: '80035',
      destinationCountryCode: shipment.packingLists[0].shipToCountryCode,
      destinationCityName: shipment.packingLists[0].shipToCity,
      destinationPostalCode: shipment.packingLists[0].shipToPostalCode,
      residentialIndicator: '02',
      weight: allPackages.reduce((acc, curr) => acc + curr.weight, 0),
      weightUnitOfMeasure: 'KGS',
      billType: '02',
      numberOfPackages: allPackages.length,
    };
  }

  getUpsPaperlessUploadRequest(customsDocument: CustomsDocument) {
    return {
      UploadRequest: {
        ShipperNumber: 'F42602',
        Request: {},
        UserCreatedForm: {
          UserCreatedFormFile: customsDocument.content,
          UserCreatedFormFileFormat: 'pdf',
          UserCreatedFormFileName: customsDocument.name,
          UserCreatedFormDocumentType: '002',
        },
      },
    };
  }

  updateShipmentUps(
    shipment: Shipment,
    response: SHIPResponseWrapper,
  ): Shipment {
    const shipmentResults = response.ShipmentResponse.ShipmentResults;
    shipment.shipmentIdentificationNumber =
      shipmentResults.ShipmentIdentificationNumber;
    shipment.shipmentTrackingNumber =
      shipmentResults.ShipmentIdentificationNumber;
    shipment.charge =
      parseFloat(
        shipmentResults.NegotiatedRateCharges?.TotalCharge?.MonetaryValue,
      ) ||
      parseFloat(
        shipmentResults.ShipmentCharges?.TotalCharges?.MonetaryValue,
      ) ||
      0;
    shipment.chargeWithTax =
      parseFloat(
        shipmentResults.NegotiatedRateCharges?.TotalChargesWithTaxes
          ?.MonetaryValue,
      ) ||
      parseFloat(
        shipmentResults.ShipmentCharges?.TotalChargesWithTaxes?.MonetaryValue,
      ) ||
      0;
    shipment.billingWeight =
      parseFloat(shipmentResults.BillingWeight?.Weight) || 0;
    shipment.disclaimer =
      (shipmentResults.Disclaimer as any)?.Description || 'missing';
    // Needed because UPS sends bare object in place of Array when there is only 1 element
    if (!Array.isArray(shipmentResults.PackageResults)) {
      shipmentResults.PackageResults = [shipmentResults.PackageResults as any];
    }
    const packageResponses = shipmentResults.PackageResults;
    shipment.shipmentPackages = [];
    for (const [index, thePackage] of shipment.packingLists
      .map((pl) => pl.packages)
      .flat()
      .entries()) {
      const shipmentPackage = new ShipmentPackage();
      shipmentPackage.trackingNumber = packageResponses[index].TrackingNumber;
      shipmentPackage.label =
        packageResponses[index].ShippingLabel.GraphicImage;
      shipmentPackage.package = thePackage;
      shipment.shipmentPackages.push(shipmentPackage);
    }
    return shipment;
  }

  updateShipmentTnt(shipment: Shipment, response: tntLabelsResponse): Shipment {
    function tntLabel(
      complete: tntLabelsResponseComplete,
      packageIndex: number,
    ): string {
      const FILPART = complete.OriginDepotID;
      const NUMCOLLI = complete.ItemNo;
      const DATA = complete.Date;
      const LDV = complete.TNTConNo;
      const NOMEMITT = complete.SenderName;
      const NOMEDEST = complete.Receiver?.Name;
      const INDDEST = complete.Receiver?.Address;
      const LOCDEST = complete.Receiver?.Town;
      const FILDEST = complete.DestinationDepot?.DepotID;
      const NOMEFILDEST = complete.DestinationDepot?.DepotName;
      const SERVICE = complete.Service;
      const SPECIAL = complete.SpecialGoods;
      const HUBDEST = complete.DestinationHUB;
      const MZONA = complete.Microzone;
      const OPTIONS = complete.OperationalOption;
      const ITEMREF = complete.Item[packageIndex]?.ItemReference;
      const SNGCOL = complete.Item[packageIndex]?.ItemIncrNo;
      const BARCODE = complete.Item[packageIndex]?.Barcode;
      const SEQCOLLO = parseInt(complete.Item[packageIndex]?.ItemSequenceNo);
      const PESO = (
        parseInt(complete.Item[packageIndex]?.ItemWeight) / 1000
      ).toFixed(3);

      const labelText = `
^XA~TA000~JSN^LT0^MMT^MNW^MTD^PON^PMN^LH0,0^JMA^PR7,7^MD0^JUS^LRN^CI0^XZ
~DG000.GRF,04096,032,
,::::::::::::::::::::::::::::P057FHF40P05FHF40P017FFD40,P0KFE0O02FJF80O0BFIFE0,N017FKFD0M05FLF40L017FKFD,N03FMF80L0BFLFE0L03FMF80,M01FOFL07FNFC0K07FNF0,M03FOF80J0PFE0J03FOF8,L017FOFD0I01FPFJ017FOFD,M0IFE8002FIF80H03FHFA800BFHF80I0JF8002FIF80,L07FHFC0I07FHFC0H07FHF40H01FIFI07FHFC0I07FHFC0,L07FFE0K07FFE0H0IF80J02FHF8003FFE0K07FFE0,K01FHFC0K01FHFH07FHFL017FFD01FHFC0J0H1IF0,K03FFE0M0BFF807FF80L03FFE01FFE0M0IF8,K07FFC0M07FFC1FHFN017FF07FFC0M07FFC,K07FE0O0HFE0FFC0N03FF03FE0O0HFE,J01FHFO017FF3FFC0N01FFDFHFP07FF,K0HF80O03FF3FF0P0HF8FFC0O03FF,J01FF400404040401FIFE0040J04007FIFC04040404001FF80,J03FE00FLFE00FIF803FE0H0HFC03FHFE00FMF80FF80,J07FF01FMF01FIFC07FF801FFC03FIF01FMF01FFC0,J03FE01FMFH03FHF803FF800FFC01FHFE00FMF807FE0,J07FC01FMFH07FHFH07FFC00FFC01FHFC01FMFH07FE0,J0HF800FMFH03FFE003FFE00FFC00FHF800FMF803FE0,I01FF801FMFH01FHFH07FHF01FFC007FF801FMFH01FF0,J0HF800FMFH01FFE003FHF80FFC007FF800FMF801FF0,I01FF001557FFD55001FFC007FHFC07FC007FF001557FFD55001FF0,I01FE0J03FF80J0HF8003FHFE0FFC003FE0J03FF80J0FE0,I01FF0J03FFC0I01FFC007FIF1FFC003FF0J03FFC0I01FF0,I03FE0J03FF80J0HF8003FIF8FFC003FE0J03FF80J0HF8,I03FE0J03FFC0J0HFC007FIFCFFC001FF0J03FFC0J07FC,I03FE0J03FF80J0HF8003FIFCFFC003FE0J03FF80J07F8,I03FF0J03FFC0J0HF8007FLFC001FF0J03FFC0J07FC,I03FE0J03FF80J0HF8003FEFJFC001FE0J03FF80J0HF8,I03FE0J03FFC0J07FC007FF7FIFC001FE0J03FFC0J07FC,I03FE0J03FF80J0HF8003FE3FIFC003FE0J03FF80J07F8,I01FF0J03FFC0J0HFC007FF1FIFC003FF0J03FFC0I017FC,I01FE0J03FF80J0HF8003FE0FIFC003FE0J03FF80J0HF8,I01FF0J03FFC0I01FFC007FF07FHFC007FF0J01FFC0J0HF0,J0HFK03FF80J0HFC003FE03FHFC003FE0J03FF80J0HF0,I01FF0J03FFC0I01FFC007FF03FHFC007FF0J01FFC0I01FF0,J0HF80I03FF80I01FFE003FE01FHFC007FF80I03FF80I01FE0,J0HFC0I03FFC0I03FHFH07FF01FHFC00FHFC0I01FFC0I03FF0,J07F80I03FF80I03FFE003FE007FFC00FHF80I03FF80I03FE0,J07FD0I03FFC0H017FHFH07FF007FFC01FHFC0I01FFC0I07FD0,J03FE0I03FF80I0JF803FE003FFC03FHFE0I03FF80I0HFC0,J07FF0I03FFC0H01FIFC07FF001FFC07FIFJ01FFC0H01FFC0,J01FF80H02AA0J0JFE02AA0H02A807FIF80I0HA80I0HF80,J01FFC0O07FF7FF0O01FFDFFC0O03FF,K0HFE0O07FE3FF80N01FF8FFE0O03FE,K07FF0N01FFE1FFC0N07FF47FF0O07FE,K03FF80M03FF80FFE0N0HFE03FE80M02FF8,K01FFD0L017FFC1FHFN01FHF01FFD0M07FFC,L0IF80L0IFH03FF80L03FFC00FHF80L0IF8,L07FFC0K07FFE001FHFL01FHFC007FFC0K07FHF0,L03FHF80J0IF80H0IFE0J03FFE0H03FFE0K0IF80,L01FIF5015FIFJ07FHFD0115FHFD0H01FIF51H1JFC0,M0KFHAJFE0I03FIFHABFIF80I0JFEAABFHFE,M07FOFC0I01FPFK07FOFC,N0OFE0K02FNF80K0OFE0,N07FMFD0K01FNFL017FMFD0,O0MFE0M03FLF80M0MFE,O05FKF40N07FJFD0N05FKF4,P02FHFE80P0JFE0P02FHFE80,Q015D0R017FD0R01FF4,,:::::::::::::::::::::::::::::::::::^XA^LL1399
^PW799
^FT544,128^XG000.GRF,1,1^FS
^ID000.GRF^FS
^PW799
^LS0
^PRC^MMT^MSY^PF0^FS
^COY,56^FS
^LH0,30^FS
^LT0^FS
^LS0^FS
^FO007,011^AB,55,21^FD${FILPART}^FS
^FO007,080^AD,36,10^FDCOLLI:${SEQCOLLO}/${NUMCOLLI}^FS
^FO007,120^AD,36,10^FDPESO:${PESO} KG^FS
^FO427,077^AD,36,10^FD${OPTIONS}^FS
^FO427,187^AD,18,10^FDData:${DATA}^FS
^FO427,207^AD,36,10^FDLDV:${LDV}^FS
^FO007,180^AD,36,10^FR^FDMITTENTE ${NOMEMITT}^FS
^FO007,213^AD,36,10^FR^FD${NOMEDEST}^FS
^FO007,247^AD,36,10^FR^FD${INDDEST}^FS
^FO007,288^AD,38,18^^FR^FD${LOCDEST}^FS
^FO160,340^AD,120,40^FR^FD${FILDEST}^FS
^FO007,352^A0,98,80^FR^FD${SNGCOL}^FS
^BY3^FS
^FO70,580^BC,253,Y,N,N^FD>;${BARCODE}^FS
^FO007,447^AD,65,20^FD${NOMEFILDEST}^FS
^FO007,531^AD,36,10^FDR.C.:${ITEMREF}^FS
^FO400,240^GB0,240,247,B^FS
^FO407,244^AD,90,60^FR^FD${SPECIAL}^FS
^FO407,320^AD,90,60^FR^FD${SERVICE}^FS
^FO407,404^AD,90,60^FR^FD${HUBDEST}^FS
^FO400,493^AD,90,30^FR^FD${MZONA}^FS
^FO0680,220^A0R,40,30^FD${NOMEDEST}^FS
^FO0720,220^A0R,40,30^FDEXT1^FS
^FO007,900^AD,36,18^FD^FS
^FO007,950^AD,36,10^FD^FS
^FO007,1000^AD,36,10^FD^FS
^PQ1,0,1,Y^XZ
`;
      return Buffer.from(labelText, 'utf-8').toString('base64');
    }

    const labelComplete = response?.Label?.Complete;
    if (labelComplete === undefined) {
      shipment.error = 'No label in response';
      throw new Error('No label in response');
    }
    if (labelComplete.ConsignmentNo === undefined) {
      shipment.error = 'No shipment identifier in response';
      throw new Error('No shipment identifier in response');
    }

    shipment.shipmentIdentificationNumber = labelComplete.ConsignmentNo;
    shipment.shipmentTrackingNumber = labelComplete.ConsignmentNo;
    shipment.charge = 0;
    shipment.chargeWithTax = 0;
    shipment.billingWeight = parseInt(labelComplete.Weight) / 1000 || 0;
    shipment.disclaimer = 'No disclaimer';
    shipment.shipmentPackages = [];
    for (const [index, thePackage] of shipment.packingLists
      .map((pl) => pl.packages)
      .flat()
      .entries()) {
      const shipmentPackage = new ShipmentPackage();
      shipmentPackage.trackingNumber = labelComplete.Item[index].ItemID;
      shipmentPackage.label = tntLabel(labelComplete, index);
      shipmentPackage.package = thePackage;
      shipment.shipmentPackages.push(shipmentPackage);
    }
    return shipment;
  }

  updateShipmentDhl(
    shipment: Shipment,
    response: SupermodelIoLogisticsExpressCreateShipmentResponse,
  ): Shipment {
    function swapReference(
      label64: string,
      searchValue: string,
      packingListNumber: string,
      packageNumber: string,
    ): string {
      const labelText = Buffer.from(label64, 'base64').toString('utf-8');
      const replaced = labelText.replace(
        searchValue,
        `${packingListNumber} ${packageNumber}`,
      );
      return Buffer.from(replaced).toString('base64');
    }

    // shipment portion
    shipment.shipmentIdentificationNumber = response.dispatchConfirmationNumber;
    shipment.shipmentTrackingNumber = response.shipmentTrackingNumber;
    shipment.charge = 0;
    shipment.chargeWithTax = 0;
    shipment.billingWeight = 0;
    shipment.disclaimer = 'No disclaimer';
    shipment.shipmentPackages = [];
    for (const [index, thePackage] of shipment.packingLists
      .map((pl) => pl.packages)
      .flat()
      .entries()) {
      const shipmentPackage = new ShipmentPackage();
      shipmentPackage.trackingNumber = response.packages[index].trackingNumber;
      shipmentPackage.label = swapReference(
        response.documents[index].content,
        this.referencePlaceholder,
        thePackage.packingList.documentNumber,
        thePackage.packageNumber,
      );
      shipmentPackage.package = thePackage;
      shipment.shipmentPackages.push(shipmentPackage);
    }

    // delivery estimate portion
    shipment.estimatedDeliveryDate = dateToISODatestring(
      new Date(
        new Date(
          response.estimatedDeliveryDate.estimatedDeliveryDate,
        ).valueOf() +
          60 * 60 * 24 * 1000,
      ),
    );

    return shipment;
  }

  updateShipmentFake(shipment: Shipment): Shipment {
    shipment.charge = 10;
    shipment.chargeWithTax = 12;
    shipment.billingWeight = 15;
    shipment.shipmentIdentificationNumber = '1ZABC';
    shipment.disclaimer = 'Fake shipment with fake courier';

    shipment.shipmentPackages = [];
    for (const [index, thePackage] of shipment.packingLists
      .map((pl) => pl.packages)
      .flat()
      .entries()) {
      const shipmentPackage = new ShipmentPackage();
      shipmentPackage.trackingNumber = '1ZEEE';
      shipmentPackage.label =
        'TmVsIG1lenpvIGRlbCBjYW1taW4gZGkgbm9zdHJhIHZpdGEKbWkgcml0cm92YWkgcGVyIHVuYSBzZWx2YSBvc2N1cmEsCmNow6kgbGEgZGlyaXR0YSB2aWEgZXJhIHNtYXJyaXRhLgoKQWhpIHF1YW50byBhIGRpciBxdWFsIGVyYSDDqCBjb3NhIGR1cmEKZXN0YSBzZWx2YSBzZWx2YWdnaWEgZSBhc3ByYSBlIGZvcnRlCmNoZSBuZWwgcGVuc2llciByaW5vdmEgbGEgcGF1cmEhCgpUYW504oCZIMOoIGFtYXJhIGNoZSBwb2NvIMOoIHBpw7kgbW9ydGU7Cm1hIHBlciB0cmF0dGFyIGRlbCBiZW4gY2jigJlp4oCZIHZpIHRyb3ZhaSwKZGlyw7IgZGUgbOKAmWFsdHJlIGNvc2UgY2jigJlp4oCZIHbigJlobyBzY29ydGUuCgpJbyBub24gc28gYmVuIHJpZGlyIGNvbeKAmSBp4oCZIHbigJlpbnRyYWksCnRhbnTigJkgZXJhIHBpZW4gZGkgc29ubm8gYSBxdWVsIHB1bnRvCmNoZSBsYSB2ZXJhY2UgdmlhIGFiYmFuZG9uYWkuCgpNYSBwb2kgY2jigJlp4oCZIGZ1aSBhbCBwacOoIGTigJl1biBjb2xsZSBnaXVudG8sCmzDoCBkb3ZlIHRlcm1pbmF2YSBxdWVsbGEgdmFsbGUKY2hlIG3igJlhdmVhIGRpIHBhdXJhIGlsIGNvciBjb21wdW50bywKCmd1YXJkYWkgaW4gYWx0byBlIHZpZGkgbGUgc3VlIHNwYWxsZQp2ZXN0aXRlIGdpw6AgZGXigJkgcmFnZ2kgZGVsIHBpYW5ldGEKY2hlIG1lbmEgZHJpdHRvIGFsdHJ1aSBwZXIgb2duZSBjYWxsZS4KCkFsbG9yIGZ1IGxhIHBhdXJhIHVuIHBvY28gcXVldGEsCmNoZSBuZWwgbGFnbyBkZWwgY29yIG3igJllcmEgZHVyYXRhCmxhIG5vdHRlIGNo4oCZaeKAmSBwYXNzYWkgY29uIHRhbnRhIHBpZXRhLgoKRSBjb21lIHF1ZWkgY2hlIGNvbiBsZW5hIGFmZmFubmF0YSwKdXNjaXRvIGZ1b3IgZGVsIHBlbGFnbyBhIGxhIHJpdmEsCnNpIHZvbGdlIGEgbOKAmWFjcXVhIHBlcmlnbGlvc2EgZSBndWF0YSwKCmNvc8OsIGzigJlhbmltbyBtaW8sIGNo4oCZYW5jb3IgZnVnZ2l2YSwKc2kgdm9sc2UgYSByZXRybyBhIHJpbWlyYXIgbG8gcGFzc28KY2hlIG5vbiBsYXNjacOyIGdpw6AgbWFpIHBlcnNvbmEgdml2YS4KClBvaSBjaOKAmcOoaSBwb3NhdG8gdW4gcG9jbyBpbCBjb3JwbyBsYXNzbywKcmlwcmVzaSB2aWEgcGVyIGxhIHBpYWdnaWEgZGlzZXJ0YSwKc8OsIGNoZSDigJhsIHBpw6ggZmVybW8gc2VtcHJlIGVyYSDigJhsIHBpw7kgYmFzc28uCgpFZCBlY2NvLCBxdWFzaSBhbCBjb21pbmNpYXIgZGUgbOKAmWVydGEsCnVuYSBsb256YSBsZWdnaWVyYSBlIHByZXN0YSBtb2x0bywKY2hlIGRpIHBlbCBtYWNvbGF0byBlcmEgY292ZXJ0YTsKCmUgbm9uIG1pIHNpIHBhcnRpYSBkaW5hbnppIGFsIHZvbHRvLAphbnppIOKAmG1wZWRpdmEgdGFudG8gaWwgbWlvIGNhbW1pbm8sCmNo4oCZaeKAmSBmdWkgcGVyIHJpdG9ybmFyIHBpw7kgdm9sdGUgdsOybHRvLgoKVGVtcOKAmSBlcmEgZGFsIHByaW5jaXBpbyBkZWwgbWF0dGlubywKZSDigJhsIHNvbCBtb250YXZhIOKAmG4gc8O5IGNvbiBxdWVsbGUgc3RlbGxlCmNo4oCZZXJhbiBjb24gbHVpIHF1YW5kbyBs4oCZYW1vciBkaXZpbm8KCm1vc3NlIGRpIHByaW1hIHF1ZWxsZSBjb3NlIGJlbGxlOwpzw6wgY2jigJlhIGJlbmUgc3BlcmFyIG3igJllcmEgY2FnaW9uZQpkaSBxdWVsbGEgZmllcmEgYSBsYSBnYWV0dGEgcGVsbGUKCmzigJlvcmEgZGVsIHRlbXBvIGUgbGEgZG9sY2Ugc3RhZ2lvbmU7Cm1hIG5vbiBzw6wgY2hlIHBhdXJhIG5vbiBtaSBkZXNzZQpsYSB2aXN0YSBjaGUgbeKAmWFwcGFydmUgZOKAmXVuIGxlb25lLgoKUXVlc3RpIHBhcmVhIGNoZSBjb250cmEgbWUgdmVuaXNzZQpjb24gbGEgdGVzdOKAmSBhbHRhIGUgY29uIHJhYmJpb3NhIGZhbWUsCnPDrCBjaGUgcGFyZWEgY2hlIGzigJlhZXJlIG5lIHRyZW1lc3NlLgoKRWQgdW5hIGx1cGEsIGNoZSBkaSB0dXR0ZSBicmFtZQpzZW1iaWF2YSBjYXJjYSBuZSBsYSBzdWEgbWFncmV6emEsCmUgbW9sdGUgZ2VudGkgZsOpIGdpw6Agdml2ZXIgZ3JhbWUsCgpxdWVzdGEgbWkgcG9yc2UgdGFudG8gZGkgZ3JhdmV6emEKY29uIGxhIHBhdXJhIGNo4oCZdXNjaWEgZGkgc3VhIHZpc3RhLApjaOKAmWlvIHBlcmRlaSBsYSBzcGVyYW56YSBkZSBs4oCZYWx0ZXp6YS4KCkUgcXVhbCDDqCBxdWVpIGNoZSB2b2xvbnRpZXJpIGFjcXVpc3RhLAplIGdpdWduZSDigJhsIHRlbXBvIGNoZSBwZXJkZXIgbG8gZmFjZSwKY2hlIOKAmG4gdHV0dGkgc3VvaSBwZW5zaWVyIHBpYW5nZSBlIHPigJlhdHRyaXN0YTsKCnRhbCBtaSBmZWNlIGxhIGJlc3RpYSBzYW56YSBwYWNlLApjaGUsIHZlbmVuZG9taSDigJhuY29udHJvLCBhIHBvY28gYSBwb2NvCm1pIHJpcGlnbmV2YSBsw6AgZG92ZSDigJhsIHNvbCB0YWNlLg==';
      shipmentPackage.package = thePackage;
      shipment.shipmentPackages.push(shipmentPackage);
    }
    return shipment;
  }

  updateTimeInTransitUps(shipment: Shipment, response: TimeInTransitResponse) {
    // Needed because UPS sends bare object in place of Array when there is only 1 element
    if (!Array.isArray(response.emsResponse.services)) {
      response.emsResponse.services = [response.emsResponse.services as any];
    }
    const selectedService = response.emsResponse.services.filter((service) => {
      // the openapi is missing saturdayDeliveryIndicator and sundayDeliveryIndicator
      const serviceCast = service as any;
      return (
        serviceCast.serviceLevelDescription === 'UPS Standard' &&
        serviceCast.saturdayPickupIndicator === '0' &&
        serviceCast.saturdayDeliveryIndicator === '0'
      );
    })[0];

    if (!selectedService) {
      throw new InternalServerErrorException(
        'UPS timeInTransit reports no valid services for shipment',
      );
    }

    shipment.estimatedDeliveryDate = dateToISODatestring(
      new Date(
        new Date(selectedService.deliveryDate).valueOf() + 60 * 60 * 24 * 1000,
      ),
    );
    return shipment;
  }

  updateTimeInTransitFake(shipment: Shipment): Shipment {
    shipment.estimatedDeliveryDate = '20231110';
    return shipment;
  }

  updateCustomsDocumentUps(
    customsDocument: CustomsDocument,
    response: PAPERLESSDOCUMENTUploadResponseWrapper,
  ) {
    customsDocument.documentID =
      response.UploadResponse.FormsHistoryDocumentID.DocumentID;
  }
}
