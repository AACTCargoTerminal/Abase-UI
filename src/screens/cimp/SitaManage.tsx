import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Divider, ModalCust } from "../../comp/Common";
import { CommonContainer } from "../../comp/Container";
import type {
  DefComp,
  PageHandle,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";
import { CommonInput } from "../../comp/Input";
import moment from "moment";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import {
  changeSitaMessage,
  getApi,
  getClass,
  getInt,
  groupBy,
  openModal,
  sendErr,
  sendLoading,
  sendSuc,
  setTableChange,
} from "../../Util/Util";
import { commonHeader, commonHeader2, commonHeader3 } from "../../Util/Header";
import { TableCust } from "../../comp/Table";
import { Btn } from "../../comp/Btn";
import NewSitaMsg from "./NewSitaMsg";
import { confirmAsync } from "../../confirmService";

const css1 =
  "mainInput flex items-center hover:bg-gray-300 cursor-pointer rounded-md font-bold text-nowrap w-[10rem] px-[1rem]";

const GROUPPING: TableRow[] = [
  { CODE_CODE: "0", CODE_NAME: "없음" },
  { CODE_CODE: "1", CODE_NAME: "문서종류" },
];

const GRID1_HEADER: TableHeaderType[] = [
  {
    key: "CHK",
    value: "",
    w: "5%",
    option: { type: "CHK" },
  },
  {
    key: "SENDER_ID",
    value: "FROM",
    w: "13%",
  },
  {
    key: "RECEIVER_ID",
    value: "TO",
    w: "13%",
  },
  {
    key: "MIG_CODE",
    value: "문서종류",
    w: "7%",
  },
  {
    key: "EDI_SUBJECT",
    value: "제목",
    w: "20%",
    sum: 0,
  },
  {
    key: "EDI_STATUS",
    value: "처리상태",
    w: "7%",
  },
  {
    key: "INTERFACE_TIME",
    value: "처리 일자",
    w: "20%",
    disable: true,
  },
  {
    key: "COMPLETE_TIME",
    value: "완료 일자",
    w: "20%",
    disable: true,
  },
  {
    key: "FILE_CREATED_TIME",
    value: "받은 일자",
    w: "20%",
  },
  {
    key: "FILE_CREATED_TIME_UTC",
    value: "UTC",
    w: "20%",
  },
  {
    key: "FILE_SIZE",
    value: "파일사이즈",
    w: "8%",
  },
];

const SitaManage = forwardRef<PageHandle, DefComp>(
  ({ outParam, param, pgmId, sch }, ref) => {
    const [selectMenu, setSelectMenu] = useState(0);
    const [bdFlag, setBdFlag] = useState("");
    const [date, setDate] = useState<{ startDate: string; endDate: string }>({
      startDate: moment().subtract(1, "day").format("YYYYMMDD"),
      endDate: moment().format("YYYYMMDD"),
    });
    const [edist, setEdist] = useState<TableRow[]>([]);
    const [selectEdist, setSelectEdist] = useState<TableRow | undefined>();
    const [sitaa, setSitaa] = useState<TableRow[]>([]);
    const [selectSitaa, setSelectSitaa] = useState<TableRow | undefined>();
    const [selectGroup, setSelectGroup] = useState<TableRow>(GROUPPING[0]);
    const [gridHeader, setGridHeader] =
      useState<TableHeaderType[]>(GRID1_HEADER);
    const [sitaData, setSitaData] = useState("");
    const [toUser, setToUser] = useState("");
    const [toEmail, setToEmail] = useState("");
    const [fromEmail, setFromEmail] = useState("");

    const [grid, setGrid] = useState<TableRow[]>([]);
    const [gridSelect, setGridSelect] = useState<TableRow>({});
    const [changeGrid, setChangeGrid] = useState<Record<number, TableRow>>({});

    const [groupGrid, setGroupGrid] = useState<TableRow[]>([]);
    const [groupGridSelect, setGroupGridSelect] = useState<number[]>([]);
    const [drGroupGrid, setDrGroupGrid] = useState<Record<string, TableRow[]>>(
      {},
    );

    const [drGroupGridSelect2, setDrGroupGridSelect2] = useState<TableRow>({});

    const [drGroupGridSelect, setDrGroupGridSelect] = useState<
      Record<string, Record<number, TableRow>>
    >({});

    useEffect(() => {
      getEDIST();
      getSITAA();
    }, []);

    useImperativeHandle(ref, () => ({
      onModalPayload(payload: TableRow) {
        if (payload["SEND"]) {
          if (payload["SEND"] === "COMP") {
            getSitaM010_001({ boundFlag: bdFlag });
          }
        }
        if (payload["SAVE"]) {
          getSitaM010_001({ boundFlag: bdFlag });
        }
      },
    }));
    useEffect(() => {
      if (selectMenu === 0) {
        const tmp = GRID1_HEADER.map((item) => {
          if (item.key === "SENDER_ID") {
            item.disable = false;
          } else if (item.key === "RECEIVER_ID") {
            item.disable = true;
          } else if (item.key === "FILE_CREATED_TIME") {
            item.disable = false;
          } else if (item.key === "INTERFACE_TIME") {
            item.disable = true;
          } else if (item.key === "COMPLETE_TIME") {
            item.disable = true;
          }
          return item;
        });

        setGridHeader(tmp);
        getSitaM010_001({ boundFlag: "I" });
      } else if (selectMenu === 1) {
        const tmp = GRID1_HEADER.map((item) => {
          if (item.key === "SENDER_ID") {
            item.disable = true;
          } else if (item.key === "RECEIVER_ID") {
            item.disable = false;
          } else if (item.key === "FILE_CREATED_TIME") {
            item.disable = true;
          } else if (item.key === "INTERFACE_TIME") {
            item.disable = true;
          } else if (item.key === "COMPLETE_TIME") {
            item.disable = false;
          }
          return item;
        });
        setGridHeader(tmp);
        getSitaM010_001({ boundFlag: "O" });
      } else if (selectMenu === 2) {
        const tmp = GRID1_HEADER.map((item) => {
          if (item.key === "SENDER_ID") {
            item.disable = true;
          } else if (item.key === "RECEIVER_ID") {
            item.disable = false;
          } else if (item.key === "FILE_CREATED_TIME") {
            item.disable = true;
          } else if (item.key === "INTERFACE_TIME") {
            item.disable = false;
            item.value = "작성 일자";
          } else if (item.key === "COMPLETE_TIME") {
            item.disable = true;
          }
          return item;
        });
        setGridHeader(tmp);
        getSitaM010_001({ boundFlag: "D" });
      } else if (selectMenu === 3) {
        const tmp = GRID1_HEADER.map((item) => {
          if (item.key === "SENDER_ID") {
            item.disable = true;
          } else if (item.key === "RECEIVER_ID") {
            item.disable = true;
          } else if (item.key === "FILE_CREATED_TIME") {
            item.disable = true;
          } else if (item.key === "INTERFACE_TIME") {
            item.disable = true;
          } else if (item.key === "COMPLETE_TIME") {
            item.disable = true;
          } else if (item.key === "FILE_SIZE") {
            item.disable = true;
          }
          return item;
        });
        setGridHeader(tmp);
        getSitaM010_001({ boundFlag: "*" });
      }
    }, [selectMenu, date.endDate, selectSitaa?.["CODE_CODE"]]);

    useEffect(() => {
      if (selectGroup["CODE_CODE"] === "1") {
        setChangeGrid({});
        setGroupGridSelect([]);
        setDrGroupGridSelect({});
        setDrGroupGridSelect2({});
        const tmp = groupBy({ data: grid, key: "MIG_CODE" });
        setDrGroupGrid(tmp);
        setGroupGrid(
          Object.keys(tmp).map((r, i) => {
            return { CODE_CODE: i, CODE_NAME: r };
          }),
        );
      } else {
        setChangeGrid({});
        setDrGroupGridSelect2({});
        setDrGroupGridSelect({});
        setGroupGrid([]);
        setGroupGridSelect([]);
        setDrGroupGrid({});
      }
    }, [selectGroup, grid]);

    async function getSitaM010_001({ boundFlag }: { boundFlag: string }) {
      setBdFlag(boundFlag);
      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/getSitaM010_001?division=${selectMenu}&boundFlag=${boundFlag}&fromInterface=${
          date.startDate
        }&toInterface=${date.endDate}&id=${
          selectSitaa?.["CODE_CODE"] || ""
        }&ediStatus=${selectEdist?.["CODE_CODE"] || ""}`,
        pgmId: pgmId,
      });

      if (res.ok) {
        sendSuc("조회완료");
        if (res.data) {
          setGrid(res.data[0]);
          setGridSelect({});
        }
      }
      sendLoading(false);
    }

    async function getEDIST() {
      const data = await getClass("EDIST", pgmId);
      setEdist([{ CODE_CODE: "", CODE_NAME: "" }, ...data]);
    }
    async function getSITAA() {
      const data = await getClass("SITAA", pgmId);
      setSitaa(data);
    }

    const getDetail = useCallback(
      (idx: number) => {
        if (!groupGridSelect.includes(idx)) {
          return null;
        }
        const tmp = groupGrid.find((r, i) => i === idx);
        if (!tmp) {
          return null;
        }

        return (
          <div className="w-full h-fit p-[1%]">
            <TableCust
              tableId="grid"
              body={drGroupGrid[tmp["CODE_NAME"]] || []}
              header={gridHeader}
              height="40rem"
              onClick={(r) => {
                setDrGroupGridSelect2(r);
                getSitaMsg({ r: r });
              }}
              doubleClick={(r) => {
                openModal({
                  array: [
                    {
                      id: "IFEDI0070",
                      name: "메시지 작성",
                      param: {
                        edi_guid: r["EDI_IO_GUID"],
                        gubn: "forward",
                      },
                    },
                  ],
                });
              }}
              changeValue={(i, k, v, r) => {
                if (r) {
                  setDrGroupGridSelect({});
                  return;
                }

                setDrGroupGridSelect((prev) => ({
                  ...prev,
                  [tmp["CODE_NAME"]]: {
                    ...prev[tmp["CODE_NAME"]],
                    [i]: { [k]: v },
                  },
                }));
              }}
              width="100%"
            />
          </div>
        );
      },
      [groupGridSelect, setChangeGrid],
    );

    async function getSitaMsg({ r }: { r: TableRow }) {
      var guid = "";
      if (r["EDI_IO_GUID"]) {
        guid = r["EDI_IO_GUID"];
      }

      if (selectMenu === 0) {
        setToUser(r["SENDER_ID"]);
        setToEmail("");
        setFromEmail("");
      } else {
        setToUser(r["RECEIVER_ID"]);

        setToEmail(r["SENDER_EMAIL"]);
        setFromEmail(r["RECEIVER_EMAIL"]);
      }

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/getSitaMsg?ediGuid=${guid}`,
        pgmId: pgmId,
      });
      if (res.ok) {
        if (res.data) {
          if (res.data[0]) {
            const data = res.data[0][0]["EDI_FILE"];
            if (data) {
              setSitaData(data);
            }
          }
        }
      }
    }

    const delClick = useCallback(async () => {
      const tmpGuid: string[] = [];
      if (selectGroup["CODE_CODE"] === "1") {
        const tmp = Object.keys(drGroupGridSelect).filter((r) => {
          const rTmp = Object.keys(drGroupGridSelect[r]).map((row) => {
            if (drGroupGridSelect[r][getInt(row)]["CHK"] === true) {
              return true;
            } else {
              return false;
            }
          });
          if (rTmp.includes(true)) {
            return true;
          } else {
            return false;
          }
        });

        if (tmp.length > 0) {
          const ret = await confirmAsync({
            title: "삭제",
            message: "삭제하시겠습니까?",
          });

          if (!ret) {
            return;
          }

          tmp.forEach((r) => {
            Object.keys(drGroupGridSelect[r]).forEach((idx) => {
              const num = getInt(idx);
              if (drGroupGridSelect[r][num]["CHK"] === true) {
                drGroupGrid[r].forEach((row, i) => {
                  if (i === num) {
                    tmpGuid.push(row["EDI_IO_GUID"]);
                  }
                });
              }
            });
          });
        } else {
          sendErr("선택한 행이 없습니다.");
          return;
        }
      } else if (selectGroup["CODE_CODE"] === "0") {
        const tmp = Object.keys(changeGrid).filter(
          (r) => changeGrid[getInt(r)]["CHK"] === true,
        );
        if (tmp.length > 0) {
          const ret = await confirmAsync({
            title: "삭제",
            message: "삭제하시겠습니까?",
          });

          if (!ret) {
            return;
          }

          tmp.forEach((r, i) => {
            const num = getInt(r);
            const gridTmp = grid.find((_, i) => i === num);
            if (gridTmp) {
              tmpGuid.push(gridTmp["EDI_IO_GUID"]);
            }

            if (tmpGuid.length === tmp.length) {
              return;
            }
          });
        } else {
          sendErr("선택한 행이 없습니다.");
          return;
        }
      }

      await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/setSitaDel_021?guid=${tmpGuid}&division=${selectMenu}`,
        pgmId: pgmId,
        sucFlag: true,
      });

      await getSitaM010_001({ boundFlag: bdFlag });
    }, [grid, changeGrid, groupGrid, drGroupGridSelect]);

    const restoreClick = useCallback(async () => {
      const tmpGuid: string[] = [];
      if (selectGroup["CODE_CODE"] === "1") {
        const tmp = Object.keys(drGroupGridSelect).filter((r) => {
          const rTmp = Object.keys(drGroupGridSelect[r]).map((row) => {
            if (drGroupGridSelect[r][getInt(row)]["CHK"] === true) {
              return true;
            } else {
              return false;
            }
          });
          if (rTmp.includes(true)) {
            return true;
          } else {
            return false;
          }
        });

        if (tmp.length > 0) {
          const ret = await confirmAsync({
            title: "복원",
            message: "메시지를 복원하시겠습니까?",
          });

          if (!ret) {
            return;
          }

          tmp.forEach((r) => {
            Object.keys(drGroupGridSelect[r]).forEach((idx) => {
              const num = getInt(idx);
              if (drGroupGridSelect[r][num]["CHK"] === true) {
                drGroupGrid[r].forEach((row, i) => {
                  if (i === num) {
                    tmpGuid.push(row["EDI_IO_GUID"]);
                  }
                });
              }
            });
          });
        } else {
          sendErr("선택한 행이 없습니다.");
          return;
        }
      } else if (selectGroup["CODE_CODE"] === "0") {
        const tmp = Object.keys(changeGrid).filter(
          (r) => changeGrid[getInt(r)]["CHK"] === true,
        );
        if (tmp.length > 0) {
          const ret = await confirmAsync({
            title: "복원",
            message: "메시지를 복원하시겠습니까?",
          });

          if (!ret) {
            return;
          }

          tmp.forEach((r, i) => {
            const num = getInt(r);
            const gridTmp = grid.find((_, i) => i === num);
            if (gridTmp) {
              tmpGuid.push(gridTmp["EDI_IO_GUID"]);
            }

            if (tmpGuid.length === tmp.length) {
              return;
            }
          });
        } else {
          sendErr("선택한 행이 없습니다.");
          return;
        }
      }

      await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/setSitaRestore?guid=${tmpGuid}`,
        pgmId: pgmId,
        sucFlag: true,
      });

      await getSitaM010_001({ boundFlag: bdFlag });
    }, [grid, changeGrid, groupGrid, drGroupGridSelect]);

    const sendClick = useCallback(async () => {
      if (
        Object.keys(changeGrid).length === 0 &&
        Object.keys(drGroupGridSelect).length === 0
      ) {
        sendErr("선택한 행이 없습니다.");
        return;
      }
      const strArray: string[] = [];
      if (Object.keys(changeGrid).length > 0) {
        Object.keys(changeGrid).forEach((chv) => {
          if (changeGrid[getInt(chv)]["CHK"] === true) {
            strArray.push(grid[getInt(chv)]["EDI_IO_GUID"]);
          }
        });
      } else {
        if (Object.keys(drGroupGridSelect).length > 0) {
          Object.keys(drGroupGridSelect).forEach((chv) => {
            Object.keys(drGroupGridSelect[chv]).forEach((drv) => {
              if (drGroupGridSelect[chv][getInt(drv)]["CHK"] === true) {
                strArray.push(drGroupGrid[chv][getInt(drv)]["EDI_IO_GUID"]);
              }
            });
          });
        }
      }

      if (strArray.length > 0) {
        const ret = await getApi<Record<number, TableRow[]>>({
          baseUrl: "CIMP",
          method: "GET",
          url: `/cimp/sendSitaArray?guid=${strArray}`,
          pgmId: pgmId,
          sucFlag: true,
        });

        if (ret.ok) {
          getSitaM010_001({ boundFlag: bdFlag });
        }
      } else {
        sendErr("선택한 행이 없습니다.");
      }
    }, [changeGrid, drGroupGridSelect, grid, drGroupGrid]);

    return (
      <div className="pr-[1%]">
        <CommonContainer
          title="CARGO IMP 송/수신 현황(C-IMP Send/Receive Status)"
          childrenTitle={
            <div className="flex items-center w-full justify-end gap-2">
              {selectMenu === 2 && (
                <div className="mainInput">
                  <Btn
                    type="SAVE"
                    txt="SEND"
                    onClick={() => {
                      sendClick();
                    }}
                  />
                </div>
              )}
              <div className="mainInput">
                <Btn
                  type="SEARCH"
                  txt="SEARCH"
                  onClick={() => {
                    setSitaData("");
                    setToEmail("");
                    setFromEmail("");
                    getSitaM010_001({ boundFlag: bdFlag });
                  }}
                />
              </div>
              <div className="mainInput">
                <Btn
                  type="NONE"
                  txt="NEW MSG"
                  onClick={() => {
                    openModal({
                      array: [
                        {
                          id: "IFEDI0070",
                          name: "메시지 작성",
                        },
                      ],
                    });
                  }}
                />
              </div>
              <div className="mainInput">
                <Btn
                  type="NONE"
                  txt="PASS"
                  onClick={() => {
                    if (groupGrid.length > 0) {
                      openModal({
                        array: [
                          {
                            id: "IFEDI0070",
                            name: "메시지 작성",
                            param: {
                              edi_guid: drGroupGridSelect2["EDI_IO_GUID"],
                              gubn: "forward",
                            },
                          },
                        ],
                      });
                    } else {
                      openModal({
                        array: [
                          {
                            id: "IFEDI0070",
                            name: "메시지 작성",
                            param: {
                              edi_guid: gridSelect["EDI_IO_GUID"],
                              gubn: "forward",
                            },
                          },
                        ],
                      });
                    }
                  }}
                />
              </div>
              {selectMenu === 3 && (
                <div className="mainInput">
                  <Btn
                    type="NONE"
                    txt="RESTORE"
                    onClick={() => {
                      restoreClick();
                    }}
                  />
                </div>
              )}
              <div className="mainInput">
                <Btn
                  type="DELETE"
                  txt="DEL"
                  onClick={() => {
                    delClick();
                  }}
                />
              </div>
              <div className="mainInput">
                <Btn type="PRINT" txt="PRINT" onClick={() => {}} />
              </div>
            </div>
          }>
          <div className="flex h-full">
            <div className="flex flex-col gap-1">
              <span
                onClick={() => setSelectMenu(0)}
                className={`${css1} ${selectMenu === 0 && "bg-[#8EC5FF]"}`}>
                받은 메시지
              </span>
              <span
                onClick={() => setSelectMenu(1)}
                className={`${css1} ${selectMenu === 1 && "bg-[#8EC5FF]"}`}>
                보낸 메시지
              </span>
              <span
                onClick={() => setSelectMenu(2)}
                className={`${css1} ${selectMenu === 2 && "bg-[#8EC5FF]"}`}>
                보낼 메시지
              </span>
              <span
                onClick={() => setSelectMenu(3)}
                className={`${css1} ${selectMenu === 3 && "bg-[#8EC5FF]"}`}>
                휴지통
              </span>
            </div>
            <Divider align="Verticle" />
            <div className="grid grid-cols-[1fr_1fr_1.2fr_0.9fr_0.9fr_1fr_1fr] w-full gap-5 px-[1%]">
              <div className="col-span-2 flex gap-2">
                <div className="mainInput w-full">
                  <CommonDatePicker
                    id="startDate"
                    onClick={(r) =>
                      setDate((prev) => ({ ...prev, startDate: r }))
                    }
                    value={date.startDate}
                    title="일자"
                    colSize="30%"
                    arrowNo={false}
                  />
                </div>
                <span className="mainInput flex items-center font-bold text-[1rem]">
                  -
                </span>
                <div className="mainInput w-[65%]">
                  <CommonDatePicker
                    id="endDate"
                    onClick={(r) =>
                      setDate((prev) => ({ ...prev, endDate: r }))
                    }
                    value={date.endDate}
                    arrowNo={false}
                  />
                </div>
              </div>
              <div className="mainInput">
                <CommonDropDown
                  id="sendUser"
                  data={sitaa}
                  dropHeight="10rem"
                  header={commonHeader2}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: selectSitaa?.["CODE_CODE"],
                  }}
                  onClick={(r) => setSelectSitaa(r)}
                  title={selectMenu === 0 ? "보낸사람" : "받은메시지"}
                  find={true}
                  labelW="25%"
                />
              </div>
              <div className="mainInput">
                <CommonDropDown
                  id="eStatus"
                  data={edist}
                  dropHeight="10rem"
                  header={commonHeader2}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: selectEdist?.["CODE_CODE"],
                  }}
                  onClick={(r) => setSelectEdist(r)}
                  title="처리상태"
                  labelW="30%"
                />
              </div>
              <div className="mainInput">
                <CommonDropDown
                  id="group"
                  data={GROUPPING}
                  dropHeight="5rem"
                  header={commonHeader2}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: selectGroup?.["CODE_CODE"],
                  }}
                  onClick={(r) => {
                    setSelectGroup(r);
                  }}
                  title="정렬구분"
                  labelW="30%"
                />
              </div>
              <div className="col-span-2 row-span-2 flex flex-col gap-2">
                <div className="mainInput">
                  <CommonInput
                    id="toUser"
                    value={toUser}
                    label={selectMenu === 0 ? "FROM" : "TO"}
                    onChange={(v) => setToUser(v)}
                    labelW="25%"
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="fromEmail"
                    value={fromEmail}
                    label="EMAIL ( From )"
                    onChange={(v) => setFromEmail(v)}
                    labelW="25%"
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="toEmail"
                    value={toEmail}
                    label="EMAIL ( To )"
                    onChange={(v) => setToEmail(v)}
                    labelW="25%"
                  />
                </div>

                <textarea
                  className="w-full h-full bg-white p-[1rem] border border-gray-500 rounded-sm"
                  value={changeSitaMessage(sitaData)}
                  onChange={(e) => setSitaData(e.target.value)}
                />
              </div>
              <div className="col-span-5">
                {groupGrid.length === 0 ? (
                  <TableCust
                    tableId="grid"
                    body={grid}
                    header={gridHeader}
                    height="40rem"
                    onClick={(r) => {
                      setGridSelect(r);
                      getSitaMsg({ r: r });
                    }}
                    doubleClick={(r) =>
                      openModal({
                        array: [
                          {
                            id: "IFEDI0070",
                            name: "메시지 작성",
                            param: {
                              edi_guid: r["EDI_IO_GUID"],
                              gubn: "forward",
                            },
                          },
                        ],
                      })
                    }
                    changeValue={(i, k, v, r) => {
                      if (r) {
                        setChangeGrid({});
                        return;
                      }

                      setChangeGrid((prev) =>
                        setTableChange({
                          changeData: prev,
                          idx: i,
                          key: k,
                          value: v,
                        }),
                      );
                    }}
                    width="100%"
                  />
                ) : (
                  <TableCust
                    tableId="groupGrid"
                    body={groupGrid}
                    header={commonHeader3}
                    height="40rem"
                    width="100%"
                    onClick={(r) => {}}
                    childClick={(i) => {
                      setGroupGridSelect(i);
                      setDrGroupGridSelect({});
                      setDrGroupGridSelect2({});
                    }}>
                    {({ idx }) => {
                      return getDetail(idx);
                    }}
                  </TableCust>
                )}
              </div>
            </div>
          </div>
        </CommonContainer>
      </div>
    );
  },
);

export default SitaManage;
