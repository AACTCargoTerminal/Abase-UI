import axios from "axios";
import store, { type RootState } from "../slices/store";
import { changeRd, pushError } from "../slices/err";
import { v4 as uuidv4 } from "uuid";
import type {
  ApiEnvelope,
  CookieOptions,
  Res,
  RouteType,
  TableHeaderType,
  TableObjType,
  TableRow,
  TableSortType,
} from "./Type";
import {
  changeAutoFlag,
  deleteNav,
  modalOpen,
  pushLoading,
  pushModalFlag,
} from "../slices/user";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { useSelector } from "react-redux";
import type { Dispatch, SetStateAction } from "react";
import { useLocation } from "react-router-dom";
import type { ModalRouteKey } from "../route";

type ApiUrlType = "AUTH" | "CIMP" | "INFRA" | "SYS";
const server: Record<ApiUrlType, any> = {
  AUTH: import.meta.env.VITE_API_AUTH,
  CIMP: import.meta.env.VITE_API_CIMP,
  INFRA: import.meta.env.VITE_API_INFRA,
  SYS: import.meta.env.VITE_API_SYS,
};

const api = axios.create({
  withCredentials: true,
  timeout: import.meta.env.VITE_TIMEOUT,
  validateStatus: () => true,
});

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function isEnvelope(x: unknown): x is ApiEnvelope<unknown> {
  return (
    typeof x === "object" &&
    x !== null &&
    "errFlag" in x &&
    "errMsg" in x &&
    "data" in x &&
    typeof (x as any).errFlag === "string"
  );
}

function isEnvelope2(x: unknown): x is ApiEnvelope<unknown> {
  return (
    typeof x === "object" &&
    x !== null &&
    !("errFlag" in x) &&
    !("errMsg" in x) &&
    !("data" in x)
  );
}

export function sendSuc(sucMsg: string) {
  store.dispatch(pushLoading(false));
  store.dispatch(pushError({ id: uuidv4(), errFlag: "C", errMsg: sucMsg }));
}

export function sendErr(errMsg: string) {
  store.dispatch(pushLoading(false));
  store.dispatch(pushError({ id: uuidv4(), errFlag: "Y", errMsg: errMsg }));
}

export function sendLoading(flag: boolean) {
  store.dispatch(pushLoading(flag));
}

