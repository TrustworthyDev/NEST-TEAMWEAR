import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { escape, unescape } from 'html-escaper';
import fetch, { Headers } from 'node-fetch';

export class TNTClient {
  private payloadBuilder: XMLBuilder;
  private soapParser: XMLParser;
  private PDFLabelReturnParser: XMLParser;

  constructor() {
    this.payloadBuilder = new XMLBuilder({
      ignoreAttributes: false,
    });
    this.soapParser = new XMLParser({
      ignoreAttributes: false,
      ignoreDeclaration: true,
      parseAttributeValue: false,
      parseTagValue: false,
      removeNSPrefix: true,
      processEntities: false,
    });
    this.PDFLabelReturnParser = new XMLParser({
      ignoreAttributes: false,
      ignoreDeclaration: true,
      parseAttributeValue: false,
      parseTagValue: false,
      isArray: (name, jpath) =>
        ['Label.Complete.IAddress', 'Label.Complete.Item'].includes(jpath),
    });
  }

  async shipment(message: tntLabelsMessage): Promise<tntLabelsResponse> {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'text/xml; charset=utf-8');
    myHeaders.append('SOAPAction', 'getPDFLabel');

    const xmlPayload = this.payloadBuilder.build(message);
    const stringPayload = escape(xmlPayload);

    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <getPDFLabel xmlns="http://services.resi.tnt.com">
          <inputXml>${stringPayload}</inputXml>
        </getPDFLabel>
      </soap:Body>
    </soap:Envelope>`;

    return fetch('https://www.mytnt.it/ResiService/services/ResiServiceImpl', {
      method: 'POST',
      headers: myHeaders,
      body: soapMessage,
      redirect: 'follow',
    })
      .then((response) => response.text())
      .then((soapEnvelope) => {
        const obj = this.soapParser.parse(soapEnvelope);
        // Need to account for everything possibly being missing
        // and avoid throwing unexpected errors from inside here
        // like reading from undefined
        const soapBody = obj?.Envelope?.Body;
        if (!soapBody) {
          throw new Error('Malformed SOAP message');
        }
        const payload: getPDFLabelReturn =
          soapBody?.getPDFLabelResponse?.getPDFLabelReturn;
        if (!payload) {
          throw new Error('Label message wrapper missing');
        }
        if (!payload.outputString) {
          throw new Error('outputString missing');
        }
        const responseXML = unescape(payload.outputString);
        const responseObject: tntLabelsResponse =
          this.PDFLabelReturnParser.parse(responseXML);
        if (payload.documentCorrect === '1') {
          return responseObject;
        } else if (payload.documentCorrect === '0') {
          const errorMessage = responseObject?.Label?.Incomplete?.Message;
          if (!errorMessage) {
            throw new Error('Unknown error');
          }
          throw new Error(errorMessage);
        } else {
          throw new Error('Invalid documentCorrect in response');
        }
      });
  }

  async voidShipment(shipmentId: string): Promise<boolean> {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'text/xml; charset=utf-8');
    myHeaders.append('SOAPAction', 'getPDFLabel');

    const message: tntLabelsMessage = {
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
          user: 'XMLSERVICE',
          password: 'sPm4z!B3XDX8Pds*',
          langid: 'IT',
        },
        consignment: {
          '@_action': ActionType.DELETE,
          consignmentno: shipmentId,
          senderAccId: '11060398',
        },
      },
    } as any;
    const xmlPayload = this.payloadBuilder.build(message);
    const stringPayload = escape(xmlPayload);

    const soapMessage = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <getPDFLabel xmlns="http://services.resi.tnt.com">
          <inputXml>${stringPayload}</inputXml>
        </getPDFLabel>
      </soap:Body>
    </soap:Envelope>`;

