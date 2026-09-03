import { useCallback, useEffect, useState } from "react";
import type {
  ModalComp,
  TableHeaderType,
  TableRow,
  ToggleType,
} from "../../Util/Type";
import {
  confirmObj,
  convDateAndTime,
  getApi,
  getClass,
  getDiffDays,
  getInt,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { CommonInput, TimeInput } from "../../comp/Input";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { signAsync } from "../../signService";
import { useSelector } from "react-redux";
import type { RootState } from "../../slices/store";

dayjs.extend(customParseFormat);

const HEADER: TableHeaderType[] = [{ key: "SEQ", value: "", w: "5rem" }];
export default function WorkTimeInsert({
  pgmId,
  param,
  onClose,
  headerAction,
  closeParam,
  outParam,
  sendParam,
}: ModalComp) {
  useEffect(() => {
    if (
      param?.["date"] !== undefined &&
      param?.["userSid"] !== undefined &&
      param?.["seq"] !== undefined
    ) {
      setParams({
        date: param["date"],
        selectDt: param["seq"],
        userSid: param["userSid"],
      });
    } else {
      onClose();
    }
  }, [param]);

  const teamCode = useSelector(
    (state: RootState) =>
      state.user.userInfo?.relArray?.find(
        (v) => v?.["CLASS_CODE"] === "HRPAT",
      )?.["CODE_CODE"] || "",
  );

  useEffect(() => {
    getClass("HRPAT", pgmId)
      .then((v) => {
        const tmp = v.find((tv) => tv?.["CODE_CODE"] === teamCode);
        if (tmp) {
          if (tmp?.["VALUE1_NUMBER"] === 1) {
            setManualFlag(true);
            return;
          }
        }
        setManualFlag(false);
      })
      .catch((v) => setManualFlag(false));
  }, []);

  const [manualFlag, setManualFlag] = useState<boolean>(false);

  const [params, setParams] = useState<{
    date: string;
    userSid: number;
    selectDt: number;
  }>({ date: "", selectDt: -1, userSid: 0 });

  const [dt, setDt] = useState<TableRow[]>([]);

  const [capsEndDate, setCapsEndDate] = useState(dayjs().format("YYYYMMDD"));
  const [capsStartTime, setCapsStartTime] = useState("0000");
  const [capsEndTime, setCapsEndTime] = useState("0000");
  const [remark, setRemark] = useState("");

  const [addhour, setAddhour] = useState(0);
  const [nighthour, setNighthour] = useState(0);
  const [holihour, setholihour] = useState(0);
  const [holiAddHour, setHoliAddHour] = useState(0);

  useEffect(() => {
    if (headerAction?.type) {
      if (headerAction?.type === "저장") {
        saveClick();
      }
    }
  }, [headerAction?.type]);

  useEffect(() => {
    if (params?.date) {
      search();
    }
  }, [params?.date]);

  useEffect(() => {
    const tmpDt = dt?.find((v) => v?.["SEQ"] === params.selectDt);

    if (tmpDt) {
      setCapsStartTime(tmpDt?.["START_TIME"] || "0000");
      setCapsEndDate(
        tmpDt?.["REQ_END_DATE"] ||
          dayjs(params.date, "YYYYMMDD").format("YYYYMMDD"),
      );
      setCapsEndTime(tmpDt?.["END_TIME"] || "0000");
      setRemark(tmpDt?.["REMARK"] || "");
      setAddhour(tmpDt?.["ADD_WORK_HOUR"] || 0);
      setNighthour(tmpDt?.["NIGHT_WORK_HOUR"] || 0);
      setholihour(tmpDt?.["HOLIDAY_WORK_HOUR"] || 0);
      setHoliAddHour(tmpDt?.["HOLIDAY_ADD_HOUR"] || 0);
    }
  }, [dt, params.selectDt]);

  const search = useCallback(async () => {
    sendLoading(true);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "GET",
      url: `/work/getWorkM010_003?date=${params.date}&seq=${params.selectDt}&userSid=${params.userSid}`,
      pgmId: pgmId,
    });
    sendLoading(false);
    if (res.ok) {
      if (res.data?.[0]) {
        const tmpDt = res.data?.[0]?.[0];
        if (tmpDt) {
          setParams({
            date: params.date,
            selectDt: tmpDt?.["SEQ"] === undefined ? -1 : tmpDt["SEQ"],
            userSid: tmpDt?.["USER_SID"],
          });
        }
        setDt(res.data[0]);
        return;
      }
    } else {
      onClose?.();
    }
  }, [params]);

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
    const tmpDt = dt?.[params.selectDt];

    if (!tmpDt || Object.keys(tmpDt).length === 0) {
      sendErr("선택한 스케줄이 없습니다.");
      return;
    }
    const diffDay = getDiffDays(params.date, capsEndDate);
    if (diffDay === -1 || diffDay > 1) {
      sendErr("날짜 설정이 잘못됐습니다.");
      return;
    }

    if (!remark) {
      sendErr("사유는 필수입력입니다.");
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
    tmp.set("userSid", tmpDt?.["USER_SID"] || 0);
    tmp.set("reqStartDate", params.date);
    tmp.set("seq", params.selectDt);
    tmp.set("addDay", diffDay);
    tmp.set("reqStartTime", capsStartTime);
    tmp.set("reqEndTime", capsEndTime);
    tmp.set("addHour", addhour);
    tmp.set("nightHour", nighthour);
    tmp.set("holiHour", holihour);
    tmp.set("holiAddHour", holiAddHour);
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
    capsEndDate,
    capsStartTime,
    capsEndTime,
    params.date,
    remark,
    params.selectDt,
    addhour,
    nighthour,
    holihour,
    holiAddHour,
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
          inputKey={{ key: "SEQ", showKey: "0", value: params.selectDt }}
          onClick={(r) =>
            setParams((prev) => ({
              ...prev,
              selectDt: getInt(r?.["seq"] || 0),
            }))
          }
          labelW="55%"
        />
      </div>
      <div />
      <div className="mainInput col-span-2">
        <CommonInput
          id="workType"
          value={`${dt?.[params.selectDt]?.["CODE_CODE"] || ""}  >  ${dt?.[params.selectDt]?.["CODE_NAME"] || ""}`}
          read={true}
          label="예정근무"
          labelW="25%"
        />
      </div>
      {dt?.[params.selectDt]?.["CAPS_START_TIME"] &&
        dt?.[params.selectDt]?.["CAPS_END_TIME"] && (
          <div className="mainInput col-span-2">
            <CommonInput
              id="workType"
              value={`${
                dt?.[params.selectDt]?.["CAPS_START_TIME"] === "XXXX"
                  ? dt?.[params.selectDt]?.["CAPS_START_TIME"]
                  : dayjs(
                      dt?.[params.selectDt]?.["CAPS_START_TIME"] || "0000",
                      "HHmm",
                    ).format("HH:mm")
              } ~ ${
                dt?.[params.selectDt]?.["CAPS_END_TIME"] === "XXXX"
                  ? dt?.[params.selectDt]?.["CAPS_END_TIME"]
                  : dayjs(
                      dt?.[params.selectDt]?.["CAPS_END_TIME"] || "0000",
                      "HHmm",
                    ).format("HH:mm")
              }`}
              read={true}
              label="캡스 시간"
              labelW="25%"
            />
          </div>
        )}

      <div className="col-span-2 grid grid-cols-[75%_20%] items-center gap-2">
        <div className="mainInput">
          <CommonInput
            id="startDate"
            value={convDateAndTime("DATE", params.date)}
            read={true}
            label="근무시작시간"
            labelW="33.5%"
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
                document.getElementById("capsEndTime")?.focus();
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
                if (manualFlag) {
                  document.getElementById("addhour")?.focus();
                }
              }
            }}
          />
        </div>
      </div>
      {manualFlag && (
        <>
          <div className="mainInput">
            {" "}
            <CommonInput
              id="addhour"
              value={addhour.toString()}
              onChange={(v) => {
                const tmp = confirmObj({ type: "DOUBLE", fix: 1, obj: v });
                setAddhour(Math.ceil(Number(tmp) * 2) / 2.0);
                document.getElementById("nightHour")?.focus();
              }}
              label="연장근무"
              labelW="50%"
            />
          </div>
          <div className="mainInput">
            {" "}
            <CommonInput
              id="nightHour"
              value={nighthour.toString()}
              onChange={(v) => {
                const tmp = confirmObj({ type: "DOUBLE", fix: 1, obj: v });
                setNighthour(Math.ceil(Number(tmp) * 2) / 2.0);
                document.getElementById("holiHour")?.focus();
              }}
              label="야간근무"
              labelW="50%"
            />
          </div>
          <div className="mainInput">
            {" "}
            <CommonInput
              id="holiHour"
              value={holihour.toString()}
              onChange={(v) => {
                const tmp = confirmObj({ type: "DOUBLE", fix: 1, obj: v });
                setholihour(Math.ceil(Number(tmp) * 2) / 2.0);
                document.getElementById("holiAddHour")?.focus();
              }}
              label="휴일근무"
              labelW="50%"
            />
          </div>
          <div className="mainInput">
            {" "}
            <CommonInput
              id="holiAddHour"
              value={holiAddHour.toString()}
              onChange={(v) => {
                const tmp = confirmObj({ type: "DOUBLE", fix: 1, obj: v });
                setHoliAddHour(Math.ceil(Number(tmp) * 2) / 2.0);
              }}
              label="휴일연장"
              labelW="50%"
            />
          </div>
        </>
      )}
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
