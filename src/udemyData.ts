/** UdemyData
 *
 * Description
 *   - A Class For Udemy Data
 *
 * Functions
 *   [X]
 *
 * Usages
 *   -
 *
 * Requirements
 *   -
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
// ? External Modules
import _ from 'lodash';

// ? UserMade Modules
import { loadJson, saveJson, findFiles, renameKeys } from 'jnj-lib-base';

// ? Local Modules
import {
  // ? html
  html_course_list, // (등록)코스 목록
  html_course_detail, // 강의 상세 페이지
  html_curriculum, // 커리큘럼(active + draft)
  html_purchase_history, // 구매 내역

  // ? json(list)
  json_list_courses_basic, // (등록)코스 목록(기본 정보 포함)
  json_list_courses_active, // (활성) 코스 목록(기본 정보, courseInfo(api) 포함)
  json_list_courseIds_draft, // (draft)코스 아이디 배열
  json_list_courses_map, // (활성) 코스 map {<courseId>: <title>, ...}
  json_list_courseTitles_active, // (활성)코스 제목(kebab-case) 배열
  json_list_instructor_infos, // 강사 정보 목록
  json_list_purchase_history, // 구매 이력

  // ? json(courseInfo)
  json_course_info_api, // courseInfo(from api)
  json_course_info_web, // courseInfo(from web(courseDetail))
  // json_course_info_web2,  // courseInfo(from web(curriculum))
  json_course_info_mix, // courseInfo(api + web)

  // ? json(curriculum)
  json_curriculum_api, // curriculum(from api)
  json_curriculum_web, // curriculum(from web(courseDetail))
  json_curriculum_web2, // curriculum(from web(curriculum))
  json_curriculum_lectureIds, // curriculum lectureIds(draft course, from web(curriculum))
  json_curriculum_mix, // curriculum(api + web)
  json_curriculum_lectures, // curriculum lectrue(active + draft)

  // ? folder(course)
  folder_courses_transcript, // transcript(자막, lang:(english|korean), web)
  folder_courses_content, // 동영상이 없는 강의, 내용
  folder_courses_handouts, // Resource(수업 자료) 다운로드 파일 폴더
  file_courses_handoutList, // Resource(수업 자료) 위치 정보(handout 다운로드시 사용)
  folder_courses_markdown_notes, // 강의 정리 노트용(from transcript + content)
  folder_courses_markdown_backups // 강의 정리 노트 원본 백업용
} from '../src/globals';
import { UdemyApi, fetchCourseInfo, fetchCourseCurriculum } from './UdemyApi';

// & Variable AREA
// &---------------------------------------------------------------------------

// const COURSE_LIST_HTML_FOLDER = (i) => `_files/html/courseList/courseList_${i}.html`;
// const COURSE_LIST_HTML_FOLDER = `_files/html/courseList`;
// const COURSE_LIST_JSON_BASIC = `_files/json/courses_basic.json`;
// const COURSE_LIST_JSON_DRAFT = `_files/json/courses_draft.json`;
// const COURSE_IDS_DRAFT = `_files/json/courseIds_draft.json`;
// const COURSE_TITLES = `_files/json/courseTitles_active.json`;
// const COURSE_LIST_JSON_ACTIVE = `_files/json/courses_active.json`;

// const COURSE_INFO_API_FOLDER = `_files/json/courseInfo/api`;
// const CURRICULUM_API_FOLDER = `_files/json/curriculum/api`;

// & Function AREA
// &---------------------------------------------------------------------------
// * Find
/** findAllCourseIds
 * Find All CourseIds From `courses_basic.json`
 */
const findAllCourseIds = () => Object.keys(loadJson(json_list_courses_basic));

/** findDraftCourseIds
 * Find Draft CourseIds(Draft(보관함)으로 이동된 강좌)
 * @note `courses_draft.json` 파일 기준으로 생성
 */
const findDraftCourseIds = () => loadJson(json_list_courseIds_draft);

