/** UdemyWeb
 *
 * Description
 *   - A Class For Scrapping Udemy Web
 *
 * Functions
 *   [X] login udemy.com
 *
 *   [X] courseList
 *   [X] courseDetail
 *   [X] curriculum
 *   [X] transript
 *   [X] handout
 *
 *   [X] purchaseHistory
 *
 * Usages
 *   -
 *
 * Requirements
 *   - Create `udemy` web account(Register at `udemy.com`)
 *
 * References
 *   -
 *
 * Authors
 *   - Moon In Learn <mooninlearn@gmail.com>
 *   - JnJsoft Ko <jnjsoft.ko@gmail.com>
 */

// & Import AREA
// &---------------------------------------------------------------------------
// ? Builtin Modules
import fs from 'fs';

// ? External Modules
import dotenv from 'dotenv';

// ? UserMade Modules
import { includesMulti, loadJson, saveFile, saveJson, moveFile, sleep } from 'jnj-lib-base';

// ? Local Modules
import {
  UDEMY_WEB_EMAIL, // udemy(web) email
  UDEMY_WEB_PASSWORD, // udemy(web) password
  DOWNLOAD_EXTS,
  folder_download, // 다운로드 폴더(PC 계정에 따라 다름)

  // ? html
  html_course_list, // (등록)코스 목록
  html_course_detail, // 강의 상세 페이지
  html_curriculum, // 커리큘럼(active)
  // html_curriculum_draft, // 커리큘럼(draft)
  html_purchase_history, // 구매 내역

  // ? json(list)
  json_list_courses_basic, // (등록)코스 목록(기본 정보 포함)
  json_list_courses_active, // (활성) 코스 목록(기본 정보, courseInfo(api) 포함)
  json_list_courseIds_draft, // (draft)코스 아이디 배열
  json_list_courseTitles_active, // (활성)코스 제목(kebab-case) 배열

  // ? json(courseInfo)
  json_course_info_api, // courseInfo(from api)
  json_course_info_web, // courseInfo(from web(courseDetail))
  // json_course_info_web2,  // courseInfo(from web(curriculum))
  json_course_info_mix, // courseInfo(api + web)

  // ? json(curriculum)
  json_curriculum_api, // curriculum(from api)
  json_curriculum_web, // curriculum(from web(courseDetail))
  // json_curriculum_web2, // curriculum(from web(curriculum))
  json_curriculum_mix, // curriculum(api + web)

  // ? folder(course)
  folder_courses_transcript, // transcript(자막, lang:(english|korean), web)
  folder_courses_content, // 동영상이 없는 강의, 내용
  folder_courses_handouts, // Resource(수업 자료) 다운로드 파일 폴더
  file_courses_handoutList, // Resource(수업 자료) 위치 정보(handout 다운로드시 사용)
  folder_courses_markdown_notes, // 강의 정리 노트용(from transcript + content)
  folder_courses_markdown_backups // 강의 정리 노트 원본 백업용
} from '../src/globals';

import { cheerFromFile } from '../src/utils/cheer';

import { savePage, launch, login } from '../src/utils/spider';
import { courseIdByCourseTitle } from './udemyData';
// import { isFalsy, isTruthy, readJson, saveFile, saveJson, savePage, sleep } from './utils/basic';

// & Variable AREA
// &---------------------------------------------------------------------------
dotenv.config(); // 실행 경로에 있는 `.env`
const settingsPath = process.env.ENV_SETTINGS_PATH ?? 'C:/JnJ-soft/Developments/_Settings';

// * URL
const BASE_URL = 'https://www.udemy.com';
const locale = (lang) => (lang.includes('한국') ? 'ko_KR' : 'en_US');
const login_slug = (lang) => `/join/login-popup/?locale=${locale(lang)}&response_type=html`;
// const LOGIN_SLUG = '/join/login-popup/?locale=ko_KR&response_type=html';
// const LOGIN_SLUG = '/join/login-popup/?locale=en_US&response_type=html';
const REGISTERED_COURSE_SLUG = '/home/my-courses/learning/?sort=-enroll_time';
const PURCHASE_HISTORY_LIST_SLUG = '/dashboard/purchase-history/';

