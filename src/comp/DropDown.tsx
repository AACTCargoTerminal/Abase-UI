import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TableHeaderType, TableRow } from "../Util/Type";
import {
  IoIosArrowBack,
  IoIosArrowDown,
  IoIosArrowForward,
  IoIosArrowUp,
  IoMdArrowDropleft,
  IoMdArrowDropright,
  IoMdClose,
} from "react-icons/io";
import { TableCust } from "./Table";
import { FaCheckSquare } from "react-icons/fa";
import { Calendar, Divider } from "./Common";
import moment from "moment";
import { getInt, setTableChange } from "../Util/Util";
import { createPortal } from "react-dom";
export type ShowToken =
  | { type: "index"; value: number }
  | { type: "sep"; value: string };

export function tokenizeShowKey(showKey?: string): ShowToken[] {
  if (!showKey) return [];

  const tokens: ShowToken[] = [];
  let i = 0;

  while (i < showKey.length) {
    // 숫자 토큰
    if (/\d/.test(showKey[i])) {
      let num = "";
      while (i < showKey.length && /\d/.test(showKey[i])) {
        num += showKey[i++];
      }
      tokens.push({ type: "index", value: Number(num) });
      continue;
    }

    // 구분자(+공백 포함)
    let sep = "";
    while (i < showKey.length && !/\d/.test(showKey[i])) {
      sep += showKey[i++];
    }
    tokens.push({ type: "sep", value: sep });
  }

  return tokens;
}

// ✅ 스크롤 부모(가장 가까운 1개) 찾기: "계산 기준"용
export function getScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let p: HTMLElement | null = el?.parentElement ?? null;
  while (p) {
    const s = getComputedStyle(p);
    if (/(auto|scroll|overlay)/.test(s.overflowY)) return p;
    p = p.parentElement;
  }
  return window;
}

