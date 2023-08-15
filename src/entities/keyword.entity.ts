import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("keyword", { schema: "threebestreated" })
export class Keyword {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
  id!: number;

  @Column("varchar", { name: "keyword", nullable: true, length: 255 })
  keyword!: string | null;

  @Column("int", { name: "category_id" })
  categoryId!: number;

  @Column("int", { name: "post_id" })
  postId!: number;
}
