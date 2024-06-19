import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1718591129924 implements MigrationInterface {
    name = ' $npmConfigName1718591129924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`package_line\` (\`id\` int NOT NULL AUTO_INCREMENT, \`shippedQuantity\` int NOT NULL, \`lineItemId\` int NULL, \`packageId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`customs_document\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` mediumtext NOT NULL, \`name\` varchar(255) NOT NULL, \`fileType\` varchar(255) NOT NULL, \`documentID\` varchar(255) NULL, \`shipmentId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shipment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('1', '2', '3', '4', '5') NOT NULL DEFAULT '1', \`charge\` decimal(10,2) NULL, \`chargeWithTax\` decimal(10,2) NULL, \`billingWeight\` double NULL, \`shipmentIdentificationNumber\` varchar(255) NULL, \`shipmentTrackingNumber\` varchar(255) NULL, \`disclaimer\` varchar(255) NULL, \`error\` varchar(255) NULL, \`courier\` varchar(255) NOT NULL, \`date\` datetime NULL, \`estimatedDeliveryDate\` date NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shipment_package\` (\`id\` int NOT NULL AUTO_INCREMENT, \`trackingNumber\` varchar(255) NOT NULL, \`label\` text NOT NULL, \`shipmentId\` int NOT NULL, \`packageId\` int NULL, UNIQUE INDEX \`REL_e6e08c8db219d94f9a5a2f7085\` (\`packageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`package\` (\`id\` int NOT NULL AUTO_INCREMENT, \`packageNumber\` varchar(255) NOT NULL, \`SSCC\` varchar(255) NOT NULL, \`width\` double NOT NULL, \`length\` double NOT NULL, \`height\` double NOT NULL, \`weight\` double NOT NULL, \`packingListId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`packing_list\` (\`id\` int NOT NULL AUTO_INCREMENT, \`documentNumber\` varchar(255) NOT NULL, \`status\` enum ('1', '2') NOT NULL DEFAULT '1', \`previouslySent\` tinyint NOT NULL, \`receivedDate\` datetime NOT NULL, \`shipToName\` varchar(255) NOT NULL, \`shipToGLN\` varchar(255) NOT NULL, \`shipToAddressLine1\` varchar(255) NOT NULL, \`shipToAddressLine2\` varchar(255) NOT NULL DEFAULT '', \`shipToCity\` varchar(255) NOT NULL, \`shipToCountryCode\` varchar(255) NOT NULL, \`shipToPostalCode\` varchar(255) NOT NULL, \`totalItems\` int NOT NULL, \`shipmentId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_order\` (\`id\` int NOT NULL AUTO_INCREMENT, \`marketplace\` varchar(255) NOT NULL, \`orderNumber\` varchar(255) NOT NULL, \`dateIssued\` date NOT NULL, \`deliveryDateStart\` date NOT NULL, \`deliveryDateEnd\` date NOT NULL, \`firstOrderStatus\` varchar(255) NOT NULL DEFAULT 'UNKNOWN', \`promotionDealNumber\` varchar(255) NOT NULL DEFAULT '', \`amazonVendorCode\` varchar(255) NOT NULL, \`buyerGLN\` varchar(255) NOT NULL, \`supplierGLN\` varchar(255) NOT NULL, \`shipToGLN\` varchar(255) NOT NULL, \`shipToCountryCode\` varchar(255) NOT NULL, \`invoiceeGLN\` varchar(255) NOT NULL, \`invoiceeName1\` varchar(255) NOT NULL, \`invoiceeName2\` varchar(255) NOT NULL DEFAULT '', \`invoiceeAddress1\` varchar(255) NOT NULL, \`invoiceeAddress2\` varchar(255) NOT NULL DEFAULT '', \`invoiceeCity\` varchar(255) NOT NULL, \`invoiceeState\` varchar(255) NOT NULL DEFAULT '', \`invoiceePostcode\` varchar(255) NOT NULL, \`invoiceeCountry\` varchar(255) NOT NULL, \`VATNumber\` varchar(255) NOT NULL, \`currencyISOCode\` varchar(255) NOT NULL, \`totalLineItemsControl\` int NOT NULL, \`packingListId\` int NULL, UNIQUE INDEX \`IDX_31be5b12a6d6197d95f07c752e\` (\`orderNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`line_item\` (\`id\` int NOT NULL AUTO_INCREMENT, \`lineItemNumber\` int NOT NULL, \`itemNumber\` varchar(255) NOT NULL, \`itemNumberType\` varchar(255) NOT NULL, \`orderedQuantity\` int NOT NULL, \`netPrice\` float NOT NULL, \`productStatus\` enum ('1', '2') NOT NULL, \`purchaseOrderId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice_line\` (\`id\` int NOT NULL AUTO_INCREMENT, \`invoicedQuantity\` int NOT NULL, \`totalNetPrice\` decimal(10,2) NOT NULL, \`netPrice\` decimal(10,2) NOT NULL, \`taxRate\` float NOT NULL, \`invoiceId\` int NULL, \`lineItemId\` int NULL, UNIQUE INDEX \`REL_b7a98961719126a4cbe9bc8a75\` (\`lineItemId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice\` (\`id\` int NOT NULL AUTO_INCREMENT, \`invoiceNumber\` varchar(255) NOT NULL, \`taxPointDate\` date NOT NULL, \`invoiceeGLN\` varchar(255) NOT NULL, \`invoiceeName1\` varchar(255) NOT NULL, \`invoiceeName2\` varchar(255) NOT NULL DEFAULT '', \`invoiceeAddress1\` varchar(255) NOT NULL, \`invoiceeAddress2\` varchar(255) NOT NULL DEFAULT '', \`invoiceeCityName\` varchar(255) NOT NULL, \`invoiceePostcode\` varchar(255) NOT NULL, \`invoiceeCountryCode\` varchar(255) NOT NULL, \`invoiceeVATNumber\` varchar(255) NOT NULL, \`invoiceTotal\` decimal(10,2) NOT NULL, \`status\` enum ('1', '2', '3') NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tax_line\` (\`id\` int NOT NULL AUTO_INCREMENT, \`VATRate\` float NOT NULL, \`taxAmount\` decimal(10,2) NOT NULL, \`taxableAmount\` decimal(10,2) NOT NULL, \`invoiceId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`line_item_acknowledgement\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('1', '2', '3') NOT NULL DEFAULT '1', \`quantityDispatching\` int NOT NULL DEFAULT '0', \`quantityBackorder\` int NOT NULL DEFAULT '0', \`quantityHardReject\` int NOT NULL DEFAULT '0', \`quantitySoftReject\` int NOT NULL DEFAULT '0', \`deliveryDate\` datetime NULL, \`netPrice\` float NOT NULL DEFAULT '0', \`vatRate\` float NOT NULL DEFAULT '0', \`lineItemId\` int NULL, \`purchaseOrderAcknowledgementId\` int NULL, UNIQUE INDEX \`REL_101faab2d44fcad931d78c81f1\` (\`lineItemId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_order_acknowledgement\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('1', '2', '3') NOT NULL DEFAULT '1', \`purchaseOrderId\` int NULL, UNIQUE INDEX \`REL_f03dcde84fbcb7679d696568cc\` (\`purchaseOrderId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`product\` (\`id\` int NOT NULL AUTO_INCREMENT, \`productNumber\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_items_mexal\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('1', '2', '3', '4', '5') NOT NULL DEFAULT '1', \`purchaseOrderId\` int NULL, \`lineItemId\` int NULL, UNIQUE INDEX \`REL_5f649750f96b853ed9dd7e2713\` (\`lineItemId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice_purchase_orders_purchase_order\` (\`invoiceId\` int NOT NULL, \`purchaseOrderId\` int NOT NULL, INDEX \`IDX_b3629b57c3a65aa1df49a83c35\` (\`invoiceId\`), INDEX \`IDX_06666dbdfe345c0fe9f53e9695\` (\`purchaseOrderId\`), PRIMARY KEY (\`invoiceId\`, \`purchaseOrderId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`package_line\` ADD CONSTRAINT \`FK_f149a75b4660766051e605b4910\` FOREIGN KEY (\`lineItemId\`) REFERENCES \`line_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`package_line\` ADD CONSTRAINT \`FK_9bd1f6340d4c0b9180567b9fb95\` FOREIGN KEY (\`packageId\`) REFERENCES \`package\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customs_document\` ADD CONSTRAINT \`FK_3c2fe679f0a02fb69875a021c68\` FOREIGN KEY (\`shipmentId\`) REFERENCES \`shipment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` ADD CONSTRAINT \`FK_0a8aa4c984d5f834a2bf5ea4d58\` FOREIGN KEY (\`shipmentId\`) REFERENCES \`shipment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` ADD CONSTRAINT \`FK_e6e08c8db219d94f9a5a2f70852\` FOREIGN KEY (\`packageId\`) REFERENCES \`package\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`package\` ADD CONSTRAINT \`FK_b1651dc1811c7a500016f77600a\` FOREIGN KEY (\`packingListId\`) REFERENCES \`packing_list\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`packing_list\` ADD CONSTRAINT \`FK_e1986ca9bd11185df792c151065\` FOREIGN KEY (\`shipmentId\`) REFERENCES \`shipment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_order\` ADD CONSTRAINT \`FK_b3724745bd002a99e2ca12c8ccd\` FOREIGN KEY (\`packingListId\`) REFERENCES \`packing_list\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`line_item\` ADD CONSTRAINT \`FK_6aeb38200b5dd21515367764f1c\` FOREIGN KEY (\`purchaseOrderId\`) REFERENCES \`purchase_order\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` ADD CONSTRAINT \`FK_d1abbe501a231d860de4e4eb597\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` ADD CONSTRAINT \`FK_b7a98961719126a4cbe9bc8a759\` FOREIGN KEY (\`lineItemId\`) REFERENCES \`line_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tax_line\` ADD CONSTRAINT \`FK_c69bf802ffee54dd1db983dc9de\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`line_item_acknowledgement\` ADD CONSTRAINT \`FK_101faab2d44fcad931d78c81f1c\` FOREIGN KEY (\`lineItemId\`) REFERENCES \`line_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`line_item_acknowledgement\` ADD CONSTRAINT \`FK_b0ddefeb9e11a9241d2e7bfdf02\` FOREIGN KEY (\`purchaseOrderAcknowledgementId\`) REFERENCES \`purchase_order_acknowledgement\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_order_acknowledgement\` ADD CONSTRAINT \`FK_f03dcde84fbcb7679d696568cc5\` FOREIGN KEY (\`purchaseOrderId\`) REFERENCES \`purchase_order\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items_mexal\` ADD CONSTRAINT \`FK_dfaf414f0eaf21b72b41412a86a\` FOREIGN KEY (\`purchaseOrderId\`) REFERENCES \`purchase_order\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items_mexal\` ADD CONSTRAINT \`FK_5f649750f96b853ed9dd7e2713f\` FOREIGN KEY (\`lineItemId\`) REFERENCES \`line_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` ADD CONSTRAINT \`FK_b3629b57c3a65aa1df49a83c358\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` ADD CONSTRAINT \`FK_06666dbdfe345c0fe9f53e96950\` FOREIGN KEY (\`purchaseOrderId\`) REFERENCES \`purchase_order\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` DROP FOREIGN KEY \`FK_06666dbdfe345c0fe9f53e96950\``);
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` DROP FOREIGN KEY \`FK_b3629b57c3a65aa1df49a83c358\``);
        await queryRunner.query(`ALTER TABLE \`order_items_mexal\` DROP FOREIGN KEY \`FK_5f649750f96b853ed9dd7e2713f\``);
        await queryRunner.query(`ALTER TABLE \`order_items_mexal\` DROP FOREIGN KEY \`FK_dfaf414f0eaf21b72b41412a86a\``);
        await queryRunner.query(`ALTER TABLE \`purchase_order_acknowledgement\` DROP FOREIGN KEY \`FK_f03dcde84fbcb7679d696568cc5\``);
        await queryRunner.query(`ALTER TABLE \`line_item_acknowledgement\` DROP FOREIGN KEY \`FK_b0ddefeb9e11a9241d2e7bfdf02\``);
        await queryRunner.query(`ALTER TABLE \`line_item_acknowledgement\` DROP FOREIGN KEY \`FK_101faab2d44fcad931d78c81f1c\``);
        await queryRunner.query(`ALTER TABLE \`tax_line\` DROP FOREIGN KEY \`FK_c69bf802ffee54dd1db983dc9de\``);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` DROP FOREIGN KEY \`FK_b7a98961719126a4cbe9bc8a759\``);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` DROP FOREIGN KEY \`FK_d1abbe501a231d860de4e4eb597\``);
        await queryRunner.query(`ALTER TABLE \`line_item\` DROP FOREIGN KEY \`FK_6aeb38200b5dd21515367764f1c\``);
        await queryRunner.query(`ALTER TABLE \`purchase_order\` DROP FOREIGN KEY \`FK_b3724745bd002a99e2ca12c8ccd\``);
        await queryRunner.query(`ALTER TABLE \`packing_list\` DROP FOREIGN KEY \`FK_e1986ca9bd11185df792c151065\``);
        await queryRunner.query(`ALTER TABLE \`package\` DROP FOREIGN KEY \`FK_b1651dc1811c7a500016f77600a\``);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` DROP FOREIGN KEY \`FK_e6e08c8db219d94f9a5a2f70852\``);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` DROP FOREIGN KEY \`FK_0a8aa4c984d5f834a2bf5ea4d58\``);
        await queryRunner.query(`ALTER TABLE \`customs_document\` DROP FOREIGN KEY \`FK_3c2fe679f0a02fb69875a021c68\``);
        await queryRunner.query(`ALTER TABLE \`package_line\` DROP FOREIGN KEY \`FK_9bd1f6340d4c0b9180567b9fb95\``);
        await queryRunner.query(`ALTER TABLE \`package_line\` DROP FOREIGN KEY \`FK_f149a75b4660766051e605b4910\``);
        await queryRunner.query(`DROP INDEX \`IDX_06666dbdfe345c0fe9f53e9695\` ON \`invoice_purchase_orders_purchase_order\``);
        await queryRunner.query(`DROP INDEX \`IDX_b3629b57c3a65aa1df49a83c35\` ON \`invoice_purchase_orders_purchase_order\``);
        await queryRunner.query(`DROP TABLE \`invoice_purchase_orders_purchase_order\``);
        await queryRunner.query(`DROP INDEX \`REL_5f649750f96b853ed9dd7e2713\` ON \`order_items_mexal\``);
        await queryRunner.query(`DROP TABLE \`order_items_mexal\``);
        await queryRunner.query(`DROP TABLE \`product\``);
        await queryRunner.query(`DROP INDEX \`REL_f03dcde84fbcb7679d696568cc\` ON \`purchase_order_acknowledgement\``);
        await queryRunner.query(`DROP TABLE \`purchase_order_acknowledgement\``);
        await queryRunner.query(`DROP INDEX \`REL_101faab2d44fcad931d78c81f1\` ON \`line_item_acknowledgement\``);
        await queryRunner.query(`DROP TABLE \`line_item_acknowledgement\``);
        await queryRunner.query(`DROP TABLE \`tax_line\``);
        await queryRunner.query(`DROP TABLE \`invoice\``);
        await queryRunner.query(`DROP INDEX \`REL_b7a98961719126a4cbe9bc8a75\` ON \`invoice_line\``);
        await queryRunner.query(`DROP TABLE \`invoice_line\``);
        await queryRunner.query(`DROP TABLE \`line_item\``);
        await queryRunner.query(`DROP INDEX \`IDX_31be5b12a6d6197d95f07c752e\` ON \`purchase_order\``);
        await queryRunner.query(`DROP TABLE \`purchase_order\``);
        await queryRunner.query(`DROP TABLE \`packing_list\``);
        await queryRunner.query(`DROP TABLE \`package\``);
        await queryRunner.query(`DROP INDEX \`REL_e6e08c8db219d94f9a5a2f7085\` ON \`shipment_package\``);
        await queryRunner.query(`DROP TABLE \`shipment_package\``);
        await queryRunner.query(`DROP TABLE \`shipment\``);
        await queryRunner.query(`DROP TABLE \`customs_document\``);
        await queryRunner.query(`DROP TABLE \`package_line\``);
    }

}
