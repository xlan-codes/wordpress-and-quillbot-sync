import * as browser from './browser';
import { Builder, By, Key, until } from 'selenium-webdriver';
import "reflect-metadata";
import { AppDataSource } from "./data-source"
import { Paraphrase } from "./paraphrase"
import { Article } from './entities/article.entity';
import { QuillBot } from './quillbot';
import { SyncService } from './sync';



(async () => {
  // const articleRepository = (await AppDataSource).getRepository(Article)
  // const article = await articleRepository.findOneBy({
  //   id: 10,
  // })
  // console.log(article);

  const  bot = new QuillBot();
  await bot.login();
  // const text = await bot.paraphrase("the text that i want to parahrase");


  const sync = new SyncService(bot);
  // const parahrase = new Paraphrase(bot);
  // await parahrase.paraphraseText();
  await sync.createParentCategory();

  // console.log(text);

  // const br = await browser.getLocalBrowser();
  // try {
  //   await br.get('http://www.google.com/ncr');
  //   await br.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);
  //   await br.wait(until.titleIs('webdriver - Google Search'), 1000);
  // } finally {
  //   await br.quit();
  // }
})();