/** findActiveCourseIds
 * Find Active CourseIds(활성화(draft되지 않은) 강좌)
 * @note `courses_basic.json` + `courses_draft.json` 파일 기준으로 생성
 */
const findActiveCourseIds = () =>
  findAllCourseIds().filter((x) => !findDraftCourseIds().includes(x));

/** courseTitleByCourseId
 * Find Course Title by CourseId
 * @note `json/courseInfo/api/{courseId}.json` 파일 기준으로 생성
 */
const courseTitleByCourseId = (courseId) => {
  // const path = `${COURSE_INFO_API_FOLDER}/${courseId}.json`;
  // console.log(path);
  // const info = loadJson(`${COURSE_INFO_API_FOLDER}/${courseId}.json`);
  const info = loadJson(json_course_info_api(courseId));
  // console.log(info);
  return info ? info.published_title : courseId; // published_title가 없으면 courseId 그냥 반환(draft course로 취급)
};

/** courseIdByCourseTitle
 * Find CourseId By Course Title
 * @note `json_list_courseTitles_active(courses_active.json)` 파일 기준으로 검색
 */
const courseIdByCourseTitle = (courseTitle) => {
  if (/^\d+$/.test(courseTitle)) {
    // courseTitle가 숫자로만 이루어져 있으면 courseTitle 그냥 반환(draft course로 취급)
    return courseTitle;
  }
  for (let [courseId, course] of Object.entries(loadJson(json_list_courses_active))) {
    if (course['published_title'] == courseTitle) {
      return courseId;
    }
  }
  return null;
};

/** findActiveCourseTitles
 * Find Active Course Titles
 * @note `json/courseInfo/api/{courseId}.json` 파일들 기준으로 생성
 */
const findActiveCourseTitles = () => {
  return findActiveCourseIds().map((courseId) => courseTitleByCourseId(courseId));
};

/** findllCourseTitles
 * Find All Course Titles(active + draft(courseId))
 * @note active course: title, draft course: courseId 사용
 */
const findAllCourseTitles = () => {
  const activeTitles = findActiveCourseIds().map((courseId) => courseTitleByCourseId(courseId));
  const draftIds = findDraftCourseIds();
  return [...activeTitles, ...draftIds];
};

/** findCourseLectureIds
 * Find All Course LectureIds for course(Id)
 * @note
 */
const findCourseLectureIds = (courseId) => {
  const curriculum = loadJson(json_curriculum_api(courseId));
  return curriculum.filter((lecture) => lecture._class == 'lecture').map((lecture) => lecture.id); // chapter|lecture|quiz
};

/** findAllLectureIds
 * findAllLectureIds for course(Id) (by json_curriculum_lectures)
 * @note
 */
const findAllLectureIds = (courseId) => {
  const curriculum = loadJson(json_curriculum_lectures(courseId));
  return curriculum.map((lecture) => lecture.lectureId); // chapter|lecture|quiz
};

/** findCourseQuizIds
 * Find All Course QuizIds for course(Id)
 * @note
 */
const findCourseQuizIds = (courseId) => {
  const curriculum = loadJson(json_curriculum_api(courseId));
  return curriculum.filter((lecture) => lecture._class == 'quiz').map((lecture) => lecture.id); // chapter|lecture|quiz
};

// * Mix
/** mixCourseInfo
 *   Mix CourseInfo(basic + purchase_history + infoApi + infoWeb(courseDetail))
 * @note
 *  - active course만 적용됨
 *  - 'price_detail', 'id': 삭제
 *  - 'visible_instructors' / 'locale': 'instructorsUrl'만 남김 / 'locale'만 남김
 */
