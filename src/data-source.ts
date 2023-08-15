import { DataSource } from "typeorm";
import { Article } from "./entities/article.entity";
import { Category } from "./entities/category.entity";


export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "",
    database: "threebestrated",
    synchronize: true,
    logging: process.env.DEBUG === 'true' ? true: false,
    // entities: [],
    entities: [Article, Category],
    subscribers: [],
    migrations: [],
}).initialize()
