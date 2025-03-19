import { MigrationInterface, QueryRunner } from "typeorm";

export class Default1742426678452 implements MigrationInterface {
    name = 'Default1742426678452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "product_name" character varying NOT NULL, "description" character varying, "price" numeric(10,2) NOT NULL, "quantity_in_stock" integer NOT NULL, "imageUrl" character varying, "rating" double precision, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "totalPrice" numeric(10,2) NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "orderDate" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_products" ("product_id" uuid NOT NULL, "order_id" uuid NOT NULL, CONSTRAINT "PK_df651f408724961907ab06672fa" PRIMARY KEY ("product_id", "order_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2d58e8bd11dc840b39f99824d8" ON "order_products" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_f258ce2f670b34b38630914cf9" ON "order_products" ("order_id") `);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_199e32a02ddc0f47cd93181d8fd" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_products" ADD CONSTRAINT "FK_2d58e8bd11dc840b39f99824d84" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "order_products" ADD CONSTRAINT "FK_f258ce2f670b34b38630914cf9e" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_products" DROP CONSTRAINT "FK_f258ce2f670b34b38630914cf9e"`);
        await queryRunner.query(`ALTER TABLE "order_products" DROP CONSTRAINT "FK_2d58e8bd11dc840b39f99824d84"`);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_199e32a02ddc0f47cd93181d8fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f258ce2f670b34b38630914cf9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d58e8bd11dc840b39f99824d8"`);
        await queryRunner.query(`DROP TABLE "order_products"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TABLE "product"`);
    }

}