//Main API 설정
export async function getApi<T>({
  method,
  url,
  files,
  params,
  baseUrl,
  sucFlag = false,
  pgmId,
}: {
  url: string;
  method: HttpMethod;
  params?: Map<string, any>;
  files?: File[];
  baseUrl: ApiUrlType;
  sucFlag?: boolean;
  pgmId: string;
}): Promise<Res<T>> {
  try {
    const path = window.location.pathname;
    const m = method.toUpperCase() as HttpMethod;
    const config: import("axios").AxiosRequestConfig = {
      baseURL: server[baseUrl],
      method: m,
      url,
      withCredentials: true,
      timeout: import.meta.env.VITE_TIMEOUT,
      validateStatus: () => true,
    };

    if (method === "POST" && files) {
      const fd = new FormData();

      if (params && params.size > 0) {
        for (const [k, v] of params.entries()) {
          fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        }
      }
      for (const f of files) fd.append("files", f);
      config.data = fd;
    } else {
      if (method === "POST" && params && params.size > 0) {
        const obj = Object.fromEntries(params);
        config.data = JSON.stringify(obj);
        config.headers = {
          ...config.headers,
          "Content-Type": "application/json",
        };
      }
    }

    config.headers = {
      ...config.headers,
      PGMID: pgmId,
      "MENU-MODE": path.split("/")[1].toUpperCase(),
    };
    const r = await api.request<T>(config);
    const status = r.status;
    const data = r.data;
    if (url.length === 0) {
      if (status === 200) {
        return { ok: true, data: null };
      }
    } else {
      switch (status) {
        case 200:
          if (data) {
            if (typeof data === "string") {
              return { ok: true, data: data };
            } else if (isEnvelope(data)) {
              if (data.errFlag === "Y") {
                store.dispatch(
                  pushError({
                    id: uuidv4(),
                    errFlag: "Y",
                    errMsg: data.errMsg,
                  }),
                );
                return { ok: false, data: null };
              } else {
                if (sucFlag) {
                  store.dispatch(
                    pushError({
                      id: uuidv4(),
                      errFlag: "C",
                      errMsg: data.errMsg,
                    }),
                  );
                }

                if (Array.isArray(data.data)) {
                  if (data.data.length === 0) {
                    store.dispatch(
                      pushError({
                        id: uuidv4(),
                        errFlag: "Y",
                        errMsg: "데이터가 없습니다.",
                      }),
                    );
                  }
                }
                return { ok: true, data: data.data as T };
              }
            } else if (isEnvelope2(data)) {
              return { ok: true, data: data as T };
            }
          }
          break;
        case 409:
          store.dispatch(
            pushError({
              id: uuidv4(),
              errFlag: "Y",
              errMsg: String(r.data),
            }),
          );

          return { ok: false, data: null };
        case 401:
          store.dispatch(changeAutoFlag(true));
          store.dispatch(
            pushError({ id: uuidv4(), errFlag: "Y", errMsg: "재인증 필요" }),
          );
          store.dispatch(changeRd(true));

          return { ok: false, data: null };
        default:
          console.error(data);
          if (data) {
            if (typeof data === "string") {
              store.dispatch(
                pushError({ id: uuidv4(), errFlag: "Y", errMsg: data }),
              );
            } else if (isEnvelope(data)) {
              store.dispatch(
                pushError({
                  id: uuidv4(),
                  errFlag: data.errFlag,
                  errMsg: data.errMsg,
                }),
              );
            } else {
              if (typeof data === "object" && "message" in data) {
                store.dispatch(
                  pushError({
                    id: uuidv4(),
                    errFlag: "Y",
                    errMsg: String(data.message),
                  }),
                );
              } else {
                const text = Object.entries(data)
                  .map(([key, value]) => `${key} : ${value}`) // 여기서 : 사용
                  .join("\n");
                store.dispatch(
                  pushError({
                    id: uuidv4(),
                    errFlag: "Y",
                    errMsg: text,
                  }),
                );
              }
            }
          } else {
            store.dispatch(
              pushError({ id: uuidv4(), errFlag: "Y", errMsg: "서버에러" }),
            );
          }
          return { ok: false, data: null };
      }
    }

    return { ok: false, data: null };
  } catch (e: any) {
    store.dispatch(
      pushError({ id: uuidv4(), errFlag: "Y", errMsg: e.message }),
    );
    return { ok: false, data: null };
  }
}

//UUID 얻기
export function getUUID() {
  return uuidv4();
}