const course_detail_slug = (title) => `/course/${title}`;

const curriculum_slug = (title) => {
  let slug = `/course/${title}/learn/lecture`;
  if (/^\d+$/.test(title)) {
    slug = `/course-dashboard-redirect/?course_id=${title}`;
  }
  return slug;
};

const lecture_slug = (title, lectureId) => {
  let slug = `/course/${title}/learn/lecture/${lectureId}`;
  if (/^\d+$/.test(title)) {
    slug = `/course/draft/${title}/learn/lecture/${lectureId}`;
  }
  return slug;
};

// * Selectors
// ? Login Page
const idSelector = 'input[name="email"]';
const pwSelector = 'input[name="password"]';
const submitSelector = 'button[type="submit"]';
const waitSelector = 'button[type="submit"]';

// * settings
// const DOWNLOAD_EXTS = ['.pdf', '.zip']; // 강좌 `수업자료` 다운로드 파일 확장자

// * selectors
// const INPUT_UDEMY_LOGIN_EMAIL = 'input[name="email"]';
// const INPUT_UDEMY_LOGIN_PASSWORD = 'input[name="password"]';
// const BUTTON_UDEMY_LOGIN_SUBMIT = 'button[type="submit"]';
// const BUTTON_UDEMY_PAGINATION_NEXT = 'a[data-page="+1"]';

// & Function AREA
// &---------------------------------------------------------------------------
// ^ Private Functions
// ^---------------------------------------------------------------------------
// * Utils
// const includesMulti = (s: string, arr: string[]) => {
//   for (let a of arr) {
//     if (s.includes(a)) {
//       return true;
//     }
//   }
//   return false;
// };
const renameHandoutTitle = (title) => {
  return title.replaceAll(' ', '+');
};

/** udemyUserInfo
 */
const udemyUserInfo = (nick) => loadJson(`${settingsPath}/Apis/udemy.json`)[nick];
// const udemyUserInfo = (nick) =>
//   loadJson(`C:/JnJ-soft/Developments/_Settings/Apis/udemy.json`)[nick];

// * Scrapping
// *
/** tourByClick
 *  페이지 이동(Next 클릭) & Save Html
 * @note courseList, purchaseHistory에 사용
 */
const tourByClick = async ({
  cbPath,
  page,
  browser,
  nextSelector = '*[data-testid="rnc-pagination"] > a:nth-last-child(2)',
  save = true
}) => {
  await page.waitForTimeout(3000);
  if (save) {
    savePage(cbPath(0), page); // 페이지 저장
  }
  await page.waitForTimeout(3000);

  // ? 페이지 개수
  let pageNum = await page.$eval(nextSelector, (el) => el.innerText);

  // ? pagenation(next) 클릭
  const nextBtnSelector = 'a[data-page="+1"]';
  for (let i = 1; i < parseInt(pageNum); i++) {
    await page.click(nextBtnSelector); // pagenation 클릭
    await page.waitForTimeout(3000);
    if (save) {
      await savePage(cbPath(i), page); // 페이지 저장
    }
    await page.waitForSelector(nextSelector);
  }

  return { page, browser };
};

/** courseDetail
 *  강좌 상세페이지
 */
const courseDetail = async ({ page, browser, title }) => {
  const buttonViewCurriculum = 'div[data-index="1"] > div > button';
  const buttonShowMore = 'button[data-purpose="expand-toggle"]'; // [aria-expanded="false"]

  await page.waitForTimeout(2000);

  // ? `강의내용` 버튼 클릭
  const $buttonViewCurriculum = await page.$(buttonViewCurriculum);
  if ($buttonViewCurriculum) {
    // console.log(`###무료강의 '강의내용 Tab' 클릭, ${title}`);
    await page.evaluate((element) => {
      element.click();
    }, $buttonViewCurriculum);
  } else {
    // console.log(`###유료강의 '강의내용 Tab' 없음, ${title}`);
  }

  // ? `더 보기` 버튼 클릭
  const $buttonShowMore = await page.$(buttonShowMore);
  if ($buttonShowMore) {
    // console.log(`!!!확장' 클릭 ${title}`);
    await page.evaluate((element) => {
      element.click();
    }, $buttonShowMore);
  } else {
    // console.log(`!!!확장' 버튼 없음 ${title}`);
  }

  // page.waitForTimeout(1000);
  await savePage(`_files/html/courseDetail/${title}.html`, page);
  page.waitForTimeout(1000);

  return { page, browser };
};

