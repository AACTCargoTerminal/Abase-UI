import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import logo from "../../assets/images/header_logo5.png";
import Alert from "./Alert";
import { MdOutlineInfo } from "react-icons/md";
import { FaRegFloppyDisk } from "react-icons/fa6";
import { IoLogOutOutline } from "react-icons/io5";
import type { RouteType, UserInfoType } from "../../Util/Type";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import {
  changeServer,
  deleteNav,
  modalOpen,
  pushMenu,
  pushUserInfo,
  selectNav,
} from "../../slices/user";
import type { RootState } from "../../slices/store";
import { IoIosArrowDown, IoIosArrowUp, IoMdClose } from "react-icons/io";
import { getApi } from "../../Util/Util";
import { useNavigate } from "react-router-dom";

type Color = { bg: string; text: string };
function getColor(num: number): Color {
  switch (num) {
    case 1:
      return { bg: "#1E90FF", text: "#FFFFFF" }; // Dodger Blue
    case 2:
      return { bg: "#00796B", text: "#FFFFFF" }; // Teal
    case 3:
      return { bg: "#4CAF50", text: "#FFFFFF" }; // Green
    case 4:
      return { bg: "#FFC107", text: "#1B1B1B" }; // Mustard
    case 5:
      return { bg: "#FF5722", text: "#FFFFFF" }; // Deep Orange
    case 6:
      return { bg: "#9C27B0", text: "#FFFFFF" }; // Purple
    case 7:
      return { bg: "#607D8B", text: "#FFFFFF" }; // Blue Grey
    case 8:
      return { bg: "#E91E63", text: "#FFFFFF" }; // Pink
    case 9:
      return { bg: "#03A9F4", text: "#FFFFFF" }; // Light Blue
    default:
      return { bg: "#CCCCCC", text: "#1B1B1B" }; // fallback
  }
}

const userColor = getColor(Math.floor(Math.random() * 10));
const terminalColor = getColor(Math.floor(Math.random() * 10));

const getSub = (allData: Array<any>): Array<any> => {
  const attachChildren = (node: any): any => {
    const mySid = node["CHILD_MENU_SID"];

    const kids = allData.filter((row) => row["PARENT_MENU_SID"] === mySid);

    if (kids.length === 0) {
      return {
        ...node,
        children: [],
      };
    } else {
      const enrichedKids = kids.map((kid) => attachChildren(kid));
      return {
        ...node,
        children: enrichedKids,
      };
    }
  };

  const roots = allData.filter((row) => row["PARENT_MENU_SID"] === 0);

  const tree = roots.map((root) => attachChildren(root));
  return tree;
};

