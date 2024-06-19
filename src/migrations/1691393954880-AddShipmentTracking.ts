import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShipmentTracking1691393954880 implements MigrationInterface {
  name = 'AddShipmentTracking1691393954880';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`shipment\` ADD \`shipmentTrackingNumber\` varchar(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`shipment\` DROP COLUMN \`shipmentTrackingNumber\``,
    );
  }
}
