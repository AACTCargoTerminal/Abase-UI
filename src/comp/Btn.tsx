import React, { useCallback, useEffect, useRef, useState } from "react";
import type { BtnFunType, BtnType, MenuBtnType } from "../Util/Type";
import { createPortal } from "react-dom";

export function Btn({
  onClick,
  txt,
  width = "100%",
  type,
  tooltip,
  deviceType = "PC",
}: BtnType) {
  const lockedRef = useRef(false);
  function setColor(type: BtnFunType): string {
    switch (type) {
      case "CLOSE":
        return "#cccccc";
      case "SAVE":
        return "#336699";
      case "DELETE":
        return "#FF0000";
      case "SEARCH":
        return "#669933";
      case "PRINT":
        return "#99cc66";
      case "EXCEL":
        return "#666699";
      case "NONE":
      default:
        return "#66cc99";
    }
  }

  const handleClick = useCallback(() => {
    if (lockedRef.current) return; // 더블클릭/연타 차단
    lockedRef.current = true;

    try {
      onClick?.();
    } finally {
      // 너무 길면 UX가 답답하니 보통 300~800ms 정도
      window.setTimeout(() => {
        lockedRef.current = false;
      }, 500);
    }
  }, [onClick]);

  return (
    <div className="flex items-center justify-center cursor-pointer btnHeight">
      {deviceType === "PC" ? (
        <div
          title={tooltip}
          className={`z-5 w-fit h-[100%] flex p-[0.2rem] justify-center items-center rounded-md bg-[var(--bg)]`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={
            {
              "--bg": type && setColor(type),
            } as React.CSSProperties
          }>
          <div
            className="h-full w-full text-white border-[0.15rem] border-[#FFFFFFEE] rounded-md flex items-center justify-center bg-[var(--bg)] hover:text-gray-700 hover:bg-[var(--hov-bg)]"
            style={
              {
                "--bg": type && setColor(type),
                "--hov-bg": "#FFFFFF80",
              } as React.CSSProperties
            }>
            <span
              className="tracking-[0.1rem] px-[0.5rem] text-nowrap"
              style={{ userSelect: "none" }}>
              {txt}
            </span>
          </div>
        </div>
      ) : (
        <div
          title={tooltip}
          className={`z-5 w-fit h-[100%] flex justify-center items-center rounded-md bg-[var(--bg)] duration-100 active:scale-90`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          style={
            {
              "--bg": type && setColor(type),
            } as React.CSSProperties
          }>
          <span
            className="tracking-[0.1rem] px-[0.3rem] text-[8px] text-nowrap"
            style={{ userSelect: "none" }}>
            {txt}
          </span>
        </div>
      )}
    </div>
  );
}

export function MobileBtn({
  onClick,
  txt,
  width = "100%",
  type,
  tooltip,
}: BtnType) {
  const lockedRef = useRef(false);
  function setColor(type: BtnFunType): string {
    switch (type) {
      case "CLOSE":
        return "#cccccc";
      case "SAVE":
        return "#336699";
      case "DELETE":
        return "#FF0000";
      case "SEARCH":
        return "#669933";
      case "PRINT":
        return "#99cc66";
      case "EXCEL":
        return "#666699";
      case "NONE":
      default:
        return "#66cc99";
    }
  }

  const handleClick = useCallback(() => {
    if (lockedRef.current) return; // 더블클릭/연타 차단
    lockedRef.current = true;

    try {
      onClick?.();
    } finally {
      // 너무 길면 UX가 답답하니 보통 300~800ms 정도
      window.setTimeout(() => {
        lockedRef.current = false;
      }, 500);
    }
  }, [onClick]);

  return (
    <div className="flex items-center justify-center cursor-pointer btnHeight">
      <div
        title={tooltip}
        className={`z-5 w-fit h-[100%] flex p-[0.2rem] justify-center items-center rounded-md bg-[var(--bg)]`}
        onClick={handleClick}
        style={
          {
            "--bg": type && setColor(type),
          } as React.CSSProperties
        }>
        <div
          className="h-full w-full text-white border-[0.15rem] border-[#FFFFFFEE] rounded-md flex items-center justify-center bg-[var(--bg)] hover:text-gray-700 hover:bg-[var(--hov-bg)]"
          style={
            {
              "--bg": type && setColor(type),
              "--hov-bg": "#FFFFFF80",
            } as React.CSSProperties
          }>
          <span
            className="tracking-[0.1rem] px-[0.5rem]"
            style={{ userSelect: "none" }}>
            {txt}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MenuBtn({ data, onClick, txt, type }: MenuBtnType) {
  const [open, setOpen] = useState(false);
  const mainRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDocPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (mainRef.current?.contains(t)) return;
      setOpen(false);
    };

    // 캡처 단계로 등록(중요)
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open]);
  return (
    <div ref={mainRef} className="relative w-fit">
      <Btn type={type} txt={txt} onClick={() => setOpen((prev) => !prev)} />
      <div
        className={`absolute flex w-[200%] mt-[1%] flex-col bg-white border border-gray-300 rounded-md overflow-hidden z-999 transition duration-200 transform origin-top ${
          open
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-50 pointer-events-none"
        }`}>
        {data.map((item) => (
          <span
            key={item.KEY}
            onClick={() => {
              setOpen(false);
              onClick?.(item.KEY);
            }}
            className="flex items-center justify-center text-nowrap h-[2rem] hover:bg-gray-200 cursor-pointer">
            {item.VALUE}
          </span>
        ))}
      </div>
    </div>
  );
}