/** curriculum
 *  강의실 페이지
 * @param title: courseTitle(active course) / courseId(draft course)
 */
const curriculum = async ({ page, browser, title, save = true }) => {
  // ? click 강의 내용 리스트 확장 버튼
  let buttonExpandeds = 'h3[class="ud-accordion-panel-heading"] button[aria-expanded="false"]';
  let buttonShowMore = 'button[data-css-toggle-id^="show-more"]'; // <span class="show-more-module--show-more--2bohq">더 보기</span>
  let divCurriculumSection = 'div[data-purpose="curriculum-section-container"]';

  await page.waitForTimeout(5000);

  // // ? 더 보기 버튼 클릭
  // const $buttonShowMore = await page.$(buttonShowMore);
  // if ($buttonShowMore) {
  //   await page.evaluate((element) => {
  //     element.click();
  //   }, $buttonShowMore);
  // }

  // Section(Chapter)별 확장 버튼 클릭
  let $lectureEls = await page.$$(buttonExpandeds);
  // console.log(`@@@ 닫힌 버튼 개수: ${$lectureEls.length}`);
  let $lectureEls_ = await page.$$('h3[class="ud-accordion-panel-heading"]');
  // console.log(`@@@ 확장 전체 버튼 개수: ${$lectureEls_.length}`);

  for (let $lectureEl of $lectureEls) {
    //html handler (solution)
    await page.evaluate((element) => {
      element.click();
    }, $lectureEl);
    // await $lectureEl.click(); // ! at async UdemyWeb.curriculum (file:///C:/JnJ-soft/Projects/internal/jnj_tools/learning-tools/jnj-learning-tools/jnj-learning-tool-udemy/src/UdemyWeb.ts:215:7)
  }

  sleep(3);
  // ? OnceMore 열리지 않은 경우 대비
  $lectureEls = await page.$$(buttonExpandeds);
  if ($lectureEls.length > 0) {
    // console.log(`@@@ 열리지 않았던 확장버튼 개수: ${$lectureEls.length}`);
    for (let $lectureEl of $lectureEls) {
      await page.evaluate((element) => {
        element.click();
      }, $lectureEl);
    }
  }

  if (save) {
    await savePage(html_curriculum(title), page);
  }

  return { page, browser, title };
};

/** lectureIds
 * lectureIds From Web(Curriculum Page) For draft course
 * save to _files/json/curriculum/lectureIds/${courseId}.json
 */
const lectureIdsFromWeb = async ({ nick, title }) => {
  const udemyWeb = new UdemyWeb(nick, curriculum_slug(title));
  let { page, browser } = await udemyWeb.udemyLogin();
  sleep(3);
  await curriculum({ page, browser, title, save: false });
  sleep(3);
  // // * lecture click & getUrl -> save
  // const $lectureEls = await page.$$('li[class^="curriculum-item-link--curriculum"]');
  const $lectureEls = await page.$$(
    'div[class^="curriculum-item-link--bottom-row"] > div > button'
  );
  // console.log(`$lectureEls.length: ${$lectureEls.length}`);
  let lectureIds = [];
  for (let $lectureEl of $lectureEls) {
    // for (let i = 0; i < $lectureEls.length; i++) {
    //   let $lectureEl = $lectureEls[i];
    await $lectureEl.click();
    sleep(3);
    // const url = page.evaluate(() => document.location.href);
    const url = await page.url();
    lectureIds.push(url.split('#')[0].split('/').slice(-1)[0]);
  }
  // console.log(lectureIds);
  const courseId = courseIdByCourseTitle(title);
  saveJson(`_files/json/curriculum/lectureIds/${courseId}.json`, lectureIds);
  browser.close();
  // return lectureIds;
};

/** fixTransciptLanguage(대본)
 * Fix Transcipt Language(대본 언어 설정)
 * lang: "한국"|"영어"
 */
