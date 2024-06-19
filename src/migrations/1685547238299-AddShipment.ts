import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShipment1685547238299 implements MigrationInterface {
    name = 'AddShipment1685547238299'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`package_line\` (\`id\` int NOT NULL AUTO_INCREMENT, \`shippedQuantity\` int NOT NULL, \`lineItemId\` int NULL, \`packageId\` int NULL, UNIQUE INDEX \`REL_f149a75b4660766051e605b491\` (\`lineItemId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shipment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('1', '2', '3', '4', '5') NOT NULL DEFAULT '1', \`charge\` decimal(10,2) NULL, \`chargeWithTax\` decimal(10,2) NULL, \`billingWeight\` double NULL, \`shipmentIdentificationNumber\` varchar(255) NULL, \`disclaimer\` varchar(255) NULL, \`error\` varchar(255) NULL, \`courier\` varchar(255) NOT NULL, \`date\` datetime NULL, \`estimatedDeliveryDate\` date NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shipment_package\` (\`id\` int NOT NULL AUTO_INCREMENT, \`trackingNumber\` varchar(255) NOT NULL, \`label\` text NOT NULL, \`shipmentId\` int NOT NULL, \`packageId\` int NULL, UNIQUE INDEX \`REL_e6e08c8db219d94f9a5a2f7085\` (\`packageId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`package\` (\`id\` int NOT NULL AUTO_INCREMENT, \`packageNumber\` varchar(255) NOT NULL, \`SSCC\` varchar(255) NOT NULL, \`width\` double NOT NULL, \`length\` double NOT NULL, \`height\` double NOT NULL, \`weight\` double NOT NULL, \`packingListId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`packing_list\` (\`id\` int NOT NULL AUTO_INCREMENT, \`documentNumber\` varchar(255) NOT NULL, \`status\` enum ('1', '2') NOT NULL DEFAULT '1', \`receivedDate\` datetime NOT NULL, \`shipToName\` varchar(255) NOT NULL, \`shipToGLN\` varchar(255) NOT NULL, \`shipToAddressLine1\` varchar(255) NOT NULL, \`shipToAddressLine2\` varchar(255) NOT NULL DEFAULT '', \`shipToCity\` varchar(255) NOT NULL, \`shipToCountryCode\` varchar(255) NOT NULL, \`shipToPostalCode\` varchar(255) NOT NULL, \`totalItems\` int NOT NULL, \`shipmentId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`purchase_order\` ADD \`packingListId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`package_line\` ADD CONSTRAINT \`FK_f149a75b4660766051e605b4910\` FOREIGN KEY (\`lineItemId\`) REFERENCES \`line_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`package_line\` ADD CONSTRAINT \`FK_9bd1f6340d4c0b9180567b9fb95\` FOREIGN KEY (\`packageId\`) REFERENCES \`package\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` ADD CONSTRAINT \`FK_0a8aa4c984d5f834a2bf5ea4d58\` FOREIGN KEY (\`shipmentId\`) REFERENCES \`shipment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` ADD CONSTRAINT \`FK_e6e08c8db219d94f9a5a2f70852\` FOREIGN KEY (\`packageId\`) REFERENCES \`package\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`package\` ADD CONSTRAINT \`FK_b1651dc1811c7a500016f77600a\` FOREIGN KEY (\`packingListId\`) REFERENCES \`packing_list\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`packing_list\` ADD CONSTRAINT \`FK_e1986ca9bd11185df792c151065\` FOREIGN KEY (\`shipmentId\`) REFERENCES \`shipment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_order\` ADD CONSTRAINT \`FK_b3724745bd002a99e2ca12c8ccd\` FOREIGN KEY (\`packingListId\`) REFERENCES \`packing_list\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`purchase_order\` DROP FOREIGN KEY \`FK_b3724745bd002a99e2ca12c8ccd\``);
        await queryRunner.query(`ALTER TABLE \`packing_list\` DROP FOREIGN KEY \`FK_e1986ca9bd11185df792c151065\``);
        await queryRunner.query(`ALTER TABLE \`package\` DROP FOREIGN KEY \`FK_b1651dc1811c7a500016f77600a\``);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` DROP FOREIGN KEY \`FK_e6e08c8db219d94f9a5a2f70852\``);
        await queryRunner.query(`ALTER TABLE \`shipment_package\` DROP FOREIGN KEY \`FK_0a8aa4c984d5f834a2bf5ea4d58\``);
        await queryRunner.query(`ALTER TABLE \`package_line\` DROP FOREIGN KEY \`FK_9bd1f6340d4c0b9180567b9fb95\``);
        await queryRunner.query(`ALTER TABLE \`package_line\` DROP FOREIGN KEY \`FK_f149a75b4660766051e605b4910\``);
        await queryRunner.query(`ALTER TABLE \`purchase_order\` DROP COLUMN \`packingListId\``);
        await queryRunner.query(`DROP TABLE \`packing_list\``);
        await queryRunner.query(`DROP TABLE \`package\``);
        await queryRunner.query(`DROP INDEX \`REL_e6e08c8db219d94f9a5a2f7085\` ON \`shipment_package\``);
        await queryRunner.query(`DROP TABLE \`shipment_package\``);
        await queryRunner.query(`DROP TABLE \`shipment\``);
        await queryRunner.query(`DROP INDEX \`REL_f149a75b4660766051e605b491\` ON \`package_line\``);
        await queryRunner.query(`DROP TABLE \`package_line\``);
    }

}
