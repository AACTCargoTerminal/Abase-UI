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

export default function FsuFoh({
  param,
  onClose,
  pgmId,
  headerAction,
  outParam,
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
    saveDt.set("mawb", mawbArray[0]);
    saveDt.set("sitaAddr", sitaAddr);

    Object.keys(dt).forEach((key) => {
      saveDt.set(key, dt[key] || "");
    });

    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "POST",
      url: `/fsu/setFsu_Foh_011`,
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
          id={`RcfPcs`}
          value={dt?.["QTY_NO_OF_PIECES"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, QTY_NO_OF_PIECES: v }));
          }}
          label={`Pcs`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`RcfWt`}
          value={dt?.["WEIGHT"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, WEIGHT: v }));
          }}
          label={`Wt`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonDatePicker
          id={`Date`}
          title="Receipt Date"
          value={dt?.["ACTUAL_DATE"] || ""}
          onClick={(v) => setDt((prev) => ({ ...prev, ACTUAL_DATE: v }))}
          colSize="40%"
        />
      </div>
      <div className=" mainInput">
        {" "}
        <TimeInput
          value={dt?.["ACTUAL_TIME"]}
          id="Time"
          onChange={(v) => {
            setDt((prev) => ({ ...prev, ACTUAL_TIME: v }));
          }}
          label="Time"
          labelW="40%"
        />
      </div>
      <div className="col-span-2 mainInput">
        <CommonInput
          id={`Shipper`}
          value={dt?.["NAME"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, NAME: v }));
          }}
          label={`Shipper`}
          labelW="20%"
        />
      </div>
    </div>
  );
}
