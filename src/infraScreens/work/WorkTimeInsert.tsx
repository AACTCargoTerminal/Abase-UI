import { useCallback, useEffect, useState } from "react";
import type {
  ModalComp,
  TableHeaderType,
  TableRow,
  ToggleType,
} from "../../Util/Type";
import { getApi, getInt, sendErr, sendLoading } from "../../Util/Util";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { CommonInput, TimeInput } from "../../comp/Input";
import { ToggleBtn } from "../../comp/Common";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { confirmAsync } from "../../confirmService";
import { signAsync } from "../../signService";

dayjs.extend(customParseFormat);

const HEADER: TableHeaderType[] = [{ key: "seq", value: "", w: "5rem" }];
export default function WorkTimeInsert({
  pgmId,
  param,
  onClose,
  headerAction,
  closeParam,
  outParam,
  sendParam,
}: ModalComp) {
  if (!param?.["date"]) {
    onClose();
    return null;
  }

  const [date, setDate] = useState(param["date"]);
  const [dt, setDt] = useState<TableRow[]>([]);
  const [selectDt, setSelectDt] = useState(0);

  const [capsStartDate, setCapsStartDate] = useState("");
  const [capsEndDate, setCapsEndDate] = useState("");
  const [capsStartTime, setCapsStartTime] = useState("0000");
  const [capsEndTime, setCapsEndTime] = useState("0000");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (headerAction?.type) {
      if (headerAction?.type === "저장") {
        saveClick();
      }
    }
  }, [headerAction?.type]);

  useEffect(() => {
    if (date) {
      search();
    }
  }, [date]);

  useEffect(() => {
    const tmpDt = dt?.[selectDt];
    setCapsStartDate(tmpDt?.["capsStartDate"] || "");
    setCapsStartTime(tmpDt?.["capsStartTime"] || "0000");
    setCapsEndDate(tmpDt?.["capsEndDate"] || "");
    setCapsEndTime(tmpDt?.["capsEndTime"] || "0000");
    setRemark("");
  }, [selectDt]);

  const search = useCallback(async () => {
    sendLoading(true);
    const res = await getApi<TableRow[]>({
      baseUrl: "INFRA",
      method: "GET",
      url: `/work/getWorkCapsData?date=${date}&seq=${selectDt}`,
      pgmId: pgmId,
    });
    sendLoading(false);
    if (res.ok) {
      if (res.data?.[0]) {
        const tmpDt = res.data[0];
        setCapsStartDate(tmpDt?.["capsStartDate"] || "");
        setCapsStartTime(tmpDt?.["capsStartTime"] || "0000");
        setCapsEndDate(tmpDt?.["capsEndDate"] || "");
        setCapsEndTime(tmpDt?.["capsEndTime"] || "0000");
        setRemark(tmpDt?.["remark"] || "");
        setDt(res.data);
        return;
      }
    }
    onClose();
  }, [date, selectDt]);

  function floorTo30(hhmm: string) {
    if (!hhmm || hhmm.length < 4) return null;

    let hour = parseInt(hhmm.substring(0, 2), 10);
    let minute = parseInt(hhmm.substring(2, 4), 10);

    // 🔥 핵심 조건 (자바랑 동일)
    if (minute >= 55 || minute < 25) {
      minute = 0;
    } else {
      minute = 30;
    }

    // 24시 처리
    if (hour === 24) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}`;
  }

  const saveClick = useCallback(async () => {
    if (capsStartTime === "0000" || capsEndTime === "0000" || !remark) {
      sendErr("근무시간 또는 사유는 필수입력입니다.");
      return;
    }

    const workType = dt?.[selectDt]?.["workType"] || "";
    if (!workType) {
      sendErr("해당날짜의 근무코드가 없습니다.");
      return;
    }

    if (!remark) {
      sendErr("사유를 입력하여주세요.");
      return;
    }

    const signRet = await signAsync({});

    if (!signRet) {
      sendErr("서명은 필수사항입니다.");
      return;
    }

    const tmp = new Map<string, any>();
    tmp.set("date", date);
    tmp.set("seq", selectDt);
    tmp.set("workType", workType);
    tmp.set("capsStartDate", capsStartDate);
    tmp.set("capsEndDate", capsEndDate);
    tmp.set("capsStartTime", capsStartTime);
    tmp.set("capsEndTime", capsEndTime);
    tmp.set("capsOrgStartTime", dt?.[selectDt]?.["capsOrgStartTime"] || "");
    tmp.set("capsOrgEndTime", dt?.[selectDt]?.["capsOrgEndTime"] || "");
    tmp.set("remark", remark);

    sendLoading(true);
    const res = await getApi<TableRow[]>({
      baseUrl: "INFRA",
      method: "POST",
      url: `/work/setWorkM010_019`,
      params: tmp,
      files: [signRet],
      pgmId: pgmId,
      sucFlag: true,
    });
    sendLoading(false);
    if (res.ok) {
      closeParam?.({ SAVE: res.ok });
      onClose?.();
    }
  }, [
    capsStartDate,
    capsEndDate,
    capsStartTime,
    capsEndTime,
    date,
    remark,
    selectDt,
  ]);
  return (
    <div className="grid grid-cols-2 py-[1%] px-[5%] gap-y-2 gap-x-2">
      <div className="mainInput">
        <CommonDropDown
          title="스케줄 순번"
          data={dt}
          dropHeight="10rem"
          header={HEADER}
          id="seqArray"
          inputKey={{ key: "seq", showKey: "0", value: selectDt }}
          onClick={(r) => setSelectDt(getInt(r?.["seq"] || "0"))}
          labelW="55%"
        />
      </div>
      <div />
      <div className="mainInput col-span-2">
        <CommonInput
          id="workType"
          value={`${dt?.[selectDt]?.["workType"] || ""}  >  ${dt?.[selectDt]?.["workTypeName"] || ""}`}
          read={true}
          label="예정근무"
          labelW="25%"
        />
      </div>
      <div className="mainInput col-span-2">
        <CommonInput
          id="workType"
          value={`${dayjs(dt?.[selectDt]?.["capsOrgStartTime"], "HHmm").format(
            "HH:mm",
          )} ~ ${dayjs(dt?.[selectDt]?.["capsOrgEndTime"], "HHmm").format(
            "HH:mm",
          )}`}
          read={true}
          label="캡스 시간"
          labelW="25%"
        />
      </div>
      <div className="col-span-2 grid grid-cols-[75%_20%] items-center gap-2">
        <div className="mainInput">
          <CommonDatePicker
            id="capsStartDate"
            onClick={(v) => {
              setCapsStartDate(v);
            }}
            value={capsStartDate}
            title="근무시작시간"
            colSize="25%"
          />
        </div>
        <div className="mainInput">
          <TimeInput
            id="capsStartTime"
            value={capsStartTime}
            onChange={(v) => {
              const tmp = floorTo30(v);
              if (tmp) {
                setCapsStartTime(tmp);
              }
            }}
          />
        </div>
      </div>
      <div className="col-span-2 grid grid-cols-[75%_20%] items-center gap-2">
        <div className="mainInput">
          <CommonDatePicker
            id="capsEndDate"
            onClick={(v) => {
              setCapsEndDate(v);
            }}
            value={capsEndDate}
            title="근무종료시간"
            colSize="25%"
          />
        </div>
        <div className="mainInput">
          <TimeInput
            id="capsEndTime"
            value={capsEndTime}
            onChange={(v) => {
              const tmp = floorTo30(v);
              if (tmp) {
                setCapsEndTime(tmp);
              }
            }}
          />
        </div>
      </div>
      <div className="col-span-2">
        <div className="mainInput">
          {" "}
          <CommonInput
            id="remark"
            value={remark}
            onChange={(v) => setRemark(v)}
            label="사유"
            labelW="25%"
          />
        </div>
      </div>
    </div>
  );
}
