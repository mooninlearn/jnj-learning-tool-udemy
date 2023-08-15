/** udemyHtml
 *
 * Description
 *   - Extract Data(json) From Html
 *
 * Functions
 *   [X]
 *
 * Usages
 *   -
 *
 * Requirements
 *   - npm install cheerio
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

// ? External Modules

// ? UserMade Modules
import { loadJson, saveFile, saveJson, findFiles, sleep } from 'jnj-lib-base';

// ? Local Modules
import {
  // ? settings
  DOWNLOAD_EXTS, // 강좌 `수업자료` 다운로드 파일 확장자

  // ? folder(html)
  folder_html_course_list, // courseList Html Folder
  folder_html_purchase_history, // courseList Html Folder

  // ? html
  html_course_list, // (등록)코스 목록
  html_course_detail, // 강의 상세 페이지
  html_curriculum, // 커리큘럼(active)
  // html_curriculum_draft, // 커리큘럼(draft)
  html_purchase_history, // 구매 내역

  // ? json(list)
  json_list_courses_basic, // (등록)코스 목록(기본 정보 포함)
  json_list_courses_active,
  json_list_purchase_history, // 구매 이력

  // ? json(courseInfo)
  json_course_info_web, // courseInfo(from web(courseDetail))
  json_course_info_web2, // courseInfo(from web(curriculum))

  // ? json(curriculum)
  json_curriculum_web, // curriculum(from web(courseDetail))
  json_curriculum_web2, // curriculum(from web(curriculum))

  // ? folder(course)
  folder_courses_handouts, // Resource(수업 자료) 다운로드 파일 폴더
  file_courses_handoutList // Resource(수업 자료) 위치 정보(handout 다운로드시 사용)
} from './globals';

import {
  loadFile,
  cheerFromStr,
  cheerFromFile,
  querySelector,
  querySelectorAll,
  getValue,
  getValues,
  getValueFromStr,
  getValuesFromStr,
  dictFromRoot,
  dictsFromRoots
} from './utils/cheer';

import { courseIdByCourseTitle } from './udemyData';
// & Variable AREA
// &---------------------------------------------------------------------------

// & Function AREA
// &---------------------------------------------------------------------------
// * Utils
/** isFalsy
 * TODO: 대체 후 삭제
 */
const isFalsy = (v: any) => {
  return (
    v === false ||
    v === undefined ||
    v === null ||
    Number.isNaN(v) ||
    v === 0 ||
    v.length === 0 ||
    Object.keys(v).length === 0
  );
};

/** findCourseListHtmls
 * 등록 강좌 목록
 */
const findCourseListHtmls = () =>
  findFiles(folder_html_course_list).map((name) => `${folder_html_course_list}/${name}`);

/** findPurchaseHistoryHtmls
 * 구매 내역
 */
const findPurchaseHistoryHtmls = () =>
  findFiles(folder_html_purchase_history).map((name) => `${folder_html_purchase_history}/${name}`);

// * Extract Data
/** courseListFromCourseList
 *  Extract CourseList Json From CourseList Html Folder
 */
const courseListFromCourseList = (save = true) => {
  let courses: any[] = [];

  for (let path of findCourseListHtmls()) {
    let $ = cheerFromFile(path);
    let $roots = $('div[data-purpose="container"]');
    let settings = [
      {
        key: 'title',
        selector: 'h3[data-purpose="course-title-url"] > a',
        target: 'text'
      },
      {
        key: 'courseId',
        selector: 'h3[data-purpose="course-title-url"] > a',
        target: 'href',
        callback: `value.split('=')[1]`
      },
      {
        key: 'image',
        selector: 'div[class^="course-card-module--image"] > img',
        target: 'src'
      },
      {
        key: 'Iinstructors',
        selector: 'div[class="ud-text-xs"] > div[class^="course-card-instructors"]',
        target: 'text'
      },
      {
        key: 'meter',
        selector: 'div[data-purpose="meter"]',
        target: 'aria-label',
        callback: `value.replace(/[^0-9]/g, '')`
      }
    ];
    courses.push(...dictsFromRoots($roots, settings));
  }

  let courseList: any = {};
  let len = courses.length;
  for (let i = 0; i < len; i++) {
    let course = courses[i];
    course['sn'] = len - i;
    courseList[course.courseId] = course;
  }

  if (save) {
    saveJson(json_list_courses_basic, courseList);
  }

  return courseList;
};

/** courseInfoFromCourseDetail
 *  Extract CourseInfo Json From CourseDetail Html File
 * NOTE:
 */
