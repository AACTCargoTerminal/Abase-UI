import { Route, Routes } from "react-router-dom";
import { type TableHeaderType, type TableRow } from "../../Util/Type";
import { useEffect, useState } from "react";
import { getApi, getUUID } from "../../Util/Util";
import { useDispatch } from "react-redux";
import { pushError } from "../../slices/err";
import alertImg from "../../assets/images/anyboardimg.jpg";
import { TableCust } from "../../comp/Table";
import { Btn } from "../../comp/Btn";

const anyHeader: TableHeaderType[] = [
  { key: "BOARD_TITLE", value: "제목", w: "30rem", type: "STR" },
  { key: "POST_TIME", value: "작성일", w: "10rem", type: "STR" },
  { key: "REPLY_TIME", value: "답변일", w: "10rem", type: "STR" },
];

export default function AnyBoard({
  changePage,
  headerAction,
}: {
  changePage: (value: number, select: TableRow) => void;
  headerAction?: {
    type: string;
    pageIndex?: number;
  } | null;
}) {
  const [data, setData] = useState<TableRow[]>([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!headerAction) return;

    if (headerAction.type === "SEARCH") {
      getAnyList();
    }
  }, [headerAction]);

  async function getAnyList() {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: "/any/getAnyList",
      pgmId: "ANY",
    });
    if (res.ok) {
      dispatch(pushError({ id: getUUID(), errFlag: "C", errMsg: "조회완료" }));

      if (res.data) {
        setData(res.data[0]);
      } else {
        setData([]);
      }
    }
  }

  useEffect(() => {
    getAnyList();
  }, []);

  return (
    <>
      <div>
        <div className="flex w-full justify-center py-[1%]">
          <TableCust
            tableId="anyTable"
            header={anyHeader}
            body={data}
            onClick={(value) => {
              changePage(1, value);
            }}
            height="23rem"
            width="80%"
          />
        </div>
        <img src={alertImg} />
      </div>
    </>
  );
}
