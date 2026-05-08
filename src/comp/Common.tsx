import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../slices/store";
import { MdErrorOutline, MdOutlineCheckCircle } from "react-icons/md";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { changeVisible, clearAllErr, delError } from "../slices/err";
import { useLocation, useNavigate } from "react-router-dom";
import {
  type BtnType,
  type CalendarType,
  type DayType,
  type ErrorToastProps,
  type ModalProps,
  type MonType,
  type ToggleBtnType,
} from "../Util/Type";
import { PiAirplaneInFlightBold } from "react-icons/pi";
import { selectNav } from "../slices/user";
import { IoIosArrowDown, IoIosArrowUp, IoMdRefresh } from "react-icons/io";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import moment from "moment";
import { createPortal } from "react-dom";
import { IoMdClose } from "react-icons/io";
import {
  closeConfirm,
  setConfirmListener,
  type ConfirmOptions,
} from "../confirmService";
import { Btn } from "./Btn";
import { getScrollParent } from "./DropDown";
import { setSignListener, type SignOptions } from "../signService";
import { sendErr } from "../Util/Util";
import { CommonChk } from "./Input";
import dayjs from "dayjs";

export const ICON_SIZE = "text-2xl cursor-pointer";
export const ICON_COLOR = "text-blue-500";
const WEEK_NOMAL = "text-black h-full h-[40px]";
const WEEK_HOLY = "text-[#C92F34] h-full h-[40px]";
const WEEK_NO = "text-[#C4C8CD] h-full h-[40px]";
const monData: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

export const Error = () => {
  const err = useSelector((state: RootState) => state.err);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!err.rd) return;

    const tmp = pathname.split("/");
    navigate("/" + tmp[1]);

    const timer = setTimeout(() => {
      dispatch(clearAllErr());
    }, 3000);

    // 3) 컴포넌트 언마운트/rd 변할 때 타이머 정리
    return () => {
      clearTimeout(timer);
    };
  }, [err.rd]);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return (
    <>
      <div
        className={`fixed z-[9999] top-10 left-1/2 -translate-x-1/2 flex flex-col items-center ${
          isMobile ? "" : "space-y-2"
        }`}>
        {err.queue.map((obj) => (
          <ErrorRow
            key={obj.id}
            id={obj.id}
            errFlag={obj.errFlag}
            errMsg={obj.errMsg}
            visible={obj.visible}
            deviceType={isMobile ? "MOBILE" : "PC"}
          />
        ))}
      </div>
    </>
  );
};

export const ErrorRow = ({
  id,
  errFlag,
  errMsg,
  visible,
  deviceType,
}: ErrorToastProps) => {
  const dispatch = useDispatch();

  const errIcon = (errFlag: string) => {
    switch (errFlag) {
      case "Y":
        return (
          <MdErrorOutline className="flex-shrink-0 text-[#ED1C24] text-2xl mr-2" />
        );
      case "C":
        return (
          <MdOutlineCheckCircle className="flex-shrink-0 text-[#1893D5] text-2xl mr-2" />
        );
    }
  };

  const errBg = (errFlag: string) => {
    switch (errFlag) {
      case "Y":
        return "bg-[#FDEDED]";
      case "C":
        return "bg-[#E5F6FD]";
    }
  };

  useEffect(() => {
    if (!visible) {
      // 첫 등장 시 visible을 true로 바꿔줌

      const bolTimer = setTimeout(() => {
        dispatch(changeVisible({ key: id, bol: true }));
      }, 5000);

      return () => {
        clearTimeout(bolTimer);
      };
    } else {
      const timer = setTimeout(() => {
        dispatch(delError(id));
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [visible, id]);

  return (
    <>
      <div
        id={id}
        className={`${errBg(errFlag)}
    ${deviceType === "PC" ? "max-w-[30vw]" : "max-w-[100vw]"} z-[100] rounded px-4 py-2 flex min-w-[100px] w-fit items-center duration-300 ${
      visible ? "opacity-0 -translate-y-2" : "opacity-100"
    }`}
        onClick={(e) => {
          e.stopPropagation();
          dispatch(delError(id));
        }}>
        {errIcon(errFlag)}
        <pre className="contTitle whitespace-pre-wrap break-words">
          {errMsg}
        </pre>
      </div>
    </>
  );
};

export function Loading() {
  const loadingFlag = useSelector((state: RootState) => state.user.loading);

  if (!loadingFlag) return null;
  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center"
      role="dialog"
      aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      <div className="inline-block w-13 h-13 rounded-full border-[4px] border-blue-500 border-r-transparent animate-spin" />
    </div>
  );
}

type ConfirmState = {
  open: boolean;
  title: string;
  message?: string;
  yes?: () => void;
  no?: () => void;
};

export function ConfirmIO() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
    yes: undefined,
    no: undefined,
  });

  useEffect(() => {
    // 전역 listener 등록
    setConfirmListener((options: ConfirmOptions | null) => {
      if (options) {
        setState({
          open: true,
          title: options.title,
          message: options.message,
          yes: options.yes,
          no: options.no,
        });
      } else {
        setState({ open: false, title: "" });
      }
    });
  }, []);
  return (
    <ModalCust
      open={state.open}
      onClose={() => {
        closeConfirm();
      }}
      title={state.title}
      size="sm">
      <div className="px-[6%] py-[3%] flex flex-col gap-5 z-[9999]">
        <pre className="contTitle whitespace-pre-wrap break-words">
          {state.message || ""}
        </pre>
        <div
          className={`flex w-full ${
            state.no ? "justify-between" : "justify-end"
          } items-center`}>
          <Btn
            type="SAVE"
            txt="OK"
            onClick={() => {
              state.yes?.();
            }}
          />
          {state.no && (
            <Btn
              type="DELETE"
              txt="CANCEL"
              onClick={() => {
                state.no?.();
              }}
            />
          )}
        </div>
      </div>
    </ModalCust>
  );
}