    return fetch('https://www.mytnt.it/ResiService/services/ResiServiceImpl', {
      method: 'POST',
      headers: myHeaders,
      body: soapMessage,
      redirect: 'follow',
    })
      .then((response) => response.text())
      .then((soapEnvelope) => {
        const obj = this.soapParser.parse(soapEnvelope);

        const soapBody = obj?.Envelope.Body;
        if (!soapBody) {
          throw new Error('Malformed SOAP message');
        }
        const payload: getPDFLabelReturn =
          soapBody?.getPDFLabelResponse?.getPDFLabelReturn;
        if (!payload) {
          throw new Error('Label message wrapper missing');
        }
        if (!payload.outputString) {
          throw new Error('outputString missing');
        }
        const responseXML = unescape(payload.outputString);
        const responseObject: tntLabelsResponse =
          this.PDFLabelReturnParser.parse(responseXML);
        if (responseObject?.Label?.Complete === undefined) {
          throw new Error('Cannot cancel shipment: Unknown error');
        }
        return true;
      });
  }
}

export interface tntLabelsMessage {
  '?xml': XMLDeclaration;
  shipment: tntLabelsMessageShipment;
}

export interface XMLDeclaration {
  '@_version': '1.0';
  '@_encoding': string;
  '@_standalone': string;
}

export interface tntLabelsMessageShipment {
  software: tntLabelsMessageSoftware;
  security: tntLabelsMessageSecurity;
  labelType?: LabelTypeType;
  consignment: tntLabelsMessageConsignment;
  articles: tntLabelsMessageArticles;
}

export interface tntLabelsMessageSoftware {
  application: 'MYRTL';
  version: '1.0';
}

export interface tntLabelsMessageSecurity {
  customer: string;
  user: string;
  password: string;
  langid: 'IT' | 'EN';
}

export interface tntLabelsMessageConsignment {
  '@_action': ActionType;
  '@_Internazionale': yesNo;
  '@_insurance': yesNo;
  '@_hazardous': yesNo;
  '@_cashondeliver': yesNo;
  '@_codcommission'?: CommissionType;
  '@_insurancecommission'?: CommissionType;
  '@_operationaloption'?: string;
  laroseDepot?: string;
  senderAccId: string;
  consignmentno?: string;
  consignmenttype: ConsignmentTypeType;
  /**KKKKKggg*/
  actualweight: string;
  actualvolume?: string;
  totalpackages: string;
  packagetype: PackageTypeType;
  division: DivisionType;
  product: ProductType;
  vehicle?: string;
  insurancevalue?: string;
  insurancecurrency?: string;
  packingdesc?: string;
  reference?: string;
  /**YYYYMMDD*/
  collectiondate: string;
  collectiontime?: string;
  invoicevalue?: string;
  invoicecurrency?: string;
  specialinstructions: string;
  options: tntLabelsMessageOptions;
  termsofpayment: CommissionType;
  systemcode: 'RL';
  systemversion: '1.0';
  codofvalue?: string;
  codofcurrency?: string;
  goodsdesc?: string;
  eomenclosure?: string;
  eomofferno?: string;
  eomdivision?: string;
  eomunification?: string;
  dropoffpoint?: string;
  addresses: tntLabelsMessageAddresses;
  dimensions: tntLabelsMessageDimensions[];
}

export interface tntLabelsMessageDimensions {
  '@_itemaction': ActionType;
  itemsequenceno?: string;
  itemtype: PackageTypeType;
  itemreference?: string;
  volume?: string;
  /**KKKKKggg*/
  weight: string;
  /**In cm. fixed point at digit 3.
   *
   * 001000 = 1 cm
   */
  length?: string;
  /**In cm. fixed point at digit 3.
   *
   * 001000 = 1 cm
   */
  height?: string;
  /**In cm. fixed point at digit 3.
   *
   * 001000 = 1 cm
   */
  width?: string;
  quantity: string;
}

export interface tntLabelsMessageOptions {
  option: string[];
}

export interface tntLabelsMessageAddresses {
  address: tntLabelsMessageAddress[];
}

