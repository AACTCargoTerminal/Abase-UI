import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  type TableRow,
  type DefInfraComp,
  type PageHandle,
  type TableHeaderType,
  type TableHandle,
} from "../../Util/Type";
import { CommonContainer } from "../../comp/Container";
import { CommonChk, CommonInput } from "../../comp/Input";
import { getApi, getClassValue, sendErr, sendLoading } from "../../Util/Util";
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
  { key: "ADD_WORK_HOUR", value: "연장근무시간", w: "5rem" },
  { key: "NIGHT_WORK_HOUR", value: "야간근무시간", w: "5rem" },
  { key: "HOLIDAY_WORK_HOUR", value: "휴일근무시간", w: "5rem" },
  { key: "REMARK", value: "사유", w: "15rem" },
  { key: "APPROVE_ID", value: "확정ID", w: "7rem" },
  { key: "APPROVE_TIME", value: "확정시간", w: "8rem" },
  { key: "SIGN_FLAG", value: "서명유무", w: "4rem" },
];

const FILTER_DATA: TableRow[] = [
  { CODE_CODE: "", CODE_NAME: "ALL" },
  { CODE_CODE: "Y", CODE_NAME: "예" },
  { CODE_CODE: "N", CODE_NAME: "아니오" },
];

const WorkTimeAdm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId, deviceType }, ref) => {
    useEffect(() => {
      if (param?.["DATE"] && param?.["DEPT_CODE"] && param?.["USER_NAME"]) {
        setHrpatSelect(param["DEPT_CODE"]);
        setDate2(param["DATE"]);
        setName2(param["USER_NAME"]);
        setFlag(false);
        searchClick({
          dateValue: param["DATE"],
          deptCodeValue: param["DEPT_CODE"],
          usernameValue: param["USER_NAME"],
        });
      }
    }, [param]);

    const userId = useSelector((s: RootState) => s.user.userInfo?.userId || "");
    const [hrpat, setHrpat] = useState<TableRow[]>([]);
    const [hrpatSelect, setHrpatSelect] = useState("");
    useEffect(() => {
      if (userId) {
        getClassValue("Value3", "HRPAT", userId, pgmId).then((v) => {
          setHrpat(v);
          if (v.length === 0) {
            sendErr("권한이 없습니다.");
          } else {
            setHrpatSelect(v[0]["CODE_CODE"]);
          }
        });
      }
    }, [userId]);
    const [flag, setFlag] = useState(true);
    const [date, setDate] = useState(dayjs().format("YYYYMMDD"));
    const [date2, setDate2] = useState(dayjs().format("YYYYMM"));
    const [name, setName] = useState("");
    const [name2, setName2] = useState("");
    const [aprFlag, setAprFlag] = useState("");

    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const grid1Ref = useRef<TableHandle | null>(null);
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
        const finalDeptCode = deptCodeValue ?? hrpatSelect;
        const finalAprroveFlag = approveFlag ?? aprFlag;

        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "INFRA",
          method: "GET",
          url: `/work/getWorkM010_005?date=${finalDate}&deptCode=${finalDeptCode}&username=${finalUsername}&approveFlag=${finalAprroveFlag}`,
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
      [flag, date, date2, name, name2, hrpatSelect, aprFlag, pgmId],
    );

    const approveClick = useCallback(async () => {
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
          url: `/work/setWorkM010_031?approveFlag=Y`,
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

    return (
      <div className="px-[1%] flex flex-col gap-3">
        <div className="grid grid-cols-[15%_25%_25%] gap-5">
          <CommonContainer title="부서">
            <div className="grid grid-cols-[60%_30%] items-center gap-3">
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
                    value: hrpatSelect,
                  }}
                  onClick={(r) => setHrpatSelect(r["CODE_CODE"])}
                />
              </div>
              <div className="mainInput">
                <Btn txt="조회" type="SEARCH" onClick={() => searchClick()} />
              </div>
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
        <CommonContainer
          title="신청서 리스트"
          childrenTitle={
            <div className="p-[1%] flex gap-3">
              <div className="mainInput">
                <Btn
                  txt="확정"
                  type="NONE"
                  onClick={() => {
                    approveClick();
                  }}
                />
              </div>
              <div className="mainInput w-[40%]">
                <CommonDropDown
                  data={FILTER_DATA}
                  dropHeight="10rem"
                  header={commonHeader2}
                  id="aprFlag"
                  inputKey={{ key: "CODE_CODE", showKey: "0", value: aprFlag }}
                  onClick={(r) => {
                    setAprFlag(r["CODE_CODE"]);
                    searchClick({ approveFlag: r["CODE_CODE"] });
                  }}
                  labelW="40%"
                  title="확정 유무"
                />
              </div>
            </div>
          }>
          <TableCust2
            body={grid1}
            header={GRID1_HEADER}
            height="30rem"
            width="100%"
            batch={true}
            ref={grid1Ref}
          />
        </CommonContainer>
      </div>
    );
  },
);

export default WorkTimeAdm;
