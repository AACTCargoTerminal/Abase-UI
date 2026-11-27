import { useCallback, useEffect, useState } from "react";
import { type ModalComp, type TableRow } from "../../Util/Type";
import {
  checkPdfPassword,
  getApi,
  getClass,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { CommonInput, CommonLabel } from "../../comp/Input";
import { CommonDropDown } from "../../comp/DropDown";
import { commonHeader7 } from "../../Util/Header";
import { signAsync } from "../../signService";

export default function WorkNightInsert({
  pgmId,
  param,
  onClose,
  headerAction,
  closeParam,
  outParam,
  sendParam,
}: ModalComp) {
  if (
    !param?.["DATE"] ||
    !param?.["USER_SID"] ||
    param?.["SEQ"] === undefined
  ) {
    onClose?.();
    return;
  }

  useEffect(() => {
    getClass("HRCOS", pgmId)
      .then((v) => setHrcos(v))
      .catch((v) => setHrcos([]));
    search();
  }, []);

  const search = useCallback(async () => {
    sendLoading(true);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "GET",
      url: `/work/getWorkM010_004?dateStr=${String(param?.["DATE"]).replaceAll("-", "")}&seq=${param?.["SEQ"]}&userSid=${param?.["USER_SID"]}`,
      pgmId: pgmId,
    });
    sendLoading(false);
    if (res.ok) {
      if (res.data?.[0]) {
        const tmpDt = res.data?.[0]?.[0] || {};
        setDt(tmpDt);
        return;
      }
    }
  }, []);

  const [hrcos, setHrcos] = useState<TableRow[]>([]);
  const [dt, setDt] = useState<TableRow>({});

  useEffect(() => {
    if (headerAction?.type) {
      if (headerAction?.type === "저장") {
        save();
      } else if (headerAction?.type === "등본제출") {
        document.getElementById("cerPdf")?.click();
      }
    }
  }, [headerAction?.type]);

  const cerPdfClick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";

      if (!file) {
        return;
      }

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        sendErr("PDF 파일만 업로드할 수 있습니다.");
        return;
      }

      const hasPassword = await checkPdfPassword(file);
      if (hasPassword) {
        sendErr("비밀번호 설정된 PDF는 업로드할 수 없습니다.");
        return;
      }

      const tmpDate = String(param?.["DATE"]).replaceAll("-", "");
      const map = new Map<string, any>();
      map.set("year", tmpDate.substring(0, 4));
      map.set("mon", tmpDate.substring(4, 6));
      map.set("day", tmpDate.substring(6, 8));
      map.set("seq", param["SEQ"]);
      map.set("userSid", param["USER_SID"]);
      map.set("imgType", "NGCER");
      sendLoading(true);

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "POST",
        url: `/work/setWorkM010_018`,
        params: map,
        files: [file],
        pgmId: pgmId,
        sucFlag: true,
      });

      sendLoading(false);
      if (res.ok) {
        await save();
      }
    },
    [pgmId, dt],
  );

  const save = useCallback(async () => {
    const signRet = await signAsync({});

    if (!signRet) {
      sendErr("서명은 필수사항입니다.");
      return;
    }
    const map = new Map();
    map.set("year", dt?.["YEAR"] || "");
    map.set("mon", dt?.["MON"] || "");
    map.set("day", dt?.["DAY"] || "");
    map.set("seq", dt?.["SEQ"] !== undefined ? dt?.["SEQ"] : 0);
    map.set("userSid", dt?.["USER_SID"] || "");
    map.set("code", dt?.["CODE_CODE"] || "");
    map.set("value1", dt?.["VALUE1"] || "");
    map.set("remark", dt?.["REMARK"] || "");
    map.set("startTime", dt?.["START_TIME"] || "");
    map.set("endTime", dt?.["END_TIME"] || "");
    map.set("userId", dt?.["USER_ID"] || "");
    map.set("addDay", dt?.["ADD_DAY"] !== undefined ? dt?.["ADD_DAY"] : 0);
    sendLoading(true);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "POST",
      url: `/work/setWorkM010_014_1`,
      params: map,
      files: [signRet],
      pgmId: pgmId,
      sucFlag: true,
    });
    sendLoading(false);
    if (res.ok) {
      closeParam?.({ SAVE: res.ok });
      onClose?.();
    }
  }, [dt]);
  return (
    <div className="grid grid-cols-2 py-[1%] px-[5%] gap-y-2 gap-x-2">
      <div className="mainInput ">
        <CommonInput
          id="workType"
          value={`${dt?.["CODE_NAME"] || ""}`}
          read={true}
          label="예정근무"
          labelW="30%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id="otType"
          value={`${dt?.["REQ_TIME"] || ""}`}
          read={true}
          label="시간외근무"
          labelW="30%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id="capsType"
          value={`${(dt?.["CAPS_START_TIME"] || "") + " ~ " + dt?.["CAPS_END_TIME"] || ""}`}
          read={true}
          label="캡스시간"
          labelW="30%"
        />
      </div>
      <div />
      <div className="mainInput">
        <CommonDropDown
          id="hrcos"
          data={hrcos}
          dropHeight="15rem"
          header={commonHeader7}
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: dt?.["CODE_CODE"] || "",
          }}
          onClick={(v) => {
            setDt((prev) => ({ ...prev, CODE_CODE: v?.["CODE_CODE"] || "" }));
          }}
          title="지역"
          labelW="31.5%"
        />
      </div>
      {hrcos.find((v) => v?.["CODE_CODE"] === dt?.["CODE_CODE"])?.[
        "VALUE2_CHAR"
      ] === "Y" ? (
        <div className="mainInput">
          <CommonInput
            id="arrea"
            value={dt?.["VALUE1"] || ""}
            label="상세지역"
            labelW="30%"
            onChange={(v) => setDt((prev) => ({ ...prev, VALUE1: v }))}
            holder="인천시 영종구"
          />
        </div>
      ) : (
        <div />
      )}
      <div className="mainInput col-span-2">
        <CommonInput
          id="remark"
          value={dt?.["REMARK"] || ""}
          label="사유"
          labelW="14%"
          onChange={(v) => setDt((prev) => ({ ...prev, REMARK: v }))}
        />
      </div>
      <input
        id="cerPdf"
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => {
          cerPdfClick(e);
        }}
        className="hidden"
      />
    </div>
  );
}