export interface tntLabelsMessageAddress {
  addressType: AddressTypeType;
  vatno?: string;
  addrline1: string;
  addrline2?: string;
  addrline3?: string;
  postcode: string;
  phone1: string;
  phone2: string;
  name?: string;
  country: string;
  town: string;
  contactname?: string;
  fax1?: string;
  fax2?: string;
  email?: string;
  telex?: string;
  province?: string;
  custcountry?: string;
  title?: string;
}

export interface tntLabelsMessageArticles {
  tariff?: string;
  origCountry?: string;
}

export interface tntLabelsResponse {
  Label: tntLabelsResponseLabel;
}

export interface tntLabelsResponseLabel {
  Complete?: tntLabelsResponseComplete;
  Incomplete?;
}

export interface tntLabelsResponseComplete {
  '@_action': string;
  '@_adjustment': string;
  OriginDepotID: string;
  LaroseDepotID: string;
  ItemNo: string;
  Weight: string;
  Volume: string;
  ConsignmentNo: string;
  CheckDigits: string;
  ShipmentKey: string;
  Status: string;
  PrintInstrDocs: string;
  Date: string;
  WeekEnd: string;
  TNTConNo: string;
  WcIdTra: string;
  Triangle: string;
  TNTDate: string;
  SenderName: string;
  CustomerRef: string;
  AccountNo: string;
  SndAddress: string;
  SndAddress2: string;
  SndAddress3: string;
  SndTown: string;
  SndProvince: string;
  SndZIPCode: string;
  SndCountry: string;
  SndContactName: string;
  SndPhone: string;
  SndPhone1: string;
  SndPhone2: string;
  SndFax1: string;
  SndFax2: string;
  SndVatNo: string;
  SndEMail: string;
  OrdererVatNo: string;
  OrdererName: string;
  OrdererAddress: string;
  OrdererTown: string;
  OrdererProvince: string;
  OrdererZIPCode: string;
  OrdererCountry: string;
  OrdererContactName: string;
  OrdererPhone: string;
  OrdererEMail: string;
  SenderReference: string;
  Service: string;
  invoicevalue: string;
  invoicecurrency: string;
  InsuranceCurrency: string;
  TermsOfPayment: string;
  InsuranceCommission: string;
  termsofpayment: string;
  SpecialGoods: string;
  CODCommission: string;
  InsuranceValue: string;
  DestinationHUB: string;
  Microzone: string;
  OperationalOption: string;
  LongMicrozone: string;
  ServiceDescr: string;
  ProductDescription: string;
  OptionDescription: string;
  PremiumService: string;
  DivisionDescription: string;
  WarningMessage: string;
  Hazardous: string;
  Receiver: tntLabelsResponseReceiver;
  POINTDetails: tntLabelsResponsePOINTDetails;
  IAddress: tntLabelsResponseIAddress[];
  DestinationDepot: tntLabelsResponseDestinationDepot;
  Reference: tntLabelsResponseReference;
  Delivery: tntLabelsResponseDelivery;
  Sort: tntLabelsResponseSort;
  Routing: tntLabelsResponseRouting;
  Destination: tntLabelsResponseDestination;
  Version: tntLabelsResponseVersion;
  Sender: tntLabelsResponseSender;
  Item: tntLabelsResponseItem[];
}

export interface tntLabelsResponseReceiver {
  Name: string;
  Address: string;
  Address2: string;
  Address3: string;
  Town: string;
  ZIPCode: string;
  Province: string;
  Country: string;
  Phone: string;
  Phone1: string;
  Phone2: string;
  Fax1: string;
  Fax2: string;
  VatNo: string;
  Email: string;
  ContactName: string;
}

export interface tntLabelsResponsePOINTDetails {
  Type: string;
  POINTCode: string;
  POINTName: string;
  POINTAddress: string;
  POINTTown: string;
  POINTProvince: string;
  POINTPostCode: string;
  AltDepotCode: string;
  AltDepotDescription: string;
}

