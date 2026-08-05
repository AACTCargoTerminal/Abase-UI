import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  DefInfraComp,
  MenuBtnDataType,
  PageHandle,
  TableHandle,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";
import { CommonContainer, CommonTab } from "../../comp/Container";
import {
  base64ToPdfUrl,
  getApi,
  getClass,
  openModal,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { TableCust2 } from "../../comp/Table";
import {
  CommonDatePicker,
  CommonDropDown,
  CommonMonthDatePicker,
} from "../../comp/DropDown";
import { commonHeader2, commonHeader5 } from "../../Util/Header";
import dayjs from "dayjs";
import { CommonChk, CommonInput } from "../../comp/Input";
import { Btn, MenuBtn } from "../../comp/Btn";
import { confirmAsync } from "../../confirmService";

const TABS = ["요청", "확정 전 리스트", "검토 리스트"];
const BTN_ARRAY: MenuBtnDataType[] = [
  { KEY: "A", VALUE: "스케줄( 예정 )" },
  { KEY: "B", VALUE: "스케줄( 확정 )" },
  { KEY: "C", VALUE: "시간외근무 신청서 ( 일별 )" },
  { KEY: "F", VALUE: "시간외근무 신청서 ( 월별 )" },
  { KEY: "D", VALUE: "시간외근무 세부내역" },
];

type ReqHandle = {
  search: ({ userNameP }: { userNameP: string }) => void;
};

type SetProp = {
  hrreq: TableRow[];
  pgmId: string;
  deptCode: string;
  terminalCode: string;
  toDate: string;
  fromDate: string;
  date: string;
  dateFlag: boolean;
  userName: string;
};

const getOPCOD = async (pgmId: string): Promise<TableRow[]> => {
  return await getClass("OPCOD", pgmId);
};
const OPCOD_BODY: TableRow[] = await getOPCOD("pgmId");

const WorkHrMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId }, ref) => {
    const [tabSelect, setTabSelect] = useState(0);
    const [dateChk, setDateChk] = useState(true);
    const [hrreq, setHrreq] = useState<TableRow[]>([]);
    const [hrpat, setHrpat] = useState<TableRow[]>([]);
    const [hrpatSelect, setHrpatSelect] = useState("");
    const [trmcd, setTrmcd] = useState<TableRow[]>([]);
    const [trmcdSelect, setTrmcdSelect] = useState("");
    const [startDate, setStartDate] = useState(
      dayjs().startOf("month").format("YYYYMMDD"),
    );
    const [endDate, setEndDate] = useState(dayjs().format("YYYYMMDD"));
    const [date, setDate] = useState(dayjs().format("YYYYMM"));
    const [userName, setUserName] = useState("");

    const reqRef = useRef<ReqHandle>(null);
    const beforeRef = useRef<ReqHandle>(null);
    const apprRef = useRef<ReqHandle>(null);

    useImperativeHandle(ref, () => ({
      onModalPayload(payload: TableRow) {
        if (payload?.["SAVE"]) {
          searchClick({});
        }
      },
    }));

    useEffect(() => {
      getClass("HRREQ", pgmId)
        .then((v) => setHrreq(v))
        .catch((r) => setHrreq([]));
      getClass("HRPAT", pgmId, true)
        .then((v) => setHrpat(v))
        .catch((r) => setHrpat([]));
      getClass("TRMCD", pgmId, true)
        .then((v) => setTrmcd(v))
        .catch((r) => setTrmcd([]));
    }, []);

    useEffect(() => {
      searchClick({ num: tabSelect });
    }, [tabSelect]);

    const searchClick = useCallback(
      ({ num, userNameP }: { num?: number; userNameP?: string }) => {
        var tmpTabSelect = num ?? tabSelect;
        var tmpUserName = userNameP ?? userName;
        if (tmpTabSelect === 0) {
          reqRef.current?.search({ userNameP: tmpUserName });
        } else if (tmpTabSelect === 1) {
          beforeRef.current?.search({ userNameP: tmpUserName });
        } else if (tmpTabSelect === 2) {
          apprRef.current?.search({ userNameP: tmpUserName });
        }
      },
      [tabSelect, hrpatSelect, trmcdSelect, startDate, endDate, userName],
    );

    const getExcel = useCallback(
      async (flag: string) => {
        const ret = await getApi<string>({
          baseUrl: "INFRA",
          method: "GET",
          url: `/work/getWorkSch?teamCode=${hrpatSelect}&terminalCode=${trmcdSelect}&toDate=${dateChk ? startDate : ""}&fromDate=${dateChk ? endDate : ""}&date=${!dateChk ? date : ""}&type=${flag}`,
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
            if (flag === "Y") {
              a.download = `${dayjs().format("YYYY_MM_DD")}스케줄확정.xlsx`;
            } else {
              a.download = `${dayjs().format("YYYY_MM_DD")}스케줄예정.xlsx`;
            }

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);
          }
        }
      },
      [hrpatSelect, trmcdSelect, startDate, endDate, dateChk, date],
    );

    const getTimeExcel = useCallback(
      async (flag: "DAY" | "MON") => {
        if (flag === "MON") {
          if (dateChk || !userName) {
            sendErr("월별 신청서는 월 설정 , 이름이 필수입니다.");
            return;
          }
        } else {
          if (!dateChk) {
            sendErr("일별 신청서는 기간 설정이 필수입니다.");
            return;
          }
        }
        const params = new URLSearchParams({
          teamCode: hrpatSelect ?? "",
          terminalCode: trmcdSelect ?? "",
          toDate: dateChk ? startDate : "",
          fromDate: dateChk ? endDate : "",
          date: !dateChk ? date : "",
          userName: userName ?? "",
        });

        const ret = await getApi<string>({
          baseUrl: "INFRA",
          method: "GET",
          url: `/work/getWorkTime?${params.toString()}`,
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
            if (flag === "DAY") {
              a.download = `${dayjs().format("YYYY_MM_DD")}시간외근무(일별).xlsx`;
            } else {
              a.download = `${dayjs().format("YYYY_MM_DD")}시간외근무(월별).xlsx`;
            }

            document.body.appendChild(a);

            a.click();

            a.remove();

            window.URL.revokeObjectURL(url);
          }
        }
      },
      [hrpatSelect, trmcdSelect, startDate, endDate, userName, dateChk, date],
    );

    const getDetailExcel = useCallback(async () => {
      const ret = await getApi<string>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getWorkDetail?teamCode=${hrpatSelect}&terminalCode=${trmcdSelect}&toDate=${dateChk ? startDate : ""}&fromDate=${dateChk ? endDate : ""}&date=${!dateChk ? date : ""}`,
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
          a.download = `${dayjs().format("YYYY_MM_DD")}세부내역.xlsx`;

          document.body.appendChild(a);

          a.click();

          a.remove();

          window.URL.revokeObjectURL(url);
        }
      }
    }, [hrpatSelect, trmcdSelect, startDate, endDate, date, dateChk]);

    return (
      <div className="pr-[0.5%] flex flex-col gap-3">
        <div className="grid grid-cols-[0.45fr_0.25fr_0.13fr] gap-x-3">
          <CommonContainer title="설정">
            <div className="grid grid-cols-[0.25fr_0.25fr_0.25fr_0.1fr_0.15fr] gap-x-3">
              {" "}
              <div className="mainInput">
                {" "}
                <CommonDropDown
                  onClick={(r) => {
                    setHrpatSelect(r?.["CODE_CODE"] || "");
                  }}
                  data={hrpat}
                  dropHeight="15rem"
                  header={commonHeader2}
                  id="hrpat"
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: hrpatSelect,
                  }}
                  title="부서"
                  labelW="25%"
                  find={true}
                />
              </div>
              <div className="mainInput">
                {" "}
                <CommonDropDown
                  onClick={(r) => {
                    setTrmcdSelect(r?.["CODE_CODE"] || "");
                  }}
                  data={trmcd}
                  dropHeight="15rem"
                  header={commonHeader2}
                  id="trmcd"
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: trmcdSelect,
                  }}
                  title="터미널"
                  labelW="25%"
                />
              </div>
              <CommonInput
                id="userName"
                value={userName}
                onChange={(v) => {
                  searchClick({ num: tabSelect, userNameP: v });
                  setUserName(v);
                }}
                label="이름"
                labelW="30%"
              />
              <Btn
                txt="조회"
                type="SEARCH"
                onClick={() => {
                  searchClick({ num: tabSelect });
                }}
              />
              <MenuBtn
                data={BTN_ARRAY}
                txt="Excel"
                type="EXCEL"
                onClick={(v) => {
                  if (v === "A") {
                    getExcel("N");
                  } else if (v === "B") {
                    getExcel("Y");
                  } else if (v === "C") {
                    getTimeExcel("DAY");
                  } else if (v === "D") {
                    getDetailExcel();
                  } else if (v === "F") {
                    getTimeExcel("MON");
                  }
                }}
              />
            </div>
          </CommonContainer>
          <CommonContainer
            title="기간 설정"
            childrenTitle={
              <div>
                <CommonChk
                  id="chk1"
                  value={dateChk}
                  onChange={(v) => {
                    setDateChk(v);
                  }}
                />
              </div>
            }>
            <div className="flex items-center mainInput">
              <div className="mainInput">
                <CommonDatePicker
                  id="start"
                  onClick={(v) => {
                    setDateChk(true);
                    setStartDate(v);
                  }}
                  value={startDate}
                />
              </div>
              -
              <div className="mainInput">
                <CommonDatePicker
                  id="end"
                  onClick={(v) => {
                    setDateChk(true);
                    setEndDate(v);
                  }}
                  value={endDate}
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer
            title="월 설정"
            childrenTitle={
              <div>
                <CommonChk
                  id="chk2"
                  value={!dateChk}
                  onChange={(v) => {
                    setDateChk(!v);
                  }}
                />
              </div>
            }>
            <div className="mainInput">
              <CommonMonthDatePicker
                id="date"
                onClick={(v) => {
                  setDateChk(false);
                  setDate(v);
                }}
                value={date}
              />
            </div>
          </CommonContainer>
        </div>
        <CommonTab
          tabs={TABS}
          active={tabSelect}
          setActive={(v) => setTabSelect(v)}>
          <ReqList
            hrreq={hrreq}
            pgmId={pgmId}
            ref={reqRef}
            deptCode={hrpatSelect}
            fromDate={endDate}
            terminalCode={trmcdSelect}
            toDate={startDate}
            userName={userName}
            date={date}
            dateFlag={dateChk}
          />
          <BeforeList
            hrreq={hrreq}
            pgmId={pgmId}
            ref={beforeRef}
            deptCode={hrpatSelect}
            fromDate={endDate}
            terminalCode={trmcdSelect}
            toDate={startDate}
            userName={userName}
            date={date}
            dateFlag={dateChk}
          />
          <ApproveList
            hrreq={hrreq}
            pgmId={pgmId}
            ref={apprRef}
            deptCode={hrpatSelect}
            fromDate={endDate}
            terminalCode={trmcdSelect}
            toDate={startDate}
            userName={userName}
            date={date}
            dateFlag={dateChk}
          />
        </CommonTab>
      </div>
    );
  },
);

export default WorkHrMgm;

const GRID1_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "2rem" },
  { key: "REQ_DATE", value: "날짜", w: "6rem", sum: 0 },
  { key: "REQ_NAME", value: "요청명", w: "8rem" },
  { key: "DEPT_NAME", value: "파트명", w: "8rem" },
  { key: "TERMINAL_NAME", value: "터미널", w: "4rem" },
  { key: "USER_NAME", value: "이름", w: "5rem" },
  { key: "SEQ", value: "순번", w: "2rem" },
];

const GRID2_HEADER: TableHeaderType[] = [
  {
    key: "WORK_TYPE_CODE",
    value: "코드",
    w: "6rem",
    option: {
      type: "DROPDOWN",
      body: OPCOD_BODY,
      header: commonHeader5,
      inputKey: { key: "CODE_CODE", showKey: "0" },
      find: true,
    },
  },
  { key: "WORK_TYPE_NAME", value: "코드명", w: "8rem" },
  {
    key: "ADD_WORK_HOUR",
    value: "OT",
    w: "6rem",
    type: "DOUBLE",
    option: { type: "WRITE", ext: 1 },
  },
  { key: "APPROVE_NAME", value: "확정자", w: "6rem" },
  { key: "APPROVE_TIME", value: "확정시간", w: "6rem" },
];

const GRID3_HEADER: TableHeaderType[] = [
  { key: "CAPS_START_TIME", value: "캡스시작", w: "6rem" },
  { key: "CAPS_END_TIME", value: "캡스종료", w: "6rem" },
  {
    key: "REQ_START_TIME",
    value: "요청시작",
    w: "6rem",
    option: { type: "WRITE" },
  },
  {
    key: "REQ_END_TIME",
    value: "요청종료",
    w: "6rem",
    option: { type: "WRITE" },
  },
  {
    key: "ADD_WORK_HOUR",
    value: "연장근무",
    w: "4rem",
  },
  { key: "NIGHT_WORK_HOUR", value: "야간근무", w: "4rem" },
  { key: "HOLIDAY_WORK_HOUR", value: "휴일근무", w: "4rem" },
  { key: "HOLIDAY_ADD_HOUR", value: "휴일연장", w: "4rem" },
  { key: "REMARK", value: "사유", w: "13rem" },
  { key: "APPROVE_NAME", value: "확정자", w: "6rem" },
  { key: "APPROVE_TIME", value: "확정시간", w: "6rem" },
];

const GRID4_HEADER: TableHeaderType[] = [
  { key: "LOG_SEQ", value: "순번", w: "3rem" },
  { key: "REQ_FLAG_NAME", value: "상태명", w: "8rem", sum: 0 },
  { key: "WORK_TYPE_NAME", value: "코드명", w: "6rem" },
  { key: "REQ_START_TIME", value: "요청시작", w: "4rem" },
  { key: "REQ_END_TIME", value: "요청종료", w: "4rem" },
  { key: "ADD_WORK_HOUR", value: "연장근무", w: "4rem" },
  { key: "NIGHT_WORK_HOUR", value: "야간근무", w: "4rem" },
  {
    key: "HOLIDAY_WORK_HOUR",
    value: "휴일근무",
    w: "4rem",
  },
  { key: "HOLIDAY_ADD_HOUR", value: "휴일연장", w: "4rem" },
  { key: "REMARK", value: "사유", w: "10rem" },
  { key: "TERMINAL_CODE", value: "터미널", w: "4rem" },
  { key: "TMP_TERMINAL_CODE", value: "임시터미널", w: "4rem" },
  { key: "TEAM_CODE", value: "부서", w: "6rem" },
  { key: "USABLE_FLAG", value: "사용유무", w: "4rem" },
  { key: "CREATED_NAME", value: "생성자", w: "4rem" },
  { key: "CREATED_TIME", value: "생성시간", w: "6rem" },
];

const searchClick = async ({
  type,
  reqFlag,
  deptCode,
  terminalCode,
  toDate,
  fromDate,
  date,
  dateFlag,
  userName,
  otFlag,
  pgmId,
}: {
  type: string;
  reqFlag?: string;
  deptCode?: string;
  terminalCode?: string;
  toDate: string;
  fromDate: string;
  date: string;
  dateFlag: boolean;
  userName?: string;
  otFlag?: string;
  pgmId: string;
}): Promise<TableRow[]> => {
  const map = new Map<string, any>();
  map.set("type", type);
  map.set("reqFlag", reqFlag || "");
  map.set("deptCode", deptCode || "");
  map.set("terminalCode", terminalCode || "");
  map.set("toDate", dateFlag ? toDate : "");
  map.set("fromDate", dateFlag ? fromDate : "");
  map.set("date", !dateFlag ? date : "");
  map.set("userName", userName || "");
  map.set("otFlag", otFlag || "N");

  const ret = await getApi<Record<number, TableRow[]>>({
    baseUrl: "INFRA",
    method: "POST",
    url: `/work/getWorkM010_006`,
    pgmId: pgmId,
    sucFlag: true,
    params: map,
  });

  if (ret.ok) {
    if (ret.data?.[0]) {
      return ret.data[0];
    }
  }

  return [];
};

const ReqList = forwardRef<ReqHandle, SetProp>(
  (
    {
      hrreq,
      pgmId,
      deptCode,
      fromDate,
      terminalCode,
      toDate,
      userName,
      date,
      dateFlag,
    },
    ref,
  ) => {
    const [hrreqHr, setHrreqHr] = useState<TableRow[]>([]);
    const [hrreqHrSelect, setHrreqHrSelect] = useState("");

    useEffect(() => {
      const tmp = hrreq.filter((v) => v?.["VALUE2_CHAR"] === "Y");
      setHrreqHr([{ CODE_CODE: "", CODE_NAME: "-" }, ...tmp]);
    }, [hrreq]);

    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const [grid1Select, setGrid1Select] = useState<TableRow>({});

    const [grid2, setGrid2] = useState<TableRow[]>([]);
    const [grid3, setGrid3] = useState<TableRow[]>([]);
    const [grid4, setGrid4] = useState<TableRow[]>([]);

    const grid1Ref = useRef<TableHandle>(null);
    const grid2Ref = useRef<TableHandle>(null);
    const grid3Ref = useRef<TableHandle>(null);

    useImperativeHandle(ref, () => ({
      search({ userNameP }) {
        searchClick({
          type: "REQ",
          pgmId: pgmId,
          fromDate: fromDate,
          toDate: toDate,
          deptCode: deptCode,
          reqFlag: hrreqHrSelect,
          terminalCode: terminalCode,
          userName: userNameP,
          date: date,
          dateFlag: dateFlag,
        })
          .then((v) => setGrid1(v))
          .catch((v) => setGrid1([]));
      },
    }));

    useEffect(() => {
      gridClear();
      if (Object.keys(grid1Select).length > 0) {
        detailClick();
      }
    }, [grid1Select]);

    const detailClick = useCallback(async () => {
      const yyyy = grid1Select?.["YEAR"] || "";
      const mon = grid1Select?.["MON"] || "";
      const rawDay = grid1Select?.["DAY"];
      const day = rawDay ? String(rawDay).padStart(2, "0") : "";
      const userSid = grid1Select?.["USER_SID"] || "0";
      const seq = grid1Select?.["SEQ"] || "0";

      if (!yyyy || !mon || !day || !userSid || !seq) {
        sendErr("선택한 행이 없습니다.");
        return;
      }

      const ret = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getWorkM010_007?date=${yyyy + mon + day}&userSid=${userSid}&seq=${seq}`,
        pgmId: pgmId,
        sucFlag: true,
      });

      if (ret.ok) {
        if (ret.data?.[0]) {
          setGrid2(ret.data[0]);
        }

        if (ret.data?.[1]) {
          setGrid3(ret.data[1]);
        }
        if (ret.data?.[2]) {
          setGrid4(ret.data[2]);
        }
      }
    }, [grid1Select]);

    function gridClear() {
      setGrid2([]);
      setGrid3([]);
      setGrid4([]);
    }

    const reqClick = useCallback(
      async (reqFlag: string) => {
        const tmp = grid1Ref?.current?.getChk();
        if (tmp && Object.keys(tmp).length > 0) {
          const reqArray: TableRow[] = Object.values(tmp).filter(
            (v) => v?.["CHK"] === true,
          );
          if (reqArray.length === 0) {
            sendErr("선택한 항목이 없습니다.");
            return;
          }
          sendLoading(true);
          const map = new Map<string, any>();
          map.set("reqArray", reqArray);
          map.set("reqFlag", reqFlag);
          const ret = await getApi<Record<number, TableRow[]>>({
            baseUrl: "INFRA",
            method: "POST",
            url: `/work/setWorkM010_034`,
            pgmId: pgmId,
            params: map,
            sucFlag: true,
          });
          sendLoading(false);
          if (ret.ok) {
            searchClick({
              type: "REQ",
              pgmId: pgmId,
              fromDate: fromDate,
              toDate: toDate,
              deptCode: deptCode,
              reqFlag: hrreqHrSelect,
              terminalCode: terminalCode,
              userName: userName,
              date: date,
              dateFlag: dateFlag,
            })
              .then((v) => setGrid1(v))
              .catch((v) => setGrid1([]));
          }
        } else {
          sendErr("선택한 항목이 없습니다.");
          return;
        }
      },
      [
        grid1Ref?.current,
        hrreqHrSelect,
        fromDate,
        toDate,
        deptCode,
        terminalCode,
        userName,
        date,
        dateFlag,
      ],
    );

    return (
      <div className="grid grid-cols-[36%_64%] grid-rows-[10rem_10rem_1fr] gap-2">
        <div className="row-span-3">
          <CommonContainer
            title="요청리스트"
            childrenTitle={
              <div className="flex items-center gap-3">
                <div className="mainInput w-[45%]">
                  <CommonDropDown
                    onClick={(r) => {
                      setHrreqHrSelect(r?.["CODE_CODE"] || "");
                      searchClick({
                        type: "REQ",
                        pgmId: pgmId,
                        fromDate: fromDate,
                        toDate: toDate,
                        deptCode: deptCode,
                        reqFlag: r?.["CODE_CODE"] || "",
                        terminalCode: terminalCode,
                        userName: userName,
                        date: date,
                        dateFlag: dateFlag,
                      })
                        .then((v) => setGrid1(v))
                        .catch((v) => setGrid1([]));
                    }}
                    data={hrreqHr}
                    dropHeight="10rem"
                    header={commonHeader2}
                    id="hrreqHr"
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0",
                      value: hrreqHrSelect,
                    }}
                    title="필터"
                    labelW="20%"
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="거절"
                    type="DELETE"
                    onClick={() => {
                      if (!grid1Select?.["USER_SID"]) {
                        sendErr("선택한행이 없습니다.");
                        return;
                      }
                      openModal({
                        array: [
                          {
                            id: "WORK_HR_REQ_DENY",
                            name: "거절",
                            param: {
                              YEAR: grid1Select?.["YEAR"] || "",
                              MON: grid1Select?.["MON"] || "",
                              DAY: grid1Select?.["DAY"] || "",
                              USER_SID: grid1Select?.["USER_SID"] || "",
                              SEQ: grid1Select?.["SEQ"],
                              USER_ID: grid1Select?.["USER_ID"] || "",
                              USER_NAME: grid1Select?.["USER_NAME"] || "",
                              REQ_DATE: grid1Select?.["REQ_DATE"] || "",
                            },
                          },
                        ],
                      });
                    }}
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="수락"
                    type="SAVE"
                    onClick={() => {
                      reqClick("Y");
                    }}
                  />
                </div>
                {/* <div className="mainInput">
                  <Btn
                    txt="확정"
                    type="NONE"
                    onClick={async () => {
                      const ret = await confirmAsync({
                        title: "확정재확인",
                        message:
                          "확정을 누르면 스케줄 및 OT가 일괄 확정됩니다.",
                      });
                      if (ret) {
                        reqClick("A");
                      }
                    }}
                  />
                </div> */}
              </div>
            }>
            <TableCust2
              body={grid1}
              header={GRID1_HEADER}
              height="34rem"
              width="100%"
              onClick={async (r) => {
                setGrid1Select(r);
                return false;
              }}
              ref={grid1Ref}
              batch={true}
            />
          </CommonContainer>
        </div>
        <CommonContainer title="스케줄 정보">
          <TableCust2
            body={grid2}
            header={GRID2_HEADER}
            height="5rem"
            width="100%"
            batch={true}
            ref={grid2Ref}
          />
        </CommonContainer>
        <CommonContainer title="OT 정보">
          {" "}
          <TableCust2
            body={grid3}
            header={GRID3_HEADER}
            height="5rem"
            width="100%"
            batch={true}
            ref={grid3Ref}
          />
        </CommonContainer>
        <CommonContainer title="LOG">
          <TableCust2
            body={grid4}
            header={GRID4_HEADER}
            height="13rem"
            width="100%%"
          />
        </CommonContainer>
      </div>
    );
  },
);

