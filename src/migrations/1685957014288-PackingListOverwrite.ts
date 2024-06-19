import { MigrationInterface, QueryRunner } from "typeorm";

export class PackingListOverwrite1685957014288 implements MigrationInterface {
    name = 'PackingListOverwrite1685957014288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packing_list\` ADD \`previouslySent\` tinyint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`packing_list\` DROP COLUMN \`previouslySent\``);
    }

}