const courseInfoFromCourseDetail = (title, save = true) => {
  // let $ = cheerFromFile(`_files/html/courseDetail/${title}.html`);
  let $ = cheerFromFile(html_course_detail(title));

  let courseId: string = $('body').attr('data-clp-course-id')!; // 파일 내에서 `courseId` 획득

  // * courseInfo
  let courseInfo: any = {};

  courseInfo['courseId'] = $('body').attr('data-clp-course-id'); // courseId
  let $root = $('body'); // "top-container" "dark-background-inner-position-container"
  let settings = [
    {
      key: 'category',
      selector: 'div[class*="ud-breadcrumb"]',
      target: 'texts',
      callback: `value.join(' > ')`
    },
    { key: 'title', selector: 'h1[data-purpose="lead-title"]' },
    { key: 'subTitle', selector: 'div[data-purpose="lead-headline"]' },
    { key: 'rating', selector: 'span[data-purpose="rating-number"]' },
    {
      key: 'studentNum',
      selector: 'div[data-purpose="enrollment"]',
      callback: `value.replace(/[^0-9]/g, '')`
    }
  ];

  courseInfo = { ...courseInfo, ...dictFromRoot($root, settings) };

  let $updated = querySelector($, 'div[data-purpose="last-update-date"] > span');
  courseInfo['updatedAt'] = isFalsy($updated)
    ? ''
    : $updated.text().replace('Last updated', '').trim();

  let $totals = querySelector($, 'div[data-purpose="curriculum-stats"] > span');
  let totals = isFalsy($totals)
    ? ['', '', '']
    : getValue($, 'div[data-purpose="curriculum-stats"] > span', 'texts');
  // "totals": "7 sections • 26 lectures •,5h 13m total length"
  if (totals.length === 2) {
    [courseInfo['totalChapter'], courseInfo['totalLecture']] = totals[0]
      .split('•')
      .map((s) => s.replace(/[^0-9]/g, ''));
    courseInfo['totalTime'] = totals[1].split('m ')[0].replace(' ', ' ') + 'm';
  }

  if (save) {
    saveJson(json_course_info_web(courseId), courseInfo);
  }

  return courseInfo;
};

/** curriculumFromCourseDetail
 *  Extract Curriculum Json From CourseDetail Html File
 * NOTE:
 */
const curriculumFromCourseDetail = (title, save = true) => {
  // let $ = cheerFromFile(`_files/html/courseDetail/${title}.html`);
  let $ = cheerFromFile(html_curriculum(title));
  let courseId: string = $('body').attr('data-clp-course-id')!; // courseId

  // * curriculum
  let curriculum: any[] = [];
  let $curriculum = querySelectorAll($, 'div[class^="accordion-panel-module--panel"]');

  for (let i = 0; i < $curriculum.length; i++) {
    let chapter: any = {};
    let $chapter = $curriculum.eq(i);
    chapter['title'] = getValue($chapter, 'div > h3 > button > span > span:first-child');
    let [lectureNum, totalTime] = getValue(
      $chapter,
      'div > h3 > button > span > span:last-child',
      'texts'
    );
    chapter['lectureNum'] = lectureNum.replace(/[^0-9]/g, '');
    chapter['totalTime'] = totalTime.replace('hr', 'h').replace('min', 'm');

    chapter['lectures'] = [];
    let $lectures = querySelectorAll($chapter, 'ul > li');

    for (let j = 0; j < $lectures.length; j++) {
      let $lecture = $lectures.eq(j);

      let lecture: any = {};
      let $title = querySelector($lecture, '> div > div > div > div > span');
      let $time = querySelector($lecture, '> div > div > span:nth-last-of-type(1)');
      if ($title) {
        lecture['title'] = $title.text();
        lecture['preview'] = false;
      } else {
        $title = querySelector($lecture, 'div > div > div > div > button > span');
        if ($title) {
          lecture['title'] = $title.text();
          lecture['preview'] = true;
        } else {
          $title = querySelector($lecture, 'a > div > div > div > span');
          if ($title) {
            lecture['title'] = $title.text();
            lecture['preview'] = true;
            lecture['url'] = querySelector($lecture, 'a').attr('href');
          } else {
            console.log('@@@@ERROR in Lecture');
          }
        }
      }

      if ($time) {
        let timeStr = $time.text();
        let isNotTime = /[^0-9:]/.test(timeStr); // 3 pages, 5 questions
        lecture['time'] = isNotTime ? '' : timeStr;
        lecture['type'] = !isNotTime ? 'video' : timeStr.includes('page') ? 'doc' : 'quiz';
      }

      chapter['lectures'].push(lecture);
    }

    curriculum.push(chapter);
  }

  if (save) {
    saveJson(json_curriculum_web(courseId), curriculum);
  }

  return curriculum;
};

/** curriculumFromCurriculum
 * Extract Curriculum Json From Curriculum Html File
 * NOTE:
 */