const GRID1_BEFORE_HEADER: TableHeaderType[] = [
  { key: "REQ_DATE", value: "날짜", w: "6rem", sum: 0 },
  { key: "REQ_NAME", value: "상태", w: "8rem" },
  { key: "DEPT_NAME", value: "파트명", w: "8rem" },
  { key: "TERMINAL_NAME", value: "터미널", w: "4rem" },
  { key: "USER_NAME", value: "이름", w: "5rem" },
  { key: "SEQ", value: "순번", w: "2rem" },
];

const GRID1_APPR_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "2rem" },
  { key: "REQ_DATE", value: "날짜", w: "6rem", sum: 0 },
  { key: "REQ_NAME", value: "상태", w: "8rem" },
  { key: "DEPT_NAME", value: "파트명", w: "8rem" },
  { key: "TERMINAL_NAME", value: "터미널", w: "4rem" },
  { key: "USER_NAME", value: "이름", w: "5rem" },
  { key: "SEQ", value: "순번", w: "2rem" },
  { key: "WORK_TYPE_NAME", value: "스케줄", w: "7rem" },
  { key: "REQ_START_TIME", value: "요청시작", w: "5rem" },
  { key: "REQ_END_TIME", value: "요청종료", w: "5rem" },
  { key: "CAPS_START_TIME", value: "캡스시작", w: "5rem" },
  { key: "CAPS_END_TIME", value: "캡스종료", w: "5rem" },
  {
    key: "ADD_WORK_HOUR",
    value: "연장근무",
    w: "4rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "NIGHT_WORK_HOUR",
    value: "야간근무",
    w: "4rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "HOLIDAY_WORK_HOUR",
    value: "휴일근무",
    w: "4rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "HOLIDAY_ADD_HOUR",
    value: "휴일연장",
    w: "4rem",
    sum: 1,
    type: "DOUBLE",
  },
  { key: "IMG_FLAG", value: "서류유무", w: "4rem" },
  { key: "REMARK", value: "사유", w: "15rem" },
  { key: "APPROVE_NAME", value: "승인자", w: "5rem" },
];

