import { useEffect, useState } from "react";
import InfraHeader from "./InfraHeader";
import InfraMaster from "./InfraMaster";
import InfraSide from "./InfraSide";
import InfraMobileHeader from "./InfraMobileHeader";
import { getApi } from "../Util/Util";
import type { UserInfoType } from "../Util/Type";
import { useDispatch, useSelector } from "react-redux";
import { changeServer, pushMenu, pushUserInfo } from "../slices/user";
import { useNavigate } from "react-router-dom";
import { SignIO } from "../comp/Common";
import type { RootState } from "../slices/store";

const InfraMain = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const userId = useSelector(
    (state: RootState) => state.user.userInfo?.userId || "",
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
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

  const getSub = (allData: Array<any>): Array<any> => {
    const attachChildren = (node: any): any | null => {
      const mySid = node["CHILD_MENU_SID"];

      // 자식 찾기 (조건 없이 일단 다 가져옴)
      const kids = allData.filter((row) => row["PARENT_MENU_SID"] === mySid);

      // 자식 재귀
      const filteredKids = kids
        .map((kid) => attachChildren(kid))
        .filter((v) => v !== null);

      // 🔥 leaf 노드 판단
      if (filteredKids.length === 0) {
        // leaf인데 Mobile 아니면 제거
        if (isMobile && node["PROGRAM_TYPE_CODE"] !== "MOWEB") {
          if (node["PROGRAM_TYPE_CODE"] !== "Mobile") {
            return null;
          }
        } else {
          if (node["PROGRAM_TYPE_CODE"] === "Mobile") {
            return null;
          }
        }

        // leaf + Mobile이면 유지
        return {
          ...node,
          children: [],
        };
      }

      // 🔥 자식 중 하나라도 살아있으면 유지
      return {
        ...node,
        children: filteredKids,
      };
    };

    const roots = allData.filter((row) => row["PARENT_MENU_SID"] === 0);

    return roots.map((root) => attachChildren(root)).filter((v) => v !== null);
  };
  useEffect(() => {
    if (userId) {
      buildMenu();
    }
  }, [userId]);

  const buildMenu = async () => {
    const res = await getApi<Record<number, any>>({
      baseUrl: "AUTH",
      method: "GET",
      url: "/user/buildMenu",
      pgmId: "pgmId",
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

  return (
    <div>
      {isMobile ? (
        <InfraMobileHeader />
      ) : (
        <>
          {" "}
          <InfraHeader />
          <InfraSide />
        </>
      )}

      <InfraMaster deviceType={isMobile ? "MOBILE" : "PC"} />
      <SignIO />
    </div>
  );
};

export default InfraMain;