const mixCourseInfo = (courseId) => {
  let infoBasic = loadJson(json_list_courses_basic)[courseId];
  const title = courseTitleByCourseId(courseId);
  let courseInfo;
  let history;

  if (title == courseId) {
    // draft course
    history = loadJson(json_list_purchase_history).find(
      (history) => history.title == `draft/${courseId}`
    );
    courseInfo = { ...infoBasic, ..._.omit(history, ['title', 'payment']) };
  } else {
    // active course
    history = loadJson(json_list_purchase_history).find((history) => history.title == title);
    history = _.omit(history, ['title', 'payment']);

    let infoApi = loadJson(json_course_info_api(courseId));
    let infoWeb = loadJson(json_course_info_web(courseId));
    infoWeb.totalTime = infoWeb.totalTime.split(':').pop().trim();

    let infoMix = _.omit(infoApi, ['price_detail', 'visible_instructors', 'locale', 'id']);
    infoMix['instructorsUrl'] = infoApi['visible_instructors'].map((x) => x['url']).join(',');
    infoMix['locale'] = infoApi['locale']['locale'];

    // courseInfo = { ..._.omit(infoBasic, ['image']), ...history, ...infoMix, ...infoWeb };
    courseInfo = { ...infoBasic, ...history, ...infoMix, ...infoWeb };
    courseInfo.updatedAt = courseInfo.updatedAt.split(':').pop().trim(); //"마지막 업데이트: 2017. 7."
    courseInfo.totalTime = courseInfo.totalTime.replace('분m', '분'); // "5시간 26분m"
  }

  return courseInfo;
};

// /** mixCurriculum
//  *  Mix Curriculum(curriculumApi + curriculumWeb(courseDetail))
//  * @note
//  */
// const mixCurriculum = (courseId) => {
//   let curriculumApi = loadJson(json_curriculum_api(courseId));
//   let curriculumWeb = loadJson(json_curriculum_web(courseId));

//   for (let i = 0; i < curriculumWeb.length; i++) {
//     // ? chapter 업데이트
//     let chapter = curriculumWeb[i];
//     chapter = {
//       ...chapter,
//       ...curriculumApi.find(
//         (lecture) => lecture._class == 'chapter' && lecture.title == chapter.title
//       )
//     };
//     curriculumWeb[i] = chapter;

//     // ? lectures 업데이트
//     for (let chapter of curriculumWeb) {
//       for (let j = 0; j < chapter['lectures'].length; j++) {
//         let _lecture = chapter['lectures'][j];
//         _lecture = {
//           ..._lecture,
//           ...curriculumApi.find(
//             (lecture) => lecture._class != 'chapter' && lecture.title == _lecture.title
//           )
//         };
//         chapter['lectures'][j] = _lecture;
//         // console.log(_lecture);
//       }
//     }
//   }

//   return curriculumWeb;
// };

/** mixActiveCurriculum
 *  Mix Curriculum(curriculumApi + curriculumWeb(courseDetail))
 * @note
 */
const mixActiveCurriculum = (courseId) => {
  let curriculumApi = loadJson(json_curriculum_api(courseId));
  let curriculumWeb = loadJson(json_curriculum_web(courseId));

  let chapterApi = curriculumApi.filter((lect) => lect._class == 'chapter');
  let lectureApi = curriculumApi.filter((lect) => lect._class != 'chapter');

  for (let i = 0; i < curriculumWeb.length; i++) {
    // ? chapter 업데이트
    let chapter = curriculumWeb[i];

    chapter = {
      ...chapter,
      ...chapterApi[i]
    };
    curriculumWeb[i] = chapter;
  }
  let count = 0;

  // ? lectures 업데이트
  for (let chapter of curriculumWeb) {
    for (let j = 0; j < chapter['lectures'].length; j++) {
      let _lecture = chapter['lectures'][j];
      _lecture = {
        ..._lecture,
        ...lectureApi[count]
      };
      chapter['lectures'][j] = _lecture;
      count += 1;
      // console.log(_lecture);
    }
  }

  return curriculumWeb;
};

/** mixActiveCurriculum
 *  Mix Curriculum(curriculumApi + curriculumWeb(courseDetail))
 * @note
 */
