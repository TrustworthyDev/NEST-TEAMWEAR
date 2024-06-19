import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvoiceFields1689345246354 implements MigrationInterface {
    name = 'AddInvoiceFields1689345246354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeGLN\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeName1\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeName2\` varchar(255) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeAddress1\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeAddress2\` varchar(255) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeCityName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceePostcode\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeCountryCode\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD \`invoiceeVATNumber\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeVATNumber\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeCountryCode\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceePostcode\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeCityName\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeAddress2\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeAddress1\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeName2\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeName1\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP COLUMN \`invoiceeGLN\``);
    }

}
