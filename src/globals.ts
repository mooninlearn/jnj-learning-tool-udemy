/** globals
 *
 * Description
 *   - global variables / functions
 *
 * Functions
 *   [X] user info (from `.env`)
 *      - web account
 *      - api account
 *   [X] local paths
 *       - constant(folder/file)
 *       - function(folder/file)
 *
 * Usages
 *   -
 *
 * Requirements
 *   - npm install dotenv
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
// * Builtin Modules

// * External Modules
import dotenv from 'dotenv';

// & Variable AREA
// &---------------------------------------------------------------------------
// * Dotenv(계정 아이디/비밀번호, API key 등)
dotenv.config(); // 실행 경로에 있는 `.env`

const UDEMY_API_USERNAME = process.env.UDEMY_API_USERNAME;
const UDEMY_API_PASSWORD = process.env.UDEMY_API_PASSWORD;

const UDEMY_WEB_EMAIL = process.env.UDEMY_WEB_EMAIL;
const UDEMY_WEB_PASSWORD = process.env.UDEMY_WEB_PASSWORD;

// * Settings
// TODO: 확장자가 아니라, 문자열 뒤 6개 문자를 자른 후 '.'이 있는가로 확인?
const DOWNLOAD_EXTS = ['.pdf', '.zip', '.pptx', 'ppt', '.docx', '.doc', '.xlsx', '.png', '.obj']; // 강좌 `수업자료` 다운로드 파일 확장자
const folder_download = 'C:/Users/Jungsam/Downloads'; // 다운로드 폴더(PC 계정에 따라 다름)

// * Paths(파일 경로 상수)
// ? folder(html)
const folder_html_course_list = '_files/html/courseList'; // courseList Html Folder
const folder_html_purchase_history = '_files/html/purchaseHistory'; // courseList Html Folder

// ? json(list)
const json_list_courses_basic = `_files/json/list/courses_basic.json`; // (등록)코스 목록(기본 정보 포함)
const json_list_courses_active = `_files/json/list/courses_active.json`; // (활성) 코스 목록(기본 정보, courseInfo(api) 포함)
const json_list_courseIds_draft = `_files/json/list/courseIds_draft.json`; // (draft)코스 아이디 배열
const json_list_courses_map = `_files/json/list/courses_map.json`; // (활성) 코스 map {<courseId>: <title>, ...}
const json_list_courseTitles_active = `_files/json/list/courseTitles_active.json`; // (활성)코스 제목(kebab-case) 배열
const json_list_instructor_infos = `_files/json/list/instructor_infos.json`; // 강사 정보 목록
const json_list_purchase_history = `_files/json/list/purchase_history.json`; // 구매 이력

// * Paths(Google Drive/Sheets)
// ? Folder
const google_folderId_udemy_root = '1eDsWHdnSsgW2d5zIa69e2GprYBKrpE0k'; // # mooninlearn@gmail.com `My Drive/Udemy`: https://drive.google.com/drive/folders/1eDsWHdnSsgW2d5zIa69e2GprYBKrpE0k

// ? File
const google_spreadsheetId_udemy_courses = '1qFznArW_B3IQdAmp2d2poRnCvAy5tBw37P0cTvex9kI'; //# `My Drive/Udemy/Courses`: https://docs.google.com/spreadsheets/d/1qFznArW_B3IQdAmp2d2poRnCvAy5tBw37P0cTvex9kI/

// & Function AREA
// &---------------------------------------------------------------------------
// * Paths(파일 경로 함수)
// ? html
const html_course_list = (n) => `_files/html/courseList/courseList_${parseInt(n) + 1}.html`; // (등록)코스 목록(active + draft)
const html_course_detail = (title) => `_files/html/courseDetail/${title}.html`; // 강의 상세 페이지(active)
const html_curriculum = (title) => `_files/html/curriculum/${title}.html`; // 커리큘럼(active + draft)
const html_purchase_history = (n) =>
  `_files/html/purchaseHistory/purchaseHistory_${parseInt(n) + 1}.html`; // 구매 내역

// ? json(courseInfo)
const json_course_info_api = (courseId) => `_files/json/courseInfo/api/${courseId}.json`; // courseInfo(from api)
const json_course_info_web = (courseId) => `_files/json/courseInfo/web/${courseId}.json`; // courseInfo(from web(courseDetail))
const json_course_info_web2 = (courseId) => `_files/json/courseInfo/web2/${courseId}.json`; // courseInfo(from web(curriculum))
const json_course_info_mix = (courseId) => `_files/json/courseInfo/mix/${courseId}.json`; // courseInfo(api + web)

// ? json(curriculum)
const json_curriculum_api = (courseId) => `_files/json/curriculum/api/${courseId}.json`; // curriculum(from api)
const json_curriculum_web = (courseId) => `_files/json/curriculum/web/${courseId}.json`; // curriculum(from web(courseDetail))
const json_curriculum_web2 = (courseId) => `_files/json/curriculum/web2/${courseId}.json`; // curriculum(from web(curriculum))
const json_curriculum_lectureIds = (courseId) =>
  `_files/json/curriculum/lectureIds/${courseId}.json`; // curriculum lectureIds(draft course, from web(curriculum))
const json_curriculum_mix = (courseId) => `_files/json/curriculum/mix/${courseId}.json`; // curriculum(api + web)
const json_curriculum_lectures = (courseId) => `_files/json/curriculum/lectures/${courseId}.json`; // curriculum lectrue(active + draft)

// ? folder/file(course)
const folder_courses_transcript = (title, lang) =>
  `_files/courses/${title}/transcript/html/${lang}`; // transcript(자막, lang:(english|korean), web)
const folder_courses_content = (title) => `_files/courses/${title}/content`; // 동영상이 없는 강의, 내용
const folder_courses_handouts = (title) => `_files/courses/${title}/handouts`; // Resource(수업 자료) 다운로드 파일 폴더
const file_courses_handoutList = (title) => `_files/courses/${title}/json/handoutList.json`; // Resource(수업 자료) 위치 정보(handout 다운로드시 사용)
const folder_courses_markdown_notes = (title, lang) =>
  `_files/courses/${title}/markdown/notes/${lang}`; // 강의 정리 노트용(from transcript + content)
const folder_courses_markdown_backups = (title, lang) =>
  `_files/courses/${title}/markdown/_backups/${lang}`; // 강의 정리 노트 원본 백업용

// & Export AREA
// &---------------------------------------------------------------------------
export {
  // ? dotenv(user info)
  UDEMY_API_USERNAME, // udemy api username
  UDEMY_API_PASSWORD, // udemy api password
  UDEMY_WEB_EMAIL, // udemy(web) email
  UDEMY_WEB_PASSWORD, // udemy(web) password

  // ? settings
  DOWNLOAD_EXTS, // 강좌 `수업자료` 다운로드 파일 확장자
  folder_download, // 다운로드 폴더(PC 계정에 따라 다름)

  // ? folder(html)
  folder_html_course_list, // courseList Html Folder
  folder_html_purchase_history, // courseList Html Folder

  // ? html
  html_course_list, // (등록)코스 목록(active + draft)
  html_course_detail, // 강의 상세 페이지(active)
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
  json_course_info_web2, // courseInfo(from web(curriculum))
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
};

// & Test AREA
// &---------------------------------------------------------------------------
