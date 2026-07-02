import { useCallback, useEffect, useState } from "react";
import type { DefComp, TableHeaderType, TableRow } from "../../Util/Type";
import {
  addTableEmptyRow,
  closePage,
  confirmObj,
  getApi,
  getClass,
  openModal,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { CommonContainer, CommonTab } from "../../comp/Container";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import {
  commonHeader2,
  commonHeader4,
  FwbMapInHeader,
} from "../../Util/Header";
import { CommonChk, CommonInput, CommonLabel } from "../../comp/Input";
import { Btn } from "../../comp/Btn";
import moment from "moment";
import { confirmAsync } from "../../confirmService";

// cargo_control_sid: r["CARGO_CONTROL_SID"],
//                           schedule_sid: schSelect?.["SCHEDULE_SID"],
//                           mawb_no: r["MASTER_AIR_WAY_BILL_NO"],
//                           progress_guid: r["PROGRESS_GUID"],
//                           sita_addr: schSelect?.["DEFAULT_SITA_ADDRESS"],
//                           email_addr: schSelect?.["DEFAULT_EMAIL_ADDRESS"],

const ULD_TS_HEADER: TableHeaderType[] = [
  { key: "ULD_NO", value: "ULD NO", w: "100%" },
];
export default function Fwb({ sch, pgmId, param }: DefComp) {
  useEffect(() => {
    getClass("APORT", pgmId).then((v) => {
      setAport(v);
    });
    getClass("SPHCD", pgmId).then((v) => {
      setSphcd(v);
    });
    getClass("1.5", pgmId).then((v) => {
      setPc(v);
    });
    getClass("CURCD", pgmId).then((v) => {
      setCurcd(v);
    });
    getClass("1.22", pgmId).then((v) => {
      setVolume(addTableEmptyRow(v));
    });
    getClass("ULDTP", pgmId).then((v) => {
      setUldType(addTableEmptyRow(v));
    });
    getClass("CRRCD", pgmId).then((v) => {
      setCarrier(addTableEmptyRow(v));
    });
    getClass("NATCD", pgmId).then((v) => {
      setCountry(addTableEmptyRow(v));
    });
    getClass("1.2", pgmId).then((v) => {
      setOtherCharge(addTableEmptyRow(v));
    });
    getClass("1.3", pgmId).then((v) => {
      setEntitlement(addTableEmptyRow(v));
    });
    getUldTs();
  }, []);

  useEffect(() => {
    setParams(param);
  }, [param]);

  const [params, setParams] = useState(param);
  //Select데이터
  const [dt, setDt] = useState<TableRow | undefined>();

  //Mapin 콤보
  const [mawbDt, setMawbDt] = useState<TableRow[]>([]);
  const [selectMawbDt, setSelectMawbDt] = useState<TableRow | undefined>();

  //TS 콤보
  const [uldTs, setUldTs] = useState<TableRow[]>([]);

  //code
  const [aport, setAport] = useState<TableRow[]>([]);
  const [sphcd, setSphcd] = useState<TableRow[]>([]);
  const [curcd, setCurcd] = useState<TableRow[]>([]);
  const [pc, setPc] = useState<TableRow[]>([]);
  const [volume, setVolume] = useState<TableRow[]>([]);
  const [uldType, setUldType] = useState<TableRow[]>([]);
  const [carrier, setCarrier] = useState<TableRow[]>([]);
  const [country, setCountry] = useState<TableRow[]>([]);
  const [otherCharge, setOtherCharge] = useState<TableRow[]>([]);
  const [entitlement, setEntitlement] = useState<TableRow[]>([]);

  //탭
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (params) {
      if (
        params["cargo_control_sid"] &&
        params["mawb_no"] &&
        params["schedule_sid"] &&
        String(params["mawb_no"]).length === 11
      ) {
        select();
      }
    }
  }, [
    params?.["mawb_no"],
    params?.["cargo_control_sid"],
    params?.["schedule_sid"],
  ]);

  useEffect(() => {
    if (params?.["CUSTOMER_SID"]) {
      getCustomerCode();
    }
  }, [params?.["CUSTOMER_SID"]]);

  useEffect(() => {
    const tmp = confirmObj({
      obj: dt?.["PPD_OTHER_CHARGE_CARRIER"],
      type: "DOUBLE",
      fix: 3,
    }) as number;
    const num1 = confirmObj({
      obj: dt?.["PPD_WEIGHT_CHARGE"],
      type: "DOUBLE",
      fix: 3,
    }) as number;
    const num2 = confirmObj({
      obj: dt?.["PPD_VALUATION_CHARGE"],
      type: "DOUBLE",
      fix: 3,
    }) as number;
    const num3 = confirmObj({
      obj: dt?.["PPD_TAXES"],
      type: "DOUBLE",
      fix: 3,
    }) as number;
    const num4 = confirmObj({
      obj: dt?.["PPD_OTHER_CHARGE_AGENT"],
      type: "DOUBLE",
      fix: 3,
    }) as number;

    setDt((prev) => ({
      ...prev,
      PPD_TOTAL_CHARGE_SUMMARY: num1 + num2 + num3 + num4 + tmp,
    }));
  }, [
    dt?.["PPD_OTHER_CHARGE_CARRIER"],
    dt?.["PPD_WEIGHT_CHARGE"],
    dt?.["PPD_VALUATION_CHARGE"],
    dt?.["PPD_TAXES"],
    dt?.["PPD_OTHER_CHARGE_AGENT"],
  ]);

  useEffect(() => {
    if (selectMawbDt?.["MASTER_AIR_WAY_BILL_SID"]) {
      selectMapin();
    }
  }, [selectMawbDt?.["MASTER_AIR_WAY_BILL_SID"]]);

  async function getCustomerCode() {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "GET",
      url: `/sys/getCustomerL010_002?customerSid=${params?.["CUSTOMER_SID"]}`,
      pgmId: pgmId,
    });

    if (res.ok) {
      if (res.data?.[0][0]) {
        const tmp = res.data?.[0][0];
        setDt((prev) => ({
          ...prev,
          AGT_CUSTOMER_CODE: tmp["AGT_CUSTOMER_CODE"],
          IATA_CODE: tmp["IATA_CODE"],
          SHP_PLACE_NAME: tmp["SHP_PLACE_NAME"],
          SHP_COMPANY_NAME1: tmp["SHP_COMPANY_NAME1"],
          CVD_CURRENCY_CODE: tmp["CVD_CURRENCY_CODE"],
        }));
      }
    }
  }

  async function selectMapin() {
    sendLoading(true);
    setDt(undefined);

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getMawbM010_008?mawbSid=${selectMawbDt?.["MASTER_AIR_WAY_BILL_SID"]}&schSid=${params?.["schedule_sid"]}`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data?.[0][0]) {
        setDt(res.data[0][0]);
        sendLoading(false);
        return;
      }
    }
    setDt(undefined);

    sendLoading(false);
  }

  async function select() {
    sendLoading(true);
    setDt(undefined);
    await getMawbM010_001();
    await getMawbM010_009();
    await getUldTs();
    sendLoading(false);
  }

  async function getMawbM010_001() {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getMawbM010_001?cargoSid=${params?.["cargo_control_sid"]}&schSid=${params?.["schedule_sid"]}&mawb=${params?.["mawb_no"]}`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data?.[0][0]) {
        const tmp = res.data[0][0];
        setDt({
          ...tmp,
          FLIGHT_NUMBER:
            tmp["FWB_EXIST"] === "Y"
              ? tmp["FLIGHT_NUMBER"]
              : tmp["FLT_FLIGHT_NO"],
          FLT_FLIGHT_DAY:
            tmp["FWB_EXIST"] === "Y"
              ? tmp["FLT_FLIGHT_DAY"]
              : tmp["FLIGHT_DATE"],
          AGT_ACCOUNT_NO:
            tmp["FWB_EXIST"] === "Y"
              ? tmp["AGT_ACCOUNT_NO"]
              : tmp["AGT_ACCOUNT_NAME"],
        });
        return;
      }
    }
    setDt(undefined);
  }

  async function getMawbM010_009() {
    setSelectMawbDt(undefined);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getMawbM010_009?mawb=${params?.["mawb_no"]}`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data?.[0]) {
        setMawbDt(res.data[0]);
        return;
      }
    }
    setMawbDt([]);
  }

  async function getUldTs() {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getUldTs?`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data?.[0]) {
        setUldTs([{ ULD_NO: "" }, ...res.data[0]]);
        return;
      }
    }
    setUldTs([]);
  }

  const save = useCallback(async () => {
    if (dt?.["RTG_FIRST_DESTINATION"]) {
      if (!dt?.["RTG_FIRST_CARRIER_CODE"]) {
        sendErr("항공사가 선택되지 않았습니다.");
        return;
      }
    }

    if (dt?.["RTG_ONWARD_DESTINATION1"]) {
      if (!dt?.["RTG_ONWARD_CARRIER1_CODE"]) {
        sendErr("항공사가 선택되지 않았습니다.");
        return;
      }
    }

    if (!dt?.["CHARGEABLE_WEIGHT_DETAILS"]) {
      sendErr("Chargeable Weight가 입력되지 않았습니다.");
      return;
    }

    if (!dt?.["FLIGHT_NUMBER"] && !dt?.["FLT_FLIGHT_NO"]) {
      sendErr("편명이 선택되지 않았습니다.");
      return;
    }
    if (dt?.["CARRIER_PREFIX"]) {
      if (
        dt?.["RTG_ONWARD_DESTINATION1"] &&
        dt?.["RTG_ONWARD_CARRIER1_CODE"] !== dt["CARRIER_PREFIX"]
      ) {
        const confirmRet = await confirmAsync({
          title: "편명 오류",
          message: `By 편명 오류 입니다.\n (*) 수정필요 : ${dt?.["RTG_ONWARD_DESTINATION1"]} ==> ${dt["CARRIER_PREFIX"]}\n\n 수정없이 저장합니까(By2)?`,
        });
        if (!confirmRet) {
          return;
        }
      }
    }

    const apiParam = {
      ...dt,
      SCHEDULE_SID: params?.["schedule_sid"],
      MAWB_NO: params?.["mawb_no"],
      PROGRESS_GUID: params?.["progress_guid"],
    };

    const apiMap = new Map<string, any>();

    Object.entries(apiParam).forEach(([key, value]) => {
      apiMap.set(key, value ?? "");
    });

    sendLoading(true);

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "POST",
      url: `/cimp/setMawbM010_011`,
      pgmId: pgmId,
      params: apiMap,
      sucFlag: true,
    });

    if (res.ok) {
      select();
    }

    sendLoading(false);
  }, [dt]);

  const deleteClick = useCallback(async () => {
    if (!dt?.["MASTER_AIR_WAY_BILL_SID"]) {
      sendErr("FWB 메시지가 없습니다.");
      return;
    }
    sendLoading(true);

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/setMawbM010_021?mawbSid=${dt["MASTER_AIR_WAY_BILL_SID"]}`,
      pgmId: pgmId,
      sucFlag: true,
    });
    if (res.ok) {
      closePage(pgmId);
    }

    sendLoading(false);
  }, [dt]);

  return (
    <div className="p-[1.5rem] flex flex-col gap-5">
      <CommonContainer
        title="FWB"
        childrenTitle={
          <div className="flex w-full h-full items-center justify-between gap-3 px-[0.5%]">
            <div className="flex items-center w-[100%] gap-3">
              <div className="mainInput w-[35%]">
                <CommonDropDown
                  data={mawbDt}
                  header={FwbMapInHeader}
                  id="mawbMapin"
                  title="Map In FWB"
                  onClick={(r) => {
                    setSelectMawbDt(r);
                  }}
                  inputKey={{
                    key: "MASTER_AIR_WAY_BILL_SID",
                    showKey: "0 / 3 : 4",
                    value: selectMawbDt?.["MASTER_AIR_WAY_BILL_SID"],
                  }}
                  dropHeight="10rem"
                  labelW="20%"
                />
              </div>
              <div className="mainInput w-[35%]">
                {" "}
                <CommonInput
                  id="Sita Address"
                  value={params?.["sita_addr"] || ""}
                  read={true}
                  label="Sita Address"
                  labelW="20%"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Btn
                type="SEARCH"
                txt="SEND"
                onClick={() => {
                  openModal({
                    array: [
                      {
                        id: "IFEDI0070",
                        name: "메시지 작성",
                        param: {
                          progress_guid: params?.["progress_guid"],
                          mig_type: "CIMP",
                          sita_addr: params?.["sita_addr"],
                        },
                      },
                    ],
                  });
                }}
              />
              <Btn
                type="SAVE"
                txt="SAVE"
                onClick={() => {
                  save();
                }}
              />
              <Btn
                type="DELETE"
                txt="DEL"
                onClick={() => {
                  deleteClick();
                }}
              />
            </div>
          </div>
        }>
        <div className="grid grid-cols-[15%_15%_20%_20%] gap-x-5 gap-y-3">
          <div className="mainInput">
            <CommonInput
              id="mawb"
              value={params?.["mawb_no"] || ""}
              onChange={(v) => {
                setParams((prev) => ({ ...prev, mawb_no: v }));
              }}
              check={true}
              label="MAWB No."
              length={11}
              labelW="46.5%"
            />
          </div>
          <div className="mainInput flex">
            <CommonChk
              id="ts"
              onChange={(v) => {
                setDt((prev) => ({ ...prev, TS_FLAG: v ? "Y" : "N" }));
              }}
              value={dt?.["TS_FLAG"] === "Y" ? true : false}
              title="T/S"
            />
            <CommonChk
              id="consolidateion"
              onChange={(v) => {
                setDt((prev) => ({ ...prev, CONSOL_FLAG: v ? "Y" : "N" }));
              }}
              value={dt?.["CONSOL_FLAG"] === "Y" ? true : false}
              title="Consolidation"
            />
          </div>
          <div className="mainInput">
            <CommonInput
              id="Agent Code"
              value={dt?.["AGT_CUSTOMER_CODE"] || ""}
              onChange={(v) => {
                setDt((prev) => ({ ...prev, AGT_CUSTOMER_CODE: v }));
              }}
              check={true}
              label="Agent Code"
              labelW="27%"
              searchBtn={{
                flag: true,
                click(v) {
                  setDt((prev) => ({ ...prev, AGT_CUSTOMER_CODE: "" }));
                  openModal({
                    array: [
                      {
                        id: "CMCUS0030",
                        name: "거래처 목록",
                        param: { class_name: v },
                      },
                    ],
                  });
                },
              }}
            />
          </div>
          <div />
          <div className="mainInput">
            <CommonInput
              id="fltNo"
              value={dt?.["FLIGHT_NUMBER"]}
              check={true}
              read={true}
              label="Flight No."
              labelW="46.5%"
            />
          </div>
          <div className="mainInput">
            <CommonInput
              id="fltDate"
              value={moment(dt?.["FLT_FLIGHT_DAY"]).format("YYYY - MM - DD")}
              check={true}
              read={true}
              label="Flight Date"
            />
          </div>
          <div className="flex gap-2">
            <div className="mainInput w-[65%]">
              <CommonDropDown
                id="origin"
                data={aport}
                dropHeight="15rem"
                header={commonHeader4}
                title="Origin"
                find={true}
                check={true}
                labelW="53%"
                inputKey={{
                  key: "CODE_CODE",
                  showKey: "0",
                  value: dt?.["ORIGIN_CODE"],
                }}
                writeFlag={false}
                onClick={(r) => {
                  setDt((prev) => ({
                    ...prev,
                    ORIGIN_CODE: r["CODE_CODE"],
                    ORIGIN_NAME: r["CODE_NAME"],
                  }));
                }}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="originName"
                value={dt?.["ORIGIN_NAME"]}
                onChange={(v) => {
                  setDt((prev) => ({ ...prev, ORIGIN_NAME: v }));
                }}
              />
            </div>
          </div>
          <div className="mainInput flex gap-2">
            <div className="mainInput w-[60%]">
              {" "}
              <CommonDropDown
                id="dest"
                data={aport}
                dropHeight="15rem"
                header={commonHeader4}
                title="Destination"
                find={true}
                check={true}
                labelW="50%"
                inputKey={{
                  key: "CODE_CODE",
                  showKey: "0",
                  value: dt?.["DESTINATION_CODE"],
                }}
                writeFlag={false}
                onClick={(r) => {
                  setDt((prev) => ({
                    ...prev,
                    DESTINATION_CODE: r["CODE_CODE"],
                    DESTINATION_NAME: r["CODE_NAME"],
                  }));
                }}
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="originName"
                value={dt?.["DESTINATION_NAME"] || ""}
                onChange={(v) => {
                  setDt((prev) => ({ ...prev, DESTINATION_NAME: v }));
                }}
              />
            </div>
          </div>
          <div className="col-span-2 flex gap-2">
            <div className="mainInput w-[40%]">
              <CommonDropDown
                id="firstDest"
                data={aport}
                dropHeight="15rem"
                header={commonHeader4}
                title="First Destination"
                find={true}
                check={true}
                inputKey={{
                  key: "CODE_CODE",
                  showKey: "0",
                  value: dt?.["RTG_FIRST_DESTINATION"],
                }}
                writeFlag={false}
                onClick={(r) => {
                  setDt((prev) => ({
                    ...prev,
                    RTG_FIRST_DESTINATION: r["CODE_CODE"],
                    RTG_FIRST_DESTINATION_NAME: r["CODE_NAME"],
                  }));
                }}
                labelW="58%"
              />
            </div>
            <div className="mainInput flex gap-5 w-[55%]">
              {" "}
              <CommonInput
                id="firstDestName"
                value={dt?.["RTG_FIRST_DESTINATION_NAME"] || ""}
                onChange={(v) => {
                  setDt((prev) => ({ ...prev, RTG_FIRST_DESTINATION_NAME: v }));
                }}
              />
              <CommonInput
                id="by"
                value={dt?.["RTG_FIRST_CARRIER_CODE"] || ""}
                onChange={(v) => {
                  setDt((prev) => ({ ...prev, RTG_FIRST_CARRIER_CODE: v }));
                }}
                check={true}
                label="By"
              />
            </div>
          </div>
          <div className="col-span-2 mainInput flex gap-3">
            <div className="mainInput">
              <CommonDropDown
                id="via"
                data={aport}
                dropHeight="15rem"
                header={commonHeader4}
                title="VIA"
                find={true}
                inputKey={{
                  key: "CODE_CODE",
                  showKey: "0",
                  value: dt?.["RTG_ONWARD_DESTINATION1"],
                }}
                writeFlag={false}
                onClick={(r) => {
                  setDt((prev) => ({
                    ...prev,
                    RTG_ONWARD_DESTINATION1: r["CODE_CODE"],
                    RTG_ONWARD_DESTINATION_NAME1: r["CODE_NAME"],
                  }));
                }}
                labelW="44%"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id="viaName"
                value={dt?.["RTG_ONWARD_DESTINATION_NAME1"] || ""}
                onChange={(v) => {
                  setDt((prev) => ({
                    ...prev,
                    RTG_ONWARD_DESTINATION_NAME1: v,
                  }));
                }}
              />
            </div>
            <div className="mainInput flex items-center gap-3 w-[30%]">
              <CommonInput
                id="by2"
                value={dt?.["RTG_ONWARD_CARRIER1_CODE"] || ""}
                onChange={(v) => {
                  setDt((prev) => ({ ...prev, RTG_ONWARD_CARRIER1_CODE: v }));
                }}
                label="By"
                labelW="30%"
              />
              <Btn
                txt="SET"
                type="NONE"
                onClick={() => {
                  if (
                    dt?.["RTG_ONWARD_CARRIER1_CODE"] === dt?.["CARRIER_PREFIX"]
                  ) {
                    setDt((prev) => ({
                      ...prev,
                      RTG_ONWARD_CARRIER1_CODE: "",
                    }));
                  } else {
                    setDt((prev) => ({
                      ...prev,
                      RTG_ONWARD_CARRIER1_CODE: prev?.["CARRIER_PREFIX"],
                    }));
                  }
                }}
              />
            </div>
          </div>

          <div className="col-span-3 mainInput flex gap-2">
            <div className="mainInput w-[40%]">
              <CommonDropDown
                id="Special Handling Code"
                data={sphcd}
                dropHeight="15rem"
                header={commonHeader4}
                title="Special Handling Code"
                find={true}
                inputKey={{
                  key: "CODE_CODE",
                  showKey: "0",
                  value: dt?.["SPECIAL_HANDLING_CODE"],
                }}
                writeFlag={false}
                onClick={(r) => {
                  setDt((prev) => ({
                    ...prev,
                    SPECIAL_HANDLING_CODE: r["CODE_CODE"],
                    SPECIAL_HANDLING_DESCRIPTION: r["CODE_NAME"],
                  }));
                }}
                labelW="60%"
              />
            </div>
            <div className="mainInput w-[60%]">
              <CommonInput
                id="spcName"
                value={dt?.["SPECIAL_HANDLING_DESCRIPTION"] || ""}
                read={true}
              />
            </div>
          </div>
          <div className="mainInput">
            <CommonChk
              id="dangerousFlag"
              value={dt?.["DANGEROUS_CARGO_FLAG"] === "Y" ? true : false}
              onChange={(v) => {
                setDt((prev) => ({
                  ...prev,
                  DANGEROUS_CARGO_FLAG: v ? "Y" : "N",
                }));
              }}
              title="Density Indicator"
            />
          </div>
        </div>
      </CommonContainer>
      <CommonTab
        tabs={["General Information", "Dimensions & Other Charges"]}
        active={tab}
        setActive={(v) => {
          setTab(v);
        }}>
        {/* 첫번째탭 */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-3">
          <CommonContainer title="Shipper's Name and Address">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 mainInput">
                {" "}
                <CommonInput
                  id="shpName"
                  value={dt?.["SHP_COMPANY_NAME1"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_COMPANY_NAME1: v }));
                  }}
                  label="Name"
                  check={true}
                  length={35}
                  labelW="17%"
                />
              </div>
              <div className="col-span-2 mainInput">
                {" "}
                <CommonInput
                  id="shpAddr"
                  value={dt?.["SHP_STREET_ADDRESS1"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_STREET_ADDRESS1: v }));
                  }}
                  label="Address"
                  check={true}
                  length={35}
                  labelW="17%"
                />
              </div>
              <div className="col-span-2 mainInput">
                {" "}
                <CommonInput
                  id="shpPlace"
                  value={dt?.["SHP_PLACE_NAME"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_PLACE_NAME: v }));
                  }}
                  label="Place"
                  check={true}
                  length={17}
                  labelW="17%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="shpCountry"
                  value={dt?.["SHP_COUNTRY_CODE"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_COUNTRY_CODE: v }));
                  }}
                  label="Country"
                  check={true}
                  length={2}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="shpState"
                  value={dt?.["SHP_STATE_PROVINCE_NAME"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_STATE_PROVINCE_NAME: v }));
                  }}
                  label="State/Province"
                  length={9}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="shpPost"
                  value={dt?.["SHP_POST_CODE"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_POST_CODE: v }));
                  }}
                  label="Post Code"
                  length={9}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="shpPhone"
                  value={dt?.["SHP_PHONE_NO"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_PHONE_NO: v }));
                  }}
                  label="Phone Number"
                  length={25}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="shpVat"
                  value={dt?.["SHP_CRN"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_CRN: v }));
                  }}
                  label="VAT"
                  length={35}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="shpContactName"
                  value={dt?.["SHP_CONTACT_PERSON_NAME"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_CONTACT_PERSON_NAME: v }));
                  }}
                  label="Contact Person Name"
                  length={35}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="shpContactTel"
                  value={dt?.["SHP_CONTACT_PERSON_TEL"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_CONTACT_PERSON_TEL: v }));
                  }}
                  label="Contact Person TEL"
                  length={35}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="aeoNumber"
                  value={dt?.["SHP_AEO"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SHP_AEO: v }));
                  }}
                  label="AEO Number"
                  length={35}
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="Consignee's Name and Address">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 mainInput">
                {" "}
                <CommonInput
                  id="cneName"
                  value={dt?.["CNE_COMPANY_NAME1"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_COMPANY_NAME1: v }));
                  }}
                  label="Name"
                  check={true}
                  length={35}
                  labelW="17%"
                />
              </div>
              <div className="col-span-2 mainInput">
                {" "}
                <CommonInput
                  id="cneAddr"
                  value={dt?.["CNE_STREET_ADDRESS1"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_STREET_ADDRESS1: v }));
                  }}
                  label="Address"
                  check={true}
                  length={35}
                  labelW="17%"
                />
              </div>
              <div className="col-span-2 mainInput">
                {" "}
                <CommonInput
                  id="cnePlace"
                  value={dt?.["CNE_PLACE_NAME"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_PLACE_NAME: v }));
                  }}
                  label="Place"
                  check={true}
                  length={17}
                  labelW="17%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="cneCountry"
                  value={dt?.["CNE_COUNTRY_CODE"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_COUNTRY_CODE: v }));
                  }}
                  label="Country"
                  check={true}
                  length={2}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="cneState"
                  value={dt?.["CNE_STATE_PROVINCE_NAME"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_STATE_PROVINCE_NAME: v }));
                  }}
                  label="State/Province"
                  length={9}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="cnePost"
                  value={dt?.["CNE_POST_CODE"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_POST_CODE: v }));
                  }}
                  label="Post Code"
                  length={9}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="cnePhone"
                  value={dt?.["CNE_PHONE_NO"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_PHONE_NO: v }));
                  }}
                  label="Phone Number"
                  length={25}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="cneVat"
                  value={dt?.["CNE_CRN"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_CRN: v }));
                  }}
                  label="VAT"
                  length={35}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="cneContactName"
                  value={dt?.["CNE_CONTACT_PERSON_NAME"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_CONTACT_PERSON_NAME: v }));
                  }}
                  label="Contact Person Name"
                  length={35}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="cneContactTel"
                  value={dt?.["CNE_CONTACT_PERSON_TEL"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_CONTACT_PERSON_TEL: v }));
                  }}
                  label="Contact Person TEL"
                  length={35}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="CneaeoNumber"
                  value={dt?.["CNE_AEO"]}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CNE_AEO: v }));
                  }}
                  label="AEO Number"
                  length={35}
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="Agent">
            <div className="grid grid-cols-2 gap-3">
              <div className="mainInput">
                <CommonInput
                  id="iataCode"
                  label="IATA Code"
                  value={dt?.["AGT_IATA_CODE"] || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, AGT_IATA_CODE: v }));
                  }}
                  length={14}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="accountNo"
                  label="Account No"
                  value={dt?.["AGT_ACCOUNT_NO"] || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, AGT_ACCOUNT_NO: v }));
                  }}
                  length={14}
                />
              </div>
              <div className="col-span-2 mainInput">
                <CommonInput
                  id="agentName"
                  label="Agent Name"
                  value={dt?.["AGT_COMPANY_NAME"] || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, AGT_COMPANY_NAME: v }));
                  }}
                  length={35}
                  labelW="17.2%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="agentCity"
                  label="Agent City"
                  value={dt?.["AGT_PLACE_NAME"] || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, AGT_PLACE_NAME: v }));
                  }}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="goods"
                  label="Nature of Goods"
                  value={dt?.["GOODS_DESCRIPTION"] || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, GOODS_DESCRIPTION: v }));
                  }}
                  length={30}
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="Charge Declaration">
            <div className="grid grid-cols-[30%_70%] gap-3">
              <div className="mainInput">
                <CommonDropDown
                  id="currency"
                  data={curcd}
                  dropHeight="15rem"
                  header={commonHeader4}
                  onClick={(r) => {
                    setDt((prev) => ({
                      ...prev,
                      CVD_CURRENCY_CODE: r["CODE_CODE"],
                    }));
                  }}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0 : 1",
                    value: dt?.["CVD_CURRENCY_CODE"],
                  }}
                  title="Currency"
                  check={true}
                  find={true}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="declareCarriage"
                  value={
                    dt?.["CVD_DECLARED_CARRIAGE"] !== 0 &&
                    dt?.["CVD_DECLARED_CARRIAGE"] !== "NVD"
                      ? dt?.["CVD_DECLARED_CARRIAGE"]
                      : ""
                  }
                  length={15}
                  label="Declared Value for Carriage"
                  check={true}
                  holder="NVD"
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CVD_DECLARED_CARRIAGE: v }));
                  }}
                />
              </div>
              <div className="mainInput">
                <CommonDropDown
                  id="currency"
                  data={pc}
                  dropHeight="5rem"
                  header={commonHeader2}
                  onClick={(r) => {
                    setDt((prev) => ({
                      ...prev,
                      CVD_PC_IND_WEIGHT: r["CODE_CODE"],
                    }));
                  }}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: dt?.["CVD_PC_IND_WEIGHT"],
                  }}
                  title="WT/Val P/C"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="declareCustoms"
                  value={
                    dt?.["CVD_DECLARED_CUSTOMS"] !== 0 &&
                    dt?.["CVD_DECLARED_CUSTOMS"] !== "NCV"
                      ? dt?.["CVD_DECLARED_CUSTOMS"]
                      : ""
                  }
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CVD_DECLARED_CUSTOMS: v }));
                  }}
                  length={15}
                  label="Declared Value for Customs"
                  check={true}
                  holder="NCV"
                />
              </div>
              <div className="mainInput">
                <CommonDropDown
                  id="currency"
                  data={pc}
                  dropHeight="5rem"
                  header={commonHeader2}
                  onClick={(r) => {
                    setDt((prev) => ({
                      ...prev,
                      CVD_PC_IND_OTHER: r["CODE_CODE"],
                    }));
                  }}
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value: dt?.["CVD_PC_IND_OTHER"],
                  }}
                  title="Other P/C"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="declareCustoms"
                  value={
                    dt?.["CVD_DECLARED_INSURANCE"] !== 0 &&
                    dt?.["CVD_DECLARED_INSURANCE"] !== "XXX"
                      ? dt?.["CVD_DECLARED_INSURANCE"]
                      : ""
                  }
                  length={15}
                  label="Amount of Insurance"
                  check={true}
                  holder="XXX"
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, CVD_DECLARED_INSURANCE: v }));
                  }}
                />
              </div>
            </div>
          </CommonContainer>
          <div className="col-span-2">
            <CommonContainer title="OCI Notify Information">
              <div className="grid grid-cols-4 gap-3">
                <div className="mainInput">
                  <CommonInput
                    id="ociCrn"
                    value={dt?.["NFY_CRN"] || ""}
                    onChange={(v) => {
                      setDt((prev) => ({ ...prev, NFY_CRN: v }));
                    }}
                    label="Notify CRN"
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="ociContactName"
                    value={dt?.["SHP_CONTACT_PERSON_NAME"] || ""}
                    onChange={(v) => {
                      setDt((prev) => ({
                        ...prev,
                        SHP_CONTACT_PERSON_NAME: v,
                      }));
                    }}
                    label="Contact Person Name"
                    length={35}
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="ociContactTel"
                    value={dt?.["SHP_CONTACT_PERSON_TEL"] || ""}
                    onChange={(v) => {
                      setDt((prev) => ({ ...prev, SHP_CONTACT_PERSON_TEL: v }));
                    }}
                    label="Contact Person TEL"
                    length={35}
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="ociAeo"
                    value={dt?.["SHP_AEO"] || ""}
                    onChange={(v) => {
                      setDt((prev) => ({ ...prev, SHP_AEO: v }));
                    }}
                    label="AEO Number"
                    length={35}
                  />
                </div>
              </div>
            </CommonContainer>
          </div>
          <CommonContainer title="Rate Info" check={true}>
            <div className="grid grid-cols-2 gap-3">
              <div className="mainInput">
                <CommonInput
                  id="ratePcs"
                  value={dt?.["NO_OF_PIECES"] || "0"}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      NO_OF_PIECES: confirmObj({ obj: v, type: "NUM" }),
                    }));
                  }}
                  label="Pcs"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="ratePcs"
                  value={dt?.["WEIGHT"] || "0.0"}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      WEIGHT: confirmObj({ obj: v, type: "DOUBLE", fix: 1 }),
                    }));
                  }}
                  label="Wt."
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="rateClass"
                  value={dt?.["RATE_CLASS_CODE"] || ""}
                  onChange={(v) => {
                    if (v.toUpperCase() === "M") {
                      //TOTAL_DETAILS RATE_CHARGE_DETAILS
                      setDt((prev) => ({
                        ...prev,
                        TOTAL_DETAILS: prev?.["RATE_CHARGE_DETAILS"],
                        RATE_CLASS_CODE: v,
                      }));
                    } else {
                      setDt((prev) => {
                        const weight = confirmObj({
                          obj: v,
                          type: "DOUBLE",
                          fix: 3,
                        }) as number;
                        const rateCharge = confirmObj({
                          obj: prev?.["RATE_CHARGE_DETAILS"] || "0.0",
                          type: "DOUBLE",
                          fix: 3,
                        }) as number;
                        const sum = confirmObj({
                          obj: (weight * rateCharge).toString(),
                          type: "DOUBLE",
                          fix: 3,
                        });
                        return {
                          ...prev,
                          TOTAL_DETAILS: sum,
                          PPD_WEIGHT_CHARGE: sum,
                          PPD_TOTAL_CHARGE_SUMMARY: sum,
                          RATE_CLASS_CODE: v,
                        };
                      });
                    }
                  }}
                  label="Rate Class"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="rateCharge"
                  value={dt?.["CHARGEABLE_WEIGHT_DETAILS"] || "0.000"}
                  onChange={(v) => {
                    if (
                      String(dt?.["RATE_CLASS_CODE"] || "").toUpperCase() ===
                      "M"
                    ) {
                      //TOTAL_DETAILS RATE_CHARGE_DETAILS
                      setDt((prev) => ({
                        ...prev,
                        TOTAL_DETAILS: prev?.["RATE_CHARGE_DETAILS"],
                        CHARGEABLE_WEIGHT_DETAILS: confirmObj({
                          obj: v,
                          type: "DOUBLE",
                          fix: 3,
                        }),
                      }));
                    } else {
                      setDt((prev) => {
                        const weight = confirmObj({
                          obj: v,
                          type: "DOUBLE",
                          fix: 3,
                        }) as number;
                        const rateCharge = confirmObj({
                          obj: prev?.["RATE_CHARGE_DETAILS"] || "0.0",
                          type: "DOUBLE",
                          fix: 3,
                        }) as number;
                        const sum = confirmObj({
                          obj: (weight * rateCharge).toString(),
                          type: "DOUBLE",
                          fix: 3,
                        });
                        return {
                          ...prev,
                          TOTAL_DETAILS: sum,
                          PPD_WEIGHT_CHARGE: sum,
                          PPD_TOTAL_CHARGE_SUMMARY: sum,
                          CHARGEABLE_WEIGHT_DETAILS: weight,
                        };
                      });
                    }
                  }}
                  label="Chargeable Wt."
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="rateRate"
                  value={dt?.["RATE_CHARGE_DETAILS"] || "0.000"}
                  onChange={(v) => {
                    const tmp = confirmObj({
                      obj: v,
                      type: "DOUBLE",
                      fix: 3,
                    }) as number;
                    if (
                      String(dt?.["RATE_CLASS_CODE"] || "").toUpperCase() ===
                      "M"
                    ) {
                      //TOTAL_DETAILS RATE_CHARGE_DETAILS
                      setDt((prev) => ({
                        ...prev,
                        TOTAL_DETAILS: tmp,
                        RATE_CHARGE_DETAILS: tmp,
                      }));
                    } else {
                      setDt((prev) => {
                        const weight = confirmObj({
                          obj: prev?.["CHARGEABLE_WEIGHT_DETAILS"] || "0.0",
                          type: "DOUBLE",
                          fix: 3,
                        }) as number;
                        const sum = confirmObj({
                          obj: (weight * tmp).toString(),
                          type: "DOUBLE",
                          fix: 3,
                        });
                        return {
                          ...prev,
                          TOTAL_DETAILS: sum,
                          PPD_WEIGHT_CHARGE: sum,
                          PPD_TOTAL_CHARGE_SUMMARY: sum,
                          RATE_CHARGE_DETAILS: tmp,
                        };
                      });
                    }
                  }}
                  label="Rate"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="totalAmt"
                  value={dt?.["TOTAL_DETAILS"] || "0.000"}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      TOTAL_DETAILS: confirmObj({
                        obj: v,
                        type: "DOUBLE",
                        fix: 3,
                      }),
                    }));
                  }}
                  label="Total Amt."
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="Prepaid">
            <div className="grid grid-cols-2 gap-3">
              <div className="mainInput">
                <CommonInput
                  id="wtCharge"
                  value={dt?.["PPD_WEIGHT_CHARGE"] || "0.000"}
                  label="Weight Charge"
                  onChange={(v) => {
                    const tmp = confirmObj({
                      obj: v,
                      type: "DOUBLE",
                      fix: 3,
                    }) as number;
                    setDt((prev) => ({
                      ...prev,
                      PPD_WEIGHT_CHARGE: tmp,
                    }));
                  }}
                  labelW="40%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="valuationCharge"
                  value={dt?.["PPD_VALUATION_CHARGE"] || "0.000"}
                  label="Valuation Charge"
                  onChange={(v) => {
                    const tmp = confirmObj({
                      obj: v,
                      type: "DOUBLE",
                      fix: 3,
                    }) as number;
                    setDt((prev) => ({
                      ...prev,
                      PPD_VALUATION_CHARGE: tmp,
                    }));
                  }}
                  labelW="40%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="tax"
                  value={dt?.["PPD_TAXES"] || "0.000"}
                  label="Tax"
                  onChange={(v) => {
                    const tmp = confirmObj({
                      obj: v,
                      type: "DOUBLE",
                      fix: 3,
                    }) as number;
                    setDt((prev) => ({
                      ...prev,
                      PPD_TAXES: tmp,
                    }));
                  }}
                  labelW="40%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="totalAgent"
                  value={dt?.["PPD_OTHER_CHARGE_AGENT"] || "0.000"}
                  label="Total Other Due Agent"
                  onChange={(v) => {
                    const tmp = confirmObj({
                      obj: v,
                      type: "DOUBLE",
                      fix: 3,
                    }) as number;
                    setDt((prev) => ({
                      ...prev,
                      PPD_OTHER_CHARGE_AGENT: tmp,
                    }));
                  }}
                  labelW="40%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="totalCarrier"
                  value={dt?.["PPD_OTHER_CHARGE_CARRIER"] || "0.000"}
                  label="Total Other Due Carrier"
                  onChange={(v) => {
                    const tmp = confirmObj({
                      obj: v,
                      type: "DOUBLE",
                      fix: 3,
                    }) as number;
                    setDt((prev) => ({
                      ...prev,
                      PPD_OTHER_CHARGE_CARRIER: tmp,
                    }));
                  }}
                  labelW="40%"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="total"
                  value={dt?.["PPD_TOTAL_CHARGE_SUMMARY"] || "0.000"}
                  label="Total"
                  read={true}
                  labelW="40%"
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="Carrier’s Execution">
            <div className="grid grid-cols-2 gap-3">
              <div className="mainInput">
                <CommonDatePicker
                  id="executeDate"
                  onClick={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      ISU_AWB_ISSUE_YEAR: v.substring(0, 4),
                      ISU_AWB_ISSUE_MONTH: v.substring(4, 6),
                      ISU_AWB_ISSUE_DAY: v.substring(6, 8),
                    }));
                  }}
                  value={
                    dt?.["ISU_AWB_ISSUE_YEAR"] +
                    dt?.["ISU_AWB_ISSUE_MONTH"] +
                    dt?.["ISU_AWB_ISSUE_DAY"]
                  }
                  title="Executed on (Date)"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="executeAt"
                  value={dt?.["ISU_AWB_ISSUE_PLACE_CODE"]}
                  length={3}
                  label="at(Place)"
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, ISU_AWB_ISSUE_PLACE_CODE: v }));
                  }}
                />
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="ULD Info">
            <div className="grid grid-cols-3 gap-3">
              <div className="mainInput">
                <CommonDropDown
                  id="uldNo"
                  data={uldTs}
                  dropHeight="10rem"
                  header={ULD_TS_HEADER}
                  inputKey={{
                    key: "ULD_NO",
                    showKey: "0",
                    value: dt?.["WORK_ULD_NO"],
                  }}
                  onClick={(r) => {
                    setDt((prev) => ({ ...prev, WORK_ULD_NO: r["ULD_NO"] }));
                  }}
                  title="ULD No"
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="workPcs"
                  label="Work Pcs"
                  value={dt?.["FWB_WORK_NO_OF_PACKAGE"] || "0"}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      FWB_WORK_NO_OF_PACKAGE: confirmObj({
                        type: "NUM",
                        obj: v,
                      }),
                    }));
                  }}
                />
              </div>
              <div className="mainInput">
                <CommonInput
                  id="workWt"
                  label="Work Wt"
                  value={dt?.["FWB_WORK_WEIGHT"] || "0.000"}
                  onChange={(v) => {
                    setDt((prev) => ({
                      ...prev,
                      FWB_WORK_WEIGHT: confirmObj({
                        type: "DOUBLE",
                        obj: v,
                        fix: 3,
                      }),
                    }));
                  }}
                />
              </div>
            </div>
          </CommonContainer>
        </div>
        {/* 두번째탭 */}
        <div className="flex flex-col gap-x-5 gap-y-3">
          <CommonContainer title="Rate Description">
            <div className="grid grid-cols-4 gap-3">
              <div className="mainInput col-span-4">
                {" "}
                <CommonLabel
                  id="dimensions"
                  label="- Dimensions"
                  justify="START"
                />
              </div>
              <div className="col-span-3 grid grid-cols-4 gap-3">
                <div className="mainInput">
                  <CommonInput
                    id="dimenLength"
                    value={dt?.["DIM_LENGTH"] || "0"}
                    length={12}
                    onChange={(v) => {
                      setDt((prev) => ({
                        ...prev,
                        DIM_LENGTH: confirmObj({ type: "NUM", obj: v }),
                      }));
                    }}
                    label="Length"
                    labelW="20%"
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="dimenWidth"
                    value={dt?.["DIM_WIDTH"] || "0"}
                    length={12}
                    onChange={(v) => {
                      setDt((prev) => ({
                        ...prev,
                        DIM_WIDTH: confirmObj({ type: "NUM", obj: v }),
                      }));
                    }}
                    label="Width"
                    labelW="20%"
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="dimenHeight"
                    value={dt?.["DIM_HEIGHT"] || "0"}
                    length={12}
                    onChange={(v) => {
                      setDt((prev) => ({
                        ...prev,
                        DIM_HEIGHT: confirmObj({ type: "NUM", obj: v }),
                      }));
                    }}
                    label="Height"
                    labelW="20%"
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="dimenPieces"
                    value={dt?.["DIM_NO_OF_PACKAGE"] || "0"}
                    length={12}
                    onChange={(v) => {
                      setDt((prev) => ({
                        ...prev,
                        DIM_NO_OF_PACKAGE: confirmObj({ type: "NUM", obj: v }),
                      }));
                    }}
                    label="Pieces"
                    labelW="20%"
                  />
                </div>
              </div>
              <div />
              <div className="col-span-4 grid grid-cols-[14%_22%_12%_15%_15%] gap-3">
                <div className="mainInput col-span-2">
                  {" "}
                  <CommonLabel id="volume" label="- Volume" justify="START" />
                </div>
                <div className="mainInput col-span-3">
                  {" "}
                  <CommonLabel
                    id="uldNumber"
                    label="- ULD Number"
                    justify="START"
                  />
                </div>
                <div className="mainInput">
                  <CommonDropDown
                    id="volumeCode"
                    data={volume}
                    header={commonHeader4}
                    dropHeight="10rem"
                    title="CODE"
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 : 1",
                      value: dt?.["VOLUME_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        VOLUME_CODE: r["CODE_CODE"],
                      }));
                    }}
                    labelW="28%"
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="volumeAmount"
                    value={dt?.["VOLUME_AMOUNT"]}
                    label="Amount"
                    onChange={(v) => {
                      setDt((prev) => ({
                        ...prev,
                        VOLUME_AMOUNT: confirmObj({ type: "NUM", obj: v }),
                      }));
                    }}
                    length={12}
                    labelW="20%"
                  />
                </div>
                <div className="mainInput">
                  <CommonDropDown
                    id="uldType"
                    data={uldType}
                    header={commonHeader4}
                    dropHeight="10rem"
                    title="Type"
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0",
                      value: dt?.["ULD_TYPE_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        ULD_TYPE_CODE: r["CODE_CODE"],
                      }));
                    }}
                    find={true}
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    id="uldSerial"
                    value={dt?.["ULD_SERIAL_NO"]}
                    label="Serial No"
                    onChange={(v) => {
                      setDt((prev) => ({
                        ...prev,
                        ULD_SERIAL_NO: v,
                      }));
                    }}
                    labelW="25%"
                    length={12}
                  />
                </div>
                <div className="mainInput ">
                  <CommonDropDown
                    id="uldCarrier"
                    data={carrier}
                    header={commonHeader4}
                    dropHeight="10rem"
                    title="Owner Code"
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 / 1",
                      value: dt?.["ULD_OWNER_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        ULD_OWNER_CODE: r["CODE_CODE"],
                      }));
                    }}
                    find={true}
                    labelW="45%"
                  />
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-[40%_40%] gap-3">
                <div className="flex flex-col">
                  <div className="mainInput">
                    <CommonLabel
                      id="hcc"
                      label="- Harmonise Commodity Code"
                      justify="START"
                    />
                  </div>
                  <div className="mainInput">
                    <CommonInput
                      id="hccCode"
                      value={dt?.["HARMONISED_COMMODITY_CODE"]}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          HARMONISED_COMMODITY_CODE: v,
                        }));
                      }}
                      labelW="20%"
                      label="Code"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="mainInput">
                    <CommonLabel
                      id="cog"
                      label="- Country of Origin of Goods"
                      justify="START"
                    />
                  </div>
                  <div className="mainInput">
                    <CommonDropDown
                      id="cogCode"
                      data={country}
                      header={commonHeader4}
                      dropHeight="10rem"
                      title="Country Code"
                      inputKey={{
                        key: "CODE_CODE",
                        showKey: "0 / 1",
                        value: dt?.["COUNTRY_OF_ORIGIN_GOODS"],
                      }}
                      onClick={(r) => {
                        setDt((prev) => ({
                          ...prev,
                          COUNTRY_OF_ORIGIN_GOODS: r["CODE_CODE"],
                        }));
                      }}
                      find={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CommonContainer>
          <CommonContainer title="Other Charges">
            <div className="grid grid-cols-[15%_27%_27%_27%] gap-3">
              <div className="mainInput">
                <CommonDropDown
                  id="othPc"
                  data={pc}
                  header={commonHeader2}
                  dropHeight="5rem"
                  title="P/C"
                  inputKey={{
                    key: "CODE_CODE",
                    showKey: "0",
                    value:
                      dt?.["OTH_PC_IND_OTHER"] ||
                      (pc.length > 0 && pc[0]["CODE_CODE"]) ||
                      "",
                  }}
                  labelW="20%"
                  onClick={(r) => {
                    setDt((prev) => ({
                      ...prev,
                      OTH_PC_IND_OTHER: r["CODE_CODE"],
                    }));
                  }}
                />
              </div>
              <div className="flex flex-col gap-3">
                <div className="mainInput">
                  <CommonDropDown
                    id="chargeCode1"
                    data={otherCharge}
                    dropHeight="15rem"
                    header={commonHeader4}
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 / 1",
                      value: dt?.["OTH_OTHER_CHARGE1_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        OTH_OTHER_CHARGE1_CODE: r["CODE_CODE"],
                      }));
                    }}
                    title="Charge Code 01"
                    labelW=""
                    find={true}
                  />
                </div>
                <div className="mainInput">
                  <CommonDropDown
                    id="entitlement1"
                    data={entitlement}
                    dropHeight="10rem"
                    header={commonHeader4}
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 / 1",
                      value: dt?.["OTH_ENTITLEMENT1_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        OTH_ENTITLEMENT1_CODE: r["CODE_CODE"],
                      }));
                    }}
                    title="Entitlement Coder 01"
                    labelW=""
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    value={dt?.["OTH_CHARGE1_AMOUNT"]}
                    id="Charge Amount"
                    label="Charge Amount 01"
                    onChange={(v) => {
                      setDt((prev) => ({ ...prev, OTH_CHARGE1_AMOUNT: v }));
                    }}
                    length={12}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="mainInput">
                  <CommonDropDown
                    id="chargeCode2"
                    data={otherCharge}
                    dropHeight="15rem"
                    header={commonHeader4}
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 / 1",
                      value: dt?.["OTH_OTHER_CHARGE2_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        OTH_OTHER_CHARGE2_CODE: r["CODE_CODE"],
                      }));
                    }}
                    title="Charge Code 02"
                    labelW=""
                    find={true}
                  />
                </div>
                <div className="mainInput">
                  <CommonDropDown
                    id="entitlement2"
                    data={entitlement}
                    dropHeight="10rem"
                    header={commonHeader4}
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 / 1",
                      value: dt?.["OTH_ENTITLEMENT2_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        OTH_ENTITLEMENT2_CODE: r["CODE_CODE"],
                      }));
                    }}
                    title="Entitlement Coder 02"
                    labelW=""
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    value={dt?.["OTH_CHARGE2_AMOUNT"]}
                    id="Charge Amount2"
                    label="Charge Amount 02"
                    onChange={(v) => {
                      setDt((prev) => ({ ...prev, OTH_CHARGE2_AMOUNT: v }));
                    }}
                    length={12}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="mainInput">
                  <CommonDropDown
                    id="chargeCode3"
                    data={otherCharge}
                    dropHeight="15rem"
                    header={commonHeader4}
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 / 1",
                      value: dt?.["OTH_OTHER_CHARGE3_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        OTH_OTHER_CHARGE3_CODE: r["CODE_CODE"],
                      }));
                    }}
                    title="Charge Code 03"
                    labelW=""
                    find={true}
                  />
                </div>
                <div className="mainInput">
                  <CommonDropDown
                    id="entitlement3"
                    data={entitlement}
                    dropHeight="10rem"
                    header={commonHeader4}
                    inputKey={{
                      key: "CODE_CODE",
                      showKey: "0 / 1",
                      value: dt?.["OTH_ENTITLEMENT3_CODE"],
                    }}
                    onClick={(r) => {
                      setDt((prev) => ({
                        ...prev,
                        OTH_ENTITLEMENT3_CODE: r["CODE_CODE"],
                      }));
                    }}
                    title="Entitlement Coder 03"
                    labelW=""
                  />
                </div>
                <div className="mainInput">
                  <CommonInput
                    value={dt?.["OTH_CHARGE3_AMOUNT"]}
                    id="Charge Amount3"
                    label="Charge Amount 03"
                    onChange={(v) => {
                      setDt((prev) => ({ ...prev, OTH_CHARGE3_AMOUNT: v }));
                    }}
                    length={12}
                  />
                </div>
              </div>
            </div>
          </CommonContainer>
        </div>
      </CommonTab>
    </div>
  );
}
