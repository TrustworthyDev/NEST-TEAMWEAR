import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPackageLineRelation1685973894840 implements MigrationInterface {
  name = 'FixPackageLineRelation1685973894840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX \`FK_f149a75b4660766051e605b4910\` ON \`package_line\` (\`lineItemId\`)`,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_f149a75b4660766051e605b491\` ON \`package_line\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`REL_f149a75b4660766051e605b491\` ON \`package_line\` (\`lineItemId\`)`,
    );
    await queryRunner.query(
      `DROP INDEX \`FK_f149a75b4660766051e605b4910\` ON \`package_line\``,
    );
  }
}
