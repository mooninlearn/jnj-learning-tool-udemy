/** 🚀 index
 *
 * Description
 *   - 🚀 Start Point(`yarn dev`)
 *
 * Functions
 *   [X] test package
 *
 *   [X] initUdemy
 *   [ ] addCourse
 *   [ ] updateCourse
 *
 * Notes:
 *  - '830234' CSS 와 JavaScript 꼭 필요한 것만 빠르게 정리하기 => 강좌 페이지 없음
 *
 * Usages
 *   - `jnj-learning-tool-udemy$ yarn dev`
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

import _ from 'lodash';

import { loadJson, findFiles, sleep } from 'jnj-lib-base';

import {} from 'jnj-lib-google';

// ? Local Modules
import {
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
  json_list_courseTitles_active // (활성)코스 제목(kebab-case) 배열
} from '../src/globals';

import { UdemyApi, fetchCourseInfo, fetchCourseCurriculum } from './UdemyApi';

import {
  UdemyWeb,
  courseList,
  purchaseHistory,
  courseDetails,
  curriculums,
  // lectureIdsFromWeb, //  [function async] fetch & save course lectureIds 강좌 강의실 페이지
  lectureIds, //  [function async] fetch & save course lectureIds 강좌 강의실 페이지
  transcripts, // [function async] fetch & save course lectures 강의 대본(강의실 페이지)
  handouts
} from './UdemyWeb';

import {
  courseListFromCourseList, // Extract CourseList Json From CourseList Html Folder
  courseInfoFromCourseDetail, // Extract CourseInfo Json From CourseDetail Html File
  curriculumFromCourseDetail, // Extract Curriculum Json From CourseDetail Html File
  curriculumFromCurriculum, // Extract Curriculum Json From Curriculum Html File
  handoutListFromCurriculum, // Extract Handouts(수업자료) Json From Curriculum Html File(`_files/html/curriculum/${title}.html`)
  purchaseHistoryFromPurchaseHistory // 구매 이력
} from './udemyHtml';

import {
  courseTitleByCourseId,
  courseIdByCourseTitle,
  findDraftCourseIds, // Find Draft CourseIds(Draft(보관함)으로 이동된 강좌)
  findActiveCourseIds, //  Find Active CourseIds(활성화(draft되지 않은) 강좌)
  findActiveCourseTitles, // Find Active Courses Titles
  findAllCourseTitles, // Find All Course Titles
  findCourseLectureIds,
  findAllLectureIds, // findAllLectureIds for course(Id) (by json_curriculum_lectures)
  saveDraftCourseIds, // Save Draft CourseIds(Draft(보관함)으로 이동된 강좌)
  saveActiveCourseList, // Save Active CourseList
  saveCourseTitles, // Save (active) Course Titles
  saveCoursesMap,
  saveAllCourseInfos,
  saveCurriculumsByApi,
  saveAllCurriculumsByApi,
  saveAllMixCourseInfos, // Save All Mix CourseInfo
  saveMixActiveCurriculums, // Save Mix Active Curriculums(given courseIds)
  saveAllMixCurriculums, // Save All Mix Curriculums(active course + draft course)
  saveAllLectures, // Save All Lectures(active course + draft course)
  saveTrascriptCount, // Save Trascript Count For All Courses(active course + draft course)
  saveContentCount, // Save Content Count For All Courses(active course + draft course)
  saveHandoutCount, // Save Handout Count(fileNum, downloadedNum) For All Courses(active course + draft course)
  saveAllInstructorInfos // Save All Instructor Infos(active course 강사 정보)
} from './udemyData';

import {
  markdownFromHtmlStr, // Markdown From Html String
  markdownFromHtmlFile, //
  chapterMarkdowns // create chapter markdown files for course(by title)
} from './udemyMarkdown';

// import { createCollectionsBySheet } from './udemyPocketbase';

// & Function AREA
// &---------------------------------------------------------------------------

// * Init course Data/File
// TODO: 일괄 처리 가능하도록(현재 await를 사용하여도 다음 함수가 먼저 실행됨)
const initUdemy = async (nick) => {
  // & CourseList
  // * [UdemyWeb] Scrape & Save Registered CourseList Htmls From udemy.com(web)
  await courseList(nick);
  sleep(5);
  console.log('courseList');
  console.log('-------------------------------------------------------');

  // * Extract & Save CourseList Json From CourseList Html File <`json/list/courses_basic.json`>
  courseListFromCourseList();
  console.log('courseListFromCourseList');
  console.log('-------------------------------------------------------');

  // * Save Draft CourseIds By Api(fetchCourseInfo값이 없는 course = draft course) <`json/list/courseIds_draft.json`>
  await saveDraftCourseIds();
  console.log('aveDraftCourseIds');
  console.log('-------------------------------------------------------');

  // * Save CourseInfo By Api() <`json/courseInfo/api/{courseId}.json`>
  await saveAllCourseInfos();
  // ! await가 처리되기 전에 진행됨
  console.log('saveAllCourseInfos');
  console.log('-------------------------------------------------------');

  // * Save Active CourseList By Api() <`json/list/courses_active.json`>
  saveActiveCourseList();
  console.log('saveActiveCourseList');
  console.log('-------------------------------------------------------');

  // * Save Courses Map <`json/list/courses_titles_active.json`>
  saveCourseTitles();
  console.log('saveCourseTitles');
  console.log('-------------------------------------------------------');

  // * Save Courses Map <`json/list/courses_map.json`>
  saveCoursesMap();
  console.log('saveCoursesMap');
  console.log('========================================================');

  // & InstructorInfo
  // * Extract InstructorInfo Json From CourseInfo(Api) Json File
  saveAllInstructorInfos();
  console.log(' saveAllInstructorInfos');
  console.log('========================================================');

  // & PurchaseHistory
  // * [UdemyWeb] Scrape & Save PurchaseHistory Htmls From udemy.com(web)
  await purchaseHistory(nick);
  console.log('PurchaseHistory');
  console.log('-------------------------------------------------------');

  // * Extract PurchaseHistory Json From PurchaseHistory Html File
  purchaseHistoryFromPurchaseHistory();
  console.log('purchaseHistoryFromPurchaseHistory');
  console.log('========================================================');

  // & CourseInfo
  // * [UdemyWeb] Scrape & Save All CourseDetails Htmls From udemy.com(web)
  await courseDetails(nick, findActiveCourseTitles());
  console.log('courseDetails');
  console.log('-------------------------------------------------------');

  // * Extract CourseInfo Json From CourseDetail Html File
  for (let title of findActiveCourseTitles()) {
    courseInfoFromCourseDetail(title); // Extract CourseInfo Json From CourseDetail Html File
  }
  console.log('courseInfoFromCourseDetail');
  console.log('=========================================================');

  // & Curriculum
  // * Save All Curriculums By Api <`json/curriculum/api/{courseId}.json`>
  await saveAllCurriculumsByApi();
  console.log('saveAllCurriculumsByApi');
  console.log('-------------------------------------------------------');

  // * [UdemyWeb] Scrape & Save Active Course Curriculums Htmls From udemy.com(web)
  await curriculums(nick, findAllCourseTitles());
  console.log('curriculums');
  console.log('-------------------------------------------------------');

  // * Extract Curriculum Json From CourseDetail Html File
  for (let title of findActiveCourseTitles()) {
    curriculumFromCourseDetail(title); // Extract CourseInfo Json From CourseDetail Html File
  }
  console.log('curriculumFromCourseDetail');
  console.log('-------------------------------------------------------');

  // * Save LectureIds(draft course)
  lectureIds(nick, loadJson(json_list_courseIds_draft));
  console.log('lectureIds');
  console.log('==========================================================');

  // * Extract Curriculum Json From Curriculum Html File
  for (let title of findAllCourseTitles()) {
    curriculumFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
  }
  console.log('curriculumFromCurriculum');
  console.log('==========================================================');

  // * Save Updated CourseInfos by Mix(basic + api + web)
  saveAllMixCourseInfos(); // Save All Mix CourseInfo
  console.log('saveAllMixCourseInfos');
  console.log('-------------------------------------------------------');

  // * Save Updated Curriculums by Mix(api + web / draft course 포함)
  saveAllMixCurriculums(); // Save All Mix Curriculums(active course + draft course)
  console.log('saveAllMixCurriculums');
  console.log('==========================================================');

  // * Save Curriculum Lecutures by Mix
  saveAllLectures(); // Save All Mix Curriculums(active course + draft course)
  console.log('saveAllLectures');
  console.log('==========================================================');

  // & Handouts(수업자료)
  // * Extract Handouts(수업자료) Json From Curriculum Html File(`_files/html/curriculum/${title}.html`)
  for (let title of findAllCourseTitles()) {
    handoutListFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
  }
  console.log('handoutListFromCurriculum');
  console.log('-------------------------------------------------------');

  // * [UdemyWeb] Download Handouts From udemy.com(web)
  // ! 일괄처리 어려움(course 여러개 씩 처리)
  for (let title of findAllCourseTitles()) {
    handouts({ nick, title }); // Extract CourseInfo Json From CourseDetail Html File
  }

  // & Transcript(자막[한국어|영어])
  // * [UdemyWeb] Download Handouts From udemy.com(web)
  // ! 일괄처리 어려움(course 1개씩 처리)
  for (let title of findActiveCourseTitles()) {
    const courseId = courseIdByCourseTitle(title);
    const langs = ['한국', '영어'];
    for (let lang of langs) {
      await transcripts(nick, title, findCourseLectureIds(courseId)); // Extract CourseInfo Json From CourseDetail Html File
    }
  }
  // & Markdown
};

// & Test AREA
// &---------------------------------------------------------------------------
const nick = 'deverlife';
// const title = 'java-tutorial';
// const lectureIds = ['152283', '224058', '625296', '32284256'];
// const lang = '영어';
// transcripts(nick, title, lectureIds, lang);

// '830234' CSS 와 JavaScript 꼭 필요한 것만 빠르게 정리하기 => 강좌 페이지 없음
// await curriculums(nick, _.difference(loadJson(json_list_courseIds_draft), ['830234']));
// for (let title of _.difference(loadJson(json_list_courseIds_draft), ['830234'])) {
//   curriculumFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
// }
// console.log(loadJson(json_list_courseIds_draft));
// lectureIds(nick, loadJson(json_list_courseIds_draft));
// lectureIds(nick, [
//   '1289478',
//   '1329956',
//   '1389030',
//   '1425316',
//   '1499558',
//   '1528664',
//   '1585360',
//   '1618212',
// ]);
// lectureIds(nick, ['1620468', '830234']);

// saveAllMixCurriculums();
// saveAllLectures();

// // microservices-with-node-js-and-react
// await curriculums(nick, ['microservices-with-node-js-and-react']);  // 2887266

// handoutListFromCurriculum('unity-master-video-game-development-the-complete-course');

// for (let title of findAllCourseTitles()) {
//   handoutListFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
// }

// saveAllMixCourseInfos();
// saveTrascriptCount();
// saveContentCount(); // Save Content Count For All Courses(active course + draft course)
// saveHandoutCount(); // Save Handout Count(fileNum, downloadedNum) For All Courses(active course + draft course)
// saveAllLectures();
// handouts('build-a-blockchain-cryptocurrency-using-python')
// const title = 'build-a-blockchain-cryptocurrency-using-python';

// // const title = '1272576';
// const title = 'microservices-with-node-js-and-react';
// handouts({ nick, title });

// for (let title of findAllCourseTitles()) {
//   curriculumFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
// }

// saveAllMixCourseInfos(); // Save All Mix CourseInfo
// saveAllMixCurriculums(); // Save All Mix Curriculums(active course + draft course)

// // & init Udemy
// await initUdemy(nick);
// ? 완료
// svelte-and-sveltekit
// web-design-figma-webflow-freelancing
// learn-flutter-dart-to-build-ios-android-apps
// complete-web-designer-mobile-designer-zero-to-mastery
// backend-master-class-golang-postgresql-kubernetes: english
// microservices-with-node-js-and-react
// nodejs-mvc-rest-apis-graphql-deno
// best-100-days-python
// time-series-analysis-in-python: english
// react-the-complete-guide-incl-redux
// algorithmic-trading-with-python-and-machine-learning: englsh
// keras-deep-learning: english
// java-for-complete-beginers-programming-fundamentals: english
// java-tutorial
// the-beginners-guide-to-the-stock-market
// cryptocurrency-complete-bitcoin-ethereum-course

// & Transcripts
// const title = 'data-science-and-machine-learning-bootcamp-with-r';
// const title = 'microservices-with-node-js-and-react';
const title = '1289478'; // iOS 11 & Swift 4 - The Complete iOS App Development Bootcamp
// const title = 'java-tutorial';
const courseId = courseIdByCourseTitle(title);
console.log(courseId);
// how-to-learn-english-and-more-on-your-own-using-the-internet
//
// complete-python-bootcamp
// complete-android-n-developer-course
// bitcoin-ethereum-blockchain

// const courseId = courseIdByCourseTitle(title);
// const korean = findFiles(`_files/courses/${title}/transcript/html/korean`).map((x) =>
//   parseInt(x.split('.')[0])
// );
// const allLectureIds = findAllLectureIds(courseId);
const english = findFiles(`_files/courses/${title}/transcript/html/english`).map((x) =>
  parseInt(x.split('.')[0])
);
const content = findFiles(`_files/courses/${title}/content`).map((x) => parseInt(x.split('.')[0]));

// const isTranscipts = _.difference(allLectureIds, content);
// const missings = _.difference(isTranscipts, english);
// console.log(allLectureIds.length);
// console.log(content.length);
// console.log(isTranscipts.length);
// console.log(english.length);
// console.log(missings);

// console.log(_.difference(english, isTranscipts));
const _lectureIds = _.difference(findAllLectureIds(courseId), english, content, [
  '7555990',
  7555990
]);
console.log(_lectureIds);
// const lectureIds = ['29148924'];
// const lectureIds = _.difference(findCourseLectureIds(courseId), english, korean);
// const lectureIds = _.difference(findCourseLectureIds(courseId), content);
// console.log(lectureIds);
// console.log(findCourseLectureIds(lectureId).length);
// console.log(korean.length);
// console.log(english.length);
// console.log(lectureIds.length);

// await transcripts(nick, title, lectureIds, '한국');
// await transcripts(nick, title, ['19248060', ...content], '영어');
await transcripts(nick, title, _lectureIds, '영어');
// await transcripts(nick, title, findCourseLectureIds(courseId), '영어');

// TODO:
// 누락 transcripts 재다운로드

// // ? Handout
// const title = 'complete-web-designer-mobile-designer-zero-to-mastery';
// // handoutsFromHtml(title);
// await handouts({ nick, title });

// & udemyMarkdown
// ?
// console.log(findChaptersByCourseId('2887266'));
// chapterMarkdowns('complete-web-designer-mobile-designer-zero-to-mastery');
// chapterMarkdowns('complete-web-designer-mobile-designer-zero-to-mastery', '영어');

// chapterMarkdowns('java-tutorial', '영어');
// chapterMarkdowns('microservices-with-node-js-and-react', '영어');

// chapterMarkdowns('complete-web-designer-mobile-designer-zero-to-mastery', '한국');
// for (let lang of langs) {
//   chapterMarkdowns(title, lang);
// }
// // ? convert html to markdown
// console.log(
//   markdownFromHtmlFile(
//     'C:/JnJ-soft/Projects/internal/jnj_tools/learning-tools/jnj-learning-tools/jnj-learning-tool-udemy/_files/courses/complete-web-designer-mobile-designer-zero-to-mastery/transcript/html/english/21447554.html'
//   )
// );

// // ? courseInfo(web) + curriculum(web) json
// for (let title of findActiveCourseTitles()) {
//   saveCourseDetail(title);
// }

// jsonFromCurriculum(title);

// & udemyPocketbase
// createCollectionsBySheet();
