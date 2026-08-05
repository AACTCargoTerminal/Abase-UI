import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type IconNameType,
  type PairType,
  type RowPrepType,
  type TableHandle,
  type TableHeaderType,
  type TableRow,
  type TableSortType,
  type TableType,
  type TableType2,
} from "../Util/Type";
import { IoIosArrowDown, IoIosArrowUp, IoMdRefresh } from "react-icons/io";
import { confirmObj, getUUID, sendErr, sortTable } from "../Util/Util";
import { createPortal } from "react-dom";
import { MdOutlineHorizontalRule, MdPushPin } from "react-icons/md";
import { CommonDropDown } from "./DropDown";
import { Btn } from "./Btn";

function getIcon(iconName: IconNameType, color: string) {
  switch (iconName) {
    case "PIN": {
      return <MdPushPin className="size-[60%]" style={{ color: color }} />;
    }
  }
}

function summarize(
  headers: TableHeaderType[],
  rows: TableRow[],
): Record<string, number> {
  const result: Record<string, number> = {};

  const targets = headers.filter((h) => h.sum || h.sum === 0);

  for (const h of targets) {
    let acc = 0;
    for (const r of rows) {
      const v = r[h.key];
      if (v == null || v === "") continue;

      if (!h.type || h.type === "STR") {
        acc += 1;
        continue;
      }

      const num = typeof v === "number" ? v : isFinite(+v) ? +v : NaN;
      acc += Number.isFinite(num) ? num : 1;
    }
    result[h.key] = acc;
  }
  return result;
}