const BeforeList = forwardRef<ReqHandle, SetProp>(
  (
    {
      hrreq,
      pgmId,
      deptCode,
      fromDate,
      terminalCode,
      toDate,
      userName,
      date,
      dateFlag,
    },
    ref,
  ) => {
    const [hrreqHr, setHrreqHr] = useState<TableRow[]>([]);
    const [hrreqHrSelect, setHrreqHrSelect] = useState("");

    useEffect(() => {
      const tmp = hrreq.filter((v) => v?.["VALUE3_CHAR"] === "Y");
      setHrreqHr([{ CODE_CODE: "", CODE_NAME: "-" }, ...tmp]);
    }, [hrreq]);

    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const [grid1Select, setGrid1Select] = useState<TableRow>({});

    const [grid2, setGrid2] = useState<TableRow[]>([]);
    const [grid3, setGrid3] = useState<TableRow[]>([]);
    const [grid4, setGrid4] = useState<TableRow[]>([]);

    const [grid3Select, setGrid3Select] = useState({});

    useImperativeHandle(ref, () => ({
      search({ userNameP }) {
        searchClick({
          type: "BEFORE",
          pgmId: pgmId,
          fromDate: fromDate,
          toDate: toDate,
          deptCode: deptCode,
          reqFlag: hrreqHrSelect,
          terminalCode: terminalCode,
          userName: userNameP,
          date: date,
          dateFlag: dateFlag,
        })
          .then((v) => {
            setGrid1(v);
            gridClear();
            if (Object.keys(grid1Select).length > 0) {
              detailClick();
            }
          })
          .catch((v) => setGrid1([]));
      },
    }));

    useEffect(() => {
      gridClear();
      if (Object.keys(grid1Select).length > 0) {
        detailClick();
      }
    }, [grid1Select]);

    const detailClick = useCallback(async () => {
      const yyyy = grid1Select?.["YEAR"] || "";
      const mon = grid1Select?.["MON"] || "";
      const rawDay = grid1Select?.["DAY"];
      const day = rawDay ? String(rawDay).padStart(2, "0") : "";
      const userSid = grid1Select?.["USER_SID"] || "0";
      const seq = grid1Select?.["SEQ"] || "0";

      if (!yyyy || !mon || !day || !userSid || !seq) {
        sendErr("선택한 행이 없습니다.");
        return;
      }

      const ret = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getWorkM010_007?date=${yyyy + mon + day}&userSid=${userSid}&seq=${seq}`,
        pgmId: pgmId,
      });

      if (ret.ok) {
        if (ret.data?.[0]) {
          setGrid2(ret.data[0]);
        }

        if (ret.data?.[1]) {
          setGrid3(ret.data[1]);
        }
        if (ret.data?.[2]) {
          setGrid4(ret.data[2]);
        }
      }
    }, [grid1Select]);

    const otInsert = useCallback(() => {
      if (Object.keys(grid1Select).length === 0) {
        sendErr("리스트를 선택해주세요.");
        return;
      }
      const tmpUserSid = grid1Select?.["USER_SID"] || 0;
      const tmpDate = String(grid1Select?.["REQ_DATE"] || "").replaceAll(
        "-",
        "",
      );
      const tmpSeq = grid1Select?.["SEQ"] || 0;

      if (tmpUserSid === 0) {
        sendErr("선택한 사용자가 없습니다.");
        return;
      }

      openModal({
        array: [
          {
            id: "WORK_TIME_ADM_INS",
            name: "관리자용 신청서",
            param: {
              date: tmpDate,
              userSid: tmpUserSid,
              seq: tmpSeq,
            },
          },
        ],
      });
    }, [grid1Select, grid3Select]);

    const otDelete = useCallback(async () => {
      if (Object.keys(grid1Select).length === 0) {
        sendErr("리스트를 선택한 항목이 없습니다.");
        return;
      }

      const map = new Map<string, any>();
      map.set("DEL", [
        {
          date: String(grid1Select["REQ_DATE"]).replaceAll("-", ""),
          SEQ: grid1Select["SEQ"],
          USER_SID: grid1Select["USER_SID"],
        },
      ]);
      sendLoading(true);

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_022?adminFlag=Y`,
        params: map,
        pgmId: pgmId,
        sucFlag: true,
      });

      sendLoading(false);
      if (res.ok) {
        searchClick({
          type: "BEFORE",
          pgmId: pgmId,
          fromDate: fromDate,
          toDate: toDate,
          deptCode: deptCode,
          reqFlag: hrreqHrSelect,
          terminalCode: terminalCode,
          userName: userName,
          date: date,
          dateFlag: dateFlag,
        })
          .then((v) => {
            setGrid1(v);
            gridClear();
            if (Object.keys(grid1Select).length > 0) {
              detailClick();
            }
          })
          .catch((v) => setGrid1([]));
      }
    }, [
      grid3Select,
      grid1Select,
      fromDate,
      toDate,
      deptCode,
      terminalCode,
      userName,
      date,
      dateFlag,
    ]);

    function gridClear() {
      setGrid2([]);
      setGrid3([]);
      setGrid4([]);
    }

    return (
      <div className="grid grid-cols-[36%_64%] grid-rows-[10rem_10rem_1fr] gap-2">
        <div className="row-span-3">
          <CommonContainer
            title="확정 전 리스트"
            childrenTitle={
              <div className="flex items-center w-[50%]">
                <div className="mainInput">
                  <CommonDropDown
                    onClick={(r) => {
                      setHrreqHrSelect(r?.["CODE_CODE"] || "");
                      searchClick({
                        type: "BEFORE",
                        pgmId: pgmId,
                        fromDate: fromDate,
                        toDate: toDate,
                        deptCode: deptCode,
                        reqFlag: r?.["CODE_CODE"] || "",
                        terminalCode: terminalCode,
                        userName: userName,
                        date: date,
                        dateFlag: dateFlag,
                      })
                        .then((v) => setGrid1(v))
                        .catch((v) => setGrid1([]));
                    }}
                    data={hrreqHr}
                    dropHeight="10rem"
                    header={commonHeader2}
                    id="hrreqHr"
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0",
                      value: hrreqHrSelect,
                    }}
                    title="필터"
                    labelW="20%"
                    find={true}
                  />
                </div>
              </div>
            }>
            <TableCust2
              body={grid1}
              header={GRID1_BEFORE_HEADER}
              height="34rem"
              width="100%"
              onClick={async (r) => {
                setGrid1Select(r);
                return false;
              }}
            />
          </CommonContainer>
        </div>
        <CommonContainer title="스케줄 정보">
          <TableCust2
            body={grid2}
            header={GRID2_HEADER}
            height="5rem"
            width="100%"
          />
        </CommonContainer>
        <CommonContainer
          title="OT 정보"
          childrenTitle={
            <div className="w-full grid grid-cols-[0.08fr_0.08fr]">
              <div className="mainInput">
                <Btn
                  txt="신규"
                  type="SAVE"
                  onClick={() => {
                    otInsert();
                  }}
                />
              </div>
              <div className="mainInput">
                <Btn txt="삭제" type="DELETE" onClick={() => otDelete()} />
              </div>
            </div>
          }>
          {" "}
          <TableCust2
            body={grid3}
            header={GRID3_HEADER}
            onClick={async (v) => {
              setGrid3Select(v);
              return false;
            }}
            height="5rem"
            width="100%"
          />
        </CommonContainer>
        <CommonContainer title="LOG">
          <TableCust2
            body={grid4}
            header={GRID4_HEADER}
            height="13rem"
            width="100%"
          />
        </CommonContainer>
      </div>
    );
  },
);

