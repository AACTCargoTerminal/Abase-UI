import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type {
  DefInfraComp,
  PageHandle,
  TableHandle,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";
import { useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { getApi, getClass, sendErr, sendLoading } from "../../Util/Util";
import { CommonContainer, CommonTab } from "../../comp/Container";
import { CommonDropDown, CommonMonthDatePicker } from "../../comp/DropDown";
import { commonHeader2 } from "../../Util/Header";
import { Btn } from "../../comp/Btn";
import { CommonInput } from "../../comp/Input";
import dayjs from "dayjs";
import { TableCust2 } from "../../comp/Table";

const GRID1_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "TIME_DATE", value: "날짜", w: "7rem" },
  { key: "USER_NAME", value: "이름", w: "5rem", sum: 0 },
  { key: "SEQ", value: "순번", w: "3rem" },
  { key: "WORK_TYPE_NAME", value: "예정근무", w: "7rem" },
  { key: "REQ_TIME", value: "시간외근무", w: "7rem" },
  { key: "CODE_NAME", value: "지역", w: "7rem" },
  { key: "VALUE1", value: "상세지역", w: "7rem" },
  { key: "AMOUNT", value: "금액(천원)", w: "5rem", type: "NUM", sum: 0 },
  { key: "REMARK", value: "사유", w: "7rem" },
];

const WorkNightAdm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId, deviceType }, ref) => {
    const userHrtauCode = useSelector(
      (state: RootState) =>
        state.user.userInfo?.relArray.filter(
          (ur) => ur["CLASS_CODE"] === "HRTAU",
        ) ?? [],
    );

    const [hrpat, setHrpat] = useState<TableRow[]>([]);
    const [hrpatSelect, setHrpatSelect] = useState<TableRow>({});

    const [hrmtr, setHrmtr] = useState<TableRow[]>([]);
    const [orgHrmtr, setOrgHrmtr] = useState<TableRow[]>([]);
    const [hrmtrSelect, setHrmtrSelect] = useState("");

    const [postn, setPostn] = useState<TableRow[]>([]);
    const [postnSelect, setPostnSelect] = useState<TableRow>({});

    const [name, setName] = useState("");
    const [date, setDate] = useState(dayjs().format("YYYYMM"));
    const [tab, setTab] = useState(0);

    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const grid1Ref = useRef<TableHandle | null>(null);
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

    useEffect(() => {
      searchClick();
    }, [tab]);

    const searchClick = useCallback(async () => {
      if (Object.keys(hrpatSelect).length === 0) {
        sendErr("부서를 선택해주세요.");
        return;
      }

      if (!hrmtrSelect) {
        sendErr("터미널을 선택해주세요.");
        return;
      }

      const params = new URLSearchParams({
        dateStr: date,
        teamCode: hrpatSelect?.["CODE_CODE"] || "",
        terminalCode: hrmtrSelect,
        userName: name,
        approveFlag: tab === 0 ? "N" : "Y",
      });
      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getWorkL010_032?${params.toString()}`,
        pgmId: pgmId,
        sucFlag: true,
      });
      sendLoading(false);
      if (res.ok) {
        if (res.data?.[0]) {
          setGrid1(res.data[0]);
          return;
        }
      }
      setGrid1([]);
    }, [date, hrpatSelect, hrmtrSelect, name, tab]);

    const appr = useCallback(async () => {
      const tmp = grid1Ref.current?.getChk() || {};
      if (Object.keys(tmp).length === 0) {
        sendErr("항목을 선택해주세요");
        return;
      }

      const array = Object.values(tmp).map((v) => ({
        year: v?.["YEAR"] || "",
        mon: v?.["MON"] || "",
        day: v?.["DAY"] || "",
        seq: v?.["SEQ"] !== undefined ? v?.["SEQ"] : 0,
        userSid: v?.["USER_SID"] || 0,
      }));

      const map = new Map();
      map.set("array", array);
      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkL010_019`,
        pgmId: pgmId,
        params: map,
        sucFlag: true,
      });
      sendLoading(false);
      if (res.ok) {
        await searchClick();
      }
    }, [grid1Ref, searchClick]);

    return (
      <div className="px-[1%] flex flex-col gap-3">
        <div className="grid grid-cols-[0.4fr_0.3fr] items-center gap-3">
          <CommonContainer title="부서 및 터미널">
            <div className="grid grid-cols-[0.3fr_0.3fr_0.1fr] items-center gap-3">
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
                <Btn
                  txt="조회"
                  type="SEARCH"
                  onClick={() => {
                    searchClick();
                  }}
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="날짜 설정">
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <div className="mainInput">
                <CommonMonthDatePicker
                  id="date2"
                  value={date}
                  onClick={(v) => {
                    setDate(v);
                  }}
                  title="날짜"
                  colSize="10%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="name2"
                  value={name}
                  onChange={(v) => {
                    setName(v);
                  }}
                  label="이름"
                  labelW="15%"
                />
              </div>
            </div>
          </CommonContainer>
        </div>
        <CommonTab
          tabs={["신청", "확정"]}
          active={tab}
          setActive={(v) => setTab(v)}>
          <CommonContainer
            title="신청리스트"
            childrenTitle={
              <div className="flex items-center px-[1%]">
                <div className="mainInput">
                  {" "}
                  <Btn
                    txt="확정"
                    type="SAVE"
                    onClick={() => {
                      appr();
                    }}
                  />
                </div>
              </div>
            }>
            <TableCust2
              body={grid1}
              header={GRID1_HEADER}
              height="33rem"
              width="100%"
              ref={grid1Ref}
              batch={true}
            />
          </CommonContainer>
          <CommonContainer title="확정리스트">
            <TableCust2
              body={grid1}
              header={GRID1_HEADER}
              height="33rem"
              width="100%"
            />
          </CommonContainer>
        </CommonTab>
      </div>
    );
  },
);

export default WorkNightAdm;
