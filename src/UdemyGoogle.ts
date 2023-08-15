/** UdemyGoogle
 *
 * Description
 *   - A Class For Udemy Courses - Google Drive/Sheets
 *
 * Functions
 *   [X]
 *
 * Usages
 *   -
 *
 * Requirements
 *   - Google Account
 *   - Google Cloud Platform
 *   - Google API credential
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
// import axios from 'axios';

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
class UdemyGoogle {
  nick; // ? udemy api user nick(name)

  /** class constructor
   * @param nick - udemy api user nick
   *
   * @example
   *   udemyGoogle = new UdemyGoogle('deverlife')
   */
  constructor(nick: string) {
    const userInfo = udemyUserInfo(nick);
    this.nick = nick;
  }
}

// & Instance / (Method) Function
// &---------------------------------------------------------------------------
const udemyGoogle = (nick) => new UdemyGoogle(nick);

// & Export AREA
// &---------------------------------------------------------------------------
export {
  UdemyGoogle // [class] UdemyGoogle
};

// & Test AREA
// &---------------------------------------------------------------------------
