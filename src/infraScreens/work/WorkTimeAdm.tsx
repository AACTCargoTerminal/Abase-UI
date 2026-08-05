import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  type TableRow,
  type DefInfraComp,
  type PageHandle,
  type TableHeaderType,
  type TableHandle,
} from "../../Util/Type";
import { CommonContainer, CommonTab } from "../../comp/Container";
import { CommonChk, CommonInput } from "../../comp/Input";
import {
  getApi,
  getClass,
  getClassValue,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import {
  CommonDatePicker,
  CommonDropDown,
  CommonMonthDatePicker,
} from "../../comp/DropDown";
import { commonHeader2 } from "../../Util/Header";
import dayjs from "dayjs";
import { Btn } from "../../comp/Btn";
import { TableCust2 } from "../../comp/Table";
import { setTimeExcelFile } from "./WorkUtil";

const GRID1_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "TIME_DATE", value: "일자", w: "7rem", sum: 0 },
  { key: "USER_NAME", value: "성명", w: "5rem" },
  { key: "DETAIL_STATUS", value: "최신상태", w: "7rem" },
  { key: "SEQ", value: "순번", w: "3rem" },
  { key: "CAPS_START_TIME", value: "캡스시작시간", w: "5rem" },
  { key: "CAPS_END_TIME", value: "캡스종료시간", w: "5rem" },
  { key: "REQ_START_TIME", value: "근무시작시간", w: "5rem" },
  { key: "REQ_END_TIME", value: "근무종료시간", w: "5rem" },
  {
    key: "ADD_WORK_HOUR",
    value: "연장근무시간",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "NIGHT_WORK_HOUR",
    value: "야간근무시간",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "HOLIDAY_WORK_HOUR",
    value: "휴일근무시간",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "HOLIDAY_ADD_HOUR",
    value: "휴일연장근무",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  { key: "REMARK", value: "사유", w: "13rem" },
  { key: "APPROVE_ID", value: "확정ID", w: "6rem" },
  { key: "APPROVE_TIME", value: "확정시간", w: "7rem" },
  { key: "SIGN_FLAG", value: "서명유무", w: "4rem" },
  { key: "SUBMIT_FLAG", value: "서류유무", w: "4rem" },
];

const GRID1_HEADER_1: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "TIME_DATE", value: "일자", w: "7rem", sum: 0 },
  { key: "USER_NAME", value: "성명", w: "5rem" },
  {
    key: "ADD_WORK_HOUR",
    value: "연장근무시간",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "NIGHT_WORK_HOUR",
    value: "야간근무시간",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "HOLIDAY_WORK_HOUR",
    value: "휴일근무시간",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "HOLIDAY_ADD_HOUR",
    value: "휴일연장근무",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
];

const FILTER_TAB: string[] = ["보류", "신청완료", "확정", "인사팀요청", "합계"];