//쿠키기록
export function setCookie(
  name: string,
  value: string,
  opts: CookieOptions = {},
) {
  const enc = encodeURIComponent(value);
  const parts = [`${name}=${enc}`];

  // 만료시간: Max-Age 우선, Expires 보조
  if (opts.days && opts.days > 0) {
    const maxAge = opts.days * 24 * 60 * 60;
    parts.push(`Max-Age=${maxAge}`);

    const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
    parts.push(`Expires=${expires}`);
  }

  parts.push(`Path=${opts.path ?? "/"}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.secure) parts.push(`Secure`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);

  document.cookie = parts.join("; ");
}

//쿠키 가져오기
export function getCookie(name: string): string | null {
  const prefix = `${name}=`;
  const items = document.cookie.split("; ");
  for (const item of items) {
    if (item.startsWith(prefix)) {
      return decodeURIComponent(item.substring(prefix.length));
    }
  }
  return null;
}

//쿠키 삭제
export function deleteCookie(
  name: string,
  path: string = "/",
  domain?: string,
) {
  document.cookie =
    `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=${path}` +
    (domain ? `; Domain=${domain}` : "");
}

//숫자확인
export function confirmObj({
  obj,
  type,
  fix,
}: {
  obj?: string;
  type: TableObjType;
  fix?: number;
}) {
  const trimmed = obj ?? "";
  try {
    switch (type) {
      case "NUM": {
        if (trimmed === "") return 0;

        const n = Number(trimmed.replace(/,/g, ""));

        if (Number.isNaN(n)) return 0;

        return Math.trunc(n);
      }

      case "DOUBLE": {
        if (trimmed === "") return 0.0;

        const num = Number(trimmed.replace(/,/g, ""));

        if (Number.isNaN(num)) return 0.0;

        return fix !== undefined ? Number(num.toFixed(fix)) : num;
      }

      case "STR":
      default:
        return trimmed.toString();
    }
  } catch (e: any) {
    return trimmed;
  }
}

export function getDouble(obj: string): number {
  try {
    const n = parseFloat(obj);
    if (Number.isNaN(n)) return 0.0;
    return n;
  } catch (e: any) {
    return 0.0;
  }
}

export function getInt(obj: string): number {
  try {
    const n = Number(obj);
    if (Number.isNaN(n)) return 0;
    return n;
  } catch (e: any) {
    return 0;
  }
}

//배열 오름차순 내림차순 정렬
export function sortTable({
  type,
  table,
  key,
}: {
  type: TableSortType;
  table: TableRow[];
  key: string;
}): TableRow[] {
  const sample = table.find((row) => row[key] != null);
  const tmp = sample?.[key];
  if (tmp !== undefined) {
    if (typeof tmp === "number") {
      if (type === "ASC") {
        const sorted = [...table].sort((a, b) => a[key] - b[key]);
        return sorted;
      } else {
        const sorted = [...table].sort((a, b) => b[key] - a[key]);
        return sorted;
      }
    } else if (typeof tmp === "boolean") {
      if (type === "ASC") {
        return [...table].sort((a, b) => {
          return Number(a[key] ?? false) - Number(b[key] ?? false);
        });
      } else {
        return [...table].sort((a, b) => {
          return Number(b[key] ?? false) - Number(a[key] ?? false);
        });
      }
    } else {
      if (type === "ASC") {
        const sorted = [...table].sort((a, b) => a[key].localeCompare(b[key]));
        return sorted;
      } else {
        const sorted = [...table].sort((a, b) => b[key].localeCompare(a[key]));
        return sorted;
      }
    }
  } else {
    return table;
  }
}

//테이블 -> 엑셀
export function getExcel({
  body,
  header,
  fileName,
}: {
  fileName: string;
  body: TableRow[];
  header: TableHeaderType[];
}) {
  //{r,c} c 가로 r 세로 시작 1,1
  let c = { r: 1, c: 1 };

  const ws: XLSX.WorkSheet = {};

  const width: XLSX.ColInfo[] = [{ wch: 16 }];
  const height: XLSX.RowInfo[] = [{ hpx: 16 }];

  //헤더부분
  height.push({ hpx: 25 });
  header.forEach((item) => {
    if (!(item.option?.type === "CHK" || item.disable)) {
      const addr = XLSX.utils.encode_cell(c);
      const cell: XLSX.CellObject = {
        v: item.value,
        t: "s",
        s: headerStyle,
      };
      ws[addr] = cell;
      const w = parseInt(item.w);
      width.push({ wch: w * 2 });
      c.c++;
    }
  });

  if (body.length > 0) {
    //바디부분
    body.forEach((v, i) => {
      c.c = 1;
      c.r++;
      height.push({ hpx: 20 });
      header.forEach((item, j) => {
        if (!(item.option?.type === "CHK" || item.disable)) {
          const addr = XLSX.utils.encode_cell(c);
          const cell: XLSX.CellObject = {
            v: v[item.key]
              ? v[item.key]
              : !item.type || item.type === "STR"
                ? ""
                : 0,
            t: !item.type || item.type === "STR" ? "s" : "n",
            s: bodyStyle,
          };
          ws[addr] = cell;
          c.c++;
        }
      });
    });

    //푸터부분
    const data = summarize(header, body);
    if (Object.keys(data).length > 0) {
      height.push({ hpx: 25 });
      c.c = 1;
      c.r++;
      header.forEach((item) => {
        if (!(item.option?.type === "CHK" || item.disable)) {
          const addr = XLSX.utils.encode_cell(c);
          const cell: XLSX.CellObject = {
            v: data[item.key] || "",
            t: "n",
            s: footerStyle,
          };
          ws[addr] = cell;
          c.c++;
        }
      });
    }
  }

  //설정후 전체행 업데이트
  ws["!cols"] = width;
  ws["!rows"] = height;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 1, c: 1 },
    e: { r: body.length + 2, c: header.length + 2 },
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "sheet1");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}.xlsx`);
}