const Header = React.memo(
  () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(
      (s: RootState) => ({
        terminal: s.user.userInfo?.userTerminalCodeWork,
        id: s.user.userInfo?.userId,
        name: s.user.userInfo?.userName,
        depart: s.user.userInfo?.userDepartName,
      }),
      shallowEqual,
    );

    const route = useSelector((s: RootState) => s.user.route);
    const routeArray = useSelector((s: RootState) => s.user.routeArray);
    const [userOpen, setUserOpen] = useState(false);
    const closeTimer = useRef<number | null>(null);

    const onSelectNav = useCallback(
      (item: RouteType) => dispatch(selectNav(item)),
      [dispatch],
    );
    const onDeleteNav = useCallback(
      (item: RouteType) => dispatch(deleteNav(item)),
      [dispatch],
    );

    useEffect(() => {
      buildMenu();
    }, []);

    useEffect(() => {
      async function check() {
        const res = await getApi<UserInfoType>({
          baseUrl: "AUTH",
          method: "GET",
          url: "/user/verity",
          pgmId: "",
        });
        if (res.ok) {
          if (res.data) {
            dispatch(pushUserInfo(res.data));
          }
        }
      }
      check();

      const id = setInterval(check, 5 * 60 * 1000);

      return () => {
        clearInterval(id);
      };
    }, []);

    const buildMenu = async () => {
      const res = await getApi<Record<number, any>>({
        baseUrl: "AUTH",
        method: "GET",
        url: "/user/buildMenu",
        pgmId: "",
      });

      if (res.ok) {
        if (res.data) {
          if (Array.isArray(res.data[0])) {
            const data = res.data[0];

            dispatch(pushMenu(getSub(data)));
          }
          return;
        }
      }
    };

    function open() {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setUserOpen(true);
    }
    function userClose() {
      closeTimer.current = window.setTimeout(() => setUserOpen(false), 120); // 120ms 딜레이
    }
    function satDown() {
      const link = document.createElement("a");
      link.href = "/SATRUN.exe";
      link.download = "관세청파일.exe";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    async function logout() {
      const res = await getApi({
        baseUrl: "AUTH",
        method: "GET",
        url: `/user/logout`,
        pgmId: "",
      });

      if (res.ok) {
        navigate("/");
      }
    }
    return (
      <header className="fixed z-[999] top-0 left-0 flex justify-between h-[7%] w-screen bg-[#1E1F2A] items-center shadow-md px-4 border-b border-gray-300">
        {/* 로고 및 터미널 , 탭영역*/}
        <div className="flex flex-1 items-center gap-3 h-full">
          {/* 로고 */}
          <a
            href="http://service.aact.co.kr"
            target="_aact_top"
            className="p-1 hover:bg-gray-700 rounded-md cursor-pointer w-[3.5rem]">
            <img src={logo} />
          </a>
          {/* 터미널 */}
          <span
            className={`size-[2.5rem] text-lg font-bold flex items-center justify-center p-1 rounded-full`}
            style={{
              backgroundColor: terminalColor.bg,
              color: terminalColor.text,
            }}>
            {user.terminal || "A"}
          </span>

          {/* 메뉴 탭영역 */}
          <div className="flex gap-1 items-center h-full ml-[8%]">
            {routeArray.map((item, index) => (
              <div
                key={index}
                className={`text-xs hover:bg-gray-300 h-[2rem] rounded-md flex pl-[1rem] items-center cursor-pointer ${
                  route?.MENU_ID === item.MENU_ID
                    ? "bg-blue-300 text-gray-800 font-semibold"
                    : "text-black bg-gray-200"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNav(item);
                }}>
                {item["MENU_NAME"] || item.PROGRAM_NAME}
                <div className="h-[2rem] w-[2rem] flex items-center justify-center p-[0.25rem] ">
                  {" "}
                  <IoMdClose
                    className="text-sm font-bold w-full h-full p-[0.15rem] hover:bg-gray-400 rounded-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNav(item);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 프로필영역 */}
        <div className="flex justify-end items-center gap-4">
          <Alert />
          <div className="flex flex-col gap-1 items-end">
            <span className="text-white font-bold">{user.id || ""}</span>
            <span className="text-white">
              {user.depart || ""} : {user.name || ""}
            </span>
          </div>
          <div
            onMouseEnter={open}
            onMouseLeave={userClose}
            className="relative flex items-center gap-1 select-none group">
            <span
              style={{
                backgroundColor: userColor.bg,
                color: userColor.text,
              }}
              className="size-[2.5rem] flex items-center text-lg font-bold justify-center p-1 rounded-full cursor-pointer">
              {user.name?.substring(0, 1)}
            </span>
            {userOpen ? (
              <IoIosArrowUp className="text-white cursor-pointer iconSize" />
            ) : (
              <IoIosArrowDown className="text-white cursor-pointer iconSize" />
            )}
            <div
              className={[
                "absolute right-0 top-[3.5rem] w-[9rem]",
                "bg-white border border-gray-300 rounded-md shadow-lg z-[200]",
                "transition-all duration-200 ease-out origin-top transform",
                userOpen
                  ? "opacity-100 scale-y-100 pointer-events-auto"
                  : "opacity-0 scale-y-95 pointer-events-none",
              ].join(" ")}
              onMouseEnter={open}
              onMouseLeave={userClose}>
              <div className="flex flex-col">
                <div
                  className="flex h-[2rem] items-center justify-between hover:bg-gray-300 px-[1rem] cursor-pointer"
                  onClick={() => {
                    const tmpRt: RouteType = {
                      PROGRAM_ID: "USER_INFO",
                      PROGRAM_NAME: "사용자 정보",
                      ARGUMENT: "",
                      CHILD_MENU_SID: 0,
                      MENU_ID: "",
                      MENU_NAME: "",
                      PARENT_MENU_SID: 0,
                      PROGRAM_EXTENSION: "",
                      PROGRAM_FILE_NAME: "",
                      PROGRAM_PATH: "",
                      param: null,
                    };
                    dispatch(modalOpen({ route: [tmpRt] }));
                  }}>
                  <MdOutlineInfo />
                  <span className="text-xs">사용자정보</span>
                </div>
                <div
                  className="flex h-[2rem] items-center justify-between hover:bg-gray-300 px-[1rem] cursor-pointer"
                  onClick={() => satDown()}>
                  <FaRegFloppyDisk />
                  <span className="text-xs">관세청 설치파일</span>
                </div>
                <div
                  className="flex h-[2rem] items-center justify-between hover:bg-gray-300 px-[1rem] cursor-pointer"
                  onClick={() => logout()}>
                  <IoLogOutOutline />
                  <span className="text-xs">로그아웃</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  },
  (prev, next) => {
    return false;
  },
);

export default Header;
