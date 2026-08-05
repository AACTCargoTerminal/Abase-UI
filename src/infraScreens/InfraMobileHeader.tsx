import { IoIosMenu } from "react-icons/io";
import logo from "../assets/images/header_logo5.png";
import { shallowEqual, useSelector } from "react-redux";
import type { RootState } from "../slices/store";
import { useState } from "react";
import { createPortal } from "react-dom";
import InfraMobileMenu from "./InfraMobileMenu";
const InfraMobileHeader = () => {
  const user = useSelector(
    (s: RootState) => ({
      id: s.user.userInfo?.userId,
      name: s.user.userInfo?.userName,
      terminal:
        s.user.userInfo?.relArray.find((rv) => rv["CLASS_CODE"] === "TRMCD")?.[
          "CODE_NAME"
        ] || "ALL Terminal",
      deptName:
        s.user.userInfo?.relArray.find((rv) => rv["CLASS_CODE"] === "HRPAT")?.[
          "CODE_NAME"
        ] || "",
    }),
    shallowEqual,
  );

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  return (
    <div>
      <header className="fixed z-[999] top-0 left-0 flex justify-between items-center h-[6.5%] w-screen bg-[#1E1F2A] px-4 border-b border-gray-300 shadow-md">
        <div className="flex items-center gap-3">
          <IoIosMenu
            className="text-white size-[1.8rem] active:text-blue-300 active:scale-[90%]"
            onClick={() => {
              setMenuOpen((prev) => !prev);
            }}
          />

          {/* 로고 */}
          <a
            href="http://service.aact.co.kr"
            target="_aact_top"
            className="p-1 hover:bg-gray-700 rounded-md cursor-pointer w-[3.5rem]">
            <img src={logo} />
          </a>
        </div>
        {/* 터미널 */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-white text-sm font-bold flex items-center justify-center p-1 rounded-full">
            {user.terminal}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* 사용자정보 */}
          <div className="flex flex-col gap-1 items-end">
            <span className="text-white font-bold">{user.id || ""}</span>
            <span className="text-white">
              {user.deptName || ""} : {user.name || ""}
            </span>
          </div>
        </div>
      </header>
      {createPortal(
        <div
          className={`fixed z-[999] w-full top-[7%] duration-300 border-t-2 border-gray-400 origin-top ${menuOpen ? "scale-y-100" : "scale-y-0"}`}>
          <InfraMobileMenu flag={menuOpen} onClick={() => setMenuOpen(false)} />
        </div>,
        document.body,
      )}
    </div>
  );
};

export default InfraMobileHeader;