const ApproveList = forwardRef<ReqHandle, SetProp>(
  (
    {
      hrreq,
      pgmId,
      deptCode,
      fromDate,
      terminalCode,
      toDate,
      userName,
      date,
      dateFlag,
    },
    ref,
  ) => {
    const [hrreqHr, setHrreqHr] = useState<TableRow[]>([]);
    const [hrreqHrSelect, setHrreqHrSelect] = useState("T");

    useEffect(() => {
      const tmp = hrreq.filter((v) => v?.["VALUE4_CHAR"] === "Y");
      setHrreqHr([{ CODE_CODE: "", CODE_NAME: "-" }, ...tmp]);
    }, [hrreq]);

    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const grid1Ref = useRef<TableHandle>(null);

    const [otFlag, setOtFlag] = useState<boolean>(true);

    useImperativeHandle(ref, () => ({
      search({ userNameP }) {
        searchClick({
          type: "APPR",
          pgmId: pgmId,
          fromDate: fromDate,
          toDate: toDate,
          deptCode: deptCode,
          reqFlag: hrreqHrSelect,
          terminalCode: terminalCode,
          userName: userNameP,
          date: date,
          dateFlag: dateFlag,
          otFlag: otFlag ? "Y" : "N",
        })
          .then((v) => {
            setGrid1(v);
          })
          .catch((v) => setGrid1([]));
      },
    }));

    const compClick = useCallback(async () => {
      const tmp = grid1Ref.current?.getChk();

      if (tmp && Object.keys(tmp).length > 0) {
        const reqArray = Object.values(tmp).map((v) => ({
          YEAR: v?.["YEAR"] || "",
          MON: v?.["MON"] || "",
          DAY: v?.["DAY"] || "",
          SEQ: v?.["SEQ"] || 0,
          USER_SID: v?.["USER_SID"] || "",
          DETAIL_STATUS: v?.["DETAIL_STATUS"] || "",
        }));
        const map = new Map<string, any>();
        map.set("reqFlag", "C");
        map.set("reqArray", reqArray);

        sendLoading(true);
        const ret = await getApi<Record<number, TableRow[]>>({
          baseUrl: "INFRA",
          method: "POST",
          url: `/work/setWorkM010_035`,
          pgmId: pgmId,
          sucFlag: true,
          params: map,
        });
        sendLoading(false);

        if (ret.ok) {
          await searchClick({
            type: "APPR",
            pgmId: pgmId,
            fromDate: fromDate,
            toDate: toDate,
            deptCode: deptCode,
            reqFlag: hrreqHrSelect,
            terminalCode: terminalCode,
            userName: userName,
            date: date,
            dateFlag: dateFlag,
            otFlag: otFlag ? "Y" : "N",
          })
            .then((v) => {
              setGrid1(v);
            })
            .catch((v) => setGrid1([]));
        }
      } else {
        sendErr("선택한 항목이 없습니다.");
        return;
      }
    }, [
      grid1Ref.current,
      hrreqHrSelect,
      fromDate,
      toDate,
      deptCode,
      terminalCode,
      userName,
      date,
      dateFlag,
      otFlag,
    ]);

    const cancelClick = useCallback(async () => {
      const tmp = grid1Ref.current?.getChk();

      if (tmp && Object.keys(tmp).length > 0) {
        const reqArray = Object.values(tmp).map((v) => ({
          YEAR: v?.["YEAR"] || "",
          MON: v?.["MON"] || "",
          DAY: v?.["DAY"] || "",
          SEQ: v?.["SEQ"] || 0,
          USER_SID: v?.["USER_SID"] || "",
          DETAIL_STATUS: v?.["DETAIL_STATUS"] || "",
        }));
        const map = new Map<string, any>();
        map.set("reqFlag", "D");
        map.set("reqArray", reqArray);

        sendLoading(true);
        const ret = await getApi<Record<number, TableRow[]>>({
          baseUrl: "INFRA",
          method: "POST",
          url: `/work/setWorkM010_041`,
          pgmId: pgmId,
          sucFlag: true,
          params: map,
        });
        sendLoading(false);

        if (ret.ok) {
          searchClick({
            type: "APPR",
            pgmId: pgmId,
            fromDate: fromDate,
            toDate: toDate,
            deptCode: deptCode,
            reqFlag: hrreqHrSelect,
            terminalCode: terminalCode,
            userName: userName,
            date: date,
            dateFlag: dateFlag,
            otFlag: otFlag ? "Y" : "N",
          })
            .then((v) => {
              setGrid1(v);
            })
            .catch((v) => setGrid1([]));
        }
      } else {
        sendErr("선택한 항목이 없습니다.");
        return;
      }
    }, [
      grid1Ref.current,
      hrreqHrSelect,
      fromDate,
      toDate,
      deptCode,
      terminalCode,
      userName,
      date,
      dateFlag,
    ]);

    const holdDocClick = useCallback(async ({ r }: { r: TableRow }) => {
      const map = new Map();
      map.set("year", r?.["YEAR"] || "");
      map.set("mon", r?.["MON"] || "");
      map.set("day", r?.["DAY"] || "");
      map.set("seq", r?.["SEQ"] || "0");
      map.set("userSid", r?.["USER_SID"] || "0");
      map.set("imgType", "OTSB");
      sendLoading(true);
      const ret = await getApi<TableRow[]>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_042`,
        pgmId: pgmId,
        sucFlag: true,
        params: map,
      });
      sendLoading(false);
      if (ret.ok) {
        if (ret.data?.[0]) {
          const tmp = ret.data[0];

          openModal({
            array: [
              {
                id: "MSITP010",
                name: "Print",
                param: {
                  type: tmp?.["mime"] === "application/pdf" ? "PDF" : "IMG",
                  data: base64ToPdfUrl(tmp?.["data"], tmp?.["mime"]),
                },
              },
            ],
          });
        }
      }
    }, []);

    return (
      <div className="grid grid-rows-[10rem_10rem_1fr] gap-2">
        <div>
          <CommonContainer
            title="검토 리스트"
            childrenTitle={
              <div className="flex items-center gap-3">
                <div className="mainInput">
                  <CommonDropDown
                    onClick={(r) => {
                      setHrreqHrSelect(r?.["CODE_CODE"] || "");
                      searchClick({
                        type: "APPR",
                        pgmId: pgmId,
                        fromDate: fromDate,
                        toDate: toDate,
                        deptCode: deptCode,
                        reqFlag: r?.["CODE_CODE"] || "",
                        terminalCode: terminalCode,
                        userName: userName,
                        date: date,
                        dateFlag: dateFlag,
                        otFlag: otFlag ? "Y" : "N",
                      })
                        .then((v) => setGrid1(v))
                        .catch((v) => setGrid1([]));
                    }}
                    data={hrreqHr}
                    dropHeight="10rem"
                    header={commonHeader2}
                    id="hrreqHr"
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0",
                      value: hrreqHrSelect,
                    }}
                    title="필터"
                    labelW="20%"
                  />
                </div>
                <div className="mainInput">
                  <CommonChk
                    id="otFlag"
                    value={otFlag}
                    onChange={(v) => setOtFlag(v)}
                    title="시간외근무 유무"
                  />
                </div>
                <div className="mainInput">
                  <Btn txt="검토완료" type="SAVE" onClick={() => compClick()} />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="검토취소"
                    type="DELETE"
                    onClick={() => cancelClick()}
                  />
                </div>
              </div>
            }>
            <TableCust2
              body={grid1}
              header={GRID1_APPR_HEADER}
              height="34rem"
              width="100%"
              onClick={async (r) => {
                return false;
              }}
              onRowPrepared={(r, i) => {
                return { cells: { SPLIT: "#8EC5FF" } };
              }}
              rightMenu={[{ key: "HOLD_DOC", value: "서류확인" }]}
              rightClick={(k, r) => {
                if (k === "HOLD_DOC" && r?.["IMG_FLAG"] === "Y") {
                  holdDocClick({ r: r });
                }
              }}
              batch={true}
              ref={grid1Ref}
            />
          </CommonContainer>
        </div>
      </div>
    );
  },
);
