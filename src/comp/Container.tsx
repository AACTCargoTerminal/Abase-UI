import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { InputType } from "../Util/Type";
import { TbCheckbox } from "react-icons/tb";
import { createPortal } from "react-dom";

export function CommonContainer({
  title,
  bgTitle = "#E0E0E0",
  bgBody,
  width,
  children,
  childrenTitle,
  titleAlign = "NONE",
  check,
  deviceType = "PC",
}: {
  title?: string;
  bgTitle?: string;
  bgBody?: string;
  width?: string;
  children?: React.ReactNode;
  childrenTitle?: React.ReactNode;
  titleAlign?: "NONE" | "END";
  check?: boolean;
  deviceType?: "PC" | "MOBILE";
}) {
  return (
    <div
      className={`flex flex-col`}
      style={{ width: width || "100%", height: "100%" }}>
      {(childrenTitle || title) && (
        <div
          className={`px-[1rem] py-[0.5rem] border border-gray-400 flex ${deviceType === "MOBILE" ? (childrenTitle ? "flex-col h-[4.5rem]" : "h-[2rem] items-center") : "h-[3rem] items-center"} rounded-t-md gap-2 ${
            titleAlign === "NONE" ? "" : "justify-between"
          }`}
          style={{ backgroundColor: bgTitle || "transparent" }}>
          {title && (
            <div className="flex items-center gap-2">
              <div className="iconSize text-[#009944]">
                <TbCheckbox />
              </div>
              <span className="font-bold contTitle text-nowrap tracking-[0.05rem]">
                {title}
              </span>
              {check && (
                <div className="h-full flex items-start">
                  <span className={`text-red-500 text-nowrap font-bold`}>
                    *
                  </span>
                </div>
              )}
            </div>
          )}

          {childrenTitle && childrenTitle}
        </div>
      )}

      <div
        className={`py-[1rem] px-[1rem] shadow shadow-[#A0A0A0] border-gray-400 
          ${title ? "border-x border-b" : "border "}`}
        style={{ backgroundColor: bgBody || "transparent" }}>
        {children && children}
      </div>
    </div>
  );
}

export function CommonTab({
  tabs,
  active,
  setActive,
  children,
  height,
  width,
}: {
  tabs: string[];
  active: number;
  setActive: (v: number) => void;
  children?: React.ReactNode;
  width?: string;
  height?: string;
}) {
  const pages = useMemo(() => React.Children.toArray(children), [children]);

  return (
    <div style={{ width: width || "", height: height || "" }}>
      {/* 탭 라인 영역 */}
      <div className="border-b-3 border-gray-300">
        <div className="flex gap-5 ml-2">
          {tabs.map((tab, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              className={[
                "relative py-[0.35rem] px-[0.7rem] hover:bg-gray-200 cursor-pointer tracking-wide",
                active === i ? "text-blue-600 font-bold" : "text-gray-700",
              ]
                .filter(Boolean)
                .join(" ")}>
              {tab}
              {/* 탭 밑줄 */}
              {active === i && (
                <span className="absolute left-0 -bottom-[0.2rem] h-[0.22rem] w-full bg-[#8EC5FF] rounded-md" />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* 🔥 여기 핵심 */}
      <div className="p-2">
        {pages[active] &&
          React.cloneElement(pages[active] as React.ReactElement)}
      </div>
    </div>
  );
}

export function SubDiv({
  open,
  children,
  onClose,
}: {
  open: boolean;
  children: React.ReactElement;
  onClose?: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  // 열릴 때 위치 보정 (화면 밖으로 나가지 않게)
  useLayoutEffect(() => {
    if (!open) return;
    const el = menuRef.current;
    if (!el) return;

    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const rect = el.getBoundingClientRect();

    let left = 0;
    let top = 0;

    // 오른쪽/아래로 튀면 flip
    if (left + rect.width + margin > vw)
      left = Math.max(margin, vw - rect.width - margin);
    if (top + rect.height + margin > vh)
      top = Math.max(margin, vh - rect.height - margin);

    // 왼쪽/위로도 최소 마진 유지
    left = Math.max(margin, left);
    top = Math.max(margin, top);

    setPos({ left, top });
  }, [open]);

  // 닫기: 밖 클릭 / ESC / 스크롤 / 리사이즈
  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: any) => {
      const el = menuRef.current;
      if (!el) return;
      if (!el.contains(e.target)) onClose?.();
    };

    const onScroll = () => onClose?.();
    const onResize = () => onClose?.();

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
      {children}
    </div>,
    document.body,
  );
}
