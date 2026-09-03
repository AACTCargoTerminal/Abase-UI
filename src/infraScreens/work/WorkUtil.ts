import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { getDiffDays, getInt, sendErr } from "../../Util/Util";
import dayjs from "dayjs";
import type { TableRow } from "../../Util/Type";
import moment from "moment";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
const thin = { style: "thin", color: { rgb: "000000" } };
const thick = { style: "medium", color: { rgb: "000000" } };

//파일 업로드
export const setExcelFile = ({
  e,
  yyyymm,
  dayLength,
  halfType,
  grid1,
}: {
  e: React.ChangeEvent<HTMLInputElement>;
  yyyymm: string;
  dayLength: number;
  halfType: string;
  grid1: TableRow[];
}): Promise<Map<string, any> | null> => {
  return new Promise((resolve) => {
    const file = e.target.files?.[0];
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) {
          sendErr("데이터가 없습니다.");
          resolve(null);
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const targetSheetName = dayjs(yyyymm, "YYYYMM").format("M월");
        const findObj = workbook.SheetNames.find(
          (wv) => wv === targetSheetName,
        );

        if (!findObj) {
          sendErr(`${targetSheetName}의 시트가 없습니다.`);
          resolve(null);
          return;
        }

        const ws = workbook.Sheets[findObj];
        let msg = "";

        // 날짜 헤더 검증: D10부터 dayLength만큼 1,2,3... 있는지 확인

        for (let i = 0; i < dayLength; i++) {
          const addr = XLSX.utils.encode_cell({ c: 3 + i, r: 8 }); // D10 시작
          const cell = ws[addr];
          const value = Number(cell?.v ?? "");

          if (value !== i + 1) {
            msg += `${i + 1}일, `;
          }
        }

        if (msg) {
          sendErr(`${msg}이 없습니다.`);
          resolve(null);
          return;
        }

        const ref = ws["!ref"];
        if (!ref) {
          sendErr("엑셀 시트가 비어있습니다.");
          resolve(null);
          return;
        }

        const range = XLSX.utils.decode_range(ref);

        const result: Map<string, any> = new Map<string, any>();
        result.set("date", yyyymm);
        result.set("halfType", halfType);
        result.set("userArray", []);
        //팀코드가져오기
        const addrTeam = XLSX.utils.encode_cell({ c: 2, r: 6 });
        const cellTeam = ws[addrTeam];
        const valueTeam = cellTeam?.v ?? "";

        if (!valueTeam) {
          sendErr(`팀코드가 없습니다.`);
          resolve(null);
          return;
        }
        result.set("teamCode", valueTeam);
        //터미널코드 가져오기
        const addrTerminal = XLSX.utils.encode_cell({ c: 2, r: 7 });
        const cellTerminal = ws[addrTerminal];
        const valueTerminal = cellTerminal?.v ?? "";

        if (!valueTerminal) {
          sendErr(`터미널코드가 없습니다.`);
          resolve(null);
          return;
        }
        result.set("terminalCode", valueTerminal);
        // 12행부터 마지막 행까지 읽기 (r:11 => 엑셀 12행)
        for (let r = 10; r <= range.e.r; r++) {
          const userIdAddr = XLSX.utils.encode_cell({ c: 1, r }); // B열
          const userIdCell = ws[userIdAddr];
          const userId = String(userIdCell?.v ?? "").trim();

          // 사번 없으면 빈 행으로 보고 스킵
          if (!userId) {
            continue;
          }
          const closeFlag =
            grid1.find((v) => v?.["USER_ID"] === userId)?.["CLOSE_FLAG"] ?? "N";

          const dayArray: TableRow[] = [];
          let rowErrorMsg = "";

          // D열부터 날짜별 값 읽기
          for (let d = 0; d < dayLength; d++) {
            const dayAddr = XLSX.utils.encode_cell({ c: 3 + d, r });
            const dayCell = ws[dayAddr];
            const dayValue = String(dayCell?.v ?? "").trim();

            dayArray.push({
              DAY: d + 1,
              DAY_STR: dayValue,
            });
          }

          if (rowErrorMsg) {
            sendErr(`${userId} 사번의 ${rowErrorMsg}값이 없습니다.`);
            resolve(null);
            return;
          }

          result.get("userArray").push({
            USER_ID: userId,
            CLOSE_FLAG: closeFlag,
            dayArray,
          });
        }

        resolve(result);
      } catch (err: any) {
        sendErr(err?.message || String(err));
        resolve(null);
      } finally {
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      sendErr("엑셀 파일을 읽는 중 오류가 발생했습니다.");
      e.target.value = "";
      resolve(null);
    };

    reader.readAsArrayBuffer(file);
  });
};

