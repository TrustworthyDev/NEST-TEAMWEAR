import { MigrationInterface, QueryRunner } from 'typeorm';

export class RevertTaxRate1684220332405 implements MigrationInterface {
  name = 'RevertTaxRate1684220332405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`taxRate\` float NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`invoice_line\` MODIFY COLUMN \`taxRate\` decimal NOT NULL`,
    );
  }
}