const mixDraftCurriculum = (courseId) => {
  let curriculumWeb = loadJson(json_curriculum_web2(courseId));
  const lectureIds = loadJson(json_curriculum_lectureIds(courseId));
  if (!lectureIds || lectureIds.length == 0) {
    return [];
  }

  // ? lectures 업데이트
  let count = 0;
  for (let i = 0; i < curriculumWeb.length; i++) {
    // ? chapter 업데이트
    let chapter = curriculumWeb[i];
    for (let j = 0; j < chapter['lectures'].length; j++) {
      let _lecture = chapter['lectures'][j];
      _lecture = {
        ..._lecture,
        id: parseInt(lectureIds[count])
      };
      chapter['lectures'][j] = _lecture;
      count += 1;
    }
    curriculumWeb[i] = chapter;
  }
  // console.log(curriculumWeb);
  return curriculumWeb;
};

/** lecturesFromMixCurriculum
 *  Lectures(active course + draft course, <-MixCurriculum)
 * @note
 */
const lecturesFromMixCurriculum = (courseId) => {
  const curriculum = loadJson(json_curriculum_mix(courseId));
  let lectures = [];
  let i = 0;
  for (let [key, curri] of Object.entries(curriculum)) {
    i += 1;
    let j = 0;
    for (let lect of curri['lectures']) {
      let lecture = {};
      j += 1;
      lecture['chapterNo'] = i;
      lecture['lectureNo'] = j;
      lecture['chapterId'] = curri['id'] ?? '';
      lecture['lectureId'] = lect['id'] ?? '';
      let chapterTitle = curri['title'] ?? '';
      // ? "섹션 1: Introduction", `섹션 1: ` 부분 제거
      if (chapterTitle != '' && lecture['chapterId'] == '') {
        chapterTitle = chapterTitle.split(': ').pop();
      }
      let lectureTitle = lect['title'] ?? '';
      // ? "1. Introduction and Installation", `1. ` 부분 제거
      if (lectureTitle != '' && lecture['chapterId'] == '') {
        lectureTitle = lectureTitle.split('. ').slice(1).join('. ');
      }
      lecture['chapterTitle'] = chapterTitle;
      lecture['lectureTitle'] = lectureTitle;
      lecture['duration'] = lect['time'] ?? lect['duration'] ?? '';
      lecture['description'] = lect['description'] ?? '';
      // lecture['isDraft'] = curri['id'] == undefined;
      // lecture['isDraft'] = lecture['chapterId'] == '';
      // lecture['type'] = lect['_class'] ?? ''
      lectures.push(lecture);
    }
  }
  return lectures;
};

// * Save
/** saveDraftCourseIds
 * Save Draft CourseIds
 * @note `courses_basic.json` 파일 기준으로 생성/저장
 */
const saveDraftCourseIds = async () => {
  let drafts = [];
  for (let courseId of findAllCourseIds()) {
    if (!(await fetchCourseInfo(courseId))) {
      drafts.push(courseId);
    }
  }
  saveJson(json_list_courseIds_draft, drafts);
};

/** saveCourseTitles
 * Save (active) Course Titles
 * @note `courses_basic.json` / `courses_draft.json` / `courseInfo/api/<courseId>.json` 파일 기준으로 생성/저장
 */
const saveCourseTitles = async () => {
  saveJson(json_list_courseTitles_active, findActiveCourseTitles());
};

/** saveActiveCourseList
 * Save Active Course List(활성(draft되지 않은) 강좌)
 * @note `courses_basic.json` 파일 기준으로 생성/저장
 */
const saveActiveCourseList = () => {
  const activeIds = findAllCourseIds();
  const allcourses = loadJson(json_list_courses_basic);
  let activeCourses = {};
  for (let [courseId, course] of Object.entries(loadJson(json_list_courses_basic))) {
    if (activeIds.includes(courseId)) {
      const info = loadJson(json_course_info_api(courseId)); // ? courseInfo
      activeCourses[courseId] = { ...info, meter: course['meter'], sn: course['sn'] }; // TODO: meter, sn, id 이름 변경
      // activeCourses[courseId] = info;
    }
  }
  console.log(saveActiveCourseList);
  saveJson(json_list_courses_active, activeCourses);
};

