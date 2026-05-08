import { useEffect, useState } from "react";
import { CommonDropDown } from "../../comp/DropDown";
import type { TableHeaderType, TableRow, UserInfoType } from "../../Util/Type";
import {
  deleteCookie,
  getApi,
  getCookie,
  sendErr,
  setCookie,
} from "../../Util/Util";
import { CommonChk, CommonInput, PwdInput } from "../../comp/Input";
import { useDispatch } from "react-redux";
import { FaRegCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import aact from "../../assets/images/aact.png";
import booking from "../../assets/images/booking.png";
import logishub from "../../assets/images/logishub.png";
import unipass from "../../assets/images/unipass.png";
import { ModalCust } from "../../comp/Common";
import AnyBoard from "../blind/AnyBoard";
import AnyBoardDetail from "../blind/AnyBoardDetail";
import { clearAllErr } from "../../slices/err";
import { clearAllUser } from "../../slices/user";
import { Btn } from "../../comp/Btn";

const dict: Record<number, string> = { 0: "블라인드 게시판", 1: "익명 게시판" };
const header: TableHeaderType[] = [
  { key: "CODE_NAME", value: "코드명", w: "18.5rem", type: "STR" },
];
const trmData: TableRow[] = [
  { CODE_CODE: "T1", CODE_NAME: "TERMINAL 1" },
  { CODE_CODE: "T2", CODE_NAME: "TERMINAL 2" },
];

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [blindOpen, setBlindOpen] = useState(false);
  const [anyCount, setAnyCount] = useState<{ count: number; r: TableRow }>({
    count: 0,
    r: {},
  });
  const [saveFlag, setSaveFlag] = useState(getCookie("USERID") ? true : false);
  const [formData, setFormData] = useState({
    username: getCookie("USERID") || "",
    password: "",
  });
  const [selectTrm, setSelectTrm] = useState<TableRow>(
    (getCookie("terminalCode") &&
      trmData.find(
        (item) => item["CODE_CODE"] === getCookie("terminalCode"),
      )) ||
      trmData[0],
  );

  async function check() {
    const res = await getApi<UserInfoType>({
      baseUrl: "AUTH",
      method: "GET",
      url: "",
      pgmId: "",
    });
    if (res.ok) {
      navigate("/Sams/Main");
    }
  }

  useEffect(() => {
    if (getCookie("WMSSESSION")) {
      check();
    }
    document.getElementById("loginId")?.focus();
  }, []);

  useEffect(() => {
    dispatch(clearAllErr());
    dispatch(clearAllUser());
  }, []);

  const click = async () => {
    const param = new Map<string, string>();
    if (!formData.username) {
      sendErr("사용자 아이디를 입력하여주세요.");
      return;
    }
    if (!formData.password) {
      sendErr("패스워드를 입력하여주세요.");
      return;
    }
    param.set("username", formData.username);
    param.set("password", formData.password);
    param.set("terminal", selectTrm["CODE_CODE"]);
    const loginRes = await getApi<string>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/auth/login",
      params: param,
      pgmId: "LOGIN",
    });
    if (loginRes.ok) {
      if (loginRes.data) {
        navigate("/Sams/Main");
      }
    }
  };

  const getRemotePro = () => {
    const link = document.createElement("a");
    link.href = "/aact.exe";
    link.download = "AACT_Remote.exe";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
  return (
    <div className="bg-[#1F1F2B] w-screen h-screen flex items-center justify-center">
      <div className="w-[60%] h-[70%] rounded-md border-2 border-gray-500 bg-white flex flex-col gap-[0.5%] items-center">
        <div className="h-[33%] flex items-center">
          <p className="loginTitle">Login</p>
        </div>
        <div className="loginTrm">
          <CommonDropDown
            id="trm"
            data={trmData}
            dropHeight="5rem"
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
        <div className="loginTrm">
          <CommonInput
            id="id"
            holder="아이디를 입력해주세요"
            value={formData.username}
            onChange={(v) => {
              setFormData((prev) => ({ ...prev, username: v }));
            }}
            auto={true}
          />
        </div>
        <div
          className="loginTrm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              click();
            }
          }}>
          <PwdInput
            id="pass"
            holder="비밀번호를 입력해주세요."
            value={formData.password}
            onChange={(v) => {
              setFormData((prev) => ({ ...prev, password: v }));
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
        <div className="saveId">
          <div
            id="loginClick"
            onClick={() => click()}
            className="rounded-md text-white bg-[#E05956] py-2 hover:bg-[#cc4842] flex items-center justify-center cursor-pointer">
            로그인
          </div>
        </div>
        <div className="loginLink">
          <span
            onClick={() => setBlindOpen(true)}
            className="cursor-pointer text-shadow-md">
            AACT BLIND
          </span>
          <span
            onClick={() => getRemotePro()}
            className="cursor-pointer text-shadow-md">
            Remote Support
          </span>
        </div>
        <div>
          <div className="imgArray">
            <a
              href="http://service.aact.co.kr/"
              className="imgLink"
              target="_blank">
              <img src={aact} className="w-full" />
            </a>
            <a href="http://bs.aact.kr/" className="imgLink" target="_blank">
              <img src={booking} className="w-full" />
            </a>
            <a
              href="https://www.ulogishub.com/"
              className="imgLink"
              target="_blank">
              <img src={logishub} className="w-full" />
            </a>
            <a
              href="https://unipass.customs.go.kr/"
              className="imgLink"
              target="_blank">
              <img src={unipass} className="w-full" />
            </a>
          </div>
        </div>
      </div>
      <ModalCust
        open={blindOpen}
        onClose={() => {
          setBlindOpen(false);
          setAnyCount({ count: 0, r: {} });
        }}
        childrenTitle={{
          0: [
            <Btn txt="SEARCH" onClick={() => {}} type="SEARCH" />,
            <Btn
              txt="INSERT"
              onClick={() => {
                setAnyCount({ count: 1, r: {} });
              }}
              type="SAVE"
            />,
          ],
        }}
        title={dict[anyCount.count]}
        selectNod={anyCount.count}
        setSelectNod={(value) =>
          setAnyCount((prev) => ({ ...prev, count: value }))
        }>
        <AnyBoard
          changePage={(value, select) => {
            setAnyCount({ count: value, r: select });
          }}
        />
        <AnyBoardDetail
          param={anyCount.r}
          beforeClick={() => setAnyCount({ count: 0, r: {} })}
        />
      </ModalCust>
    </div>
  );
}
