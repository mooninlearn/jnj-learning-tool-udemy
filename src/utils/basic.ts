import * as fs from 'fs';
import Path from 'path';

export const isFalsy = (v: any) => {
  return (
    v === false ||
    v === undefined ||
    v === null ||
    Number.isNaN(v) ||
    v === 0 ||
    v.length === 0 ||
    Object.keys(v).length === 0
  );
};

export const isTruthy = (v: any) => {
  return (
    v !== false &&
    v !== undefined &&
    v !== null &&
    !Number.isNaN(v) &&
    v !== 0 &&
    v.length !== 0 &&
    Object.keys(v).length !== 0
  );
};

export const isEmpty = (v: any) => {
  return v.length == 0 || Object.keys(v).length === 0;
};

// ** folder
export const createFolder = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const filesInFolder = (path: string) => {
  return fs
    .readdirSync(path, { withFileTypes: true })
    .filter((item) => !item.isDirectory())
    .map((item) => item.name);
};

// export const filesInFolder = (path: string) => {
//   return fs.readdir(path, function(error, filelist) {
//     // console.log(filelist);
//     return filelist
//   });
// }

// ** file
export const readFile = (path: string, encoding: BufferEncoding = 'utf8') => {
  return fs.readFileSync(path, { encoding });
};

// *
export const readJson = (path: string, encoding: BufferEncoding = 'utf8') => {
  return JSON.parse(fs.readFileSync(path, { encoding }));
};

// *
export const saveFile = (path: string, data: any) => {
  let dir = createFolder(Path.dirname(path));
  fs.writeFile(path, data, (err: any) => {
    if (err) throw err;
    console.log(`Successfully saved File (${path})`);
  });
};

// *
export const saveJson = (path: string, data: any, indent: number = 2) => {
  saveFile(path, JSON.stringify(data, null, indent));
};

// // *
// export async function savePage(path: string, page: any)  {
//   saveFile(path, await page.content());
// }

// *
export function renameFile(folderName) {
  folderName = '_downloads/json/lectures';

  const files = fs.readdirSync(folderName);

  files.forEach((file) =>
    fs.rename(
      folderName + `/${file}`,
      folderName + `/web-design-figma-webflow-freelancing/${file.split('_').slice(-1)}`,
      (err) => console.log(err)
    )
  );
}

// ** time

export function sleep(ms) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) {}
}

// function sleep(ms: number) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }

// renameFile('_downloads/json/lectures');
