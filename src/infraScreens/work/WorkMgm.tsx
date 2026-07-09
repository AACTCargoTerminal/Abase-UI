import { CommonDropDown, CommonMonthDatePicker } from "../../comp/DropDown";
import { CommonChk, CommonInput } from "../../comp/Input";
import type { DefInfraComp, PageHandle, TableRow } from "../../Util/Type";
import {
  confirmObj,
  getApi,
  getClass,
  getDouble,
  getInt,
  getMenu,
  getPgmInfo,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import moment from "moment";
import { Btn } from "../../comp/Btn";
import { CommonContainer, CommonTab } from "../../comp/Container";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { commonHeader2, commonHeader4, commonHeader5 } from "../../Util/Header";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { TableCust2 } from "../../comp/Table";
import { createPortal, flushSync } from "react-dom";

import dayjs from "dayjs";
import "dayjs/locale/ko";
import { LuSquarePlus } from "react-icons/lu";
import type { Root } from "react-dom/client";
import { getExcelFile, setExcelFile } from "./WorkUtil";
import { selectNav } from "../../slices/user";
dayjs.locale("ko");

const FILTER_DATA: TableRow[] = [
  { CODE_CODE: "", CODE_NAME: "ALL" },
  { CODE_CODE: "Y", CODE_NAME: "예" },
  { CODE_CODE: "N", CODE_NAME: "아니오" },
];

const HRREQ_HEADER = [
  "#F97316",
  "#F59E0B",
  "#3B82F6",
  "#22C55E",
  "#6B7280",
  "#EF4444",
  "#8B5CF6",
  "#6366F1",
];

const WorkMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId }, ref) => {
    const dispatch = useDispatch();
    const [opcodCss, setOpcodCss] = useState<{
      x: number;
      y: number;
      xPos: "LEFT" | "RIGHT";
      yPos: "TOP" | "BOT";
      mainIdx: number;
      subIdx: number;
      seq: number;
    }>({
      x: 0,
      y: 0,
      mainIdx: -1,
      subIdx: -1,
      xPos: "LEFT",
      yPos: "BOT",
      seq: -1,
    });

    const [opcodOpen, setOpcodOpen] = useState<boolean>(false);
    const opcodTbRef = useRef<HTMLDivElement | null>(null);
    const opcodRef = useRef<HTMLElement | null>(null);
    const [detail, setDetail] = useState<{
      x: number;
      y: number;
      xPos: "LEFT" | "RIGHT";
      yPos: "TOP" | "BOT";
      mainIdx: number;
      subIdx: number;
      row: TableRow[];
    }>({
      x: 0,
      y: 0,
      mainIdx: -1,
      subIdx: -1,
      xPos: "LEFT",
      yPos: "BOT",
      row: [],
    });
    const [detailOpen, setDetailOpen] = useState<boolean>(false);
    const detailTbRef = useRef<HTMLDivElement | null>(null);
    const detailRef = useRef<HTMLElement | null>(null);
    const [halfTime, setHalfTime] = useState(false);

    const [username, setUsername] = useState("");
    const [closeSelect, setCloseSelect] = useState("");

    const [date, setDate] = useState(moment().format("YYYYMM"));
    const [dayLength, setDayLenth] = useState(
      getInt(moment().endOf("month").format("DD")),
    );
    const [holidayArray, setHolidayArray] = useState<TableRow[]>([]);
    const [orgGrid1, setOrgGrid1] = useState<TableRow[]>([]);
    const [orgGrid1Dt, setOrgGrid1Dt] = useState<
      Record<number, Record<string, TableRow[]>>
    >({});
    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const [grid1Dt, setGrid1Dt] = useState<
      Record<number, Record<string, TableRow[]>>
    >({});
    const [changeGrid1Dt, setChangeGrid1Dt] = useState<
      Record<string, Record<string, TableRow[]>>
    >({});
    const [opcod, setOpcod] = useState<TableRow[]>([]);
    const [copOpcod, setCopOpcod] = useState<TableRow[]>([]);
    const [hrpatOrigin, setHrpatOrigin] = useState<TableRow[]>([]);
    const [approveDay, setApproveDay] = useState(getInt(moment().format("DD")));
    const [chkSelect, setChkSelect] = useState<Record<number, boolean>>({});
    const [allChk, setAllChk] = useState<boolean>(false);

    const userTrmCode = useSelector(
      (state: RootState) =>
        state.user.userInfo?.relArray.find(
          (ur) => ur["CLASS_CODE"] === "TRMCD",
        )?.["CODE_CODE"] || "",
    );
    const [hrpat, setHrpat] = useState<TableRow[]>([]);
    const [hrpatSelect, setHrpatSelect] = useState("");
    const userId = useSelector(
      (state: RootState) => state.user.userInfo?.userId || "",
    );
    const [btnAuth, setBtnAuth] = useState(false);
    const [hrreq, setHrreq] = useState<TableRow[]>([]);
    const [hrreqHeader, setHrreqHeader] = useState<TableRow>({});

    useEffect(() => {
      getHRPAT();
      getHRREQ();
    }, []);

    async function getHRREQ() {
      const data = await getClass("HRREQ", pgmId);
      const tmp = data.filter((v) => v?.["VALUE1_CHAR"] === "Y");
      setHrreq(tmp);
      const tmpHeader: TableRow = tmp.reduce((acc, v, i) => {
        acc[v["CODE_CODE"]] = HRREQ_HEADER[i];
        return acc;
      }, {} as TableRow);
      setHrreqHeader(tmpHeader);
    }

    async function getHRPAT() {
      const data = await getClass("HRPAT", pgmId);
      setHrpatOrigin(data);
      const filterTmp = data.filter(
        (ft) =>
          ft["VALUE6_CHAR"] === userId ||
          ft["VALUE3_CHAR"] === userId ||
          ft["VALUE4_CHAR"] === userId ||
          ft["VALUE5_CHAR"] === userId,
      );
      setHrpat(filterTmp);
      setHrpatSelect(filterTmp?.[0]?.["CODE_CODE"] || "");
    }
    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (opcodOpen === false) {
          return;
        }
        if (opcodOpen && opcodTbRef.current?.contains(e.target as Node)) {
          return;
        }
        if (opcodOpen && opcodRef.current?.contains(e.target as Node)) {
          return;
        }
        setOpcodCss({
          mainIdx: -1,
          subIdx: -1,
          x: 0,
          y: 0,
          xPos: "LEFT",
          yPos: "BOT",
          seq: -1,
        });
      };

      document.addEventListener("mousedown", handleClick);

      return () => {
        document.removeEventListener("mousedown", handleClick);
      };
    }, [opcodOpen]);

    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (detailOpen === false) {
          return;
        }
        if (detailOpen && detailTbRef.current?.contains(e.target as Node)) {
          return;
        }
        if (detailOpen && detailRef.current?.contains(e.target as Node)) {
          return;
        }
        setDetail({
          mainIdx: -1,
          subIdx: -1,
          x: 0,
          y: 0,
          xPos: "LEFT",
          yPos: "BOT",
          row: [],
        });
      };

      document.addEventListener("mousedown", handleClick);

      return () => {
        document.removeEventListener("mousedown", handleClick);
      };
    }, [detailOpen]);

    useEffect(() => {
      const tmp: Record<number, boolean> = {};
      grid1.forEach((v) => {
        if (v["USER_SID"]) {
          tmp[v["USER_SID"]] = allChk;
        }
      });

      setChkSelect(tmp);
    }, [allChk]);

    useEffect(() => {
      if (opcodCss.x !== 0 && opcodCss.y !== 0) {
        setOpcodOpen(true);
      } else {
        setOpcodOpen(false);
      }
    }, [opcodCss]);
    useEffect(() => {
      if (detail.x !== 0 && detail.y !== 0) {
        setDetailOpen(true);
      } else {
        setDetailOpen(false);
      }
    }, [detail]);

    useEffect(() => {
      let mounted = true;

      (async () => {
        const v = await getOPCOD();
        if (mounted) {
          setOpcod(v);
          setCopOpcod(v);
        }
      })();

      return () => {
        mounted = false;
      };
    }, []);

    useEffect(() => {
      if (date) {
        setDayLenth(getInt(moment(date).endOf("month").format("DD")));
        searchClick();
        getHoliday();
      }
    }, [date]);
    useEffect(() => {
      if (hrpatSelect) {
        const filterData = hrpat.find((v) => v?.["CODE_CODE"] === hrpatSelect);
        if (filterData) {
          if (
            filterData?.["VALUE3_CHAR"] === userId ||
            filterData?.["VALUE4_CHAR"] === userId ||
            filterData?.["VALUE5_CHAR"] === userId
          ) {
            setBtnAuth(true);
          } else {
            setBtnAuth(false);
          }
        } else {
          setBtnAuth(false);
        }
      }
    }, [hrpatSelect]);

    useEffect(() => {
      setGrid1(
        orgGrid1.filter((v) =>
          closeSelect !== ""
            ? (v?.["CLOSE_FLAG"] || "N") === closeSelect
            : true,
        ),
      );
    }, [closeSelect]);

    useEffect(() => {
      if (username) {
        var tmpArray: TableRow[] = [];
        var tmp: Record<number, Record<string, TableRow[]>> = {};

        Object.values(orgGrid1).forEach((v) => {
          if (String(v?.["USER_NAME"] || "").includes(username)) {
            if (v?.["USER_SID"]) {
              tmpArray.push(v);
              tmp[v["USER_SID"]] = orgGrid1Dt[v["USER_SID"]];
            }
          }
        });

        if (Object.keys(tmp).length === 0) {
          setGrid1(orgGrid1);
          setGrid1Dt(orgGrid1Dt);
        } else {
          setGrid1(tmpArray);
          setGrid1Dt(tmp);
        }
      } else {
        setGrid1(orgGrid1);
        setGrid1Dt(orgGrid1Dt);
      }
    }, [username]);

    async function searchClick(teamCode?: string) {
      setChangeGrid1Dt({});
      setChkSelect({});
      setAllChk(false);
      sendLoading(true);
      const code = teamCode ?? hrpatSelect;
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getWorkM010_002?date=${date}&deptCode=${code}&approveFlag=`,
        pgmId: pgmId,
      });
      sendLoading(false);

      if (res.ok) {
        if (res.data?.[0] && res.data?.[1]) {
          setGrid1(res.data[0]);
          setOrgGrid1(res.data[0]);
          const tmp: Record<number, Record<string, TableRow[]>> = {};

          res.data[1].forEach((r1) => {
            if (r1?.["USER_SID"] && r1?.["DAY"] && r1?.["SEQ"] !== undefined) {
              const userTmp = r1["USER_SID"];
              if (tmp?.[userTmp]) {
                const dayTmp = r1["DAY"];
                if (tmp[userTmp]?.[dayTmp]) {
                  const seqTmp = tmp[userTmp][dayTmp].find(
                    (st) => st?.["SEQ"] === r1["SEQ"],
                  );
                  if (seqTmp) {
                    Object.assign(seqTmp, r1);
                  } else {
                    tmp[userTmp][dayTmp].push(r1);
                  }
                } else {
                  tmp[userTmp] = {
                    ...tmp[userTmp],
                    [dayTmp]: [r1],
                  };
                }
              } else {
                tmp[userTmp] = {
                  [r1["DAY"]]: [r1],
                };
              }
            }
          });
          setGrid1Dt(tmp);
          setOrgGrid1Dt(tmp);

          return;
        }
      }
      setGrid1([]);
      setGrid1Dt({});
    }

    async function getHoliday() {
      //getHoliDay
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getHoliDay?date=${date}`,
        pgmId: pgmId,
      });
      if (res.ok) {
        if (res.data?.[0]) {
          setHolidayArray(res.data[0]);
          return;
        }
      }
      setHolidayArray([]);
    }

    async function getOPCOD(): Promise<TableRow[]> {
      const data = await getClass("OPCOD", pgmId);
      const tmp = data.filter((rf) => getInt(rf["VALUE2_NUMBER"]) !== 1);
      return [{ CODE_CODE: "" }, ...tmp];
    }

    function workBtnClick<T extends HTMLElement>(
      e: React.MouseEvent<T>,
      type: "INPUT" | "BTN",
      i: number,
      idx: number,
      seq: number,
    ) {
      var isSame = null;
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const rect = e.currentTarget.getBoundingClientRect();
      if (type === "INPUT") {
        opcodRef.current = e.currentTarget;
        isSame = opcodCss.mainIdx === i && opcodCss.subIdx === idx;

        flushSync(() => {
          setOpcodCss({
            mainIdx: -1,
            subIdx: -1,
            x: 0,
            y: 0,
            xPos: "LEFT",
            yPos: "BOT",
            seq: -1,
          });
        });

        if (!isSame) {
          setOpcodCss({
            x: 350 + rect.right > winW ? rect.right - 350 : rect.left,
            y: 300 + rect.bottom > winH ? rect.top - 300 : rect.bottom,
            mainIdx: i,
            subIdx: idx,
            xPos: 350 + rect.right > winW ? "LEFT" : "RIGHT",
            yPos: 300 + rect.bottom > winH ? "TOP" : "BOT",
            seq: seq,
          });
        }
      } else if (type === "BTN") {
        const tmp = grid1Dt?.[grid1?.[i]?.["USER_SID"]]?.[idx + 1] || [];

        detailRef.current = e.currentTarget;
        isSame = detail.mainIdx === i && detail.subIdx === idx;
        flushSync(() => {
          setDetail({
            mainIdx: -1,
            subIdx: -1,
            x: 0,
            y: 0,
            xPos: "LEFT",
            yPos: "BOT",
            row: [],
          });
        });

        if (!isSame) {
          setDetail({
            x: 500 + rect.right > winW ? rect.right - 500 : rect.left,
            y: 250 + rect.bottom > winH ? rect.top - 250 : rect.bottom,
            mainIdx: i,
            subIdx: idx,
            xPos: 500 + rect.right > winW ? "LEFT" : "RIGHT",
            yPos: 250 + rect.bottom > winH ? "TOP" : "BOT",
            row: tmp,
          });
        }
      }
    }

    async function setWorkM010_013(e: React.ChangeEvent<HTMLInputElement>) {
      sendLoading(true);
      setHrpatSelect("");
      const tmp = await setExcelFile({
        e: e,
        yyyymm: date,
        dayLength: dayLength,
        halfType: halfTime ? "Y" : "N",
        grid1: orgGrid1,
      });

      if (tmp === null) {
        sendErr("엑셀파일 추출 실패");
        sendLoading(false);
        return;
      }

      const patTmp = hrpat.find(
        (hf) => hf["CODE_CODE"] === String(tmp.get("teamCode")),
      );
      if (!patTmp) {
        sendErr(`${tmp.get("teamCode")} 업로드 권한이 없습니다.`);
        sendLoading(false);
        return;
      }
      setHrpatSelect(String(tmp.get("teamCode")));

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_014`,
        params: tmp,
        pgmId: pgmId,
        sucFlag: true,
      });
      sendLoading(false);
      if (res.ok) {
        await searchClick(String(tmp.get("teamCode")));
      }
    }

    const setWorkM010_017 = useCallback(async () => {
      if (!hrpatSelect) {
        sendErr("파트를 선택해주세요");
        return;
      }
      sendLoading(true);

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/setWorkM010_017?date=${date}&teamCode=${hrpatSelect}`,
        pgmId: pgmId,
        sucFlag: true,
      });
      sendLoading(false);
      if (res.ok) {
        await searchClick();
      }
    }, [date, chkSelect]);

    const approveClick = useCallback(async () => {
      const tmp = Object.keys(chkSelect)
        .filter((v) => chkSelect[getInt(v)] === true)
        .map((v) => getInt(v));
      if (tmp.length === 0) {
        sendErr("선택한 근무자가 없습니다.");
        return;
      }
      if (!approveDay) {
        sendErr("확정일 에러");
        return;
      }

      const userArray = tmp.flatMap((v) => {
        const gridDtTmp = Object.keys(orgGrid1Dt?.[v]).flatMap((gv) => {
          if (
            orgGrid1Dt?.[v]?.[gv].filter((ogv) => ogv?.["APPROVE_FLAG"] !== "Y")
              .length > 0 &&
            gv !== "00" &&
            Number(gv) <= approveDay
          ) {
            return [gv];
          } else {
            return [];
          }
        });
        if (gridDtTmp.length > 0) {
          return [{ userSid: v, dayArray: gridDtTmp }];
        } else {
          return [];
        }
      });
      const map = new Map<string, any>();
      map.set("date", date);
      map.set("userArray", userArray);
      sendLoading(true);

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_032`,
        params: map,
        pgmId: pgmId,
        sucFlag: true,
      });
      sendLoading(false);
      if (res.ok) {
        await searchClick();
      }
    }, [date, chkSelect, approveDay]);

    const saveClick = useCallback(async () => {
      if (!userTrmCode) {
        sendErr("터미널코드가 없습니다.");
        return;
      }

      const map = new Map<string, any>();
      map.set("date", date);
      map.set("halfType", halfTime ? "Y" : "N");
      map.set("teamCode", hrpatSelect);
      const userArray: TableRow[] = [];
      Object.keys(changeGrid1Dt).forEach((v) => {
        if (changeGrid1Dt?.[v]) {
          const dayArray: TableRow[] = [];
          Object.keys(changeGrid1Dt[v]).forEach((r) => {
            if (changeGrid1Dt[v]?.[r]) {
              var str = "";

              if (changeGrid1Dt[v][r]?.[0]?.["WORK_TYPE_CODE"]) {
                str = changeGrid1Dt[v][r]?.[0]?.["WORK_TYPE_CODE"] || "";
                if (changeGrid1Dt[v][r]?.[0]?.["ADD_WORK_HOUR"]) {
                  str = str + "," + changeGrid1Dt[v][r]?.[0]?.["ADD_WORK_HOUR"];
                }
                if (changeGrid1Dt[v][r]?.[0]?.["WORK_TERMINAL_CODE"]) {
                  str =
                    str +
                    "-" +
                    changeGrid1Dt[v][r]?.[0]?.["WORK_TERMINAL_CODE"];
                }
                if (changeGrid1Dt[v][r]?.[1]?.["WORK_TYPE_CODE"]) {
                  str =
                    str + "!" + changeGrid1Dt[v][r]?.[1]?.["WORK_TYPE_CODE"];
                  if (changeGrid1Dt[v][r]?.[1]?.["ADD_WORK_HOUR"]) {
                    str =
                      str + "," + changeGrid1Dt[v][r]?.[1]?.["ADD_WORK_HOUR"];
                  }
                  if (changeGrid1Dt[v][r]?.[1]?.["WORK_TERMINAL_CODE"]) {
                    str =
                      str +
                      "-" +
                      changeGrid1Dt[v][r]?.[1]?.["WORK_TERMINAL_CODE"];
                  }
                }
              }

              dayArray.push({ DAY: r, DAY_STR: str });
            }
          });
          if (dayArray.length > 0) {
            userArray.push({
              USER_ID: v,
              CLOSE_FLAG:
                orgGrid1.find((orgV) => orgV?.["USER_ID"] === v)?.[
                  "CLOSE_FLAG"
                ] || "N",
              dayArray: dayArray,
            });
          }
        }
      });

      if (userArray.length === 0) {
        sendErr("수정 항목이 없습니다.");
        return;
      }
      map.set("userArray", userArray);
      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_014`,
        params: map,
        pgmId: pgmId,
        sucFlag: true,
      });
      sendLoading(false);
      if (res.ok) {
        await searchClick();
      }
    }, [changeGrid1Dt, date, halfTime, hrpatSelect, userTrmCode, orgGrid1]);

    const getExcel = useCallback(async () => {
      const ret = await getApi<string>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getExWorkSch?teamCode=${hrpatSelect}&date=${date}`,
        pgmId: pgmId,
        sucFlag: true,
      });

      if (ret.ok) {
        if (ret.data) {
          const base64 = ret.data;

          const byteCharacters = atob(base64);

          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);

          const blob = new Blob([byteArray], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

          const url = window.URL.createObjectURL(blob);

          const a = document.createElement("a");

          a.href = url;
          a.download = `${dayjs().format("YYYY_MM_DD")}스케줄.xlsx`;

          document.body.appendChild(a);

          a.click();

          a.remove();

          window.URL.revokeObjectURL(url);
        }
      }
    }, [hrpatSelect, date]);

    return (
      <div className="w-full h-full flex flex-col gap-3 py-[0.25%] pr-[0.5%]">
        <div className="grid grid-cols-[0.50fr_0.45fr] gap-3 items-center justify-between">
          {" "}
          <CommonContainer title="조회 및 버튼">
            <div className="grid grid-cols-[0.25fr_0.25fr_0.1fr_0.25fr_0.15fr] items-center gap-3">
              <div className="mainInput">
                {" "}
                <CommonMonthDatePicker
                  id="date"
                  onClick={(v) => {
                    setDate(v);
                  }}
                  value={date}
                  title="날짜"
                  colSize="15%"
                />
              </div>
              <div className="mainInput">
                <CommonDropDown
                  id="dptcd"
                  data={hrpat}
                  dropHeight="10rem"
                  header={commonHeader4}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "1",
                    value: hrpatSelect,
                  }}
                  onClick={(r) => setHrpatSelect(r["CODE_CODE"])}
                  labelW="25%"
                  title="파트 명"
                />
              </div>
              <div className="mainInput">
                <Btn txt="조회" type="SEARCH" onClick={() => searchClick()} />
              </div>
              <div className="mainInput">
                <Btn
                  txt="엑셀 양식 다운로드"
                  type="PRINT"
                  onClick={() => {
                    if (!hrpatSelect) {
                      sendErr("파트를 선택해주세요");
                      return;
                    }
                    getExcel();
                  }}
                />
              </div>
              <div className="mainInput">
                <Btn
                  txt="엑셀 업로드"
                  type="EXCEL"
                  onClick={() => {
                    document.getElementById("excelFile")?.click();
                  }}
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="필터">
            <div className="grid grid-cols-[0.15fr_0.18fr_0.18fr_0.2fr] gap-3 items-center">
              <div className="mainInput">
                <CommonInput
                  id="username"
                  value={username}
                  onChange={(v) => setUsername(v)}
                  label="이름"
                  labelW="30%"
                />
              </div>
              <div className="mainInput">
                <CommonDropDown
                  id="close"
                  data={FILTER_DATA}
                  dropHeight="10rem"
                  header={commonHeader2}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: closeSelect,
                  }}
                  onClick={(r) => setCloseSelect(r["CODE_CODE"])}
                  title="마감 유무"
                  labelW="40%"
                />
              </div>
            </div>
          </CommonContainer>
        </div>

        <CommonContainer
          title="근무표"
          childrenTitle={
            <div className="grid grid-cols-[0.28fr_0.6fr] justify-between items-center gap-2 w-full px-[1%]">
              <div className="flex flex-col">
                <div className="flex gap-3 items-center">
                  <span className="text-nowrap font-bold">
                    --- 일자 관련 추가 현황
                  </span>
                  <div className="flex gap-2 items-center mainInput">
                    <div className="size-3 bg-red-500"></div>
                    <span className="text-nowrap">추가 스케줄</span>
                  </div>
                  <div className="flex gap-2 items-center mainInput">
                    <div className="size-3 bg-black"></div>
                    <span className="text-nowrap">마감</span>
                  </div>
                  <div className="flex gap-2 items-center mainInput">
                    <div className="size-3 bg-green-500"></div>
                    <span className="text-nowrap">확정</span>
                  </div>
                  <div className="flex gap-2 items-center mainInput">
                    <div className="size-3 bg-blue-500"></div>
                    <span className="text-nowrap">시간외근무</span>
                  </div>
                  <div className="flex gap-2 items-center mainInput">
                    <div className="size-3 bg-violet-500"></div>
                    <span className="text-nowrap">임시터미널 등록 여부</span>
                  </div>
                  <div className="flex gap-2 items-center mainInput">
                    <div className="size-3 bg-stone-500"></div>
                    <span className="text-nowrap">OT등록 여부</span>
                  </div>
                  <div className="flex gap-2 items-center mainInput">
                    <div className="size-3 bg-[#14B8A6]"></div>
                    <span className="text-nowrap">인사설정</span>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-nowrap font-bold">--- 상태</span>
                  {hrreq.map((hv, i) => {
                    return (
                      <div className="flex gap-2 items-center mainInput">
                        <div
                          className={`size-3`}
                          style={{ backgroundColor: HRREQ_HEADER[i] }}></div>
                        <span className="text-nowrap">
                          {hv?.["CODE_NAME2"] || ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                {" "}
                {btnAuth && (
                  <>
                    <div className="mainInput">
                      <Btn
                        txt="마감"
                        type="CLOSE"
                        onClick={() => setWorkM010_017()}
                      />
                    </div>
                    <div className="mainInput w-[30%]">
                      <CommonInput
                        id="approveDay"
                        value={approveDay.toString()}
                        label="확정일"
                        onChange={(v) => setApproveDay(getInt(v))}
                        labelW="40%"
                      />
                    </div>
                    <div className="mainInput">
                      <Btn
                        txt="확정"
                        type="NONE"
                        onClick={() => {
                          approveClick();
                        }}
                      />
                    </div>
                    <div />
                  </>
                )}
                <div className="mainInput">
                  <Btn txt="저장" type="SAVE" onClick={() => saveClick()} />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="취소"
                    type="DELETE"
                    onClick={() => {
                      setChangeGrid1Dt({});
                      setGrid1Dt(orgGrid1Dt);
                    }}
                  />
                </div>
              </div>
            </div>
          }>
          <div
            className="rounded-md h-[35rem] w-full overflow-x-auto"
            style={{ scrollbarGutter: "stable" }}
            onScroll={() => {
              setOpcodCss({
                mainIdx: -1,
                subIdx: -1,
                x: 0,
                y: 0,
                xPos: "LEFT",
                yPos: "BOT",
                seq: -1,
              });
            }}>
            {/* 헤더 */}
            <div
              className={`sticky top-0 z-10 grid items-center border-b-2 border-x-2 border-slate-200 py-[0.1%] h-[3rem] bg-[#1F2A44] rounded-t-md shadow-xs`}
              style={{
                gridTemplateColumns: `50px 50px 140px repeat(${dayLength},80px) 50px 80px 60px 60px 60px 60px`,
                width: "max-content",
                minWidth: "100%",
              }}>
              <div
                className="font-bold text-xs border-r-2 border-slate-300 flex items-center justify-center h-full text-slate-200"
                style={{
                  position: "sticky",
                  left: "0px",
                  backgroundColor: "#1F2A44",
                }}>
                {" "}
                <input
                  type="checkbox"
                  className="h-full accent-gray-300 rounded-md size-4 text-center"
                  checked={allChk}
                  onChange={(e) => {
                    setAllChk(e.target.checked);
                  }}
                />
              </div>
              <div
                className="font-bold text-xs border-r-2 border-slate-300 flex flex-col items-center justify-center h-full text-slate-200"
                style={{
                  position: "sticky",
                  left: "50px",
                  backgroundColor: "#1F2A44",
                }}>
                <div className="text-center">순 번</div>
              </div>
              <div
                style={{
                  position: "sticky",
                  left: "100px",
                  backgroundColor: "#1F2A44",
                }}
                className="font-bold text-xs border-r-2 border-slate-300 flex flex-col gap-y-1 h-full justify-center w-full text-slate-200">
                <div className="text-center">마감 유무</div>
                <div className="text-center">이름 : 아이디</div>
              </div>
              {Array.from(
                {
                  length: dayLength,
                },
                (_, i) => {
                  const m = dayjs(date)
                    .locale("ko")
                    .date(i + 1);
                  const dayName = m.format("ddd");

                  var color = "text-slate-200";

                  if (m.day() === 0) {
                    color = "text-[#C92F34]";
                  } else if (m.day() === 6) {
                    color = "text-blue-500";
                  } else {
                  }

                  return (
                    <div
                      className={`flex flex-col px-[0.5%] justify-center font-bold text-xs ${color} ${i === dayLength - 1 ? "" : "border-r-2 border-slate-300"} h-full`}
                      key={i}>
                      <div className="text-center">{i + 1}</div>
                      <div className="text-center">{dayName}</div>
                    </div>
                  );
                },
              )}
              <div
                style={{ position: "sticky", right: "320px" }}
                className="font-bold z-[30] text-xs  border-x-2 bg-[#1F2A44] border-slate-300 flex items-center justify-center h-full text-slate-200">
                확정
              </div>
              <div
                style={{ position: "sticky", right: "240px" }}
                className="font-bold z-[30] text-xs border-r-2 bg-[#1F2A44] border-slate-300 flex items-center justify-center h-full text-slate-200">
                시간외근무
              </div>
              <div
                style={{ position: "sticky", right: "180px" }}
                className="font-bold z-[30] text-xs border-r-2 bg-[#1F2A44] border-slate-300 flex items-center justify-center h-full text-slate-200">
                휴무일수
              </div>
              <div
                style={{ position: "sticky", right: "120px" }}
                className="font-bold z-[30] text-xs border-r-2 bg-[#1F2A44] border-slate-300 flex items-center justify-center h-full text-slate-200">
                사용휴무
              </div>
              <div
                style={{ position: "sticky", right: "60px" }}
                className="font-bold z-[30] text-xs border-r-2 bg-[#1F2A44] border-slate-300 flex items-center justify-center h-full text-slate-200">
                사용연차
              </div>
              <div
                style={{ position: "sticky", right: "0px" }}
                className="font-bold z-[30] text-xs border-r-2 bg-[#1F2A44] border-slate-300 flex items-center justify-center h-full text-slate-200">
                잔여연차
              </div>
            </div>
            {/* 바디 */}
            <div
              className="border-x-2 border-slate-200"
              style={{ width: "max-content", minWidth: "100%" }}>
              {opcod.length > 0 &&
                grid1.map((v, i) => (
                  <div
                    key={i}
                    className={`grid items-center border-b-2 border-slate-500 ${i % 2 === 0 ? "bg-[#EEF3F8]" : "bg-[#D6E6F0]"} duration-300 origin-top h-[4.5rem] `}
                    style={{
                      gridTemplateColumns: `50px 50px 140px repeat(${dayLength},80px) 50px 80px 60px 60px 60px 60px`,
                      width: "max-content",
                      minWidth: "100%",
                    }}>
                    <div
                      style={{
                        position: "sticky",
                        left: "0px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="text-center flex gap-x-2 items-center justify-center w-full h-full">
                      {" "}
                      <input
                        type="checkbox"
                        className="h-full accent-gray-300 rounded-md size-4 text-center"
                        checked={chkSelect?.[v["USER_SID"]] || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked === false) {
                            setAllChk(false);
                          }
                          if (v?.["USER_SID"]) {
                            setChkSelect((prev) => ({
                              ...prev,
                              [v["USER_SID"]]: e.target.checked,
                            }));
                          }
                        }}
                      />
                    </div>
                    <div
                      style={{
                        position: "sticky",
                        left: "50px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="text-center flex flex-col gap-x-1 items-center justify-center w-full h-full">
                      <div className="flex gap-x-1">
                        {" "}
                        <span className="h-full flex items-center">
                          {i + 1}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        position: "sticky",
                        left: "100px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="flex flex-col border-r-2 border-slate-400 gap-y-1 h-full items-center justify-center w-full px-[4%]">
                      <div
                        className={`w-[10%] rounded-md border-2 ${
                          v?.["CLOSE_FLAG"] === "Y"
                            ? "border-black"
                            : "border-transparent"
                        }`}
                      />
                      <div className="mainInput">
                        <CommonInput
                          id={`userId`}
                          value={`${v["USER_NAME"]} : ${v["USER_ID"]}`}
                          read={true}
                        />
                      </div>
                    </div>
                    {Array.from(
                      {
                        length: dayLength,
                      },
                      (_, idx) => {
                        return (
                          <div
                            className={`flex flex-col h-full items-center justify-center px-[5%] gap-y-1 cursor-pointer rounded-md hover:bg-gray-300`}
                            key={`${i}${idx}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              workBtnClick(e, "BTN", i, idx, 0);
                            }}>
                            <div className="flex w-full items-center justify-center gap-x-1">
                              <div
                                className={`w-[10%] rounded-md border-2 ${
                                  grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[1]?.[
                                    "WORK_TYPE_CODE"
                                  ]
                                    ? "border-red-500"
                                    : "border-transparent"
                                }`}
                              />
                              <div
                                className={`w-[10%] rounded-md border-2 ${
                                  grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                    "APPROVE_FLAG"
                                  ] === "Y"
                                    ? "border-green-500"
                                    : "border-transparent"
                                }`}
                              />
                              <div
                                className={`w-[10%] rounded-md border-2 ${
                                  grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                    "REQ_START_TIME"
                                  ] ||
                                  grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[1]?.[
                                    "REQ_START_TIME"
                                  ]
                                    ? "border-blue-500"
                                    : "border-transparent"
                                }`}
                              />
                              <div
                                className={`w-[10%] rounded-md border-2 ${
                                  !grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                    "WORK_TERMINAL_CODE"
                                  ] &&
                                  !grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[1]?.[
                                    "WORK_TERMINAL_CODE"
                                  ]
                                    ? "border-transparent"
                                    : "border-violet-500"
                                }`}
                              />
                              <div
                                className={`w-[10%] rounded-md border-2 ${
                                  !grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                    "ADD_WORK_HOUR"
                                  ] &&
                                  !grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[1]?.[
                                    "ADD_WORK_HOUR"
                                  ]
                                    ? "border-transparent"
                                    : "border-stone-500"
                                }`}
                              />
                              <div
                                className={`w-[10%] rounded-md border-2 ${
                                  grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                    "HR_STATUS"
                                  ] === 0
                                    ? "border-transparent"
                                    : "border-[#14B8A6]"
                                }`}
                              />
                            </div>
                            <div
                              className={`flex w-[70%] rounded-md border-2 items-center justify-center gap-x-1 ${
                                !grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                  "DETAIL_STATUS"
                                ]
                                  ? "border-transparent"
                                  : `border-${
                                      hrreqHeader[
                                        grid1Dt?.[v["USER_SID"]]?.[
                                          idx + 1
                                        ]?.[0]?.["DETAIL_STATUS"]
                                      ]
                                    }`
                              }`}
                              style={{
                                borderColor: hrreqHeader?.[
                                  grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                    "DETAIL_STATUS"
                                  ]
                                ]
                                  ? hrreqHeader[
                                      grid1Dt?.[v["USER_SID"]]?.[
                                        idx + 1
                                      ]?.[0]?.["DETAIL_STATUS"]
                                    ]
                                  : "transparent",
                              }}></div>
                            <div
                              className={`w-full mainInput flex items-center ${
                                changeGrid1Dt?.[v["USER_ID"]]?.[idx + 1]?.[0]?.[
                                  "WORK_TYPE_CODE"
                                ]
                                  ? "bg-red-300"
                                  : "bg-white"
                              } rounded-md border border-gray-300 px-3 py-1
              focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500`}
                              onClick={(e) => {
                                e.stopPropagation();
                                workBtnClick(e, "INPUT", i, idx, 0);
                              }}>
                              <input
                                className="w-full h-full text-left focus:outline-none"
                                readOnly={true}
                                value={
                                  grid1Dt?.[v["USER_SID"]]?.[idx + 1]?.[0]?.[
                                    "WORK_NAME"
                                  ] || ""
                                }
                              />
                              <div className="rounded-full iconSize cursor-pointer hover:bg-gray-200 p-[1%]">
                                {opcodCss.mainIdx === i &&
                                opcodCss.subIdx === idx ? (
                                  <IoIosArrowUp className="text-gray-500" />
                                ) : (
                                  <IoIosArrowDown className="text-gray-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                    <div
                      style={{
                        position: "sticky",
                        right: "320px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="flex items-center h-full border-l-2 border-slate-400 px-[0.5%]">
                      <div className="mainInput">
                        <CommonInput
                          id={`approve${i}`}
                          value={v["APPROVE_COUNT"]}
                          read={true}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        position: "sticky",
                        right: "240px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="flex items-center justify-center h-full">
                      <div
                        className="mainInput w-[80%]"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}>
                        <CommonInput
                          id={`time${i}`}
                          value={v["TIME_COUNT"]}
                          read={true}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        position: "sticky",
                        right: "180px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="flex items-center h-full">
                      <div className="mainInput">
                        <CommonInput
                          id={`holiday${i}`}
                          value={v["HOLIDAY"]}
                          read={true}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        position: "sticky",
                        right: "120px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="flex items-center h-full">
                      <div className="mainInput">
                        <CommonInput
                          id={`holiMinus${i}`}
                          value={v["HOLIDAY_USE"] || "0"}
                          read={true}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        position: "sticky",
                        right: "60px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="flex items-center h-full">
                      <div className="mainInput">
                        <CommonInput
                          id={`USE_ANN${i}`}
                          read={true}
                          value={v["ANN_DAY"] || "0"}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        position: "sticky",
                        right: "0px",
                        backgroundColor: i % 2 === 0 ? "#EEF3F8" : "#D6E6F0",
                      }}
                      className="flex items-center h-full"></div>
                  </div>
                ))}
            </div>
            {/* 푸터 */}
            <div
              className="sticky bottom-0 z-30 h-[2rem] flex min-w-max"
              style={{
                background: "#E4E4E4",
              }}>
              <div
                className="grid items-center"
                style={{
                  gridTemplateColumns: `50px 50px 140px repeat(${dayLength},80px) 45px 80px 60px 60px 60px 60px`,
                  width: "max-content",
                  minWidth: "100%",
                }}>
                <div
                  style={{
                    position: "sticky",
                    left: "0px",
                  }}
                  className="flex items-center h-full"
                />
                <div
                  style={{
                    position: "sticky",
                    left: "50px",
                  }}
                  className="flex items-center h-full"
                />
                <div
                  style={{
                    position: "sticky",
                    left: "100px",
                  }}
                  className="flex items-center h-full">
                  {Object.keys(grid1).length}
                </div>
              </div>
            </div>
          </div>
        </CommonContainer>
        {opcodCss.x !== 0 &&
          opcodCss.y !== 0 &&
          createPortal(
            <div
              className={`fixed z-[999] bg-white w-fit duration-300 ${opcodCss.yPos === "TOP" ? "origin-bottom" : "origin-top"} ${opcodOpen ? " scale-y-100" : "scale-y-0"}`}
              style={{ top: opcodCss.y, left: opcodCss.x }}
              ref={opcodTbRef}>
              <TableCust2
                body={copOpcod}
                header={commonHeader5}
                height="300px"
                onClick={async (v) => {
                  setGrid1Dt((prev) => {
                    const userSid = grid1[opcodCss.mainIdx]["USER_SID"];
                    const day = opcodCss.subIdx + 1;

                    const currentRows = prev?.[userSid]?.[day] ?? [];

                    let newRows = [...currentRows];

                    if (newRows.length > 0) {
                      // 👉 0번만 수정
                      newRows[opcodCss.seq] = {
                        ...newRows[opcodCss.seq],
                        WORK_TYPE_CODE: v?.["CODE_CODE"] || "",
                        WORK_NAME: v?.["VALUE5_CHAR"] || "",
                      };
                    } else {
                      // 👉 없으면 새로 생성
                      newRows = [
                        {
                          SEQ: opcodCss.seq,
                          WORK_TYPE_CODE: v?.["CODE_CODE"] || "",
                          ADD_WORK_HOUR: 0,
                          APPROVE_FLAG: "",
                          WORK_NAME: v?.["VALUE5_CHAR"] || "",
                        },
                      ];
                    }

                    return {
                      ...prev,
                      [userSid]: {
                        ...prev[userSid],
                        [day]: newRows,
                      },
                    };
                  });

                  setChangeGrid1Dt((prev) => {
                    const userSid = grid1[opcodCss.mainIdx]["USER_ID"];
                    const day = opcodCss.subIdx + 1;

                    const currentRows = prev?.[userSid]?.[day] ?? [];

                    let newRows = [...currentRows];

                    if (newRows.length > 0) {
                      // 👉 0번만 수정
                      newRows[opcodCss.seq] = {
                        ...newRows[opcodCss.seq],
                        WORK_TYPE_CODE: v?.["CODE_CODE"] || "",
                        WORK_NAME: v?.["VALUE5_CHAR"] || "",
                      };
                    } else {
                      // 👉 없으면 새로 생성
                      newRows = [
                        {
                          SEQ: opcodCss.seq,
                          WORK_TYPE_CODE: v?.["CODE_CODE"] || "",
                          ADD_WORK_HOUR: 0,
                          APPROVE_FLAG: "",
                          WORK_NAME: v?.["VALUE5_CHAR"] || "",
                        },
                      ];
                    }

                    return {
                      ...prev,
                      [userSid]: {
                        ...prev[userSid],
                        [day]: newRows,
                      },
                    };
                  });

                  setOpcodCss({
                    mainIdx: -1,
                    subIdx: -1,
                    x: 0,
                    y: 0,
                    xPos: "LEFT",
                    yPos: "BOT",
                    seq: -1,
                  });
                  return true;
                }}
                width="350px"
                filterFlag="CODE_NAME;VALUE2_CHAR;VALUE3_CHAR"
              />
            </div>,
            document.body,
          )}
        {detail.x !== 0 &&
          detail.y !== 0 &&
          createPortal(
            <div
              className={`fixed z-[999] bg-white w-fit duration-300 ${detail.yPos === "TOP" ? "origin-bottom" : "origin-top"} ${detailOpen ? " scale-y-100" : "scale-y-0"}`}
              style={{ top: detail.y, left: detail.x }}
              ref={detailTbRef}>
              <CommonContainer title="세부사항" width="100%">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div />
                  <div className="mainInput">
                    <CommonInput
                      id="detailWork"
                      label="다음 근무"
                      value={detail.row?.[1]?.["WORK_NAME"] || ""}
                      read={true}
                    />
                  </div>
                  <div className="mainInput">
                    <CommonInput
                      id="detailOt"
                      label="현재 OT"
                      value={detail.row?.[0]?.["ADD_WORK_HOUR"] || "0"}
                      read={true}
                    />
                  </div>
                  <div className="mainInput">
                    <CommonInput
                      id="detailOt2"
                      label="다음 OT"
                      value={detail.row?.[1]?.["ADD_WORK_HOUR"] || "0"}
                      read={true}
                    />
                  </div>
                  <div className="mainInput">
                    <CommonInput
                      id="detailTrm"
                      label="현재 임시 터미널"
                      value={detail.row?.[0]?.["WORK_TERMINAL_CODE"] || ""}
                      read={true}
                    />
                  </div>
                  <div className="mainInput">
                    <CommonInput
                      id="detailTrm2"
                      label="다음 임시 터미널"
                      value={detail.row?.[1]?.["WORK_TERMINAL_CODE"] || ""}
                      read={true}
                    />
                  </div>
                  <div className="mainInput">
                    <CommonInput
                      id="detailTime"
                      label="현재 시간 외"
                      value={
                        (detail.row?.[0]?.["REQ_START_TIME"] || "0000") +
                        " ~ " +
                        (detail.row?.[0]?.["REQ_END_TIME"] || "0000")
                      }
                      read={true}
                    />
                  </div>
                  <div className="mainInput">
                    <CommonInput
                      id="detailTime2"
                      label="다음 시간 외"
                      value={
                        (detail.row?.[1]?.["REQ_START_TIME"] || "0000") +
                        " ~ " +
                        (detail.row?.[1]?.["REQ_END_TIME"] || "0000")
                      }
                      read={true}
                    />
                  </div>
                </div>
              </CommonContainer>
            </div>,
            document.body,
          )}
        <input
          id="excelFile"
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setWorkM010_013(e)}
          className="hidden"
        />
      </div>
    );
  },
);

export default WorkMgm;
