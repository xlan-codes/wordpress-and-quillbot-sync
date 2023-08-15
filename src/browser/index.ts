
import * as os from 'os'
import path from 'path'
import * as webdriver from 'selenium-webdriver';
import {Browser, Builder, By, Key, until} from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome'
import {Options} from 'selenium-webdriver/firefox'
import * as ChromeDriver from 'chromedriver';

export async function getLocalBrowser() {
    let exeName = {
        "Linux": "./bin/chromedriver-linux",
        "Darwin": "./bin/geckodriver",
        "Windows_NT": "./bin/chromedriver.exe"
    } as any;

    let exeLocation = path.resolve(__dirname, path.relative(__dirname, exeName[os.type()]));
    // let service = new chrome.ServiceBuilder(exeLocation).build();
    // let driver = new chrome.Driver(new webdriver.Session("1", webdriver.Capabilities.chrome()), service);
    // let driverWindow = driver.manage().window();
    // driverWindow.maximize();
    let options = new Options();
    console.log(exeLocation);
    // options.setBinary(exeLocation)
    let driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();

    return driver;
}