/** saveCourseInfosByApi
 * Save CourseInfos By Udemy Api
 */
const saveCourseInfosByApi = async (courseIds) => {
  for (let courseId of courseIds) {
    saveJson(json_course_info_api(courseId), await fetchCourseInfo(courseId));
  }
};

/** saveAllCourseInfos
 * Save All CourseInfo(현재 운영중인 강좌(not draft)), `<courseId>.json`
 * @note `courses_basic.json` / `courses_draft.json` 기준으로 생성/저장
 */
const saveAllCourseInfos = async () => {
  saveCourseInfosByApi(findActiveCourseIds());
};

/** saveCourseMap
 * Save Course Map: {<courseId>: <title>, ...}
 * @note `courses_active.json` 기준으로 생성/저장
 */
const saveCoursesMap = () => {
  let courses_map = {};
  for (let [courseId, course] of Object.entries(loadJson(json_list_courses_active))) {
    courses_map[courseId] = course['published_title'];
  }
  saveJson(json_list_courses_map, courses_map);
};

/** saveCurriculumsByApi
 *  Save Curriculums By Api
 * @note
 */
const saveCurriculumsByApi = async (courseIds) => {
  for (let courseId of courseIds) {
    let curriculum = await fetchCourseCurriculum(courseId);
    // console.log(`courseId: ${courseId}`, curriculum);
    saveJson(json_curriculum_api(courseId), curriculum);
  }
};

/** saveAllCurriculumsByApi
 * Save All Curriculums By Api
 * @note
 */
const saveAllCurriculumsByApi = async () => {
  await saveCurriculumsByApi(findActiveCourseIds());
};

// /** saveAllMixCourseInfos
//  * Save All Mix CourseInfo
//  * @note
//  */
// const saveAllMixCourseInfos = () => {
//   for (let courseId of findActiveCourseIds()) {
//     saveJson(json_course_info_mix(courseId), mixCourseInfo(courseId));
//   }
// };

/** saveAllMixCourseInfos
 * Save All Mix CourseInfo(active + draft course)
 * @note
 */
const saveAllMixCourseInfos = () => {
  for (let courseId of findAllCourseIds()) {
    saveJson(json_course_info_mix(courseId), mixCourseInfo(courseId));
  }
};

/** saveMixActiveCurriculums
 * Save Mix Active Curriculums(given courseIds)
 */
const saveMixActiveCurriculums = (courseIds) => {
  // ? active course
  for (let courseId of courseIds) {
    saveJson(json_curriculum_mix(courseId), mixActiveCurriculum(courseId));
  }
};

/** saveAllMixCurriculums
 * Save All Mix Curriculums(active course + draft course)
 * @note
 *   active course + draft course
 */
const saveAllMixCurriculums = () => {
  // ? active course
  for (let courseId of findActiveCourseIds()) {
    saveJson(json_curriculum_mix(courseId), mixActiveCurriculum(courseId));
  }
  // ? draft course
  // for (let courseId of findDraftCourseIds()) {
  //   saveJson(json_curriculum_mix(courseId), loadJson(json_curriculum_web2(courseId)));
  // }
  for (let courseId of findDraftCourseIds()) {
    saveJson(json_curriculum_mix(courseId), mixDraftCurriculum(courseId));
  }
};

/** saveAllLectures
 * Save All Lectures(active course + draft course)
 * @note
 */
const saveAllLectures = () => {
  // const courseId = '24823';
  // const courseId = '244336';
  for (let courseId of findAllCourseIds()) {
    saveJson(json_curriculum_lectures(courseId), lecturesFromMixCurriculum(courseId));
  }
  // console.log(lecturesFromMixCurriculum(courseId));
};

/** saveTrascriptCount
 * Save Trascript Count For All Courses(active course + draft course)
 * @note
 */
const saveTrascriptCount = () => {
  let transcriptCount = [];
  let langs = ['english', 'korean'];
  for (let title of findAllCourseTitles()) {
    let count = {};
    count[title] = { english: 0, korean: 0 };
    for (let lang of langs) {
      count[title][lang] = findFiles(`_files/courses/${title}/transcript/html/english`).length;
    }
    transcriptCount.push(count);
  }

  saveJson('_files/json/list/transcript_count.json', transcriptCount);
};

