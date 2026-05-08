import { useEffect, useState } from "react";
import { getApi } from "../../Util/Util";
import type { TableHeaderType, TableRow } from "../../Util/Type";
import { CommonContainer } from "../../comp/Container";
import { TableCust } from "../../comp/Table";
import { Btn, MobileBtn } from "../../comp/Btn";

const GRID1_HEADER: TableHeaderType[] = [
  {
    key: "IMPORTANCE_FLAG",
    value: "중요",
    w: "5rem",
    option: { type: "ICON", icon: "PIN", color: "#D30000", value: "Y" },
  },
  { key: "BOARD_TITLE", value: "제목", w: "70rem", sum: 0 },
  { key: "QUERY_COUNT", value: "조회수", w: "5rem" },
  { key: "POST_TIME", value: "게시 일시", w: "10rem" },
  { key: "UPDATED_USER_NAME", value: "게시자", w: "8rem" },
];

export default function Board({ deviceType }: { deviceType: "MOBILE" | "PC" }) {
  const [grid1, setGrid1] = useState<TableRow[]>([]);
  const [grid1Header, setGrid1Header] =
    useState<TableHeaderType[]>(GRID1_HEADER);
  useEffect(() => {
    getBoardL010_001();
  }, []);

  useEffect(() => {
    if (deviceType === "PC") {
      setGrid1Header(GRID1_HEADER);
    } else {
      const tmp = GRID1_HEADER.map((v) => {
        if (v.key === "IMPORTANCE_FLAG") {
          return { ...v, w: "3rem" };
        } else if (v.key === "BOARD_TITLE") {
          return { ...v, w: "10rem" };
        } else if (v.key === "UPDATED_USER_NAME") {
          return { ...v, w: "4rem" };
        } else if (v.key === "POST_TIME") {
          return { ...v, w: "7rem" };
        } else {
          return { ...v, disable: true };
        }
      });
      setGrid1Header(tmp);
    }
  }, [deviceType]);

  async function getBoardL010_001() {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "SYS",
      method: "GET",
      url: "/sys/getBoardL010_001",
      pgmId: "pgm_id",
    });

    if (res.ok) {
      if (res.data) {
        setGrid1(res.data[0]);
      }
    }
  }
  return (
    <div className={`${deviceType === "PC" ? "py-[1%] pr-[1%]" : "px-[1%]"}`}>
      <CommonContainer
        title="AACT 사내 공지 게시판"
        width="100%"
        deviceType={deviceType}
        childrenTitle={
          <div className={`w-full flex items-center justify-end gap-3`}>
            <div className="mainInput">
              <Btn
                txt="SEARCH"
                type="SEARCH"
                onClick={() => {
                  getBoardL010_001();
                }}
                deviceType={deviceType}
              />
            </div>
            <div className="mainInput">
              <Btn txt="NEW" type="SAVE" deviceType={deviceType} />
            </div>
            <div className="mainInput">
              <Btn txt="DEL" type="DELETE" deviceType={deviceType} />
            </div>
            <div className="mainInput">
              <Btn txt="EXCEL" type="EXCEL" deviceType={deviceType} />
            </div>
          </div>
        }>
        <TableCust
          body={grid1}
          header={grid1Header}
          height={`${deviceType === "PC" ? "45rem" : "30rem"}`}
          onClick={(v) => {}}
          tableId="grid1"
          width="100%"
        />
      </CommonContainer>
    </div>
  );
}
