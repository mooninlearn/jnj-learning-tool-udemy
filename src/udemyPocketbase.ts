/** udemyPocketase
 *
 * Description
 *   - A Class For Using Pocketbase
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
import dotenv from 'dotenv';

// ? UserMade Modules
import { dictsFromArrs, sleep } from 'jnj-lib-base';
import { PbApi, Sqlite, pocketbaseSchemaFromMysqlSchema, sqlInsertOne } from 'jnj-lib-db';
import { GoogleSheet } from 'jnj-lib-google';

// & Variable AREA
// &---------------------------------------------------------------------------
dotenv.config({ path: '../.env' });

const url = process.env.PUBLIC_POCKETBASE_URL;
const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;
const googleNick = process.env.GOOGLE_NICK;
const sqlitePath = process.env.SQLITE_DB_PATH;
// const sqlitePath = 'C:/JnJ-soft/Developments/_Templates/pocketbase/auth2/sqlite/data.db';

const LIST_SHEET_NAME = '__list';

// & googleSheet
// ? Initiate
const googleSheet = new GoogleSheet(googleNick); //
const spreadsheetId_udemyData = '1qFznArW_B3IQdAmp2d2poRnCvAy5tBw37P0cTvex9kI'; //# `My Drive/Udemy/udemyData`: https://docs.google.com/spreadsheets/d/1qFznArW_B3IQdAmp2d2poRnCvAy5tBw37P0cTvex9kI/
const spreadsheetId = '15YBBR8Se0_xicJobzqNTrQRiRoZk2rcm92MJz6GtLJY'; //# `My Drive/Udemy/udemyTableSchema`: https://docs.google.com/spreadsheets/d/1qFznArW_B3IQdAmp2d2poRnCvAy5tBw37P0cTvex9kI/

// & pbApi
// ? Initiate
const pba = new PbApi(url);
await pba.init(email, password);

// & sqlite
// ? Initiate
const sqlite = new Sqlite(sqlitePath);

// & Function AREA
// &---------------------------------------------------------------------------
// * Create Table(Collection) By GoogleSheets
/** tableInfoListInGoogleSheet
 * TableInfoList In GoogleSheet(table schema가 정의되어 있는 spreadsheet의 `__tableInfo`에 있는 tableInfo 내용)
 */
const tableInfoListInGoogleSheet = async ({ spreadsheetId, googleSheet }) => {
  const sheetName = LIST_SHEET_NAME;
  return dictsFromArrs(await googleSheet.getValues({ sheetName, spreadsheetId }));
};

/**insertTableInfo
 * Insert TableInfo(tableInfoList(table schema가 정의되어 있는 spreadsheet의 `__tableInfo`에서 추출)에서 tableName 내용을 `tableInfo` 테이블에 추가)
 */
const insertTableInfo = async (tableName, tableInfoList) => {
  // console.log(tableInfoList.find((table) => table['table_name'] == tableName));
  const tableInfo = tableInfoList.find((table) => table['table_name'] == tableName);
  if (!tableInfo) {
    console.log('tableInfo가 없습니다');
    return;
  }
  sqlite.insertOne(
    'tableInfo',
    tableInfoList.find((table) => table['table_name'] == tableName)
  );
};

/**insertTableSchemaByGoogleSheet
 * Insert TableSchema By GoogleSheet(table schema가 정의되어 있는 spreadsheet의 sheet(sheetName)의 schema 내용을 `tableSchema` 테이블에 추가)
 */
const insertTableSchemaByGoogleSheet = async ({ sheetName, spreadsheetId, googleSheet }) => {
  const values = await googleSheet.getValues({ sheetName, spreadsheetId });

  const maps_for_insert_tableSchema = {
    table_name: 'table_name', // 추가 field
    Field: 'field_name',
    Type: 'type_mysql',
    Null: 'is_null',
    Key: 'key',
    Default: 'default_value',
    Extra: 'extra',
    _colName: 'col_name',
    _use: 'use',
    _sn: 'sn',
    _description: 'description',
    _example: 'example',
    _remark: 'remark'
  };

  // ? 'table_name' 추가
  let values_ = [['table_name', ...values[0]]];
  for (let value of values.slice(1)) {
    values_.push([sheetName, ...value]);
  }

  const courseInfos = await dictsFromArrs(values_, maps_for_insert_tableSchema);
  sqlite.insert('tableSchema', courseInfos);
  // for (let courseInfo of courseInfos) {
  //   await sqlite.insertOne('tableSchema', courseInfo);
  // }
};

/**creatTableByGoogleSheet
 * Creat Table By GoogleSheet(table schema가 정의되어 있는 spreadsheet의 sheet(sheetName)에 지정된 schema(mysql 기준)에 따라 pocketbase table 생성)
 */
