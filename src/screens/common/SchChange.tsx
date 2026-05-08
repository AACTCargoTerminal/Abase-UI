import { useEffect, useState } from "react";
import { CommonDatePicker } from "../../comp/DropDown";
import moment from "moment";
import { getApi, sendLoading } from "../../Util/Util";
import type { ModalComp, TableRow } from "../../Util/Type";
import { TableCust } from "../../comp/Table";
import { SchChgHeader } from "../../Util/Header";
import { CommonInput } from "../../comp/Input";

export default function SchChange({ param, pgmId, outParam }: ModalComp) {
  const [fltDate, setFltDate] = useState(
    param["date"]
      ? moment(param["date"]).format("YYYYMMDD")
      : moment().format("YYYYMMDD")
  );
  const [dt, setDt] = useState<TableRow[]>([]);
  const [filterData, setFilterData] = useState<TableRow[]>([]);
  const [searchData, setSearchData] = useState<string>("");

  useEffect(() => {
    getSchP010_001();
  }, [fltDate]);

  useEffect(() => {
    if (searchData) {
      const filterTmp = dt.filter((item) =>
        String(item["FLIGHT_NO"]).includes(searchData.toUpperCase())
      );
      setFilterData(filterTmp);
    } else {
      setFilterData(dt);
    }
  }, [searchData, dt]);

  async function getSchP010_001() {
    sendLoading(true);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/sys/getSchP010_001?fltDate=${fltDate}&inoutFlag=${param["inout"]}`,
      pgmId: pgmId, //"WMSCH0040",
    });
    if (res.ok) {
      if (res.data) {
        setDt(res.data[0]);
        sendLoading(false);
        return;
      }
    }
    sendLoading(false);
  }
  return (
    <div className="px-[2%] py-[1%] flex flex-col gap-2">
      <div className="flex items-center justify-between w-full ">
        <div className="mainInput w-[60%] flex items-center gap-3">
          <div className="w-[50%] mainInput">
            {" "}
            <CommonDatePicker
              id="schDate"
              value={fltDate}
              onClick={(v) => setFltDate(v)}
              title="기준일자"
              colSize="20%"
            />
          </div>
          <div className="flex-1 mainInput">
            <CommonInput
              id="search"
              value={searchData}
              onChange={(v) => setSearchData(v)}
              label="검색"
              labelW="15%"
            />
          </div>
        </div>
      </div>
      <div>
        <TableCust
          body={filterData}
          header={SchChgHeader}
          tableId="schChg"
          height="30rem"
          width="100%"
          onClick={(r) => {
            outParam?.(r);
          }}
        />
      </div>
    </div>
  );
}
