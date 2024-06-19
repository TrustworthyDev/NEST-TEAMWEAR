import { Package } from 'src/package/entities/package.entity';
import { PackingList } from './entities/packing-list.entity';
import {
  Label,
  PrintDensity,
  PrintDensityName,
  Spacing,
  Text,
  FontFamily,
  FontFamilyName,
  AlignmentValue,
  Alignment,
  Grid,
  Size,
  SizeType,
  Box,
  Barcode,
  BarcodeTypeName,
  BarcodeType,
  Line,
  Raw,
} from 'jszpl';
import { concatToBase64String } from 'src/common/util/misc-util';

export function appendCartonLabels(packingList: PackingList) {
  for (const [index, thePackage] of packingList.packages.entries()) {
    cartonLabelForPackage(
      index + 1,
      packingList.packages.length,
      thePackage,
      packingList,
    );
  }
}

function cartonLabelForPackage(
  packageIndex: number,
  totalPackages: number,
  thePackage: Package,
  packingList: PackingList,
) {
  const quantityInPackage = thePackage.packageLines.reduce(
    (acc, pcklin) => acc + pcklin.shippedQuantity,
    0,
  );
  // All of the same itemNumber? else say mixed SKUs
  const itemNumberLine = thePackage.packageLines.every(
    (v, i, a) =>
      i === 0 || v.lineItem.itemNumber === a[i - 1].lineItem.itemNumber,
  )
    ? `EAN:\n${thePackage.packageLines[0].lineItem.itemNumber}`
    : 'Mixed SKUs';

  const packingListNumber = packingList.documentNumber.replace(
    new RegExp('[/_]', 'g'),
    '',
  );

  const label = new Label();
  Label.printDensity = new PrintDensity(PrintDensityName['8dpmm']);
  label.width = 101.6;
  label.height = 152.4;
  // dotWidth = 812; dotHeight = 1218;
  label.padding = new Spacing(0);

  const reset = new Raw();
  label.content.push(reset);
  reset.data = '^LH0,0\n^BY2';

  // vertical top
  const line1 = new Box();
  label.content.push(line1);
  line1.fill = true;
  line1.left = 404;
  line1.top = 0;
  line1.width = 2;
  line1.height = 191;

  // vertical bottom
  const line2 = new Box();
  label.content.push(line2);
  line2.fill = true;
  line2.left = 312;
  line2.top = 191;
  line2.width = 2;
  line2.height = 710;

  // horizontal top
  const line3 = new Box();
  label.content.push(line3);
  line3.fill = true;
  line3.left = 0;
  line3.top = 191;
  line3.width = 1218;
  line3.height = 2;

  // horizontal bottom
  const line4 = new Box();
  label.content.push(line4);
  line4.fill = true;
  line4.left = 0;
  line4.top = 900;
  line4.width = 1218;
  line4.height = 2;

  // Ship from
  const text1 = new Text();
  label.content.push(text1);
  text1.fontFamily = new FontFamily(FontFamilyName.D);
  text1.characterWidth = 10;
  text1.text =
    "Ship From:\nGG TeamWear\nLocalita' Boscofangone\nCis Nola isola 3 lotto 338\nNola,\nIT, 80035";
  text1.left = 20;
  text1.top = 20;

  // Ship to
  const text2 = new Text();
  label.content.push(text2);
  text2.width = 398;
  text2.fontFamily = new FontFamily(FontFamilyName.D);
  text2.text = `Ship To:\n${packingList.shipToName}\n${packingList.shipToAddressLine1}\n\n${packingList.shipToAddressLine2}\n${packingList.shipToCity},\n${packingList.shipToCountryCode}, ${packingList.shipToPostalCode}`;
  text2.left = 414;
  text2.top = 20;

  // Items
  const text3 = new Text();
  label.content.push(text3);
  text3.fontFamily = new FontFamily(FontFamilyName.D);
  text3.text = itemNumberLine;
  text3.left = 30;
  text3.top = 318;

  // Quantity
  const text4 = new Text();
  label.content.push(text4);
  text4.fontFamily = new FontFamily(FontFamilyName.D);
  text4.text = `Qty: ${quantityInPackage}`;
  text4.left = 30;
  text4.top = 504;

  // Carton number
  const text5 = new Text();
  label.content.push(text5);
  text5.fontFamily = new FontFamily(FontFamilyName.D);
  text5.text = `Carton#: ${packageIndex} of ${totalPackages}`;
  text5.left = 30;
  text5.top = 660;

  // ASN text
  const text6 = new Text();
  label.content.push(text6);
  text6.fontFamily = new FontFamily(FontFamilyName.D);
  text6.text = `ASN: ${packingListNumber}`;
  text6.left = 322;
  text6.top = 210;

  // ASN barcode
  const barcode1 = new Barcode();
  label.content.push(barcode1);
  barcode1.type = new BarcodeType(BarcodeTypeName.Code128);
  barcode1.left = 380;
  barcode1.top = 500;
  barcode1.height = 104;
  barcode1.data = `ASN${packingListNumber}`;

  // SSCC text
  const text7 = new Text();
  label.content.push(text7);
  text7.fontFamily = new FontFamily(FontFamilyName.D);
  text7.text = 'Serial Shipping Container Code (SSCC):';
  text7.left = 50;
  text7.top = 910;

  // SSCC barcode
  const barcode2 = new Barcode();
  label.content.push(barcode2);
  barcode2.type = new BarcodeType(BarcodeTypeName.Code128);
  barcode2.left = 170;
  barcode2.top = 980;
  barcode2.height = 150;
  barcode2.data = thePackage.SSCC;

  const labelText = label.generateZPL();

  const newLabel = concatToBase64String(
    thePackage.shipmentPackage.label,
    labelText + '\n',
  );
  thePackage.shipmentPackage.label = newLabel;
}
