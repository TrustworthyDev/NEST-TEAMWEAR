import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomsDocument1686210212338 implements MigrationInterface {
    name = 'AddCustomsDocument1686210212338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`customs_document\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` mediumtext NOT NULL, \`name\` varchar(255) NOT NULL, \`fileType\` varchar(255) NOT NULL, \`documentID\` varchar(255) NULL, \`shipmentId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`customs_document\` ADD CONSTRAINT \`FK_3c2fe679f0a02fb69875a021c68\` FOREIGN KEY (\`shipmentId\`) REFERENCES \`shipment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customs_document\` DROP FOREIGN KEY \`FK_3c2fe679f0a02fb69875a021c68\``);
        await queryRunner.query(`DROP TABLE \`customs_document\``);
    }

}
