import type { ChangeEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { IoReload } from "react-icons/io5";

import { CommonDropDown } from "../../comp/DropDown";
import { CommonInput, CommonLabel, DateInput } from "../../comp/Input";
import { pushUserInfo } from "../../slices/user";
import type {
  ModalComp,
  TableHeaderType,
  TableRow,
  UserInfoType,
} from "../../Util/Type";
import {
  getApi,
  getClass,
  sendErr,
  sendLoading,
  sendSuc,
} from "../../Util/Util";

const languageHeader: TableHeaderType[] = [
  {
    key: "CODE_NAME",
    value: "코드명",
    w: "",
  },
];

export default function UserHrInfo({
  param,
  onClose,
  pgmId,
  headerAction,
  outParam,
}: ModalComp) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 개인 사용자 정보
  const [formData, setFormData] = useState<UserInfoType | null>(null);
  const [langArray, setLangArray] = useState<TableRow[]>([]);
  const [selectLang, setSelectLang] = useState<TableRow>({});
  const [pass, setPass] = useState("");
  const [passHp, setPassHp] = useState("");

  // 사용자 관리 정보
  const [userParam, setUserParam] = useState("");
  const [dt, setDt] = useState<TableRow>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const check = useCallback(async () => {
    const response = await getApi<UserInfoType>({
      baseUrl: "AUTH",
      method: "GET",
      url: "/user/verity",
      pgmId: "",
    });

    if (response.ok && response.data) {
      dispatch(pushUserInfo(response.data));
    }
  }, [dispatch]);

  const getHrUserInfo = useCallback(async () => {
    try {
      const response = await getApi<UserInfoType>({
        baseUrl: "AUTH",
        method: "GET",
        url: "/user/verity",
        pgmId,
      });

      if (response.ok && response.data) {
        setFormData(response.data);
        return;
      }

      setFormData(null);
      sendErr("개인 사용자 정보를 불러오지 못했습니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "개인 사용자 정보를 불러오지 못했습니다.";

      setFormData(null);
      sendErr(message);
    }
  }, [pgmId]);

  const searchUser = useCallback(
    async (userId: string) => {
      const searchUserId = userId.trim();

      if (!searchUserId) {
        setDt({});
        return;
      }

      sendLoading(true);

      try {
        // 기본 사용자 정보 조회
        const userResponse = await getApi<
          Record<number, TableRow[]>
        >({
          baseUrl: "AUTH",
          method: "GET",
          url: `/user/getUserInfo2?userId=${encodeURIComponent(
            searchUserId,
          )}`,
          pgmId,
        });

        const userData = userResponse.data?.[0]?.[0];

        if (!userResponse.ok || !userData) {
          setDt({});
          sendErr("사용자 정보를 찾을 수 없습니다.");
          return;
        }

        // 인사설정 조회에 필요한 사용자 SID
        const userSid =
          param?.["userSid"] ??
          param?.["USER_SID"] ??
          userData["USER_SID"] ??
          userData["userSid"];

        if (
          userSid === undefined ||
          userSid === null ||
          userSid === ""
        ) {
          setDt(userData);
          sendErr(
            "USER_SID가 없어 인사설정 정보를 조회하지 못했습니다.",
          );
          return;
        }

        // 인사설정 정보 조회
        const relationResponse = await getApi<
          Record<number, TableRow[]>
        >({
          baseUrl: "AUTH",
          method: "GET",
          url:
            `/user/getUserRel?userSid=${encodeURIComponent(
              String(userSid),
            )}` + "&usableFlag=Y",
          pgmId,
        });

        const relationRows =
          relationResponse.data?.[0] ?? [];

        // 부서 및 부서 적용일
        const departmentRow = relationRows.find(
          (row) => row["CLASS_CODE"] === "HRPAT",
        );

        // 입사일
        const joinDateRow = relationRows.find(
          (row) =>
            row["CLASS_CODE"] === "HRWDT" &&
            (row["CODE_CODE"] === "A" ||
              row["CODE_NAME"] === "입사일"),
        );

        setDt({
          ...userData,

          USER_SID: userSid,

          TEAM_CODE:
            departmentRow?.["CODE_CODE"] ??
            userData["TEAM_CODE"] ??
            "",

          TEAM_NAME:
            departmentRow?.["CODE_NAME"] ??
            userData["TEAM_NAME"] ??
            "",

          TEAM_DATE:
            departmentRow?.["VALUE1"] ??
            userData["TEAM_DATE"] ??
            "",

          JOIN_DAY:
            joinDateRow?.["VALUE1"] ??
            userData["JOIN_DAY"] ??
            "",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "사용자 정보를 조회하지 못했습니다.";

        setDt({});
        sendErr(message);
      } finally {
        sendLoading(false);
      }
    },
    [param, pgmId],
  );


  const savePersonalInfo = useCallback(async () => {
    if (!formData) {
      sendErr("사용자 정보를 확인할 수 없습니다.");
      navigate("/");
      return;
    }

    const params = new Map<string, string>();

    params.set("pass", pass);
    params.set("passHp", passHp);
    params.set("userName", formData.userNameDefault || "");
    params.set("userName2", formData.userName || "");
    params.set(
      "langCode",
      String(selectLang["CODE_CODE"] || ""),
    );

    sendLoading(true);

    try {
      const response = await getApi<Record<number, unknown>>({
        baseUrl: "AUTH",
        method: "POST",
        url: "/user/setUserInfo",
        params,
        pgmId,
      });

      if (response.ok) {
        sendSuc("저장완료");
        await check();
        await getHrUserInfo();
        onClose();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "개인 정보 저장 중 오류가 발생했습니다.";

      sendErr(message);
    } finally {
      sendLoading(false);
    }
  }, [
    check,
    formData,
    getHrUserInfo,
    navigate,
    onClose,
    pass,
    passHp,
    pgmId,
    selectLang,
  ]);

  const setUserSign = useCallback(
    async (file: File) => {
      sendLoading(true);

      try {
        const response = await getApi<TableRow>({
          baseUrl: "AUTH",
          method: "POST",
          url: "/user/setUserSign",
          files: [file],
          pgmId,
          sucFlag: true,
        });

        if (response.ok) {
          await check();
          await getHrUserInfo();
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "서명 등록 중 오류가 발생했습니다.";

        sendErr(message);
      } finally {
        sendLoading(false);
      }
    },
    [check, getHrUserInfo, pgmId],
  );

  function onPick() {
    fileInputRef.current?.click();
  }

  function onChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith("image/") &&
      file.type !== "application/pdf"
    ) {
      sendErr("이미지 또는 PDF 파일만 선택할 수 있습니다.");
      return;
    }

    const maxMB = 10;

    if (file.size > maxMB * 1024 * 1024) {
      sendErr(`최대 ${maxMB}MB까지만 가능합니다.`);
      return;
    }

    void setUserSign(file);
  }

  async function rotateAndUpload() {
    const img = new Image();

    img.src = `data:${formData?.signType || "image/png"};base64,${formData?.signData}`;

    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const radian = (45 * Math.PI) / 180;

      canvas.width = Math.ceil(
        Math.abs(img.width * Math.cos(radian)) +
        Math.abs(img.height * Math.sin(radian)),
      );

      canvas.height = Math.ceil(
        Math.abs(img.width * Math.sin(radian)) +
        Math.abs(img.height * Math.cos(radian)),
      );

      // 투명 배경 유지
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radian);
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

  useEffect(() => {
    void getHrUserInfo();

    getClass("LANCD", pgmId)
      .then(setLangArray)
      .catch(() => setLangArray([]));
  }, [getHrUserInfo, pgmId]);

  useEffect(() => {
    const receivedUserId =
      param?.["userId"] ??
      param?.["USER_ID"] ??
      param?.["userID"] ??
      formData?.userId ??
      "";

    setUserParam(String(receivedUserId));
  }, [formData?.userId, param]);

  useEffect(() => {
    if (!userParam) {
      setDt({});
      return;
    }

    void searchUser(userParam);
  }, [searchUser, userParam]);

  useEffect(() => {
    const selectedLanguage = langArray.find(
      (item) =>
        String(item["CODE_CODE"] || "") ===
        String(formData?.userLang || ""),
    );

    setSelectLang(selectedLanguage || {});
  }, [formData?.userLang, langArray]);

  useEffect(() => {
    const actionType = headerAction?.type;

    if (actionType === "신규") {
      setUserParam("");
      setDt({});
      return;
    }

    if (actionType === "SAVE") {
      void savePersonalInfo();
    }
  }, [
    headerAction,
    savePersonalInfo
  ]);

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <section className="rounded-md border border-gray-300">
        <div className="rounded-t-md bg-[#C5D3E8] px-4 py-2 font-bold">
          개인 정보
        </div>

        <div
          className="p-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: "12px",
            rowGap: "12px",
            width: "100%",
          }}
        >
          <div
            className="min-w-0 w-full"
            style={{ gridColumn: "1 / -1" }}
          >
            <CommonInput
              id="personalUserId"
              value={formData?.userId || ""}
              onChange={() => { }}
              check={true}
              label="사용자 ID"
              read={true}
              align="COL"
            />
          </div>

          <div className="min-w-0 w-full">
            <CommonInput
              id="personalPass"
              value={pass}
              onChange={setPass}
              check={true}
              label="A-BASE 암호"
              type="password"
              align="COL"
            />
          </div>

          <div className="min-w-0 w-full">
            <CommonInput
              id="personalHomePass"
              value={passHp}
              onChange={setPassHp}
              check={true}
              label="홈페이지 자료실 암호"
              type="password"
              align="COL"
            />
          </div>

          <div
            className="flex w-full flex-col gap-2 rounded-md border-4 border-double border-gray-300"
            style={{ gridColumn: "1 / -1" }}
          >
            <div className="bg-[#C5D3E8] p-2 pl-3 text-sm font-bold">
              사용자 명
            </div>

            <div
              className="px-4 pb-4 pt-1"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                columnGap: "12px",
                width: "100%",
              }}
            >
              <div className="min-w-0 w-full">
                <CommonInput
                  id="personalDefaultName"
                  value={formData?.userNameDefault || ""}
                  onChange={(value) =>
                    setFormData((previous) =>
                      previous
                        ? {
                          ...previous,
                          userNameDefault: value,
                        }
                        : previous,
                    )
                  }
                  label="공용어"
                  align="COL"
                />
              </div>

              <div className="min-w-0 w-full">
                <CommonInput
                  id="personalKoreanName"
                  value={formData?.userName || ""}
                  onChange={(value) =>
                    setFormData((previous) =>
                      previous
                        ? {
                          ...previous,
                          userName: value,
                        }
                        : previous,
                    )
                  }
                  label="한글"
                  align="COL"
                />
              </div>
            </div>
          </div>

          <div
            className="min-w-0"
            style={{
              width: "calc(100% + 0.4rem)",
              marginLeft: "-0.2rem",
            }}
          >
            <CommonDropDown
              id="personalLanguage"
              header={languageHeader}
              data={langArray}
              dropHeight="5rem"
              onClick={setSelectLang}
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

          <div className="min-w-0 w-full">
            <CommonInput
              id="managementDepartment"
              value={dt["TEAM_NAME"] || ""}
              onChange={() => { }}
              label="부서"
              check={true}
              read={true}
              align="COL"
            />
          </div>

          <div className="min-w-0 w-full">
            <DateInput
              id="managementDepartmentDate"
              value={dt["TEAM_DATE"] || ""}
              label="부서 적용일"
              onChange={() => { }}
              check={true}
              read={true}
              align="COL"
            />
          </div>

          <div className="min-w-0 w-full">
            <DateInput
              id="managementJoinDate"
              value={dt["JOIN_DAY"] || ""}
              label="입사일"
              onChange={() => { }}
              check={true}
              read={true}
              align="COL"
            />
          </div>

          <div className="min-w-0 w-full">
            <DateInput
              id="managementGroupJoinDate"
              value={dt["GROUP_JOIN_DAY"] || ""}
              label="그룹 입사일"
              onChange={() => { }}
              read={true}
              align="COL"
            />
          </div>
          <div className="min-w-0 w-full">
            <CommonInput
              id="managementTerminal"
              value={
                dt["TERMINAL_NAME"] ||
                dt["TERMINAL_CODE"] ||
                ""
              }
              onChange={() => { }}
              label="터미널"
              check={true}
              read={true}
              align="COL"
            />
          </div>

          <div className="flex min-w-0 w-full flex-col gap-1">
            <div className="flex items-center">
              <CommonLabel
                id="personalSign"
                align="COL"
                label="서명등록"
                justify="START"
              />

              <IoReload
                className="ml-1 h-5 w-5 cursor-pointer rounded-md p-1 hover:bg-gray-300"
                onClick={rotateAndUpload}
              />
            </div>

            <div
              onClick={(event) => {
                event.stopPropagation();
                onPick();
              }}
              className="flex min-h-8 w-full cursor-pointer items-center justify-center rounded-md border border-gray-300 hover:bg-gray-300"
            >
              {formData?.signData && formData?.signType ? (
                formData.signType.startsWith("image/") ? (
                  <img
                    src={`data:${formData.signType};base64,${formData.signData}`}
                    alt="등록된 서명"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100px",
                    }}
                  />
                ) : (
                  <div className="mainInput flex items-center">
                    PDF 파일 등록됨
                  </div>
                )
              ) : (
                <div className="mainInput flex items-center">
                  파일 없음
                </div>
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
      </section>
    </div>
  );
}