const fixTransciptLanguage = async ({ page, browser, lang = '한국' }) => {
  let buttonCaptionsDropdown =
    'button[data-purpose="captions-dropdown-button"][aria-expanded="false"]'; //
  let divChecked = 'ul[aria-label="자막"] > li > button[aria-checked="true"] > div'; // ? selected
  // let divKo = 'ul[aria-label="자막"] > li > button > div[text^="한국"]';
  // let divEn = 'ul[aria-label="자막"] > li > button > div[text^="영어"]';

  await page.waitForTimeout(2000);

  // ? `자막` 드롭다운 버튼 클릭
  const $buttonCaptionsDropdown = await page.$(buttonCaptionsDropdown);
  if ($buttonCaptionsDropdown) {
    await page.evaluate((element) => {
      element.click();
    }, $buttonCaptionsDropdown);
  } else {
    // * `자막` 드롭다운 버튼이 없는 경우, 더이상 진행하지 않음
    return { page, browser };
  }

  await page.waitForTimeout(2000);

  const $buttonChecked = await page.$(divChecked);
  const selectedLang = await page.evaluate((el) => el.innerText, $buttonChecked);
  // console.log(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~checked: ${selectedLang}`);

  if (selectedLang != undefined && !selectedLang.includes(lang)) {
    // console.log(
    //   `@@@대본 언어 변경: ${selectedLang} -> ${lang}`,
    //   `ul[aria-label="자막"] > li > button > div[content^="${lang}"]`
    // );
    let $buttonLanguages = await page.$$(`ul[aria-label="자막"] > li > button`);
    for (let $buttonLanguage of $buttonLanguages) {
      let lang_ = await page.evaluate((el) => el.innerText, $buttonLanguage);
      if (lang_.includes(lang)) {
        await page.evaluate((element) => {
          element.click();
        }, $buttonLanguage);
        // console.log(`!!!언어 변경 버튼 클릭`);
        await page.waitForTimeout(2000);
      }
    }
  }

  return { page, browser };
};

/** transcript(대본)
 *  - transcript(대본) 저장
 *  - content(내용) 저장(transcript가 없는 경우)
 */
const transcript = async ({ page, browser, title, lecture, lang = '한국' }) => {
  await fixTransciptLanguage({ page, browser, lang });

  let buttonTranscriptToggle = 'button[data-purpose="transcript-toggle"][aria-expanded="false"]'; // 펼쳐지지 않은 상태
  let buttonTranscriptActive = 'button[data-purpose="transcript-toggle"][aria-expanded="true"]'; // 펼쳐진 상태
  let divTranscriptPanel = 'div[data-purpose="transcript-panel"]';

  await page.waitForTimeout(2000);

  // ? `대본` 버튼 클릭
  const $buttonTranscriptToggle = await page.$(buttonTranscriptToggle);
  if ($buttonTranscriptToggle) {
    await page.evaluate((element) => {
      element.click();
    }, $buttonTranscriptToggle);
  }

  await page.waitForTimeout(1000);
  const $buttonTranscriptActive = await page.$(buttonTranscriptActive);

  const langTag = lang == '한국' ? 'korean' : 'english';
  // ? `대본`이 펼쳐진 상태인 경우 저장
  if ($buttonTranscriptActive) {
    await page.waitForSelector(buttonTranscriptActive, { timeout: 5000 });
    await saveFile(
      `_files/courses/${title}/transcript/html/${langTag}/${lecture}.html`,
      await page.$eval(divTranscriptPanel, ($el) => $el.innerHTML)
    );
  } else {
    // TODO: 대본이 없는 경우 처리
    console.log(`대본 없음, page 내용 저장: ${lecture}.html`);
    // const divConent = `main > div[class^="app--content-column"] > div[class*="app--body-container"]`;
    const divConent = `main section[class^="lecture-view--container"] > div > div`;
    try {
      let content = await page.$eval(divConent, ($el) => $el.innerHTML);
      await saveFile(
        // `_files/courses/${title}/content/${lecture}.html`,
        `${folder_courses_content(title)}/${lecture}.html`,
        content
      );
    } catch {
      console.log(
        'failed to find element matching selector "main section[class^="lecture-view--container"] > div > div"'
      );
    }
  }
};

