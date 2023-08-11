/** UdemyApi
 *
 * Description
 *   - A Class For Udemy API
 *
 * Functions
 *   [X] load udemy api user info(username, password)
 *   [ ] fetch course info
 *   [ ] fetch course curriculum
 *
 * Usages
 *   -
 *
 * Requirements
 *   - Create `udemy` web account(Register at `udemy.com`)
 *   - Create udemy api account
 *   - Save API Config to Settings Folder(`C:/JnJ-soft/Developments/_Settings/Apis/udemy.json`)
 *
 * References
 *   - [Udemy 제휴사 API 문서(v2.0)](https://www.udemy.com/developers/affiliate/)
 *
 * Authors
 *   - Moon In Learn <mooninlearn@gmail.com>
 *   - JnJsoft Ko <jnjsoft.ko@gmail.com>
 */

// & Import AREA
// &---------------------------------------------------------------------------
// ? Builtin Modules
import dotenv from 'dotenv';

// ? External Modules
import axios from 'axios';

// ? UserMade Modules
import { loadJson } from 'jnj-lib-base';

// ? Local Modules

// & Variable AREA
// &---------------------------------------------------------------------------
dotenv.config(); // 실행 경로에 있는 `.env`
const settingsPath = process.env.ENV_SETTINGS_PATH ?? 'C:/JnJ-soft/Developments/_Settings';

// & Function AREA
// &---------------------------------------------------------------------------
const udemyUserInfo = (nick) => loadJson(`${settingsPath}/Apis/udemy.json`)[nick];

// & Class AREA
// &---------------------------------------------------------------------------
class UdemyApi {
  nick; // ? udemy api user nick(name)
  // userInfo; // ? udemy api user info
  username; // ? udemy api username
  password; // ? udemy api password
  courseId; // ? udemy courseId

  /** class constructor
   * @param nick - udemy api user nicknick
   *
   * @example
   *   udemyApi = new UdemyApi('deverlife')
   */
  constructor(nick: string, courseId: string) {
    const userInfo = udemyUserInfo(nick);
    this.nick = nick;
    this.username = userInfo.apiUsername;
    this.password = userInfo.apiPassword;
    this.courseId = courseId;
  }

  /** fetchCourseInfo
   */
  async fetchCourseInfo() {
    const courseId = this.courseId;
    try {
      let response = await axios(`https://www.udemy.com/api-2.0/courses/${courseId}`, {
        auth: {
          username: this.username,
          password: this.password
        }
      });
      if (response.status == 200) {
        return response.data;
      } else {
        console.log(`## (courseId: ${courseId}) fetchCourseInfoByUdemyApi status != 200`);
        return null;
      }
    } catch (ex) {
      console.log(`## (courseId: ${courseId}) fetchCourseInfoByUdemyApi ERROR`);
      return null;
    }
  }

  /** fetchCourseCurriculum
   */
  async fetchCourseCurriculum() {
    const courseId = this.courseId;
    try {
      let response = await axios(
        `https://www.udemy.com/api-2.0/courses/${courseId}/public-curriculum-items/?page=1&page_size=1000`,
        {
          auth: {
            username: this.username,
            password: this.password
          }
        }
      );
      if (response.status == 200) {
        return response.data.results;
      } else {
        console.log(`## (courseId: ${courseId}) fetchCourseCurriculumByUdemyApi status != 200`);
        return null;
      }
    } catch (ex) {
      console.log(`## (courseId: ${courseId}) fetchCourseCurriculumByUdemyApi ERROR`);
      return null;
    }
  }
}

// & Export AREA
// &---------------------------------------------------------------------------
export {
  UdemyApi // udemy config
};

// & Test AREA
// &---------------------------------------------------------------------------
