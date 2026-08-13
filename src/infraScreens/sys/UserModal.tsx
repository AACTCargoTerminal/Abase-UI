import { useCallback, useEffect, useState } from "react";
import type { ModalComp, TableHeaderType, TableRow } from "../../Util/Type";
import {
  getApi,
  getClass,
  getClassValue,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { CommonInput } from "../../comp/Input";
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
    comcdSelect();
    brncdSelect();
    dptcdSelect();
  }, []);

  const [trmcd, setTrmcd] = useState<TableRow[]>([]); //터미널
  const [comcd, setComcd] = useState<TableRow[]>([]); //법인
  const [brncd, setBrncd] = useState<TableRow[]>([]); //지사
  const [dptcd, setDptcd] = useState<TableRow[]>([]); //부서

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
      setUserParam("");
      setDt({});
      outParam?.({ CLOSE: "CLOSE" });
      onClose();
    }
  }, [dt?.["USER_ID"]]);

  async function trmcdSelect() {
    const data = await getClass("TRMCD", pgmId);
    setTrmcd([{ CODE_CODE: "", CODE_NAME: "ALL" }, ...data]);
  }

  async function comcdSelect() {
    const data = await getClass("COMCD", pgmId);
    setComcd(data);
  }

  async function brncdSelect() {
    const data = await getClass("BRNCD", pgmId);
    setBrncd(data);
  }

  async function dptcdSelect() {
    const data = await getClassValue("Value3", "DPTCD", "Y", pgmId);
    setDptcd(data);
  }

  const saveClick = useCallback(async () => {
    if (Object.keys(dt).length === 0) {
      sendErr("정보가 없습니다.");
      return;
    }
    const map: Map<string, any> = new Map<string, any>();
    map.set("USER_ID", dt?.["USER_ID"] || "");
    map.set("USER_ID_CHANGE", dt?.["USER_ID_CHANGE"] || "");
    map.set("USER_PASSWORD", dt?.["USER_PASSWORD"] || "");
    map.set("USER_PASSWORD_HP", dt?.["USER_PASSWORD_HP"] || "");
    map.set("USER_NAME1", dt?.["USER_NAME1"] || "");
    map.set("USER_NAME2", dt?.["USER_NAME2"] || "");
    map.set("COMPANY_CODE", dt?.["COMPANY_CODE"] || "");
    map.set("BRANCH_CODE", dt?.["BRANCH_CODE"] || "");
    map.set("DEPARTMENT_CODE", dt?.["DEPARTMENT_CODE"] || "");
    map.set("TERMINAL_CODE_WORK", dt?.["TERMINAL_CODE_WORK"] || "");
    map.set("TERMINAL_NAME_WORK", dt?.["TERMINAL_NAME_WORK"] || "");

    map.set("DEFAULT_LANGUAGE_CODE", dt?.["DEFAULT_LANGUAGE_CODE"] || "");
    map.set("EMAIL_ADDRESS", dt?.["EMAIL_ADDRESS"] || "");
    map.set("PHONE_NO", dt?.["PHONE_NO"] || "");
    map.set("MOBILE_NO", dt?.["MOBILE_NO"] || "");
    map.set("FAX_NO", dt?.["FAX_NO"] || "");
    map.set("AUTH_WORKTIMELINE_YN", dt?.["AUTH_WORKTIMELINE_YN"] || "");
    map.set("AUTH_BOARD_WRITE_YN", dt?.["AUTH_BOARD_WRITE_YN"] || "");
    map.set("AUTH_IN_CANCEL_YN", dt?.["AUTH_IN_CANCEL_YN"] || "");
    map.set("AUTH_BOARDHP_WRITE_YN", dt?.["AUTH_BOARDHP_WRITE_YN"] || "");
    map.set("AUTH_IT_BOARD_YN", dt?.["AUTH_IT_BOARD_YN"] || "");

    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/user/setUserInfoMgm",
      params: map,
      pgmId: pgmId,
      sucFlag: true,
    });
    setUserParam(map.get("USER_ID"));

    if (ret.ok) {
      outParam?.({ SEARCH: "SEARCH" });
      onClose();
    }
  }, [dt]);

  return (
    <div className="px-[3%] py-[5%] grid grid-cols-3 gap-5">
      <div className="mainInput">
        <CommonInput
          id="userId"
          value={dt?.["USER_ID"]}
          check={true}
          label="사용자 ID"
          labelW="40%"
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
            labelW="40%"
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
          id="comcd"
          data={comcd}
          header={commonHeader2}
          dropHeight="15rem"
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: dt?.["COMPANY_CODE"] || "",
          }}
          onClick={(v) => {
            setDt((prev) => ({ ...prev, ["COMPANY_CODE"]: v["CODE_CODE"] }));
          }}
          check={true}
          title="법인"
          labelW="30%"
        />
      </div>
      <div className="mainInput">
        <CommonDropDown
          id="brncd"
          data={brncd}
          header={commonHeader2}
          dropHeight="15rem"
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: dt?.["BRANCH_CODE"] || "",
          }}
          onClick={(v) => {
            setDt((prev) => ({ ...prev, ["BRANCH_CODE"]: v["CODE_CODE"] }));
          }}
          check={true}
          title="지사"
          labelW="30%"
        />
      </div>
      <div className="mainInput">
        <CommonDropDown
          id="dptcd"
          data={dptcd}
          header={commonHeader2}
          dropHeight="15rem"
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: dt?.["DEPARTMENT_CODE"] || "",
          }}
          onClick={(v) => {
            setDt((prev) => ({ ...prev, ["DEPARTMENT_CODE"]: v["CODE_CODE"] }));
          }}
          check={true}
          title="부서"
          labelW="30%"
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
            value: dt?.["TERMINAL_CODE_WORK"] || "",
          }}
          onClick={(v) => {
            setDt((prev) => ({
              ...prev,
              ["TERMINAL_CODE_WORK"]: v["CODE_CODE"],
              ["TERMINAL_NAME_WORK"]: v["CODE_NAME"],
            }));
          }}
          check={true}
          title="터미널"
          labelW="30%"
        />
      </div>
    </div>
  );
}