export const TableCust = React.memo(
  function TableCust({
    tableId,
    body,
    header,
    onClick,
    doubleClick,
    height,
    fixCount = 0,
    width,
    children, //있을시 드롭다운
    changeValue,
    onRowPrepared,
    onCustumizeText,
    childClick,
    inChange,
    rightMenu,
    rightClick,
    refreshFlag,
  }: TableType) {
    const offsets = useMemo(
      () =>
        header.map((_, i) => {
          const visibleBeforeWidth = header
            .slice(0, i)
            .filter((h) => !h.disable)
            .reduce((sum, h) => sum + parseFloat(h.w), 0);
          return visibleBeforeWidth;
        }),
      [header],
    );

    const inputCount = useMemo(
      () =>
        header.reduce(
          (sum, h) => sum + (h.option?.type === "WRITE" ? 1 : 0),
          0,
        ),
      [header],
    );

    const sumCount = useMemo(
      () =>
        header.reduce((sum, h) => {
          if (h.sum != null && h.sum >= 0) {
            return sum + 1;
          }
          return sum;
        }, 0),
      [header],
    );
    const [ready, setReady] = useState(false);

    useLayoutEffect(() => {
      // body가 바뀌면 일단 로딩 상태로
      setReady(false);
      const id = requestAnimationFrame(() => {
        setReady(true);
      });
      return () => cancelAnimationFrame(id);
    }, [body]);

    const [mainBody, setMainBody] = useState<TableRow[]>(body);
    const sumArray = useMemo(
      () => summarize(header, mainBody),
      [header, mainBody],
    );
    useEffect(() => {
      setMainBody(body);
      setResetVersion(0);
      changeRef.current = {};
      selectedRowIndexRef.current = null;
      setOpenRows({});
      setDtAllOpen(false);
      setChkAllOpen(false);
      setSort({});
    }, [body]);

    const [dtAllOpen, setDtAllOpen] = useState(false);
    const [chkAllOpen, setChkAllOpen] = useState(false);
    const [sort, setSort] = useState<Record<string, TableSortType>>({});
    const changeRef = useRef<Record<number, TableRow>>({});
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
    const selectedRowIndexRef = useRef<number | null>(null);
    const timer = useRef<number | null>(null);
    const [resetVersion, setResetVersion] = useState(0);
    const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
    const [menuOpen, setMenuOpen] = useState<
      { x: number; y: number; value: TableRow } | undefined
    >();

    const handleRowChange = useCallback(
      (rowIdx: number, key: string, value: any) => {
        if (key === "DROP" && value) {
          setOpenRows((prev) => ({
            [rowIdx]: !!value,
          }));
          childClick?.([rowIdx]);
        } else if (key === "DROP" && !value) {
          setOpenRows((prev) => ({}));
          childClick?.([]);
        } else {
          const prevRow = changeRef.current[rowIdx] ?? {};
          if (prevRow[key] === value) return;

          const nextRow = { ...prevRow, [key]: value };
          changeRef.current = { ...changeRef.current, [rowIdx]: nextRow };
          changeValue?.(rowIdx, key, value);
        }
      },
      [childClick, changeValue],
    );

    const handleRowChange2 = useCallback(
      (rowIdx: number, key: string, value: any) => {
        const prevRow = changeRef.current[rowIdx] ?? {};
        if (prevRow[key] === value) return;

        const nextRow = { ...prevRow, [key]: value };
        changeRef.current = { ...changeRef.current, [rowIdx]: nextRow };
      },
      [inChange],
    );
    const handleClick = (r: TableRow) => {
      if (timer.current !== null) {
        // 두 번째 클릭 → 더블클릭 처리
        window.clearTimeout(timer.current);
        timer.current = null;
        doubleClick && doubleClick(r);
      } else {
        // 첫 번째 클릭 → 일정 시간 기다렸다가 싱글클릭 처리
        timer.current = window.setTimeout(() => {
          onClick && onClick(r);
          timer.current = null;
        }, 250); // 150은 너무 짧으니까 250~300ms 정도 추천
      }
    };
    if (!ready)
      return (
        <div
          key={tableId}
          className="relative inset-0 z-[3000] flex items-center justify-center border border-gray-300"
          role="dialog"
          aria-modal="true"
          style={{ maxWidth: width, height: height }}>
          <div className="inline-block w-13 h-13 rounded-full border-[4px] border-blue-500 border-r-transparent animate-spin" />
        </div>
      );
    return (
      <div
        key={tableId}
        className={`overflow-auto border border-gray-600 `}
        style={{ maxWidth: width, height: height }}>
        <div className="flex flex-col">
          {/* 헤더 */}
          <div className="sticky top-0 z-30 h-[2rem] flex min-w-max bg-[#6F6F70]">
            {header.map((r, i) => {
              if (r.disable) {
                return null;
              }

              const isSticky = i < fixCount;
              const left = isSticky ? `${offsets[i]}rem` : undefined;

              switch (r.key) {
                case "DROP":
                  return (
                    <div
                      className={`w-[3rem] flex shrink-0 cursor-pointer items-center justify-center border-r border-[#D1D5DC] ${
                        fixCount > 0 ? "z-20" : "z-10"
                      }`}
                      style={{
                        width: r.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        backgroundColor: "inherit",
                      }}>
                      <div
                        className="flex  items-center justify-center text-xl cursor-pointer hover:bg-gray-300 hover:text-gray-700 p-[0.15rem] text-white rounded-full"
                        onClick={() => {
                          const flag = !dtAllOpen;
                          setDtAllOpen((prev) => flag);
                          setOpenRows({});
                          if (flag) {
                            const tmpArr: number[] = mainBody.map((_, i) => i);
                            childClick?.(tmpArr);
                          } else {
                            childClick?.([]);
                          }
                        }}>
                        {dtAllOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
                      </div>
                    </div>
                  );

                case "CHK":
                  return (
                    <div
                      className={`w-[3rem] flex shrink-0 cursor-pointer items-center justify-center border-r border-[#D1D5DC] ${
                        fixCount > 0 ? "z-20" : "z-10"
                      }`}
                      style={{
                        width: r.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        backgroundColor: "inherit",
                      }}>
                      <div className="flex items-center justify-center cursor-pointer w-full h-full">
                        <input
                          type="checkbox"
                          checked={chkAllOpen}
                          className="h-full accent-gray-300 rounded-md size-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            setChkAllOpen(e.target.checked);
                          }}
                        />
                      </div>
                    </div>
                  );

                default:
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center gap-1 py-2 shrink-0 ${
                        isSticky ? "z-20" : "z-10"
                      } ${
                        i !== header.length - 1
                          ? "border-r border-[#D1D5DC]"
                          : ""
                      }`}
                      style={{
                        width: r.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        backgroundColor: "inherit",
                      }}
                      onClick={() => {
                        if (sort[r.key]) {
                          if (sort[r.key] === "ASC") {
                            setSort((prev) => ({
                              ...prev,
                              [r.key]: "DESC",
                            }));
                            const data = sortTable({
                              type: "DESC",
                              table: body,
                              key: r.key,
                            });
                            setMainBody(data);
                          } else {
                            setSort((prev) => ({
                              ...prev,
                              [r.key]: "ASC",
                            }));
                            const data = sortTable({
                              type: "ASC",
                              table: body,
                              key: r.key,
                            });
                            setMainBody(data);
                          }
                        } else {
                          setSort((prev) => ({ ...prev, [r.key]: "ASC" }));
                          const data = sortTable({
                            type: "ASC",
                            table: body,
                            key: r.key,
                          });
                          setMainBody(data);
                        }
                      }}>
                      {refreshFlag && inputCount > 0 && i === 0 && (
                        <div
                          className="flex size-[1.2rem] items-center cursor-pointer bg-[#ED1C24] hover:bg-gray-300 hover:text-gray-700 p-[0.15rem] text-white rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMainBody(body);
                            changeRef.current = {};
                            setResetVersion((v) => v + 1);
                            changeValue?.(0, "", "", true);
                          }}>
                          <IoMdRefresh className="w-full h-full" />
                        </div>
                      )}
                      <span
                        className={`text-white tableSz text-center font-semibold cursor-pointer`}>
                        {r.value}
                      </span>
                    </div>
                  );
              }
            })}
          </div>

          {/* 바디 */}
          <div
            className="flex-1 min-h-0 min-w-max"
            onMouseLeave={(e) => {
              setMenuOpen(undefined);
            }}>
            {mainBody.map((r, i) => (
              <React.Fragment key={i}>
                <RowCust
                  row={r}
                  rowIdx={i}
                  onRowPrepared={onRowPrepared}
                  fixCount={fixCount}
                  header={header}
                  offsets={offsets}
                  inChange={inChange?.[i]}
                  onClick={(r) => {
                    const pre = onRowPrepared ? onRowPrepared(r, i) : undefined;
                    const prevIdx = selectedRowIndexRef.current;
                    if (prevIdx !== null && rowRefs.current[prevIdx]) {
                      rowRefs.current[prevIdx]!.style.backgroundColor = ""; // 기본색 (bg-white 등)
                    }

                    if (rowRefs.current[i]) {
                      if (pre && pre.lines) {
                        rowRefs.current[i]!.style.backgroundColor = pre.lines;
                      }
                      if (r["CHK"]) {
                        rowRefs.current[i]!.style.backgroundColor = "#B2C4E0";
                      }
                      rowRefs.current[i]!.style.backgroundColor = "#C5D3E8"; // 원하는 색
                    }

                    selectedRowIndexRef.current = i;
                    handleClick(r);
                  }}
                  onCustumizeText={onCustumizeText}
                  setChangeValue={(i, k, v) => {
                    handleRowChange(i, k, v);
                  }}
                  setChangeValue2={(i, k, v) => {
                    handleRowChange2(i, k, v);
                  }}
                  rowRefSetter={(idx, el) => (rowRefs.current[idx] = el)}
                  allChkSelect={
                    header.find((r) => r.key === "CHK") && chkAllOpen
                  }
                  allDropSelect={
                    header.find((r) => r.key === "DROP") && dtAllOpen
                      ? dtAllOpen
                      : openRows?.[i] !== undefined
                        ? openRows[i]
                        : false
                  }
                  reset={resetVersion}
                  rightClickRow={(x, y) => {
                    setMenuOpen({ x: x, y: y, value: r });
                  }}
                />
                <div
                  className={`border-b border-[#D1D5DC] origin-top duration-300 ${
                    dtAllOpen || openRows?.[i]
                      ? "scale-y-100 opacity-100 translate-y-0 h-fit"
                      : "scale-y-90 opacity-0 -translate-y-4 h-0"
                  }`}>
                  {children && children({ idx: i })}
                </div>
              </React.Fragment>
            ))}

            {rightMenu && (
              <ContextMenu
                items={rightMenu}
                onClose={() => {
                  setMenuOpen(undefined);
                }}
                open={menuOpen !== undefined ? true : false}
                x={menuOpen?.x}
                y={menuOpen?.y}
                click={(v) => {
                  rightClick?.(v, menuOpen?.value);
                }}
              />
            )}
          </div>

          {/* 푸터 */}
          {sumCount !== 0 && (
            <div
              className="sticky bottom-0 z-30 h-[2rem] flex min-w-max"
              style={{
                background: "#E4E4E4",
              }}>
              {header.map((item, i) => {
                if (item.disable) {
                  return <div className="w-0"></div>;
                }
                const isSticky = i < fixCount;
                const left = offsets[i];

                if (item.sum || item.sum === 0) {
                  return (
                    <span
                      key={i}
                      className={`${
                        isSticky ? "z-20" : "z-10"
                      } tableSz text-center shrink-0 font-semibold px-2 py-2 overflow-hidden`}
                      style={{
                        width: item.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        background: "#E4E4E4",
                      }}>
                      {item.sum === 0
                        ? sumArray[item.key] || "0"
                        : sumArray[item.key].toFixed(item.sum) || ""}
                    </span>
                  );
                } else {
                  return (
                    <span
                      key={i}
                      className={`${
                        isSticky ? "z-20" : "z-10"
                      } tableSz text-center shrink-0 font-semibold px-2 py-2 overflow-hidden`}
                      style={{
                        width: item.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        background: "#E4E4E4",
                      }}>
                      {""}
                    </span>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.header === next.header &&
      prev.body === next.body &&
      prev.tableId === next.tableId &&
      prev.children === next.children &&
      prev.childClick === next.childClick &&
      prev.inChange === next.inChange
    );
  },
);

type TableRowProps = {
  row: TableRow;
  rowIdx: number;
  onRowPrepared?: (row: TableRow, index: number) => RowPrepType;
  rowRefSetter: (index: number, el: HTMLDivElement | null) => void;
  allChkSelect?: boolean;
  allDropSelect?: boolean;
  header: TableHeaderType[];
  fixCount: number;
  offsets: number[];
  onClick: (r: TableRow) => void;
  onCustumizeText?: (key: string, value: any) => string;
  setChangeValue?: (idx: number, key: string, value: any) => void;
  setChangeValue2?: (idx: number, key: string, value: any) => void;
  reset: number;
  inChange?: { key: string; value: any };
  rightClickRow?: (x: number, y: number) => void;
};

const RowCust = React.memo(
  function RowCust({
    row,
    rowIdx,
    onRowPrepared,
    header,
    rowRefSetter,
    fixCount,
    offsets,
    onClick,
    onCustumizeText,
    setChangeValue,
    setChangeValue2,
    allChkSelect,
    allDropSelect,
    reset,
    inChange,
    rightClickRow,
  }: TableRowProps) {
    const pre = onRowPrepared ? onRowPrepared(row, rowIdx) : undefined;
    const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
    const [localChange, setLocalChange] = useState<TableRow>({});
    const handleCellChange = useCallback(
      (key: string, value: any) => {
        setLocalChange((prev) => {
          if (prev[key] === value) return prev;
          const next = { ...prev, [key]: value };
          setChangeValue?.(rowIdx, key, value);
          return next;
        });
      },
      [rowIdx, setChangeValue],
    );
    const handleCellChange2 = useCallback(
      (key: string, value: any) => {
        setLocalChange((prev) => {
          if (prev[key] === value) return prev;

          const next = { ...prev, [key]: value };
          setChangeValue2?.(rowIdx, key, value);
          return next;
        });
      },
      [rowIdx, inChange],
    );
    useEffect(() => {
      if (allChkSelect !== undefined) {
        if (!allChkSelect && !localChange["CHK"]) {
          return;
        }
        handleCellChange("CHK", allChkSelect);
      }
    }, [allChkSelect]);

    useEffect(() => {
      if (allDropSelect !== undefined) {
        setLocalChange((prev) => {
          if (prev["DROP"] === allDropSelect) return prev;
          const next = { ...prev, ["DROP"]: allDropSelect };
          return next;
        });
      }
    }, [allDropSelect]);

    useEffect(() => {
      setLocalChange({});
    }, [reset]);

    function click() {
      const tmp = header.find((item) => item["key"] === "CHK");
      if (tmp !== undefined && tmp.onClickChk) {
        handleCellChange("CHK", !localChange["CHK"]);
      }
      onClick(row);
    }

    useEffect(() => {
      if (inChange) {
        handleCellChange2(inChange.key, inChange.value);
      }
    }, [inChange]);

    return (
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          rightClickRow?.(e.clientX, e.clientY);
        }}
        key={rowIdx}
        ref={(el) => {
          rowRefSetter(rowIdx, el);
        }}
        className={`flex h-[1.75rem] z-[20] items-center border-b border-[#D1D5DC] hover:bg-gray-100 cursor-pointer ${
          localChange["CHK"]
            ? "bg-[#ABBFDD]"
            : pre?.lines
              ? pre.lines
              : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}>
        {header.map((h, j) => {
          if (h.disable && !(h.option?.type === "CHK")) {
            return <div className="w-0"></div>;
          }
          const isSticky = j < fixCount;
          const left = isSticky ? `${offsets[j]}rem` : undefined;

          const preCell =
            pre && pre.cells?.[h.key] ? pre.cells?.[h.key] : undefined;

          return (
            <div
              key={rowIdx + h.key}
              className={`${
                isSticky ? "z-20" : "z-10"
              } shrink-0 w-full h-full flex items-center cursor-pointer justify-center text-xs text-center shrink-0 active:bg-black font-semibold ${
                j !== header.length - 1 ? "border-r border-[#D1D5DC]" : ""
              }`}
              style={{
                minWidth: h.w,
                width: h.w,
                position: isSticky ? "sticky" : undefined,
                left: isSticky ? left : undefined,
                backgroundColor: "inherit",
              }}
              onMouseDown={(e) => {
                if (e.button === 2) return;
                if (h.key !== "CHK" && h.key !== "DROP") {
                  mouseDownPos.current = {
                    x: e.clientX,
                    y: e.clientY,
                  };
                }
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                if (e.button === 2) return;
                if (h.key !== "CHK" && h.key !== "DROP") {
                  const start = mouseDownPos.current;
                  const moved =
                    start &&
                    (Math.abs(e.clientX - start.x) > 10 ||
                      Math.abs(e.clientY - start.y) > 10);
                  if (moved) return;

                  click();
                }
              }}>
              <CellCust
                headerType={h}
                change={localChange?.[h.key]}
                cellCss={preCell}
                left={left}
                value={row[h.key] || ""}
                changeValue={handleCellChange}
                onCustumizeText={onCustumizeText}
              />
            </div>
          );
        })}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.row === next.row &&
      prev.allChkSelect === next.allChkSelect &&
      prev.allDropSelect === next.allDropSelect &&
      prev.header === next.header &&
      prev.reset === next.reset &&
      prev.inChange === next.inChange
    );
  },
);
type TableCellCust = {
  headerType: TableHeaderType;
  cellCss?: string;
  change?: any;
  left?: string;
  value: any;
  onCustumizeText?: (key: string, value: any) => string;
  changeValue: (key: string, value: any) => void;
};
const CellCust = React.memo(
  function CellCust({
    headerType,
    change,
    cellCss,
    value,
    onCustumizeText,
    changeValue,
  }: TableCellCust) {
    switch (headerType.key) {
      case "CHK":
        return (
          <div
            key={headerType.key}
            className={`w-full h-full cursor-pointer ${
              change ? "bg-[#ED1C2499]" : cellCss || ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              changeValue?.(
                headerType.key,
                change ? !change : value ? !value : true,
              );
            }}>
            <input
              type="checkbox"
              checked={change ? change : value ? value : false}
              className="h-full cursor-pointer accent-gray-300 rounded-md size-4 text-center"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                changeValue?.(headerType.key, e.target.checked);
              }}
            />
          </div>
        );

      case "DROP":
        return (
          <div
            key={headerType.key}
            className={`w-full h-full cursor-pointer flex items-center justify-center ${
              cellCss || ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              changeValue?.(headerType.key, change ? !change : true);
            }}>
            {change ? (
              <IoIosArrowUp className="text-xl text-gray-500" />
            ) : (
              <IoIosArrowDown className="text-xl text-gray-500" />
            )}
          </div>
        );

      default:
        switch (headerType.option?.type) {
          case "ICON": {
            if (headerType.option.value === value) {
              return getIcon(headerType.option.icon, headerType.option.color);
            } else {
              return (
                <span
                  className={`flex no-scrollbar items-center px-[5%] text-center cursor-pointer overflow-x-auto overflow-y-hidden text-nowrap leading-none tableSz truncate h-full ${
                    cellCss ? cellCss : ""
                  }`}
                  style={{ userSelect: "text" }}></span>
              );
            }
          }
          case "WRITE":
            return (
              <input
                key={headerType.key}
                type={typeof value === "number" ? "number" : "text"}
                className={`w-full h-full tableSz focus:outline-none focus:border-2 focus:border-blue-400 no-spinner px-2 ${
                  change ? "bg-[#ED1C2499]" : cellCss || ""
                }`}
                value={confirmObj({
                  obj: change ?? value ?? "",
                  type: headerType.type || "STR",
                  fix: headerType.sum,
                })}
                onChange={(e) => {
                  e.stopPropagation();
                  const raw = e.target.value;

                  changeValue?.(headerType.key, raw);
                }}
                onBlur={(e) => {
                  e.stopPropagation();
                  const raw = e.target.value;
                  const value =
                    headerType.type &&
                    confirmObj({
                      obj: raw,
                      type: headerType.type,
                      fix: headerType.sum,
                    });
                  changeValue?.(headerType.key, value);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    (e.currentTarget as HTMLInputElement).blur();
                  }
                }}
                maxLength={headerType.maxLength}
              />
            );

          case "CHK":
            return (
              <div
                className={`w-full h-full cursor-pointer ${
                  change ? "bg-[#ED1C2499]" : cellCss || ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!headerType.read) {
                    const current = (change ?? value ?? "N") === "Y";
                    changeValue?.(headerType.key, !current);
                  }
                }}>
                <input
                  type="checkbox"
                  checked={(change ?? value ?? "N") === "Y"}
                  className="h-full accent-gray-300 cursor-pointer rounded-md size-4 text-center"
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (!headerType.read) {
                      changeValue?.(
                        headerType.key,
                        e.target.checked ? "Y" : "N",
                      );
                    }
                  }}
                />
              </div>
            );

          default:
            return (
              <span
                className={`flex no-scrollbar items-center px-[5%] text-center cursor-pointer overflow-x-auto overflow-y-hidden text-nowrap leading-none tableSz truncate h-full ${
                  cellCss ? cellCss : ""
                }`}
                style={{ userSelect: "text" }}>
                {onCustumizeText
                  ? onCustumizeText(headerType.key, value)
                  : value !== undefined && value !== null
                    ? value
                    : headerType.type
                      ? headerType.type === "STR"
                        ? ""
                        : 0
                      : ""}
              </span>
            );
        }
    }
  },
  (prev, next) => {
    return (
      prev.headerType === next.headerType &&
      prev.change === next.change &&
      prev.value === next.value
    );
  },
);

function ContextMenu({
  open,
  x,
  y,
  items,
  onClose,
  click,
}: {
  open: boolean;
  x?: number;
  y?: number;
  items: PairType[];
  onClose: () => void;
  click: (v: string) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // 열릴 때 위치 보정 (화면 밖으로 나가지 않게)
  useLayoutEffect(() => {
    if (!open || !x || !y || items === undefined) return;
    const el = menuRef.current;
    if (!el) return;

    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rect = el.getBoundingClientRect();

    let left = x;
    let top = y;

    // 오른쪽/아래로 튀면 flip
    if (left + rect.width + margin > vw)
      left = Math.max(margin, vw - rect.width - margin);
    if (top + rect.height + margin > vh)
      top = Math.max(margin, vh - rect.height - margin);

    // 왼쪽/위로도 최소 마진 유지
    left = Math.max(margin, left);
    top = Math.max(margin, top);

    setPos({ left, top });
  }, [open, x, y]);

  // 닫기: 밖 클릭 / ESC / 스크롤 / 리사이즈
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: any) => {
      const el = menuRef.current;
      if (!el) return;
      if (!el.contains(e.target)) onClose();
    };

    const onScroll = () => onClose();
    const onResize = () => onClose();

    document.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Context menu"
      className="flex flex-col border border-[#d0d0d0] rounded-md"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        minWidth: 140,
        background: "#fff",
        zIndex: 9999,
      }}>
      {items?.map((it) => (
        <div
          key={it.key}
          className="flex h-[2rem] items-center justify-between hover:bg-gray-300 px-[1rem] cursor-pointer"
          onClick={() => {
            click(it.key);
            onClose();
          }}>
          <span className="text-xs font-bold">ㅡ</span>
          <span className="text-xs">{it.value}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export const TableCust2 = React.memo(
  React.forwardRef<TableHandle, TableType2>(function TableCust2(
    {
      body,
      header,
      batch,
      height,
      width,
      fixCount = 0,
      childClick,
      onCustumizeText,
      onRowPrepared,
      changeValue,
      rightClick,
      rightMenu,
      onClick, //return true 시 클릭 bg 클리어
      filterFlag,
      doubleClick,
    },
    ref,
  ) {
    useImperativeHandle(batch ? ref : null, () => ({
      add() {
        setCopBody((prev) => {
          if (prev.length === 0) {
            var tmp: TableRow = {};
            header.forEach((v) => {
              tmp[v.key] = "";
            });
            return [{ ...tmp, NEW_FLAG: "Y", EDIT_FLAG: "Y" }];
          }

          const emptyRow: TableRow = Object.entries(prev[0]).reduce(
            (acc, [key, value]) => {
              if (typeof value === "number") acc[key] = 0;
              else if (typeof value === "boolean") acc[key] = false;
              else acc[key] = "";
              return acc;
            },
            {} as TableRow,
          );

          return [{ ...emptyRow, NEW_FLAG: "Y", EDIT_FLAG: "Y" }, ...prev];
        });
      },
      cancle() {
        setCopBody(body.map((b) => ({ ...b })));
      },
      update() {
        const editedRows: Record<number, TableRow> = copBody.reduce(
          (acc, row, index) => {
            if (row["EDIT_FLAG"] === "Y") {
              acc[index] = row;
            }
            return acc;
          },
          {} as Record<number, TableRow>,
        );
        return editedRows;
      },
      getChk() {
        const editedRows: Record<number, TableRow> = copBody.reduce(
          (acc, row, index) => {
            if (row["CHK"] === true) {
              acc[index] = row;
            }
            return acc;
          },
          {} as Record<number, TableRow>,
        );
        return editedRows;
      },
    }));
    const containerRef = useRef<HTMLDivElement>(null);

    const [copHeader, setCopHeader] = useState<TableHeaderType[]>(() =>
      header.map((h) => ({ ...h })),
    );
    const [copBody, setCopBody] = useState<TableRow[]>(() =>
      body.map((h) => ({ ...h })),
    );

    useEffect(() => {
      setCopHeader(header.map((h) => ({ ...h })));
    }, [header]);

    useEffect(() => {
      setDtAllOpen(false);
      setChkAllOpen(false);
      body.forEach((row) => {
        row["rowId"] = getUUID();
      });
      setCopBody(body.map((b) => ({ ...b })));
    }, [body]);

    const [dtAllOpen, setDtAllOpen] = useState(false);
    const [chkAllOpen, setChkAllOpen] = useState(false);
    const [sort, setSort] = useState<Record<string, TableSortType>>({});
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
    const selectedRowIndexRef = useRef<number>(-1);
    const [menuOpen, setMenuOpen] = useState<
      { x: number; y: number; value: TableRow } | undefined
    >();
    const filterSplit = useMemo(() => filterFlag?.split(";"), [filterFlag]);
    const [filterTxt, setFilterTxt] = useState("");
    const timer = useRef<number | null>(null);

    useEffect(() => {
      document.getElementById("findStr")?.focus({ preventScroll: true });
    }, []);

    useEffect(() => {
      if (filterSplit) {
        if (filterTxt) {
          setCopBody(
            body
              .filter((b) =>
                filterSplit.some((f) => String(b[f]).includes(filterTxt)),
              )
              .map((b) => ({ ...b })),
          );
        } else {
          setCopBody(body.map((b) => ({ ...b })));
        }
      }
    }, [filterTxt]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          // 👇 이 컴포넌트 내부에서만 동작
          if (!containerRef.current?.contains(document.activeElement)) return;

          if (copBody.length > 0) {
            onClick?.(copBody[0]);
          } else {
            sendErr("선택가능한 행이 없습니다.");
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [copBody]);

    const offsets = useMemo(
      () =>
        copHeader.map((_, i) => {
          const visibleBeforeWidth = header
            .slice(0, i)
            .filter((h) => !h.disable)
            .reduce((sum, h) => sum + parseFloat(h.w), 0);
          return visibleBeforeWidth;
        }),
      [copHeader],
    );

    const sumCount = useMemo(
      () =>
        copHeader.reduce((sum, h) => {
          if (h.sum != null && h.sum >= 0) {
            return sum + 1;
          }
          return sum;
        }, 0),
      [copHeader],
    );

    const sumArray = useMemo(
      () => summarize(copHeader, copBody),
      [copHeader, copBody],
    );

    const handleClick = (r: TableRow): Promise<boolean> => {
      return new Promise((resolve) => {
        if (timer.current !== null) {
          window.clearTimeout(timer.current);
          timer.current = null;
          doubleClick?.(r);
          resolve(true);
        } else {
          timer.current = window.setTimeout(async () => {
            const flag = (await onClick?.(r)) ?? false;
            timer.current = null;
            resolve(flag);
          }, 250);
        }
      });
    };

    return (
      <div
        ref={containerRef}
        className={`overflow-auto border border-gray-600`}
        style={{ maxWidth: width, height: height }}>
        <div className="flex flex-col">
          {" "}
          {filterFlag && (
            <div
              className="sticky z-30 h-[2rem] flex min-w-max mainInput flex items-center bg-white rounded-md border border-gray-300 px-3 py-1
              focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input
                id="findStr"
                className="w-full h-full text-left focus:outline-none flex shrink-0 "
                placeholder="Find..."
                value={filterTxt}
                onChange={(e) => {
                  setFilterTxt(e.target.value);
                }}
              />
            </div>
          )}
          {/* 헤더 */}
          <div className="sticky top-0 z-30 h-[2rem] flex min-w-max bg-[#6F6F70]">
            {copHeader.map((r, i) => {
              if (r.disable) {
                return null;
              }

              const isSticky = i < fixCount;
              const left = isSticky ? `${offsets[i]}rem` : undefined;

              switch (r.key) {
                case "DROP":
                  return (
                    <div
                      className={`w-[3rem] flex shrink-0 cursor-pointer items-center justify-center border-r border-[#D1D5DC] ${
                        fixCount > 0 ? "z-20" : "z-10"
                      }`}
                      style={{
                        width: r.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        backgroundColor: "inherit",
                      }}>
                      <div
                        className="flex  items-center justify-center text-xl cursor-pointer hover:bg-gray-300 hover:text-gray-700 p-[0.15rem] text-white rounded-full"
                        onClick={() => {
                          const flag = !dtAllOpen;
                          setDtAllOpen((prev) => flag);
                          setCopBody((prev) =>
                            prev.map((v) => ({ ...v, DROP: flag })),
                          );
                          if (flag) {
                            const tmpArr: number[] = copBody.map((_, i) => i);
                            childClick?.(tmpArr);
                          } else {
                            childClick?.([]);
                          }
                        }}>
                        {dtAllOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
                      </div>
                    </div>
                  );

                case "CHK":
                  return (
                    <div
                      className={`w-[3rem] flex shrink-0 cursor-pointer items-center justify-center border-r border-[#D1D5DC] ${
                        fixCount > 0 ? "z-20" : "z-10"
                      }`}
                      style={{
                        width: r.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        backgroundColor: "inherit",
                      }}>
                      <div
                        className="flex items-center justify-center cursor-pointer w-full h-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (sort[r.key]) {
                            if (sort[r.key] === "ASC") {
                              setSort((prev) => ({
                                ...prev,
                                [r.key]: "DESC",
                              }));
                              const data = sortTable({
                                type: "DESC",
                                table: copBody,
                                key: r.key,
                              });
                              setCopBody(data);
                            } else {
                              setSort((prev) => ({
                                ...prev,
                                [r.key]: "ASC",
                              }));
                              const data = sortTable({
                                type: "ASC",
                                table: copBody,
                                key: r.key,
                              });
                              setCopBody(data);
                            }
                          } else {
                            setSort((prev) => ({ ...prev, [r.key]: "ASC" }));
                            const data = sortTable({
                              type: "ASC",
                              table: copBody,
                              key: r.key,
                            });
                            setCopBody(data);
                          }
                        }}>
                        <input
                          type="checkbox"
                          checked={chkAllOpen}
                          className="h-full accent-gray-300 rounded-md size-4 text-center"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            setChkAllOpen(e.target.checked);
                            setCopBody((prev) =>
                              prev.map((v) => ({
                                ...v,
                                CHK: e.target.checked,
                              })),
                            );
                          }}
                        />
                      </div>
                    </div>
                  );
                default:
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center gap-1 py-2 shrink-0 ${
                        isSticky ? "z-20" : "z-10"
                      } ${
                        i !== copHeader.length - 1
                          ? "border-r border-[#D1D5DC]"
                          : ""
                      }`}
                      style={{
                        width: r.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        backgroundColor: "inherit",
                      }}
                      onClick={() => {
                        if (sort[r.key]) {
                          if (sort[r.key] === "ASC") {
                            setSort((prev) => ({
                              ...prev,
                              [r.key]: "DESC",
                            }));
                            const data = sortTable({
                              type: "DESC",
                              table: copBody,
                              key: r.key,
                            });
                            setCopBody(data);
                          } else {
                            setSort((prev) => ({
                              ...prev,
                              [r.key]: "ASC",
                            }));
                            const data = sortTable({
                              type: "ASC",
                              table: copBody,
                              key: r.key,
                            });
                            setCopBody(data);
                          }
                        } else {
                          setSort((prev) => ({ ...prev, [r.key]: "ASC" }));
                          const data = sortTable({
                            type: "ASC",
                            table: copBody,
                            key: r.key,
                          });
                          setCopBody(data);
                        }
                      }}>
                      <span
                        className={`text-white tableSz text-center font-semibold cursor-pointer`}>
                        {r.value}
                      </span>
                    </div>
                  );
              }
            })}
          </div>
          {/* 바디 */}
          <div
            className="flex-1 min-h-0 min-w-max"
            onMouseLeave={(e) => {
              e.preventDefault();
              setMenuOpen(undefined);
            }}>
            {copBody.map((r, i) => (
              <React.Fragment key={i}>
                <RowCust2
                  header={copHeader}
                  idx={i}
                  pre={onRowPrepared?.(r, i)}
                  onCustumizeText={onCustumizeText}
                  row={r}
                  fixCount={fixCount}
                  offsets={offsets}
                  batch={batch}
                  changeValue={(idx, k, v) => {
                    if (k === "DROP" || k === "CHK") {
                      setCopBody((prev) =>
                        prev.map((prevV, prevI) => {
                          if (prevI === idx) {
                            return { ...prevV, CHK: v };
                          } else {
                            return prevV;
                          }
                        }),
                      );
                    } else {
                      if (batch) {
                        if (r[k] !== v) {
                          setCopBody((prev) => {
                            return prev.map((prevV, prevI) => {
                              if (prevI === idx) {
                                return { ...prevV, [k]: v, EDIT_FLAG: "Y" };
                              } else {
                                return prevV;
                              }
                            });
                          });
                        }
                      } else {
                        changeValue?.(idx, k, v);
                      }
                    }
                  }}
                  rowRefSetter={(el) => (rowRefs.current[i] = el)}
                  onClick={async () => {
                    const pre = onRowPrepared ? onRowPrepared(r, i) : undefined;
                    const prevIdx = selectedRowIndexRef.current;

                    if (prevIdx === i && rowRefs.current[prevIdx]) {
                      rowRefs.current[prevIdx]!.style.backgroundColor = "";
                      selectedRowIndexRef.current = -1;
                      await onClick?.({});
                      return;
                    }

                    if (prevIdx >= 0 && rowRefs.current[prevIdx]) {
                      rowRefs.current[prevIdx]!.style.backgroundColor = "";
                    }

                    if (rowRefs.current[i]) {
                      if (r["CHK"]) {
                        rowRefs.current[i]!.style.backgroundColor = "#B2C4E0";
                      } else if (pre && pre.lines) {
                        rowRefs.current[i]!.style.backgroundColor = pre.lines;
                      } else {
                        rowRefs.current[i]!.style.backgroundColor = "#C5D3E8";
                      }
                    }

                    const flag = await handleClick(r);

                    if (flag) {
                      if (prevIdx >= 0 && rowRefs.current[prevIdx]) {
                        rowRefs.current[prevIdx]!.style.backgroundColor = "";
                      }
                      selectedRowIndexRef.current = -1;
                    } else {
                      selectedRowIndexRef.current = i;
                    }
                  }}
                  rightClickRow={(x, y) => {
                    setMenuOpen({ x: x, y: y, value: r });
                  }}
                />
              </React.Fragment>
            ))}
            {rightMenu && (
              <ContextMenu
                items={rightMenu}
                onClose={() => {
                  setMenuOpen(undefined);
                }}
                open={menuOpen !== undefined ? true : false}
                x={menuOpen?.x}
                y={menuOpen?.y}
                click={(v) => {
                  rightClick?.(v, menuOpen?.value);
                }}
              />
            )}
          </div>
          {/* 푸터 */}
          {sumCount !== 0 && (
            <div
              className="sticky bottom-0 z-30 h-[2rem] flex min-w-max"
              style={{
                background: "#E4E4E4",
              }}>
              {header.map((item, i) => {
                if (item.disable) {
                  return <div className="w-0"></div>;
                }
                const isSticky = i < fixCount;
                const left = offsets[i];

                if (item.sum || item.sum === 0) {
                  return (
                    <span
                      key={i}
                      className={`${
                        isSticky ? "z-20" : "z-10"
                      } tableSz text-center shrink-0 font-semibold px-2 py-2 overflow-hidden`}
                      style={{
                        width: item.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        background: "#E4E4E4",
                      }}>
                      {item.sum === 0
                        ? sumArray[item.key] || "0"
                        : sumArray[item.key].toFixed(item.sum) || ""}
                    </span>
                  );
                } else {
                  return (
                    <span
                      key={i}
                      className={`${
                        isSticky ? "z-20" : "z-10"
                      } tableSz text-center shrink-0 font-semibold px-2 py-2 overflow-hidden`}
                      style={{
                        width: item.w,
                        position: isSticky ? "sticky" : undefined,
                        left: isSticky ? left : undefined,
                        background: "#E4E4E4",
                      }}>
                      {""}
                    </span>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    );
  }),
  (prev, next) => {
    return prev.header === next.header && prev.body === next.body;
  },
);

const RowCust2 = React.memo(
  function RowCust2({
    row,
    idx,
    header,
    pre,
    fixCount,
    offsets,
    batch,
    onCustumizeText,
    changeValue,
    rowRefSetter,
    onClick,
    rightClickRow,
  }: {
    row: TableRow;
    idx: number;
    header: TableHeaderType[];
    pre?: RowPrepType;
    fixCount: number;
    offsets: number[];
    batch?: boolean;
    onCustumizeText?: (key: string, value: any) => string;
    changeValue: (i: number, key: string, value: any) => void;
    rowRefSetter: (el: HTMLDivElement | null) => void;
    onClick: () => void;
    rightClickRow?: (x: number, y: number) => void;
  }) {
    const [copRow, setCopRow] = useState({ ...row });
    useEffect(() => {
      setCopRow({ ...row });
    }, [row]);
    return (
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          rightClickRow?.(e.clientX, e.clientY);
        }}
        ref={(el) => {
          rowRefSetter(el);
        }}
        className={`flex h-[1.75rem] z-[20] items-center border-b border-[#D1D5DC] hover:bg-gray-100 cursor-pointer ${
          copRow["CHK"] ? "bg-[#ABBFDD]" : pre?.lines ? pre.lines : "bg-white"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}>
        {header.map((h, j) => {
          if (h.disable && !(h.option?.type === "CHK")) {
            return <div className="w-0"></div>;
          }
          const isSticky = j < fixCount;
          const left = isSticky ? `${offsets[j]}rem` : undefined;

          const preCell =
            pre && pre.cells?.[h.key] ? pre.cells?.[h.key] : undefined;
          return (
            <div
              key={idx + h.key}
              className={`${
                isSticky ? "z-20" : "z-10"
              } shrink-0 w-full h-full flex items-center cursor-pointer justify-center text-xs text-center shrink-0 active:bg-black font-semibold ${
                j !== header.length - 1 ? "border-r border-[#D1D5DC]" : ""
              }`}
              style={{
                minWidth: h.w,
                width: h.w,
                position: isSticky ? "sticky" : undefined,
                left: isSticky ? left : undefined,
                backgroundColor: "inherit",
              }}>
              <CellCust2
                headerType={h}
                value={h.key === "BTN" ? copRow["rowId"] : copRow[h.key]}
                batch={batch}
                cellCss={preCell}
                custValue={onCustumizeText?.(h.key, copRow[h.key])}
                changeFlag={copRow["EDIT_FLAG"] === "Y"}
                newFlag={copRow["NEW_FLAG"] === "Y"}
                changeValue={(k, v) => {
                  changeValue(idx, k, v);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.row === next.row &&
      prev.header === next.header &&
      prev.idx === next.idx
    );
  },
);

const CellCust2 = React.memo(
  function CellCust2({
    headerType,
    value,
    cellCss,
    batch,
    changeValue,
    custValue,
    changeFlag,
    newFlag,
  }: {
    headerType: TableHeaderType;
    cellCss?: string;
    value: any;
    batch?: boolean;
    changeValue?: (k: string, v: any) => void;
    custValue?: string;
    changeFlag?: boolean;
    newFlag?: boolean;
  }) {
    switch (headerType.key) {
      case "CHK":
        return (
          <div
            key={headerType.key}
            className={`w-full h-full cursor-pointer ${
              value ? "bg-[#ED1C2499]" : cellCss || ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              changeValue?.(headerType.key, value ? !value : true);
            }}>
            <input
              type="checkbox"
              checked={value ? value : false}
              className="h-full cursor-pointer accent-gray-300 rounded-md size-4 text-center"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                changeValue?.(headerType.key, e.target.checked);
              }}
            />
          </div>
        );

      case "DROP":
        return (
          <div
            key={headerType.key}
            className={`w-full h-full cursor-pointer flex items-center justify-center ${
              cellCss || ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              changeValue?.(headerType.key, value ? !value : true);
            }}>
            {value ? (
              <IoIosArrowUp className="text-xl text-gray-500" />
            ) : (
              <IoIosArrowDown className="text-xl text-gray-500" />
            )}
          </div>
        );
      case "BTN": {
        if (headerType.option?.type === "BTN") {
          return (
            <Btn
              txt={headerType.option.set.txt}
              type={headerType.option.set.type}
              onClick={() => {
                if (headerType.option?.type === "BTN") {
                  headerType.option.set.onClick?.(value);
                }
              }}
            />
          );
        }
        break;
      }

      default: {
        if (batch) {
          if (newFlag) {
            if (headerType.option?.type === "DROPDOWN") {
              return (
                <div>
                  <CommonDropDown
                    id={value}
                    data={headerType.option.body}
                    dropHeight="10rem"
                    header={headerType.option.header}
                    inputKey={{
                      key: headerType.option.inputKey.key,
                      showKey: headerType.option.inputKey.showKey,
                      value: value,
                    }}
                    onClick={(r) => {
                      if (headerType.option?.type === "DROPDOWN") {
                        changeValue?.(
                          headerType.key,
                          r[headerType.option.inputKey.key],
                        );
                      }
                    }}
                    find={headerType.option.find}
                  />
                </div>
              );
            } else {
              return (
                <WriteCell
                  headerType={headerType}
                  value={value}
                  cellCss={cellCss}
                  changeFlag={changeFlag}
                  changeValue={(k, v) => changeValue?.(k, v)}
                />
              );
            }
          }

          if (headerType.option !== undefined) {
            switch (headerType.option.type) {
              case "DROPDOWN": {
                return (
                  <div>
                    <CommonDropDown
                      id={value}
                      data={headerType.option.body}
                      dropHeight="10rem"
                      header={headerType.option.header}
                      inputKey={{
                        key: headerType.option.inputKey.key,
                        showKey: headerType.option.inputKey.showKey,
                        value: value,
                      }}
                      onClick={(r) => {
                        if (headerType.option?.type === "DROPDOWN") {
                          changeValue?.(
                            headerType.key,
                            r[headerType.option.inputKey.key],
                          );
                        }
                      }}
                      find={headerType.option.find}
                    />
                  </div>
                );
              }
              case "WRITE":
                return (
                  <WriteCell
                    headerType={headerType}
                    value={value}
                    cellCss={cellCss}
                    changeFlag={changeFlag}
                    changeValue={(k, v) => changeValue?.(k, v)}
                  />
                );

              case "CHK":
                return (
                  <div
                    className={`w-full h-full cursor-pointer ${
                      changeFlag ? "bg-[#ED1C2499]" : cellCss || ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!headerType.read) {
                        const current = (value ?? "N") === "Y";
                        changeValue?.(headerType.key, !current);
                      }
                    }}>
                    <input
                      type="checkbox"
                      checked={(value ?? "N") === "Y"}
                      className="h-full accent-gray-300 cursor-pointer rounded-md size-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (!headerType.read) {
                          changeValue?.(
                            headerType.key,
                            e.target.checked ? "Y" : "N",
                          );
                        }
                      }}
                    />
                  </div>
                );
            }
          }
        }

        return (
          <span
            className={`flex w-full justify-center no-scrollbar items-center px-[5%] text-center cursor-pointer overflow-x-auto overflow-y-hidden text-nowrap leading-none tableSz truncate h-full ${
              changeFlag ? "bg-[#ED1C2499]" : cellCss ? cellCss : ""
            }`}
            style={{ userSelect: "text" }}>
            {custValue !== undefined
              ? custValue
              : value !== undefined && value !== null
                ? value
                : headerType.type
                  ? headerType.type === "STR"
                    ? ""
                    : 0
                  : ""}
          </span>
        );
      }
    }
  },
  (prev, next) => {
    return (
      prev.headerType === next.headerType &&
      prev.value === next.value &&
      prev.changeFlag === next.changeFlag
    );
  },
);

