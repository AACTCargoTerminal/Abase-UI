import { useEffect, useState } from "react";
import type { ModalComp } from "../../Util/Type";
import { CommonInput } from "../../comp/Input";

export default function WorkHrReqDeny({
  param,
  onClose,
  pgmId,
  headerAction,
  outParam,
}: ModalComp) {
  const [params, setParams] = useState<{
    year?: string;
    mon?: string;
    day?: string;
    seq?: number;
    userSid?: number;
    userId?: string;
    userName?: string;
    date?: string;
  }>({});
  useEffect(() => {
    if (param?.["YEAR"]) {
      setParams((prev) => ({ ...prev, year: param["YEAR"] }));
    }
    if (param?.["MON"]) {
      setParams((prev) => ({ ...prev, mon: param["MON"] }));
    }
    if (param?.["DAY"]) {
      setParams((prev) => ({ ...prev, day: param["DAY"] }));
    }
    if (param?.["USER_SID"]) {
      setParams((prev) => ({ ...prev, userSid: param["USER_SID"] }));
    }
    if (param?.["SEQ"]) {
      setParams((prev) => ({ ...prev, seq: param["SEQ"] }));
    }
    if (param?.["USER_ID"]) {
      setParams((prev) => ({ ...prev, userId: param["USER_ID"] }));
    }
    if (param?.["USER_NAME"]) {
      setParams((prev) => ({ ...prev, userName: param["USER_NAME"] }));
    }
    if (param?.["REQ_DATE"]) {
      setParams((prev) => ({ ...prev, date: param["REQ_DATE"] }));
    }
  }, [param]);

  const [remark, setRemark] = useState("");

  return (
    <div className="px-[5%] py-[2%] grid grid-cols-[0.8fr_1fr] gap-3">
      <div className="mainInput">
        <CommonInput
          id="date"
          value={params?.date || ""}
          read={true}
          label="요청날짜"
          labelW="30%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id="userInfo"
          value={(params?.userName || "") + " / " + (params?.userId || "")}
          read={true}
          label="사용자 명/사번"
        />
      </div>
      <div className="mainInput col-span-2">
        <CommonInput
          id="userInfo"
          value={remark}
          onChange={(v) => setRemark(v)}
          label="사유"
          labelW="13%"
        />
      </div>
    </div>
  );
}
