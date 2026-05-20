import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import {
  type TableHandle,
  type DefInfraComp,
  type PageHandle,
  type TableHeaderType,
  type TableRow,
  type ToggleType,
} from "../../Util/Type";
import Redirect from "../../screens/common/Redirect";
import { CommonContainer } from "../../comp/Container";
import { CommonInput } from "../../comp/Input";
import { ToggleBtn } from "../../comp/Common";
import { Btn } from "../../comp/Btn";
import {
  getApi,
  getExcel,
  getInt,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { TableCust, TableCust2 } from "../../comp/Table";
import { commonHeader4 } from "../../Util/Header";
import moment from "moment";

const YESNO: ToggleType[] = [
  { key: "Y", value: "예" },
  { key: "N", value: "아니오" },
];

const GRID1_HEADER: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "CODE_CODE", value: "CODE", w: "8rem", sum: 0 },
  { key: "CODE_NAME1", value: "공용어", w: "8rem", option: { type: "WRITE" } },
  { key: "CODE_NAME2", value: "한국어", w: "8rem", option: { type: "WRITE" } },
  {
    key: "ORDER_SEQ",
    value: "순서",
    w: "3rem",
    type: "NUM",
    option: { type: "WRITE" },
  },
  {
    key: "VALUE1_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE2_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE3_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE4_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE5_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE6_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE7_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE8_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE9_CHAR",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE1_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE2_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE3_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE4_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE5_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE6_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE7_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE8_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },
  {
    key: "VALUE9_NUMBER",
    value: "",
    w: "10rem",
    disable: true,
    option: { type: "WRITE" },
  },

  {
    key: "CODE_DESCRIPTION",
    value: "설명",
    w: "15rem",
    option: { type: "WRITE" },
  },
];

const CommonMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId }, ref) => {
    const params = param?.["param0"];
    if (!params) return <Redirect />;

    useEffect(() => {
      if (params) {
        searchClick(params, "", "Y");
      }
    }, [params]);

    const searchClick = useCallback(
      async (classCode: string, codeName: string, usableFlag: string) => {
        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "SYS",
          method: "GET",
          url: `/sys/getCodeA010Mgm?classCode=${classCode}&codeName=${codeName}&usableFlag=${usableFlag}`,
          pgmId: pgmId,
        });
        sendLoading(false);
        if (res.ok) {
          if (res.data?.[0]?.[0]) {
            const tmp = res.data[0][0];
            Object.keys(tmp).forEach((v) => {
              if (v === "CLASS_NAME") {
                setTitle(tmp[v]);
              } else {
                changeGridHeader(v, tmp[v]);
              }
            });
            if (res.data?.[1]) {
              setGrid1(res.data[1]);
            } else {
              setGrid1([]);
            }
            return;
          }
        }
        setGrid1Header(GRID1_HEADER);
        setGrid1([]);
      },
      [],
    );

    function changeGridHeader(key: string, value: any) {
      if (key.includes("TITLE") && key.includes("CHAR")) {
        const result = key.replace(/TITLE/g, "");
        if (typeof value === "string") {
          if (value !== "") {
            setGrid1Header((prev) =>
              prev.map((v) => {
                if (v.key === `VALUE${result}`) {
                  return { ...v, disable: undefined, value: value };
                }
                return { ...v };
              }),
            );
          }
        }
      }
      if (key.includes("TITLE") && key.includes("CHAR_CLASS_SID_ARRAY")) {
        const result = key
          .replace(/TITLE/g, "")
          .replace(/_CLASS_SID_ARRAY/g, "");
        if (Array.isArray(value)) {
          setGrid1Header((prev) =>
            prev.map((v) => {
              if (v.key === `VALUE${result}`) {
                return {
                  ...v,
                  disable: undefined,
                  option: {
                    type: "DROPDOWN",
                    body: value,
                    header: commonHeader4,
                    inputKey: { key: "CODE_CODE", showKey: "1" },
                  },
                };
              }
              return { ...v };
            }),
          );
        }
      }

      if (key.includes("TITLE") && key.includes("NUMBER")) {
        const result = key.replace(/TITLE/g, "");
        if (typeof value === "string") {
          if (value !== "" && value !== "0") {
            setGrid1Header((prev) =>
              prev.map((v) => {
                if (v.key === `VALUE${result}`) {
                  v.disable = undefined;
                  v.value = value;
                  v.type = "NUM";
                }
                return v;
              }),
            );
          }
        }
      }
    }

    const [grid1Header, setGrid1Header] = useState(GRID1_HEADER);
    const grid1Ref = useRef<TableHandle>(null);
    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const [title, setTitle] = useState("공통코드 관리");
    const [codeName, setCodeName] = useState<string>("");
    const [yesNo, setYesNo] = useState(0);

    const saveClick = useCallback(
      async (obj: Record<number, TableRow>) => {
        if (Object.keys(obj).length === 0) {
          sendErr("수정한 값이 없습니다.");
          return;
        }
        var flag = false;
        const form: TableRow[] = [];
        Object.keys(obj).forEach((v) => {
          const objTmp = obj[getInt(v)];
          if (!objTmp["CODE_CODE"]) {
            flag = true;
            return;
          } else {
            form.push({ ...objTmp, CLASS_CODE: params });
          }
        });
        if (flag) {
          sendErr("코드가 없는 값이 있습니다.");
          return;
        }
        const map = new Map<string, any>();
        map.set("SAVE", form);

        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "SYS",
          method: "POST",
          url: `/sys/setCodeA010_012`,
          params: map,
          pgmId: pgmId,
          sucFlag: true,
        });
        if (res.ok) {
          await searchClick(params, codeName, YESNO[yesNo].key);
        }
        sendLoading(false);
      },
      [params, yesNo, codeName],
    );

    const delClick = useCallback(
      async (obj: Record<number, TableRow>) => {
        var flag = false;

        if (Object.keys(obj).length === 0) {
          sendErr("선택한 값이 없습니다.");
          return;
        }
        const form: TableRow[] = [];
        Object.keys(obj).forEach((v) => {
          const objTmp = obj[getInt(v)];
          if (!objTmp["CODE_CODE"]) {
            flag = true;
            return;
          } else {
            form.push({ ...objTmp, CLASS_CODE: params });
          }
        });
        if (flag) {
          sendErr("코드가 없는 값이 있습니다.");
          return;
        }
        const map = new Map<string, any>();
        map.set("DEL", form);

        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "SYS",
          method: "POST",
          url: `/sys/setCodeA010_022`,
          params: map,
          pgmId: pgmId,
          sucFlag: true,
        });
        if (res.ok) {
          await searchClick(params, codeName, YESNO[yesNo].key);
        }
        sendLoading(false);
      },
      [params, yesNo, codeName],
    );

    return (
      <div className="py-[1%] pr-[0.5%]">
        <CommonContainer
          title={title}
          childrenTitle={
            <div className="flex justify-between w-full p-[1%]">
              <div className="flex gap-2">
                <div className="mainInput">
                  <CommonInput
                    id="name"
                    value={codeName}
                    onChange={(v) => {
                      setCodeName(v);
                      searchClick(params, v, YESNO[yesNo].key);
                    }}
                    label="찾기"
                    labelW="25%"
                  />
                </div>
                <div className="mainInput">
                  <ToggleBtn
                    array={YESNO}
                    onClick={(v) => {
                      const tmp = YESNO.findIndex((r) => r.key === v);
                      if (tmp >= 0) {
                        setYesNo(tmp);
                        searchClick(params, codeName, v);
                      }
                    }}
                    idx={yesNo}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="mainInput">
                  <Btn
                    txt="신규"
                    type="SEARCH"
                    onClick={() => {
                      grid1Ref.current?.add();
                    }}
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="저장"
                    type="SAVE"
                    onClick={() => {
                      const ret = grid1Ref.current?.update();
                      if (ret !== undefined) {
                        saveClick(ret);
                      }
                    }}
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="취소"
                    type="NONE"
                    onClick={() => {
                      grid1Ref.current?.cancle();
                    }}
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt="Excel"
                    type="EXCEL"
                    onClick={() => {
                      getExcel({
                        body: grid1,
                        header: grid1Header,
                        fileName:
                          codeName + moment().format("YYYYMMDDHHmmssSSS"),
                      });
                    }}
                  />
                </div>
                <div className="mainInput">
                  <Btn
                    txt={yesNo === 0 ? "삭제" : "복구"}
                    type="DELETE"
                    onClick={() => {
                      const ret = grid1Ref.current?.getChk();
                      if (ret !== undefined) {
                        if (yesNo === 0) {
                          delClick(ret);
                        } else {
                          saveClick(ret);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          }>
          <TableCust2
            body={grid1}
            header={grid1Header}
            batch={true}
            ref={grid1Ref}
            height="40rem"
            width="100%"
            fixCount={4}
          />
        </CommonContainer>
      </div>
    );
  },
);

export default CommonMgm;
