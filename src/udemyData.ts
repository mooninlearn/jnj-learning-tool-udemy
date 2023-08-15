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
// ? UserMade Modules
import { loadJson, saveJson, findFiles } from 'jnj-lib-base';

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
// & Find
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

/** findCourseQuizIds
 * Find All Course QuizIds for course(Id)
 * @note
 */
const findCourseQuizIds = (courseId) => {
  const curriculum = loadJson(json_curriculum_api(courseId));
  return curriculum.filter((lecture) => lecture._class == 'quiz').map((lecture) => lecture.id); // chapter|lecture|quiz
};

// & Save
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

// & Export AREA
// &---------------------------------------------------------------------------
export {
  courseTitleByCourseId, // Find Course Title by CourseId
  courseIdByCourseTitle, // Find CourseId By Course Title
  findDraftCourseIds, // Find Draft CourseIds(Draft(보관함)으로 이동된 강좌)
  findActiveCourseIds, //  Find Active CourseIds(활성화(draft되지 않은) 강좌)
  findActiveCourseTitles, // Find Active Courses Titles
  findAllCourseTitles, // Find All Course Titles
  findCourseLectureIds, // Find Course LectureIds
  saveDraftCourseIds, // Save Draft CourseIds(Draft(보관함)으로 이동된 강좌)
  saveActiveCourseList, // Save Active CourseList
  saveCourseTitles, // Save (active) Course Titles
  saveCoursesMap, // Save Course Map: {<courseId>: <title>, ...}
  // saveCourseInfosByApi, // Save CourseInfos By Udemy Api
  saveAllCourseInfos, // Save All CourseInfo(현재 운영중인 강좌(not draft)), `<courseId>.json`
  saveCurriculumsByApi, // Save Curriculums By Api
  saveAllCurriculumsByApi //Save All Curriculums By Api
};

// & Test AREA
// &---------------------------------------------------------------------------
