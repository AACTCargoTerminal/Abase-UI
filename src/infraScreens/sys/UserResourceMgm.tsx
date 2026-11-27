import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from "react";
import Redirect from "../../screens/common/Redirect";
import {
  type TableHandle,
  type ModalComp,
  type TableHeaderType,
  type TableRow,
  type ToggleType,
} from "../../Util/Type";
import {
  base64ToFile,
  getApi,
  getInt,
  isValidDate,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { CommonContainer } from "../../comp/Container";
import { TableCust2 } from "../../comp/Table";
import { commonHeader2 } from "../../Util/Header";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import {
  CommonInput,
  CommonLabel,
  DateInput,
  PhoneInput,
} from "../../comp/Input";
import { ToggleBtn } from "../../comp/Common";
import dayjs from "dayjs";

import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";

import "react-image-crop/dist/ReactCrop.css";

const GRID1_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "CLASS_NAME", value: "항목", w: "8rem", sum: 0 },
  { key: "CODE_NAME", value: "코드", w: "8rem" },
  { key: "VALUE1_NAME", value: "", w: "8rem" },
  { key: "VALUE2_NAME", value: "", w: "8rem" },
  { key: "VALUE3", value: "", w: "8rem" },
  { key: "VALUE4", value: "", w: "8rem" },
];

const HRCOS_HEADER: TableHeaderType[] = [
  { key: "CODE_NAME", value: "명", w: "5rem", sum: 0 },
  { key: "VALUE1_CHAR", value: "시", w: "5rem" },
  { key: "VALUE2_CHAR", value: "구", w: "5rem" },
  { key: "VALUE3_CHAR", value: "금액", w: "7rem" },
];

const OPCOD_HEADER: TableHeaderType[] = [
  { key: "CODE_NAME", value: "코드명", w: "8rem" },
  { key: "VALUE5_CHAR", value: "코드", w: "5rem", sum: 0 },
];

const YESNO: ToggleType[] = [
  { key: "Y", value: "예" },
  { key: "N", value: "아니오" },
];

type Props = {
  file: File;
  onSave: (file: File) => void;
  onCancel: () => void;
};

