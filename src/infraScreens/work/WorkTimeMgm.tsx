import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  DefInfraComp,
  PageHandle,
  TableHandle,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";
import { CommonContainer } from "../../comp/Container";
import dayjs from "dayjs";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { Btn } from "../../comp/Btn";
import { getApi, openModal, sendErr, sendLoading } from "../../Util/Util";
import { TableCust, TableCust2 } from "../../comp/Table";
import { useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { commonHeader2 } from "../../Util/Header";

const GRID1_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "2rem" },
  { key: "USER_NAME", value: "이름", w: "3rem", sum: 0 },
  { key: "SEQ", value: "순번", w: "2rem" },
  { key: "DETAIL_STATUS", value: "최신상태", w: "7rem" },
  { key: "REQ_START_TIME", value: "시작시간", w: "3rem" },
  { key: "REQ_END_TIME", value: "종료시간", w: "3rem" },
  {
    key: "ADD_WORK_HOUR",
    value: "연장근무시간",
    w: "4rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "NIGHT_WORK_HOUR",
    value: "야간근무시간",
    w: "4rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "HOLIDAY_WORK_HOUR",
    value: "휴일근무시간",
    w: "4rem",
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
  { key: "REMARK", value: "사유", w: "10rem" },
];

const WorkTimeMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId, deviceType }, ref) => {
    const [date, setDate] = useState(dayjs().format("YYYYMMDD"));
    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const [grid1Header, setGrid1Header] =
      useState<TableHeaderType[]>(GRID1_HEADER);
    const grid1Ref = useRef<TableHandle | null>(null);
    const userSid = useSelector(
      (state: RootState) => state.user.userInfo?.userSid || 0,
    );

    useImperativeHandle(ref, () => ({
      onModalPayload(payload: TableRow) {
        if (payload?.["SAVE"]) {
          searchClick();
        }
      },
    }));

    useEffect(() => {
      if (deviceType === "PC") {
        const tmp: TableHeaderType[] = GRID1_HEADER.map((v) => {
          if (v.key === "USER_NAME") {
            return { ...v, w: "5rem" };
          } else if (v.key === "SEQ") {
            return { ...v, w: "3rem" };
          } else if (v.key === "REQ_START_TIME") {
            return { ...v, w: "5rem" };
          } else if (v.key === "REQ_END_TIME") {
            return { ...v, w: "5rem" };
          } else if (v.key === "ADD_WORK_HOUR") {
            return { ...v, w: "5rem" };
          } else if (v.key === "NIGHT_WORK_HOUR") {
            return { ...v, w: "5rem" };
          } else if (v.key === "HOLIDAY_WORK_HOUR") {
            return { ...v, w: "5rem" };
          } else if (v.key === "CHK") {
            return { ...v, w: "3rem" };
          }
          return { ...v };
        });
        setGrid1Header(tmp);
      } else {
        setGrid1Header([...GRID1_HEADER]);
      }
    }, [deviceType]);

    const searchClick = useCallback(async () => {
      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getWorkM010_004?date=${date}`,
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
    }, [date]);

    useEffect(() => {
      if (date) {
        searchClick();
      }
    }, [date]);

    const deleteClick = useCallback(async () => {
      const tmp = grid1Ref.current?.getChk();
      if (tmp) {
        var flag = false;
        var tmpTable: TableRow[] = [];
        Object.values(tmp).forEach((v) => {
          if (v["USER_SID"] !== userSid) {
            flag = true;
            return;
          }
          if (v["CHK"]) {
            tmpTable.push(v);
          }
        });

        if (flag) {
          sendErr("본인계정만 삭제 가능합니다.");
          return;
        }

        if (tmpTable.length === 0) {
          sendErr("체크한 항목이 없습니다.");
          return;
        }
        const sendTmp = tmpTable.map((v) => ({
          date: date,
          SEQ: v["SEQ"],
          USER_SID: v["USER_SID"],
        }));

        const map = new Map<string, any>();
        map.set("DEL", sendTmp);
        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "INFRA",
          method: "POST",
          url: `/work/setWorkM010_022?adminFlag=N`,
          pgmId: pgmId,
          params: map,
          sucFlag: true,
        });
        sendLoading(false);
        if (res.ok) {
          searchClick();
        }
      } else {
        sendErr("체크한 항목이 없습니다.");
      }
    }, [grid1Ref.current]);

    return (
      <div className="px-[1%]">
        <CommonContainer
          title="시간 외 근무"
          deviceType={deviceType}
          childrenTitle={
            <div
              className={`flex w-full items-center justify-between ${deviceType === "PC" && "p-[1%]"}`}>
              <div className="flex gap-3">
                <div className={`mainInput`}>
                  <CommonDatePicker
                    id="date"
                    onClick={(v) => setDate(v)}
                    value={date}
                    title="날짜"
                    colSize="20%"
                    arrowNo={false}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="mainInput">
                  <Btn
                    txt="조회"
                    type="SEARCH"
                    deviceType={deviceType}
                    onClick={() => {
                      searchClick();
                    }}
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="신규"
                    type="NONE"
                    deviceType={deviceType}
                    onClick={() => {
                      openModal({
                        array: [
                          {
                            id: "WORK_TIME_INS",
                            name: "신청서",
                            param: { date: date, userSid: 0, seq: -1 },
                          },
                        ],
                      });
                    }}
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="삭제"
                    type="DELETE"
                    deviceType={deviceType}
                    onClick={() => {
                      deleteClick();
                    }}
                  />
                </div>
              </div>
            </div>
          }>
          <TableCust2
            batch={true}
            ref={grid1Ref}
            body={grid1}
            header={grid1Header}
            height="30rem"
            width="100%"
            fixCount={1}
            doubleClick={(v) => {
              if (v["USER_SID"] !== userSid) {
                sendErr("본인계정만 수정가능합니다.");
                return;
              }
              openModal({
                array: [
                  {
                    id: "WORK_TIME_INS",
                    name: "신청서",
                    param: {
                      date: date,
                      userSid: v["USER_SID"],
                      seq: v["SEQ"],
                    },
                  },
                ],
              });
            }}
          />
        </CommonContainer>
      </div>
    );
  },
);

export default WorkTimeMgm;
