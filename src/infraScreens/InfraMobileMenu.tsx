import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../slices/store";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { GoDotFill } from "react-icons/go";
import { MdAdd, MdRemove } from "react-icons/md";
import { selectNav } from "../slices/user";
import { getApi } from "../Util/Util";
import { useNavigate } from "react-router-dom";

const InfraMobileMenu = ({
  flag,
  onClick,
}: {
  flag: boolean;
  onClick: () => void;
}) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (!flag) {
      setSelectMain(-1);
      setSelectSub(-1);
    }
  }, [flag]);

  async function logout() {
    const res = await getApi({
      baseUrl: "AUTH",
      method: "GET",
      url: `/user/logout`,
      pgmId: "",
    });

    if (res.ok) {
      navigate("/Infra");
    }
  }
  const menu = useSelector((s: RootState) => s.user.menu);
  const [selectMain, setSelectMain] = useState(-1);
  const [selectSub, setSelectSub] = useState(-1);
  const dispatch = useDispatch();
  return (
    <div className="w-[100vw] flex bg-[#0b0c10] shadow-md border-gray-500">
      <div>
        {menu.map((v, i) => {
          if (Object.keys(v).length > 0) {
            return (
              <React.Fragment key={i}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectMain((prev) => (prev === i ? -1 : i));
                    setSelectSub(-1);
                  }}
                  className="w-[100vw] text-[#e5e7eb] font-bold h-[4vh] flex items-center cursor-pointer border-b-1 border-[#e5e7eb] justify-between px-[5%] hover:bg-[#3F3F46]">
                  {v["MENU_NAME"]}
                  <div className="relative w-[3vw] h-full flex items-center justify-center">
                    <IoIosArrowUp
                      className={`absolute h-full w-[3vw] font-bold transition-all duration-300 ${
                        selectMain === i
                          ? "rotate-90 opacity-0"
                          : "rotate-0 opacity-100"
                      }`}
                    />
                    <IoIosArrowDown
                      className={`absolute h-full w-[3vw] font-bold transition-all duration-300 ${
                        selectMain === i
                          ? "rotate-0 opacity-100"
                          : "rotate-90 opacity-0"
                      }`}
                    />
                  </div>
                </div>
                <div
                  className={`w-[100vw] bg-[#18181B] origin-top overflow-hidden transition-all duration-500 ${selectMain === i ? "h-fit opacity-100" : "h-0 opacity-0"}`}>
                  {Array.isArray(v["children"]) &&
                    v["children"].map((sv, j) => {
                      if (Object.keys(sv).length > 0) {
                        return (
                          <React.Fragment key={j}>
                            {" "}
                            <div
                              className="w-[100vw] gap-3 text-[#e5e7eb] font-bold h-[4vh] flex items-center cursor-pointer border-b-1 border-[#e5e7eb] px-[5%] hover:bg-[#3F3F46]"
                              onClick={() => {
                                if (
                                  Array.isArray(sv?.["children"]) &&
                                  sv["children"].length > 0
                                ) {
                                  setSelectSub((prev) => (prev === j ? -1 : j));
                                } else {
                                  dispatch(selectNav(sv));
                                  onClick();
                                }
                              }}>
                              {Array.isArray(sv?.["children"]) &&
                              sv["children"].length > 0 ? (
                                <div className="relative w-[3vw] h-full flex items-center justify-center">
                                  <MdAdd
                                    className={`absolute h-full w-[3vw] font-bold transition-all duration-300 ${
                                      selectSub === j
                                        ? "rotate-45 opacity-0"
                                        : "rotate-0 opacity-100"
                                    }`}
                                  />
                                  <MdRemove
                                    className={`absolute h-full w-[3vw] font-bold transition-all duration-300 ${
                                      selectSub === j
                                        ? "rotate-0 opacity-100"
                                        : "rotate-45 opacity-0"
                                    }`}
                                  />
                                </div>
                              ) : (
                                <MdRemove className="h-full w-[3vw] font-bold" />
                              )}
                              {sv["MENU_NAME"]}
                            </div>
                            <div
                              className={`w-[100vw] bg-[#18181B] origin-top overflow-hidden transition-all duration-500 ${selectSub === j ? "h-fit opacity-100" : "h-0 opacity-0"}`}>
                              {Array.isArray(sv?.["children"]) &&
                                sv["children"].map((lv, k) => {
                                  if (Object.keys(lv).length > 0) {
                                    return (
                                      <div
                                        onClick={() => {
                                          dispatch(selectNav(lv));
                                          onClick();
                                        }}
                                        className="w-[100vw] gap-3 text-[#e5e7eb] font-bold h-[4vh] flex items-center cursor-pointer border-b-1 border-[#e5e7eb] px-[5%] hover:bg-[#3F3F46]"
                                        key={k}>
                                        <div className="h-full w-[3vw] font-bold" />
                                        <GoDotFill className="h-full w-[3vw] font-bold" />
                                        {lv["MENU_NAME"]}
                                      </div>
                                    );
                                  }
                                })}
                            </div>
                          </React.Fragment>
                        );
                      }
                      return null;
                    })}
                </div>
              </React.Fragment>
            );
          } else {
            return null;
          }
        })}
        <div
          onClick={() => logout()}
          className="w-[100vw] text-[#e5e7eb] font-bold h-[4vh] flex items-center cursor-pointer border-b-1 border-[#e5e7eb] justify-between px-[5%] hover:bg-[#3F3F46]">
          Logout
        </div>
      </div>
    </div>
  );
};

export default InfraMobileMenu;