export const CommonDropDown = React.memo(
  function CommonDropDown({
    id,
    check,
    title,
    data,
    find = false,
    header,
    dropHeight,
    onClick,
    inputKey,
    align = "NONE",
    bg,
    labelW,
    writeFlag = true,
    read = false,
  }: {
    id: string;
    check?: boolean;
    title?: string;
    data: TableRow[];
    find?: boolean;
    header: TableHeaderType[];
    dropHeight: string;
    onClick: (row: TableRow) => void;
    inputKey: { key: string; value: any; showKey: string };
    align?: "NONE" | "COL";
    bg?: string;
    labelW?: string;
    writeFlag?: boolean;
    read?: boolean;
  }) {
    const [filterData, setFilterData] = useState(data);
    const [inData, setInData] = useState("");
    const [filterTxt, setFilterTxt] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLInputElement>(null);
    const mainRef = useRef<HTMLInputElement>(null);
    const dropRef = useRef<HTMLInputElement>(null);
    const [show, setShow] = useState(false);
    const norm = (v: unknown) =>
      String(v ?? "")
        .trim()
        .toLowerCase();
    const sum = header.reduce((sum, b) => sum + parseFloat(b.w), 0) + 1;

    const [dropAlign, setDropAlign] = useState<"left" | "right">("left");
    const [dropDir, setDropDir] = useState<"top" | "bottom">("bottom");
    const baseBottomRef = useRef<number | null>(null); // "닫혀 있을 때"의 bottom 기준(px)
    const baseSpRef = useRef<Window | HTMLElement | null>(null); // 그때의 스크롤 부모
    const [pos, setPos] = useState({
      x: containerRef.current?.getBoundingClientRect().top,
      y: containerRef.current?.getBoundingClientRect().left,
    });
    const scrollParentRef = useRef<Window | HTMLElement | null>(null);
    const toPx = (v: string) => {
      const s = String(v).trim();
      if (s.endsWith("px")) return parseFloat(s);
      if (s.endsWith("rem")) return parseFloat(s) * 16; // 프로젝트 rem 기준이 다르면 조정
      if (s.endsWith("vh")) return (window.innerHeight * parseFloat(s)) / 100;
      return parseFloat(s) || 0;
    };
    const calc = () => {
      const anchor = containerRef.current;
      const drop = dropRef.current;
      if (!anchor || !drop) return;

      const a = anchor.getBoundingClientRect();
      const d = drop.getBoundingClientRect();
      const GAP = 6;
      const margin = 8;

      let lr: "left" | "right" = "left";
      if (a.left + d.width > window.innerWidth - margin) lr = "right";
      let tb: "top" | "bottom" = "bottom";
      if (a.bottom + GAP + d.height > window.innerHeight - margin) tb = "top";

      setDropAlign(lr);
      setDropDir(tb);

      let left = lr === "left" ? a.left : a.right - d.width; // right align이면 dropdown width만큼 빼서 맞춤

      // ✅ top 계산 (y 축)
      let top =
        tb === "bottom"
          ? a.bottom + GAP
          : a.top - d.height - GAP * 3 - a.height;

      // 화면 밖 클램프
      left = Math.min(
        Math.max(left, margin),
        window.innerWidth - d.width - margin,
      );
      top = Math.min(
        Math.max(top, margin),
        window.innerHeight - d.height - margin,
      );

      setPos({ x: top, y: left });
    };

    useEffect(() => {
      if (find && filterTxt) {
        if (filterTxt.length > 0) {
          const target = norm(filterTxt);
          const filterTmp = data.filter((item) =>
            header.some((kv) => norm(item[kv.key]).includes(target)),
          );
          if (filterTmp.length === 0) {
            setFilterData(data);
          } else {
            setFilterData(filterTmp);
          }
        } else {
          setFilterData(data);
        }
      } else {
        setFilterData(data);
      }
    }, [data, filterTxt, find]);

    useEffect(() => {
      const tmp = data.findIndex(
        (item) => item[inputKey.key] === inputKey.value,
      );
      if (tmp !== -1) {
        var txt = "";
        const token = tokenizeShowKey(inputKey.showKey);
        token.forEach((item) => {
          if (item.type === "index") {
            txt = txt + data[tmp][header[item.value].key];
          } else {
            txt = txt + item.value;
          }
        });
        setInData(txt);
      } else {
        if (inputKey.value) {
          setInData(inputKey.value);
        } else {
          setInData("");
        }
      }
    }, [inputKey]);

    const toggle = () => {
      if (read === false) {
        setShow((prev) => {
          const next = !prev;

          // ✅ 닫혀있다가 "열릴 때"만 기준 저장
          if (!next) {
            const anchor = containerRef.current;
            const sp = getScrollParent(anchor);

            baseSpRef.current = sp;

            if (sp === window) {
              // "window bottom" 저장 (viewport 하단)
              baseBottomRef.current = window.innerHeight;
            } else {
              // 스크롤 컨테이너면 "보이는 영역 하단" 기준 저장
              baseBottomRef.current = (sp as HTMLElement).clientHeight;
            }
          }

          calc();

          return next;
        });
        if (find) {
          setFilterTxt("");
          document.getElementById("findDoc")?.focus();
        }
      }
    };

    function click(value: TableRow) {
      setShow(false);
      onClick(value);
    }

    useEffect(() => {
      if (!show) return;

      const onDocPointerDown = (e: PointerEvent) => {
        const t = e.target as Node;
        if (mainRef.current?.contains(t)) return;
        if (dropRef.current?.contains(t)) return;
        setShow(false);
      };

      // 캡처 단계로 등록(중요)
      document.addEventListener("pointerdown", onDocPointerDown, true);
      return () => {
        document.removeEventListener("pointerdown", onDocPointerDown, true);
      };
    }, [show]);

    useEffect(() => {
      if (!show) return;

      const anchor = containerRef.current;
      if (!anchor) return;

      const sp = getScrollParent(anchor);
      scrollParentRef.current = sp;

      // 드롭다운 내부 스크롤은 무시하고, “외부 스크롤”만 감지하려면
      // 스크롤 이벤트 타겟이 dropRef 내부에서 발생한 경우는 무시한다.
      const onScroll = (ev: Event) => {
        const target = ev.target as Node | null;

        // drop 내부에서 난 scroll이면 무시
        if (target && dropRef.current?.contains(target)) return;

        // anchor 내부 스크롤도 상황에 따라 무시하고 싶으면 아래 조건 추가 가능:
        // if (target && containerRef.current?.contains(target as Node)) return;

        setShow(false);
      };

      const onResize = () => setShow(false);

      // scrollParent에 걸기
      if (sp === window) {
        window.addEventListener("scroll", onScroll, true);
      } else {
        (sp as HTMLElement).addEventListener("scroll", onScroll, true);
      }

      // window scroll도 같이(중첩 스크롤 케이스 대비)
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onResize);

      return () => {
        if (sp === window) {
          window.removeEventListener("scroll", onScroll, true);
        } else {
          (sp as HTMLElement).removeEventListener("scroll", onScroll, true);
        }
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onResize);
      };
    }, [show]);
    const dropWidth = header.length > 1 ? `${sum}rem` : header[0].w;
    return (
      <div
        ref={mainRef}
        className={`flex justify-center w-full rounded-md ${
          align === "NONE"
            ? "items-center gap-1 h-[100%]"
            : "flex-col gap-1 h-[3.6rem] p-[0.2rem]"
        } `}
        style={{
          backgroundColor: bg ? bg : title ? "transparent" : "transparent",
        }}>
        {title && (
          <div
            className={`flex gap-1 items-center ${
              align === "COL" ? "h-[35%] px-[1rem]" : "w-[var(--w-label)]"
            }`}
            style={{ "--w-label": labelW || "35%" } as React.CSSProperties}>
            <label
              htmlFor={id}
              className={`text-nowrap ${
                align === "COL" ? "text-gray-500" : "text-gray-800"
              }`}>
              {title}
            </label>

            {check && (
              <div className="h-full flex items-start">
                <span className={`text-red-500 text-nowrap font-bold`}>*</span>
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1 h-full">
          <div
            ref={containerRef}
            className={`w-full h-full flex items-center rounded-md px-3 py-1
               ${read ? "border-2 border-gray-400 bg-gray-100 focus:outline-none" : "border border-gray-300 bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500"}`}
            onClick={toggle}>
            <input
              id={id}
              ref={inputRef}
              className="w-full h-full text-left focus:outline-none"
              readOnly={writeFlag}
              value={inData}
              onChange={(e) => {
                setInData(e.target.value);
                setShow(true);
              }}
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // form submit 방지
                  if (filterData.length === 0) {
                    if (!writeFlag) {
                      if (inputKey.key === inputKey.showKey) {
                        click({ [inputKey.key]: inData });
                      } else {
                        click({
                          [inputKey.key]: inData,
                          [inputKey.showKey]: inData,
                        });
                      }
                    }
                  } else {
                    click(filterData[0]);
                  }
                }
              }}
            />

            <div className="rounded-full iconSize cursor-pointer hover:bg-gray-200 p-[1%]">
              {show ? (
                <IoIosArrowUp className="text-gray-500" />
              ) : (
                <IoIosArrowDown className="text-gray-500" />
              )}
            </div>
          </div>
          {createPortal(
            <div
              ref={dropRef}
              style={{
                position: "fixed",
                left: pos.y,
                top: pos.x,
                width: dropWidth,
                maxHeight: toPx(dropHeight) + "3rem", // 드롭 높이 제한
              }}
              className={`z-[9999]
                border border-gray-300 rounded-md bg-white
                shadow-lg
                transition-all duration-150
                ${dropDir === "top" ? "origin-bottom" : "origin-top"}
                ${
                  show
                    ? "opacity-100 scale-y-100 pointer-events-auto"
                    : "opacity-0 scale-y-95 pointer-events-none"
                }`}>
              {find && (
                <div
                  className={`w-full mainInput h-full flex items-center bg-white rounded-md border border-gray-300 px-3 py-1
              focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500`}>
                  <input
                    className="w-full h-full text-left focus:outline-none"
                    value={filterTxt}
                    onChange={(e) => {
                      setFilterTxt(e.target.value);
                    }}
                    id="findDoc"
                    placeholder="Find"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // form submit 방지
                        if (filterData.length === 0) {
                          if (!writeFlag) {
                            if (inputKey.key === inputKey.showKey) {
                              click({ [inputKey.key]: inData });
                            } else {
                              click({
                                [inputKey.key]: inData,
                                [inputKey.showKey]: inData,
                              });
                            }
                          }
                        } else {
                          click(filterData[0]);
                        }
                      }
                    }}
                  />
                </div>
              )}

              {header.length > 1 && (
                <TableCust
                  tableId="dropTable"
                  header={header}
                  body={filterData}
                  height={dropHeight}
                  onClick={(value) => {
                    click(value);
                  }}
                  width={sum.toString() + "rem"}
                />
              )}
              {header.length === 1 && (
                <div
                  className="flex w-full flex-col items-center overflow-y-auto overflow-x-hidden"
                  style={{ maxHeight: toPx(dropHeight) }}>
                  {filterData.map((item, index) => (
                    <span
                      key={index}
                      onClick={() => click(item)}
                      className="p-2 whitespace-pre-wrap text-[clamp(8px,0.6vw,12px)] h-[2rem] text-center text-nowrap w-full hover:bg-gray-200 cursor-pointer">
                      {item[header[0].key] ?? ` `}
                    </span>
                  ))}
                </div>
              )}
            </div>,
            document.body,
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.id === next.id &&
      prev.data === next.data &&
      prev.inputKey === next.inputKey &&
      prev.find === next.find &&
      prev.read === next.read
    );
  },
);

