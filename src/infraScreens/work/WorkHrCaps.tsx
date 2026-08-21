import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type TableHandle,
  type ModalComp,
  type TableHeaderType,
  type TableRow,
} from "../../Util/Type";
import { getApi, sendErr } from "../../Util/Util";
import dayjs from "dayjs";
import { TableCust2 } from "../../comp/Table";
import { CommonChk, TimeInput } from "../../comp/Input";
import { ToggleBtn } from "../../comp/Common";

const GRID1_HEADER: TableHeaderType[] = [
  { key: "date", value: "날짜", sum: 0, w: "6rem" },
  { key: "time", value: "시간", w: "5rem" },
  { key: "mode", value: "모드", w: "4rem" },
];

export default function WorkHrCaps({
  pgmId,
  param,
  onClose,
  headerAction,
  closeParam,
  outParam,
  sendParam,
}: ModalComp) {
  if (
    !param?.["USER_ID"] &&
    param?.["ADD_DAY"] !== undefined &&
    !param?.["DATE"]
  ) {
    onClose?.();
    sendErr("캡스를 조회할수 없습니다.");
    return null;
  }
  const [params] = useState({
    userId: param["USER_ID"],
    startDate: String(param["DATE"]).replaceAll("-", ""),
    endDate: dayjs(param["DATE"], "YYYY-MM-DD")
      .add(param["ADD_DAY"], "day")
      .format("YYYYMMDD"),
  });

  useEffect(() => {
    search();
  }, [params]);

  useEffect(() => {
    if (headerAction?.type) {
      if (headerAction?.type === "저장") {
        saveClick();
      }
    }
  }, [headerAction?.type]);

  const [grid1, setGrid1] = useState<TableRow[]>([]);
  const grid1Ref = useRef<TableHandle | null>(null);
  const [toggleIdx, setToggleIdx] = useState<number>(
    param?.["CAPS_START_TIME"] === "XXXX" ? 0 : 1,
  );
  const toggleSub = useRef<number>(
    param?.["CAPS_START_TIME"] === "XXXX" ? 0 : 1,
  );

  const [start, setStart] = useState(
    param?.["CAPS_START_TIME"] !== "XXXX" ? param?.["CAPS_START_TIME"] : "0000",
  );
  const [end, setEnd] = useState(
    param?.["CAPS_END_TIME"] !== "XXXX" ? param?.["CAPS_END_TIME"] : "0000",
  );

  async function search() {
    const res = await getApi<TableRow[]>({
      baseUrl: "INFRA",
      method: "GET",
      url: `/caps/findIdToDate?id=${params.userId}&start=${params.startDate}&end=${params.endDate}`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data) {
        setGrid1(res.data);
        return;
      }
    }
    setGrid1([]);
  }

  const saveClick = useCallback(async () => {
    const year = params.startDate.substring(0, 4);
    const mon = params.startDate.substring(4, 6);
    const day = Number(params.startDate.substring(6, 8));

    const map = new Map<string, any>();
    map.set("year", year);
    map.set("mon", mon);
    map.set("day", day);
    map.set("userSid", param?.["USER_SID"] || 0);
    map.set("seq", param?.["SEQ"] || 0);
    map.set("startTime", start);
    map.set("endTime", end);

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "POST",
      url: `/work/setWorkM010_043`,
      params: map,
      pgmId: pgmId,
    });
    if (res.ok) {
      onClose?.();
      outParam?.({ SAVE: "SAVE" });
    }
  }, [start, end, params, param]);

  const rowClick = useCallback(
    (r: TableRow) => {
      if (toggleSub.current === 0) {
        if (param?.["CAPS_START_TIME"] === "XXXX") {
          setStart(String(r?.["time"]).substring(0, 4) || "0000");
        } else {
          sendErr("시작시간은 이미 매칭완료했습니다.");
        }
      } else {
        if (param?.["CAPS_END_TIME"] === "XXXX") {
          setEnd(String(r?.["time"]).substring(0, 4) || "0000");
        } else {
          sendErr("종료시간은 이미 매칭완료했습니다.");
        }
      }
    },
    [toggleSub.current, param],
  );

  return (
    <div className="mx-[5%] my-[5%]">
      <div className="flex my-[3%] w-full gap-5">
        <div className="mainInput">
          <ToggleBtn
            array={[
              { key: "START", value: "시작" },
              { key: "END", value: "종료" },
            ]}
            idx={toggleIdx}
            onClick={async (v) => {
              if (v === "START") {
                setToggleIdx(0);
                toggleSub.current = 0;
              } else {
                setToggleIdx(1);
                toggleSub.current = 1;
              }
              grid1Ref.current?.bgClear();
            }}
          />
        </div>
        <div className="mainInput w-[25%]">
          <TimeInput
            id="time"
            value={toggleIdx === 0 ? start : end}
            read={true}
          />
        </div>
      </div>
      <TableCust2
        ref={grid1Ref}
        batch={true}
        body={grid1}
        header={GRID1_HEADER}
        height="25rem"
        width="100%"
        onCustumizeText={(k, v) => {
          var ret = v;
          if (k === "date") {
            ret =
              String(v).substring(0, 4) +
              "-" +
              String(v).substring(4, 6) +
              "-" +
              String(v).substring(6, 8);
          } else if (k === "time") {
            ret = String(v).substring(0, 2) + ":" + String(v).substring(2, 4);
          } else if (k === "mode") {
            if (v === "1") {
              ret = "출근";
            } else if (v === "2") {
              ret = "퇴근";
            } else {
              ret = "출입";
            }
          }
          return ret;
        }}
        onClick={async (r) => {
          rowClick(r);
          return false;
        }}
      />
    </div>
  );
}
