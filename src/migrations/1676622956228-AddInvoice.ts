import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvoice1676622956228 implements MigrationInterface {
    name = 'AddInvoice1676622956228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tax_line\` (\`id\` int NOT NULL AUTO_INCREMENT, \`VATRate\` float NOT NULL, \`taxAmount\` float NOT NULL, \`taxableAmount\` float NOT NULL, \`invoiceId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice\` (\`id\` int NOT NULL AUTO_INCREMENT, \`invoiceNumber\` varchar(255) NOT NULL, \`taxPointDate\` date NOT NULL, \`invoiceTotal\` float NOT NULL, \`status\` enum ('1', '2', '3') NOT NULL DEFAULT '1', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice_line\` (\`id\` int NOT NULL AUTO_INCREMENT, \`invoicedQuantity\` int NOT NULL, \`totalNetPrice\` float NOT NULL, \`netPrice\` float NOT NULL, \`taxRate\` float NOT NULL, \`invoiceId\` int NULL, \`lineItemId\` int NULL, UNIQUE INDEX \`REL_b7a98961719126a4cbe9bc8a75\` (\`lineItemId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice_purchase_orders_purchase_order\` (\`invoiceId\` int NOT NULL, \`purchaseOrderId\` int NOT NULL, INDEX \`IDX_b3629b57c3a65aa1df49a83c35\` (\`invoiceId\`), INDEX \`IDX_06666dbdfe345c0fe9f53e9695\` (\`purchaseOrderId\`), PRIMARY KEY (\`invoiceId\`, \`purchaseOrderId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tax_line\` ADD CONSTRAINT \`FK_c69bf802ffee54dd1db983dc9de\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` ADD CONSTRAINT \`FK_d1abbe501a231d860de4e4eb597\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` ADD CONSTRAINT \`FK_b7a98961719126a4cbe9bc8a759\` FOREIGN KEY (\`lineItemId\`) REFERENCES \`line_item\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` ADD CONSTRAINT \`FK_b3629b57c3a65aa1df49a83c358\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` ADD CONSTRAINT \`FK_06666dbdfe345c0fe9f53e96950\` FOREIGN KEY (\`purchaseOrderId\`) REFERENCES \`purchase_order\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` DROP FOREIGN KEY \`FK_06666dbdfe345c0fe9f53e96950\``);
        await queryRunner.query(`ALTER TABLE \`invoice_purchase_orders_purchase_order\` DROP FOREIGN KEY \`FK_b3629b57c3a65aa1df49a83c358\``);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` DROP FOREIGN KEY \`FK_b7a98961719126a4cbe9bc8a759\``);
        await queryRunner.query(`ALTER TABLE \`invoice_line\` DROP FOREIGN KEY \`FK_d1abbe501a231d860de4e4eb597\``);
        await queryRunner.query(`ALTER TABLE \`tax_line\` DROP FOREIGN KEY \`FK_c69bf802ffee54dd1db983dc9de\``);
        await queryRunner.query(`DROP INDEX \`IDX_06666dbdfe345c0fe9f53e9695\` ON \`invoice_purchase_orders_purchase_order\``);
        await queryRunner.query(`DROP INDEX \`IDX_b3629b57c3a65aa1df49a83c35\` ON \`invoice_purchase_orders_purchase_order\``);
        await queryRunner.query(`DROP TABLE \`invoice_purchase_orders_purchase_order\``);
        await queryRunner.query(`DROP INDEX \`REL_b7a98961719126a4cbe9bc8a75\` ON \`invoice_line\``);
        await queryRunner.query(`DROP TABLE \`invoice_line\``);
        await queryRunner.query(`DROP TABLE \`invoice\``);
        await queryRunner.query(`DROP TABLE \`tax_line\``);
    }

}