//파일 다운로드
export const getExcelFile = ({
  dayLength,
  yyyymm,
  holidayTotal,
  opcod,
  hrpat,
  grid1,
  grid1Dt,
  hrpatSelect,
}: {
  dayLength: number;
  yyyymm: string;
  holidayTotal: number;
  opcod: TableRow[];
  hrpat: TableRow[];
  grid1: TableRow[];
  grid1Dt: Record<number, Record<string, TableRow[]>>;
  hrpatSelect: string;
}) => {
  const ws = getMainExcel({
    dayLength: dayLength,
    holidayTotal: holidayTotal,
    yyyymm: yyyymm,
    grid1: grid1,
    grid1Dt: grid1Dt,
    hrpatSelect: hrpatSelect,
  });

  const ws2 = getExampleExcel({
    dayLength: dayLength,
    yyyymm: yyyymm,
    opcod: opcod,
    hrpat: hrpat,
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, moment(yyyymm, "YYYYMM").format("M월"));
  XLSX.utils.book_append_sheet(wb, ws2, "Example");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `근무스케줄_${yyyymm}.xlsx`);
};

export function getExampleExcel({
  dayLength,
  yyyymm,
  opcod,
  hrpat,
}: {
  dayLength: number;
  yyyymm: string;
  opcod: TableRow[];
  hrpat: TableRow[];
}): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  //{c,r} c 가로 r 세로
  var c = { c: 0, r: 0 };
  //가로 각 셀 넓이설정
  const cols = [];
  cols.push({ wpx: 31 });
  cols.push({ wpx: 95 });
  cols.push({ wpx: 90 });

  Array.from({ length: dayLength }).forEach((_, i) => {
    cols.push({ wpx: 37 });
  });
  cols.push({ wpx: 37 });
  cols.push({ wpx: 37 });
  cols.push({ wpx: 37 });
  cols.push({ wpx: 37 });

  const rows = [];
  rows.push({ hpx: 25 }); //1
  rows.push({ hpx: 25 }); //2
  rows.push({ hpx: 25 }); //3
  rows.push({ hpx: 25 }); //4
  rows.push({ hpx: 25 }); //5
  rows.push({ hpx: 25 }); //6
  rows.push({ hpx: 25 }); //7
  rows.push({ hpx: 17 }); //8
  rows.push({ hpx: 17 }); //9
  rows.push({ hpx: 25 }); //10
  rows.push({ hpx: 25 }); //11

  var cellName = XLSX.utils.encode_cell(c);
  ws["!cols"] = cols;
  ws["!rows"] = rows;
  //시트헤더
  ws[cellName] = {
    t: "s",
    v: `
* 데이터로 변환되는 부분은 C7번셀 에 있는 팀 코드, 11번행 포함 밑으로 있는 사번,일자 하단에 있는 데이터이며, 휴무일수, 발생적치 등등 부가적인 데이터는 시스템에 있는 데이터를 사용하오니 참고부탁드립니다.
* 시트명은 제출하려는 달 + 월 로 작성부탁드립니다. EX) 3월 또는 5월 등등
* 근무코드는 하단의 CODE부분으로 작성 부탁드립니다.
* 특정 날에 대해 근무 터미널이 변경되는 경우 코드-터미널코드 작성부탁드립니다. ( A는 모든 터미널 근무입니다. ) EX) 09-T2 13-T1 22-A
* OT에 대한 구분은 +로 이루어지니 근무코드 작성후 ,OT시간 작성부탁드립니다. EX) 09+2 13+3 
* 각 일마다 근무코드가 추가로 필요한경우 구분은 !로 작성부탁드립니다. EX) 09!20 13!23
`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
        bold: true,
      },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  ws["!merges"] = [];
  ws["!merges"].push({
    s: { c: 0, r: 0 },
    e: { c: c.c + dayLength + 6, r: c.r + 5 },
  });

  c = { c: 1, r: 6 };
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `팀코드`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };
  c = { c: 2, r: 6 };
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `1206`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  c = { c: 0, r: 9 };
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `순번`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thick,
        left: thick,
      },
    },
  };
  cellName = XLSX.utils.encode_cell({ c: 0, r: c.r + 1 });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
        left: thick,
      },
    },
  };
  ws["!merges"].push({ s: { ...c }, e: { c: c.c, r: c.r + 1 } });
  c.c++;
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `일자`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        bottom: thin,
        right: thick,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `사번`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
      },
    },
  };

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `이름`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thick,
      },
    },
  };
  c.r++;

  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: ``,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
      },
    },
  };

  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { ...c } });

  Array.from({ length: dayLength }).forEach((_, i) => {
    c.c++;
    c.r--;
    const m = dayjs(yyyymm + String(i + 1).padStart(2, "0"));

    const dayName = m.format("ddd");
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${i + 1}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          bottom: thin,
          right: m.day() === 0 ? thick : i + 1 === dayLength ? thick : thin,
        },
      },
    };
    c.r++;
    cellName = XLSX.utils.encode_cell({ ...c });

    ws[cellName] = {
      t: "s",
      v: `${dayName}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: thick,
          right: m.day() === 0 ? thick : i + 1 === dayLength ? thick : thin,
        },
      },
    };
  });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `휴무일수`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thin,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `사용휴무`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thin,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `사용연차`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thin,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `잔여연차`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thick,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });
  //본문
  c = { c: 0, r: c.r + 1 };

  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "1",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        left: thick,
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "AT230405",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "김희섭",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "X",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "X",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "9+2",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "7",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "7",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "13-T2",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };

  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "9!23",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };

  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "X",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "X",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "W03",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "P01",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "P02",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "13+1-T2!23",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "X",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "X",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thin,
        right: thick,
      },
    },
  };
  c.c = 0;
  c.r++;
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "팀 코드 리스트",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };
  ws["!merges"].push({ s: { ...c }, e: { c: c.c + 3, r: c.r + 1 } });
  c.r++;
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "No",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
        left: thick,
        bottom: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "코드",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
        bottom: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "내용",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        bottom: thick,
      },
    },
  };
  c.c++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thick,
        bottom: thick,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c - 1, r: c.r }, e: { ...c } });

  hrpat.forEach((hv, i) => {
    c.r++;
    c.c = 0;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${i + 1}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          right: thin,
          left: thick,
          bottom: i === hrpat.length - 1 ? thick : thin,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${hv?.["CODE_CODE"] || ""}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          right: thin,
          bottom: i === hrpat.length - 1 ? thick : thin,
        },
      },
    };

    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${hv?.["CODE_NAME"] || ""}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: i === hrpat.length - 1 ? thick : thin,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: ``,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          right: thick,
          bottom: i === hrpat.length - 1 ? thick : thin,
        },
      },
    };
    if (ws["!merges"]) {
      ws["!merges"].push({ s: { c: c.c - 1, r: c.r }, e: { ...c } });
    }
  });
  c.c = 5;
  c.r = 13;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `근무 코드 리스트`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };
  ws["!merges"].push({
    s: { ...c },
    e: { c: c.c + 6 * Math.floor(opcod.length / 15) - 1, r: c.r + 1 },
  });
  c.r++;
  c.r++;
  Array.from({ length: opcod.length / 15 }).forEach((_, i) => {
    if (i !== 0) {
      c.c++;
    }
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `No`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          right: thin,
          left: thick,
          bottom: thick,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `코드`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          right: thin,
          bottom: thick,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `코드명`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          bottom: thick,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: ``,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          bottom: thick,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: ``,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          bottom: thick,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: ``,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          right: thick,
          bottom: thick,
        },
      },
    };
    if (ws["!merges"]) {
      ws["!merges"].push({
        s: { c: c.c - 3, r: c.r },
        e: { ...c },
      });
    }
  });
  var idx = 0;
  opcod.forEach((ov, i) => {
    if (ov?.["CODE_CODE"]) {
      if (i % 15 === 0 && i !== 0) {
        c.r = 16;
        c.c = c.c + 1;
      } else {
        c.c = 5 + 6 * Math.floor(i / 15);
        c.r++;
      }
      cellName = XLSX.utils.encode_cell({ ...c });
      ws[cellName] = {
        t: "s",
        v: `${idx + 1}`,
        s: {
          font: {
            name: "맑은 고딕",
            sz: 11,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            left: thick,
            right: thin,
            bottom: thin,
          },
        },
      };
      c.c++;
      cellName = XLSX.utils.encode_cell({ ...c });
      ws[cellName] = {
        t: "s",
        v: `${ov?.["CODE_CODE"] || ""}`,
        s: {
          font: {
            name: "맑은 고딕",
            sz: 11,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            right: thin,
            bottom: thin,
          },
        },
      };
      c.c++;
      cellName = XLSX.utils.encode_cell({ ...c });
      ws[cellName] = {
        t: "s",
        v: `${ov?.["CODE_NAME"] || ""}`,
        s: {
          font: {
            name: "맑은 고딕",
            sz: 11,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            bottom: thin,
          },
        },
      };
      c.c++;
      cellName = XLSX.utils.encode_cell({ ...c });
      ws[cellName] = {
        t: "s",
        v: ``,
        s: {
          font: {
            name: "맑은 고딕",
            sz: 11,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            bottom: thin,
          },
        },
      };
      c.c++;
      cellName = XLSX.utils.encode_cell({ ...c });
      ws[cellName] = {
        t: "s",
        v: ``,
        s: {
          font: {
            name: "맑은 고딕",
            sz: 11,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            bottom: thin,
          },
        },
      };
      c.c++;
      cellName = XLSX.utils.encode_cell({ ...c });
      ws[cellName] = {
        t: "s",
        v: ``,
        s: {
          font: {
            name: "맑은 고딕",
            sz: 11,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            right: thick,
            bottom: thin,
          },
        },
      };
      if (ws["!merges"]) {
        ws["!merges"].push({
          s: { c: c.c - 3, r: c.r },
          e: { ...c },
        });
      }
      idx++;
    }
  });

  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: c.r + hrpat.length, c: dayLength + 7 },
  });
  ws["!viewPane"] = { showGridLines: false };
  return ws;
}

export function getMainExcel({
  dayLength,
  yyyymm,
  holidayTotal,
  grid1,
  grid1Dt,
  hrpatSelect,
}: {
  dayLength: number;
  yyyymm: string;
  holidayTotal: number;
  grid1: TableRow[];
  grid1Dt: Record<number, Record<string, TableRow[]>>;
  hrpatSelect: string;
}): XLSX.WorkSheet {
  //총 헤더구하기
  //{c,r} c 가로 r 세로
  var c = { c: 0, r: 1 };
  //가로 각 셀 넓이설정
  const cols = [];
  cols.push({ wpx: 31 });
  cols.push({ wpx: 95 });
  cols.push({ wpx: 90 });

  Array.from({ length: dayLength }).forEach((_, i) => {
    cols.push({ wpx: 37 });
  });
  cols.push({ wpx: 37 });
  cols.push({ wpx: 37 });
  cols.push({ wpx: 37 });
  cols.push({ wpx: 37 });

  const rows = [];
  rows.push({ hpx: 17 }); //1
  rows.push({ hpx: 17 }); //2
  rows.push({ hpx: 17 }); //3
  rows.push({ hpx: 17 }); //4
  rows.push({ hpx: 17 }); //5
  rows.push({ hpx: 17 }); //6
  rows.push({ hpx: 17 }); //7
  rows.push({ hpx: 17 }); //8
  rows.push({ hpx: 17 }); //9
  rows.push({ hpx: 25 }); //10
  while (rows.length < 100) {
    rows.push({ hpx: 25 });
  }

  var cellName = XLSX.utils.encode_cell(c);
  const ws: XLSX.WorkSheet = {};
  ws["!cols"] = cols;
  ws["!rows"] = rows;
  //시트헤더
  ws[cellName] = {
    t: "s",
    v: `AACT ${moment(yyyymm, "YYYYMM").format("YYYY년 MM월")} SKD`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 22,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    },
  };

  ws["!merges"] = [];
  ws["!merges"].push({
    s: { c: 0, r: 1 },
    e: { c: c.c + dayLength + 6, r: c.r + 4 },
  });

  //휴무일 작성
  c = { c: c.c + dayLength + 5, r: c.r + 6 };
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `휴무일 : ${holidayTotal}`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 11,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    },
  };
  ws["!merges"].push({ s: { ...c }, e: { r: c.r, c: c.c + 1 } });
  c = { c: 1, r: 6 };
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `팀코드`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };
  c = { c: 2, r: 6 };
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `${hrpatSelect}`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };
  //테이블 헤더
  c = { c: 0, r: c.r + 2 };
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `순번`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thick,
        left: thick,
      },
    },
  };
  cellName = XLSX.utils.encode_cell({ c: 0, r: c.r + 1 });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
        left: thick,
      },
    },
  };
  ws["!merges"].push({ s: { ...c }, e: { c: c.c, r: c.r + 1 } });
  c.c++;
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `일자`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        bottom: thin,
        right: thick,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `사번`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
      },
    },
  };

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: `이름`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thick,
      },
    },
  };
  c.r++;

  cellName = XLSX.utils.encode_cell(c);
  ws[cellName] = {
    t: "s",
    v: ``,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
      },
    },
  };

  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { ...c } });

  Array.from({ length: dayLength }).forEach((_, i) => {
    c.c++;
    c.r--;
    const m = dayjs(yyyymm + String(i + 1).padStart(2, "0"));

    const dayName = m.format("ddd");
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${i + 1}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          top: thick,
          bottom: thin,
          right: m.day() === 0 ? thick : i + 1 === dayLength ? thick : thin,
        },
      },
    };
    c.r++;
    cellName = XLSX.utils.encode_cell({ ...c });

    ws[cellName] = {
      t: "s",
      v: `${dayName}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 12,
          bold: true,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: thick,
          right: m.day() === 0 ? thick : i + 1 === dayLength ? thick : thin,
        },
      },
    };
  });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `휴무일수`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thin,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `사용휴무`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thin,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `사용연차`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thin,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thin,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });

  c.c++;
  c.r--;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: `잔여연차`,
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: thick,
        right: thick,
      },
    },
  };
  c.r++;
  cellName = XLSX.utils.encode_cell({ ...c });
  ws[cellName] = {
    t: "s",
    v: "",
    s: {
      font: {
        name: "맑은 고딕",
        sz: 12,
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: thick,
        right: thick,
      },
    },
  };
  ws["!merges"].push({ s: { c: c.c, r: c.r - 1 }, e: { c: c.c, r: c.r } });

  grid1.forEach((gv, i) => {
    c.r++;
    c.c = 0;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${i + 1}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          left: thick,
          bottom: thick,
          right: thin,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${gv?.["USER_ID"] || ""}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: thick,
          right: thin,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${gv?.["USER_NAME"] || ""}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: thick,
          right: thin,
        },
      },
    };
    const tmp = grid1Dt?.[getInt(gv?.["USER_SID"])];
    if (tmp) {
      Array.from({ length: dayLength }).forEach((_, day) => {
        const tmpArray = tmp?.[day + 1];
        var str = "";
        if (tmpArray) {
          tmpArray.forEach((av, idx) => {
            if (idx !== 0) {
              str = str + "!";
            }
            if (av?.["WORK_TYPE_CODE"]) {
              str = str + `${av?.["WORK_TYPE_CODE"]}`;
            }
            if (av?.["ADD_WORK_HOUR"]) {
              str = str + `+${av?.["ADD_WORK_HOUR"]}`;
            }
            if (av?.["WORK_TERMINAL_CODE"]) {
              str = str + `+${av?.["WORK_TERMINAL_CODE"]}`;
            }
          });
        }
        c.c = 3 + day;
        cellName = XLSX.utils.encode_cell({ ...c });
        ws[cellName] = {
          t: "s",
          v: `${str}`,
          s: {
            font: {
              name: "맑은 고딕",
              sz: 11,
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border: {
              bottom: thick,
              right: thin,
            },
          },
        };
      });
    } else {
      Array.from({ length: dayLength }).forEach((_, day) => {
        c.c = 3 + day;
        cellName = XLSX.utils.encode_cell({ ...c });
        ws[cellName] = {
          t: "s",
          v: ``,
          s: {
            font: {
              name: "맑은 고딕",
              sz: 11,
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border: {
              bottom: thick,
              right: thin,
            },
          },
        };
      });
    }
    c.c = 3 + dayLength;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${gv?.["HOLIDAY"] || "0"}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: thick,
          right: thin,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${gv?.["HOLIDAY_USE"] || "0"}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: thick,
          right: thin,
        },
      },
    };
    c.c++;
    cellName = XLSX.utils.encode_cell({ ...c });
    ws[cellName] = {
      t: "s",
      v: `${gv?.["ANN_DAY"] || "0"}`,
      s: {
        font: {
          name: "맑은 고딕",
          sz: 11,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: {
          bottom: thick,
          right: thin,
        },
      },
    };
  });

  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: c.r, c: dayLength + 7 },
  });
  ws["!viewPane"] = { showGridLines: false };
  return ws;
}