/**  saveContentCount
 * Save Content Count For All Courses(active course + draft course)
 * @note
 */
const saveContentCount = () => {
  let contentCount = [];
  for (let title of findAllCourseTitles()) {
    let count = {};
    count[title] = findFiles(`_files/courses/${title}/content`).length;
    contentCount.push(count);
  }

  saveJson('_files/json/list/content_count.json', contentCount);
};

/** saveHandoutCount
 * Save Handout Count(fileNum, downloadedNum) For All Courses(active course + draft course)
 * @note
 */
const saveHandoutCount = () => {
  let handoutCount = [];
  for (let title of findAllCourseTitles()) {
    let count = {};
    count[title] = { fileNum: 0, downloadedNum: 0 };
    count[title]['fileNum'] = loadJson(file_courses_handoutList(title)).length;
    count[title]['downloadedNum'] = findFiles(folder_courses_handouts(title)).length;
    handoutCount.push(count);
  }

  saveJson('_files/json/list/handout_count.json', handoutCount);
};

/** saveAllInstructorInfos
 * Save All Instructor Infos(active course 강사 정보)
 * @note
 */
const saveAllInstructorInfos = () => {
  let instructorInfos = {};
  for (let courseId of findActiveCourseIds()) {
    const courseInfo = loadJson(json_course_info_api(courseId));
    for (let instructorInfo of courseInfo['visible_instructors']) {
      const instructorId = instructorInfo['url'].split('/')[2];
      if (!Object.keys(instructorInfos).includes(instructorId)) {
        instructorInfos[instructorId] = instructorInfo;
      }
    }
  }
  saveJson(json_list_instructor_infos, instructorInfos);
};

// & Export AREA
// &---------------------------------------------------------------------------
export {
  courseTitleByCourseId, // Find Course Title by CourseId
  courseIdByCourseTitle, // Find CourseId By Course Title
  findAllCourseIds, // Find All CourseIds From `courses_basic.json`
  findDraftCourseIds, // Find Draft CourseIds(Draft(보관함)으로 이동된 강좌)
  findActiveCourseIds, //  Find Active CourseIds(활성화(draft되지 않은) 강좌)
  findActiveCourseTitles, // Find Active Courses Titles
  findAllCourseTitles, // Find All Course Titles
  findCourseLectureIds, // Find Course LectureIds
  findAllLectureIds, // findAllLectureIds for course(Id) (by json_curriculum_lectures)
  saveDraftCourseIds, // Save Draft CourseIds(Draft(보관함)으로 이동된 강좌)
  saveActiveCourseList, // Save Active CourseList
  saveCourseTitles, // Save (active) Course Titles
  saveCoursesMap, // Save Course Map: {<courseId>: <title>, ...}
  // saveCourseInfosByApi, // Save CourseInfos By Udemy Api
  saveAllCourseInfos, // Save All CourseInfo(현재 운영중인 강좌(not draft)), `<courseId>.json`
  saveCurriculumsByApi, // Save Curriculums By Api
  saveAllCurriculumsByApi, //Save All Curriculums By Api
  saveAllMixCourseInfos, // Save All Mix CourseInfo
  saveMixActiveCurriculums, // Save Mix Active Curriculums(given courseIds)
  saveAllMixCurriculums, // Save All Mix Curriculums(active course + draft course)
  saveAllLectures, // Save All Lectures(active course + draft course)
  saveTrascriptCount, // Save Trascript Count For All Courses(active course + draft course)
  saveContentCount, // Save Content Count For All Courses(active course + draft course)
  saveHandoutCount, // Save Handout Count(fileNum, downloadedNum) For All Courses(active course + draft course)
  saveAllInstructorInfos // Save All Instructor Infos(active course 강사 정보)
};

// & Test AREA
// &---------------------------------------------------------------------------