function WriteCell({
  headerType,
  value,
  changeValue,
  cellCss,
  changeFlag,
}: {
  headerType: TableHeaderType;
  value: any;
  changeValue?: (k: string, v: any) => void;
  cellCss?: string;
  changeFlag?: boolean;
}) {
  const [local, setLocal] = React.useState(
    String(
      confirmObj({
        obj: value,
        type: headerType.type || "STR",
        fix:
          (headerType.option?.type === "WRITE" && headerType.option.ext) || 0,
      }) ?? "",
    ),
  );
  const composingRef = React.useRef(false);

  // 외부 값이 바뀌면 local도 동기화 (단, 조합 중엔 건드리지 않음)
  React.useEffect(() => {
    if (composingRef.current) return;
    setLocal(
      String(
        confirmObj({
          obj: value,
          type: headerType.type || "STR",
          fix:
            (headerType.option?.type === "WRITE" && headerType.option.ext) || 0,
        }) ?? "",
      ),
    );
  }, [value, headerType.type]);

  const commit = (raw: string) => {
    const committed = headerType.type
      ? confirmObj({
          obj: raw,
          type: headerType.type,
          fix:
            (headerType.option?.type === "WRITE" && headerType.option.ext) || 0,
        })
      : raw;

    const parsedText = String(committed ?? "");

    setLocal(parsedText); // 핵심
    changeValue?.(headerType.key, committed);
  };

  return (
    <input
      type={typeof value === "number" ? "number" : "text"}
      className={`w-full h-full tableSz focus:outline-none focus:border-2 focus:border-blue-400 no-spinner px-2 ${
        changeFlag ? "bg-[#ED1C2499]" : cellCss || ""
      }`}
      value={local}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        composingRef.current = false;
        const raw = e.currentTarget.value;
        commit(raw); // ✅ 조합 끝나면 반영
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setLocal(raw);
      }}
      onBlur={(e) => {
        const raw = e.target.value;
        commit(raw); // ✅ 포커스 빠질 때 최종 반영
      }}
      onKeyDown={(e) => {
        // 한글 조합중 Enter로 blur하면 깨질 수 있음
        if ((e.nativeEvent as any).isComposing) return;
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      maxLength={headerType.maxLength}
    />
  );
}