export interface tntLabelsResponseIAddress {
  IAddressType: string;
  IName: string;
  IAddressL1: string;
  IAddressL2: string;
  IAddressL3: string;
  ITown: string;
  IProvince: string;
  IZIPCode: string;
  ICountry: string;
  IContactName: string;
  IPhone1: string;
  IFax1: string;
  IVatNo: string;
  IEmail: string;
}

export interface tntLabelsResponseDestinationDepot {
  DepotID: string;
  NumericDepotID: string;
  DepotName: string;
  AltDepotAddress: string;
  AltDepotLocation: string;
}

export interface tntLabelsResponseReference {
  TNTReference: string;
  ValueCode: string;
}

export interface tntLabelsResponseDelivery {
  Town: string;
  DeliveryZone: string;
  DepotActionDate: string;
  PostCode: string;
  DepotActionDayWeek: string;
}

export interface tntLabelsResponseSort {
  LocalHubFromCountry: string;
  LocalHubFromDepot: string;
  GateWayCode: string;
  SortBuildId: string;
  SortCell: string;
  SortCellLocation: string;
}

export interface tntLabelsResponseRouting {
  RoutingDescription: string;
  SortHazardCode: string;
  SortSplitCode: string;
  ViaDepot1: string;
  ViaDepot2: string;
  ViaDepot3: string;
  ViaDepot4: string;
}

export interface tntLabelsResponseDestination {
  Town: string;
  Depot: string;
  LocalHubToDepotDescription: string;
  CountryId: string;
  CountryName: string;
  ClusterCode: string;
  LocalHubToDepot: string;
  ExtraCEE: string;
}
export interface tntLabelsResponseVersion {
  VersionApplicationCode: string;
  VersionDate: string;
  VersionMasterfileDate: string;
  VersionTime: string;
  VersionUser: string;
}
export interface tntLabelsResponseSender {
  Account: string;
  Name: string;
  Address: string;
  Town: string;
}
export interface tntLabelsResponseItem {
  '@_action': string;
  ItemID: string;
  ItemIncrNo: string;
  Barcode: string;
  ItemSequenceNo: string;
  ItemWeight: string;
  Weight: string;
  ItemReference: string;
  ItemType: string;
}

interface getPDFLabelReturn {
  binaryDocument: string;
  documentCorrect: string;
  outputString: string;
}

export const enum LabelTypeType {
  /**Thermic*/
  THERMIC = 'T',
}

export type yesNo = 'Y' | 'N';

export const enum ActionType {
  /**Insert new*/
  INSERT = 'I',
  /**Modify existing*/
  MODIFY = 'M',
  /**Delete existing*/
  DELETE = 'D',
  /**I dunno*/
  REPRINT = 'R',
}

/**Who pays commission*/
export const enum CommissionType {
  /**Sender pays commission*/
  SENDER = 'S',
  /**Receiver pays commission*/
  RECEIVER = 'R',
}

export const enum ConsignmentTypeType {
  /**TNT generates consignmentno*/
  TNT = 'T',
  /**Customer generates consignmentno*/
  CUSTOMER = 'C',
}

export const enum PackageTypeType {
  CARTON = 'C',
  ENVELOPE = 'S',
  SMALLTRUNK = 'B',
  BIGTRUNK = 'D',
}

export const enum DivisionType {
  /**The one for no extra options*/
  D_USE_THIS = 'D',
  /**The wrong one*/
  G = 'G',
}

export enum ProductType {
  /**The right one for Express no options*/
  N_USE_THIS = 'N',
  A = 'A',
  T = 'T',
  D = 'D',
  VAL12N = '12N',
  VAL12D = '12D',
  VAL10N = '10N',
  VAL10D = '10D',
  VAL09N = '09N',
  VAL09D = '09D',
  VAL15N = '15N',
  VAL15D = '15D',
  VAL412 = '412',
  VAL48N = '48N',
}

export const enum AddressTypeType {
  CLIENT = 'S',
  SENDER_USE_THIS = 'C',
  RECIPIENT_USE_THIS = 'R',
  RECEIVER = 'D',
}
