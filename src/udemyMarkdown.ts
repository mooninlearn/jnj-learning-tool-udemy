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
  json_curriculum_lectures, // curriculum lectrue(active + draft)

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
const fixFileName = (name) => {
  return name.replace(/[ !"#$%&\'()*+,-./:;<=>?[\]^_`{|}~“”·]/g, '_');
};

/** markdownFromHtmlStr
 * Markdown From Html String
 *
 */
const markdownFromHtmlStr = (html) => {
  const turndownService = new TurndownService({ headingStyle: 'atx' });
  return turndownService.turndown(html);
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
  // const chapters = findChaptersByCourseId(courseId); // TODO: save 자동 설정
  const lectures = loadJson(json_curriculum_lectures(courseId));

  let markdown = '';
  let count = 0;
  let chapterNum = 0;
  let lectureNum = 1;
  let prefix = '';
  for (let i = 0; i < lectures.length; i++) {
    const lecture = lectures[i];
    const lectureId = lecture.lectureId;
    // const firstLectureIndexes = lectures.find((lecture) => lecture['lectureNoe'] == 1)
    if (lecture.lectureNo == 1) {
      // 첫번째 lecture인 경우
      chapterNum += 1;
      prefix = chapterNum.toString().padStart(3, '0'); // 일련번호
      let lectures_ = lectures.filter((lect) => lect['chapterNo'] == lecture.chapterNo);
      lectureNum = lectures_.length;
      // console.log(`lectureNum: ${lectureNum}`);
      count = 0;
      markdown = `# ${lecture.chapterTitle ?? ''}\n\n`;
    }
    count += 1;
    markdown += `## [${lecture.lectureTitle}](https://www.udemy.com/course/${title}/learn/lecture/${lectureId})\n`;
    markdown += `- Duration: ${lecture.duration ?? '00:00'}\n`;
    markdown += `- Description: ${markdownFromHtmlStr(lecture.description) ?? ''}\n\n`;

    // ? transcript
    let transcript = markdownFromHtmlFile(
      `_files/courses/${title}/transcript/html/${langTag}/${lectureId}.html`
    );

    if (transcript.length > 2) {
      // ? transcript대본이 있는 경우
      markdown += `- Transcript:\n${transcript.replaceAll('\n\n', '\n') + '\n\n\n'}`;
    } else {
      let content = markdownFromHtmlFile(`_files/courses/${title}/content/${lectureId}.html`);
      if (content.length > 2) {
        // ? content내용이 있는 경우
        markdown += `- Content:\n${content.replaceAll('\n\n', '\n') + '\n\n\n'}`;
      } else {
        // ? 대본/내용이 없는 경우
        markdown += '__EMPTY__\n\n\n';
      }
    }

    // ? 마지막 lecture
    // console.log(`${count} / ${lectureNum}`);
    if (count == lectureNum) {
      // console.log(`save File ${lecture.chapterTitle} ${lectureId}`);
      saveFile(
        `_files/courses/${title}/markdown/notes/${langTag}/${prefix}_${fixFileName(
          lecture.chapterTitle
        )}.md`,
        markdown
      );
    }
  }
};

// & Export AREA
// &---------------------------------------------------------------------------
export {
  markdownFromHtmlStr, // Markdown From Html String
  markdownFromHtmlFile, //
  chapterMarkdowns // create chapter markdown files for course(by title)
};

// & Test AREA
// &---------------------------------------------------------------------------
// const path =
//   '_files/html/transcript/english/complete-web-designer-mobile-designer-zero-to-mastery/21447554.html';

// scriptMdFromHtml(path);
