import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1742946203105 implements MigrationInterface {
    name = 'Default1742946203105'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hashedRefreshToken"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "hashedRefreshToken" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hashedRefreshToken"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "hashedRefreshToken" character varying`);
    }

}
