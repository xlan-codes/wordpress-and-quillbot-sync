import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("article", { schema: "threebestreated" })
export class Article {
  @PrimaryGeneratedColumn({ type: "int", name: "id" })
    id!: number;

  @Column("text", { name: "title" })
    title!: string;

  @Column("text", { name: "address" })
    address!: string;

  @Column("text", { name: "location", nullable: true })
    location!: string | null;

  @Column("varchar", { name: "since_year", nullable: true, length: 255 })
    sinceYear!: string | null;

  @Column("varchar", { name: "phone", nullable: true, length: 255 })
    phone!: string | null;

  @Column("varchar", { name: "email", nullable: true, length: 255 })
    email!: string | null;

  @Column("text", { name: "website", nullable: true })
    website!: string | null;

  @Column("text", { name: "descript", nullable: true })
    descript: string;

  @Column("text", { name: "parahprasedTxt", nullable: true })
  parahprasedTxt: string;

  @Column("text", { name: "img", nullable: true })
    img: string;

  @Column("int", { name: "category_id" })
    categoryId!: number;
}
