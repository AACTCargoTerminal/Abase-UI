import { useEffect, useState } from "react";
import imgLogin from "../assets/images/loginImg.png";
import { CommonInput, PwdInput } from "../comp/Input";
import {
  deleteCookie,
  getApi,
  getCookie,
  sendErr,
  setCookie,
} from "../Util/Util";
import { FaRegCheckCircle } from "react-icons/fa";
import { RiLoginBoxLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import type { UserInfoType } from "../Util/Type";
import { useDispatch, useSelector } from "react-redux";
import { clearAllErr } from "../slices/err";
import { changeAutoFlag, clearAllUser } from "../slices/user";
import type { RootState } from "../slices/store";

const InfraLogin = () => {
  const autoFlag = useSelector((state: RootState) => state.user.authCheck);
  const [id, setId] = useState(getCookie("USERID") || "");
  const [password, setPassword] = useState("");
  const [saveFlag, setSaveFlag] = useState(getCookie("USERID") ? true : false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  async function check() {
    const res = await getApi<UserInfoType>({
      baseUrl: "AUTH",
      method: "GET",
      url: "",
      pgmId: "",
    });
    if (res.ok) {
      navigate("/Infra/Main");
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
    dispatch(clearAllErr());
    dispatch(clearAllUser());
  }, []);

  const click = async () => {
    const param = new Map<string, string>();
    if (!id) {
      sendErr("사용자 아이디를 입력하여주세요.");
      return;
    }
    if (!password) {
      sendErr("패스워드를 입력하여주세요.");
      return;
    }
    param.set("username", id);
    param.set("password", password);
    param.set("terminal", "");
    const loginRes = await getApi<string>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/user/login",
      params: param,
      pgmId: "LOGIN",
      sucFlag: true,
    });
    if (loginRes.ok) {
      dispatch(changeAutoFlag(false));
      if (saveFlag) {
        setCookie("USERID", id, {
          days: 365,
          path: "/",
        });
      } else {
        deleteCookie("USERID");
      }
      navigate("/Infra/Main");
    }
  };

  return (
    <div className="relative bg-[#1F1F2B] w-screen h-screen flex items-center justify-center">
      <img className="object-cover h-full" src={imgLogin} />
      <div
        onKeyDown={(e) => {
          if (e.key === "Enter") click();
        }}
        className="absolute bg-[#FFFFFFAA] border border-gray-400 rounded-md shadow-md px-[3%] py-[1%] flex flex-col gap-2 items-center">
        <div className="w-[18%] border border-[#003366] bg-[#003366] rounded-full p-[3%] mb-[5%]">
          <RiLoginBoxLine className="size-full text-white" />
        </div>
        <div className="loginTrm" style={{ width: "100%" }}>
          <CommonInput
            id="loginId"
            value={id}
            onChange={(v) => setId(v)}
            holder="아이디를 입력해주세요."
          />
        </div>
        <div className="loginTrm" style={{ width: "100%" }}>
          <PwdInput
            id="loginPwd"
            onChange={(v) => setPassword(v)}
            value={password}
            holder="비밀번호를 입력해주세요."
          />
        </div>
        <div
          className="saveId flex items-center gap-2 p-[1%]"
          style={{ width: "100%" }}
          onClick={() =>
            setSaveFlag((prev) => {
              const ret = !prev;
              if (ret) {
                setCookie("USERID", id, {
                  days: 365,
                  path: "/",
                });
              } else {
                deleteCookie("USERID");
              }
              return ret;
            })
          }>
          <FaRegCheckCircle
            id="save"
            className={`${saveFlag ? "text-blue-600" : ""} cursor-pointer`}
          />
          <label
            htmlFor="save"
            className={`cursor-pointer ${
              saveFlag ? "text-blue-600" : ""
            } text-nowrap`}>
            아이디 기억
          </label>
        </div>
        <div className="saveId" style={{ width: "100%" }}>
          <div
            id="loginClick"
            onClick={() => {
              click();
            }}
            className="w-full rounded-md text-white bg-[#003366] duration-300
             border border-[#1565C0] py-2 hover:bg-[#1565C0] flex items-center justify-center cursor-pointer shadow-md">
            로그인
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfraLogin;
