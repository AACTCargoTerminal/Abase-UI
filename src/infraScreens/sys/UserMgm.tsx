import {
  forwardRef,
  use,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  DefInfraComp,
  PageHandle,
  TableHeaderType,
  TableRow,
  ToggleBtnType,
  ToggleType,
} from "../../Util/Type";
import { CommonContainer } from "../../comp/Container";
import { getApi, getClass, getClassValue, openModal } from "../../Util/Util";
import { CommonDropDown } from "../../comp/DropDown";
import { commonHeader2 } from "../../Util/Header";
import { CommonInput } from "../../comp/Input";
import { ToggleBtn } from "../../comp/Common";
import { Btn } from "../../comp/Btn";
import { TableCust } from "../../comp/Table";

const YESNO: ToggleType[] = [
  { key: "Y", value: "예" },
  { key: "N", value: "아니오" },
];

const GRID1_HEADER: TableHeaderType[] = [
  { key: "USER_ID", value: "사용자 ID", w: "8rem", sum: 0 },
  { key: "USER_NAME1", value: "공용 사용자명", w: "8rem" },
  { key: "USER_NAME2", value: "한글 사용자명", w: "8rem" },
  { key: "JOIN_DAY", value: "입사일", w: "6rem" },
  { key: "GROUP_JOIN_DAY", value: "그룹입사일", w: "6rem" },
  { key: "TERMINAL_NAME", value: "근무지", w: "4rem" },
  { key: "TEAM_NAME", value: "부서명", w: "8rem" },
  { key: "LEADER_FLAG", value: "팀장권한", w: "10rem" },
  { key: "DEP_LEADER_FLAG", value: "부팀장 권한", w: "10rem" },
  { key: "MANAGER_FLAG", value: "담당자 권한", w: "10rem" },
];

const UserMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId }, ref) => {
    const [dptcd, setDptcd] = useState<TableRow[]>([]);
    const [dptcdSelect, setDptcdSelect] = useState("");
    const [userId, setUserId] = useState("");
    const [username, setUsername] = useState("");
    const [yesNo, setYesNo] = useState(0);

    const [grid1, setGrid1] = useState<TableRow[]>([]);
    async function getDPTCD() {
      const data = await getClass("HRPAT", pgmId, true);
      if (data) {
        setDptcd(data);
      }
    }
    useEffect(() => {
      getDPTCD();
      searchClick();
    }, []);
    useImperativeHandle(ref, () => ({
      onModalPayload(payload: TableRow) {
        if (payload["CLOSE"] === "CLOSE") {
          searchClick();
        }
      },
    }));

    const searchClick = useCallback(async () => {
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "AUTH",
        method: "GET",
        url: `/user/getUserList2?depCode=${dptcdSelect}&userId=${userId}&userName=${username}&usableFlag=${YESNO[yesNo].key}`,
        pgmId: pgmId,
      });

      if (res.ok) {
        if (res.data) {
          setGrid1(res.data[0]);
          return;
        }
      }
      setGrid1([]);
    }, [dptcdSelect, userId, username, yesNo]);

    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key !== "Enter") return;

        e.preventDefault();

        const active = document.activeElement as HTMLElement | null;

        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.getAttribute("contenteditable") === "true")
        ) {
          active.blur(); // ⭐ 포커스 해제
        }

        setTimeout(() => {
          searchClick();
        }, 0);
      };

      window.addEventListener("keyup", handler, true);
      return () => window.removeEventListener("keyup", handler, true);
    }, [searchClick]);

    return (
      <div className="flex flex-col gap-5 py-[0.5%]">
        <CommonContainer title="조회 및 버튼" width="70%">
          <div className="grid grid-cols-[20%_20%_20%_10%_10%] items-center gap-6">
            <div className="mainInput">
              <CommonDropDown
                data={dptcd}
                dropHeight="15rem"
                header={commonHeader2}
                id="dptcd"
                inputKey={{
                  key: "CODE_CODE",
                  showKey: "0",
                  value: dptcdSelect,
                }}
                onClick={(r) => {
                  setDptcdSelect(r["CODE_CODE"]);
                }}
                find={true}
                title="부서"
                labelW="20%"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="userId"
                value={userId}
                onChange={(v) => {
                  setUserId(v);
                }}
                label="사용자 ID"
                labelW="25%"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="username"
                value={username}
                onChange={(v) => {
                  setUsername(v);
                }}
                label="사용자 명"
              />
            </div>
            <div className="mainInput">
              <ToggleBtn
                array={YESNO}
                onClick={(v) => {
                  const tmp = YESNO.findIndex((r) => r.key === v);
                  if (tmp >= 0) {
                    setYesNo(tmp);
                  }
                }}
                idx={yesNo}
              />
            </div>
            <div className="mainInput flex items-center gap-2">
              <Btn
                txt="조회"
                type="SEARCH"
                onClick={() => {
                  searchClick();
                }}
              />
              <Btn
                txt="신규"
                type="SAVE"
                onClick={() => {
                  openModal({
                    array: [{ id: "USERMODAL", name: "사용자 관리" }],
                  });
                }}
              />
            </div>
          </div>
        </CommonContainer>
        <CommonContainer title="사용자 목록" width="99.5%">
          <TableCust
            tableId="grid1"
            header={GRID1_HEADER}
            body={grid1}
            height="35rem"
            onClick={(v) => {}}
            width="100%"
            rightClick={(k, r) => {
              if (k === "SET") {
                openModal({
                  array: [
                    {
                      id: "USERRESMGM",
                      name: "인사 설정",
                      param: { userSid: r?.["USER_SID"] },
                    },
                  ],
                });
              }
            }}
            rightMenu={[{ key: "SET", value: "인사 설정" }]}
            doubleClick={(v) => {
              openModal({
                array: [
                  {
                    id: "USERMODAL",
                    name: "사용자 관리",
                    param: { userId: v["USER_ID"] },
                  },
                ],
              });
            }}
          />
        </CommonContainer>
      </div>
    );
  },
);

export default UserMgm;