//시간외근무파일 일괄 업로드
export const setTimeExcelFile = ({
  e,
}: {
  e: React.ChangeEvent<HTMLInputElement>;
}): Promise<Map<string, any> | null> => {
  return new Promise((resolve) => {
    const file = e.target.files?.[0];
    if (!file) {
      sendErr(`파일이 없습니다.`);
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) {
          sendErr("데이터가 없습니다.");
          resolve(null);
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const findObj = workbook.SheetNames.find((wv) => wv === "FORM2");

        if (!findObj) {
          sendErr(`FORM2의 시트가 없습니다.`);
          resolve(null);
          return;
        }

        const ws = workbook.Sheets[findObj];
        let msg = "";

        const rows = XLSX.utils.sheet_to_json<any[]>(ws, {
          header: 1,
          defval: "",
          range: 1,
        });

        const rowsFilter = rows.filter((row) => {
          return row[1] !== "" && row[3] !== "";
        });

        for (let i = 0; i < rowsFilter.length; i++) {
          const row = rowsFilter[i];

          const startDate = String(row[1]).trim();
          const userId = String(row[3]).trim();
          const startTime = String(row[4]).trim();
          const endDate = String(row[5]).trim();
          const endTime = String(row[6]).trim();
          const remark = String(row[7]).trim();

          // 1. 숫자 8자리인지
          if (!/^\d{8}$/.test(startDate)) {
            throw new Error(
              `${i + 10}행 : 시작일은 YYYYMMDD 형식의 숫자여야 합니다. (${startDate})`,
            );
          }

          // 2. 실제 날짜인지
          if (!dayjs(startDate, "YYYYMMDD", true).isValid()) {
            throw new Error(
              `${i + 10}행 : 존재하지 않는 날짜입니다. (${startDate})`,
            );
          }

          // 1. 숫자 8자리인지
          if (!/^\d{8}$/.test(endDate)) {
            throw new Error(
              `${i + 10}행 : 종료일은 YYYYMMDD 형식의 숫자여야 합니다. (${endDate})`,
            );
          }

          // 2. 실제 날짜인지
          if (!dayjs(endDate, "YYYYMMDD", true).isValid()) {
            throw new Error(
              `${i + 10}행 : 존재하지 않는 날짜입니다. (${endDate})`,
            );
          }

          if (!userId.startsWith("AT")) {
            throw new Error(
              `${i + 10}행 : 사번은 AT로 시작해야 합니다. (${userId})`,
            );
          }

          if (!/^\d{4}$/.test(startTime)) {
            throw new Error(
              `${i + 10}행 : 시작시간은 HHmm 형식의 숫자여야 합니다. (${startTime})`,
            );
          }

          // 2. 실제 시간인지 (00:00 ~ 23:59)
          if (!dayjs(startTime, "HHmm", true).isValid()) {
            throw new Error(
              `${i + 10}행 : 존재하지 않는 시간입니다. (${startTime})`,
            );
          }
          if (!/^\d{4}$/.test(endTime)) {
            throw new Error(
              `${i + 10}행 : 종료시간은 HHmm 형식의 숫자여야 합니다. (${endTime})`,
            );
          }

          // 2. 실제 시간인지 (00:00 ~ 23:59)
          if (!dayjs(endTime, "HHmm", true).isValid()) {
            throw new Error(
              `${i + 10}행 : 존재하지 않는 시간입니다. (${endTime})`,
            );
          }

          if (remark.length === 0) {
            throw new Error(`${i + 10}행 : 사유는 필수입니다.`);
          }

          const diff = getDiffDays(startDate, endDate);

          if (diff > 1 || diff < 0) {
            throw new Error(`${i + 10}행 : 날짜 차이가 너무 큽니다.`);
          }
        }

        const ret = rowsFilter.map((v) => ({
          reqStartDate: v[1],
          userId: v[3],
          addDay: getDiffDays(v[1], v[5]),
          reqStartTime: v[4],
          reqEndTime: v[6],
          remark: v[7],
        }));

        if (ret.length === 0) {
          throw new Error(`빈데이터입니다.`);
        }

        const map = new Map<string, any>();
        map.set("OT", ret);

        resolve(map);
      } catch (err: any) {
        sendErr(err?.message || String(err));
        resolve(null);
      } finally {
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      sendErr("엑셀 파일을 읽는 중 오류가 발생했습니다.");
      e.target.value = "";
      resolve(null);
    };

    reader.readAsArrayBuffer(file);
  });
};

