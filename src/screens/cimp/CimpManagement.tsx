import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type {
  DefComp,
  MenuBtnDataType,
  MenuBtnType,
  PageHandle,
  RouteType,
  RowPrepType,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";
import { useDispatch } from "react-redux";
import { TableCust } from "../../comp/Table";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import { modalOpen, selectNav } from "../../slices/user";
import { CommonContainer, CommonTab } from "../../comp/Container";
import {
  checkEmail,
  getApi,
  getExcel,
  getInt,
  getMenu,
  getPgmInfo,
  getTableCHK,
  openModal,
  sendErr,
  sendLoading,
  sendSuc,
  setTableChange,
} from "../../Util/Util";
import { SchHeader } from "../../Util/Header";
import { CommonChk, CommonInput } from "../../comp/Input";
import { Btn, MenuBtn } from "../../comp/Btn";
import { confirmAsync } from "../../confirmService";

const AWB_SAMS = [
  { TEXT: "전체", VALUE: "" },
  { TEXT: "AWB", VALUE: "AWB" },
  { TEXT: "SAMS", VALUE: "SAMS" },
];

const AWB_SAMS_header: TableHeaderType[] = [
  { key: "TEXT", value: "", w: "", type: "STR" },
];

const FFMCnt = [
  { TEXT: "자동분할", VALUE: "9" },
  { TEXT: "1개 파일", VALUE: "1" },
];

const SITA_ADDR = [
  { TEXT: "( 선택 )", VALUE: "" },
  { TEXT: "FSU", VALUE: "" },
  { TEXT: "FWB", VALUE: "" },
  { TEXT: "FHL", VALUE: "" },
  { TEXT: "FFM", VALUE: "" },
  { TEXT: "한국세관", VALUE: "SELKTCR" },
  { TEXT: "Email", VALUE: "" },
];

const FSU_GROUP = [
  { TEXT: "( 선택 )", VALUE: "" },
  { TEXT: "전체", VALUE: "ALL" },
  { TEXT: "---FFM", VALUE: "FFM" },
  { TEXT: "---FWB", VALUE: "FWB" },
  { TEXT: "---FHL", VALUE: "FHL" },
  { TEXT: "-1-FOH", VALUE: "FOH" },
  { TEXT: "-2-RCT", VALUE: "RCT" },
  { TEXT: "-3-RCS", VALUE: "RCS" },
  { TEXT: "-4-DEP", VALUE: "DEP" },
  { TEXT: "-A----ARR", VALUE: "ARR" },
  { TEXT: "-B----RCF", VALUE: "RCF" },
  { TEXT: "-C----NFD", VALUE: "NFD" },
  { TEXT: "-D----DLV", VALUE: "DLV" },
  { TEXT: "-E----DIS", VALUE: "DIS" },
  { TEXT: "-F----TFD", VALUE: "TFD" },
];

const Grid1Header: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "MASTER_AIR_WAY_BILL_NO", value: "MAWB No", w: "8rem", sum: 0 },
  { key: "ORIGIN_CODE", value: "ORGN", w: "5rem" },
  { key: "DESTINATION_CODE", value: "DEP", w: "5rem" },
  {
    key: "MFST_NO_OF_PACKAGE",
    value: "Docs PCS",
    w: "5rem",
    sum: 0,
    type: "NUM",
  },
  {
    key: "MFST_NET_WEIGHT",
    value: "Docs WT",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "ACCEPTED_NO_OF_PACKAGE",
    value: "Rcvd PCS",
    w: "5rem",
    sum: 0,
    type: "NUM",
  },
  {
    key: "ACCEPTED_NET_WEIGHT",
    value: "Rcvd WT",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  {
    key: "WORK_NO_OF_PACKAGE",
    value: "B/U PCS",
    w: "5rem",
    sum: 0,
    type: "NUM",
  },
  {
    key: "WORK_NET_WEIGHT",
    value: "B/U WT",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
  { key: "MIG_VERSION", value: "FWB Ver", w: "5rem" },
  { key: "FWB_FLAG", value: "FWB Save", w: "5rem" },
  { key: "FWB_CREATOR", value: "FWB DAT.RCV", w: "8rem" },
  { key: "MAPIN_CNT", value: "FWB Cnt", w: "5rem", sum: 0, type: "NUM" },
  { key: "FHL_CNT", value: "FHL Cnt", w: "5rem", sum: 0, type: "NUM" },

  { key: "FOH_CNT", value: "FOH", w: "5rem", sum: 0, type: "NUM" },
  { key: "RCT_CNT", value: "RCT", w: "5rem", sum: 0, type: "NUM" },
  { key: "RCS_CNT", value: "RCS", w: "5rem", sum: 0, type: "NUM" },
  { key: "DEP_CNT", value: "DEP", w: "5rem", sum: 0, type: "NUM" },

  { key: "ARR_CNT", value: "ARR", w: "5rem", sum: 0, type: "NUM" },
  { key: "RCF_CNT", value: "RCF", w: "5rem", sum: 0, type: "NUM" },
  { key: "NFD_CNT", value: "NFD", w: "5rem", sum: 0, type: "NUM" },
  { key: "DLV_CNT", value: "DLV", w: "5rem", sum: 0, type: "NUM" },
  { key: "DIS_CNT", value: "DIS", w: "5rem", sum: 0, type: "NUM" },
];

const GridUldHeader: TableHeaderType[] = [
  { key: "DROP", value: "", w: "3rem" },
  { key: "ULD_NO", value: "ULD No", w: "8rem", sum: 0 },
  { key: "ORIGIN_CODE", value: "ORGN", w: "5rem" },
  { key: "DESTINATION_CODE", value: "DEP", w: "5rem" },
  {
    key: "BUP_FLAG",
    value: "BUP",
    w: "3.5rem",
    option: { type: "CHK" },
    read: true,
  },
  {
    key: "BULK_FLAG",
    value: "BULK",
    w: "3.5rem",
    option: { type: "CHK" },
    read: true,
  },
  { key: "CONTOUR", value: "CONTOUR", w: "5rem" },
  { key: "ULD_STATUS", value: "ULD 상태", w: "9rem" },
  {
    key: "MFST_WEIGHT",
    value: "SAMS MFST WT",
    w: "5rem",
    type: "DOUBLE",
    sum: 1,
  },
  {
    key: "NET_WEIGHT",
    value: "Build/Up WT",
    w: "5rem",
    type: "DOUBLE",
    sum: 1,
  },
  {
    key: "SCALED_WEIGHT",
    value: "Gross WT",
    w: "5rem",
    type: "DOUBLE",
    sum: 1,
  },
  { key: "TARE_WEIGHT", value: "Tare WT", w: "5rem", type: "DOUBLE", sum: 1 },
  {
    key: "WEIGHT_DIFFERENCE",
    value: "WT DIFF",
    w: "5rem",
    type: "DOUBLE",
    sum: 1,
  },
];

const GridHouseHeader: TableHeaderType[] = [
  { key: "MAWB_NO_DISP", value: "MAWB No", w: "8rem" },
  { key: "HAWB_SERIAL_NO", value: "HAWB No", w: "8rem", sum: 0 },
  { key: "ORG_CODE", value: "출발지", w: "5rem" },
  { key: "DEST_CODE", value: "도착지", w: "5rem" },
  { key: "NO_OF_PIECES", value: "수량", w: "5rem", sum: 0, type: "NUM" },
  { key: "WEIGHT", value: "중량", w: "5rem", sum: 1, type: "DOUBLE" },
  { key: "MFSC_DESC_GOODS", value: "화물", w: "15rem" },
];

const GridUldDetailHeader: TableHeaderType[] = [
  { key: "MASTER_AIR_WAY_BILL_NO", value: "MAWB No", w: "8rem" },
  {
    key: "MFST_NO_OF_PACKAGE",
    value: "MFST 수량",
    w: "5rem",
    sum: 0,
    type: "NUM",
  },
  {
    key: "MFST_NET_WEIGHT",
    value: "MFST 중량 *",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
    option: { type: "WRITE" },
  },
  {
    key: "WORK_NO_OF_PACKAGE",
    value: "작업 수량",
    w: "5rem",
    sum: 0,
    type: "NUM",
  },
  {
    key: "WORK_NET_WEIGHT",
    value: "작업 중량",
    w: "5rem",
    sum: 1,
    type: "DOUBLE",
  },
];

const Grid3Header: TableHeaderType[] = [
  { key: "CHK", value: "", w: "3rem" },
  { key: "MASTER_AIR_WAY_BILL_NO", value: "MAWB No.", w: "8rem", sum: 0 },
  { key: "HOUSE_AIR_WAY_BILL_NO", value: "HAWB No.", w: "8rem" },
  { key: "MIG_CODE", value: "MESSAGE", w: "6rem" },
  { key: "MIG_VERSION", value: "VER.", w: "4rem" },

  { key: "STATUS", value: "Status", w: "5rem" },
  { key: "CREATED_TIME", value: "작성 일시", w: "10rem" },
  { key: "COMPLETE_TIME", value: "완료 일시", w: "10rem" },
  { key: "FILE_SIZE", value: "SIZE/3500", w: "5rem" },
];

const PRINT_DATA: MenuBtnDataType[] = [
  { KEY: "M", VALUE: "Manifest" },
  { KEY: "U", VALUE: "ULD Scale List" },
  { KEY: "B", VALUE: "Build-Up Form" },
  { KEY: "A", VALUE: "MAWB" },
];

const CimpManagement = forwardRef<PageHandle, DefComp>(
  ({ outParam, param, pgmId, sch }, ref) => {
    const dispatch = useDispatch();

    const [schArray, setSchArray] = useState<TableRow[]>([]);
    const [schSelect, setSchSelect] = useState<TableRow | null>(null);
    const [actTab, setActTab] = useState(0);
    const [subFltDate, setSubFltDate] = useState(sch.fltDate);

    // grid1
    const [grid1, setGrid1] = useState<TableRow[]>([]);
    const [grid1Header, setGrid1Header] = useState(Grid1Header);
    const [grid1Select, setGrid1Select] = useState<TableRow | null>(null);
    const [grid1Change, setGrid1Change] = useState<Record<number, TableRow>>(
      {},
    );

    //gridUld
    const [gridUld, setGridUld] = useState<TableRow[]>([]);

    //gridHouse
    const [gridHouse, setGridHouse] = useState<TableRow[]>([]);

    //gridDetail
    const [gridDetail, setGridDetail] = useState<Record<number, TableRow[]>>(
      {},
    );
    const [changeGridDetail, setChangeGridDetail] = useState<
      Record<number, Record<number, TableRow>>
    >({});

    const [awbSelect, setAwbSelect] = useState<TableRow>(AWB_SAMS[0]);
    const [workChk, setWorkChk] = useState<boolean>(false);

    const [fsuTypeSelect, setFsuTypeSelect] = useState<TableRow>(FSU_GROUP[0]);
    const [ffmCntSelect, setFfmCntSelect] = useState<TableRow>(FFMCnt[0]);

    //SITA_Address
    const [sitaAddr, setSitaAddr] = useState<TableRow[]>(SITA_ADDR);
    const [sitaAddrSelect, setSitaAddrSelect] = useState<TableRow>(sitaAddr[0]);
    const [sitaAddrStr, setSitaAddrStr] = useState<string>("");

    //grid3
    const [grid3, setGrid3] = useState<TableRow[]>([]);
    const [changeGrid3, setChangeGrid3] = useState<Record<number, TableRow>>(
      {},
    );

    //sitaData
    const [sitaData, setSitaData] = useState<string>("");

    const [fwbRoute, setFwbRoute] = useState<RouteType>();

    useImperativeHandle(ref, () => ({
      onModalPayload(payload: TableRow) {
        if (payload["SEND SCREEN"]) {
          const findObj = FSU_GROUP.find(
            (r) => "FSU_" + r["VALUE"] === payload["SEND SCREEN"],
          );
          if (findObj) {
            setFsuTypeSelect((prev) => {
              if (prev === findObj) {
                getCimpb010_005_1(findObj);
                return prev;
              } else {
                return findObj;
              }
            });
          }
        }
        if (payload["SEND"]) {
          if (payload["SEND"] === "COMP") {
            getCimpb010_005_1(fsuTypeSelect);
          }
        }
        if (payload["SAVE"]) {
          getCimpb010_005_1(fsuTypeSelect);
        }
      },
    }));
    useEffect(() => {
      const load = async () => {
        const fwbRt = await getPgmInfo("WMAWB0011");
        if (fwbRt) setFwbRoute(fwbRt);
      };
      load();
    }, []);

    useEffect(() => {
      if (sitaAddrSelect["VALUE"]) {
        setSitaAddrStr(sitaAddrSelect["VALUE"]);
      } else {
        setSitaAddrStr("");
      }
    }, [sitaAddrSelect]);

    useEffect(() => {
      if (sch.schSid > 0) {
        getSch003(sch.fltDate, sch.inout);
        setSubFltDate(sch.fltDate);
      }
    }, [sch]);

    useEffect(() => {
      if (sch.fltDate !== subFltDate) {
        getSch003(subFltDate, sch.inout);
      }
    }, [subFltDate, sch.inout]);

    async function get001_002() {
      sendLoading(true);
      await getCimpb010_001();
      await getCimpb010_002();
      sendLoading(false);
    }

    useEffect(() => {
      if (schSelect?.["FLIGHT_NO"]) {
        get001_002();
      }
    }, [schSelect, awbSelect, workChk]);

    function setGridClear() {
      setGrid1([]);
      setGridUld([]);
      setGridHouse([]);
      setGrid1Select(null);
    }

    useEffect(() => {
      setGridHouse([]);
      if (grid1Select?.["MASTER_AIR_WAY_BILL_NO"]) {
        getCimpb010_004();
      }
    }, [grid1Select?.["MASTER_AIR_WAY_BILL_NO"]]);

    useEffect(() => {
      if (schSelect?.["SCHEDULE_SID"]) {
        setSitaAddr((prev) =>
          prev.map((item) => {
            const tmp = item["TEXT"];
            if (tmp === "FSU") {
              item["VALUE"] = schSelect["FSU_SITA_ADDRESS"];
            } else if (tmp === "FWB") {
              item["VALUE"] = schSelect["FWB_SITA_ADDRESS"];
            } else if (tmp === "FHL") {
              item["VALUE"] = schSelect["FHL_SITA_ADDRESS"];
            } else if (tmp === "FFM") {
              item["VALUE"] = schSelect["FFM_SITA_ADDRESS"];
            } else if (tmp === "Email") {
              item["VALUE"] = schSelect["DEFAULT_EMAIL_ADDRESS"];
            }

            return item;
          }),
        );
      }
    }, [schSelect]);

    useEffect(() => {
      if (fsuTypeSelect["VALUE"]) {
        if (fsuTypeSelect["VALUE"] !== "") {
          getCimpb010_005_1(fsuTypeSelect);
        }
      }
    }, [fsuTypeSelect, schSelect]);

    useEffect(() => {
      setGrid1Header((prev) =>
        prev.map((item) => {
          if (sch.inout === "I") {
            if (
              item.key === "FOH_CNT" ||
              item.key === "RCT_CNT" ||
              item.key === "RCS_CNT" ||
              item.key === "DEP_CNT"
            ) {
              item.disable = true;
            } else {
              item.disable = undefined;
            }
          } else {
            if (
              item.key === "ARR_CNT" ||
              item.key === "RCF_CNT" ||
              item.key === "NFD_CNT" ||
              item.key === "DLV_CNT" ||
              item.key === "DIS_CNT"
            ) {
              item.disable = true;
            } else {
              item.disable = undefined;
            }
          }
          return item;
        }),
      );
    }, [sch.inout]);
    async function getCimpb010_005_1(row?: TableRow) {
      var str = "";
      if (!schSelect) {
        sendErr("선택한 스케줄 정보가없습니다.");
        return;
      }
      if (row) {
        if (row["VALUE"] === "ALL") {
          FSU_GROUP.forEach((item) => {
            if (item["VALUE"] !== "" && item["VALUE"] !== "ALL") {
              str += item["VALUE"] + ";";
            }
          });
        } else {
          str = row["VALUE"];
        }
      } else {
        if (fsuTypeSelect["VALUE"] === "ALL") {
          FSU_GROUP.forEach((item) => {
            if (item["VALUE"] !== "" && item["VALUE"] !== "ALL") {
              str += item["VALUE"] + ";";
            }
          });
        } else {
          str = fsuTypeSelect["VALUE"];
        }
      }

      sendLoading(true);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/getCimpb010_005_1?schSid=${schSelect["SCHEDULE_SID"]}&gubn=${str}`,
        pgmId: pgmId,
      });
      if (res.ok) {
        if (res.data) {
          sendLoading(false);
          setGrid3(res.data[0]);
          return;
        }
      }
      setGrid3([]);
      sendLoading(false);
    }

    const getSch003 = useCallback(
      async (fltDate: string, inout: string) => {
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "AUTH",
          method: "GET",
          url: `/user/getSch003?fltDate=${fltDate}&inoutFlag=${inout}`,
          pgmId: pgmId,
        });
        if (res.ok) {
          if (res.data?.[0]) {
            setGridClear();
            setSchArray(res.data[0]);
            const tmp = res.data[0].find(
              (r) => r["SCHEDULE_SID"] === sch.schSid,
            );
            if (tmp) {
              setSchSelect(tmp);
            } else {
              setSchSelect(null);
            }
          }
        }
      },
      [sch.schSid],
    );

    async function getCimpb010_001() {
      const param = new Map<string, string>();
      if (!schSelect) {
        sendErr("선택한 스케줄 정보가없습니다.");
        return;
      }
      param.set("schSid", schSelect["SCHEDULE_SID"]);
      param.set("awbSams", awbSelect["VALUE"]);
      param.set("workChk", workChk ? "Y" : "N");
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "POST",
        url: `/cimp/getCimpb010_001`,
        params: param,
        pgmId: pgmId,
      });
      if (res.ok) {
        if (res.data) {
          setGrid1(res.data[0]);
          return;
        }
      }
      setGrid1([]);
    }

    async function getCimpb010_002() {
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/getCimpb010_002?schSid=${
          schSelect?.["SCHEDULE_SID"] || "0"
        }`,
        pgmId: pgmId,
      });
      if (res.ok) {
        if (res.data) {
          setGridUld(res.data[0]);
          return;
        } else {
        }
      }
      setGridUld([]);
    }

    async function getCimpb010_004() {
      const mawb = grid1Select?.["MASTER_AIR_WAY_BILL_NO"];
      if (!mawb) {
        sendErr("선택한 화물정보가 없습니다.");
        return;
      }
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/getCimpb010_004?schSid=${
          schSelect?.["SCHEDULE_SID"] || "0"
        }&mawb=${mawb}`,
        pgmId: pgmId,
      });
      if (res.ok) {
        if (res.data) {
          if (res.data[0].length === 0) {
            sendErr("FHL이 없습니다.");
          }
          setGridHouse(res.data[0]);
          return;
        }
      }
      setGridHouse([]);
    }

    async function getCimpb010_003({ idxArray }: { idxArray: number[] }) {
      idxArray.forEach((n) => {
        setChangeGridDetail((prev) => ({ ...prev, [n]: {} }));
      });
      await Promise.all(
        idxArray.map(async (idx) => {
          const findObj = gridUld.find((_, i) => i === idx);
          if (findObj) {
            const sid = findObj["OPERATION_ULD_SID"] || "0";
            const uldNo = findObj["ULD_NO"];

            if (!sid || !uldNo) {
              return;
            }

            await getCimpb010_003_1({ idx: idx, uldNo: uldNo, uldSid: sid });
          }
        }),
      );
    }

    async function getCimpb010_003_1({
      idx,
      uldNo,
      uldSid,
    }: {
      uldSid: number;
      uldNo: string;
      idx: number;
    }) {
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/getCimpb010_003?schSid=${
          schSelect?.["SCHEDULE_SID"] || "0"
        }&uldSid=${uldSid}&uldNo=${uldNo}`,
        pgmId: pgmId,
      });
      if (res.ok) {
        if (res.data) {
          setGridDetail((prev) => ({ ...prev, [idx]: res.data?.[0] || [] }));
        }
      }
    }

    async function getSitaMsg({ guid }: { guid: string }) {
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

    async function setEdiDel_021() {
      if (changeGrid3) {
        sendLoading(true);
        const param = new Map<string, any>();
        Object.keys(changeGrid3).forEach((i) => {
          const idx = parseInt(i);
          if (changeGrid3[idx]?.["CHK"] === "Y") {
            const obj = grid3.find((_, i) => i === idx);
            if (obj) {
              param.set(i, obj["EDI_IO_GUID"]);
            }
          }
        });

        if (param.size === 0) {
          sendErr("선택한 항목이 없습니다.");
          return;
        }

        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "CIMP",
          method: "POST",
          url: `/cimp/setEdiDel_021`,
          params: param,
          pgmId: pgmId,
        });
        if (res.ok) {
          await getCimpb010_005_1(fsuTypeSelect);
        }
        sendLoading(false);
      } else {
        sendErr("선택한 항목이 없습니다.");
      }
    }

    async function setCimpExport010_011({ idx }: { idx: number }) {
      const idxArray: number[] = [idx];
      if (gridDetail[idx]) {
        const data = Object.keys(changeGridDetail[idx]).reduce(
          (acc, key) => {
            const changeIdx = Number(key); // parseInt 대신 Number/+
            const originObj = gridDetail[idx].find(
              (_, originI) => originI === changeIdx,
            );

            if (!originObj) return acc;

            const mfstWt = changeGridDetail[idx][changeIdx]["MFST_NET_WEIGHT"];
            if (!mfstWt) return acc;

            acc.push({
              cargoSid: originObj["CARGO_CONTROL_SID"] || "0",
              uldSid: originObj["OPERATION_ULD_SID"] || "0",
              mfstWt,
            });

            return acc;
          },
          [] as Array<{ cargoSid: string; uldSid: string; mfstWt: string }>,
        );

        if (data.length > 0) {
          const param = new Map<string, any>();
          data.forEach((v, i) => param.set(i.toString(), v));
          await getApi<Record<number, TableRow[]>>({
            baseUrl: "CIMP",
            method: "POST",
            url: `/cimp/setCimpExport010_011`,
            params: param,
            pgmId: pgmId,
          });
        }

        await getCimpb010_003({ idxArray: idxArray });
      }
    }

    function fsuBtnClick(type: string, arrayType: "ONE" | "MULTI") {
      const array: number[] = [];
      const tmpMawb: string[] = [];
      if (!schSelect?.["SCHEDULE_SID"] || !schSelect?.["FSU_SITA_ADDRESS"]) {
        sendErr("스케줄을 선택해주세요.");
        return;
      }
      if (arrayType === "MULTI") {
        if (grid1Change) {
          Object.keys(grid1Change).forEach((r, i) => {
            if (grid1Change[i]["CHK"]) {
              if (grid1Change[i]["CHK"]) {
                array.push(i);
              }
            }
          });
        }
        if (
          !(
            grid1Select?.["MASTER_AIR_WAY_BILL_NO"] ||
            (grid1Change && array.length > 0)
          )
        ) {
          sendErr("선택한 행이 없습니다.");
          return;
        }

        if (!(grid1Change && array.length > 0)) {
          tmpMawb.push(grid1Select?.["MASTER_AIR_WAY_BILL_NO"]);
        } else {
          array.forEach((item) => {
            grid1.forEach((r, i) => {
              if (i === item) {
                tmpMawb.push(r["MASTER_AIR_WAY_BILL_NO"]);
              }
            });
          });
        }
      } else {
        if (grid1Select === null) {
          sendErr("선택한 행이 없습니다.");
          return;
        }
        tmpMawb.push(grid1Select?.["MASTER_AIR_WAY_BILL_NO"]);
      }

      const tmp: RouteType = {
        param: {
          type: type,
          mawb_no: tmpMawb,
          schedule_sid: schSelect["SCHEDULE_SID"],
          sita_addr: schSelect["FSU_SITA_ADDRESS"],
        },
        PROGRAM_ID: "FSU_" + type.toUpperCase(),
        PROGRAM_NAME: `FSU / ${type.toUpperCase()}`,
      };

      dispatch(modalOpen({ route: [tmp] }));
    }

    async function sendMsg() {
      var type = sitaAddrSelect["TEXT"];

      if (type === "한국세관") {
        type = "CUSTOMS";
      } else if (
        type === "FWB" ||
        type === "FSU" ||
        type === "FHL" ||
        type === "FFM" ||
        type === "Email"
      ) {
        //통과
      } else {
        sendErr(type + "\n 해당 타입은 전송 불가능 타입입니다.");
        return;
      }

      if (!changeGrid3 || Object.keys(changeGrid3).length === 0) {
        sendErr("보낼 메시지를 선택해주세요.");
        return;
      }

      const conRet = await confirmAsync({
        title: "SITA MSG",
        message: `MSG를 ${
          sitaAddrStr && sitaAddrStr + "수신자로 변경하여 "
        }송신합니까?`,
      });

      if (!conRet) {
        return;
      }

      var guidArray: string[] = [];
      var mawbArray: string[] = [];
      Object.keys(changeGrid3).forEach((r, i) => {
        if (changeGrid3[getInt(r)]["CHK"]) {
          if (changeGrid3[getInt(r)]["CHK"] === true) {
            guidArray.push(grid3[getInt(r)]["EDI_IO_GUID"]);
            mawbArray.push(grid3[getInt(r)]["MASTER_AIR_WAY_BILL_NO"]);
          }
        }
      });

      if (guidArray.length === 0 || mawbArray.length === 0) {
        sendErr("선택한 값이 없습니다.");
        return;
      }

      if (type === "Email") {
        const spEmail = sitaAddrStr.split(";").filter((item) => item !== "");

        var flag = false;

        spEmail.forEach((item) => {
          const bool = checkEmail(item);
          if (!bool) {
            flag = true;
          }
        });

        if (flag) {
          sendErr("이메일 형식이 맞지않습니다.");
          return;
        }

        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "CIMP",
          method: "GET",
          url: `/cimp/sendSitaEmail?guid=${guidArray}&migType=${fsuTypeSelect?.["VALUE"]}&mawbArray=${mawbArray}&recvEmail=${spEmail}`,
          pgmId: pgmId,
          sucFlag: true,
        });

        sendLoading(false);
      } else {
        sendLoading(true);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "CIMP",
          method: "GET",
          url: `/fsu/sendSitaMsg?guid=${guidArray}&type=${type}&sitaAddr=${sitaAddrStr}`,
          pgmId: pgmId,
        });

        if (res.ok) {
          await getCimpb010_005_1();
        }
        sendLoading(false);
      }
    }

    async function ffmSave() {
      if (schSelect === null || !schSelect["SCHEDULE_SID"]) {
        sendErr("스케줄 정보가 없습니다. FFM생성할 수 없습니다.");
        return;
      }

      const conRet = await confirmAsync({
        title: "FFM",
        message: `FFM 생성합니까?`,
      });

      if (!conRet) {
        return;
      }

      sendLoading(true);
      const ret = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/setFfm?schSid=${schSelect["SCHEDULE_SID"]}&sitaAddr=${schSelect["FFM_SITA_ADDRESS"]}&ffmCnt=${ffmCntSelect?.["VALUE"]}`,
        pgmId: pgmId,
      });
      if (ret) {
        sendSuc("전송완료");
      }
      sendLoading(false);
    }

    async function ffmDestSave() {
      if (schSelect === null || !schSelect["SCHEDULE_SID"]) {
        sendErr("스케줄 정보가 없습니다. FFM(VIA+DEST) 수 없습니다.");
        return;
      }

      const conRet = await confirmAsync({
        title: "FFM(VIA+DEST)",
        message: `FFM(VIA+DEST) 생성합니까?`,
      });

      if (!conRet) {
        return;
      }

      sendLoading(true);
      const ret = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/setFfmUldDest?schSid=${schSelect["SCHEDULE_SID"]}&sitaAddr=${schSelect["FFM_SITA_ADDRESS"]}&ffmCnt=${ffmCntSelect?.["VALUE"]}`,
        pgmId: pgmId,
        sucFlag: true,
      });
      if (ret) {
        sendSuc("전송완료");
      }
      sendLoading(false);
    }

    async function ffmBulkSave() {
      if (schSelect === null || !schSelect["SCHEDULE_SID"]) {
        sendErr("스케줄 정보가 없습니다. FFM(BULK) 수 없습니다.");
        return;
      }

      const conRet = await confirmAsync({
        title: "FFM(BULK)",
        message: `FFM(BULK) 생성합니까?`,
      });

      if (!conRet) {
        return;
      }

      sendLoading(true);
      const ret = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "GET",
        url: `/cimp/setFfmBulk?schSid=${schSelect["SCHEDULE_SID"]}&sitaAddr=${schSelect["FFM_SITA_ADDRESS"]}&ffmCnt=${ffmCntSelect?.["VALUE"]}`,
        pgmId: pgmId,
        sucFlag: true,
      });
      if (ret) {
        sendSuc("전송완료");
      }
      sendLoading(false);
    }

    function printClick(type: string) {
      if (!schSelect?.["SCHEDULE_SID"]) {
        sendErr("스케줄을 선택하여주세요");
        return;
      }
      switch (type) {
        case "M": {
          const val = getTableCHK({
            key: "CARGO_CONTROL_SID",
            body: grid1,
            row: grid1Change || {},
          });
          const tmp: RouteType[] = [
            {
              PROGRAM_ID: "EXPORT_P010",
              PROGRAM_NAME: "Manifest",
              param: {
                cargoSidArray: val,
                schedule_sid: schSelect["SCHEDULE_SID"],
              },
            },
            { PROGRAM_ID: "MSITP010", PROGRAM_NAME: "Print", param: {} },
          ];
          dispatch(modalOpen({ route: tmp }));

          return;
        }
        default:
          sendErr("선택한 메뉴는 없는 메뉴입니다.");
          return;
      }
    }

    return (
      <div className="p-[1.5rem] flex flex-col gap-5">
        <div className="flex gap-5">
          <CommonContainer title="FSB ( FLT SKD Board )" width="30rem">
            <div className="flex items-center justify-center gap-5">
              <div className="flex justify-center mainInput">
                <CommonDatePicker
                  value={subFltDate}
                  onClick={(v) => setSubFltDate(v)}
                  id="schDate"
                />
              </div>
              <div className="flex justify-center mainInput">
                <CommonDropDown
                  id="sch"
                  header={SchHeader}
                  data={schArray}
                  dropHeight="10rem"
                  inputKey={{
                    key: "SCHEDULE_SID",
                    showKey: "2",
                    value: schSelect?.["SCHEDULE_SID"],
                  }}
                  onClick={(v) => {
                    setSchSelect(v);
                  }}
                  find={true}
                />
              </div>
            </div>
          </CommonContainer>

          <CommonContainer title="SITA ADDR" width="40rem">
            <div className="flex items-center justify-center gap-1 py-[0.2%]">
              <div className="w-[18rem] mainInput flex justify-center px-[1em]">
                <CommonInput
                  id="fsu"
                  value={schSelect?.["FSU_SITA_ADDRESS"] || ""}
                  read={true}
                  label="FSU"
                  labelW="15%"
                />
              </div>
              <div className="w-[18rem] mainInput flex justify-center px-[1em]">
                <CommonInput
                  id="ffm"
                  value={schSelect?.["FFM_SITA_ADDRESS"] || ""}
                  read={true}
                  label="FFM"
                  labelW="15%"
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer width="40rem">
            <div className="flex flex-col gap-2 py-[0.2%]">
              <div className="flex items-center gap-1">
                <Btn
                  txt="SEARCH"
                  onClick={() => {
                    if (schSelect?.["SCHEDULE_SID"]) {
                      get001_002();
                    } else {
                      sendErr("스케줄을 선택해주세요");
                    }
                  }}
                  width="5rem"
                  type="SEARCH"
                />
                <MenuBtn
                  data={PRINT_DATA}
                  txt="PRINT"
                  type="PRINT"
                  onClick={(r) => {
                    printClick(r);
                  }}
                />
              </div>

              <div className="flex items-center gap-1">
                <Btn
                  txt="MAWB"
                  onClick={() => {
                    if (grid1.length > 0) {
                      getExcel({
                        body: grid1,
                        header: grid1Header,
                        fileName: "MAWB",
                      });
                    } else {
                      sendErr("데이터가 없습니다.");
                    }
                  }}
                  width="5.5rem"
                  type="EXCEL"
                />
                <Btn
                  txt="ULD"
                  onClick={() => {
                    if (gridUld.length > 0) {
                      getExcel({
                        body: gridUld,
                        header: GridUldHeader,
                        fileName: "ULD",
                      });
                    } else {
                      sendErr("데이터가 없습니다.");
                    }
                  }}
                  width="5rem"
                  type="EXCEL"
                />
                <Btn
                  txt="HAWB"
                  onClick={() => {
                    if (gridHouse.length > 0) {
                      getExcel({
                        body: gridHouse,
                        header: GridHouseHeader,
                        fileName: "HAWB",
                      });
                    } else {
                      sendErr("데이터가 없습니다.");
                    }
                  }}
                  width="5.5rem"
                  type="EXCEL"
                />
                <Btn
                  txt="SITA MSG"
                  onClick={() => {
                    if (grid3.length > 0) {
                      getExcel({
                        body: grid3,
                        header: Grid3Header,
                        fileName: "Message",
                      });
                    } else {
                      sendErr("데이터가 없습니다.");
                    }
                  }}
                  width="6.5rem"
                  type="EXCEL"
                />
              </div>
            </div>
          </CommonContainer>
        </div>
        <div className="flex gap-5">
          <CommonContainer
            title="Cargo List"
            childrenTitle={
              <div className="flex items-center ml-[5rem] gap-10">
                <div className="mainInput w-[6.5rem]">
                  <CommonDropDown
                    data={AWB_SAMS}
                    dropHeight="7rem"
                    header={AWB_SAMS_header}
                    inputKey={{
                      key: "VALUE",
                      showKey: "0",
                      value: awbSelect["VALUE"],
                    }}
                    id="awbSams"
                    onClick={(v) => {
                      setAwbSelect(v);
                    }}
                  />
                </div>
                <div className="mainInput">
                  <CommonChk
                    id="workChk"
                    value={workChk}
                    onChange={(v) => setWorkChk(v)}
                    title={"B/U PCS > 0"}
                    bg="transparent"
                    textColor="#3D3D3D"
                  />
                </div>
                <div className="flex gap-2 items-center mainInput">
                  <div className="size-3 bg-[#FFA500]"></div>
                  <span>FWB(Docs.PCS)/B/U PCS 불일치</span>
                </div>
                <div className="flex gap-2 items-center mainInput">
                  <div className="size-3 bg-[#D4E098]"></div>
                  <span>Non-ICN DEP FLT</span>
                </div>
                <div className="flex gap-2 items-center mainInput">
                  <div className="size-3 bg-[#AEC8CA]"></div>
                  <span>OFFLOAD 건</span>
                </div>
              </div>
            }>
            <div className="flex gap-2 px-[1rem]">
              <div className="w-[70rem]">
                <TableCust
                  tableId="grid1"
                  body={grid1}
                  header={grid1Header}
                  height="30rem"
                  width="70rem"
                  fixCount={2}
                  changeValue={(i, k, v, r) => {
                    if (r) {
                      setGrid1Change({});
                      return;
                    }
                    setGrid1Change((prev) =>
                      setTableChange({
                        changeData: prev,
                        idx: i,
                        key: k,
                        value: v,
                      }),
                    );
                  }}
                  onClick={(r) => {
                    setGrid1Select(r);
                  }}
                  doubleClick={(r) => {
                    const path = getMenu("MSG040");
                    if (path) {
                      dispatch(
                        selectNav({
                          ...path,
                          param: {
                            mawb_no: r["MASTER_AIR_WAY_BILL_NO"],
                            schedule_sid: schSelect?.["SCHEDULE_SID"] || "0",
                          },
                        }),
                      );
                    } else {
                      sendErr("권한이 없습니다.");
                    }
                  }}
                  onRowPrepared={(r, i) => {
                    const cellTmp: Record<string, string> = {};

                    const rowTmp: RowPrepType = {};

                    const mfstPcs = r["MFST_NO_OF_PACKAGE"];
                    const workPcs = r["WORK_NO_OF_PACKAGE"];
                    const offFlag = r["OFFLOAD_FLAG"];
                    const originCode = r["ORIGIN_CODE"];
                    const destCode = r["DESTINATION_CODE"];

                    if (workPcs != mfstPcs) {
                      cellTmp["CHK"] = "bg-[#FFA500]";
                    }
                    if (originCode != "ICN" && destCode != "ICN") {
                      rowTmp.lines = "bg-[#D4E098]";
                    }
                    if (offFlag > 0) {
                      rowTmp.lines = "bg-[#AEC8CA]";
                    }

                    if (originCode === "MAA") {
                      rowTmp.lines = "bg-[#D4E098]";
                    }

                    rowTmp.cells = cellTmp;

                    return rowTmp;
                  }}
                  onCustumizeText={(k, v) => {
                    if (k === "MASTER_AIR_WAY_BILL_NO") {
                      const fri = String(v).substring(0, 3);
                      const last = String(v).substring(3);
                      return fri + " - " + last;
                    }

                    return v;
                  }}
                  rightMenu={[{ key: "OLD", value: "구 FWB" }]}
                  rightClick={(k, r) => {
                    if (fwbRoute && r && k === "OLD") {
                      dispatch(
                        selectNav({
                          ...fwbRoute,
                          param: {
                            cargo_control_sid: r["CARGO_CONTROL_SID"],
                            schedule_sid: schSelect?.["SCHEDULE_SID"],
                            mawb_no: r["MASTER_AIR_WAY_BILL_NO"],
                            progress_guid: r["PROGRESS_GUID"],
                            sita_addr: schSelect?.["DEFAULT_SITA_ADDRESS"],
                            email_addr: schSelect?.["DEFAULT_EMAIL_ADDRESS"],
                          },
                        }),
                      ); //MASTER_AIR_WAY_BILL_NO;PROGRESS_GUID
                      return;
                    }

                    sendErr("알 수 없는 메뉴입니다.");
                  }}
                />
              </div>
              <div>
                <CommonTab
                  active={actTab}
                  setActive={(v) => setActTab(v)}
                  tabs={["ULD LIST", "FHL"]}
                  width="27rem"
                  height="30rem">
                  <TableCust
                    tableId="gridUld"
                    body={gridUld}
                    header={GridUldHeader}
                    height="27.3rem"
                    width="27rem"
                    fixCount={2}
                    onClick={(r) => {}} //기능없음
                    childClick={(i) => {
                      getCimpb010_003({ idxArray: i });
                    }}>
                    {({ idx }) => {
                      if (gridDetail[idx]) {
                        return (
                          <div className="p-[1rem] flex flex-col gap-2">
                            <div className="flex items-center justify-start">
                              <Btn
                                onClick={() => {
                                  setCimpExport010_011({ idx: idx });
                                }}
                                txt="SAVE"
                                type="SAVE"
                              />
                            </div>
                            <TableCust
                              tableId={`uldDetail${idx}`}
                              key={idx}
                              body={gridDetail[idx]}
                              header={GridUldDetailHeader}
                              height="10rem"
                              width="28.2rem"
                              onClick={(r) => {}}
                              changeValue={(i, k, v, r) => {
                                if (r) {
                                  setChangeGridDetail((prev) => ({
                                    ...prev,
                                    [idx]: {},
                                  }));
                                  return;
                                }
                                setChangeGridDetail((prev) => ({
                                  ...prev,
                                  [idx]: setTableChange({
                                    changeData: prev[idx],
                                    idx: i,
                                    key: k,
                                    value: v,
                                  }),
                                }));
                              }}
                              onCustumizeText={(k, v) => {
                                const fri = String(v).substring(0, 3);
                                const last = String(v).substring(3);

                                if (k === "MASTER_AIR_WAY_BILL_NO") {
                                  return fri + " - " + last;
                                }

                                return v;
                              }}
                            />
                          </div>
                        );
                      } else {
                        return null;
                      }
                    }}
                  </TableCust>
                  <TableCust
                    tableId="gridHouse"
                    body={gridHouse}
                    header={GridHouseHeader}
                    height="27.3rem"
                    width="29rem"
                    fixCount={2}
                    onClick={(r) => {}}
                    doubleClick={(r) => {
                      const path = getMenu("MSG050");
                      if (path) {
                        dispatch(
                          selectNav({
                            ...path,
                            param: {
                              mawb_no: r["MAWB_NO"],
                              schedule_sid: schSelect?.["SCHEDULE_SID"] || "0",
                              sita_addr: schSelect?.["FFM_SITA_ADDRESS"],
                            },
                          }),
                        );
                      } else {
                        sendErr("권한이 없습니다.");
                      }
                    }}
                    // rightClick={[
                    //   {
                    //     type: "ROW",
                    //     title: "FHL 이동",
                    //     onClick(value) {
                    //       navigate("/Main/MSG050");
                    //     },
                    //   },
                    // ]}
                  />
                </CommonTab>
              </div>
            </div>
          </CommonContainer>
        </div>
        <div className="flex gap-5">
          <CommonContainer
            title="FSU EDIT"
            childrenTitle={
              <div className="flex items-center gap-2 justify-between w-full px-[1rem]">
                <div className="flex items-center">
                  <div className="w-[7rem] mainInput">
                    <CommonDropDown
                      data={FSU_GROUP}
                      dropHeight="10rem"
                      header={AWB_SAMS_header}
                      inputKey={{
                        key: "VALUE",
                        showKey: "0",
                        value: fsuTypeSelect["VALUE"],
                      }}
                      id="fsuGroup"
                      onClick={(v) => {
                        setFsuTypeSelect(v);
                        if (
                          "FOH;RCT;RCS;DEP;ARR;RCF;NFD;DLV;DIS;TFD;TRM;".indexOf(
                            v["VALUE"],
                          ) >= 0
                        ) {
                          setSitaAddrSelect(sitaAddr[1]);
                        } else if ("FWB" === v["VALUE"]) {
                          setSitaAddrSelect(sitaAddr[2]);
                        } else if ("FHL" === v["VALUE"]) {
                          setSitaAddrSelect(sitaAddr[3]);
                        } else if ("FFM" === v["VALUE"]) {
                          setSitaAddrSelect(sitaAddr[4]);
                        } else {
                          setSitaAddrSelect(sitaAddr[0]);
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-[0.25rem] ml-[1rem]">
                    {sch.inout === "I" ? (
                      <>
                        {" "}
                        <Btn
                          txt="ARR (M)"
                          width="5rem"
                          onClick={() => {
                            fsuBtnClick("ARR", "MULTI");
                          }}
                          type="NONE"
                          tooltip="AWB 여러건 선택 생성 가능"
                        />
                        <Btn
                          txt="RCF (M)"
                          width="5rem"
                          onClick={() => {
                            fsuBtnClick("RCF", "MULTI");
                          }}
                          type="NONE"
                          tooltip="AWB 여러건 선택 생성 가능"
                        />
                        <Btn
                          txt="NFD (M)"
                          width="5rem"
                          onClick={() => {
                            fsuBtnClick("NFD", "MULTI");
                          }}
                          type="NONE"
                          tooltip="AWB 여러건 선택 생성 가능"
                        />
                        <Btn
                          txt="DLV (M)"
                          width="5rem"
                          onClick={() => {
                            fsuBtnClick("DLV", "MULTI");
                          }}
                          type="NONE"
                          tooltip="AWB 여러건 선택 생성 가능"
                        />
                        <Btn
                          txt="DIS"
                          width="3.5rem"
                          onClick={() => {
                            fsuBtnClick("DIS", "ONE");
                          }}
                          type="NONE"
                        />
                        <Btn
                          txt="TFD"
                          width="3.5rem"
                          onClick={() => {
                            fsuBtnClick("TFD", "ONE");
                          }}
                          type="NONE"
                        />
                      </>
                    ) : (
                      <>
                        <Btn
                          txt="FOH"
                          width="3.5rem"
                          onClick={() => {
                            fsuBtnClick("FOH", "ONE");
                          }}
                          type="NONE"
                        />
                        <Btn
                          txt="RCT"
                          width="3.5rem"
                          onClick={() => {
                            fsuBtnClick("RCT", "ONE");
                          }}
                          type="NONE"
                        />
                        <Btn
                          txt="RCS"
                          width="3.5rem"
                          onClick={() => {
                            fsuBtnClick("RCS", "ONE");
                          }}
                          type="NONE"
                        />
                        <Btn
                          txt="DEP (M)"
                          width="5rem"
                          onClick={() => {
                            fsuBtnClick("DEP", "MULTI");
                          }}
                          type="NONE"
                          tooltip="AWB 여러건 선택 생성 가능"
                        />
                        <div className="w-[6rem] mainInput">
                          <CommonDropDown
                            data={FFMCnt}
                            dropHeight="5rem"
                            header={AWB_SAMS_header}
                            inputKey={{
                              key: "VALUE",
                              showKey: "0",
                              value: ffmCntSelect["VALUE"],
                            }}
                            id="ffmCnt"
                            onClick={(v) => {
                              setFfmCntSelect(v);
                            }}
                          />
                        </div>
                        <Btn
                          txt="FFM"
                          width="3.5rem"
                          onClick={() => {
                            ffmSave();
                          }}
                          type="NONE"
                        />
                        <Btn
                          txt="FFM (VIA + Dest)"
                          width="9.5rem"
                          onClick={() => {
                            ffmDestSave();
                          }}
                          type="NONE"
                        />
                        <Btn
                          txt="FFM (Bulk)"
                          width="6.5rem"
                          onClick={() => {
                            ffmBulkSave();
                          }}
                          type="NONE"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {" "}
                  <div className="w-[10rem] mainInput">
                    <CommonDropDown
                      title="MSG TYPE"
                      data={sitaAddr}
                      dropHeight="10rem"
                      header={AWB_SAMS_header}
                      inputKey={{
                        key: "TEXT",
                        showKey: "0",
                        value: sitaAddrSelect["TEXT"],
                      }}
                      id="sitaAddr"
                      onClick={(v) => {
                        setSitaAddrSelect(v);
                      }}
                      labelW="45%"
                    />
                  </div>
                  <div className="w-[17rem] mainInput">
                    <CommonInput
                      id="sitaAddrStr"
                      value={sitaAddrStr}
                      onChange={(v) => setSitaAddrStr(v)}
                      label="ADDR"
                      labelW="15%"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Btn
                      txt="SEND"
                      width="3.5rem"
                      onClick={() => {
                        sendMsg();
                      }}
                      type="NONE"
                    />
                    <Btn
                      txt="DEL"
                      width="3.5rem"
                      onClick={() => {
                        setEdiDel_021();
                      }}
                      type="DELETE"
                    />
                  </div>
                </div>
              </div>
            }>
            <div className="flex gap-8 items-center px-[1rem] mt-[1rem]">
              <TableCust
                tableId="grid3"
                body={grid3}
                header={Grid3Header}
                height="27.3rem"
                width="57.6rem"
                fixCount={1}
                onClick={(r) => {
                  if (r["EDI_IO_GUID"]) {
                    getSitaMsg({ guid: r["EDI_IO_GUID"] });
                  }
                }}
                doubleClick={(v) => {
                  openModal({
                    array: [
                      {
                        id: "IFEDI0070",
                        name: "메시지 작성",
                        param: {
                          progress_guid: v["EDI_IO_GUID"],
                          mig_type: "CIMP",
                          sita_addr: schSelect?.["DEFAULT_SITA_ADDRESS"],
                        },
                      },
                    ],
                  });
                }}
                onCustumizeText={(k, v) => {
                  const fri = String(v).substring(0, 3);
                  const last = String(v).substring(3);

                  if (k === "MASTER_AIR_WAY_BILL_NO") {
                    return fri + " - " + last;
                  }

                  return v;
                }}
                changeValue={(i, k, v) => {
                  setChangeGrid3((prev) =>
                    setTableChange({
                      changeData: prev,
                      idx: i,
                      key: k,
                      value: v,
                    }),
                  );
                }}
              />
              <div className="w-[40rem] h-[27.3rem] border border-gray-500">
                <textarea
                  className="w-full h-full bg-white p-[1rem]"
                  value={sitaData}
                  onChange={(e) => setSitaData(e.target.value)}
                />
              </div>
            </div>
          </CommonContainer>
        </div>
      </div>
    );
  },
);

export default CimpManagement;
