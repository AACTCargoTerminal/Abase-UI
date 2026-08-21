import { useCallback, useEffect, useState } from "react";
import type { ModalComp, TableHeaderType, TableRow } from "../../Util/Type";
import {
  getApi,
  getClass,
  getClassValue,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { CommonInput, DateInput } from "../../comp/Input";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { commonHeader2 } from "../../Util/Header";
import { MdHorizontalRule } from "react-icons/md";

export default function UserModal({
  param,
  onClose,
  pgmId,
  headerAction,
  outParam,
}: ModalComp) {
  useEffect(() => {
    if (param["userId"]) {
      setUserParam(param["userId"]);
    }
  }, [param["userId"]]);

  const [userParam, setUserParam] = useState<string>("");

  useEffect(() => {
    if (userParam) {
      searchClick(userParam);
    }
  }, [userParam]);

  useEffect(() => {
    if (headerAction?.type === "신규") {
      setUserParam("");
      setDt({});
    } else if (headerAction?.type === "저장") {
      saveClick();
    } else if (headerAction?.type === "삭제") {
      deleteClick();
    }
  }, [headerAction?.type]);

  const searchClick = useCallback(async (userId: string) => {
    sendLoading(true);
    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/user/getUserInfo2?userId=${userId}`,
      pgmId: pgmId,
    });
    sendLoading(false);
    if (ret.ok) {
      if (ret.data?.[0][0]) {
        setDt(ret.data[0][0]);
        return;
      }
    }
    setDt({});
  }, []);

  useEffect(() => {
    trmcdSelect();
    hrpatSelect();
  }, []);

  const [trmcd, setTrmcd] = useState<TableRow[]>([]); //터미널
  const [hrpat, setHrpat] = useState<TableRow[]>([]); //부서

  const [dt, setDt] = useState<TableRow>({});

  const deleteClick = useCallback(async () => {
    if (!dt?.["USER_ID"]) {
      sendErr("사용자 ID 가 없습니다.");
      return;
    }
    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/user/setUserDelete?userId=${dt["USER_ID"]}`,
      pgmId: pgmId,
      sucFlag: true,
    });
    if (ret.ok) {
      outParam?.({ SEARCH: "SEARCH" });
      onClose();
    }
  }, [dt?.["USER_ID"]]);

  async function trmcdSelect() {
    const data = await getClass("TRMCD", pgmId);
    setTrmcd(data);
  }

  async function hrpatSelect() {
    const data = await getClass("HRPAT", pgmId);
    setHrpat(data);
  }

  const saveClick = useCallback(async () => {
    if (Object.keys(dt).length === 0) {
      sendErr("정보가 없습니다.");
      return;
    }
    const map: Map<string, any> = new Map<string, any>();
    map.set("USER_SID", param?.["userSid"] || 0);
    map.set("USER_ID", dt?.["USER_ID"] || "");
    map.set("USER_ID_CHANGE", dt?.["USER_ID_CHANGE"] || "");
    map.set("USER_PASSWORD", dt?.["USER_PASSWORD"] || "");
    map.set("USER_PASSWORD_HP", dt?.["USER_PASSWORD_HP"] || "");
    map.set("USER_NAME1", dt?.["USER_NAME1"] || "");
    map.set("USER_NAME2", dt?.["USER_NAME2"] || "");
    map.set("TEAM_CODE", dt?.["TEAM_CODE"] || "");
    map.set("TEAM_DATE", dt?.["TEAM_DATE"] || "");
    map.set("JOIN_DAY", dt?.["JOIN_DAY"] || "");
    map.set("GROUP_JOIN_DAY", dt?.["GROUP_JOIN_DAY"] || "");
    map.set("TERMINAL_CODE", dt?.["TERMINAL_CODE"] || "");
    map.set("TERMINAL_NAME", dt?.["TERMINAL_NAME"] || "");

    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/user/setUserInfoMgm",
      params: map,
      pgmId: pgmId,
      sucFlag: true,
    });

    if (ret.ok) {
      outParam?.({ SEARCH: "SEARCH" });
      onClose();
    }
  }, [dt, param]);

  return (
    <div className="px-[3%] py-[5%] grid grid-cols-3 gap-5">
      <div className="mainInput">
        <CommonInput
          id="userId"
          value={dt?.["USER_ID"]}
          check={true}
          label="사용자 ID"
          labelW="45%"
          read={userParam.length > 0}
          onChange={(v) => setDt((prev) => ({ ...prev, ["USER_ID"]: v }))}
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id="pass"
          value={dt?.["USER_PASSWORD"]}
          check={true}
          label="암호"
          labelW="40%"
          onChange={(v) => setDt((prev) => ({ ...prev, ["USER_PASSWORD"]: v }))}
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id="hpPass"
          value={dt?.["USER_PASSWORD_HP"]}
          check={true}
          label="자료실 암호"
          labelW="40%"
          onChange={(v) =>
            setDt((prev) => ({ ...prev, ["USER_PASSWORD_HP"]: v }))
          }
        />
      </div>
      {userParam.length > 0 ? (
        <div className="mainInput">
          <CommonInput
            id="userIdChange"
            value={dt?.["USER_ID_CHANGE"]}
            check={true}
            label="변경할 사용자 ID"
            labelW="45%"
            onChange={(v) =>
              setDt((prev) => ({ ...prev, ["USER_ID_CHANGE"]: v }))
            }
          />
        </div>
      ) : (
        <div />
      )}

      <div className="mainInput">
        <CommonInput
          id="username1"
          value={dt?.["USER_NAME1"]}
          check={true}
          label="공용어 사용자 명"
          labelW="40%"
          onChange={(v) => setDt((prev) => ({ ...prev, ["USER_NAME1"]: v }))}
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id="username2"
          value={dt?.["USER_NAME2"]}
          check={true}
          label="한글 사용자 명"
          labelW="40%"
          onChange={(v) => setDt((prev) => ({ ...prev, ["USER_NAME2"]: v }))}
        />
      </div>
      <div className="mainInput">
        <CommonDropDown
          id="hrpat"
          data={hrpat}
          header={commonHeader2}
          dropHeight="15rem"
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: dt?.["TEAM_CODE"] || "",
          }}
          onClick={(v) => {
            setDt((prev) => ({
              ...prev,
              ["TEAM_CODE"]: v["CODE_CODE"],
              ["TEAM_DATE"]: "",
            }));
          }}
          check={true}
          title="부서"
          labelW="30%"
          find={true}
        />
      </div>
      <div className="mainInput">
        <DateInput
          id="hrpatSelect"
          value={dt?.["TEAM_DATE"] || ""}
          label="부서 적용일"
          onChange={(v) => setDt((prev) => ({ ...prev, ["TEAM_DATE"]: v }))}
          check={true}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonDropDown
          id="trmcd"
          data={trmcd}
          header={commonHeader2}
          dropHeight="15rem"
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: dt?.["TERMINAL_CODE"] || "",
          }}
          onClick={(v) => {
            setDt((prev) => ({
              ...prev,
              ["TERMINAL_CODE"]: v["CODE_CODE"],
              ["TERMINAL_NAME"]: v["CODE_NAME"],
            }));
          }}
          check={true}
          title="터미널"
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <DateInput
          id="joinDate"
          value={dt?.["JOIN_DAY"] || ""}
          onChange={(v) =>
            setDt((prev) => ({
              ...prev,
              ["JOIN_DAY"]: v,
            }))
          }
          label="입사일"
          check={true}
          labelW="28%"
        />
      </div>
      <div className="mainInput">
        <DateInput
          id="groupJoinDate"
          value={dt?.["GROUP_JOIN_DAY"] || ""}
          onChange={(v) =>
            setDt((prev) => ({
              ...prev,
              ["GROUP_JOIN_DAY"]: v,
            }))
          }
          label="그룹 입사일"
          labelW="40%"
        />
      </div>
    </div>
  );
}
