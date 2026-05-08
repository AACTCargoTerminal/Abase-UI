import { useEffect, useState } from "react";
import { CommonInput, TimeInput } from "../../comp/Input";
import type { ModalComp, TableRow } from "../../Util/Type";
import { getApi, sendLoading } from "../../Util/Util";
import { Divider } from "../../comp/Common";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { fsuTimeHeader } from "../../Util/Header";

const data: TableRow[] = [
  { KEY: "", VALUE: "-" },
  { KEY: "S", VALUE: "Schedule" },
  { KEY: "E", VALUE: "Estimate" },
  { KEY: "A", VALUE: "Actual" },
];

export default function FsuDep({
  param,
  onClose,
  pgmId,
  headerAction,
}: ModalComp) {
  if (!param) {
    onClose();
    return null;
  }
  const type: string = param["type"];
  const mawbArray: string[] = param["mawb_no"];
  const schSid: number = param["schedule_sid"];
  const sitaAddr: string = param["sita_addr"];

  if (!mawbArray || !schSid || !type) {
    onClose();
    return null;
  }

  useEffect(() => {
    select();
  }, [mawbArray]);

  const [dt, setDt] = useState<TableRow>({});
  useEffect(() => {
    if (!headerAction) return;
    if (headerAction.type === "SAVE") {
      save();
    }
    if (headerAction.type === "SEND SCREEN") {
      onClose();
    }
  }, [headerAction, dt]);
  async function select() {
    sendLoading(true);
    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/fsu/getFsu_001?type=${type}&schSid=${schSid}&mawb=${mawbArray[0]}`,
      pgmId: pgmId,
      sucFlag: true,
    });

    if (ret.ok) {
      if (ret.data) {
        setDt(ret.data[0][0]);

        sendLoading(false);
        return;
      }
    }
    setDt({});
    sendLoading(false);
  }

  async function save() {
    sendLoading(true);

    const saveDt = new Map();

    saveDt.set("schSid", schSid);
    saveDt.set("mawbArray", mawbArray);
    saveDt.set("sitaAddr", sitaAddr);

    Object.keys(dt).forEach((key) => {
      saveDt.set(key, dt[key] || "");
    });

    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "POST",
      url: `/fsu/setFsu_Dep_011`,
      pgmId: pgmId,
      params: saveDt,
      sucFlag: true,
    });

    sendLoading(false);
  }

  const [mawb, setMawb] = useState(mawbArray.join(","));

  return (
    <div className="grid grid-cols-2 p-[2%] gap-y-3 gap-x-5">
      <div className="col-span-2 mainInput">
        <CommonInput
          id={`mawb`}
          value={mawb}
          onChange={(v) => {
            setMawb(v);
          }}
          label={`MAWB No`}
          labelW="19.5%"
        />
      </div>
      <div className="col-span-2">
        <Divider align="Horizen" />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`pcs`}
          value={dt?.["QTY_NO_OF_PIECES"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, QTY_NO_OF_PIECES: v }));
          }}
          label={`Accepted Pcs`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`wt`}
          value={dt?.["WEIGHT"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, WEIGHT: v }));
          }}
          label={`Accepted Wt`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Origin`}
          value={dt?.["ORG_AIRPORT_CODE"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, ORG_AIRPORT_CODE: v }));
          }}
          label={`Origin`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Dest`}
          value={dt?.["DEST_AIRPORT_CODE"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, DEST_AIRPORT_CODE: v }));
          }}
          label={`Dest`}
          labelW="40%"
        />
      </div>
      <div className="col-span-2">
        <Divider align="Horizen" />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Pcs`}
          value={dt?.["QTY_NO_OF_PIECES_DEP"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, QTY_NO_OF_PIECES_DEP: v }));
          }}
          label={`Pcs`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Wt`}
          value={dt?.["WEIGHT_DEP"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, WEIGHT_DEP: v }));
          }}
          label={`Wt`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Flight No`}
          value={dt?.["FLIGHT_NO"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, FLIGHT_NO: v }));
          }}
          label={`Flight No`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonDatePicker
          id={`Departure`}
          title="Departure"
          value={dt?.["DEPARTURE_DATE"] || ""}
          onClick={(v) => setDt((prev) => ({ ...prev, DEPARTURE_DATE: v }))}
          colSize="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Arr.Airport`}
          value={dt?.["DEP_AIRPORT_CODE"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, DEP_AIRPORT_CODE: v }));
          }}
          label={`Arr.Airport`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Arr.Airport`}
          value={dt?.["ARR_AIRPORT_CODE"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, ARR_AIRPORT_CODE: v }));
          }}
          label={`Arr.Airport`}
          labelW="40%"
        />
      </div>

      <div className="flex gap-2">
        <div className="mainInput w-full">
          <CommonDropDown
            title="Dep.Time"
            id="Departure Time"
            header={fsuTimeHeader}
            data={data}
            dropHeight="10%"
            inputKey={{
              key: "KEY",
              showKey: "0",
              value: dt?.["DEP_TIME_TYPE_ID"],
            }}
            onClick={(r) => {
              setDt((prev) => ({ ...prev, DEP_TIME_TYPE_ID: r["KEY"] }));
            }}
            labelW="52.5%"
          />
        </div>
        <div className=" mainInput w-[25%]">
          {" "}
          <TimeInput
            value={dt?.["DEPARTURE_TIME"]}
            id="depTime"
            onChange={(v) => {
              setDt((prev) => ({ ...prev, DEPARTURE_TIME: v }));
            }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="mainInput w-full">
          <CommonDropDown
            title="Arr.Time"
            id="Arr.Time"
            header={fsuTimeHeader}
            data={data}
            dropHeight="10%"
            inputKey={{
              key: "KEY",
              showKey: "0",
              value: dt?.["ARR_TIME_TYPE_ID"],
            }}
            onClick={(r) => {
              setDt((prev) => ({ ...prev, ARR_TIME_TYPE_ID: r["KEY"] }));
            }}
            labelW="52.5%"
          />
        </div>
        <div className="mainInput w-[25%]">
          {" "}
          <TimeInput
            value={dt?.["ARRIVAL_TIME"]}
            id="arrTime"
            onChange={(v) => {
              setDt((prev) => ({ ...prev, ARRIVAL_TIME: v }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
