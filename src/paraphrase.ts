import { IsNull } from "typeorm";
import { AppDataSource } from "./data-source";
import { Article } from "./entities/article.entity";
import { QuillBot } from "./quillbot";

export class Paraphrase {
    private bot: QuillBot;
    constructor(quillBot: QuillBot) {
        this.bot = quillBot;
    }

    public async paraphraseText() {
        const articleRepository = (await AppDataSource).getRepository(Article)

        const articles: Array<Article> | null = await articleRepository.find({
            where: {
                parahprasedTxt: IsNull()
            },
            take: 1000
        });

        for (let art of articles) {
            const description = await this.bot.paraphrase(art.descript.replace('Here’s The Deal:', ''));
            console.log(description);
            console.log(art.id);
            articleRepository.update({
                id: art.id
            }, {
                parahprasedTxt: description
            })
        }
    }

}