import { useEffect, useState } from "react";
import { FaRegCheckCircle } from "react-icons/fa";
import {
  deleteCookie,
  getApi,
  getCookie,
  sendErr,
  setCookie,
} from "./Util/Util";
import { CommonDropDown } from "./comp/DropDown";
import type { TableHeaderType, TableRow, UserInfoType } from "./Util/Type";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "./slices/store";
import { useNavigate } from "react-router-dom";
import { changeAutoFlag, clearAll, clearAllUser } from "./slices/user";
import imgLogin from "./assets/images/loginImg.png";
import { clearAllErr } from "./slices/err";
const header: TableHeaderType[] = [
  { key: "CODE_NAME", value: "코드명", w: "18.5rem", type: "STR" },
];
const trmData: TableRow[] = [
  { CODE_CODE: "T1", CODE_NAME: "TERMINAL 1" },
  { CODE_CODE: "T2", CODE_NAME: "TERMINAL 2" },
  { CODE_CODE: "T3", CODE_NAME: "TERMINAL 3" },
];
const serverData: TableRow[] = [
  { CODE_CODE: "SAMS", CODE_NAME: "화물 관리 시스템" },
  { CODE_CODE: "INTRA", CODE_NAME: "사내 업무 시스템" },
];
export default function Root() {
  const [formData, setFormData] = useState({
    username: getCookie("USERID") || "",
    password: "",
  });
  const [saveFlag, setSaveFlag] = useState(getCookie("USERID") ? true : false);
  const [selectTab, setSelectTab] = useState<TableRow>(serverData[0]);
  const [selectTrm, setSelectTrm] = useState<TableRow>(
    (getCookie("terminalCode") &&
      trmData.find(
        (item) => item["CODE_CODE"] === getCookie("terminalCode"),
      )) ||
      trmData[0],
  );
  const autoFlag = useSelector((state: RootState) => state.user.authCheck);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function logout() {
    const res = await getApi({
      baseUrl: "AUTH",
      method: "GET",
      url: `/user/logout`,
      pgmId: "",
    });
  }

  async function check() {
    const res = await getApi<UserInfoType>({
      baseUrl: "AUTH",
      method: "GET",
      url: "",
      pgmId: "",
    });
    if (res.ok) {
      await logout();
      dispatch(clearAll());
      dispatch(clearAllErr());
    } else {
      document.getElementById("loginId")?.focus();
    }
  }

  useEffect(() => {
    if (!autoFlag) {
      check();
    }
  }, [autoFlag]);

  useEffect(() => {
    if (saveFlag) {
      setCookie("USERID", formData.username, {
        days: 365,
        path: "/",
      });
    } else {
      deleteCookie("USERID");
    }
  }, [saveFlag, formData.username]);

  const click = async () => {
    dispatch(clearAll());
    dispatch(clearAllErr());
    const param = new Map<string, string>();
    if (!formData.username) {
      sendErr("사용자 아이디를 입력하여주세요.");
      return;
    }
    if (!formData.password) {
      sendErr("패스워드를 입력하여주세요.");
      return;
    }
    if (!selectTab?.["CODE_CODE"]) {
      sendErr("시스템을 클릭해주세요.");
      return;
    }

    if (selectTab["CODE_CODE"] === "SAMS") {
      sendErr("화물 관리 시스템은 준비중입니다.");
      return;
    }

    param.set("username", formData.username);
    param.set("password", formData.password);
    param.set(
      "terminal",
      selectTab["CODE_CODE"] === "SAMS" ? selectTrm["CODE_CODE"] : "",
    );
    param.set("menuType", selectTab["CODE_CODE"]);
    const loginRes = await getApi<string>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/user/login",
      params: param,
      pgmId: "LOGIN",
    });
    if (loginRes.ok) {
      navigate(`/${selectTab?.["CODE_CODE"].toLowerCase()}/Main`);
    }
  };

  return (
    <div className="relative flex items-center justify-center bg-[#e8ecf1] text-[#333] min-h-[100vh] ">
      <img src={imgLogin} className="h-screen w-auto mx-auto opacity-65" />
      <div className="absolute login-wrapper">
        <div className="login-box">
          <div className="tabs">
            <button
              type="button"
              onClick={(e) => setSelectTab(serverData[0])}
              className={`tab ${selectTab?.["CODE_CODE"] === "SAMS" ? "active" : "shadow-md"}`}>
              {serverData[0]["CODE_CODE"]}
            </button>
            <button
              type="button"
              onClick={(e) => setSelectTab(serverData[1])}
              className={`tab ${selectTab?.["CODE_CODE"] === "INTRA" ? "active" : "shadow-md"}`}>
              {serverData[1]["CODE_CODE"]}
            </button>
          </div>
          <div
            className="form-area"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                click();
              }
            }}>
            <p className="server-label">
              현재 서버:{" "}
              <strong id="currentServer">
                {" "}
                {selectTab?.["CODE_CODE"]} ( {selectTab?.["CODE_NAME"] || ""} )
              </strong>
            </p>
            {selectTab?.["CODE_CODE"] === "SAMS" && (
              <div className="loginTrm">
                <CommonDropDown
                  id="trm"
                  data={trmData}
                  dropHeight="10rem"
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: selectTrm["CODE_CODE"],
                  }}
                  header={header}
                  onClick={(v) => {
                    setSelectTrm(v);
                    setCookie("terminalCode", v["CODE_CODE"], {
                      days: 7,
                      path: "/",
                    });
                  }}
                  bg="#FFFFFF"
                />
              </div>
            )}
            <div className="field mb-[7%]">
              <label>ID</label>
              <input
                type="text"
                id="userId"
                name="userId"
                placeholder="아이디를 입력하세요"
                value={formData.username}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }));
                }}
              />
            </div>
            <div className="field mb-[3%]">
              <label>PW</label>
              <input
                type="password"
                id="userPw"
                name="userPw"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }));
                }}
              />
            </div>
            <div
              className="saveId flex items-center gap-2 p-[1%]"
              onClick={() => setSaveFlag((prev) => !prev)}>
              <FaRegCheckCircle
                id="save"
                className={`${saveFlag ? "text-blue-600" : ""} cursor-pointer`}
              />
              <label
                htmlFor="save"
                className={`cursor-pointer ${saveFlag ? "text-blue-600" : ""} `}>
                아이디 기억
              </label>
            </div>
            <button
              type="button"
              className="login-btn"
              onClick={(e) => click()}>
              로그인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
