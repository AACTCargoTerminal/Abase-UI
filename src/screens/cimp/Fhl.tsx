import { useEffect, useRef, useState } from "react";
import { CommonContainer } from "../../comp/Container";
import { CommonInput } from "../../comp/Input";
import { Btn } from "../../comp/Btn";
import { ModalCust, ToggleBtn } from "../../comp/Common";
import {
  type DefComp,
  type FhlType,
  type RouteType,
  type TableRow,
} from "../../Util/Type";
import {
  addTable,
  changeTable,
  getApi,
  getClass,
  getDouble,
  getInt,
  openModal,
  removeTable,
  sendErr,
  sendLoading,
  sendSuc,
  setTableChange,
} from "../../Util/Util";
import { CommonDropDown } from "../../comp/DropDown";
import {
  fhlGrid1Header,
  FhlMapInHeader,
  fhlOciHeader,
} from "../../Util/Header";
import { TableCust } from "../../comp/Table";
import SchChange from "../common/SchChange";
import { confirmAsync } from "../../confirmService";

export default function Fhl({ pgmId, sch, param }: DefComp) {
  const [mawbInput, setMawbInput] = useState("");
  const [inoutFlag, setInoutFlag] = useState(sch.inout);
  const [inoutArray, setInoutArray] = useState<TableRow[]>([]);
  const [mapInArray, setMapInArray] = useState<TableRow[]>([]);
  const [mapInSelect, setMapInSelect] = useState<TableRow | undefined>();
  const [grid1, setGrid1] = useState<TableRow[]>([]);
  const [ociGrid, setOciGrid] = useState<TableRow[]>([]);
  const [tmpOciGrid, setTmpOciGrid] = useState<TableRow[]>([]);
  const [ociGridSelect, setOciGridSelect] = useState<TableRow>({});
  const [schOpen, setSchOpen] = useState<boolean>(false);
  const [sitaAddr, setSitaAddr] = useState<string>("");

  const [dt, setDt] = useState<FhlType | undefined>();

  useEffect(() => {
    setInoutFlag(sch.inout);
  }, [sch.inout]);

  useEffect(() => {
    getInout();
  }, []);

  useEffect(() => {
    if (param) {
      setMapInArray([]);
      setMapInSelect(undefined);
      setMawbInput(param["mawb_no"]);
      setDt((prev) => ({ HD_SCHEDULE_SID: param["schedule_sid"] }));
      setSitaAddr(param["sita_addr"]);
    }
  }, [param]);

  useEffect(() => {
    const reg2 = /^[0-9]{11}$/;
    if (reg2.test(mawbInput.replaceAll("-", "").replaceAll(" ", ""))) {
      inquiryClick();
    }
  }, [mawbInput]);

  function cls() {
    setMapInArray([]);
    setMapInSelect(undefined);
    setDt((prev) => ({ HD_SCHEDULE_SID: prev?.HD_SCHEDULE_SID }));
  }

  async function getInout() {
    const data = await getClass("SCHIO", pgmId);
    setInoutArray(data);
  }

  async function getHawbM010_001({ ediGuid }: { ediGuid: string }) {
    sendLoading(true);
    const res = await getApi<Record<number, FhlType[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getHawbM010_001?ediGuid=${ediGuid}&inoutFlag=${inoutFlag}&schSid=${
        dt?.HD_SCHEDULE_SID || "0"
      }`,
      sucFlag: true,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data) {
        const tmp = res.data[0][0];
        setDt((prev) => ({
          ...tmp,
          HD_SCHEDULE_SID: tmp.HD_SCHEDULE_SID
            ? tmp.HD_SCHEDULE_SID
            : prev?.HD_SCHEDULE_SID,
        }));
        setOciGrid(res.data[1]);
        setTmpOciGrid(res.data[1]);
      }
    }
    sendLoading(false);
  }

  async function getHawb010_001() {
    sendLoading(true);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getHawb010_001?mawb=${mawbInput}&inoutFlag=${inoutFlag}&schSid=${
        dt?.HD_SCHEDULE_SID || "0"
      }`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data) {
        setGrid1(res.data[0]);
      }
    }
    sendLoading(false);
  }

  async function getHawb010_002() {
    sendLoading(true);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getHawb010_002?mawb=${mawbInput}`,
      sucFlag: true,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data) {
        setMapInArray(res.data[0]);
      }
    }
    sendLoading(false);
  }

  async function inquiryClick() {
    cls();
    await getHawb010_001();
    await getHawb010_002();
  }

  async function getSchM010_001({ sid }: { sid: number }) {
    sendLoading(true);

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/sys/getSchM010_001?schSid=${sid}`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data) {
        const tmp = res.data[0][0];
        if (tmp) {
          setDt((prev) => ({
            ...prev,
            FLIGHT_DATE: tmp["FLIGHT_DATE"],
            FLIGHT_NO: tmp["FLIGHT_NO"],
            INOUT_FLAG: tmp["INOUT_FLAG"],
            ORIGIN_CODE: tmp["ORIGIN_CODE"],
            DESTINATION_CODE: tmp["DESTINATION_CODE"],
          }));
        }
      }
    }
    sendLoading(false);
  }

  async function setHawbM010_011() {
    const schSid = dt?.HD_SCHEDULE_SID;
    const ediGuid = dt?.HD_EDI_GUID;

    if (!schSid) {
      sendErr("스케줄을 확인해주세요");
      return;
    }

    if (!ediGuid) {
      sendErr("FHL정보가 없습니다.");
      return;
    }

    sendLoading(true);
    await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/setHawbM010_011?ediGuid=${ediGuid}&schSid=${schSid}`,
      pgmId: pgmId,
      sucFlag: true,
    });
    sendLoading(false);
  }

  async function setHawbM010_020() {
    const ediGuid = dt?.HD_EDI_GUID;

    if (!ediGuid) {
      sendErr("FHL정보가 없습니다.");
      return;
    }

    sendLoading(true);
    await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/setHawbM010_020?ediGuid=${ediGuid}`,
      pgmId: pgmId,
      sucFlag: true,
    });
    sendLoading(false);
  }

  async function setFhlSave() {
    sendLoading(true);

    var tmp = dt;

    if (!tmp) {
      sendErr("FHL 정보에러");
      return;
    }

    if (!tmp.HD_SCHEDULE_SID) {
      if (tmp.AUTO_SCHEDULE_SID && tmp.AUTO_SCHEDULE_STR) {
        const conRet = await confirmAsync({
          title: "스케줄",
          message: `스케줄 정보를 [${tmp.AUTO_SCHEDULE_STR}] \n 로 저장합니까?`,
        });

        if (!conRet) {
          return;
        } else {
          tmp = { ...tmp, HD_SCHEDULE_SID: tmp.AUTO_SCHEDULE_SID };
        }
      }
    }

    const saveDt = new Map<
      keyof FhlType | string,
      FhlType[keyof FhlType] | TableRow[]
    >();

    (Object.keys(tmp) as (keyof FhlType)[]).forEach((key) => {
      saveDt.set(key, tmp?.[key] || "");
    });

    changeTable({ table: tmpOciGrid, changeData: ociGridSelect });

    saveDt.set("ociArray", tmpOciGrid);

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "POST",
      url: `/cimp/setFhlSave?sitaAddr=${sitaAddr}`,
      pgmId: pgmId,
      params: saveDt,
      sucFlag: true,
    });
    sendLoading(false);
  }

  return (
    <div className="p-[1.5rem] flex flex-col gap-5">
      <CommonContainer
        title="FHL"
        childrenTitle={
          <div className="w-full flex items-center justify-between px-[1%]">
            <div className="flex w-full items-center gap-5">
              <div className="mainInput w-[20%]">
                <CommonInput
                  id="mawbInput"
                  value={mawbInput}
                  onChange={(v) => {
                    const reg = /^[0-9-]*$/;
                    if (reg.test(v.replaceAll(" ", ""))) {
                      setMawbInput(v);
                    }
                  }}
                  label="MAWB"
                  labelW="25%"
                  auto={true}
                  setClear={true}
                  check={true}
                />
              </div>
              <Btn
                type="SEARCH"
                txt="Inquiry"
                onClick={() => {
                  inquiryClick();
                }}
              />

              <div className="bg-white rounded-md mainInput ml-[3%]">
                <ToggleBtn
                  array={inoutArray.map((item) => ({
                    key: item["CODE_CODE"],
                    value: item["CODE_NAME"],
                  }))}
                  onClick={(value) => {
                    setInoutFlag(value);
                  }}
                  idx={
                    inoutArray.findIndex(
                      (item) => item["CODE_CODE"] === inoutFlag,
                    ) || 0
                  }
                />
              </div>
              <div className="mainInput w-[25%] ml-[3%]">
                {" "}
                <CommonDropDown
                  id="mapInFhl"
                  header={FhlMapInHeader}
                  data={mapInArray}
                  dropHeight="10rem"
                  inputKey={{
                    key: "EDI_GUID",
                    showKey: "1",
                    value: mapInSelect?.["EDI_GUID"],
                  }}
                  onClick={(v) => {
                    setMapInSelect(v);
                    getHawbM010_001({ ediGuid: v["EDI_GUID"] });
                  }}
                  check={true}
                  title="Map In FHL"
                  labelW="25%"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Btn
                type="SAVE"
                txt="SAVE"
                onClick={() => {
                  setFhlSave();
                }}
              />
              <Btn
                type="DELETE"
                txt="DEL"
                onClick={() => {
                  setHawbM010_020();
                }}
              />
            </div>
          </div>
        }>
        <div className="flex gap-3">
          <TableCust
            header={fhlGrid1Header}
            body={grid1}
            height="17rem"
            onClick={(r) => {
              getHawbM010_001({ ediGuid: r["EDI_GUID"] });
            }}
            tableId="grid1"
            width="49.5%"
          />
          <CommonContainer title="MBI : Master AWB" width="40%">
            <div className="flex flex-col gap-2">
              <div className="mainInput">
                <CommonInput
                  id="mawb"
                  value={dt?.MAWB_NO || ""}
                  check={true}
                  label="MAWB"
                  length={11}
                  onChange={(v) => setDt((prev) => ({ ...prev, MAWB_NO: v }))}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="origin"
                  value={dt?.MBI_ORG_AIRPORT_CODE || ""}
                  check={true}
                  label="Origin"
                  length={3}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, MBI_ORG_AIRPORT_CODE: v }))
                  }
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="dest"
                  value={dt?.MBI_DEST_AIRPORT_CODE || ""}
                  check={true}
                  label="DEST"
                  length={3}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, MBI_DEST_AIRPORT_CODE: v }))
                  }
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="Pcs"
                  value={dt?.MBI_NO_OF_PIECES?.toString() || "0"}
                  check={true}
                  label="Pcs"
                  length={4}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, MBI_NO_OF_PIECES: getInt(v) }))
                  }
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="wt"
                  value={dt?.MBI_WEIGHT?.toString() || "0.0"}
                  check={true}
                  label="Wt"
                  length={7}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, MBI_WEIGHT: getDouble(v) }))
                  }
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="HBS : House Waybill" width="40%">
            <div className="flex flex-col gap-2 ">
              <div className="mainInput">
                <CommonInput
                  id="HAWB"
                  value={dt?.HAWB_NO || ""}
                  check={true}
                  label="HAWB"
                  length={20}
                  onChange={(v) => setDt((prev) => ({ ...prev, HAWB_NO: v }))}
                  labelW="20%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="hPcs"
                  value={dt?.HBS_NO_OF_PIECES?.toString() || "0"}
                  check={true}
                  label="Pcs"
                  length={4}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, HBS_NO_OF_PIECES: getInt(v) }))
                  }
                  labelW="20%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="hWt"
                  value={dt?.HBS_WEIGHT?.toString() || "0.0"}
                  check={true}
                  label="Wt"
                  length={9}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, HBS_WEIGHT: getDouble(v) }))
                  }
                  labelW="20%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="desc"
                  value={dt?.HBS_MFST_DESC_GOODS || ""}
                  check={true}
                  label="Desc"
                  length={15}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, HBS_MFST_DESC_GOODS: v }))
                  }
                  labelW="20%"
                />
              </div>
            </div>
          </CommonContainer>
        </div>
      </CommonContainer>
      <div className="flex gap-3">
        <CommonContainer title="SHP : Shipper" width="50%">
          <div className="flex flex-col gap-3">
            <div className="w-[70%] mainInput">
              <CommonInput
                id="shpName"
                value={dt?.SHP_NAME || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, SHP_NAME: v }))}
                check={true}
                label="Name"
                length={35}
                labelW="21%"
              />
            </div>
            <div className="w-[100%] mainInput">
              <CommonInput
                id="shpAddr"
                value={dt?.SHP_ADDR || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, SHP_ADDR: v }))}
                check={true}
                label="Address"
                length={35}
                labelW="14.7%"
              />
            </div>
            <div className="w-[100%] mainInput">
              {" "}
              <CommonInput
                id="shpPlace"
                value={dt?.SHP_PLACE || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, SHP_PLACE: v }))}
                check={true}
                label="Place"
                length={17}
                labelW="14.7%"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="mainInput w-[49%]">
                <CommonInput
                  id="shpCountry"
                  value={dt?.SHP_COUNTRY_CODE || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, SHP_COUNTRY_CODE: v }))
                  }
                  check={true}
                  label="Country"
                  length={2}
                  labelW="30%"
                />
              </div>
              <div className="mainInput w-[49%]">
                {" "}
                <CommonInput
                  id="shpState"
                  value={dt?.SHP_STATE || ""}
                  onChange={(v) => setDt((prev) => ({ ...prev, SHP_STATE: v }))}
                  label="State/Province"
                  length={9}
                  labelW="30%"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mainInput">
              <div className="mainInput w-[49%]">
                {" "}
                <CommonInput
                  id="shpPostCode"
                  value={dt?.SHP_POST_CODE || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, SHP_POST_CODE: v }))
                  }
                  label="Post Code"
                  labelW="30%"
                  length={9}
                />
              </div>
              <div className="mainInput w-[49%]">
                <CommonInput
                  id="shpMobile"
                  value={dt?.SHP_CONTACT_NO || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, SHP_CONTACT_NO: v }))
                  }
                  label="Phone Number"
                  length={28}
                  labelW="30%"
                />
              </div>
            </div>
          </div>
        </CommonContainer>
        <CommonContainer title="CNE : Consignee" width="50%">
          <div className="w-full flex flex-col gap-3">
            <div className="w-[70%] mainInput">
              <CommonInput
                id="cneName"
                value={dt?.CNE_NAME || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, CNE_NAME: v }))}
                check={true}
                label="Name"
                labelW="21%"
                length={35}
              />
            </div>
            <div className="w-full mainInput">
              <CommonInput
                id="cneAddr"
                value={dt?.CNE_ADDR || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, CNE_ADDR: v }))}
                check={true}
                label="Address"
                labelW="14.7%"
                length={35}
              />
            </div>
            <div className="w-full mainInput">
              <CommonInput
                id="cnePlace"
                value={dt?.CNE_PLACE || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, CNE_PLACE: v }))}
                check={true}
                label="Place"
                labelW="14.7%"
                length={17}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="cneCountry"
                  value={dt?.CNE_COUNTRY_CODE || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, CNE_COUNTRY_CODE: v }))
                  }
                  check={true}
                  label="Country"
                  labelW="30%"
                  length={2}
                />
              </div>
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="cneState"
                  value={dt?.CNE_STATE || ""}
                  onChange={(v) => setDt((prev) => ({ ...prev, CNE_STATE: v }))}
                  label="State/Province"
                  labelW="30%"
                  length={9}
                />
              </div>
            </div>
            <div className="flex items-center justify-between ">
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="cnePostCode"
                  value={dt?.CNE_POST_CODE || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, CNE_POST_CODE: v }))
                  }
                  label="Post Code"
                  labelW="30%"
                  length={9}
                />
              </div>
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="cneMobile"
                  value={dt?.CNE_CONTACT_NO || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, CNE_CONTACT_NO: v }))
                  }
                  label="Phone Number"
                  labelW="30%"
                  length={28}
                />
              </div>
            </div>
          </div>
        </CommonContainer>
      </div>
      <CommonContainer title="CVD : Charge declare">
        <div className="flex items-center justify-between gap-2">
          <div className="w-[8%] mainInput">
            <CommonInput
              id="cvdCurrency"
              value={dt?.CVD_CURRENCY_CODE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_CURRENCY_CODE: v }))
              }
              label="Currency"
              labelW="50%"
              check={true}
              length={3}
            />
          </div>
          <div className="w-[23%] mainInput">
            <CommonInput
              id="cvdCarriage"
              value={dt?.CVD_CARRIAGE_VALUE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_CARRIAGE_VALUE: v }))
              }
              label="Value Carrage"
              labelW="26%"
              length={14}
              holder="NVD"
            />
          </div>
          <div className="w-[13%] mainInput">
            <CommonInput
              id="cvdPcWt"
              value={dt?.CVD_PC_WGT_VAL || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_PC_WGT_VAL: v }))
              }
              label="P/C (Weight/Valuation)"
              labelW="70%"
              length={1}
            />
          </div>
          <div className="w-[24%] mainInput">
            <CommonInput
              id="cvdCustoms"
              value={dt?.CVD_CUSTOMS_VALUE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_CUSTOMS_VALUE: v }))
              }
              label="Value Customs"
              labelW="27%"
              length={13}
              holder="NCV"
            />
          </div>
          <div className="w-[11%] mainInput">
            <CommonInput
              id="cvdOhtPc"
              value={dt?.CVD_PC_OTH_CHG || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_PC_OTH_CHG: v }))
              }
              label="P/C (OtherCharge)"
              labelW="70%"
              length={1}
            />
          </div>
          <div className="w-[21%] mainInput">
            <CommonInput
              id="cvdInsurance"
              value={dt?.CVD_INSURANCE_VALUE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_INSURANCE_VALUE: v }))
              }
              label="Value Insurance"
              length={13}
              holder="XXX"
            />
          </div>
        </div>
      </CommonContainer>
      <div className="grid grid-cols-2 gap-3">
        <CommonContainer title="TXT : Free Text">
          <div className="grid grid-cols-1 gap-2">
            <div className="mainInput">
              <CommonInput
                id="freeTxt1"
                value={dt?.FREE_TEXT_1 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_1: v }))}
                length={65}
                labelW="20%"
                label="TXT 1"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt2"
                value={dt?.FREE_TEXT_2 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_2: v }))}
                length={65}
                labelW="20%"
                label="TXT 2"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt3"
                value={dt?.FREE_TEXT_3 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_3: v }))}
                length={65}
                labelW="20%"
                label="TXT 3"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt4"
                value={dt?.FREE_TEXT_4 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_4: v }))}
                length={65}
                labelW="20%"
                label="TXT 4"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt5"
                value={dt?.FREE_TEXT_5 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_5: v }))}
                length={65}
                labelW="20%"
                label="TXT 5"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt6"
                value={dt?.FREE_TEXT_6 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_6: v }))}
                length={65}
                labelW="20%"
                label="TXT 6"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt7"
                value={dt?.FREE_TEXT_7 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_7: v }))}
                length={65}
                labelW="20%"
                label="TXT 7"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt8"
                value={dt?.FREE_TEXT_8 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_8: v }))}
                length={65}
                labelW="20%"
                label="TXT 8"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="freeTxt9"
                value={dt?.FREE_TEXT_9 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, FREE_TEXT_9: v }))}
                length={65}
                labelW="20%"
                label="TXT 9"
              />
            </div>
          </div>
        </CommonContainer>

        <CommonContainer
          title="OCI : Other Customs"
          childrenTitle={
            <div className="flex w-full items-center gap-2 pl-[1%]">
              <Btn
                type="NONE"
                txt="+"
                onClick={() => {
                  setTmpOciGrid((prev) => {
                    const tmp = addTable({
                      header: fhlOciHeader,
                      table: prev,
                    });
                    if (tmp.length > 12) {
                      return prev;
                    } else {
                      return tmp;
                    }
                  });
                }}
              />
              <Btn
                type="NONE"
                txt="-"
                onClick={() => {
                  const tmp = removeTable({ table: tmpOciGrid });
                  setTmpOciGrid(tmp);
                }}
              />
            </div>
          }>
          <TableCust
            body={tmpOciGrid}
            header={fhlOciHeader}
            height="15rem"
            width="100%"
            tableId="oci"
            onClick={(r) => {}}
            changeValue={(i, k, v, r) => {
              if (r) {
                setOciGridSelect({});
                return;
              }
              setOciGridSelect((prev) =>
                setTableChange({
                  changeData: prev,
                  idx: i,
                  key: k,
                  value: v,
                }),
              );
              //setOciGridSelect(r);
            }}
          />
        </CommonContainer>
        <CommonContainer title="HTS : Harmonised Commodity Codes">
          <div className="grid grid-cols-3 gap-2">
            <div className="mainInput">
              <CommonInput
                id="hs1"
                value={dt?.HS_CODE_1 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_1: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs2"
                value={dt?.HS_CODE_2 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_2: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs3"
                value={dt?.HS_CODE_3 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_3: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs4"
                value={dt?.HS_CODE_4 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_4: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs5"
                value={dt?.HS_CODE_5 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_5: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs6"
                value={dt?.HS_CODE_6 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_6: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs7"
                value={dt?.HS_CODE_7 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_7: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs8"
                value={dt?.HS_CODE_8 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_8: v }))}
                length={18}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="hs9"
                value={dt?.HS_CODE_9 || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, HS_CODE_9: v }))}
                length={18}
              />
            </div>
          </div>
        </CommonContainer>
        <div className={`origin-top row-span-2`}>
          <CommonContainer
            title="System Header"
            childrenTitle={
              <div className="flex items-center gap-2">
                {" "}
                <Btn
                  type="NONE"
                  txt="Schedule"
                  onClick={() => {
                    openModal({
                      array: [
                        {
                          id: "WMSCH0040",
                          name: "스케줄 변경",
                          param: { inout: inoutFlag, date: sch.fltDate },
                        },
                      ],
                    });
                  }}
                />
                <Btn
                  type="SAVE"
                  txt="SAVE"
                  onClick={() => {
                    setHawbM010_011();
                  }}
                />
              </div>
            }>
            <div
              className={`grid grid-cols-[30%_30%_30%] justify-between gap-2`}>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysSchSid`}
                  value={dt?.HD_SCHEDULE_SID?.toString() || "0"}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, HD_SCHEDULE_SID: getInt(v) }));
                  }}
                  label={`SCHEDULE_SID`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysFltDate`}
                  value={dt?.FLIGHT_DATE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, FLIGHT_DATE: v }));
                  }}
                  label={`Flt Date`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysFltNo`}
                  value={dt?.FLIGHT_NO || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, FLIGHT_NO: v }));
                  }}
                  label={`Flt No`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysInout`}
                  value={dt?.INOUT_FLAG || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, INOUT_FLAG: v }));
                  }}
                  label={`I / O`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysOrigin`}
                  value={dt?.ORIGIN_CODE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, ORIGIN_CODE: v }));
                  }}
                  label={`Origin`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysDest`}
                  value={dt?.DESTINATION_CODE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, DESTINATION_CODE: v }));
                  }}
                  label={`Dest`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysCreate`}
                  value={dt?.HD_CREATED_TIME || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, HD_CREATED_TIME: v }));
                  }}
                  label={`Create Time`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysFwbCreate`}
                  value={dt?.HD_EDI_GUID || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, HD_EDI_GUID: v }));
                  }}
                  label={`EDI_GUID`}
                  labelW="45%"
                  check={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysMawbSid`}
                  value={dt?.EDI_IO_GUID || ""}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      EDI_IO_GUID: v,
                    }));
                  }}
                  label={`EDI_IO_GUID`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysSchSid2`}
                  value={dt?.HD_ROW_SEQ_NO?.toString() || "0"}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      HD_ROW_SEQ_NO: getInt(v),
                    }));
                  }}
                  label={`ROW_SEQ_NO`}
                  labelW="45%"
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysSchSid`}
                  value={dt?.AUTO_SCHEDULE_SID?.toString() || "0"}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      AUTO_SCHEDULE_SID: getInt(v),
                    }));
                  }}
                  label={`Auto Schedule`}
                  labelW="45%"
                  read={true}
                />
              </div>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysSchStr`}
                  value={dt?.AUTO_SCHEDULE_STR || ""}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      AUTO_SCHEDULE_STR: v,
                    }));
                  }}
                  label={`Auto Schedule`}
                  labelW="45%"
                  read={true}
                />
              </div>
            </div>
          </CommonContainer>
        </div>
      </div>
    </div>
  );
}