interface PositionUser {
  terminalCode: string;
  teamName: string;
  teamCode: string;
  position: string;
}

interface TeamUser {
  terminalCode: string;
  userId: string;
  pass: string;
  groupJoinDate: string;
  joinDate: string;
  userName: string;
  workType: string;
  workType2: string;
  positionList: PositionUser[];
}

interface TeamGroup {
  teamName: string;
  teamCode: string;
  userArray: TeamUser[];
}

interface TeamData {
  teamGroup: TeamGroup[];
}

//사용자 관리 일괄 업로드
export const setUserGroupFile = ({
  e,
}: {
  e: React.ChangeEvent<HTMLInputElement>;
}): Promise<Map<string, any> | null> => {
  return new Promise((resolve) => {
    const file = e.target.files?.[0];
    if (!file) {
      sendErr(`파일이 없습니다.`);
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) {
          sendErr("데이터가 없습니다.");
          resolve(null);
          return;
        }

        const workbook = XLSX.read(data, { type: "array" });
        const findSheet1 = workbook.SheetNames.find((wv) => wv === "SHEET1");

        if (!findSheet1) {
          sendErr(`SHEET1의 시트가 없습니다.`);
          resolve(null);
          return;
        }

        const findSheet2 = workbook.SheetNames.find((wv) => wv === "SHEET2");

        if (!findSheet2) {
          sendErr(`SHEET2의 시트가 없습니다.`);
          resolve(null);
          return;
        }

        const ws = workbook.Sheets[findSheet1];
        const ws2 = workbook.Sheets[findSheet2];
        let msg = "";

        const rows = XLSX.utils
          .sheet_to_json<any[]>(ws, {
            header: 1,
            defval: "",
            range: 6,
            raw: false,
          })
          .filter((row) =>
            row.some(
              (cell) => cell !== "" && cell !== null && cell !== undefined,
            ),
          );

        const rows2 = XLSX.utils
          .sheet_to_json<any[]>(ws2, {
            header: 1,
            defval: "",
            range: 6,
            raw: false,
          })
          .filter((row) =>
            row.some(
              (cell) => cell !== "" && cell !== null && cell !== undefined,
            ),
          );
        var tmpTeamCode = "";
        var tmpTeamName = "";

        const tmpGroup: TeamGroup[] = [];

        rows.forEach((v, i) => {
          if (tmpTeamCode !== v[0] && v[0] !== "") {
            tmpTeamCode = v[0];
            tmpTeamName = v[1];
          }
          const findGroup = tmpGroup.find((gv) => gv.teamCode === tmpTeamCode);

          const findRows2 = rows2.filter((rv) => rv[4] === v[4]);

          const positionTmp: PositionUser[] = findRows2.map((rv) => ({
            teamCode: rv[0],
            teamName: rv[1],
            terminalCode: rv[2],
            position: rv[5],
          }));

          if (!findGroup) {
            tmpGroup.push({
              teamCode: tmpTeamCode,
              teamName: tmpTeamName,
              userArray: [
                {
                  terminalCode: v[2],
                  userName: v[3],
                  userId: v[4],
                  pass: v[5],
                  groupJoinDate: normalizeDate(v[6]),
                  joinDate: normalizeDate(v[7]),
                  workType: v[8],
                  workType2: v[9],
                  positionList: positionTmp,
                },
              ],
            });
          } else {
            findGroup.userArray.push({
              terminalCode: v[2],
              userName: v[3],
              userId: v[4],
              pass: v[5],
              groupJoinDate: normalizeDate(v[6]),
              joinDate: normalizeDate(v[7]),
              workType: v[8],
              workType2: v[9],
              positionList: positionTmp,
            });
          }
        });

        const map = new Map<string, any>();
        map.set("teamGroup", tmpGroup);
        resolve(map);
      } catch (err: any) {
        sendErr(err?.message || String(err));
        resolve(null);
      } finally {
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      sendErr("엑셀 파일을 읽는 중 오류가 발생했습니다.");
      e.target.value = "";
      resolve(null);
    };

    reader.readAsArrayBuffer(file);
  });
};

const normalizeDate = (value: any) => {
  if (!value) return "";

  const str = String(value).trim();

  // 이미 YYYYMMDD 형태면 그대로
  if (/^\d{8}$/.test(str)) {
    return str;
  }

  // 2/3/26 또는 02/03/2026 형태
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);

  if (match) {
    let [, month, day, year] = match;

    if (year.length === 2) {
      year = `20${year}`;
    }

    return year + month.padStart(2, "0") + day.padStart(2, "0");
  }

  // 2026-02-03 형태
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    return str.replaceAll("-", "");
  }

  return str;
};
