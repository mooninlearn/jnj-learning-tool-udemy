/** udemyMarkdown
 *
 * Description
 *   - Functions For udemy transcript file(html) to markdown file
 *
 * Functions
 *   [X] chapter(multi lecture)별 markdown file 생성
 *   [ ]
 *
 * Usages
 *   - 독립 실행: udemy> yarn ts-node src/utils/udemyMarkdown.ts
 *
 * Requirements
 *   - npm install showdown
 *
 * References
 *   - node-html-markdown: A fast HTML to markdown cross-compiler, compatible with both node and the browser.
 *   - showdown: A bidirectional markdown to HTML to markdown converter written in JavaScript. It supports extensions and custom options.
 *   - marked: A markdown parser and compiler, built for speed. It implements all markdown features from the supported flavors and specifications.
 *   - turndown
 *
 * Authors
 *   - Moon In Learn <mooninlearn@gmail.com>
 *   - JnJsoft Ko <jnjsoft.ko@gmail.com>
 */

// & Import AREA
// &---------------------------------------------------------------------------
// ? Builtin Modules

// ? External Modules
import TurndownService from 'turndown';

// ? UserMade Modules
import { findFiles, loadFile, saveFile, saveJson, loadJson, sleep } from 'jnj-lib-base';

// ? Local Modules
import {
  // ? folder(html)
  folder_html_course_list, // courseList Html Folder
  folder_html_purchase_history, // courseList Html Folder

  // ? json(list)
  json_list_courses_basic, // (등록)코스 목록(기본 정보 포함)
  json_list_courses_active,
  json_list_purchase_history, // 구매 이력

  // ? json(courseInfo)
  json_course_info_web, // courseInfo(from web(courseDetail))
  json_course_info_web2, // courseInfo(from web(curriculum))

  // ? json(curriculum)
  json_curriculum_api, // curriculum(from web(courseDetail))
  json_curriculum_web2, // curriculum(from web(curriculum))

  // ? folder(course)
  folder_courses_handouts, // Resource(수업 자료) 다운로드 파일 폴더
  file_courses_handoutList // Resource(수업 자료) 위치 정보(handout 다운로드시 사용)
} from './globals';

import { courseIdByCourseTitle } from './udemyData';

// & Variable AREA
// &---------------------------------------------------------------------------

// & Function AREA
// &---------------------------------------------------------------------------
// def set_filename(name, level=1):
//     # punc = r'[\\/:*?"<>|]'  ## NOTE: 파일이름에 사용할 수 없는 문자
//     punc = '[ !"#$%&\'()*+,-./:;<=>?[\]^_`{|}~“”·]' if level == 0 else '[ "#$%&\'*+,/:;=?[\]^`{|}~]' if level == 1 else r'[\\/:*?"<>|]'
//     return re.sub(punc, '_', name)
const fix_filename = (name) => {
  return name.replace(/[ !"#$%&\'()*+,-./:;<=>?[\]^_`{|}~“”·]/g, '_');
};

/** findChaptersByCourseId
 * Find Chapters By CourseId
 * TODO: 강의 시간 등(Web html curriculum 참조) 추가
 * TODO: ``
 */
const findChaptersByCourseId = (courseId, save = true) => {
  // const course = loadJson(`_files/json/curriculum/api/${courseId}.json`);
  const course = loadJson(json_curriculum_api(courseId));
  let chapters = [];
  for (let lecture of course) {
    if (lecture._class == 'chapter') {
      chapters.push({ chapterId: lecture.id, title: lecture.title, lectures: [], quizes: [] });
    } else if (lecture._class == 'lecture') {
      // chapters[chapters.length - 1]['lectures'].push(lecture);
      // chapters[chapters.length - 1]['lectures'].push({lectureId: lecture.id, title: lecture.title, title_cleaned: lecture.title_cleaned});
      chapters[chapters.length - 1]['lectures'].push({
        lectureId: lecture.id,
        title: lecture.title
      });
    } else if (lecture._class == 'quiz') {
      // chapters[chapters.length - 1]['quizes'].push(lecture);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@It's Quiz!");
      chapters[chapters.length - 1]['quizes'].push({ lectureId: lecture.id, title: lecture.title });
    }
  }

  if (save) {
    saveJson(`_files/json/chapters/${courseId}.json`, chapters);
  }

  return chapters;
};

/** markdownFromHtmlFile
 * Markdown From Html File
 *
 */
const markdownFromHtmlFile = (path) => {
  const turndownService = new TurndownService({ headingStyle: 'atx' });
  const html = loadFile(path);
  if (html) {
    return turndownService.turndown(html);
  } else {
    return '';
  }
};

/** markdownFromHtmlFile
 * Markdown From Html File
 * TODO: quiz
 */
const chapterMarkdowns = (title, lang = '한국') => {
  // title = 'complete-web-designer-mobile-designer-zero-to-mastery';
  const langTag = lang == '한국' ? 'korean' : 'english';
  // const courseId = '2887266';
  // const courseId = '3227583';
  const courseId = courseIdByCourseTitle(title);
  const chapters = findChaptersByCourseId(courseId); // TODO: save 자동 설정
  // for (let chapter of chapters) {
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const prefix = (i + 1).toString().padStart(3, '0'); // 일련번호
    let markdown = `# ${chapter.title}\n\n`;
    for (let lecture of chapter.lectures) {
      let lectureId = lecture.lectureId;
      // console.log(`lectureId: ${lectureId}`);
      markdown += `## [${lecture.title}](https://www.udemy.com/course/${title}/learn/lecture/${lectureId})\n\n`;

      // ? transcript
      let _markdown = markdownFromHtmlFile(
        `_files/courses/${title}/transcript/html/${langTag}/${lectureId}.html`
      );

      if (_markdown.length < 2) {
        // ?transcript(대본)가 없는 경우는 content(내용)
        _markdown = markdownFromHtmlFile(`_files/courses/${title}/content/${lectureId}.html`);
      }

      if (_markdown.length > 2) {
        markdown += _markdown.replaceAll('\n\n', '\n') + '\n\n\n';
      } else {
        // ? 대본/내용이 없는 경우
        markdown += '__EMPTY__\n\n\n';
      }
    }
    saveFile(
      `_files/courses/${title}/markdown/_backups/${langTag}/${prefix}_${fix_filename(
        chapter.title
      )}.md`,
      // `_files/courses/${title}/markdown/_backups/${langTag}/${prefix}_${fix_filename(chapter.title)}_${
      //   chapter.chapterId
      // }.md`,
      markdown
    );
    saveFile(
      `_files/courses/${title}/markdown/notes/${langTag}/${prefix}_${fix_filename(
        chapter.title
      )}.md`,
      markdown
    );
    // saveFile(`_files/courses/transcript/markdown/${langTag}/${chapter.title}.md`, markdown);  // TODO: title에 있는 파일이름 금지 문자 치환
  }

  // {
  //   "lectureId": 19734534,
  //   "title": "Initial Setup"
  // },
  // return turndownService.turndown(loadFile(path));
};

// & Export AREA
// &---------------------------------------------------------------------------
export {
  findChaptersByCourseId, // Find Chapters By CourseId
  markdownFromHtmlFile, //
  chapterMarkdowns // create chapter markdown files for course(by title)
};

// & Test AREA
// &---------------------------------------------------------------------------
// const path =
//   '_files/html/transcript/english/complete-web-designer-mobile-designer-zero-to-mastery/21447554.html';

// scriptMdFromHtml(path);
