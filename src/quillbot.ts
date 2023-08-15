import { By, Key, until, WebDriver } from 'selenium-webdriver';
import { setTimeout } from 'timers/promises';
import * as browser from './browser';


export class QuillBot {

    quillBotUrl: String = 'https://quillbot.com';
    br!: WebDriver;
    constructor() {

    }


    public async paraphrase(text: String): Promise<string> {
        await this.br.get(this.quillBotUrl.toString());
        await setTimeout(1000 * 60);
        await this.br.findElement(By.id("modes-Formal")).click();
        // await this.br.findElement(By.xpath("//*[@id=\"inOutContainer\"]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/div/div[2]/div/div/div[2]/button")).click();
        await this.br.findElement(By.xpath("/html/body/div[1]/div[2]/div[3]/section[1]/div/div/div/div/div/div/div/div/div/div[1]/div[2]/div[2]/div/div[1]/div/div/div[1]/div/div")).click();
        // await this.br.findElement(By.id("inputText")).click();
        await this.br.findElement(By.id("inputText")).sendKeys(text.toString(), Key.RETURN);
        try {
            await this.br.findElement(By.xpath("//*[@id=\"InputBottomQuillControl\"]/div/div/div/div[2]/div/div/div/div/button")).click();
            await setTimeout(1000 * 60, "test")
        } catch (error) {
            
        }
        const textParaphrased = await this.br.findElement(By.xpath("//*[@id=\"outputText\"]/div[1]")).getText();
        return textParaphrased;
    }

    public async login(): Promise<void> {
        const loginUrl = this.quillBotUrl + '/login?returnUrl=/'
        this.br = await browser.getLocalBrowser();
        await this.br.get(loginUrl);
        const username = await this.br.wait(until.elementLocated(By.xpath("//input[@type=\"text\"]")))
        await username.sendKeys("info@aaaccessory.com", Key.RETURN);
        const password = await this.br.wait(until.elementLocated(By.xpath("//input[@type=\"password\"]")))
        await password.sendKeys("aateam2021!", Key.RETURN);
        // const loginButton = await this.br.findElement(By.xpath("//*[@id=\"loginContainer\"]/div/div[6]/button"));

        try {
            var searchBox = this.br.findElement(By.className("auth-btn"));
            const loginButton = await this.br.wait(until.elementIsVisible(searchBox));
            // await loginButton.click();
            const test = await this.br.executeScript(`
                const collection = document.getElementsByClassName("auth-btn");
                collection[0].click();
                console.log(document);
            `)
            console.log(test);
            await setTimeout(1000 * 60);
        } catch (error: any) {   
            console.log("quillbot login problem -> ", error.message);
        }
    } 

}