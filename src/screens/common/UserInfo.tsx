import { FaCheckSquare } from "react-icons/fa";
import { CommonInput, CommonLabel } from "../../comp/Input";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import {
  base64ToPdfUrl,
  getApi,
  getClass,
  sendErr,
  sendLoading,
  sendSuc,
} from "../../Util/Util";
import type {
  ModalComp,
  TableHeaderType,
  TableRow,
  UserInfoType,
} from "../../Util/Type";
import { CommonDropDown } from "../../comp/DropDown";
import { useNavigate } from "react-router-dom";
import { Btn } from "../../comp/Btn";
import { pushUserInfo } from "../../slices/user";
import { IoRefreshOutline, IoReload } from "react-icons/io5";

const header: TableHeaderType[] = [
  { key: "CODE_NAME", value: "코드명", w: "" },
];

export default function UserInfo({
  onClose,
  headerAction,
  pgmId,
  sendParam,
}: ModalComp) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [langArray, setLangArray] = useState<TableRow[]>([]);
  const [selectLang, setSelectLang] = useState<TableRow>({});

  const [pass, setPass] = useState("");
  const [passHp, setPassHp] = useState("");
  const user = useSelector((state: RootState) => state.user.userInfo) || null;
  const [formData, setFormData] = useState<UserInfoType | null>(user);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const onPick = () => fileInputRef.current?.click();
  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = ""; // 같은 파일 재선택 가능하게
    if (!f) return;

    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      alert("이미지 또는 PDF 파일만 선택할 수 있어요.");
      return;
    }
    // (선택) 용량 제한
    const maxMB = 10;
    if (f.size > maxMB * 1024 * 1024) {
      alert(`최대 ${maxMB}MB까지만 가능해요.`);
      return;
    }

    setUserSign(f);
  };

  async function check() {
    const res = await getApi<UserInfoType>({
      baseUrl: "AUTH",
      method: "GET",
      url: "/user/verity",
      pgmId: "",
    });
    if (!res.ok) {
    } else {
      if (res.data) {
        dispatch(pushUserInfo(res.data));
      }
    }
  }

  async function setUserSign(file: File) {
    sendLoading(true);
    const res = await getApi<TableRow>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/user/setUserSign",
      files: [file],
      pgmId: pgmId,
      sucFlag: true,
    });
    sendLoading(false);

    if (res.ok) {
      check();
      return;
    }
  }

  useEffect(() => {
    if (headerAction?.type === "SAVE") {
      saveClick();
    }
  }, [headerAction]);

  useEffect(() => {
    getClass("LANCD", "pgm_id")
      .then((r) => setLangArray(r))
      .catch((e) => setLangArray([]));
  }, []);

  useEffect(() => {
    const findObj = langArray.find(
      (item) => item["CODE_CODE"] === formData?.userLang,
    );
    if (findObj) {
      setSelectLang(findObj);
    } else {
      setSelectLang({});
    }
  }, [langArray, formData]);

  async function saveClick() {
    const tmp: Map<string, string> = new Map<string, string>();
    if (!formData) {
      sendErr("세션 문제");
      navigate("/");
      return;
    }
    try {
      tmp.set("pass", pass);
      tmp.set("passHp", passHp);
      tmp.set("userName2", formData.userNameDefault);
      tmp.set("langCode", selectLang["CODE_CODE"]);
      tmp.set("email", formData.userEmail);
      tmp.set("phone", formData.userPhone);
      tmp.set("mobile", formData.userMobile);
      tmp.set("fax", formData.userFax);
    } catch (err: any) {
      sendErr(err.message);
    }

    const res = await getApi<Record<number, any>>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/user/setUserInfo",
      params: tmp,
      pgmId: pgmId,
    });

    if (res.ok) {
      sendSuc("저장완료");
      check();
      onClose();
    }
  }

  async function rotateAndUpload() {
    const img = new Image();

    img.src = `data:${formData?.signType || "image/png"};base64,${formData?.signData}`;

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = img.height;
      canvas.height = img.width;

      // ✅ 투명 배경 유지
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "sign.png", {
          type: "image/png",
        });

        await setUserSign(file);
      }, "image/png");
    };
  }

  return (
    <div className="grid grid-cols-4 gap-3 rounded-md px-4 py-4">
      <div className="col-span-4">
        <CommonInput
          id="id"
          value={formData?.userId || ""}
          onChange={(v) => {}}
          check={true}
          label="사용자 ID"
          read={true}
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="pass"
          value={pass}
          onChange={(value) => setPass(value)}
          check={true}
          label="A-BASE 암호"
          type="password"
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="homePass"
          value={passHp}
          onChange={(value) => setPassHp(value)}
          check={true}
          label="홈페이지 자료실 암호"
          type="password"
          align="COL"
        />
      </div>
      <div className="col-span-4 w-full flex flex-col gap-2 border-4 border-double border-gray-300 rounded-md">
        <div className="font-bold text-sm p-2 bg-[#C5D3E8] pl-3">사용자 명</div>
        <div className="px-4 pb-4 pt-1 flex gap-3">
          <CommonInput
            id="defName"
            value={formData?.userNameDefault || ""}
            onChange={(value) =>
              setFormData((prev) => prev && { ...prev, userNameDefault: value })
            }
            label="공용어"
            align="COL"
          />
          <CommonInput
            id="korName"
            value={formData?.userName || ""}
            onChange={(value) =>
              setFormData((prev) => prev && { ...prev, userName: value })
            }
            label="한글"
            align="COL"
          />
        </div>
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="company"
          value={formData?.userCompanyName || ""}
          onChange={(value) => {}}
          read={true}
          label="법인"
          check={true}
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="branch"
          value={formData?.userBranchName || ""}
          onChange={(value) => {}}
          read={true}
          label="지사"
          check={true}
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="depart"
          value={formData?.userDepartName || ""}
          onChange={(value) => {}}
          read={true}
          label="부서"
          check={true}
          align="COL"
        />
      </div>
      <div className="col-span-2">
        <CommonDropDown
          id="lang"
          header={header}
          data={langArray}
          dropHeight="5rem"
          onClick={(v) => setSelectLang(v)}
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: selectLang["CODE_CODE"],
          }}
          check={true}
          title="사용 언어"
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="email"
          value={formData?.userEmail || ""}
          onChange={(value) =>
            setFormData((prev) => prev && { ...prev, userEmail: value })
          }
          label="Email 주소"
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="phone"
          value={formData?.userPhone || ""}
          onChange={(value) =>
            setFormData((prev) => prev && { ...prev, userPhone: value })
          }
          label="전화 번호"
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="mobile"
          value={formData?.userMobile || ""}
          onChange={(value) =>
            setFormData((prev) => prev && { ...prev, userMobile: value })
          }
          label="휴대 전화 번호"
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="fax"
          value={formData?.userFax || ""}
          onChange={(value) =>
            setFormData((prev) => prev && { ...prev, userFax: value })
          }
          label="Fax 번호"
          align="COL"
        />
      </div>
      <div className="col-span-2">
        {" "}
        <CommonInput
          id="trm"
          value={formData?.userTerminalNameWork || "ALL"}
          onChange={(value) => {}}
          read={true}
          label="터미널"
          align="COL"
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1">
        {" "}
        <div className="flex items-center">
          <CommonLabel id="sign" align="COL" label="서명등록" justify="START" />
          <IoReload
            className="hover:bg-gray-300 rounded-md h-[90%] w-[8%] p-[1%] cursor-pointer"
            onClick={rotateAndUpload}
          />
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPick();
          }}
          className="border border-gray-300 cursor-pointer flex items-center justify-center rounded-md hover:bg-gray-300">
          {formData?.signData && formData?.signType ? (
            <img
              src={`data:${formData.signType || "image/png"};base64,${formData.signData}`}
              style={{
                maxHeight: "100px",
              }}
            />
          ) : (
            <div className="mainInput flex items-center">파일 없음</div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={onChangeFile}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
