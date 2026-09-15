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

export default function WorkHrCapsSearch({
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

  const [grid1, setGrid1] = useState<TableRow[]>([]);
  const grid1Ref = useRef<TableHandle | null>(null);

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

  return (
    <div className="mx-[5%] my-[5%]">
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
      />
    </div>
  );
}
