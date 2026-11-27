import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  type DefInfraComp,
  type PageHandle,
  type RowPrepType,
  type TableHandle,
  type TableHeaderType,
  type TableRow,
} from "../../Util/Type";
import { CommonContainer } from "../../comp/Container";
import { CommonMonthDatePicker } from "../../comp/DropDown";
import dayjs from "dayjs";
import { Btn } from "../../comp/Btn";
import { TableCust2 } from "../../comp/Table";
import { getApi, openModal, sendErr, sendLoading } from "../../Util/Util";

const GRID1_HEADER: TableHeaderType[] = [
  { key: "DETAIL_DATE", value: "날짜", w: "7rem" },
  {
    key: "USER_NAME",
    value: "이름",
    w: "5rem",
    sum: 0,
  },
  { key: "SEQ", value: "순번", w: "4rem" },
  {
    key: "CODE_NAME",
    value: "예정근무",
    w: "7rem",
  },
  { key: "REQ_TIME", value: "시간외근무", w: "7rem" },
  { key: "CAPS_START_TIME", value: "캡스시작", w: "5rem" },
  { key: "CAPS_END_TIME", value: "캡스종료", w: "5rem" },
  { key: "HRCOS_NAME", value: "신청지역", w: "5rem" },
  { key: "VALUE1", value: "세부지역", w: "5rem" },
  {
    key: "AMOUNT",
    value: "금액",
    w: "5rem",
    type: "NUM",
    sum: 0,
    typeOption: { USABLE_FLAG: "Y" },
  },
  { key: "CER_FLAG", value: "등본제출", w: "5rem" },
  {
    key: "USABLE_FLAG",
    value: "신청유무",
    w: "5rem",
    typeOption: { USABLE_FLAG: "Y" },
    sum: 0,
  },
];

const WorkNightMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId, deviceType }, ref) => {
    useImperativeHandle(ref, () => ({
      onModalPayload(payload: TableRow) {
        if (payload?.["SAVE"]) {
          searchClick();
        }
      },
    }));
    useEffect(() => {
      if (deviceType === "MOBILE") {
        const tmp = GRID1_HEADER.map((v) => ({
          ...v,
          w: `${Number(v.w.replace("rem", "")) - 2}rem`,
        }));

        setGrid1Header(tmp);
      } else {
        setGrid1Header(GRID1_HEADER);
      }
    }, [deviceType]);
    const [monDate, setMonDate] = useState(dayjs().format("YYYYMM"));
    const grid1Ref = useRef<TableHandle | null>(null);
    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const [grid1Select, setGrid1Select] = useState<TableRow>({});
    const [grid1Header, setGrid1Header] =
      useState<TableHeaderType[]>(GRID1_HEADER);

    const searchClick = useCallback(async () => {
      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/work/getWorkL010_031?dateStr=${monDate}`,
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
    }, [monDate]);

    const del = useCallback(async () => {
      if (Object.keys(grid1Select).length === 0) {
        sendErr("선택한 행이 없습니다.");
        return;
      }
      const map = new Map();
      map.set("year", grid1Select?.["YEAR"] || "");
      map.set("mon", grid1Select?.["MON"] || "");
      map.set("day", grid1Select?.["DAY"] || "");
      map.set(
        "seq",
        grid1Select?.["SEQ"] !== undefined ? grid1Select?.["SEQ"] : 0,
      );
      map.set("userSid", grid1Select?.["USER_SID"] || "");
      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_025`,
        params: map,
        pgmId: pgmId,
        sucFlag: true,
      });
      sendLoading(false);

      if (res.ok) {
        searchClick();
      }
    }, [grid1Select, deviceType]);

    return (
      <div>
        <CommonContainer
          title="심야교통비"
          deviceType={deviceType}
          childrenTitle={
            <div
              className={`flex w-full items-center justify-between gap-1 ${deviceType === "PC" && "p-[1%]"}`}>
              <div
                className={`flex items-center ${deviceType === "PC" ? "gap-3" : "gap-1"}`}>
                <div className="mainInput">
                  <CommonMonthDatePicker
                    id="monDate"
                    onClick={(v) => setMonDate(v)}
                    value={monDate}
                    title="날짜"
                    arrowNo={false}
                    colSize="20%"
                  />
                </div>
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
                    txt="신청"
                    type="SAVE"
                    deviceType={deviceType}
                    onClick={() => {
                      if (Object.keys(grid1Select).length === 0) {
                        sendErr("선택한 행이 없습니다.");
                        return;
                      }
                      openModal({
                        array: [
                          {
                            id: "WORK_NT_INS",
                            name: "심야교통비",
                            param: {
                              DATE: grid1Select?.["DETAIL_DATE"],
                              USER_SID: grid1Select?.["USER_SID"],
                              SEQ: grid1Select?.["SEQ"],
                            },
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
                      del();
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
            fixCount={3}
            onClick={async (r) => {
              setGrid1Select(r);
              return false;
            }}
            onRowPrepared={(r, i) => {
              var tmp: RowPrepType = {};
              if (r?.["USABLE_FLAG"] === "N") {
                tmp = { lines: "bg-[#F47378]" };
              }
              return tmp;
            }}
            onCustumizeText={(k, v) => {
              var tmp = v;

              if (k === "USABLE_FLAG") {
                if (v === "") {
                  tmp = "미신청";
                } else if (v === "N") {
                  tmp = "삭제처리";
                } else {
                  tmp = "신청완료";
                }
              }
              return tmp;
            }}
          />
        </CommonContainer>
      </div>
    );
  },
);

export default WorkNightMgm;