const WorkTimeAdm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId, deviceType }, ref) => {
    const userHrtauCode = useSelector(
      (state: RootState) =>
        state.user.userInfo?.relArray.filter(
          (ur) => ur["CLASS_CODE"] === "HRTAU",
        ) ?? [],
    );

    const [grid1Header, setGrid1Header] = useState(GRID1_HEADER);

    const [hrpat, setHrpat] = useState<TableRow[]>([]);
    const [hrpatSelect, setHrpatSelect] = useState<TableRow>({});

    const [hrmtr, setHrmtr] = useState<TableRow[]>([]);
    const [orgHrmtr, setOrgHrmtr] = useState<TableRow[]>([]);
    const [hrmtrSelect, setHrmtrSelect] = useState("");

    const [postn, setPostn] = useState<TableRow[]>([]);
    const [postnSelect, setPostnSelect] = useState<TableRow>({});

    useEffect(() => {
      getClass("HRPAT", pgmId)
        .then((v) => {
          const filterTmp = v.filter((ft) =>
            userHrtauCode.find(
              (hrv) => hrv?.["CODE_CODE"] === ft?.["CODE_CODE"],
            ),
          );
          setHrpat(filterTmp);
        })
        .catch((r) => setHrpat([]));
      getClass("HRMTR", pgmId)
        .then((v) => {
          setOrgHrmtr(v);
        })
        .catch((r) => setOrgHrmtr([]));
      getClass("POSTN", pgmId)
        .then((v) => {
          setPostn(v);
        })
        .catch((r) => setPostn([]));
    }, []);

    useEffect(() => {
      if (hrpatSelect?.["CODE_CODE"]) {
        const tmp = userHrtauCode.find(
          (v) => v?.["CODE_CODE"] === hrpatSelect?.["CODE_CODE"],
        );
        if (tmp) {
          const tmp_hrmtr = orgHrmtr.find(
            (v) => v?.["CODE_CODE"] === tmp?.["VALUE1"],
          );
          if (tmp_hrmtr) {
            const tmp_split = String(tmp_hrmtr?.["VALUE1_CHAR"] || "")
              .split(";")
              .filter(Boolean);
            if (tmp_split.length === 0) {
              setHrmtr([tmp_hrmtr]);
              setHrmtrSelect(tmp_hrmtr?.["CODE_CODE"]);
            } else {
              const tmp_hrmtr2 = orgHrmtr.filter((v) =>
                tmp_split.includes(v?.["CODE_CODE"]),
              );
              setHrmtr(tmp_hrmtr2);
              setHrmtrSelect("");
            }
          } else {
            sendErr("해당 부서에는 터미널 권한이 없습니다.");
          }
          const tmp_postn = postn.find(
            (v) => v?.["CODE_CODE"] === tmp?.["VALUE2"],
          );
          if (tmp_postn) {
            setPostnSelect(tmp_postn);
          } else {
            sendErr("해당 부서에는 직급 권한이 없습니다.");
          }
        } else {
          sendErr("해당부서에서 권한이 없습니다.");
        }
      }
    }, [hrpatSelect]);

    const [flag, setFlag] = useState(true);
    const [date, setDate] = useState(dayjs().format("YYYYMMDD"));
    const [date2, setDate2] = useState(dayjs().format("YYYYMM"));
    const [name, setName] = useState("");
    const [name2, setName2] = useState("");
    const [selectTab, setSelectTab] = useState(0);

    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const grid1Ref = useRef<TableHandle | null>(null);
    const submitRef = useRef<string | null>(null);

    useEffect(() => {
      if (selectTab === 0) {
        if (postnSelect?.["VALUE4_CHAR"] === "Y") {
          setGrid1Header([
            ...GRID1_HEADER.filter(
              (v) => v.key !== "APPROVE_ID" && v.key !== "APPROVE_TIME",
            ),
            {
              key: "BTN",
              w: "4rem",
              value: "서류제출",
              option: {
                type: "BTN",
                set: {
                  txt: "제출",
                  type: "PRINT",
                  onClick(r) {
                    if (r) {
                      submitRef.current = r;
                      document.getElementById("approvePdf")?.click();
                    }
                  },
                },
              },
            },
          ]);
        } else {
          setGrid1Header([
            ...GRID1_HEADER.filter(
              (v) => v.key !== "APPROVE_ID" && v.key !== "APPROVE_TIME",
            ),
          ]);
        }
      } else if (selectTab === 1) {
        setGrid1Header([
          ...GRID1_HEADER.filter(
            (v) =>
              v.key !== "APPROVE_ID" &&
              v.key !== "APPROVE_TIME" &&
              v.key !== "SUBMIT_FLAG",
          ),
        ]);
      } else if (selectTab === 3) {
        setGrid1Header([
          ...GRID1_HEADER.filter(
            (v) => v.key !== "APPROVE_ID" && v.key !== "APPROVE_TIME",
          ),
        ]);
      } else {
        setGrid1Header([...GRID1_HEADER]);
      }
    }, [selectTab, postnSelect]);

    const searchClick = useCallback(
      async ({
        dateValue,
        usernameValue,
        deptCodeValue,
        approveFlag,
      }: {
        dateValue?: string;
        usernameValue?: string;
        deptCodeValue?: string;
        approveFlag?: string;
      } = {}) => {
        const tmpDate = flag ? date : date2;
        const username = flag ? name : name2;

        const finalDate = dateValue ?? tmpDate;
        const finalUsername = usernameValue ?? username;
        const finalDeptCode =
          deptCodeValue ?? (hrpatSelect?.["CODE_CODE"] || "");
        const finalArr =
          approveFlag ??
          (selectTab === 0
            ? "J"
            : selectTab === 1
              ? "I"
              : selectTab === 2
                ? "A"
                : selectTab === 3
                  ? "Q"
                  : "SUM");

        if (!finalDeptCode) {
          sendErr("부서를 선택해주세요");
          return;
        }
        if (!hrmtrSelect) {
          sendErr("터미널을 선택해주세요");
          return;
        }

        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "INFRA",
          method: "GET",
          url: `/work/getWorkM010_005?date=${finalDate}&deptCode=${finalDeptCode}&username=${finalUsername}&approveFlag=${finalArr}&terminalCode=${hrmtrSelect}`,
          pgmId,
          sucFlag: true,
        });
        sendLoading(false);

        if (res.ok && res.data?.[0]) {
          setGrid1(res.data[0]);
          return;
        }
        setGrid1([]);
      },
      [
        flag,
        date,
        date2,
        name,
        name2,
        hrpatSelect,
        pgmId,
        selectTab,
        hrmtrSelect,
      ],
    );

    const approveClick = useCallback(async () => {
      const tmp = grid1Ref.current?.getChk();
      if (!tmp || Object.values(tmp).length === 0) {
        sendErr("선택한 항목이 없습니다.");
        return;
      }
      const tmpArray = Object.values(tmp).map((v) => {
        return {
          date: String(v["TIME_DATE"]).replaceAll("-", ""),
          SEQ: v["SEQ"],
          USER_SID: v["USER_SID"],
          LOG_SEQ: v["LOG_SEQ"],
        };
      });
      if (tmpArray.length === 0) {
        sendErr("항목이 없습니다.");
        return;
      }
      const map = new Map<string, any>();
      map.set("array", tmpArray);
      sendLoading(true);

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_031`,
        params: map,
        pgmId: pgmId,
        sucFlag: true,
      });

      sendLoading(false);
      if (res.ok) {
        await searchClick();
      }
    }, [grid1Ref.current]);

    const approveWithPdf = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file) {
          return;
        }

        if (
          file.type !== "application/pdf" &&
          !file.name.toLowerCase().endsWith(".pdf")
        ) {
          sendErr("PDF 파일만 업로드할 수 있습니다.");
          return;
        }

        const tmp = grid1.find((v) => v?.["rowId"] === submitRef.current);
        if (!tmp) {
          sendErr("선택한 항목이 없습니다.");
          return;
        }
        const map = new Map<string, any>();
        const date = String(tmp?.["TIME_DATE"]).replaceAll("-", "");
        map.set("year", date.substring(0, 4));
        map.set("mon", date.substring(4, 6));
        map.set("day", date.substring(6, 8));
        map.set("seq", tmp?.["SEQ"]);
        map.set("userSid", tmp?.["USER_SID"]);
        map.set("imgType", "OTSB");
        sendLoading(true);

        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "INFRA",
          method: "POST",
          url: `/work/setWorkM010_018`,
          params: map,
          files: [file],
          pgmId: pgmId,
          sucFlag: true,
        });

        sendLoading(false);
        if (res.ok) {
          await searchClick();
        }
      },
      [pgmId, searchClick, grid1Ref.current],
    );

    const delClick = useCallback(async () => {
      const tmp = grid1Ref.current?.getChk();
      if (tmp && Object.values(tmp).length > 0) {
        const tmpArray = Object.values(tmp).map((v) => {
          return {
            date: String(v["TIME_DATE"]).replaceAll("-", ""),
            SEQ: v["SEQ"],
            USER_SID: v["USER_SID"],
          };
        });
        if (tmpArray.length === 0) {
          sendErr("항목이 없습니다.");
          return;
        }
        const map = new Map<string, any>();
        map.set("DEL", tmpArray);
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
          await searchClick();
        }
      } else {
        sendErr("선택한 항목이 없습니다.");
      }
    }, [grid1Ref.current, flag, date, date2, name, name2, hrpatSelect]);

    const getExcel = useCallback(async () => {
      const ret = await getApi<string>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getExTimeWork`,
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
          a.download = `${dayjs().format("YYYY_MM_DD")}시간외근무 일괄등록 양식.xlsx`;
          a.href = url;

          document.body.appendChild(a);

          a.click();

          a.remove();

          window.URL.revokeObjectURL(url);
        }
      }
    }, []);

    const workTimeUpload = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const ret = await setTimeExcelFile({ e: e });
        if (ret) {
          sendLoading(true);

          const res = await getApi<Record<number, TableRow[]>>({
            baseUrl: "INFRA",
            method: "POST",
            url: `/work/setWorkM010_039`,
            params: ret,
            pgmId: pgmId,
            sucFlag: true,
          });

          sendLoading(false);
          if (res.ok) {
            await searchClick();
          }
        }
      },
      [hrpatSelect?.["CODE_CODE"], date, date2, selectTab, name, name2],
    );

    return (
      <div className="px-[1%] flex flex-col gap-3">
        <div className="grid grid-cols-[0.45fr_0.25fr_0.25fr] gap-5">
          <CommonContainer title="부서 및 터미널">
            <div className="grid grid-cols-[0.3fr_0.25fr_0.1fr_0.15fr_0.15fr] items-center gap-3">
              <div className="mainInput">
                {" "}
                <CommonDropDown
                  data={hrpat}
                  dropHeight="15rem"
                  header={commonHeader2}
                  id="hrpat"
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: hrpatSelect?.["CODE_CODE"] || "",
                  }}
                  onClick={(r) => setHrpatSelect(r)}
                  title="부서"
                  labelW="30%"
                />
              </div>
              <div className="mainInput">
                {" "}
                <CommonDropDown
                  data={hrmtr}
                  dropHeight="15rem"
                  header={commonHeader2}
                  id="hrmtr"
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: hrmtrSelect,
                  }}
                  onClick={(r) => setHrmtrSelect(r?.["CODE_CODE"] || "")}
                  title="터미널"
                  labelW="30%"
                  read={hrmtr.length <= 1}
                />
              </div>
              <div className="mainInput">
                <Btn txt="조회" type="SEARCH" onClick={() => searchClick()} />
              </div>
              {hrpatSelect?.["VALUE2_NUMBER"] > 0 && (
                <>
                  <div className="mainInput">
                    <Btn
                      txt="양식다운"
                      type="EXCEL"
                      onClick={() => getExcel()}
                    />
                  </div>
                  <div className="mainInput">
                    <Btn
                      txt="일괄업로드"
                      type="SAVE"
                      onClick={() => {
                        document.getElementById("groupUpload")?.click();
                      }}
                    />
                    <input
                      id="groupUpload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => workTimeUpload(e)}
                      className="hidden"
                    />
                  </div>
                </>
              )}
            </div>
          </CommonContainer>
          <CommonContainer
            title="날짜별 관리"
            childrenTitle={
              <div className="mainInput">
                <CommonChk
                  id="chk1"
                  onChange={(v) => {
                    setFlag(v);
                  }}
                  value={flag}
                />
              </div>
            }>
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <div className="mainInput">
                <CommonDatePicker
                  id="date"
                  value={date}
                  onClick={(v) => {
                    setFlag(true);
                    setDate(v);
                  }}
                  title="날짜"
                  colSize="10%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="name"
                  value={name}
                  onChange={(v) => {
                    setName(v);
                    setFlag(true);
                  }}
                  label="이름"
                  labelW="15%"
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer
            title="근무자별 관리"
            childrenTitle={
              <div className="mainInput">
                <CommonChk
                  id="chk2"
                  onChange={(v) => {
                    setFlag(!v);
                  }}
                  value={!flag}
                />
              </div>
            }>
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <div className="mainInput">
                <CommonMonthDatePicker
                  id="date2"
                  value={date2}
                  onClick={(v) => {
                    setDate2(v);
                    setFlag(false);
                  }}
                  title="날짜"
                  colSize="10%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="name2"
                  value={name2}
                  onChange={(v) => {
                    setName2(v);
                    setFlag(false);
                  }}
                  label="이름"
                  labelW="15%"
                />
              </div>
            </div>
          </CommonContainer>
        </div>
        <CommonTab
          tabs={FILTER_TAB}
          active={selectTab}
          setActive={(v) => {
            setSelectTab(v);
            searchClick({
              approveFlag:
                v === 0
                  ? "J"
                  : v === 1
                    ? "I"
                    : v === 2
                      ? "A"
                      : v === 3
                        ? "Q"
                        : "SUM",
            });
          }}>
          <CommonContainer
            title="보류 리스트"
            childrenTitle={
              <div className="p-[1%] grid grid-cols-[100px] gap-3">
                {postnSelect?.["VALUE3_CHAR"] === "Y" && (
                  <div className="mainInput">
                    <Btn
                      txt="확정"
                      type="NONE"
                      onClick={() => {
                        approveClick();
                      }}
                    />
                  </div>
                )}
              </div>
            }>
            <TableCust2
              body={grid1}
              header={grid1Header}
              height="30rem"
              width="100%"
              batch={true}
              ref={grid1Ref}
            />
          </CommonContainer>
          <CommonContainer
            title="완료 리스트"
            childrenTitle={
              <div className="p-[1%] grid grid-cols-[100px] gap-3">
                {postnSelect?.["VALUE3_CHAR"] === "Y" && (
                  <div className="mainInput">
                    <Btn
                      txt="확정"
                      type="NONE"
                      onClick={() => {
                        approveClick();
                      }}
                    />
                  </div>
                )}
              </div>
            }>
            <TableCust2
              body={grid1}
              header={grid1Header}
              height="30rem"
              width="100%"
              batch={true}
              ref={grid1Ref}
            />
          </CommonContainer>
          <CommonContainer
            title="확정 리스트"
            childrenTitle={
              <div className="p-[1%] grid grid-cols-[100px] gap-3">
                {postnSelect?.["VALUE3_CHAR"] === "Y" && (
                  <div className="mainInput">
                    <Btn
                      txt="삭제"
                      type="DELETE"
                      onClick={() => {
                        delClick();
                      }}
                    />
                  </div>
                )}
              </div>
            }>
            <TableCust2
              body={grid1}
              header={grid1Header}
              height="30rem"
              width="100%"
              batch={true}
              ref={grid1Ref}
            />
          </CommonContainer>
          <CommonContainer
            title="요청 리스트"
            childrenTitle={
              <div className="p-[1%] grid grid-cols-[100px] gap-3">
                {postnSelect?.["VALUE3_CHAR"] === "Y" && (
                  <div className="mainInput">
                    <Btn
                      txt="삭제"
                      type="DELETE"
                      onClick={() => {
                        delClick();
                      }}
                    />
                  </div>
                )}
              </div>
            }>
            <TableCust2
              body={grid1}
              header={grid1Header}
              height="30rem"
              width="100%"
              batch={true}
              ref={grid1Ref}
            />
          </CommonContainer>
          <CommonContainer title="합계 리스트">
            <TableCust2
              body={grid1}
              header={GRID1_HEADER_1}
              height="30rem"
              width="100%"
            />
          </CommonContainer>
        </CommonTab>
        <input
          id="approvePdf"
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            if (submitRef.current === null) {
              return;
            }
            approveWithPdf(e);
          }}
          className="hidden"
        />
      </div>
    );
  },
);

export default WorkTimeAdm;
