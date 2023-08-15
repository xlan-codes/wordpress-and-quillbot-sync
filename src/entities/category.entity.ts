import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("category", { schema: "threebestreated" })
export class Category {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id: number | undefined;

  @Column("varchar", { name: "category_name", nullable: true, length: 255 })
  categoryName: string | null | undefined;

  @Column("int", { name: "parent_category", nullable: true })
  parentCategory: number | null | undefined;

  @Column("tinyint", { name: "synced", nullable: true })
  synced: boolean;
}
