import moment from "moment";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward, IoMdRefresh } from "react-icons/io";
import { Calendar, MainMenu, SubMenu, ToggleBtn } from "../../comp/Common";
import type { SchMainType, TableRow, UserSchType } from "../../Util/Type";
import { getApi, getClass } from "../../Util/Util";
import { CommonChk, CommonLabel } from "../../comp/Input";
import { useDispatch } from "react-redux";
import { pushMenu, pushSch, pushSchInout } from "../../slices/user";

type ProgressBarProps = { value: number };

const ProgressBar = React.memo(function ProgressBar({
  value,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div className="grid w-full h-full overflow-hidden font-semibold tracking-tight place-items-center bg-[#FFFFFF]">
      <div
        className="col-start-1 row-start-1 justify-self-start h-full bg-[#F5C62D] z-0"
        style={{ width: `${percent}%` }}
      />
      <span className="col-start-1 tableSz row-start-1 z-[1] pointer-events-none">
        {percent}%
      </span>
    </div>
  );
});
export default function Side() {
  const dispatch = useDispatch();
  const [sideOpen, setSideOpen] = useState(false);
  const [selectMain, setSelectMain] = useState("");
  const [fltDate, setFltDate] = useState(moment().format("YYYYMMDD"));
  const [inoutArray, setInoutArray] = useState<TableRow[]>([]);
  const [inoutFlag, setInoutFlag] = useState("I");
  const [top, setTop] = useState(12);

  const [schData, setSchData] = useState<SchMainType[]>([]);
  const [schSelect, setSchSelect] = useState<SchMainType | undefined>();
  const [allChk, setAllChk] = useState(false);

  async function getInout() {
    const data = await getClass("SCHIO", "pgm_id");
    setInoutArray(data);
  }

  useEffect(() => {
    getInout();
  }, []);

  const selectSch = useCallback(
    (item: UserSchType) => dispatch(pushSch(item)),
    [dispatch],
  );

  const getSch = useCallback(async () => {
    const flag = inoutFlag;
    const res = await getApi<Record<number, SchMainType[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/user/getSch?fltDate=${fltDate}&inoutFlag=${flag}`,
      sucFlag: true,
      pgmId: "",
    });

    if (res.ok) {
      if (res.data) {
        if (allChk) {
          setSchData(res.data[0]);
        } else {
          const tmpDt = res.data[0]
            .filter(
              (r) =>
                !(
                  r.SCHEDULE_STATUS_CODE === "O00" ||
                  r.SCHEDULE_STATUS_CODE === "I00"
                ),
            )
            .sort((a, b) =>
              String(a.SCHEDULE_STATUS_CODE).localeCompare(
                String(b.SCHEDULE_STATUS_CODE),
              ),
            );
          setSchData(tmpDt);
        }
      }
    }
  }, [fltDate, inoutFlag, allChk]);
  useEffect(() => {
    getSch();
  }, [getSch]);
  return (
    <aside
      className={`fixed top-[7%] z-[110] shadow-md left-0 flex h-[calc(100vh-7vh)]`}
      onMouseLeave={() => {
        setSideOpen(false);
        setSelectMain("");
      }}>
      {/* 스케줄정보 */}
      <div
        className={`
    flex flex-col z-[110] border-r shadow-md border-[#D1D5DC] bg-[#FFFFFF] overflow-hidden delay-150 duration-800 ${
      sideOpen ? "w-[25rem]" : "w-[10.5rem]" //w-[23.7rem]
    }
  `}>
        {/* 날짜,인아웃 */}
        <div className={`w-full flex flex-col p-1 gap-1 bg-[#F0F0F0]`}>
          <div className="flex items-center w-full h-full">
            <label
              htmlFor="date"
              className={`text-nowrap text-center font-semibold tracking-wide ${
                sideOpen
                  ? "translate-x-0 opacity-100 w-[2.5rem] ml-[0.5rem]"
                  : "-translate-x-2 opacity-0 w-0"
              }`}>
              일자
            </label>
            <div className="w-full flex items-center h-full">
              <div
                className={`cursor-pointer rounded-full hover:bg-gray-200 translate-x-0 opacity-100 p-1 mr-[0.1rem]`}
                onClick={() => {
                  setFltDate((prev) =>
                    moment(prev).subtract(1, "day").format("YYYYMMDD"),
                  );
                }}>
                <IoIosArrowBack className="text-gray-700 text-xl font-semibold" />
              </div>

              <div className={`flex items-center h-[2rem] w-[7rem]`}>
                <Calendar
                  changeDate={(value) => setFltDate(value)}
                  date={fltDate}
                />
              </div>
              <div
                className={`cursor-pointer rounded-full hover:bg-gray-200 translate-x-0 opacity-100 p-1 ml-[0.1rem]`}
                onClick={() => {
                  setFltDate((prev) =>
                    moment(prev).add(1, "day").format("YYYYMMDD"),
                  );
                }}>
                <IoIosArrowForward className="text-gray-700 text-xl font-semibold" />
              </div>
            </div>
          </div>

          <div
            className={`grid ${
              sideOpen ? "grid-cols-3" : "grid-cols-[0.8fr_0.3fr]"
            } items-center h-[2rem] w-full gap-2`}>
            <div className="mainInput">
              {" "}
              <ToggleBtn
                array={inoutArray.map((item) => ({
                  key: item["CODE_CODE"],
                  value: item["CODE_NAME"],
                }))}
                onClick={(value) => {
                  setInoutFlag(value);
                  dispatch(pushSchInout(value));
                }}
                idx={
                  inoutArray.findIndex(
                    (item) => item["CODE_CODE"] === inoutFlag,
                  ) || 0
                }
              />
            </div>
            <div className="mainInput flex items-center justify-center gap-2">
              <div
                className={`delay-150 duration-500 ${
                  sideOpen ? "opacity-100 w-fit" : "opacity-0 w-0"
                }`}>
                {" "}
                <CommonLabel id="refresh" label="재조회" />
              </div>
              <IoMdRefresh
                onClick={() => {
                  getSch();
                }} //getSch()
                className="text-xl cursor-pointer hover:text-blue-500"
              />
            </div>

            <div
              className={`mainInpu flex items-center justify-center delay-150 duration-500 ${
                sideOpen ? "opacity-100 w-fit" : "opacity-0 w-0"
              }`}>
              {" "}
              <CommonChk
                id="allChk"
                onChange={(v) => {
                  setAllChk(v);
                }}
                value={allChk}
                title="전체"
              />
            </div>
          </div>
        </div>

        {/* header */}
        <div
          className={`
      grid border border-[#D1D5DC] bg-[#6F6F70] text-white font-semibold ${
        sideOpen
          ? "grid grid-cols-[5.3rem_4rem_2.5rem_4rem_2.5rem_2.5rem_4rem]"
          : "grid grid-cols-[50%_50%]"
      }
    `}>
          <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC]">
            TIME
          </div>
          <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC]">
            FLT.NO
          </div>
          {sideOpen && (
            <>
              <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC] overflow-hidden">
                {inoutFlag === "I" ? "DEP" : "ARR"}
              </div>
              <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC] overflow-hidden">
                STATUS
              </div>
              <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC] overflow-hidden">
                PCS
              </div>
              <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC] overflow-hidden">
                ULD
              </div>
              <div className="px-2 py-2 tableSz text-center overflow-hidden">
                %C
              </div>
            </>
          )}
        </div>

        {/* rows */}
        <div className="text-gray-800 border border-t-0 border-[#D1D5DC] scroll-y-no-bar overflow-x-hidden">
          {schData.map((row) => {
            var css = "";

            if (row.CARGO_CONTROL_COUNT !== 0) {
              css = "bg-[#FFFACD]";
            }

            if (
              row.SCHEDULE_STATUS_CODE === "I00" ||
              row.SCHEDULE_STATUS_CODE === "I06" ||
              row.SCHEDULE_STATUS_CODE === "O00"
            ) {
              css = "bg-[#D3D3D3]";
            } else if (row.SCHEDULE_STATUS_CODE === "O04") {
              css = "bg-[#C0C0C0]";
            }

            if (
              row.HOLD_REPORTED_TIME !== "" &&
              row.HOLD_REPORTED_USER_ID !== ""
            ) {
              css = "bg-[#e0bbd2]";
            }

            if (row.SCHEDULE_SID === schSelect?.SCHEDULE_SID) {
              css = "bg-[#C5D3E8]";
            }

            return (
              <div
                key={row.SCHEDULE_SID}
                className={`
          grid border-b border-[#D1D5DC] hover:bg-[#FFFBEA] ${
            sideOpen
              ? "grid grid-cols-[5.3rem_4rem_2.5rem_4rem_2.5rem_2.5rem_4rem]"
              : "grid grid-cols-[50%_50%]"
          } cursor-pointer ${css}
        `}
                onClick={() => {
                  setSchSelect({ ...row });
                  selectSch({
                    schSid: row.SCHEDULE_SID,
                    inout: inoutFlag,
                    fltDate: fltDate,
                  });
                }}>
                <div className="px-2 py-2 text-center tableSz border-r border-[#D1D5DC] text-nowrap">
                  {row.ACTUAL_TIME}
                </div>
                <div className="px-2 py-2 text-center tableSz border-r border-[#D1D5DC] text-nowrap">
                  {row.FLIGHT_NO}
                </div>
                {sideOpen && (
                  <>
                    <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC] text-nowrap overflow-hidden">
                      {row.AIRPORT_CODE}
                    </div>
                    <div className="px-2 py-2 tableSz text-center border-r border-[#D1D5DC] text-nowrap overflow-hidden">
                      {row.SCHEDULE_STATUS_NAME}
                    </div>
                    <div className="px-2 py-2 tableSz text-right border-r border-[#D1D5DC] text-nowrap overflow-hidden">
                      {row.CARGO_CONTROL_COUNT}
                    </div>
                    <div className="px-2 py-2 tableSz text-right border-r border-[#D1D5DC] text-nowrap overflow-hidden">
                      {row.OPERATION_ULD_COUNT}
                    </div>
                    <div className="overflow-hidden h-full">
                      <ProgressBar value={row.PROCESS_RATIO} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div
          className={`
    grid border border-[#D1D5DC] bg-[#E4E4E4] items-center font-semibold ${
      sideOpen ? "grid-cols-[12rem_5rem_3rem]" : "grid-cols-[100%]"
    }
    `}>
          <div className="px-2 py-2 text-left text-nowrap overflow-hidden">
            COUNT : {schData.length}
          </div>
          {sideOpen && (
            <>
              {" "}
              <div className="px-2 py-2 text-end text-nowrap overflow-hidden">
                {schData.reduce((sum, t) => sum + t.CARGO_CONTROL_COUNT, 0)}
              </div>
              <div className="px-2 py-2 text-center text-nowrap overflow-hidden">
                {" "}
                {schData.reduce((sum, t) => sum + t.OPERATION_ULD_COUNT, 0)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 메뉴 */}
      <MainMenu
        open={sideOpen}
        setOpen={(v) => {
          setSideOpen(v);
          setSelectMain("");
        }}
        selectMain={selectMain}
        setSelectMain={(v) => setSelectMain(v)}
        setTop={(v) => setTop(v)}
      />
      <SubMenu open={{ main: selectMain, top: top }} />
    </aside>
  );
}