export function CommonMonthDatePicker({
  id,
  value,
  onClick,
  title,
  check,
  align = "NONE",
  bg,
  colSize,
  arrowNo = true,
}: {
  id: string;
  value?: string;
  onClick: (value: string) => void;
  title?: string;
  check?: boolean;
  align?: "NONE" | "COL";
  bg?: string;
  colSize?: string;
  arrowNo?: boolean;
}) {
  const [fltDate, setFltDate] = useState("");

  useEffect(() => {
    if (value === undefined) {
      setFltDate("");
    } else {
      const m = moment(value);

      if (!m.isValid()) {
        setFltDate(moment().format("YYYYMM"));
      } else {
        setFltDate(moment(value).format("YYYYMM"));
      }
    }
  }, [value]);

  return (
    <div
      className={`flex items-center w-full rounded-md ${
        align === "NONE"
          ? "items-center gap-2 h-full"
          : "flex-col gap-1 h-[3.6rem] p-[0.2rem]"
      }`}
      style={{
        backgroundColor: bg ? bg : title ? "transparent" : "transparent",
      }}>
      {title && (
        <div
          className={`flex gap-1 items-center ${
            align === "COL" ? "h-[35%] px-[1rem]" : "w-[var(--labelW)]"
          }`}
          style={
            {
              "--labelW": (colSize && colSize) || "35%",
            } as React.CSSProperties
          }>
          <label
            htmlFor={id}
            className={`text-[clamp(8px,0.6vw,12px)] text-nowrap ${
              align === "COL" ? "text-gray-500" : "text-gray-800"
            }`}>
            {title}
          </label>

          <div className="h-full flex items-start w-[0.6rem]">
            <span
              className={`text-red-500 text-nowrap text-[clamp(8px,0.6vw,12px)] font-bold ${
                check ? "" : "invisible"
              }`}>
              *
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center h-full flex-1 gap-1">
        {arrowNo && (
          <div
            className="cursor-pointer rounded-full hover:bg-gray-200 p-[0.15rem] mr-[0.1rem]"
            onClick={() => {
              setFltDate((prev) => {
                const date = moment(prev).subtract(1, "month").format("YYYYMM");
                onClick(date);
                return date;
              });
            }}>
            <IoIosArrowBack className="text-gray-700 text-xl font-semibold" />
          </div>
        )}
        <Calendar
          changeDate={(value) => {
            onClick(value);
            setFltDate(value);
          }}
          date={fltDate}
          type="MONTH"
        />
        {arrowNo && (
          <div
            className="cursor-pointer rounded-full hover:bg-gray-200 p-[0.15rem] ml-[0.1rem]"
            onClick={() => {
              setFltDate((prev) => {
                const date = moment(prev).add(1, "month").format("YYYYMM");
                onClick(date);
                return date;
              });
            }}>
            <IoIosArrowForward className="text-gray-700 text-xl font-semibold" />
          </div>
        )}
      </div>
    </div>
  );
}

export function CommonDatePicker({
  id,
  value,
  onClick,
  title,
  check,
  align = "NONE",
  bg,
  colSize,
  arrowNo = true,
}: {
  id: string;
  value?: string;
  onClick: (value: string) => void;
  title?: string;
  check?: boolean;
  align?: "NONE" | "COL";
  bg?: string;
  colSize?: string;
  arrowNo?: boolean;
}) {
  const [fltDate, setFltDate] = useState("");

  useEffect(() => {
    if (value === undefined) {
      setFltDate("");
    } else {
      const m = moment(value);

      if (!m.isValid()) {
        setFltDate(moment().format("YYYYMMDD"));
      } else {
        setFltDate(moment(value).format("YYYYMMDD"));
      }
    }
  }, [value]);

  return (
    <div
      className={`flex items-center w-full rounded-md ${
        align === "NONE"
          ? "items-center gap-2 h-full"
          : "flex-col gap-1 h-[3.6rem] p-[0.2rem]"
      }`}
      style={{
        backgroundColor: bg ? bg : title ? "transparent" : "transparent",
      }}>
      {title && (
        <div
          className={`flex gap-1 items-center ${
            align === "COL" ? "h-[35%] px-[1rem]" : "w-[var(--labelW)]"
          }`}
          style={
            {
              "--labelW": (colSize && colSize) || "35%",
            } as React.CSSProperties
          }>
          <label
            htmlFor={id}
            className={`text-[clamp(8px,0.6vw,12px)] text-nowrap ${
              align === "COL" ? "text-gray-500" : "text-gray-800"
            }`}>
            {title}
          </label>

          <div className="h-full flex items-start w-[0.6rem]">
            <span
              className={`text-red-500 text-nowrap text-[clamp(8px,0.6vw,12px)] font-bold ${
                check ? "" : "invisible"
              }`}>
              *
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center h-full flex-1 gap-1">
        {arrowNo && (
          <div
            className="cursor-pointer rounded-full hover:bg-gray-200 p-[0.15rem] mr-[0.1rem]"
            onClick={() => {
              setFltDate((prev) => {
                const date = moment(prev).subtract(1, "day").format("YYYYMMDD");
                onClick(date);
                return date;
              });
            }}>
            <IoIosArrowBack className="text-gray-700 text-xl font-semibold" />
          </div>
        )}
        <Calendar
          changeDate={(value) => {
            onClick(value);
            setFltDate(value);
          }}
          date={fltDate}
        />
        {arrowNo && (
          <div
            className="cursor-pointer rounded-full hover:bg-gray-200 p-[0.15rem] ml-[0.1rem]"
            onClick={() => {
              setFltDate((prev) => {
                const date = moment(prev).add(1, "day").format("YYYYMMDD");
                onClick(date);
                return date;
              });
            }}>
            <IoIosArrowForward className="text-gray-700 text-xl font-semibold" />
          </div>
        )}
      </div>
    </div>
  );
}

export const CommonMultiDrop = React.memo(
  function CommonMultiDrop({
    data,
    dropHeight,
    header,
    id,
    check,
    labelW,
    title,
    btnKey,
    btnW,
    onChange,
    inputData,
    maxLength = 2,
  }: {
    id: string;
    check?: boolean;
    title?: string;
    header: TableHeaderType[];
    dropHeight: string;
    labelW?: string;
    btnKey: string;
    data: TableRow[];
    btnW?: number;
    inputData: { key: string; value: string; split: string };
    maxLength?: number;
    onChange: (v: string) => void;
  }) {
    const sum = useMemo(
      () => header.reduce((sum, b) => sum + parseFloat(b.w), 0) + 5,
      [header],
    );
    const [show, setShow] = useState(false);
    const [txt, setTxt] = useState("");
    const [filterTxt, setFilterTxt] = useState("");
    const [btnArray, setBtnArray] = useState<Record<number, TableRow>>({});
    const mainRef = useRef<HTMLInputElement>(null);
    const [body, setBody] = useState<TableRow[]>(data);
    const [btnOpen, setBtnOpen] = useState(false);
    const [clear, setClear] =
      useState<Record<number, { key: string; value: any }>>();

    const norm = (v: unknown) =>
      String(v ?? "")
        .trim()
        .toLowerCase();

    useEffect(() => {
      if (!show) return;

      const onDocPointerDown = (e: PointerEvent) => {
        const t = e.target as Node;
        if (mainRef.current?.contains(t)) return;
        close();
      };

      // 캡처 단계로 등록(중요)
      document.addEventListener("pointerdown", onDocPointerDown, true);
      return () =>
        document.removeEventListener("pointerdown", onDocPointerDown, true);
    }, [show, btnArray, txt]);

    const close = useCallback(() => {
      setShow(false);
      var outData = "";

      Object.values(btnArray).forEach((v, i) => {
        if (i === Object.keys(btnArray).length - 1) {
          outData += v[inputData.key];
        } else {
          outData += v[inputData.key] + inputData.split;
        }
      });
      if (txt.length > 0) {
        outData += inputData.split + txt;
      }
      onChange(outData.trim());
    }, [btnArray, onChange, txt]);

    useEffect(() => {
      if (filterTxt.length > 0) {
        const target = norm(filterTxt);
        const filterTmp = data.filter((item) =>
          header.some((kv) => norm(item[kv.key]).includes(target)),
        );
        setBody(filterTmp);
      } else {
        setBody(data);
      }
    }, [filterTxt, data]);

    useEffect(() => {
      if (Object.keys(btnArray).length <= maxLength) {
        setBtnOpen(false);
      }
    }, [Object.keys(btnArray).length]);

    useEffect(() => {
      if (inputData.value) {
        const clearTmp: Record<number, { key: string; value: any }> = {};

        const tmp = inputData.value.split(inputData.split);
        const btnTmp: Record<number, TableRow> = {};
        var strTmp = "";
        tmp.forEach((item) => {
          const findData = data.findIndex((v, i) => v[inputData.key] === item);
          if (findData >= 0) {
            btnTmp[findData] = data[findData];
            clearTmp[findData] = { key: "CHK", value: true };
          } else {
            strTmp += item;
          }
        });

        setClear(clearTmp);
        setTxt(strTmp);
        setBtnArray(btnTmp);
      } else {
        const tmp: Record<number, { key: string; value: any }> = {};
        body.forEach((r, i) => (tmp[i] = { key: "CHK", value: false }));
        setClear(tmp);
        requestAnimationFrame(() => {
          setClear(undefined);
        });
        setTxt("");
        setBtnArray({});
      }
    }, [inputData]);

    return (
      <div
        ref={mainRef}
        className={`flex justify-center w-full rounded-md items-center gap-1 h-[100%]`}>
        {title && (
          <div
            className={`flex gap-1 items-center w-[var(--w-label)]`}
            style={{ "--w-label": labelW || "35%" } as React.CSSProperties}>
            <label htmlFor={id} className={`text-nowrap text-gray-800`}>
              {title}
            </label>

            {check && (
              <div className="h-full flex items-start">
                <span className={`text-red-500 text-nowrap font-bold`}>*</span>
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1 h-full">
          {Object.keys(btnArray).length > maxLength && (
            <div
              className={`absolute grid ${
                btnW && "grid-cols-" + btnW
              } gap-2 z-[999] bg-white border border-gray-400 rounded-md p-[1%] origin-bottom bottom-10 duration-500 ${
                btnOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
              }`}
              onMouseEnter={() => setBtnOpen(true)}
              onMouseLeave={() => setBtnOpen(false)}>
              {Object.keys(btnArray).map((r, i) => {
                if (i + 1 > maxLength) {
                  const num = getInt(r);
                  return (
                    <div
                      className="border border-gray-400 px-[0.3rem] rounded-md py-[0.2rem] flex items-center justify-center hover:bg-[#C5D3E8] cursor-pointer"
                      onClick={() => {
                        setBtnArray((prev) => {
                          const { [num]: _, ...rest } = prev;
                          return rest;
                        });
                        const tmp: Record<number, { key: string; value: any }> =
                          {};
                        tmp[num] = { key: "CHK", value: false };
                        setClear(tmp);
                        requestAnimationFrame(() => {
                          setClear(undefined);
                        });
                      }}>
                      {btnArray[num][btnKey]}
                    </div>
                  );
                } else {
                  return null;
                }
              })}
            </div>
          )}

          <div
            className={`w-full h-full flex items-center gap-2 bg-white rounded-md border border-gray-300 px-3 py-1
              focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500`}>
            {Object.keys(btnArray).map((r, i) => {
              const num = getInt(r);
              if (i + 1 <= maxLength) {
                return (
                  <div
                    onClick={() => {
                      setBtnArray((prev) => {
                        const { [num]: _, ...rest } = prev;
                        return rest;
                      });
                      const tmp: Record<number, { key: string; value: any }> =
                        {};
                      tmp[num] = { key: "CHK", value: false };
                      setClear(tmp);
                      requestAnimationFrame(() => {
                        setClear(undefined);
                      });
                    }}
                    className="border border-gray-400 px-[1.5%] rounded-md py-[0.5%] hover:bg-[#C5D3E8] cursor-pointer">
                    {btnArray[num][btnKey]}
                  </div>
                );
              } else {
                return null;
              }
            })}
            {maxLength < Object.keys(btnArray).length && (
              <div
                onMouseEnter={() => setBtnOpen(true)}
                onMouseLeave={() => setBtnOpen(false)}
                className="border border-gray-400 px-[1.5%] rounded-md py-[0.5%] hover:bg-[#C5D3E8] cursor-pointer">
                ...
              </div>
            )}
            {Object.keys(btnArray).length > 0 && <Divider align="Verticle" />}

            <input
              id={id}
              className="flex-1 h-full text-left focus:outline-none"
              value={txt}
              onChange={(e) => {
                setTxt(e.target.value);
              }}
              onClick={() =>
                setShow((prev) => {
                  if (prev === true) {
                    close();
                  }

                  return !prev;
                })
              }
              autoComplete="off"
            />

            <div
              onClick={(e) => {
                e.stopPropagation();
                setBtnArray({});
                const tmp: Record<number, { key: string; value: any }> = {};
                body.forEach((r, i) => (tmp[i] = { key: "CHK", value: false }));
                setClear(tmp);
                requestAnimationFrame(() => {
                  setClear(undefined);
                });
              }}
              className="rounded-full iconSize cursor-pointer hover:bg-gray-200 p-[1%]">
              <IoMdClose className="text-gray-500" />
            </div>
          </div>
          <div
            className={`absolute ${
              header.length === 1 ? "w-full" : "w-fit"
            } z-999 left-0 top-full mt-1 border border-gray-300 rounded-md bg-white overflow-hidden transition duration-200 transform origin-top ${
              show
                ? "opacity-100 scale-y-100 pointer-events-auto"
                : "opacity-0 scale-y-50 pointer-events-none"
            }`}>
            <div
              className={`w-full mainInput h-full flex items-center bg-white rounded-md border border-gray-300 px-3 py-1
              focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500`}>
              <input
                className="w-full h-full text-left focus:outline-none"
                placeholder="Find"
                autoComplete="off"
                value={filterTxt}
                onChange={(e) => {
                  setFilterTxt(e.target.value);
                }}
              />
            </div>
            <TableCust
              tableId="dropTable"
              header={[
                { key: "CHK", value: "", w: "3rem", onClickChk: true },
                ...header,
              ]}
              body={body}
              height={dropHeight}
              onClick={(value) => {}}
              inChange={clear}
              changeValue={(i, k, v) => {
                if (k === "CHK") {
                  const findTmp = body.find((_, idx) => idx === i);
                  if (findTmp) {
                    if (v) {
                      setBtnArray((prev) => ({ ...prev, [i]: findTmp }));
                    } else {
                      setBtnArray((prev) => {
                        const { [i]: _, ...rest } = prev;
                        return rest;
                      });
                    }
                  }
                }
              }}
              width={sum.toString() + "rem"}
            />
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.id === next.id &&
      prev.data === next.data &&
      prev.inputData === next.inputData
    );
  },
);
