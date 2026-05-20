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
import { getApi, getClass, openModal, sendErr } from "../../Util/Util";
import { TableCust2 } from "../../comp/Table";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { commonHeader2, commonHeader5 } from "../../Util/Header";
import dayjs from "dayjs";
import { CommonInput } from "../../comp/Input";
import { Btn, MenuBtn } from "../../comp/Btn";

const TABS = ["요청", "확정 전 리스트", "검토 리스트"];
const BTN_ARRAY: MenuBtnDataType[] = [
  { KEY: "A", VALUE: "스케줄( 예정 )" },
  { KEY: "B", VALUE: "스케줄( 확정 )" },
  { KEY: "C", VALUE: "시간외근무 신청서" },
  { KEY: "D", VALUE: "시간외근무 세부내역" },
];

type ReqHandle = {
  search: () => void;
};

type SetProp = {
  hrreq: TableRow[];
  pgmId: string;
  deptCode: string;
  terminalCode: string;
  toDate: string;
  fromDate: string;
  userName: string;
};

const getOPCOD = async (pgmId: string): Promise<TableRow[]> => {
  return await getClass("OPCOD", pgmId);
};
const OPCOD_BODY: TableRow[] = await getOPCOD("pgmId");

const WorkHrMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId }, ref) => {
    const [tabSelect, setTabSelect] = useState(0);
    const [hrreq, setHrreq] = useState<TableRow[]>([]);
    const [hrpat, setHrpat] = useState<TableRow[]>([]);
    const [hrpatSelect, setHrpatSelect] = useState("");
    const [trmcd, setTrmcd] = useState<TableRow[]>([]);
    const [trmcdSelect, setTrmcdSelect] = useState("");
    const [startDate, setStartDate] = useState(
      dayjs().startOf("month").format("YYYYMMDD"),
    );
    const [endDate, setEndDate] = useState(dayjs().format("YYYYMMDD"));
    const [userName, setUserName] = useState("");

    const reqRef = useRef<ReqHandle>(null);
    const beforeRef = useRef<ReqHandle>(null);

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
      searchClick(tabSelect);
    }, [tabSelect]);

    const searchClick = useCallback(
      (num: number) => {
        if (num === 0) {
          reqRef.current?.search();
        } else if (num === 1) {
          beforeRef.current?.search();
        } else {
        }
      },
      [hrpatSelect, trmcdSelect, startDate, endDate, userName],
    );

    return (
      <div className="pr-[0.5%] flex flex-col gap-3">
        <CommonContainer title="설정" width="100%">
          <div className="grid grid-cols-[0.1fr_0.1fr_0.25fr_0.1fr_0.05fr_0.05fr] gap-3">
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
                labelW="30%"
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
                labelW="30%"
              />
            </div>
            <div className="flex items-center">
              <div className="mainInput">
                <CommonDatePicker
                  id="start"
                  onClick={(v) => setStartDate(v)}
                  value={startDate}
                  title="기간설정"
                  colSize="20%"
                />
              </div>
              -
              <div className="mainInput">
                <CommonDatePicker
                  id="end"
                  onClick={(v) => setEndDate(v)}
                  value={endDate}
                />
              </div>
            </div>
            <CommonInput
              id="userName"
              value={userName}
              onChange={(v) => setUserName(v)}
              label="이름"
              labelW="30%"
            />
            <Btn
              txt="조회"
              type="SEARCH"
              onClick={() => {
                searchClick(tabSelect);
              }}
            />
            <MenuBtn
              data={BTN_ARRAY}
              txt="Excel"
              type="EXCEL"
              onClick={(v) => {}}
            />
          </div>
        </CommonContainer>
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
  { key: "ADD_WORK_HOUR", value: "연장근무", w: "4rem" },
  { key: "NIGHT_WORK_HOUR", value: "야간근무", w: "4rem" },
  { key: "HOLIDAY_WORK_HOUR", value: "휴일근무", w: "4rem" },
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
  { key: "HOLIDAY_WORK_HOUR", value: "휴일근무", w: "4rem" },
  { key: "REMARK", value: "사유", w: "13rem" },
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
  userName,
  pgmId,
}: {
  type: string;
  reqFlag?: string;
  deptCode?: string;
  terminalCode?: string;
  toDate: string;
  fromDate: string;
  userName?: string;
  pgmId: string;
}): Promise<TableRow[]> => {
  const map = new Map<string, any>();
  map.set("type", type);
  map.set("reqFlag", reqFlag || "");
  map.set("deptCode", deptCode || "");
  map.set("terminalCode", terminalCode || "");
  map.set("toDate", toDate);
  map.set("fromDate", fromDate);
  map.set("userName", userName || "");

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
    { hrreq, pgmId, deptCode, fromDate, terminalCode, toDate, userName },
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
      search() {
        searchClick({
          type: "REQ",
          pgmId: pgmId,
          fromDate: fromDate,
          toDate: toDate,
          deptCode: deptCode,
          reqFlag: hrreqHrSelect,
          terminalCode: terminalCode,
          userName: userName,
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

    function grid2Cancel() {
      grid2Ref.current?.cancle();
    }

    function grid2Save() {
      if (Object.keys(grid1Select).length === 0) {
        sendErr("선택한 요청이 없습니다.");
        return;
      }

      const tmp = grid2Ref.current?.update();
      if (tmp && Object.keys(tmp).length > 0) {
        console.log(grid1Select);
      } else {
        sendErr("수정사항이 없습니다.");
      }
    }

    function grid3Cancel() {
      grid3Ref.current?.cancle();
    }

    function grid3Save() {
      const tmp = grid3Ref.current?.update();
      if (tmp && Object.keys(tmp).length > 0) {
      } else {
        sendErr("수정사항이 없습니다.");
      }
    }

    return (
      <div className="grid grid-cols-[36%_1fr] grid-rows-[10rem_10rem_1fr] gap-2">
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
                              SEQ: grid1Select?.["SEQ"] || "",
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
                  <Btn txt="수락" type="SAVE" onClick={() => {}} />
                </div>
                <div className="mainInput">
                  <Btn txt="확정" type="NONE" onClick={() => {}} />
                </div>
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
            />
          </CommonContainer>
        </div>
        <CommonContainer
          title="스케줄 정보"
          childrenTitle={
            <div className="flex items-center gap-3">
              <div className="mainInput">
                <Btn txt="저장" type="SAVE" onClick={grid2Save} />
              </div>
              <div className="mainInput">
                <Btn
                  txt="취소"
                  type="DELETE"
                  onClick={() => {
                    grid2Cancel();
                  }}
                />
              </div>
            </div>
          }>
          <TableCust2
            body={grid2}
            header={GRID2_HEADER}
            height="5rem"
            width="100%"
            batch={true}
            ref={grid2Ref}
          />
        </CommonContainer>
        <CommonContainer
          title="OT 정보"
          childrenTitle={
            <div className="flex items-center gap-3">
              <div className="mainInput">
                <Btn txt="저장" type="SAVE" onClick={grid3Save} />
              </div>
              <div className="mainInput">
                <Btn txt="취소" type="DELETE" onClick={grid3Cancel} />
              </div>
            </div>
          }>
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
            width="100%"
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

const BeforeList = forwardRef<ReqHandle, SetProp>(
  (
    { hrreq, pgmId, deptCode, fromDate, terminalCode, toDate, userName },
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

    useImperativeHandle(ref, () => ({
      search() {
        searchClick({
          type: "BEFORE",
          pgmId: pgmId,
          fromDate: fromDate,
          toDate: toDate,
          deptCode: deptCode,
          reqFlag: hrreqHrSelect,
          terminalCode: terminalCode,
          userName: userName,
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

    return (
      <div className="grid grid-cols-[35%_1fr] grid-rows-[10rem_10rem_1fr] gap-2">
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
        <CommonContainer title="OT 정보">
          {" "}
          <TableCust2
            body={grid3}
            header={GRID3_HEADER}
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