export default function UserResourceMgm({
  param,
  onClose,
  pgmId,
  headerAction,
  outParam,
  closeParam,
}: ModalComp) {
  const [userSid, setUserSid] = useState(0);
  if (!param["userSid"]) {
    return <Redirect />;
  }

  useEffect(() => {
    if (param["userSid"]) {
      setUserSid(param["userSid"]);
    }
  }, [param["userSid"]]);

  useEffect(() => {
    if (userSid > 0) {
      searchClick();
      fileSearch();
    }
  }, [userSid]);

  const [classCode, setClassCode] = useState<Record<string, TableRow[]>>({});
  const [grid1, setGrid1] = useState<TableRow[]>([]);
  const [hrcosSelect, setHrcosSelect] = useState<TableRow>({
    VALUE1: dayjs().format("YYYYMMDD"),
  });
  const [hrwktSelect, setHrwktSelect] = useState<TableRow>({
    VALUE1: dayjs().format("YYYYMMDD"),
  });
  const [hrwdtSelect, setHrwdtSelect] = useState<Record<string, TableRow>>({});
  const [hrdtsSelect, setHrdtsSelect] = useState<Record<string, TableRow>>({});
  const [hrpatSelect, setHrpatSelect] = useState<TableRow>({
    VALUE1: dayjs().format("YYYYMMDD"),
  });
  const [trmcdSelect, setTrmcdSelect] = useState("");
  const [hrtauSelect, setHrtauSelect] = useState<TableRow>({});
  const [yesNo, setYesNo] = useState(0);
  const [hrorgSelect, setHrorgSelect] = useState<TableRow>({});
  const yesNoRef = useRef<boolean>(false);

  const grid1Ref = useRef<TableHandle | null>(null);
  const [fileSelect, setFileSelect] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [fileFlag, setFileFlag] = useState(false);

  useEffect(() => {
    if (!fileSelect) {
      setImageUrl("");
      return;
    }

    const url = URL.createObjectURL(fileSelect);
    setImageUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [fileSelect]);

  useEffect(() => {
    getClass("HRCOS");
    getClass("HRDTS");
    getClass("HRWDT");
    getClass("HRWKT");
    getClass("OPCOD");
    getClass("HRPAT");
    getClass("TRMCD");
    getClass("HRTAU");
    getClass("POSTN");
    getClass("HRMTR");
    getClass("HRORG");
  }, []);

  useEffect(() => {
    if (yesNoRef.current) {
      searchClick();
    }
  }, [yesNo]);
  function clear() {
    setHrcosSelect({});
    setHrwktSelect({});
    setHrwdtSelect({});
    setHrdtsSelect({});
    setHrpatSelect({
      VALUE1: dayjs().format("YYYYMMDD"),
    });
    setTrmcdSelect("");
    setHrtauSelect({});
    setHrorgSelect({});
  }

  useEffect(() => {
    if (headerAction?.type === "신규") {
      clear();
    }
    if (headerAction?.type === "저장") {
      saveClick();
    }
    if (headerAction?.type === "삭제") {
      const tmp = grid1Ref.current?.getChk();

      if (tmp !== undefined && Object.keys(tmp).length > 0) {
        const array = Object.values(tmp).map((v) => ({
          USER_SID: userSid,
          ...v,
        }));
        delClick(array);
      } else {
        sendErr("항목을 선택해주세요.");
      }
    }
    if (headerAction?.type === "사진저장") {
      fileSave();
    }
  }, [headerAction?.type]);

  const delClick = useCallback(
    async (table: TableRow[]) => {
      const map = new Map<string, any>();
      map.set("DEL", table);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "AUTH",
        method: "POST",
        url: `/user/delUserRel`,
        params: map,
        pgmId: pgmId,
        sucFlag: true,
      });
      if (res.ok) {
        clear();
        await searchClick();
        outParam?.({ SEARCH: "SEARCH" });
      }
    },
    [userSid, yesNo],
  );

  const saveClick = useCallback(async () => {
    const retirementInput = hrwdtSelect["B"];

    // 조회된 목록에서 기존 퇴사 정보를 가져옴
    const existingRetirement = grid1.find(
      (row) =>
        row["CLASS_CODE"] === "HRWDT" &&
        row["CODE_CODE"] === "B" &&
        String(row["YYYY"] || "0000") ===
          String(retirementInput?.["YYYY"] || "0000"),
    );

    // 퇴사 항목을 입력한 경우에만 저장할 값을 구성
    const retirementToSave: TableRow | undefined = retirementInput
      ? {
          ...existingRetirement,
          ...retirementInput,

          // 퇴사일을 입력하지 않았다면 기존 퇴사일 유지
          VALUE1:
            retirementInput["VALUE1"] || existingRetirement?.["VALUE1"] || "",

          VALUE2: retirementInput["VALUE2"] || "",
        }
      : undefined;

    if (retirementToSave) {
      // 적용일을 직접 입력하지 않았다면 기본값 설정
      if (!retirementToSave["VALUE2"]) {
        if (retirementInput?.["VALUE1"]) {
          // 퇴사일을 새로 입력한 경우: 해당 날짜 +3일
          retirementToSave["VALUE2"] = isValidDate(retirementToSave["VALUE1"])
            ? dayjs(retirementToSave["VALUE1"]).add(3, "day").format("YYYYMMDD")
            : "";
        } else {
          // 기존 적용일을 유지하고, 없으면 기존 퇴사일 +3일
          retirementToSave["VALUE2"] =
            existingRetirement?.["VALUE2"] ||
            (isValidDate(retirementToSave["VALUE1"])
              ? dayjs(retirementToSave["VALUE1"])
                  .add(3, "day")
                  .format("YYYYMMDD")
              : "");
        }
      }

      const retireDate = retirementToSave["VALUE1"];
      const effectiveDate = retirementToSave["VALUE2"];

      if (retireDate && !isValidDate(retireDate)) {
        sendErr("퇴사일을 올바르게 입력해주세요.");
        return;
      }

      if (effectiveDate && !isValidDate(effectiveDate)) {
        sendErr("퇴사 적용일을 올바르게 입력해주세요.");
        return;
      }

      if (
        retireDate &&
        effectiveDate &&
        dayjs(effectiveDate).isBefore(dayjs(retireDate), "day")
      ) {
        sendErr("퇴사 적용일은 퇴사일보다 빠를 수 없습니다.");
        return;
      }
    }

    const map = new Map<string, any>();
    const tableTmp: TableRow[] = [];
    if (hrcosSelect?.["CODE_CODE"] && hrcosSelect?.["VALUE1"]) {
      const hrcosTmp: TableRow = {
        CLASS_CODE: "HRCOS",
        USER_SID: userSid,
        YYYY: "0000",
        CODE_CODE: hrcosSelect?.["CODE_CODE"],
        VALUE1: hrcosSelect?.["VALUE1"],
        TYPE: "Y",
      };
      tableTmp.push(hrcosTmp);
    }
    if (hrwktSelect?.["CODE_CODE"] && hrwktSelect?.["VALUE1"]) {
      const hrwktTmp: TableRow = {
        CLASS_CODE: "HRWKT",
        USER_SID: userSid,
        YYYY: "0000",
        CODE_CODE: hrwktSelect?.["CODE_CODE"],
        VALUE1: hrwktSelect?.["VALUE1"],
        TYPE: "Y",
      };
      tableTmp.push(hrwktTmp);
    }

    Object.keys(hrwdtSelect).forEach((v) => {
      const row = v === "B" ? retirementToSave : hrwdtSelect[v];

      if (!row) return;

      const canSave =
        isValidDate(row["VALUE1"]) || (v === "B" && isValidDate(row["VALUE2"]));

      if (canSave) {
        tableTmp.push({
          CLASS_CODE: "HRWDT",
          CODE_CODE: v,
          USER_SID: userSid,
          YYYY: row["YYYY"] || "0000",
          VALUE1: row["VALUE1"] || "",
          VALUE2: row["VALUE2"] || "",
          VALUE3: row["VALUE3"],
          VALUE4: row["VALUE4"],
        });
      }
    });
    Object.keys(hrdtsSelect).forEach((v) => {
      if (hrdtsSelect?.[v] && hrdtsSelect?.[v]?.["CODE_CODE"]) {
        if (hrdtsSelect?.[v]?.["VALUE1"] && hrdtsSelect?.[v]?.["VALUE2"]) {
          tableTmp.push({
            CLASS_CODE: "OPCOD",
            YYYY: "0000",
            CODE_CODE: hrdtsSelect?.[v]?.["CODE_CODE"],
            USER_SID: userSid,
            VALUE1: hrdtsSelect?.[v]?.["VALUE1"],
            VALUE2: hrdtsSelect?.[v]?.["VALUE2"],
            VALUE3: hrdtsSelect?.[v]?.["VALUE3"],
            VALUE4: hrdtsSelect?.[v]?.["VALUE4"],
          });
        }
      }
    });

    if (
      Object.keys(hrpatSelect).length > 0 &&
      hrpatSelect?.["CODE_CODE"] &&
      hrpatSelect?.["VALUE1"]
    ) {
      if (!isValidDate(hrpatSelect?.["VALUE1"])) {
        sendErr("부서 발령일을 확인해주세요");
        return;
      }

      tableTmp.push({
        CLASS_CODE: "HRPAT",
        YYYY: "0000",
        CODE_CODE: hrpatSelect?.["CODE_CODE"],
        USER_SID: userSid,
        VALUE1: hrpatSelect?.["VALUE1"],
        VALUE2: "",
        VALUE3: "",
        VALUE4: "",
      });
    }
    if (trmcdSelect) {
      tableTmp.push({
        CLASS_CODE: "TRMCD",
        YYYY: "0000",
        CODE_CODE: trmcdSelect,
        USER_SID: userSid,
        VALUE1: "",
        VALUE2: "",
        VALUE3: "",
        VALUE4: "",
      });
    }

    if (Object.keys(hrtauSelect).length > 0 && hrtauSelect?.["CODE_CODE"]) {
      if (!hrtauSelect?.["VALUE1"] || !hrtauSelect?.["VALUE2"]) {
        sendErr("터미널 또는 직급이 없습니다.");
        return;
      }

      tableTmp.push({
        CLASS_CODE: "HRTAU",
        YYYY: "0000",
        CODE_CODE: hrtauSelect?.["CODE_CODE"] || "",
        USER_SID: userSid,
        VALUE1: hrtauSelect?.["VALUE1"] || "",
        VALUE2: hrtauSelect?.["VALUE2"] || "",
        VALUE3: "",
        VALUE4: "",
      });
    }
    if (Object.keys(hrorgSelect).length > 0 && hrorgSelect?.["CODE_CODE"]) {
      if (!hrorgSelect?.["VALUE1"] || !hrorgSelect?.["VALUE2"]) {
        sendErr("핸드폰, 내선번호는 직급설정시 필수 입력입니다.");
        return;
      }

      tableTmp.push({
        CLASS_CODE: "HRORG",
        YYYY: "0000",
        CODE_CODE: hrorgSelect?.["CODE_CODE"] || "",
        USER_SID: userSid,
        VALUE1: hrorgSelect?.["VALUE1"] || "",
        VALUE2: hrorgSelect?.["VALUE2"] || "",
        VALUE3: "",
        VALUE4: "",
      });
    }
    if (tableTmp.length === 0) {
      sendErr("저장할 항목이 없습니다.");
      return;
    }
    map.set("codeArray", tableTmp);

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      url: `/user/setUserRel`,
      params: map,
      pgmId: pgmId,
      sucFlag: true,
    });

    if (res.ok) {
      clear();
      searchClick();
      closeParam?.({ CLOSE: "CLOSE" });
    }
  }, [
    hrcosSelect,
    hrwktSelect,
    hrwdtSelect,
    hrdtsSelect,
    userSid,
    hrpatSelect,
    trmcdSelect,
    hrtauSelect,
    grid1,
    hrorgSelect,
  ]);

  async function getClass(classCode: string) {
    const res = await getApi<TableRow[]>({
      baseUrl: "SYS",
      method: "GET",
      url: `/sys/getBaseOds?classCode=${classCode}&codeName=`,
      pgmId: pgmId,
    });

    if (res.ok) {
      if (res.data) {
        if (classCode === "OPCOD") {
          const tmp = res.data.filter((v) => {
            if (v["VALUE7_CHAR"] === "Y" || v["VALUE7_CHAR"] === "A") {
              return true;
            }
            return false;
          });
          setClassCode((prev) => ({
            ...prev,
            [classCode]: tmp,
          }));
        } else {
          setClassCode((prev) => ({
            ...prev,
            [classCode]: res.data || [],
          }));
        }
      }
    }
  }

  const searchClick = useCallback(async () => {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/user/getUserRel?userSid=${userSid}&usableFlag=${YESNO[yesNo].key}`,
      pgmId: pgmId,
    });

    if (res.ok) {
      if (res.data) {
        setGrid1(res.data[0]);
      }
    }
  }, [userSid, yesNo]);

  const fileClick = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택 가능합니다.");
      return;
    }

    // 바로 저장하지 않고 편집기 실행
    setEditFile(file);
  }, []);

  const fileSearch = useCallback(async () => {
    sendLoading(true);
    const res = await getApi<TableRow[]>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/user/getUserM010_004?userSid=${userSid}&type=A`,
      pgmId: pgmId,
      sucFlag: true,
    });
    sendLoading(false);

    if (res.ok) {
      const tmp = res.data?.[0];
      if (tmp) {
        const fileTmp = base64ToFile(
          tmp?.["DATA"],
          tmp?.["FILE_NAME"],
          tmp?.["MIME"],
        );
        setFileSelect(fileTmp);
      }
    }
  }, [userSid]);

  const fileSave = useCallback(async () => {
    if (!fileFlag) {
      sendErr("저장할 파일이 없습니다.");
      return;
    }

    const map = new Map();
    map.set("userSid", userSid);
    map.set("type", "A");
    sendLoading(true);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      url: `/user/setUserM010_014`,
      params: map,
      files: fileSelect ? [fileSelect] : [],
      pgmId: pgmId,
      sucFlag: true,
    });
    sendLoading(false);
    if (res.ok) {
      await fileSearch();
    }
  }, [fileFlag, fileSelect, userSid]);
  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-4 py-[3%] px-[2%] gap-3">
        <div className="mainInput">
          <CommonDropDown
            data={classCode["HRCOS"] || []}
            dropHeight="15rem"
            header={HRCOS_HEADER}
            id="hrcos"
            inputKey={{
              key: "CODE_CODE",
              showKey: "0",
              value: hrcosSelect?.["CODE_CODE"] || "",
            }}
            onClick={(r) => {
              setHrcosSelect((prev) => ({
                ...prev,
                CODE_CODE: r["CODE_CODE"],
              }));
            }}
            title="심야교통비"
          />
        </div>
        <div className="mainInput">
          <CommonDatePicker
            title="적용일"
            id="hrcosDate"
            onClick={(v) => {
              setHrcosSelect((prev) => ({ ...prev, VALUE1: v }));
            }}
            colSize="30%"
            arrowNo={false}
            value={hrcosSelect?.["VALUE1"] || ""}
          />
        </div>
        <div className="mainInput">
          <CommonDropDown
            data={classCode["HRWKT"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="hrwkt"
            inputKey={{
              key: "CODE_CODE",
              showKey: "0",
              value: hrwktSelect?.["CODE_CODE"] || "",
            }}
            onClick={(r) => {
              setHrwktSelect((prev) => ({
                ...prev,
                CODE_CODE: r["CODE_CODE"],
              }));
            }}
            title="근무타입"
          />
        </div>
        <div className="mainInput">
          <CommonDatePicker
            title="적용일"
            id="hrwktDate"
            onClick={(v) => {
              setHrwktSelect((prev) => ({ ...prev, VALUE1: v }));
            }}
            colSize="30%"
            arrowNo={false}
            value={hrwktSelect?.["VALUE1"] || ""}
          />
        </div>
        {(classCode?.["HRWDT"] ?? []).map((v, idx) => {
          if (v["VALUE1_NUMBER"] === 0) {
            return (
              <div
                className="col-span-4 grid grid-cols-[17%_10%_10%_10%] gap-3 mainInput"
                key={idx}>
                <span className="flex items-center">{v["CODE_NAME"]}</span>
                <CommonInput
                  id={v["VALUE2_CHAR"]}
                  value={hrwdtSelect?.[v["CODE_CODE"]]?.["VALUE1"]}
                  read={true}
                />
                <CommonInput
                  id={v["VALUE3_CHAR"]}
                  value={hrwdtSelect?.[v["CODE_CODE"]]?.["VALUE2"]}
                  onChange={(r) => {
                    setHrwdtSelect((prev) => ({
                      ...prev,
                      [v["CODE_CODE"]]: {
                        ...prev[v["CODE_CODE"]],
                        VALUE2: getInt(r),
                      },
                    }));
                  }}
                />
                <CommonInput
                  id={v["VALUE4_CHAR"]}
                  value={hrwdtSelect?.[v["CODE_CODE"]]?.["VALUE3"]}
                  onChange={(r) => {
                    setHrwdtSelect((prev) => ({
                      ...prev,
                      [v["CODE_CODE"]]: {
                        ...prev[v["CODE_CODE"]],
                        VALUE3: getInt(r),
                      },
                    }));
                  }}
                />
              </div>
            );
          } else {
            const isRetirement = v["CODE_CODE"] === "B";

            let css = 1;

            if (isRetirement) {
              // 퇴사일(VALUE1), 퇴사 적용일(VALUE2)
              css = 2;
            } else if (v["VALUE3_CHAR"] === "Y") {
              css++;
            } else if (v["VALUE4_CHAR"] === "Y") {
              css++;
            }

            return Array.from({ length: css }).map((_, i) => (
              <div className="mainInput" key={`${v["CODE_CODE"]}-${i}`}>
                <DateInput
                  id={`hrwdt${v["CODE_CODE"]}${i}`}
                  onChange={(s) => {
                    setHrwdtSelect((prev) => {
                      const code = v["CODE_CODE"];

                      const nextRow = {
                        ...prev[code],
                        [`VALUE${i + 1}`]: s,
                      };

                      // 퇴사일을 변경하면 적용일을 퇴사일 +3일로 설정
                      if (isRetirement && i === 0) {
                        nextRow["VALUE2"] = isValidDate(s)
                          ? dayjs(s).add(3, "day").format("YYYYMMDD")
                          : "";
                      }

                      return {
                        ...prev,
                        [code]: nextRow,
                      };
                    });
                  }}
                  label={
                    i === 0
                      ? v["CODE_NAME"]
                      : isRetirement
                        ? "퇴사 적용일"
                        : undefined
                  }
                  value={hrwdtSelect[v["CODE_CODE"]]?.[`VALUE${i + 1}`] || ""}
                  labelW="33.5%"
                />
              </div>
            ));
          }
        })}
        {/* {(classCode?.["HRDTS"] ?? []).map((v) => {
          let css = 1;
          if (v["VALUE3_CHAR"] === "Y") css++;
          return (
            <div className="col-span-4 grid grid-cols-[10.5%_20%_20%_20%] gap-3 mainInput">
              <span className="flex items-center">{v["CODE_NAME"]}</span>
              {(v["VALUE1_CHAR"] === "Y" || v["VALUE1_CHAR"] === "N") && (
                <div className="mainInput">
                  <CommonDropDown
                    data={(classCode?.["OPCOD"] || []).filter(
                      (f) => f["VALUE1_CHAR"] === v["VALUE1_CHAR"],
                    )}
                    dropHeight="10rem"
                    header={OPCOD_HEADER}
                    id={`opcod${v["VALUE1_CHAR"]}`}
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0",
                      value: hrdtsSelect?.[v["CODE_CODE"]]?.["CODE_CODE"] || "",
                    }}
                    onClick={(t) => {
                      setHrdtsSelect((prev) => ({
                        ...prev,
                        [v["CODE_CODE"]]: { CODE_CODE: t["CODE_CODE"] },
                      }));
                    }}
                    find={true}
                  />
                </div>
              )}

              {Array.from({ length: css }).map((_, i) => (
                <div className="mainInput" key={`${v["CODE_CODE"]}-${i}`}>
                  <CommonDatePicker
                    id={`hrdts${v["CODE_CODE"]}${i}`}
                    onClick={(s) => {
                      setHrdtsSelect((prev) => ({
                        ...prev,
                        [v["CODE_CODE"]]: {
                          ...prev[v["CODE_CODE"]],
                          [`VALUE${i + 1}`]: s,
                        },
                      }));
                    }}
                    arrowNo={false}
                    value={hrdtsSelect[v["CODE_CODE"]]?.[`VALUE${i + 1}`]}
                  />
                </div>
              ))}
            </div>
          );
        })} */}
        <div className="mainInput col-span-2 grid grid-cols-[0.6fr_0.35fr] gap-3">
          {" "}
          <CommonDropDown
            title="부서"
            data={classCode?.["HRPAT"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="hrpat"
            inputKey={{
              key: "CODE_CODE",
              showKey: "0",
              value: hrpatSelect?.["CODE_CODE"] || "",
            }}
            onClick={(r) => {
              setHrpatSelect((prev) => ({
                ...prev,
                CODE_CODE: r?.["CODE_CODE"] || "",
              }));
            }}
            find={true}
          />
          <DateInput
            id={`hrpatDate`}
            onChange={(s) => {
              setHrpatSelect((prev) => ({ ...prev, VALUE1: s }));
            }}
            value={hrpatSelect?.["VALUE1"] || ""}
          />
          {/* <CommonDatePicker
            id={`hrpatDate`}
            onClick={(s) => {
              setHrpatSelect((prev) => ({ ...prev, VALUE1: s }));
            }}
            arrowNo={false}
            value={hrpatSelect?.["VALUE1"] || ""}
          /> */}
        </div>

        <div className="mainInput flex gap-11">
          <CommonLabel id="usableFlag" label="사용여부" />
          <ToggleBtn
            array={YESNO}
            onClick={(v) => {
              const tmp = YESNO.findIndex((r) => r.key === v);
              if (tmp >= 0) {
                yesNoRef.current = true;
                setYesNo(tmp);
              }
            }}
            idx={yesNo}
          />
        </div>
        <div />
        <div className="mainInput">
          {" "}
          <CommonDropDown
            title="근무 터미널"
            data={classCode?.["TRMCD"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="trmcd"
            inputKey={{ key: "CODE_CODE", showKey: "0", value: trmcdSelect }}
            onClick={(r) => {
              setTrmcdSelect(r["CODE_CODE"]);
            }}
            labelW="35%"
          />
        </div>
        <div className="mainInput col-span-3 grid grid-cols-[0.5fr_0.2fr_0.2fr] gap-3">
          {" "}
          <CommonDropDown
            title="HR 권한"
            data={classCode?.["HRTAU"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="hrmtr"
            inputKey={{
              key: "CODE_CODE",
              showKey: "0",
              value: hrtauSelect?.["CODE_CODE"] || "",
            }}
            onClick={(r) => {
              setHrtauSelect({ CODE_CODE: r["CODE_CODE"] });
            }}
            labelW="35%"
            find={true}
          />
          <CommonDropDown
            data={classCode?.["HRMTR"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="hrmtr"
            inputKey={{
              key: "CODE_CODE",
              showKey: "0",
              value: hrtauSelect?.["VALUE1"] || "",
            }}
            onClick={(r) => {
              setHrtauSelect((prev) => ({ ...prev, VALUE1: r["CODE_CODE"] }));
            }}
          />
          <CommonDropDown
            data={classCode?.["POSTN"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="postn"
            inputKey={{
              key: "CODE_CODE",
              showKey: "0",
              value: hrtauSelect?.["VALUE2"] || "",
            }}
            onClick={(r) => {
              setHrtauSelect((prev) => ({ ...prev, VALUE2: r["CODE_CODE"] }));
            }}
          />
        </div>
        <div className="mainInput">
          <CommonDropDown
            id="hrogr"
            data={classCode?.["HRORG"] || []}
            dropHeight="10rem"
            header={commonHeader2}
            inputKey={{
              key: "CODE_CODE",
              showKey: "0",
              value: hrorgSelect?.["CODE_CODE"] || "",
            }}
            onClick={(r) => {
              setHrorgSelect((prev) => ({
                ...prev,
                CODE_CODE: r?.["CODE_CODE"] || "",
              }));
            }}
            title="직급"
            find={true}
          />
        </div>
        <div className="mainInput">
          <PhoneInput
            id="phone"
            value={hrorgSelect?.["VALUE1"] || ""}
            label="핸드폰"
            labelW="25%"
            holder="010-1234-1234"
            onChange={(v) =>
              setHrorgSelect((prev) => ({ ...prev, ["VALUE1"]: v }))
            }
          />
        </div>
        <div className="mainInput">
          <PhoneInput
            id="mobile"
            value={hrorgSelect?.["VALUE2"] || ""}
            label="내선번호"
            labelW="30%"
            holder="744-1234"
            onChange={(v) =>
              setHrorgSelect((prev) => ({ ...prev, ["VALUE2"]: v }))
            }
          />
        </div>
        <div className="row-span-3 flex gap-3">
          <CommonLabel id="fileName" label="사진" />
          <div
            onClick={(event) => {
              event.stopPropagation();
              document.getElementById("resourcefile")?.click();
            }}
            className="flex w-[100px] aspect-[3/4] cursor-pointer
               items-center justify-center overflow-hidden
               rounded-md border border-gray-300">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="사진"
                className="h-full w-full object-cover"
              />
            ) : (
              <div>파일 없음</div>
            )}
          </div>
          <input
            id="resourcefile"
            type="file"
            accept="image/*"
            hidden
            onChange={fileClick}
          />
          {editFile && (
            <ImageCropEditor
              file={editFile}
              onSave={(resultFile) => {
                setFileFlag(true);
                setFileSelect(resultFile);
                setEditFile(null);
              }}
              onCancel={() => setEditFile(null)}
            />
          )}
        </div>
      </div>

      <div>
        <TableCust2
          body={grid1}
          header={GRID1_HEADER}
          height="20rem"
          width="100%"
          batch={true}
          ref={grid1Ref}
          onClick={async (r) => {
            const tmp = r["CLASS_CODE"];
            if (tmp === "HRCOS") {
              clear();
              setHrcosSelect({
                CODE_CODE: r["CODE_CODE"],
                VALUE1: r["VALUE1"],
              });
            } else if (tmp === "HRWKT") {
              clear();
              setHrpatSelect({
                CODE_CODE: r["CODE_CODE"],
                VALUE1: r["VALUE1"],
              });
            } else if (tmp === "HRWDT") {
              clear();
              setHrwdtSelect((prev) => ({
                ...prev,
                [r["CODE_CODE"]]: {
                  YYYY: r["YYYY"],
                  VALUE1: r["VALUE1"],
                  VALUE2: r["VALUE2"],
                  VALUE3: r["VALUE3"],
                  VALUE4: r["VALUE4"],
                },
              }));
            } else if (tmp === "OPCOD") {
              clear();
              const tmpObj = (classCode?.["OPCOD"] || []).find(
                (row) => row["CODE_CODE"] === r["CODE_CODE"],
              );
              if (tmpObj) {
                const code = tmpObj?.["VALUE1_CHAR"] || "";
                const tmpHrdts = (classCode?.["HRDTS"] || []).find(
                  (row) => row["VALUE1_CHAR"] === code,
                );
                if (tmpHrdts) {
                  setHrdtsSelect((prev) => ({
                    ...prev,
                    [tmpHrdts["CODE_CODE"]]: {
                      CODE_CODE: r["CODE_CODE"],
                      VALUE1: r["VALUE1"],
                      VALUE2: r["VALUE2"],
                      VALUE3: r["VALUE3"],
                      VALUE4: r["VALUE4"],
                    },
                  }));
                } else {
                  clear();
                  const tmpHrdts2 = (classCode?.["HRDTS"] || []).find(
                    (row) => row["VALUE1_CHAR"] === tmpObj?.["CODE_CODE"] || "",
                  );
                  if (tmpHrdts2) {
                    setHrdtsSelect((prev) => ({
                      ...prev,
                      [tmpHrdts2["CODE_CODE"]]: {
                        CODE_CODE: r["CODE_CODE"],
                        VALUE1: r["VALUE1"],
                        VALUE2: r["VALUE2"],
                        VALUE3: r["VALUE3"],
                        VALUE4: r["VALUE4"],
                      },
                    }));
                  } else {
                    sendErr("해당 항목과 맞는 코드가 없습니다.");
                  }
                }
              } else {
                sendErr("해당 항목과 맞는 코드가 없습니다.");
              }
            } else if (tmp === "HRPAT") {
              clear();
              setHrpatSelect({
                CODE_CODE: r["CODE_CODE"],
                VALUE1: r["VALUE1"],
              });
            } else if (tmp === "TRMCD") {
              clear();
              setTrmcdSelect(r["CODE_CODE"]);
            } else if (tmp === "HRTAU") {
              clear();
              setHrtauSelect(r);
            } else if (tmp === "HRORG") {
              clear();
              setHrorgSelect(r);
            } else {
              clear();
            }
            return false;
          }}
        />
      </div>
    </div>
  );
}

const cropImage = async (
  image: HTMLImageElement,
  area: PixelCrop,
  fileName: string,
): Promise<File> => {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const sx = area.x * scaleX;
  const sy = area.y * scaleY;
  const sw = area.width * scaleX;
  const sh = area.height * scaleY;

  if (sw <= 0 || sh <= 0) {
    throw new Error("잘못된 자르기 영역");
  }

  const canvas = document.createElement("canvas");

  // 선택 영역의 원본 해상도를 유지
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 생성 실패");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("이미지 변환 실패"));
    }, "image/png");
  });

  return new File([blob], fileName.replace(/\.[^.]+$/, "") + ".png", {
    type: "image/png",
  });
};

function ImageCropEditor({ file, onSave, onCancel }: Props) {
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);

  // true: 3:4 고정, false: 자유롭게 조절
  const [fixedRatio, setFixedRatio] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // 이미지 최초 로딩 시 자르기 영역 설정
  const onImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;

    if (fixedRatio) {
      const initialCrop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 70,
          },
          3 / 4,
          width,
          height,
        ),
        width,
        height,
      );

      setCrop(initialCrop);
    } else {
      setCrop({
        unit: "%",
        x: 15,
        y: 15,
        width: 70,
        height: 70,
      });
    }
  };

  const handleRatioChange = (checked: boolean) => {
    setFixedRatio(checked);
    setCompletedCrop(null);

    const img = imgRef.current;
    if (!img) return;

    const { width, height } = img;

    if (checked) {
      setCrop(
        centerCrop(
          makeAspectCrop({ unit: "%", width: 70 }, 3 / 4, width, height),
          width,
          height,
        ),
      );
    } else {
      setCrop({
        unit: "%",
        x: 15,
        y: 15,
        width: 70,
        height: 70,
      });
    }
  };

  const handleSave = async () => {
    if (!imgRef.current || !crop || saving) return;

    try {
      setSaving(true);

      // 현재 선택 영역을 화면 픽셀 단위로 계산
      const img = imgRef.current;
      const displayWidth = img.width;
      const displayHeight = img.height;

      const pixelCrop: PixelCrop =
        crop.unit === "%"
          ? {
              unit: "px",
              x: (crop.x / 100) * displayWidth,
              y: (crop.y / 100) * displayHeight,
              width: (crop.width / 100) * displayWidth,
              height: (crop.height / 100) * displayHeight,
            }
          : {
              ...crop,
              unit: "px",
            };

      if (pixelCrop.width <= 0 || pixelCrop.height <= 0) {
        alert("자르기 영역을 선택해주세요.");
        return;
      }

      const resultFile = await cropImage(img, pixelCrop, file.name);

      onSave(resultFile);
    } catch (error) {
      console.error(error);
      alert("이미지 자르기에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="w-[500px] max-w-[95vw] rounded-lg bg-white p-4">
        <h3 className="mb-3 text-lg font-bold">사진 편집</h3>

        {/* 3:4 비율 설정 */}
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={fixedRatio}
            onChange={(e) => handleRatioChange(e.target.checked)}
          />
          <span className="text-sm">3:4 비율 고정</span>
        </div>

        {/* 사진 영역 */}
        <div className="flex h-[400px] items-center justify-center overflow-auto bg-gray-900 p-3">
          {imageUrl && (
            <ReactCrop
              crop={crop}
              onChange={(nextCrop) => setCrop(nextCrop)}
              onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
              aspect={fixedRatio ? 3 / 4 : undefined}
              minWidth={20}
              minHeight={20}
              keepSelection
              ruleOfThirds>
              <img
                ref={imgRef}
                src={imageUrl}
                alt="편집할 사진"
                onLoad={onImageLoad}
                style={{
                  maxWidth: "100%",
                  maxHeight: "370px",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </ReactCrop>
          )}
        </div>

        {/* 선택 영역 정보 */}
        <div className="mt-3 text-xs text-gray-500">
          {completedCrop
            ? `선택 영역: ${Math.round(completedCrop.width)} × ${Math.round(completedCrop.height)}px (화면 기준)`
            : "마우스로 자르기 영역을 선택하세요."}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-4 py-2">
            취소
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !crop}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
            {saving ? "처리 중" : "자르기 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