const headerStyle: XLSX.CellStyle = {
  fill: {
    patternType: "solid",
    fgColor: { rgb: "FF6F6F70" }, // 연회색 배경
  },
  font: {
    bold: true,
    color: { rgb: "FFFFFFFF" }, // 진한 글씨
  },
  alignment: {
    horizontal: "center",
    vertical: "center",
  },
};

const footerStyle: XLSX.CellStyle = {
  fill: {
    patternType: "solid",
    fgColor: { rgb: "FFE4E4E4" }, // 연회색 배경
  },
  font: {
    bold: true,
    color: { rgb: "FF111827" }, // 진한 글씨
  },
  alignment: {
    horizontal: "center",
    vertical: "center",
  },
};

const bodyStyle: XLSX.CellStyle = {
  alignment: {
    horizontal: "center",
    vertical: "center",
  },
};

function summarize(
  headers: TableHeaderType[],
  rows: TableRow[],
): Record<string, number> {
  const result: Record<string, number> = {};

  const targets = headers.filter((h) => h.sum || h.sum === 0);

  for (const h of targets) {
    let acc = 0;
    for (const r of rows) {
      const v = r[h.key];
      if (v == null || v === "") continue;

      if (!h.type || h.type === "STR") {
        acc += 1;
        continue;
      }

      const num = typeof v === "number" ? v : isFinite(+v) ? +v : NaN;
      acc += Number.isFinite(num) ? num : 1;
    }
    result[h.key] = acc;
  }
  return result;
}

export function getMenu(id: string): RouteType | null {
  const menu = store.getState().user.menu;

  const ret = treeMenu(menu, id);

  return ret;
}

