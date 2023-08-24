import puppeteer from 'puppeteer-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath, Browser, Page } from 'puppeteer';

import { isFalsy, isTruthy, saveJson, saveFile } from './basic';

// ** Puppeteer
puppeteer.use(stealthPlugin());

const savePage = async (path: string, page: any) => {
  saveFile(path, await page.content());
};

// * Launch
const launch = async (
  url: string,
  waitSelector: string = 'body',
  headless: boolean = false,
  slowMo: number = 30
) => {
  let options = {
    headless: headless,
    // executablePath: executablePath(),  // ? Chromium 사용(동영상 강의가 있는 경우 오류 발생)
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // ? Chrome Browser 사용
    // userDataDir: 'C:\\Users\\Jungsam\\AppData\\Local\\Google\\Chrome\\User Data',  // ^ launch 안됨
    slowMo: slowMo
  };
  const browser = await puppeteer.launch(options);
  // get existing tab/page (first item in the array)
  const [page] = await browser.pages();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US' }); // ^ page language
  await page.waitForTimeout(1000);

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (isTruthy(waitSelector)) {
    await page.waitForSelector(waitSelector);
  }

  return { page, browser };
};

// * Login
const login = async (
  id: string,
  pw: string,
  idSelector: string,
  pwSelector: string,
  page: Page,
  browser: Browser,
  submitSelector?: string,
  isSubmitByKey?: boolean,
  waitSelector?: string
) => {
  await page.type(idSelector, id);
  await page.type(pwSelector, pw);
  await page.waitForTimeout(1000);

  if (isSubmitByKey) {
    // ? Submit By Key
    await page.keyboard.press('Enter');
  } else if (isTruthy(submitSelector)) {
    await page.evaluate(() => {
      // ? Submit By Click
      let el = document.querySelector(submitSelector);
      console.log('@@@@@IN evaluate el', el);
      if (!el) {
        console.log('Button not exist!!');
      } else if (el instanceof HTMLElement) {
        console.log('### Button exist!!');
        el.click();
      } else {
        console.log('Button is not HTMLElement!!');
      }
    });
  } else {
    // ? Submit Error
    console.log('Login Submit Error');
  }

  if (isTruthy(waitSelector)) {
    await page.waitForSelector(waitSelector);
  }
  console.log('@@@@@Login End');
  return { page, browser };
};

// // * Get Url
// const getUrl = async (page: any) => {
//   const currentUrl = () => {
//     return window.location.href;
//   };
//   return await page.evaluate(currentUrl);
// };

// * Browser Accessibility
const accessibility = async (page: Page, browser: Browser, waitSec: number) => {
  let snapshot = page.accessibility.snapshot();
  console.log(snapshot);
  // saveJson('accessibility.json', snapshot)
};

// * Browser Close
const close = async (page: Page, browser: Browser, waitSec: number) => {
  await page.waitForTimeout(waitSec * 1000);
  await browser.close();
};

// & Export AREA
// &---------------------------------------------------------------------------
export {
  savePage, // [function] Save (puppeteer) Page Source
  launch, // [function async] lauch (puppeteer) Browser
  login, // [function async] login (puppeteer) in Browser
  // getUrl, // [function async] Get Url
  // accessibility, // [function async] accessibility
  close // [function async] Browser Close
};

// & Test AREA
// &---------------------------------------------------------------------------

// // ** example

// let url = 'https://accounts.kakao.com/login/?continue=https%3A%2F%2Flogins.daum.net%2Faccounts%2Fksso.do%3Frescue%3Dtrue%26url%3Dhttps%253A%252F%252Fcafe.daum.net%252F_c21_%252Fbbs_list%253Fgrpid%253DfjM0%2526fldid%253DOHl4#login';
// let waitSelector1 = 'button[type="submit"]';
// let id = 'monwater@naver.com';
// let pw = 'Answjdtka1!';
// let idSelector = 'input#loginKey--1';
// let pwSelector = 'input#password--2';

// // let submitSelector = 'button[type="submit"]';
// // #mainContent > div > div > form > div.confirm_btn > button.btn_g.highlight.submit
// // let isSubmitByKey = false;

// let submitSelector = '';
// let isSubmitByKey = true;
// let waitSelector2 = '';

// launch(url, waitSelector1)
// .then(({page, browser}) => {
//   return login(id, pw, idSelector, pwSelector, page, browser, submitSelector, isSubmitByKey, waitSelector2);
// })
// .then(({page, browser}) => {
//   close(page, browser, 30);
// })

// // ** test
// // * Launch
// (async () => {
//   let url = 'https://www.udemy.com/course/selenium-training/';
//   let options = {
//     headless: false,
//     executablePath: executablePath(),
//     slowMo: 30,
//   }
//   const browser = await puppeteer.launch(options);
//   const page = await browser.newPage();
//   await page.goto(url, {waitUntil: 'domcontentloaded'});

//   await page.waitForSelector('button[data-purpose="show-more"]');
//   await page.$eval('button[data-purpose="show-more"]', element => {
//     element.click();
//   });

//   page.waitForTimeout(100);
//   await savePage('selenium-training.html', page);
//   await browser.close();
// })();