const creatTableByGoogleSheet = async ({ sheetName, spreadsheetId, googleSheet }) => {
  let schemaArrs = await googleSheet.getValues({ sheetName, spreadsheetId });
  const schema = pocketbaseSchemaFromMysqlSchema(schemaArrs);
  console.log(schema);
  await pba.pb.collections.create({
    name: sheetName,
    type: 'base',
    schema
  });
};

/**registerTablesByGoogleSheet
 * Register Tables By GoogleSheet(table schema가 정의되어 있는 spreadsheet에서 지정된 sheet들(sheetNames))
 */
const registerTablesByGoogleSheet = async ({
  sheetNames,
  spreadsheetId,
  googleSheet,
  overwrite = false
}) => {
  const tableInfoList = await tableInfoListInGoogleSheet({ spreadsheetId, googleSheet });

  for (const sheetName of sheetNames) {
    // ? tableName이 존재하는지 확인
    const tableName = await sqlite.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${sheetName}'`
    );
    console.log(tableName);

    if (tableName.length > 0 && !overwrite) {
      // 테이블이 존재하고, overwrite 옵션이 false인 경우
      continue;
    }

    // ? table 생성
    if (tableName.length == 0) {
      // 테이블이 존재하지 않는 경우
      console.log(`@@@ 테이블 생성: ${sheetName}`);
      await creatTableByGoogleSheet({ sheetName, spreadsheetId, googleSheet });
    }

    // ? tableInfo에 등록
    const check_tableInfo = await sqlite.query(
      `SELECT table_name FROM tableInfo WHERE table_name='${sheetName}'`
    );

    if (check_tableInfo.length == 0) {
      console.log(`@@@ tableInfo에 insert: ${sheetName}`);
      await insertTableInfo(sheetName, tableInfoList);
    } else {
      console.log(`@@@ tableInfo에 update(DELETE 후 INSERT): ${sheetName}`);
      sqlite.conn.run(`DELETE FROM tableInfo WHERE table_name='${sheetName}'`);
      await insertTableInfo(sheetName, tableInfoList);
    }

    // ? tableSchema에 등록
    const check_tableSchema = await sqlite.query(
      `SELECT table_name FROM tableSchema WHERE table_name='${sheetName}'`
    );

    if (check_tableSchema.length == 0) {
      console.log(`@@@ tableSchema에 insert: ${sheetName}`);
      await insertTableSchemaByGoogleSheet({ sheetName, spreadsheetId, googleSheet });
    } else {
      console.log(`@@@ tableSchema에 update(DELETE 후 INSERT): ${sheetName}`);
      sqlite.conn.run(`DELETE FROM tableSchema WHERE table_name='${sheetName}'`);
      await insertTableSchemaByGoogleSheet({ sheetName, spreadsheetId, googleSheet });
    }
  }
};

/**registerAllTablesInGoogleSheet
 * Register All Tables In GoogleSheet(table schema가 정의되어 있는 spreadsheet, '_'로 시작하지 않는 table)
 */
const registerAllTablesInGoogleSheet = async ({ spreadsheetId, googleSheet }) => {
  const sheetNames = await googleSheet.getSheetNames({ spreadsheetId });
  await registerTablesByGoogleSheet({ sheetNames, spreadsheetId, googleSheet, overwrite: true });
};

// * Fill GoogleSheet By .json

/**fillCourseInfo
 * Fill CourseInfo Json to GoogleSheet
 */
const fillCourseInfo = async ({ spreadsheetId, googleSheet }) => {
  const sheetNames = await googleSheet.getSheetNames({ spreadsheetId });
  await registerTablesByGoogleSheet({ sheetNames, spreadsheetId, googleSheet, overwrite: true });
};

// & Test AREA
// &---------------------------------------------------------------------------
// * Create Table(Googlesheet -> Pocketbase)
// const sheetName = 'chapter';
// await creatTableByGoogleSheet({ sheetName, spreadsheetId, googleSheet });

// * Insert TableSchema
// const sheetName = 'users';
// await insertTableSchemaByGoogleSheet({ sheetName, spreadsheetId, googleSheet });

// * Register Tables
const sheetNames = ['chapter', 'lecture', 'handout'];
await registerTablesByGoogleSheet({
  sheetNames,
  spreadsheetId,
  googleSheet,
  overwrite: true
});

// * Register All Tables In GoogleSheet
// await registerAllTablesInGoogleSheet({ spreadsheetId, googleSheet });

// const sheetName = 'courseInfo';
// await insertTableSchemaByGoogleSheet({ sheetName, spreadsheetId, googleSheet });