function treeMenu(array: Array<any>, id: string): RouteType | null {
  for (const item of array) {
    if (item["MENU_ID"] === id || item["PROGRAM_ID"] === id) {
      return item;
    }

    if (Array.isArray(item["children"])) {
      const found = treeMenu(item["children"], id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

//빈행추가
export function addTable({
  header,
  table,
}: {
  table: TableRow[];
  header: TableHeaderType[];
}): TableRow[] {
  try {
    const newRow: TableRow = {};

    header.forEach((row) => {
      newRow[row.key] = "";
    });

    return [...table, newRow];
  } catch (e: any) {
    return table;
  }
}

//마지막행 삭제
export function removeTable({ table }: { table: TableRow[] }): TableRow[] {
  try {
    return table.slice(0, table.length - 1);
  } catch (e: any) {
    return table;
  }
}

//테이블 수정
export function changeTable({
  table,
  changeData,
}: {
  table: TableRow[];
  changeData: TableRow;
}) {
  try {
    return table.map((r, i) => {
      if (changeData[i]) {
        Object.keys(r).forEach((k) => {
          if (changeData[i][k]) {
            r[k] = changeData[i][k];
          }
        });
        return r;
      } else {
        return r;
      }
    });
  } catch (e: any) {
    return table;
  }
}
//TableRow[] 중 체크박스 선택한 것 원하는 키값추출
export function getTableCHK({
  body,
  row,
  key,
}: {
  body: TableRow[];
  row: Record<number, TableRow>;
  key: string;
}): any[] {
  const ret = body
    .filter((r, i) => row?.[i]?.["CHK"] === true)
    .map((r) => r[key]);

  return ret;
}

//TableChange값 추가하기
export function setTableChange({
  changeData,
  idx,
  key,
  value,
}: {
  changeData: Record<number, TableRow>;
  idx: number;
  key: string;
  value: any;
}): Record<number, TableRow> {
  return { ...changeData, [idx]: { ...changeData?.[idx], [key]: value } };
}

//Table특정키로 그룹하기
export function groupBy({
  data,
  key,
}: {
  data: TableRow[];
  key: string;
}): Record<string, TableRow[]> {
  return data.reduce((acc, cur) => {
    const groupKey = cur[key]; // 예: "A", "B"
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(cur);
    return acc;
  }, {});
}

//sitaMsg 파싱
export function changeSitaMessage(sitaMessage: string): string {
  // 원본
  let messageText = sitaMessage;

  // \r 제거
  const changeStr = messageText.replace(/\r/g, "");

  // 줄 단위로 split
  const messageData = changeStr.split("\n");

  let startCount = 0;
  let strRetValue = "";

  // 첫 번째로 \u0002 로 시작하는 라인 찾기
  for (let i = 0; i < messageData.length; i++) {
    const str = messageData[i];
    if (str.startsWith("\u0002")) {
      startCount = i;
      break;
    }
  }

  // 거기서부터 끝까지 \u0001~\u0004 제거 + trim + \r\n 붙이기
  for (let i = startCount; i < messageData.length; i++) {
    const cleaned = messageData[i]
      .replace(/\u0001/g, "")
      .replace(/\u0002/g, "")
      .replace(/\u0003/g, "")
      .replace(/\u0004/g, "")
      .trim();

    strRetValue += cleaned + "\r\n";
  }

  // 결과가 있으면 그걸, 없으면 원본 리턴
  if (strRetValue.length > 0) {
    return strRetValue;
  } else {
    return sitaMessage;
  }
}

//문자열 TableRow로 변환
export function convStrToTableRow({
  str,
  split,
  key,
  body,
}: {
  str: string;
  split: string;
  body: TableRow[];
  key: string;
}): Record<number, TableRow> {
  const ret: Record<number, TableRow> = {};

  const strArray: string[] = str.split(split);
  if (strArray.length === 0) return ret;

  body.forEach((r, i) => {
    if (r[key]) {
      strArray.forEach((r2, i2) => {
        if (r2 === r[key]) {
          ret[i] = r;
        }
      });
    }
  });

  return ret;
}

//base64 -> URL
export function base64ToPdfUrl(b64: string, type: string): string {
  const pure = b64.split(",").pop() ?? ""; // 혹시 data:.. prefix 있으면 제거

  const byteChars = atob(pure);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: type });
  return URL.createObjectURL(blob);
}

//프로그램 정보가져오기
export async function getPgmInfo(
  pgmId: string,
): Promise<RouteType | undefined> {
  const res = await getApi<Record<number, RouteType[]>>({
    baseUrl: "AUTH",
    method: "GET",
    url: `/user/getPgmInfo?pgmId=${pgmId}`,
    pgmId: "",
  });
  if (res.ok) {
    if (res.data?.[0][0]) {
      return res.data?.[0][0];
    }
  }
  return undefined;
}

export function openModal({
  array,
}: {
  array: { id: ModalRouteKey; name: string; param?: TableRow }[];
}) {
  const tmp: RouteType[] = array.map((item) => {
    return {
      param: item.param || {},
      PROGRAM_ID: item.id,
      PROGRAM_NAME: item.name,
    };
  });
  store.dispatch(modalOpen({ route: tmp }));
}

export function closeModal() {
  store.dispatch(pushModalFlag(false));
}

// key가 객체의 key인지 체크 + 타입 좁히기
export function hasKey<T extends object>(obj: T, key: unknown): key is keyof T {
  return typeof key === "string" && key in obj;
}

export function addTableEmptyRow(body: TableRow[]): TableRow[] {
  const tmp: TableRow = {};
  Object.keys(body[0]).forEach((v) => {
    tmp[v] = "";
  });
  return [tmp, ...body];
}

export function closePage(pgmId: string) {
  const tmp = store
    .getState()
    .user.routeArray.find((item) => item.PROGRAM_ID === pgmId);
  if (tmp) {
    store.dispatch(deleteNav(tmp));
  }
}

//이메일 형식 체크
export function checkEmail(str: string): boolean {
  var exptext = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+/;
  return exptext.test(str);
}

//한글 문자 체크
export function checkEng(str: string) {
  var msg = "";
  for (let b = 0; b < str.length; b++) {
    var c = str.charCodeAt(b);
    if (0 <= c && c <= 126) {
      // ok
    } else {
      msg = "유효하지 않은 문자가 있습니다(한글 입력 금지)";
      return msg;
    }
  }
  return msg;
}

//날짜 YYYYMMDD , 시간 HHmmss -> YYYY-MM-DD , HH:mm:ss
export function convDateAndTime(type: "DATE" | "TIME", v: string) {
  var ret = v;
  try {
    if (type === "DATE") {
      ret = v.substring(0, 4) + "-" + v.substring(4, 6) + "-" + v.substring(6);
    } else {
      ret = v.substring(0, 2) + ":" + v.substring(2, 4) + ":" + v.substring(4);
    }
  } catch (e: any) {
    ret = v;
  }
  return ret;
}

export async function getClass(
  classCode: string,
  pgmId: string,
  emptyFlag?: boolean,
): Promise<TableRow[]> {
  const res = await getApi<TableRow[]>({
    baseUrl: "SYS",
    method: "GET",
    url: `/sys/getBaseOds?classCode=${classCode}&codeName=`,
    pgmId: pgmId,
  });

  if (res.ok) {
    if (res.data) {
      if (emptyFlag !== undefined && emptyFlag) {
        return [{ CODE_CODE: "", CODE_NAME: "-" }, ...res.data];
      }
      return res.data;
    }
  }
  return [];
}

//getBaseOdsValue3
export async function getClassValue(
  type: "Value1" | "Value2" | "Value3",
  classCode: string,
  value: string,
  pgmId: string,
): Promise<TableRow[]> {
  const res = await getApi<TableRow[]>({
    baseUrl: "SYS",
    method: "GET",
    url: `/sys/getBaseOds${type}?classCode=${classCode}&${type.toLowerCase()}=${value}`,
    pgmId: pgmId,
  });

  if (res.ok) {
    if (res.data) {
      return res.data;
    }
  }
  return [];
}

export function getDiffDays(startDate: string, endDate: string): number {
  const isValidDate = (dateStr: string): boolean => {
    if (!/^\d{8}$/.test(dateStr)) {
      return false;
    }

    const year = Number(dateStr.substring(0, 4));
    const month = Number(dateStr.substring(4, 6));
    const day = Number(dateStr.substring(6, 8));

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return -1;
  }

  const s = new Date(
    Number(startDate.substring(0, 4)),
    Number(startDate.substring(4, 6)) - 1,
    Number(startDate.substring(6, 8)),
  );

  const e = new Date(
    Number(endDate.substring(0, 4)),
    Number(endDate.substring(4, 6)) - 1,
    Number(endDate.substring(6, 8)),
  );

  const diff = Math.floor((e.getTime() - s.getTime()) / 86400000);

  return diff < 0 ? -1 : diff;
}