// & Class AREA
// &---------------------------------------------------------------------------
class UdemyWeb {
  nick; // ? udemy web user nick(name)
  slug; // ? current slug, example) '/home/my-courses/learning/?sort=-enroll_time'
  email; // ? udemy web username
  password; // ? udemy web password
  isLogin; // ? logined (true/false)

  /** class constructor
   * @param nick - udemy web user nick
   *
   * @example
   *   udemyWeb = new UdemyWeb('deverlife')
   */
  constructor(nick: string, slug: string = '') {
    const userInfo = udemyUserInfo(nick);
    this.nick = nick;
    this.slug = slug;
    this.email = userInfo.webEmail;
    this.password = userInfo.webPassword;
    this.isLogin = false;
  }

  /** login
   */
  async udemyLogin(lang = '한국어') {
    this.isLogin = true;

    let url = `${BASE_URL}${login_slug(lang)}`;
    if (this.slug.length > 4) {
      url = `${url}&next=${this.slug}`;
    }
    const id = this.email;
    const pw = this.password;
    // const idSelector = 'input[name="email"]';
    // const pwSelector = 'input[name="password"]';
    // const submitSelector = 'button[type="submit"]';
    // const waitSelector = 'button[type="submit"]';
    // const waitSelector = 'a[data-page="+1"]';
    const isSubmitByKey = true;

    // * 실행
    return launch(url, idSelector).then(({ page, browser }) => {
      return login(
        id,
        pw,
        idSelector,
        pwSelector,
        page,
        browser,
        submitSelector,
        isSubmitByKey,
        waitSelector
      );
    });
  }
}

// ^ Public Functions
// ^---------------------------------------------------------------------------
// ^ Public Functions
// ^---------------------------------------------------------------------------
/** courseList
 */
const courseList = async (nick, save = true) => {
  const udemyWeb = new UdemyWeb(nick, REGISTERED_COURSE_SLUG);
  const { page, browser } = await udemyWeb.udemyLogin();
  const data = await tourByClick({ cbPath: html_course_list, page, browser, save: save });
  browser.close();
};

/** courseDetails
 */
const courseDetails = async (nick, titles) => {
  // const udemyWeb = new UdemyWeb(nick, `/course/${titles[0]}`);
  const udemyWeb = new UdemyWeb(nick, course_detail_slug(titles[0]));

  const { page, browser } = await udemyWeb.udemyLogin();

  sleep(3);
  for (let i = 0; i < titles.length - 1; i++) {
    await courseDetail({ page, browser, title: titles[i] });
    sleep(10);
    // await page.goto(`https://www.udemy.com/course/${titles[i + 1]}`);
    await page.goto(BASE_URL + course_detail_slug(titles[i + 1]));
    sleep(3);
  }

  await courseDetail({ page, browser, title: titles.slice(-1) }); // ? 마지막 요소 처리
  sleep(3);
  browser.close();
};

/** curriculums
 */
const curriculums = async (nick, titles) => {
  const udemyWeb = new UdemyWeb(nick, curriculum_slug(titles[0]));
  // const udemyWeb = new UdemyWeb(nick, `/course/${titles[0]}/learn/lecture/`);
  let { page, browser } = await udemyWeb.udemyLogin();
  sleep(3);
  for (let i = 0; i < titles.length - 1; i++) {
    let title = titles[i];
    await curriculum({ page, browser, title });
    // await page.goto(`https://www.udemy.com/course/${titles[i + 1]}/learn/lecture`);
    await page.goto(BASE_URL + curriculum_slug(titles[i + 1]));
    sleep(3);
  }

  await curriculum({ page, browser, title: titles.slice(-1) }); // ? 마지막 요소 처리
  sleep(3);
  browser.close();
};

/** lectureIds
 *
 */
const lectureIds = async (nick, titles) => {
  for (let i = 0; i < titles.length - 1; i++) {
    let title = titles[i];
    await lectureIdsFromWeb({ nick, title });
    sleep(5);
  }
};