const curriculumFromCurriculum = (title, save = true) => {
  // console.log('jsonFromCurriculum');
  let $ = cheerFromFile(`_files/html/curriculum/${title}.html`);
  // let courseId: string = $('a[class="ud-text-bold ud-link-underline"]')
  //   .attr('href')
  //   .split('=')
  //   .slice(-1)[0]; // ERROR가 있는 경우 있음
  // console.log(`courseId: ${courseId}`);
  let courseId = courseIdByCourseTitle(title); // TODO: import로 할 것인지 확인
  console.log(`@@@@@@@@@@@@@@@@@@@courseId in curriculumFromCurriculum: ${courseId}`);

  let $roots = $(
    'div[data-purpose="curriculum-section-container"] div[data-purpose^="section-panel-"]'
  ); // "top-container" "dark-background-inner-position-container"
  let settings = [
    {
      key: 'title',
      selector: 'span[class="ud-accordion-panel-title"]',
      target: 'text'
    },
    {
      key: 'lectureNum',
      selector: 'div[data-purpose="section-duration"] > span', // 5 / 5 | 23분
      callback: `value.split('|')[0].trim()`
    },
    {
      key: 'duration',
      selector: 'div[data-purpose="section-duration"] > span', // 5 / 5 | 23분
      callback: `value.split('|')[1].trim()`
    }
  ];
  let curriculum = dictsFromRoots($roots, settings);

  // console.log($roots.length);

  for (let i = 0; i < $roots.length; i++) {
    let $root = $roots.eq(i);
    let $roots_ = $roots.eq(i).find('div[data-purpose^="curriculum-item"]');
    let settings_ = [
      {
        key: 'title',
        selector: 'span[data-purpose="item-title"]'
      },
      {
        key: 'duration',
        selector: 'div[class^="curriculum-item-link--bottom"] > div > span' // 8분
      }
    ];
    curriculum[i]['lectures'] = dictsFromRoots($roots_, settings_);
  }

  if (save) {
    console.log(curriculum);
    console.log(json_curriculum_web2(courseId));
    saveJson(json_curriculum_web2(courseId), curriculum);
  }

  return curriculum;
};

/** handoutsFromHtml
 * Extract Handouts(수업자료) Json From Curriculum Html File(`_files/html/curriculum/${title}.html`)
 */
const handoutsFromCurriculum = (title, save = true) => {
  // const path = `_files/html/curriculum/${title}.html`;
  const path = html_curriculum(title);
  // let sections: any = {};
  let handouts: any[] = [];
  let count: number = -1; // `자료` 버튼 일련번호(동일 lecture = 동일번호), 첫번째 = `0`

  let $ = cheerFromFile(path);
  let $roots = $('div[data-purpose^="section-panel"]');
  for (let i = 0; i < $roots.length; i++) {
    let $root = $roots.eq(i);
    let sectionTitle = $root.find('button[id^="accordion-panel-title"] > span > span').text(); // 섹션 제목

    let $lectures = $root.find('div[data-purpose^="curriculum-item"]');
    for (let j = 0; j < $lectures.length; j++) {
      let $lecture = $lectures.eq(j);
      let lectureTitle = $lecture.find('span[data-purpose="item-title"]').text(); // 강의 제목

      let $handouts = $lecture.find('div[id^="popper-content"]');
      if ($handouts.length > 0) count += 1; // handout이 있으면 count 증가
      for (let k = 0; k < $handouts.length; k++) {
        let $handout = $handouts.eq(k);
        let handoutTitle = $handout.find('ul > li > button > div').text(); // 자료 제목
        if (DOWNLOAD_EXTS.includes(handoutTitle.slice(-4))) {
          handouts.push({
            count: count,
            type: 'file',
            title: handoutTitle,
            section: sectionTitle,
            lecture: lectureTitle
          }); // ^ handouts에 추가
          continue;
        }
        handouts.push({
          count: count,
          type: 'link',
          title: handoutTitle,
          section: sectionTitle,
          lecture: lectureTitle
        }); // ^ handouts에 추가
      }
    }
  }

  if (save) {
    saveJson(file_courses_handoutList(title), handouts);
    folder_courses_handouts;
  }

  return handouts;
};

const purchaseHistoryFromPurchaseHistory = (save = true) => {
  let history: any[] = [];

  for (let path of findPurchaseHistoryHtmls()) {
    let $ = cheerFromFile(path);
    let $roots = $('tr');
    let settings = [
      {
        key: 'title',
        selector: '> td:nth-child(1) a',
        target: 'href',
        callback: `value.replace('/course/', '').slice(0,-1)`
      },
      // {'key': 'title', 'selector': '> td:nth-child(1)  a'},
      {
        key: 'purchasedAt',
        selector: '> td:nth-child(2) > div',
        callback: `value.slice(0,-1).split('.').map((s)=>s.trim().padStart(2,'0')).join('-')`
      },
      { key: 'purPrice', selector: '> td:nth-child(3) > div' },
      { key: 'payment', selector: '> td:nth-child(4) > div' }
    ];
    history.push(...dictsFromRoots($roots, settings, ['title']));
  }

  if (save) {
    saveJson(json_list_purchase_history, history);
  }

  return history;
};

// & Export AREA
// &---------------------------------------------------------------------------
export {
  // ? course
  courseListFromCourseList, // Extract CourseList Json From CourseList Html Folder
  courseInfoFromCourseDetail, // Extract CourseInfo Json From CourseDetail Html File
  curriculumFromCourseDetail, // Extract Curriculum Json From CourseDetail Html File
  curriculumFromCurriculum, // Extract Curriculum Json From Curriculum Html File
  handoutsFromCurriculum, // Extract Handouts(수업자료) Json From Curriculum Html File(`_files/html/curriculum/${title}.html`)

  // ? purchase
  purchaseHistoryFromPurchaseHistory // 구매 이력
};

// & Test AREA
// &---------------------------------------------------------------------------
