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
 * Usages
 *   - `jnj-learning-tool-udemy> yarn dev`
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

import { loadJson, findFiles, sleep } from 'jnj-lib-base';

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
  transcripts, // [function async] fetch & save course lectures 강의 대본(강의실 페이지)
  handouts
} from './UdemyWeb';

import {
  courseListFromCourseList, // Extract CourseList Json From CourseList Html Folder
  courseInfoFromCourseDetail, // Extract CourseInfo Json From CourseDetail Html File
  curriculumFromCourseDetail, // Extract Curriculum Json From CourseDetail Html File
  curriculumFromCurriculum, // Extract Curriculum Json From Curriculum Html File
  handoutsFromCurriculum, // Extract Handouts(수업자료) Json From Curriculum Html File(`_files/html/curriculum/${title}.html`)
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
  saveDraftCourseIds, // Save Draft CourseIds(Draft(보관함)으로 이동된 강좌)
  saveActiveCourseList, // Save Active CourseList
  saveCourseTitles, // Save (active) Course Titles
  saveCoursesMap,
  saveAllCourseInfos,
  saveCurriculumsByApi,
  saveAllCurriculumsByApi
} from './udemyData';

import { findChaptersByCourseId, markdownFromHtmlFile, chapterMarkdowns } from './udemyMarkdown';

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

  // * Extract Curriculum Json From Curriculum Html File
  for (let title of findAllCourseTitles()) {
    curriculumFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
  }
  console.log('curriculumFromCurriculum');
  console.log('==========================================================');

  // & Handouts(수업자료)
  // * Extract Handouts(수업자료) Json From Curriculum Html File(`_files/html/curriculum/${title}.html`)
  for (let title of findAllCourseTitles()) {
    handoutsFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
  }
  console.log('handoutsFromCurriculum');
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

// // & init Udemy
// await initUdemy(nick);

// purchaseHistory(nick);

// purchaseHistoryFromPurchaseHistory();

// for (let title of findDraftCourseIds()) {
//   handoutsFromCurriculum(title); // Extract CourseInfo Json From CourseDetail Html File
// }

// curriculums(nick, ['360920', '30-days-of-python']);

// console.log(courseIdByCourseTitle('30-days-of-python'));

// // const draftIds = loadJson(json_list_courseIds_draft);
// const draftIds = ['3090254'];
// curriculums_draft(nick, draftIds);

// const titles = ['360920', '30-days-of-python'];
// for (let title of titles) {
//   curriculumFromCurriculum(title);
// }

// // & UdemyApi
// // console.log(UDEMY_API_USERNAME, UDEMY_API_PASSWORD);
// const udemyApi = new UdemyApi(nick);
// console.log(udemyApi.username);
// const courseId = '1010586'; // ? Become a WordPress Developer: Unlocking Power With Code
// // const data = await fetchCourseInfo(courseId);
// const data = await udemyApi.fetchCourseCurriculum(courseId);

// console.log(data);

// // & UdemyWeb
// // ? courseList
// await courseList(nick, false);

// // ? purchaseHistory
// await purchaseHistory(nick, false);

// // ? courseDetails
// const titles = [
//   'visual-paradigm-essential',
//   'become-an-android-developer-from-scratch',
//   'web-design-figma-webflow-freelancing'
// ];
// // const titles = findActiveCourseTitles();
// await courseDetails(nick, titles);

// ? curriculums
// await curriculums(nick, titles);

// // ? transcripts
const langs = ['한국', '영어'];
// const title = 'complete-web-designer-mobile-designer-zero-to-mastery';
// const title = 'svelte-and-sveltekit';
// const courseId = courseIdByCourseTitle(title);
// const lectureIds = findCourseLectureIds(courseId);
// // * 전체 lectures(lecture(자막) / execise(내용) -> `courses/${title}/content/`)
// for (let lang of langs) {
//   await transcripts(nick, title, lectureIds, lang);
// }

// await transcripts(nick, title, lectureIds, '영어');

// // * 대본 없는 lectures(execise -> `courses/${title}/content/`)
// const allLectureIds = findCourseLectureIds(courseId);
// const lectureIds = findFiles(`_files/courses/${title}/transcript/html/english`).map((name) =>
//   parseInt(name.split('.')[0])
// );
// const execiseIds = allLectureIds.filter((id) => !lectureIds.includes(id));

// await transcripts(nick, title, execiseIds, '한국');

// // ? Handout
// const title = 'complete-web-designer-mobile-designer-zero-to-mastery';
// // handoutsFromHtml(title);
// await handouts({ nick, title });

// // web-design-figma-webflow-freelancing/learn/lecture

// // & udemyHtml
// console.log(courseListFromCourseList(false));, // Extract CourseList Json From CourseList Html Folder
// console.log(courseInfoFromCourseDetail(title, false)); // Extract CourseInfo Json From CourseDetail Html File
// console.log(curriculumFromCourseDetail(title, false)); // Extract Curriculum Json From CourseDetail Html File
// console.log(curriculumFromCurriculum(title, false)); // Extract Curriculum Json From Curriculum Html File
// console.log(handoutsFromCurriculum(title, false)); // Extract Handouts(수업자료) Json From Curriculum Html File(`_files/html/curriculum/${title}.html`)

// & UdemyData
// const udemyData = new UdemyData(nick);
// const data = udemyData.getCourseListHtmls();
// udemyData.saveCourseListBasic(); // course list 전체 목록 저장(From html/courseList/courseList_{i}.html...)
// udemyData.saveCourseListDraft(); // draft course 목록 저장
// udemyData.saveAllCourseInfos(); // 운영중인 강좌(draft course 제외) courseInfo 저장

// console.log(courseTitleByCourseId('24823'));
// console.log(findActiveCourseTitles());

// ? saveCourseList(All/Active/Draft)
// saveCourseListActive();
// saveDraftCourseIds(); // Save Draft CourseIds(Draft(보관함)으로 이동된 강좌)
// saveCourseTitles(); // Save (active) Course Titles
// saveCourseListBasic, saveCourseListDraft, saveAllCourseInfos

// const titles = [
//   'svelte-and-sveltekit',
//   'visual-paradigm-essential',
//   'web-design-figma-webflow-freelancing'
// ];
// const titles = findActiveCourseTitles();
// await curriculums(nick, titles);

// ? saveCurriculums
// await saveCurriculumsByApi(['1832410', '2887266']);
// await saveAllCurriculumsByApi();

// console.log(findCourseLectureIds('3227583'));

// // & udemyMarkdown
// // ?
// // console.log(findChaptersByCourseId('2887266'));
// // chapterMarkdowns('complete-web-designer-mobile-designer-zero-to-mastery');
// // chapterMarkdowns('complete-web-designer-mobile-designer-zero-to-mastery', '영어');
// // chapterMarkdowns('complete-web-designer-mobile-designer-zero-to-mastery', '한국');
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
