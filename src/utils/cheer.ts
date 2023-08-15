import * as fs from 'fs';
import cheerio from 'cheerio'

type Str = string | undefined | null;

export const isFalsy = (v: any) => {
  return (v === false || v === undefined || v === null || Number.isNaN(v) || v === 0 || v.length === 0 || Object.keys(v).length === 0)
}

export const isEmpty = (v: any) => {
  return (v.length == 0 || Object.keys(v).length === 0)
}

export const loadFile = (path: string) => fs.readFileSync(path, {encoding: 'utf8'});
export const cheerFromStr = (str: string) => cheerio.load(str);
export const cheerFromFile = (path: string) => cheerio.load(fs.readFileSync(path, {encoding: 'utf8'}));

const _querySelectorInCi = (selector: string, $: any) => {
  return $(selector);
}

const _querySelectorInEl = (selector: string, $el: any) => {
  return $el.find(selector);
}

// * 
export const querySelectorAll = ($root: any, selector: string) => {
  return ($root instanceof Function) ? $root(selector) : $root.find(selector);
}

// * 
export const querySelector = ($root: any, selector: string) => {
  return ($root instanceof Function) ? $root(selector).eq(0) : $root.find(selector).eq(0);
}

// * 
const _getValue = ($element: any, target: Str=null) => {
  if (!target) target = 'text';

  let rst;

  switch(target.toLowerCase()) {
    case 'text':
      rst = $element.text().trim();
      break;
    case 'texts':
      let contents = $element.contents();
      let texts: any[] = [];
      // console.log(`###contents.length: ${contents.length}`);
      for (let i=0;i<contents.length;i++) {
        let _text = contents.eq(i).text().trim();
        // console.log(`###_text: |${_text}|`)
        if (_text.length > 0) {
          // console.log(`###_text: |${_text}|`)
          texts.push(_text);
        }
      }
      rst = texts;
      break;
    case 'innerhtml':
      rst = $element.html().trim();
      break;
    default:
      rst = $element.attr(target);
  }

  return rst;
}

// * 
export const getValue = ($root: any, selector: string, target: Str=null) => {
  if (isFalsy(target)) target = 'text';
  let $element = querySelector($root, selector);
  return (isFalsy($element)) ? '' : _getValue($element, target);
}

// * 
export const getValues = ($root: any, selector: string, target: Str=null) => {
  if (isFalsy(target)) target = 'text';
  let $elements = querySelectorAll($root, selector);
  if (isFalsy($elements)) return [];

  let values: any[] = [];
  for (let i=0;i<$elements.length;i++) {
    let $element = $elements.eq(i);
    let value = _getValue($element, target);
    if (!isFalsy(value)) values.push(value);
  }
  return values;
}

// * 
export const getOuterHtml = ($: any, selector: string) => $.html(querySelector($, selector));


// * 
export const getValueFromStr = (str: string, selector:string, target: Str=null) => {
  return getValue(cheerio.load(str), selector, target);
}

// * 
export const getValuesFromStr = (str: string, selector:string, target: Str=null) => {
  return getValues(cheerio.load(str), selector, target);
}

// * settings = [{'key': '', 'selector': '', 'target': ''}]
export const dictFromRoot = ($root, settings: any[]=[]) => {
  let dict = {};
  for (let setting of settings) {
    if (isFalsy(setting.selector)) {
      continue;
    }
    let value = getValue($root, setting.selector, setting.target);
    dict[setting.key] = isFalsy(setting.callback) ? value : eval(setting.callback);
  }
  return dict
}

// * settings = [{'key': '', 'selector': '', 'target': ''}, ...]
export const dictsFromRoots = ($roots, settings: any[]=[], required=[]) => {
  let dicts: any[] = [];
  for (let i=0;i<$roots.length;i++) {
    let $root = $roots.eq(i);
    let dict = dictFromRoot($root, settings);
    if (isFalsy(dict)) continue;
    let notPush = false;
    for (let key of required) {  // 필수항목 값 확인
      if (isFalsy(dict[key])) {
        notPush = true;
        break;
      }
    }
    if (!notPush) dicts.push(dict);
  }
  return dicts
}