/** transcripts
 *   TODO: draft course 추가(lectureId 구하는 방법은?)
 */
const transcripts = async (nick, title, lectureIds, lang = '한국') => {
  console.log(lecture_slug(title, lectureIds[0]));
  const udemyWeb = new UdemyWeb(nick, lecture_slug(title, lectureIds[0]));
  let { page, browser } = await udemyWeb.udemyLogin();
  sleep(3);
  for (let i = 0; i < lectureIds.length - 1; i++) {
    await transcript({ page, browser, title, lecture: lectureIds[i], lang });
    await page.goto(BASE_URL + lecture_slug(title, lectureIds[i + 1]));
    sleep(3);
  }

  await transcript({ page, browser, title, lecture: lectureIds.slice(-1), lang }); // ? 마지막 요소 처리
  sleep(3);
  browser.close();
};

/** handouts(수업자료)
 * Download Handouts (DOWNLOAD_EXTS=zip,pdf)
 *   TODO: download 폴더에 있는 수업자료 -> handouts 폴더(`_files/courses/${title}/handouts/`)로 이동
 *   TODO: draft course 추가
 */
const handouts = async ({ nick, title }) => {
  const handouts = loadJson(file_courses_handoutList(title));
  fs.mkdirSync(folder_courses_handouts(title), { recursive: true }); // 저장 폴더 생성

  if (!handouts) {
    console.log('handoutList가 없습니다.', file_courses_handoutList(title));
    return null; // handoutList 파일이 없으면 종료
  }
  // console.log(handouts); // TODO: 테스트 후 삭제

  // const udemyWeb = new UdemyWeb(nick, `/course/${title}/learn/lecture/`);
  const udemyWeb = new UdemyWeb(nick, curriculum_slug(title));
  let { page, browser } = await udemyWeb.udemyLogin();
  sleep(5);

  await curriculum({ page, browser, title, save: false });
  sleep(5);

  // ? click 강의 내용 리스트 확장 버튼
  let buttonHandoutExpand =
    'div[data-purpose="curriculum-section-container"] div[class^="popper-module"] > button[aria-expanded="false"]';
  let buttonHandout =
    'div[data-purpose="curriculum-section-container"] div[class*="ud-popper-open"] ul > li > button';

  let buttonTranscriptToggle = 'button[data-purpose="transcript-toggle"]';
  let divTranscriptPanel = 'div[data-purpose="transcript-panel"]';

  // ? 자료(handouts)
  // Lecture별 자료(handouts) 확장 버튼 클릭
  sleep(3);
  const $handoutExEls = await page.$$(buttonHandoutExpand);
  console.log(`## 자료버튼 개수 $handoutExEls.length:  ${$handoutExEls.length}`);

  let num = 0; // 다운로드 파일 일련번호
  let retry = 60; // 다운로드 확인 재시도 횟수
  for (let i = 0; i < $handoutExEls.length; i++) {
    // for (let $handoutExEl of $handoutExEls) {
    let $handoutExEl = $handoutExEls[i];

    await $handoutExEl.click();
    // console.log(`@@ $handoutExEl click`);
    // Lecture별 자료(handouts) 버튼 클릭
    // await page.waitForTimeout(5000);
    sleep(5);

    // https://stackoverflow.com/questions/75585822/getting-text-inside-of-an-element-from-the-class-name-using-puppeteer
    const handoutTexts = await page.$$eval(buttonHandout, (els) => els.map((e) => e.textContent));
    console.log(handoutTexts);

    let $handoutEls = await page.$$(buttonHandout);

    // console.log(
    //   `#### handoutTexts.length: ${handoutTexts.length}, $handoutEls.length:  ${$handoutEls.length}`
    // );
    // TODO: '자료' 버튼 클릭 -> 팝업 창 내 파일 클릭 => '자료' 버튼 클릭
    // let clickCount = 0;
    for (let i = 0; i < $handoutEls.length; i++) {
      let handoutTitle = handoutTexts[i];
      // TODO: 이름이 같은 경우는?(num == handout.count)
      let handout = handouts.find((handout) => handout.title == handoutTitle) || {
        title: handoutTexts[i],
        lecture: ''
      };

      // if (
      //   !handoutTitle.slice(-5).includes('.') ||
      //   handoutTitle.includes('/') ||
      //   handoutTitle.endsWith('.com') ||
      //   handoutTitle.endsWith('.net') ||
      //   handoutTitle.endsWith('.org') ||
      //   handoutTitle.endsWith('.io')
      // ) {
      if (handout.type != 'file') {
        // ? 'file'이 아닌 경우
        if (i < $handoutEls.length - 1) {
          // 마지막 handout이면 열린 창을 닫기 위해 '자료' 버튼 클릭
          await $handoutExEl.click(); // ^ '자료' 재클릭
        }
        sleep(1);
        continue;
      }

      try {
        await $handoutEls[i].click(); // ? `수업자료` 클릭
        console.log(`+++++++++Click ${handoutTitle}`);
      } catch (e) {
        console.log(`Error: Node is either not clickable or not an HTMLElement`);
        continue;
      }

      // console.log(`^^^^^handoutTexts[${i}]: |${handoutTexts[i]}|`);
      num += 1;
      // let sn = num.toString().padStart(3, '0');  // TODO: 테스트 후 삭제
      let sn = handout.count.toString().padStart(3, '0');
      // console.log(`${folder_download}/${handout.title}`);

      // ? download file
      let done = false;
      let handout_title = renameHandoutTitle(handout.title);
      console.log(`handoutTexts[i]: ${handoutTexts[i]}, handout_title: ${handout_title}`);
      let srcFilePath = `${folder_download}/${handout_title}`;
      // TODO: handout.lecture file이름에 사용할 수 없는 문자열 치환 `19. Invoking the "Generate New Wallet" Resource from the UI` =>
      let dstFilePath = `${folder_courses_handouts(title)}/${sn}_${handout.lecture
        .split(' ')[0]
        .replace('.', ' ')}_${handout_title}`;
      for (let t = 0; t < retry; t++) {
        if (fs.existsSync(srcFilePath)) {
          console.log(`@@@@@@@@@@@@@retry: ${t} downloaded`);
          done = true;
          break;
        }
        sleep(1);
      }

      // ? move file
      if (done) {
        fs.renameSync(srcFilePath, dstFilePath);
      } else {
        continue;
      }

      let done2 = false;
      for (let t = 0; t < retry; t++) {
        if (fs.existsSync(dstFilePath)) {
          console.log(`#######retry: ${t} complete move`);
          done = true;
          if (i < $handoutEls.length - 1) {
            // 마지막 handout이면 클릭하지 않음
            await $handoutExEl.click(); // ^ '자료' 재클릭
          }
          sleep(1);
          break;
        }
        sleep(1);
      }
      // await page.waitForTimeout(5000);
      sleep(1);
    }
  }

  browser.close();
};

