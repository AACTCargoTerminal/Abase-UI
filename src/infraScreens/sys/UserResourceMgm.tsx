import { useCallback, useEffect, useRef, useState } from "react";
import Redirect from "../../screens/common/Redirect";
import {
  type TableHandle,
  type ModalComp,
  type TableHeaderType,
  type TableRow,
  type ToggleType,
} from "../../Util/Type";
import { getApi, getInt, sendErr } from "../../Util/Util";
import { CommonContainer } from "../../comp/Container";
import { TableCust2 } from "../../comp/Table";
import { commonHeader2 } from "../../Util/Header";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { CommonInput, CommonLabel, DateInput } from "../../comp/Input";
import { ToggleBtn } from "../../comp/Common";

const GRID1_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "CLASS_NAME", value: "항목", w: "8rem", sum: 0 },
  { key: "CODE_NAME", value: "코드", w: "8rem" },
  { key: "VALUE1", value: "", w: "8rem" },
  { key: "VALUE2", value: "", w: "8rem" },
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
  { key: "VALUE5_CHAR", value: "코드", w: "5rem", sum: 0 },
];

const YESNO: ToggleType[] = [
  { key: "Y", value: "예" },
  { key: "N", value: "아니오" },
];

export default function UserResourceMgm({
  param,
  onClose,
  pgmId,
  headerAction,
  outParam,
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
    }
  }, [userSid]);

  const [classCode, setClassCode] = useState<Record<string, TableRow[]>>({});
  const [grid1, setGrid1] = useState<TableRow[]>([]);
  const [hrcosSelect, setHrcosSelect] = useState<TableRow>({});
  const [hrwktSelect, setHrwktSelect] = useState<TableRow>({});
  const [hrwdtSelect, setHrwdtSelect] = useState<Record<string, TableRow>>({});
  const [hrdtsSelect, setHrdtsSelect] = useState<Record<string, TableRow>>({});
  const [hrpatSelect, setHrpatSelect] = useState("");
  const [trmcdSelect, setTrmcdSelect] = useState("");
  const [yesNo, setYesNo] = useState(0);
  const yesNoRef = useRef<boolean>(false);

  const grid1Ref = useRef<TableHandle | null>(null);

  useEffect(() => {
    getClass("HRCOS");
    getClass("HRDTS");
    getClass("HRWDT");
    getClass("HRWKT");
    getClass("OPCOD");
    getClass("HRPAT");
    getClass("TRMCD");
  }, []);

  useEffect(() => {
    if (yesNoRef.current) {
      searchClick();
    }
  }, [yesNo]);

  useEffect(() => {
    if (headerAction?.type === "신규") {
      setHrcosSelect({});
      setHrwktSelect({});
      setHrwdtSelect({});
      setHrdtsSelect({});
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
        setHrcosSelect({});
        setHrwktSelect({});
        setHrwdtSelect({});
        setHrdtsSelect({});
      }
      await searchClick();
    },
    [userSid, yesNo],
  );

  const saveClick = useCallback(async () => {
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
      if (hrwdtSelect?.[v]) {
        if (hrwdtSelect?.[v]?.["VALUE1"]) {
          tableTmp.push({
            CLASS_CODE: "HRWDT",
            CODE_CODE: v,
            USER_SID: userSid,
            YYYY: hrwdtSelect?.[v]?.["YYYY"] || "0000",
            VALUE1: hrwdtSelect?.[v]?.["VALUE1"],
            VALUE2: hrwdtSelect?.[v]?.["VALUE2"],
            VALUE3: hrwdtSelect?.[v]?.["VALUE3"],
            VALUE4: hrwdtSelect?.[v]?.["VALUE4"],
          });
        }
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

    if (hrpatSelect) {
      tableTmp.push({
        CLASS_CODE: "HRPAT",
        YYYY: "0000",
        CODE_CODE: hrpatSelect,
        USER_SID: userSid,
        VALUE1: "",
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

    map.set("SAVE", tableTmp);

    if (tableTmp.length === 0) {
      sendErr("저장할 항목이 없습니다.");
      return;
    }

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      url: `/user/setUserRel`,
      params: map,
      pgmId: pgmId,
      sucFlag: true,
    });

    if (res.ok) {
      setHrcosSelect({});
      setHrwktSelect({});
      setHrwdtSelect({});
      setHrdtsSelect({});
      searchClick();
    }
  }, [
    hrcosSelect,
    hrwktSelect,
    hrwdtSelect,
    hrdtsSelect,
    userSid,
    hrpatSelect,
    trmcdSelect,
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
            if (!v["VALUE2_CHAR"] && !v["VALUE3_CHAR"]) {
              return !(v["VALUE4_CHAR"] === "Y");
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
              setHrcosSelect({ CODE_CODE: r["CODE_CODE"] });
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
              setHrwktSelect({ CODE_CODE: r["CODE_CODE"] });
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
            let css = 1;
            if (v["VALUE3_CHAR"] === "Y") css++;
            else if (v["VALUE4_CHAR"] === "Y") css++;

            return Array.from({ length: css }).map((_, i) => (
              <div className="mainInput" key={`${v["CODE_CODE"]}-${i}`}>
                <DateInput
                  id={`hrwdt${v["CODE_CODE"]}${i}`}
                  onChange={(s) => {
                    console.log(s);
                    setHrwdtSelect((prev) => ({
                      ...prev,
                      [v["CODE_CODE"]]: { [`VALUE${i + 1}`]: s },
                    }));
                  }}
                  label={i === 0 ? v["CODE_NAME"] : undefined}
                  value={hrwdtSelect[v["CODE_CODE"]]?.[`VALUE${i + 1}`]}
                  labelW="33.5%"
                />
              </div>
            ));
          }
        })}
        {(classCode?.["HRDTS"] ?? []).map((v) => {
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
        })}
        <div className="mainInput">
          {" "}
          <CommonDropDown
            title="부서"
            data={classCode?.["HRPAT"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="hrpat"
            inputKey={{ key: "CODE_CODE", showKey: "0", value: hrpatSelect }}
            onClick={(r) => {
              setHrpatSelect(r["CODE_CODE"]);
            }}
          />
        </div>
        <div className="mainInput">
          {" "}
          <CommonDropDown
            title="터미널"
            data={classCode?.["TRMCD"] || []}
            dropHeight="15rem"
            header={commonHeader2}
            id="trmcd"
            inputKey={{ key: "CODE_CODE", showKey: "0", value: trmcdSelect }}
            onClick={(r) => {
              setTrmcdSelect(r["CODE_CODE"]);
            }}
          />
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
              setHrcosSelect({
                CODE_CODE: r["CODE_CODE"],
                VALUE1: r["VALUE1"],
              });
              setHrwktSelect({});
              setHrwdtSelect({});
              setHrdtsSelect({});
              setHrpatSelect("");
              setTrmcdSelect("");
            } else if (tmp === "HRWKT") {
              setHrwktSelect({
                CODE_CODE: r["CODE_CODE"],
                VALUE1: r["VALUE1"],
              });
              setHrwdtSelect({});
              setHrdtsSelect({});
              setHrcosSelect({});
              setHrpatSelect("");
              setTrmcdSelect("");
            } else if (tmp === "HRWDT") {
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
              setHrcosSelect({});
              setHrwktSelect({});
              setHrdtsSelect({});
              setHrpatSelect("");
              setTrmcdSelect("");
            } else if (tmp === "OPCOD") {
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
                  setHrcosSelect({});
                  setHrwktSelect({});
                  setHrwdtSelect({});
                  setHrpatSelect("");
                  setTrmcdSelect("");
                } else {
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
                    setHrcosSelect({});
                    setHrwktSelect({});
                    setHrwdtSelect({});
                    setHrpatSelect("");
                    setTrmcdSelect("");
                  } else {
                    sendErr("해당 항목과 맞는 코드가 없습니다.");
                  }
                }
              } else {
                sendErr("해당 항목과 맞는 코드가 없습니다.");
              }
            } else if (tmp === "HRPAT") {
              setHrpatSelect(r["CODE_CODE"]);
            } else if (tmp === "TRMCD") {
              setTrmcdSelect(r["CODE_CODE"]);
            } else {
              setHrpatSelect("");
              setTrmcdSelect("");
              setHrcosSelect({});
              setHrwktSelect({});
              setHrwdtSelect({});
              setHrdtsSelect({});
            }
            return false;
          }}
        />
      </div>
    </div>
  );
}