type SignState = {
  open: boolean;
  yes?: (file: File) => void;
  no?: () => void;
};

export function SignIO() {
  const [state, setState] = useState<SignState>({
    open: false,
    yes: undefined,
    no: undefined,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [chk, setChk] = useState(false);

  const drawingRef = useRef(false);
  const signedRef = useRef(false);

  const [hasSigned, setHasSigned] = useState(false);
  useEffect(() => {
    // 전역 listener 등록
    setSignListener((options: SignOptions | null) => {
      if (options) {
        setState({
          open: true,
          yes: options.yes,
          no: options.no,
        });
      } else {
        setState({ open: false });
      }
    });
  }, []);

  useEffect(() => {
    if (state.open) {
      setHasSigned(false);
      setChk(false);
      initCanvas();
    }
  }, [state.open]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width = rect.width * ratio;
    canvas.height = 220 * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = "220px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#111827";

    ctx.clearRect(0, 0, rect.width, 220);
  };

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    e.preventDefault();

    drawingRef.current = true;
    signedRef.current = true;
    setHasSigned(true);

    canvas.setPointerCapture(e.pointerId);

    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    e.preventDefault();

    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault();
    drawingRef.current = false;

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clearSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;

    ctx.clearRect(0, 0, width, height);

    drawingRef.current = false;
    signedRef.current = false;
    setHasSigned(false);
  };

  const saveSign = () => {
    if (!chk) {
      sendErr("동의부분을 체크해주세요.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!signedRef.current) {
      sendErr("서명을 먼저 입력해주세요.");
      return;
    }

    const signImage = canvas.toDataURL("image/png");
    const file = dataURLtoFile(
      signImage,
      `sign_${dayjs().format("YYMMDDHHmmssSSS")}.png`,
    );

    state.yes?.(file);
  };
  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };
  if (!state.open) return null;
  return (
    <div className="fixed top-[7%] left-0 w-full z-[999] max-w-[720px] rounded-xl bg-white p-4">
      <div className="mb-4 border-b pb-3">
        <div className="text-lg font-bold">전자서명</div>
        <div className="mt-1 text-sm text-gray-500">
          아래 영역에 손가락으로 서명해주세요.
        </div>
      </div>

      <div className="grid grid-cols-[1fr_0.1fr] items-center justify-between mb-3 rounded-lg border bg-gray-50 px-2">
        <span className="text-[12px] text-gray-700">
          신청 내용을 확인하였으며 이에 동의합니다.
        </span>
        <CommonChk id="confirmChk" onChange={(v) => setChk(v)} value={chk} />
      </div>
      <div className="rounded-xl border border-gray-300 bg-white p-2">
        <canvas
          ref={canvasRef}
          className="block h-[220px] w-full rounded-lg bg-white touch-none"
          style={{
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {hasSigned ? "서명이 입력되었습니다." : "서명 전"}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={clearSign}>
          지우기
        </button>

        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => state.no?.()}>
          닫기
        </button>

        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
          onClick={saveSign}>
          저장
        </button>
      </div>
    </div>
  );
}

export const MainMenu = ({
  open,
  setOpen,
  selectMain,
  setSelectMain,
  setTop,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  selectMain: string;
  setSelectMain: (v: string) => void;
  setTop: (v: number) => void;
}) => {
  const menu = useSelector((state: RootState) => state.user.menu);
  const getMenu = (str: string) => {
    switch (str) {
      case "MSG":
        return (
          <PiAirplaneInFlightBold
            className={`${ICON_SIZE} ${selectMain === str ? ICON_COLOR : ""}`}
          />
        );
      // case "BRD":
      //   return (
      //     <BiNews
      //       className={`${ICON_SIZE} ${selectMain === str ? ICON_COLOR : ""}`}
      //     />
      //   );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectMain("");
    }
  }, [open]);

  if (menu.length === 0) return null;
  return (
    <div
      className={`flex h-full z-[100] delay-150 duration-800 ${
        open ? "w-[10rem]" : "w-[4rem]"
      }`}>
      <div
        className={`flex flex-col z-[100] w-full h-full items-center bg-[#F0F0F0] overlow-x-auto border-r border-[#D1D5DC] shadow-md`}>
        <div
          className="w-full mb-[0.25rem] hover:bg-gray-400 py-[0.5rem] px-[0.25rem] cursor-pointer"
          onClick={() => setOpen(!open)}>
          {(open && <IoIosArrowBack className="text-2xl" />) || (
            <IoIosArrowForward className="text-2xl" />
          )}
        </div>
        {menu.map((item) => {
          const icon = getMenu(item["MENU_ID"]);
          if (!icon) return null;

          return (
            <div
              className={`flex flex-col gap-1 w-full items-center cursor-pointer py-1 hover:bg-[#E1E1E1]`}
              key={item["MENU_ID"]}
              onMouseEnter={(e) => {
                e.stopPropagation();
                const itemRect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                setTop(itemRect.top);
                setSelectMain(item["MENU_ID"]);
              }}>
              {icon}
              <div
                className={`w-full text-center text-nowrap cursor-pointer delay-150 duration-500 ${
                  open
                    ? "scale-100 opacity-100 translate-0"
                    : "scale-50 opacity-0 -translate-x-20"
                }`}>
                <span
                  className={`${
                    item["MENU_ID"] === selectMain ? ICON_COLOR : ""
                  }`}>
                  {item["MENU_NAME"]}{" "}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SubMenu = ({ open }: { open: { main: string; top: number } }) => {
  const menu = useSelector((state: RootState) => state.user.menu);
  const [subMenu, setSubMenu] = useState(
    menu.find((item) => item["MENU_ID"] === open.main) || null,
  );
  const [selectSub, setSelectSub] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (open.main) {
      const tmp = menu.find((item) => item["MENU_ID"] === open.main);
      setSubMenu(tmp);
    }
  }, [open.main]);
  return (
    <div
      className={`
        relative flex flex-col gap-1 h-full
        items-center bg-[#D1D5DC]
        border-r border-t border-b border-[#D1D5DC] shadow-md rounded-r-md duration-800 ${
          open.main === ""
            ? "w-0 z-0 -translate-x-2 scale-x-90 opacity-0 pointer-events-none"
            : "w-[15rem] z-[100] transltate-x-1 scale-x-100 opacity-100"
        }
      `}
      style={{ paddingTop: open.top - 48 }}>
      <div className="h-fit w-full">
        {subMenu?.["children"]?.map((item: any) => {
          const endChildren = item.children || [];

          // case 1: 하위 endChildren이 있는 메뉴 (드롭다운 / 아코디언)
          if (endChildren.length > 0) {
            return (
              <div
                key={item["MENU_ID"]}
                className={`flex flex-col w-full items-center hover:bg-[#F0F0F0]`}
                onMouseEnter={() => setSelectSub(item["MENU_ID"])}>
                {/* 1차 메뉴 라인 */}
                <div className="flex my-[3%] gap-1 items-center cursor-pointer justify-center">
                  <div
                    className={`
     max-w-[12rem] text-center`}>
                    <span className="hover:text-blue-600 font-semibold h-full flex items-center text-nowrap">
                      {item["MENU_NAME"]}
                    </span>
                  </div>

                  {selectSub === item["MENU_ID"] ? (
                    <IoIosArrowUp />
                  ) : (
                    <IoIosArrowDown />
                  )}
                </div>

                {/* 2차 하위 목록 */}
                <div
                  className={`
                  flex flex-col m-[1%] gap-1 text-gray-700 w-full items-center origin-top
                  overflow-hidden duration-500 ${
                    selectSub === item["MENU_ID"]
                      ? "scale-y-100 translate-y-0 h-fit"
                      : "scale-y-50 -translate-y-2 h-0"
                  }
                `}>
                  {endChildren.map((endRow: any) => (
                    <div
                      key={endRow["MENU_ID"]}
                      className="cursor-pointer flex font-semibold items-center justify-center hover:text-blue-600 hover:bg-gray-200 w-full h-[1.7rem] text-nowrap"
                      onClick={() => {
                        dispatch(selectNav(item));
                      }}>
                      {endRow["MENU_NAME"]}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // case 2: 하위 endChildren이 없는 일반 메뉴
          return (
            <div
              key={item["MENU_ID"]}
              className={`flex flex-col h-[2rem] w-full items-center`}
              onMouseEnter={() => setSelectSub(item["MENU_ID"])}>
              <span
                className={`
              flex justify-center items-center font-semibold h-full w-full text-center cursor-pointer hover:text-blue-600 hover:bg-[#F0F0F0] py-1 text-nowrap
            `}
                onClick={() => {
                  dispatch(selectNav(item));
                }}>
                {item["MENU_NAME"]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const POP_W = 280;
const POP_H = 290;
const GAP = 0;

export function Calendar({ date, changeDate, type = "DAY" }: CalendarType) {
  const [originDate, setOriginDate] = useState<string>(date);

  const monOrder: MonType[] =
    type === "DAY" ? ["DAY", "MONTH", "YEAR"] : ["MONTH", "YEAR"];
  const [calOpen, setCalOpen] = useState(false);
  const [monOpen, setMonOpen] = useState<MonType>(
    type === "DAY" ? "DAY" : "MONTH",
  );
  const [calData, setCalData] = useState<DayType[]>([]);
  const [yearData, setYearData] = useState<number[]>([]);
  const [yearChange, setYearChange] = useState<boolean>(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({
    x: anchorRef.current?.getBoundingClientRect().top,
    y: anchorRef.current?.getBoundingClientRect().left,
  });
  const [dropAlign, setDropAlign] = useState<"left" | "right">("left");
  const [dropDir, setDropDir] = useState<"top" | "bottom">("bottom");

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  useEffect(() => {
    calc();
  }, []);

  const calc = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const r = anchor.getBoundingClientRect();

    // 1) 좌우 정렬 결정 (기본은 left)
    const align: "left" | "right" =
      r.left + POP_W > window.innerWidth ? "right" : "left";

    // 2) align에 따른 left 계산
    let left = align === "right" ? r.right - POP_W : r.left;

    // 3) viewport 바깥으로 튀는 것 방지 (좌우 clamp)
    left = clamp(left, GAP, window.innerWidth - POP_W - GAP);

    // 4) 위/아래 결정
    const dir: "top" | "bottom" =
      r.bottom + POP_H + GAP > window.innerHeight ? "top" : "bottom";

    // 5) dir에 따른 top 계산
    let top = dir === "top" ? r.top - POP_H - GAP : r.bottom + GAP;

    // 6) 상하 clamp도 optional (원하면)
    top = clamp(top, GAP, window.innerHeight - POP_H - GAP);

    setDropAlign(align);
    setDropDir(dir);
    setPos({ x: top, y: left });
  };

  useEffect(() => {
    if (date !== "") {
      setOriginDate(date);
    } else {
      setOriginDate(moment().format("YYYYMMDD"));
    }
  }, [date]);

  useEffect(() => {
    if (!calOpen) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const sp = getScrollParent(anchor);
    const onScroll = () => {
      setCalOpen(false);
    };

    const onDocPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t)) return;
      if (popupRef.current?.contains(t)) return;
      setCalOpen(false);
    };

    // 캡처 단계로 등록(중요)
    document.addEventListener("pointerdown", onDocPointerDown, true);
    if (sp && sp !== window) {
      (sp as HTMLElement).addEventListener("scroll", onScroll, {
        passive: true,
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", calc);
    return () => {
      setMonOpen(type === "DAY" ? "DAY" : "MONTH");
      if (date !== "") {
        setOriginDate(date);
      } else {
        setOriginDate(moment().format("YYYYMMDD"));
      }
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      if (sp && sp !== window) {
        (sp as HTMLElement).removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", calc);
    };
  }, [calOpen]);

  useEffect(() => {
    setCalData(
      getMonthDays(moment(originDate).year(), moment(originDate).month()),
    );
  }, [originDate]);

  useEffect(() => {
    if (monOpen === "MONTH") {
      setYearData(getYear(moment(originDate).year()));
    } else if (monOpen === "YEAR") {
      if (yearChange) {
        setYearData(getYear(moment(originDate).year()));

        setYearChange(false);
      }
    }
  }, [monOpen, originDate, yearChange]);

  const getYear = (year: number): number[] => {
    const ret: number[] = [];

    const tmp = Array.from({ length: 4 }, (_, i) => i + 1);

    for (let i = tmp.length - 1; i >= 0; i--) {
      ret.push(year - tmp[i]);
    }

    ret.push(year);

    tmp.forEach((item) => ret.push(year + item));

    return ret;
  };

  const getMonthDays = (year: number, month: number): DayType[] => {
    const out: DayType[] = [];
    const first = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    if (first.getDay() !== 0) {
      const prevLast = new Date(year, month, 0).getDate();
      for (let i = first.getDay() - 1; i >= 0; i--) {
        out.push({
          day: prevLast - i,
          type: first.getDay() - i,
          visible: false,
        });
      }
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const prevLast = new Date(year, month, d).getDay();
      out.push({ day: d, type: prevLast, visible: true });
    }

    if (lastDay.getDay() !== 6) {
      const tail = 6 - lastDay.getDay(); // 남은 칸 수
      for (let t = 1; t <= tail; t++) {
        const dt = new Date(year, month + 1, t);
        out.push({
          day: t, // 다음 달 1일부터
          type: dt.getDay(),
          visible: false,
        });
      }
    }

    return out;
  };

  const dayClick = (obj: DayType) => {
    if (obj.visible) {
      changeDate(
        moment(originDate, "YYYYMMDD").date(obj.day).format("YYYYMMDD"),
      );
    } else {
      if (obj.day < 15) {
        changeDate(
          moment(originDate, "YYYYMMDD")
            .add(1, "month")
            .date(obj.day)
            .format("YYYYMMDD"),
        );
      } else {
        changeDate(
          moment(originDate, "YYYYMMDD")
            .subtract(1, "month")
            .date(obj.day)
            .format("YYYYMMDD"),
        );
      }
    }
    setCalOpen(false);
  };

  const monthClick = useCallback(
    (v: number) => {
      changeDate(
        moment(originDate, "YYYYMM")
          .month(v - 1)
          .format("YYYYMM"),
      );
      setCalOpen(false);
    },
    [originDate],
  );

  return (
    <div className="relative size-full z-[200]" ref={anchorRef}>
      <div className="flex h-full items-center justify-center">
        <input
          id="date"
          placeholder=" "
          className="peer w-full h-full text-center bg-white rounded-md border border-gray-300 py-1
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
          readOnly
          value={
            type === "DAY"
              ? (date && moment(date).format("YYYY - MM - DD")) || ""
              : (date && moment(date).format("YYYY - MM")) || ""
          }
          onClick={(e) => {
            e.stopPropagation();
            setCalOpen((prev) => {
              const next = !prev;

              return next;
            });
          }}
        />
      </div>
      {createPortal(
        <div
          ref={popupRef}
          className={`
      fixed w-[280px] h-[290px] bg-white
      border rounded-md border-[#ECECEC] shadow-md z-[9999]
      transition-all duration-200
      ${
        calOpen
          ? "opacity-100 scale-y-100"
          : "opacity-0 scale-y-0 pointer-events-none"
      }
      ${dropDir === "top" ? "origin-bottom" : "origin-top"}
      ${dropAlign === "right" ? "right-0 left-auto" : "left-0 right-auto"}
    `}
          style={{
            top: pos.x,
            left: pos.y,
          }}>
          {/* 헤더 */}
          <div className="grid grid-cols-5 h-[35px] bg-[#1F1F2B] items-center justify-items-center py-1">
            <div
              className="cursor-pointer rounded-full hover:bg-[#FFFFFF20] p-1"
              onClick={() => {
                if (monOpen === "YEAR") {
                  setOriginDate((prev) =>
                    moment(prev).subtract(4, "year").format("YYYYMMDD"),
                  );
                  setYearChange(true);
                } else {
                  setOriginDate((prev) =>
                    moment(prev).subtract(1, "month").format("YYYYMMDD"),
                  );
                }
              }}>
              <IoIosArrowBack className="text-[#FFFFFF] font-semibold iconSize" />
            </div>
            <div
              className="px-3 rounded-xl h-full cursor-pointer hover:bg-[#FFFFFF20] text-center col-span-3"
              onClick={() =>
                setMonOpen(
                  (prev) =>
                    monOrder[(monOrder.indexOf(prev) + 1) % monOrder.length],
                )
              }>
              <div className="flex items-center text-[#FFFFFF] h-full contTitle font-semibold">
                {moment(originDate).format("YYYY년 MM월")}
              </div>
            </div>
            <div
              className="cursor-pointer rounded-full hover:bg-[#FFFFFF20] p-1"
              onClick={() => {
                if (monOpen === "YEAR") {
                  setOriginDate((prev) =>
                    moment(prev).add(4, "year").format("YYYYMMDD"),
                  );
                  setYearChange(true);
                } else {
                  setOriginDate((prev) =>
                    moment(prev).add(1, "month").format("YYYYMMDD"),
                  );
                }
              }}>
              <IoIosArrowForward className="text-[#FFFFFF] font-semibold iconSize" />
            </div>
          </div>
          {/* 바디 */}
          <div className="relative w-full h-[255px] overflow-hidden">
            {/* 일/주 캘린더 */}
            <div
              className={`
      absolute w-full origin-top
      transition-all duration-500 ease-in-out
      ${
        monOpen === "DAY"
          ? "scale-100 opacity-100 visible pointer-events-auto"
          : "scale-0 opacity-0 invisible pointer-events-none"
      }
    `}>
              <div className="grid grid-cols-7 min-h-[35px] items-center justify-items-center py-2">
                <div className={WEEK_HOLY}>일</div>
                <div className={WEEK_NOMAL}>월</div>
                <div className={WEEK_NOMAL}>화</div>
                <div className={WEEK_NOMAL}>수</div>
                <div className={WEEK_NOMAL}>목</div>
                <div className={WEEK_NOMAL}>금</div>
                <div className={WEEK_NOMAL}>토</div>
              </div>

              <div className="grid grid-cols-7 items-center justify-items-center">
                {calData.map((item, index) => (
                  <div
                    key={index} // ← key 꼭 추가
                    className={`${
                      !item.visible
                        ? WEEK_NO
                        : item.type === 0
                          ? WEEK_HOLY
                          : WEEK_NOMAL
                    } w-[75%] min-h-[35px]`}>
                    <div
                      className={`cursor-pointer rounded-full text-center p-1 hover:bg-[#F0F0F0] ${
                        moment(originDate).date() === item.day && item.visible
                          ? "bg-[#C5D3E8]"
                          : ""
                      }`}
                      onClick={() => dayClick(item)}>
                      {item.day}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 월 */}
            <div
              className={`
              absolute w-full origin-top
              transition-all duration-500 ease-in-out bg-[#FFFFFF]
              ${
                monOpen === "MONTH"
                  ? "scale-100 opacity-100 visible pointer-events-auto"
                  : "scale-0 opacity-0 invisible pointer-events-none"
              }
            `}>
              <div className="grid grid-cols-4 items-center justify-items-center">
                {monData.map((item) => (
                  <div
                    key={item}
                    className={`w-full h-[85px] contTitle font-bold flex items-center justify-center rounded-md cursor-pointer hover:bg-[#F0F0F0] ${
                      moment(originDate).month() + 1 === item
                        ? "bg-[#C5D3E8]"
                        : ""
                    }`}
                    onClick={() => {
                      if (type === "MONTH") {
                        monthClick(item);
                      } else {
                        setOriginDate((prev) =>
                          moment(prev)
                            .month(item - 1)
                            .format("YYYYMMDD"),
                        );
                        setMonOpen(
                          (prev) =>
                            monOrder[
                              (monOrder.indexOf(prev) - 1 + monOrder.length) %
                                monOrder.length
                            ],
                        );
                      }
                    }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            {/* 년 */}
            <div
              className={`
              absolute w-full origin-top
              transition-all duration-500 ease-in-out bg-[#FFFFFF]
              ${
                monOpen === "YEAR"
                  ? "scale-100 opacity-100 visible pointer-events-auto"
                  : "scale-0 opacity-0 invisible pointer-events-none"
              }
            `}>
              <div className="grid grid-cols-3 items-center justify-items-center">
                {yearData.map((item, i) => {
                  return (
                    <div
                      key={i}
                      className={`w-full h-[85px] contTitle font-bold flex items-center justify-center rounded-xl cursor-pointer hover:bg-[#F0F0F0] ${
                        moment(originDate).year() === item ? "bg-[#C5D3E8]" : ""
                      }`}
                      onClick={() => {
                        setOriginDate((prev) =>
                          moment(prev).year(item).format("YYYYMMDD"),
                        );
                        setMonOpen(
                          (prev) =>
                            monOrder[
                              (monOrder.indexOf(prev) - 1 + monOrder.length) %
                                monOrder.length
                            ],
                        );
                      }}>
                      {item.toString()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export function ToggleBtn({ array, onClick, idx = 0 }: ToggleBtnType) {
  return (
    <div className="flex w-full h-full items-center justify-center">
      {array.map((item, index) => (
        <div
          key={item.key}
          className={`flex items-center text-nowrap cursor-pointer justify-center h-full w-full border ${
            index === idx
              ? "font-bold border-blue-500 text-blue-500 bg-blue-50"
              : "border-gray-300 text-gray-700 bg-white"
          } ${
            index === 0
              ? "rounded-l-sm"
              : index === array.length - 1
                ? "rounded-r-sm"
                : ""
          } text-center px-[0.5rem] py-[0.3rem]`}
          onClick={() => onClick(item.key)}>
          {item.value}
        </div>
      ))}
    </div>
  );
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[90vw] max-h-[90vh]",
};

export function ModalCust({
  open,
  onClose,
  size = "xl",
  children,
  childrenTitle,
  title,
  selectNod = 0,
  setSelectNod,
  backColor = "#FFFFFF",
  deviceType = "PC",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const pages = useMemo(() => React.Children.toArray(children), [children]);
  const prevIndexRef = useRef<number>(selectNod);
  const [animateIn, setAnimateIn] = useState(false);
  const [headerAction, setHeaderAction] = useState<{
    type: string;
    pageIndex?: number;
  } | null>(null);

  useEffect(() => {
    // 첫 페이지는 애니메이션 없음, 그 외는 오른쪽→왼쪽 슬라이드 인
    if (selectNod) {
      setAnimateIn(selectNod >= 0 && selectNod !== prevIndexRef.current);
      prevIndexRef.current = selectNod;
    }
  }, [selectNod]);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 첫 포커스
    setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      lastFocused.current?.focus?.();
    };
  }, [open]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // 간단 포커스 트랩
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);
  useEffect(() => {
    if (headerAction == null) return;

    // 다음 tick에 초기화 (렌더 완료 후)
    const id = setTimeout(() => {
      setHeaderAction(null);
    }, 0);

    return () => clearTimeout(id);
  }, [headerAction]);

  if (!open) return null;

  const overlayClick = (e: React.MouseEvent) => {
    if (panelRef.current?.contains(e.target as Node)) return;
    onClose();
  };

  // children에 headerAction, setHeaderAction를 주입하는 helper
  const enhanceChild = (node: ReactNode): ReactNode => {
    if (!React.isValidElement(node)) return node;

    return React.cloneElement(node as ReactElement<any>, {
      headerAction,
    });
  };

  // 실제로 렌더할 페이지 선택
  let renderedPage: ReactNode;
  if (selectNod !== undefined) {
    const current = pages[selectNod];
    renderedPage = enhanceChild(current);
  } else {
    // selectNod 없으면: children이 하나면 그 하나에만 주입, 여러 개면 각각
    if (pages.length === 1) {
      renderedPage = enhanceChild(pages[0]);
    } else {
      renderedPage = pages.map((p, idx) => (
        <React.Fragment key={idx}>{enhanceChild(p)}</React.Fragment>
      ));
    }
  }

  const nodeButtons =
    selectNod !== undefined && childrenTitle
      ? (childrenTitle[selectNod] ?? [])
      : [];

  return createPortal(
    <div
      className="fixed top-[7%] inset-0 z-[888] flex items-center justify-center"
      onMouseDown={overlayClick}
      role="dialog"
      aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      {/* 패널 */}
      <div
        className={`relative w-full ${sizeClass[size]} mx-4 rounded-xl bg-white shadow-xl
                    animate-[fadeIn_.50s_ease]`}
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ backgroundColor: backColor }}>
        {/* 헤더 */}
        <div
          className={`flex items-center justify-between px-4 ${deviceType === "PC" ? "py-3" : "py-1"} bg-gray-300 rounded-t-lg`}>
          <h2 className="flex items-center pl-2 iconSize font-bold">
            {selectNod !== undefined && selectNod !== 0 && (
              <div
                className="rounded-full flex items-center justify-center size-8 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer mr-2"
                aria-label="Close"
                onClick={() => setSelectNod && setSelectNod(selectNod - 1)}>
                <IoIosArrowBack className="text-xl font-bold" />
              </div>
            )}
            {title}
          </h2>
          <div className="flex items-center gap-3">
            {nodeButtons.map((item, idx) => {
              if (!React.isValidElement(item)) return item;
              if (item.props.actionType !== "PAGE") {
                const el = item as React.ReactElement<BtnType>;
                const originalOnClick = el.props.onClick;
                const actionType = el.props.txt;

                return React.cloneElement(el, {
                  key: el.key ?? idx,

                  onClick: () => {
                    // 원래 onClick 실행
                    originalOnClick?.();

                    // headerAction으로 children에 알림
                    setHeaderAction({
                      type: actionType,
                      pageIndex: selectNod,
                    });
                  },
                });
              }
            })}

            <div
              className="rounded-full flex items-center justify-center size-8 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer"
              aria-label="Close"
              onClick={onClose}>
              <IoMdClose className="text-xl font-bold" />
            </div>
          </div>
        </div>
        {/* 바디 */}
        <div>
          <div className="relative">
            {pages.map((p, idx) => {
              const isActive =
                selectNod === undefined ? true : idx === selectNod;

              return (
                <div
                  key={idx}
                  style={{
                    display: isActive ? "block" : "none",
                  }}
                  className={
                    isActive && animateIn ? "animate-[r2l_.50s_ease-out]" : ""
                  }>
                  {enhanceChild(p)}
                </div>
              );
            })}
            {/* {selectNod !== undefined ? (
              <div
                key={selectNod}
                className={`
                ${animateIn ? "animate-[r2l_.50s_ease-out]" : ""}
              `}>
                {renderedPage}
              </div>
            ) : (
              renderedPage
            )} */}
          </div>
        </div>
      </div>
      {/* 슬라이드 인 키프레임 정의 (한 번만 선언되면 됨) */}
      <style>{`
        @keyframes r2l {
          0%   { transform: translateX(24px); opacity: 0 }
          100% { transform: translateX(0);    opacity: 1 }
        }
      `}</style>
    </div>,
    document.body,
  );
}

export function Captcha({ outCode }: { outCode: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState(() => randomCode(5));

  function randomCode(length = 5) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const draw = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 배경색
    ctx.fillStyle = "#f9f9f9";
    ctx.fillRect(0, 0, width, height);

    // 노이즈 라인
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.15 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
        Math.random() * width,
        Math.random() * height,
      );
      ctx.stroke();
    }

    // 문자
    const gap = width / (text.length + 1);
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const fontSize = 28 + Math.floor(Math.random() * 6);
      ctx.save();
      ctx.font = `bold ${fontSize}px serif`;
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 30%)`;

      const x = gap * (i + 1);
      const y = height / 2 + (Math.random() * 10 - 5);
      const rot = (Math.random() * 30 - 15) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillText(ch, -ctx.measureText(ch).width / 2, fontSize / 2 - 8);
      ctx.restore();
    }

    // 점 노이즈
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }

    // 테두리
    ctx.strokeStyle = "#d1d5db";
    ctx.strokeRect(0, 0, width, height);
  }, []);

  useEffect(() => {
    outCode(code);
    draw(code);
  }, [code, draw]);

  const refresh = () => {
    setCode(randomCode(5));
  };
  return (
    <div className="flex w-full items-center gap-2">
      <canvas
        ref={canvasRef}
        width={160}
        height={45}
        className="border rounded-md bg-white anyInput"
      />
      <div className="rounded-full cursor-pointer hover:bg-gray-200 p-1 iconSize">
        <IoMdRefresh onClick={() => refresh()} />
      </div>
    </div>
  );
}

export function Divider({ align }: { align: "Horizen" | "Verticle" }) {
  return (
    <div
      className={`${
        align === "Horizen"
          ? "border border-gray-300 rounded-md my-[0.5%]"
          : "w-[2px] min-h-max border border-gray-300 rounded-md mx-[0.5%]"
      }`}>
      {align === "Verticle" && <span>&nbsp;</span>}
    </div>
  );
}