/** purchaseHistory
 */
const purchaseHistory = async (nick, save = true) => {
  const udemyWeb = new UdemyWeb(nick, PURCHASE_HISTORY_LIST_SLUG);
  const { page, browser } = await udemyWeb.udemyLogin();
  const data = await tourByClick({ cbPath: html_purchase_history, page, browser, save: save });
  browser.close();
};

// & Export AREA
// &---------------------------------------------------------------------------
export {
  UdemyWeb, // [class] UdemyWeb
  courseList, // [function async] fetch & save course list 수강중인 강좌 목록
  courseDetails, // [function async] fetch & save course detail 강좌 상세페이지
  curriculums, // [function async] fetch & save course lectures 강좌 강의실 페이지
  // lectureIdsFromWeb, //  [function async] fetch & save course lectureIds 강좌 강의실 페이지
  lectureIds, //  [function async] fetch & save course lectureIds 강좌 강의실 페이지
  // curriculums_draft, // TODO: curriculums와 통합후 삭제, [function async] draft 강좌 강의실 페이지
  transcripts, // [function async] fetch & save course lectures 강의 대본(강의실 페이지)
  handouts, // [function async] Download Handouts (DOWNLOAD_EXTS=zip,pdf)
  purchaseHistory // [function async] fetch & save purchase history 구매 내역
};

// & Test AREA
// &---------------------------------------------------------------------------
