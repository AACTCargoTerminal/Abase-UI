import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../slices/store";
import { useState } from "react";
import { IoIosArrowDown, IoIosArrowForward } from "react-icons/io";
import { selectNav } from "../slices/user";

const InfraSide = () => {
  const menu = useSelector((state: RootState) => state.user.menu);
  const dispatch = useDispatch();
  const [mainOpen, setMainOpen] = useState(-1);
  const [subOpen, setSubOpen] = useState(-1);
  return (
    <div
      className="fixed top-[7%] z-[110] left-0 h-[calc(100vh-7vh)] flex bg-[#0b0c10] shadow-md border-gray-500"
      onMouseLeave={(e) => {
        e.preventDefault();
        setMainOpen(-1);
      }}>
      <div className="w-[10vw]">
        {menu.map((v, i) => {
          if (Object.keys(v).length > 0) {
            return (
              <div
                key={i}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setMainOpen(i);
                }}
                className="text-[#e5e7eb] font-bold h-[5vh] flex items-center cursor-pointer border-b-1 border-[#e5e7eb] justify-between px-[5%] hover:bg-[#3F3F46]">
                {v["MENU_NAME"]}
                <IoIosArrowForward className="h-full w-[1vw] font-bold text-[#e5e7eb]" />
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
      <div
        className={`bg-[#18181B] duration-500 ${mainOpen !== -1 ? "w-[10vw]" : "w-0"}`}
        onMouseLeave={(e) => {
          e.preventDefault();
          setSubOpen(-1);
        }}>
        {menu?.[mainOpen]?.["children"] &&
          Array.isArray(menu[mainOpen]["children"]) &&
          menu[mainOpen]["children"].map((v, i) => {
            if (Object.keys(v).length > 0) {
              return (
                <div key={i}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        Array.isArray(v?.["children"]) &&
                        v["children"].length === 0
                      ) {
                        //라우트
                        dispatch(selectNav(v));
                      } else {
                        setSubOpen(i);
                      }
                    }}
                    className="text-[#e5e7eb] text-nowrap font-bold h-[5vh] flex items-center cursor-pointer border-b-1 border-[#e5e7eb] justify-between px-[5%] hover:bg-[#3F3F46]">
                    {v["MENU_NAME"]}
                    {Array.isArray(v?.["children"]) &&
                    v["children"].length === 0 ? null : (
                      <IoIosArrowDown className="h-full w-[1vw] font-bold text-[#e5e7eb]" />
                    )}
                  </div>
                  {i === subOpen &&
                    Array.isArray(v?.["children"]) &&
                    v["children"].map((vr, ir) => {
                      return (
                        <div
                          key={ir}
                          onClick={(e) => {
                            e.stopPropagation();
                            //라우트
                            dispatch(selectNav(vr));
                          }}
                          className="text-[#e5e7eb] text-nowrap font-bold h-[5vh] flex items-center cursor-pointer border-b-1 border-[#e5e7eb] justify-between px-[5%] hover:bg-[#3F3F46]">
                          {vr["MENU_NAME"]}
                        </div>
                      );
                    })}
                </div>
              );
            } else {
              return null;
            }
          })}
      </div>
    </div>
  );
};

export default InfraSide;
