import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFloats1683020873041 implements MigrationInterface {
  name = 'RemoveFloats1683020873041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tax_line\` MODIFY COLUMN \`taxAmount\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tax_line\` MODIFY COLUMN \`taxableAmount\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice\` MODIFY COLUMN \`invoiceTotal\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`totalNetPrice\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`netPrice\` decimal(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`taxRate\` decimal(10,2) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`taxRate\` float NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`netPrice\` float NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`totalNetPrice\` float NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`invoice\` MODIFY COLUMN \`invoiceTotal\` float NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tax_line\` MODIFY COLUMN \`taxableAmount\` float NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tax_line\` MODIFY COLUMN \`taxAmount\` float NOT NULL`,
    );
  }
}
