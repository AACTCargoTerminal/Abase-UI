import { useEffect, useState } from "react";
import { CommonContainer } from "../../comp/Container";
import { CommonChk, CommonInput } from "../../comp/Input";
import { type DefComp, type Fwb16Type, type TableRow } from "../../Util/Type";
import { Btn } from "../../comp/Btn";
import {
  confirmObj,
  getApi,
  getDouble,
  getInt,
  getMenu,
  getUUID,
  openModal,
  sendErr,
  sendLoading,
  sendSuc,
} from "../../Util/Util";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { CommonDatePicker, CommonDropDown } from "../../comp/DropDown";
import moment from "moment";
import { confirmAsync, openConfirm } from "../../confirmService";
import { clearParam } from "../../slices/user";
import { ModalCust } from "../../comp/Common";
import SchChange from "../common/SchChange";

export default function Fwb16({ param, pgmId, sch }: DefComp) {
  const [dt, setDt] = useState<Fwb16Type>({});
  const [othArray, setOthArray] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [othCount, setOthCount] = useState<number>(1);
  const [ociArray, setOciArray] = useState<number[]>([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);
  const [ociCount, setOciCount] = useState<number>(1);

  const [sysOpen, setSysOpen] = useState<boolean>(false);
  const [schSid, setSchSid] = useState("0");

  useEffect(() => {
    if (param) {
      getMawb010_001({
        mawb: param["mawb_no"],
        schParam: param["schedule_sid"],
      });
      setSchSid(param["schedule_sid"]);
    }
  }, [param?.["mawb_no"], param?.["schedule_sid"], param?.["schedule_sid"]]);

  function setCls() {
    setOthCount(1);
    setOciCount(1);
    setSysOpen(false);
    setDt({
      mawbInput: dt.mawbInput,
      FLT_FLIGHT_DAY: moment().format("YYYYMMDD"),
      PROGRESS_GUID: getUUID(),
      COUNTRY_CODE_2: "",
    });
  }

  async function getMawb010_001({
    mawb,
    schParam,
  }: {
    mawb: string;
    schParam?: string;
  }) {
    sendLoading(true);
    setCls();
    const res = await getApi<Record<number, Fwb16Type[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getMawb010_001?mawb=${mawb}&inoutFlag=&schSid=${
        schParam || schSid
      }`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data) {
        const data = res.data[0][0];
        if (Object.keys(data).length > 0) {
          data.mawbInput = mawb;

          setDt(data);

          if (data.OTH_PC_IND_OTHER_F) {
            setOthCount(6);
          } else if (data.OTH_PC_IND_OTHER_E) {
            setOthCount(5);
          } else if (data.OTH_PC_IND_OTHER_D) {
            setOthCount(4);
          } else if (data.OTH_PC_IND_OTHER_C) {
            setOthCount(3);
          } else if (data.OTH_PC_IND_OTHER_B) {
            setOthCount(2);
          } else if (data.OTH_PC_IND_OTHER_A) {
            setOthCount(1);
          }

          if (data.COUNTRY_CODE_12) {
            setOciCount(12);
          } else if (data.COUNTRY_CODE_11) {
            setOciCount(11);
          } else if (data.COUNTRY_CODE_10) {
            setOciCount(10);
          } else if (data.COUNTRY_CODE_9) {
            setOciCount(9);
          } else if (data.COUNTRY_CODE_8) {
            setOciCount(8);
          } else if (data.COUNTRY_CODE_7) {
            setOciCount(7);
          } else if (data.COUNTRY_CODE_6) {
            setOciCount(6);
          } else if (data.COUNTRY_CODE_5) {
            setOciCount(5);
          } else if (data.COUNTRY_CODE_4) {
            setOciCount(4);
          } else if (data.COUNTRY_CODE_3) {
            setOciCount(3);
          } else if (data.COUNTRY_CODE_2) {
            setOciCount(2);
          } else if (data.COUNTRY_CODE_1) {
            setOciCount(1);
          }

          sendLoading(false);
          return;
        }
      }
      sendSuc("데이터가 없습니다.");
    }
    sendLoading(false);
  }

  function clickOth(flag: boolean) {
    setOthCount((prev) => {
      if (flag) {
        // +
        if (prev < 6) return prev + 1;
        return prev;
      } else {
        // -
        if (prev > 1) return prev - 1;
        return prev;
      }
    });
  }

  function clickOci(flag: boolean) {
    setOciCount((prev) => {
      if (flag) {
        // +
        if (prev < 12) return prev + 1;
        return prev;
      } else {
        // -
        if (prev > 1) return prev - 1;
        return prev;
      }
    });
  }

  function changeStr(num: number): string {
    switch (num) {
      case 2:
        return "B";
      case 3:
        return "C";
      case 4:
        return "D";
      case 5:
        return "E";
      case 6:
        return "F";
      case 1:
      default:
        return "A";
    }
  }

  async function delFwb() {
    if (!dt.MASTER_AIR_WAY_BILL_SID) {
      sendErr("정상적인 FWB가 아닙니다. 재조회 해주세요");
      return;
    }

    sendLoading(true);

    const res = await getApi<Record<number, Fwb16Type[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/setMawb010_021?mawbSid=${dt.MASTER_AIR_WAY_BILL_SID}`,
      pgmId: pgmId,
    });
    if (res.ok) {
      sendSuc("삭제완료");
    }
    setCls();
    sendLoading(false);
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
            SCH_FLIGHT_DATE: tmp["FLIGHT_DATE"],
            SCH_FLIGHT_NO: tmp["FLIGHT_NO"],
            SCH_INOUT_FLAG: tmp["INOUT_FLAG"],
            SCH_ORIGIN_CODE: tmp["ORIGIN_CODE"],
            SCH_DESTINATION_CODE: tmp["DESTINATION_CODE"],
          }));
        }
      }
    }
    sendLoading(false);
  }

  async function clickSave() {
    var tmpDt = dt;
    if (!tmpDt.MASTER_AIR_WAY_BILL_SID) {
      tmpDt = { ...tmpDt, PROGRESS_GUID: getUUID() };
    }
    if (!tmpDt.AWB_NO) {
      sendErr("MAWB 누락되었습니다. MAWB 입력하십시요.");
      document.getElementById("mawb")?.focus();
      return;
    }

    if (!tmpDt.ORIGIN_CODE || !tmpDt.DESTINATION_CODE) {
      sendErr("Origin, Destination 누락되었습니다.");
      if (!tmpDt.ORIGIN_CODE) {
        document.getElementById("fltOrigin")?.focus();
      } else {
        document.getElementById("fltDest")?.focus();
      }

      return;
    }

    if (
      tmpDt.DESTINATION_CODE &&
      tmpDt.ORIGIN_CODE === tmpDt.DESTINATION_CODE
    ) {
      sendErr("Origin, Destination 같을 수 없습니다. 확인하십시요.");
      document.getElementById("fltDest")?.focus();
      return;
    }

    if (!tmpDt.SCHEDULE_SID) {
      if (tmpDt.AUTO_SCHEDULE_SID && tmpDt.AUTO_SCHEDULE_STR) {
        const conRet = await confirmAsync({
          title: "스케줄확인",
          message: `스케줄 정보를 ${tmpDt.AUTO_SCHEDULE_STR} \n 로 저장합니까?`,
        });

        if (conRet) {
          tmpDt = { ...tmpDt, SCHEDULE_SID: tmpDt.AUTO_SCHEDULE_SID };
        } else {
          return;
        }
      }
    }

    if (tmpDt.CARRIER_PREFIX) {
      if (
        tmpDt.RTG_ONWARD_DESTINATION1 &&
        tmpDt.RTG_ONWARD_CARRIER1_CODE !== tmpDt.CARRIER_PREFIX
      ) {
        const conRet = await confirmAsync({
          title: "By2 편명 오류",
          message: `(*) 수정 필요 : ${tmpDt.RTG_ONWARD_CARRIER1_CODE} ==> ${tmpDt.CARRIER_PREFIX}\n수정없이 저장합니까?`,
        });

        if (!conRet) {
          return;
        }
      }
    }
    const saveDt = new Map<keyof Fwb16Type, Fwb16Type[keyof Fwb16Type]>();

    (Object.keys(tmpDt) as (keyof Fwb16Type)[]).forEach((key) => {
      saveDt.set(key, tmpDt[key] || "");
    });
    sendLoading(true);

    const res = await getApi<number>({
      baseUrl: "CIMP",
      method: "POST",
      url: `/cimp/setMawb010_011`, //?pgm_id=${route?.PROGRAM_ID || "pgm_id"}
      params: saveDt,
      pgmId: pgmId,
      sucFlag: true,
    });
    if (res.ok) {
      if (res.data) {
        setDt((prev) => ({
          ...prev,
          MASTER_AIR_WAY_BILL_SID: Number(res.data),
        }));
      }
    }
    sendLoading(false);
  }

  return (
    <div className="p-[1.5rem] flex flex-col gap-5">
      <CommonContainer
        title="AWB PROC( FWB V.16 )"
        childrenTitle={
          <div className="flex w-full h-full items-center justify-between gap-1 px-[0.5%]">
            <div className="flex items-center gap-1 w-[30%] h-full">
              <CommonInput
                id="mawbInput"
                label="MAWB Input"
                value={dt.mawbInput || ""}
                onChange={(v) => {
                  const reg = /^[0-9-]*$/;
                  if (reg.test(v.replaceAll(" ", ""))) {
                    const reg2 = /^[0-9]{11}$/;
                    setDt((p) => ({ ...p, mawbInput: v }));
                    if (reg2.test(v.replaceAll("-", "").replaceAll(" ", ""))) {
                      getMawb010_001({ mawb: v || "" });
                    }
                  }
                }}
                labelW="28%"
                setClear={true}
                auto={true}
              />
              <Btn
                txt="SEARCH"
                onClick={() => {
                  getMawb010_001({ mawb: dt.mawbInput || "" });
                }}
                width="40%"
                type="SEARCH"
              />
            </div>
            <div className="flex w-[15%] items-center gap-1 justify-end">
              <Btn
                txt="SAVE"
                onClick={() => {
                  clickSave();
                }}
                width="30%"
                type="SAVE"
              />
              <Btn
                txt="DEL"
                onClick={() => {
                  openConfirm({
                    title: "Delete",
                    message: "삭제 하시겠습니까?",
                    no() {},
                    yes() {
                      delFwb();
                    },
                  });
                }}
                width="25%"
                type="DELETE"
              />
            </div>
          </div>
        }>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-[18%] mainInput">
              <CommonInput
                id="mawb"
                value={dt.AWB_NO || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, AWB_NO: v }))}
                check={true}
                label="MAWB No."
                labelW="26%"
                length={11}
              />
            </div>
            <div className="w-[7%] mainInput">
              <CommonChk
                value={dt.CONSOL_FLAG && dt.CONSOL_FLAG === "Y" ? true : false}
                id="console"
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, CONSOL_FLAG: v ? "Y" : "N" }))
                }
                title="Consolidation"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[10%] mainInput">
              <CommonInput
                id="fltNo"
                value={dt.FLIGHT_NUMBER || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, FLIGHT_NUMBER: v }))
                }
                check={true}
                label="Flight No."
                labelW="46%"
                length={7}
              />
            </div>
            <div className="w-[7.5%] pl-[0.5%] mainInput">
              <CommonInput
                id="fltDayOnly"
                value={dt.FLT_FLIGHT_DAY_ONLY || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, FLT_FLIGHT_DAY_ONLY: v }))
                }
                label="Day"
                labelW="30%"
                length={2}
              />
            </div>
            <div className="w-[16%] ml-[0.5%] mainInput">
              <CommonDatePicker
                value={dt.FLT_FLIGHT_DAY || ""}
                onClick={(v) =>
                  setDt((prev) => ({ ...prev, FLT_FLIGHT_DAY: v }))
                }
                title="Flight Date"
                id="fltDate"
                check={true}
                colSize="30%"
              />
            </div>
            <div className="w-[7%] mainInput">
              <CommonInput
                id="fltOrigin"
                value={dt.ORIGIN_CODE || ""}
                onChange={(v) => setDt((prev) => ({ ...prev, ORIGIN_CODE: v }))}
                label="Origin"
                check={true}
                labelW="45%"
                length={3}
              />
            </div>
            <div className="w-[10%] mainInput">
              <CommonInput
                id="fltDest"
                value={dt.DESTINATION_CODE || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, DESTINATION_CODE: v }))
                }
                label="Destination"
                check={true}
                labelW="55%"
                length={3}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[10%] mainInput">
              <CommonInput
                id="rtgDes"
                value={dt.RTG_FIRST_DESTINATION || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, RTG_FIRST_DESTINATION: v }))
                }
                label="RTG Dest"
                labelW="46%"
                length={3}
              />
            </div>
            <div className="w-[7.5%] pl-[0.5%] mainInput">
              <CommonInput
                id="by"
                value={dt.RTG_FIRST_CARRIER_CODE || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, RTG_FIRST_CARRIER_CODE: v }))
                }
                label="By"
                check={true}
                labelW="30%"
                length={2}
              />
            </div>
            <div className="w-[9%] pl-[0.5%] mainInput">
              <CommonInput
                id="rtgDest2"
                value={dt.RTG_ONWARD_DESTINATION1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, RTG_ONWARD_DESTINATION1: v }))
                }
                label="RTG Dest2"
                labelW="50%"
                length={3}
              />
            </div>
            <div className="w-[7%] pl-[0.5%] mainInput">
              <CommonInput
                id="by2"
                value={dt.RTG_ONWARD_CARRIER1_CODE || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, RTG_ONWARD_CARRIER1_CODE: v }))
                }
                label="By2"
                labelW="30%"
                length={2}
              />
            </div>
            <div className="w-[3%]">
              <Btn
                txt="SET"
                onClick={() => {
                  if (dt.RTG_ONWARD_CARRIER1_CODE === dt.CARRIER_PREFIX) {
                    setDt((prev) => ({
                      ...prev,
                      RTG_ONWARD_CARRIER1_CODE: "",
                    }));
                  } else {
                    setDt((prev) => ({
                      ...prev,
                      RTG_ONWARD_CARRIER1_CODE: prev.CARRIER_PREFIX,
                    }));
                  }
                }}
                type="NONE"
              />
            </div>
          </div>
        </div>
      </CommonContainer>
      <CommonContainer title="Special Handling Code">
        <div className="flex items-center gap-3">
          <div className="w-[5%] mainInput">
            <CommonInput
              id="shc1"
              value={dt.SPECIAL_HANDLING_CODE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, SPECIAL_HANDLING_CODE: v }))
              }
              length={3}
            />
          </div>
          <div className="w-[5%] mainInput">
            <CommonInput
              id="shc2"
              value={dt.SPECIAL_HANDLING_CODE2 || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, SPECIAL_HANDLING_CODE2: v }))
              }
              length={3}
            />
          </div>
          <div className="w-[5%] mainInput">
            <CommonInput
              id="shc3"
              value={dt.SPECIAL_HANDLING_CODE3 || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, SPECIAL_HANDLING_CODE3: v }))
              }
              length={3}
            />
          </div>
          <div className="w-[5%] mainInput">
            <CommonInput
              id="shc4"
              value={dt.SPECIAL_HANDLING_CODE4 || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, SPECIAL_HANDLING_CODE4: v }))
              }
              length={3}
            />
          </div>
          <div className="w-[5%] mainInput">
            <CommonInput
              id="shc5"
              value={dt.SPECIAL_HANDLING_CODE5 || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, SPECIAL_HANDLING_CODE5: v }))
              }
              length={3}
            />
          </div>
          <div className="w-[5%] mainInput">
            <CommonInput
              id="shc6"
              value={dt.SPECIAL_HANDLING_CODE6 || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, SPECIAL_HANDLING_CODE6: v }))
              }
              length={3}
            />
          </div>
          <div className="w-[10%] mainInput">
            <CommonChk
              value={
                dt.DANGEROUS_CARGO_FLAG && dt.DANGEROUS_CARGO_FLAG === "Y"
                  ? true
                  : false
              }
              id="indicator"
              onChange={(v) =>
                setDt((prev) => ({
                  ...prev,
                  DANGEROUS_CARGO_FLAG: v ? "Y" : "N",
                }))
              }
              title="Density Indicator"
            />
          </div>
        </div>
      </CommonContainer>
      <div className="flex w-full items-center justify-between">
        <CommonContainer title="SHP : Shipper" width="49%">
          <div className="flex flex-col gap-3">
            <div className="w-[70%] mainInput">
              <CommonInput
                id="shpName"
                value={dt.SHP_COMPANY_NAME1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, SHP_COMPANY_NAME1: v }))
                }
                check={true}
                label="Name"
                length={35}
                labelW="21%"
              />
            </div>
            <div className="w-[100%] mainInput">
              <CommonInput
                id="shpAddr"
                value={dt.SHP_STREET_ADDRESS1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, SHP_STREET_ADDRESS1: v }))
                }
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
                value={dt.SHP_PLACE_NAME || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, SHP_PLACE_NAME: v }))
                }
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
                  value={dt.SHP_COUNTRY_CODE || ""}
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
                  value={dt.SHP_STATE_PROVINCE_NAME || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, SHP_STATE_PROVINCE_NAME: v }))
                  }
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
                  value={dt.SHP_POST_CODE || ""}
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
                  value={dt.SHP_PHONE_NO || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, SHP_PHONE_NO: v }))
                  }
                  label="Phone Number"
                  length={28}
                  labelW="30%"
                />
              </div>
            </div>
          </div>
        </CommonContainer>
        <CommonContainer title="CNE : Consignee" width="49%">
          <div className="w-full flex flex-col gap-3">
            <div className="w-[70%] mainInput">
              <CommonInput
                id="cneName"
                value={dt.CNE_COMPANY_NAME1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, CNE_COMPANY_NAME1: v }))
                }
                check={true}
                label="Name"
                labelW="21%"
                length={35}
              />
            </div>
            <div className="w-full mainInput">
              <CommonInput
                id="cneAddr"
                value={dt.CNE_STREET_ADDRESS1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, CNE_STREET_ADDRESS1: v }))
                }
                check={true}
                label="Address"
                labelW="14.7%"
                length={35}
              />
            </div>
            <div className="w-full mainInput">
              <CommonInput
                id="cnePlace"
                value={dt.CNE_PLACE_NAME || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, CNE_PLACE_NAME: v }))
                }
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
                  value={dt.CNE_COUNTRY_CODE || ""}
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
                  value={dt.CNE_STATE_PROVINCE_NAME || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, CNE_STATE_PROVINCE_NAME: v }))
                  }
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
                  value={dt.CNE_POST_CODE || ""}
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
                  value={dt.CNE_PHONE_NO || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, CNE_PHONE_NO: v }))
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
      <div className="flex w-full items-center justify-between">
        <CommonContainer title="AGT : Agent" width="49%">
          <div className="flex flex-col gap-3 justify-center py-[5.84%]">
            <div className="w-[100%] mainInput">
              <CommonInput
                id="agtName"
                value={dt.AGT_COMPANY_NAME || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, AGT_COMPANY_NAME: v }))
                }
                label="Agent Name"
                labelW="14.5%"
                length={35}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="agtCode"
                  value={dt.AGT_IATA_CODE || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, AGT_IATA_CODE: v }))
                  }
                  label="IATA Code"
                  labelW="30%"
                  length={7}
                />
              </div>{" "}
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="agtAddr"
                  value={dt.AGT_CASS_ADDRESS || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, AGT_CASS_ADDRESS: v }))
                  }
                  label="IATA CASS"
                  labelW="30%"
                  length={7}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="agtAccount"
                  value={dt.AGT_ACCOUNT_NO || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, AGT_ACCOUNT_NO: v }))
                  }
                  label="Account No"
                  labelW="30%"
                  length={14}
                />
              </div>{" "}
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="agtPlace"
                  value={dt.AGT_PLACE_NAME || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, AGT_PLACE_NAME: v }))
                  }
                  label="Agent City"
                  labelW="30%"
                  length={17}
                />
              </div>
            </div>
          </div>
        </CommonContainer>
        <CommonContainer title="NFY : Also Notify" width="49%">
          <div className="w-full flex flex-col gap-3">
            <div className="w-[70%] mainInput">
              <CommonInput
                id="nfyName"
                value={dt.NFY_COMPANY_NAME1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, NFY_COMPANY_NAME1: v }))
                }
                label="Name"
                labelW="21%"
                length={35}
              />
            </div>
            <div className="w-full mainInput">
              <CommonInput
                id="nfyAddr"
                value={dt.NFY_STREET_ADDRESS1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, NFY_STREET_ADDRESS1: v }))
                }
                label="Address"
                labelW="14.7%"
                length={35}
              />
            </div>
            <div className="w-full mainInput">
              <CommonInput
                id="nfyPlace"
                value={dt.NFY_PLACE_NAME || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, NFY_PLACE_NAME: v }))
                }
                label="Place"
                labelW="14.7%"
                length={17}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="nfyCountry"
                  value={dt.NFY_COUNTRY_CODE || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, NFY_COUNTRY_CODE: v }))
                  }
                  label="Country"
                  labelW="30%"
                  length={2}
                />
              </div>
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="nfyState"
                  value={dt.NFY_STATE_PROVINCE_NAME || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, NFY_STATE_PROVINCE_NAME: v }))
                  }
                  label="State/Province"
                  labelW="30%"
                  length={9}
                />
              </div>
            </div>
            <div className="flex items-center justify-between ">
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="nfyPostCode"
                  value={dt.NFY_POST_CODE || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, NFY_POST_CODE: v }))
                  }
                  label="Post Code"
                  labelW="30%"
                  length={9}
                />
              </div>
              <div className="w-[49%] mainInput">
                <CommonInput
                  id="nfyMobile"
                  value={dt.NFY_PHONE_NO || ""}
                  onChange={(v) =>
                    setDt((prev) => ({ ...prev, NFY_PHONE_NO: v }))
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
      <CommonContainer title="CVD : Charge Declaration">
        <div className="flex items-center justify-between">
          <div className="w-[9%] mainInput">
            <CommonInput
              id="cvdCurrency"
              value={dt.CVD_CURRENCY_CODE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_CURRENCY_CODE: v }))
              }
              label="Currency"
              labelW="50%"
              check={true}
              length={3}
            />
          </div>
          <div className="w-[24%] mainInput">
            <CommonInput
              id="cvdCarriage"
              value={dt.CVD_DECLARED_CARRIAGE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_DECLARED_CARRIAGE: v }))
              }
              label="Declared Value for Carriage"
              labelW="48%"
              check={true}
              length={12}
              holder="NVD"
            />
          </div>
          <div className="w-[9%] mainInput">
            <CommonInput
              id="cvdPcWt"
              value={dt.CVD_PC_IND_WEIGHT || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_PC_IND_WEIGHT: v }))
              }
              label="WT/Val P/C"
              labelW="50%"
              length={1}
            />
          </div>
          <div className="w-[24%] mainInput">
            <CommonInput
              id="cvdCustoms"
              value={dt.CVD_DECLARED_CUSTOMS || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_DECLARED_CUSTOMS: v }))
              }
              label="Declared Value for Customs"
              labelW="48%"
              check={true}
              length={12}
              holder="NCV"
            />
          </div>
          <div className="w-[9%] mainInput">
            <CommonInput
              id="cvdOhtPc"
              value={dt.CVD_PC_IND_OTHER || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_PC_IND_OTHER: v }))
              }
              label="Other P/C"
              labelW="50%"
              length={1}
            />
          </div>
          <div className="w-[21%] mainInput">
            <CommonInput
              id="cvdInsurance"
              value={dt.CVD_DECLARED_INSURANCE || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, CVD_DECLARED_INSURANCE: v }))
              }
              label="Amount of Insurance"
              labelW="41%"
              check={true}
              length={11}
              holder="XXX"
            />
          </div>
        </div>
      </CommonContainer>
      <CommonContainer title="RTD : Rate Info">
        <div className="flex flex-col gap-3">
          <div className="w-[40%] mainInput">
            <CommonInput
              id="rtdGoods"
              value={dt.GOODS_DESCRIPTION || ""}
              onChange={(v) =>
                setDt((prev) => ({ ...prev, GOODS_DESCRIPTION: v }))
              }
              label="Nature of Goods"
              labelW="20%"
              length={30}
            />
          </div>
          <div className="flex items-center gap-3 justify-between">
            <div className="w-[16%] mainInput">
              <CommonInput
                id="rtdPcs"
                value={dt.NO_OF_PIECES?.toString() || "0"}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, NO_OF_PIECES: getInt(v) }))
                }
                label="Pcs"
                labelW="50%"
                length={4}
              />
            </div>
            <div className="w-[13.5%] mainInput">
              <CommonInput
                id="rtdWt"
                value={dt.WEIGHT?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, WEIGHT: getDouble(v) }))
                }
                label="Wt."
                labelW="25%"
                length={7}
              />
            </div>
            <div className="w-[9%] mainInput">
              <CommonInput
                id="rtdClass"
                value={dt.RATE_CLASS_CODE || ""}
                onChange={(v) =>
                  setDt((prev) => ({ ...prev, RATE_CLASS_CODE: v }))
                }
                label="Rate Class"
                labelW="50%"
                length={1}
              />
            </div>
            <div className="w-[19%] mainInput">
              <CommonInput
                id="rtdChargWt"
                value={dt.CHARGEABLE_WEIGHT_DETAILS?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    CHARGEABLE_WEIGHT_DETAILS: getDouble(v),
                  }))
                }
                label="Chargeable Wt."
                labelW="35%"
                length={7}
              />
            </div>
            <div className="w-[19%] mainInput">
              <CommonInput
                id="rtdRate"
                value={dt.RATE_CHARGE_DETAILS?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    RATE_CHARGE_DETAILS: getDouble(v),
                  }))
                }
                label="Rate"
                labelW="15%"
                length={8}
              />
            </div>
            <div className="w-[20%] mainInput">
              <CommonInput
                id="rtdTotal"
                value={dt.TOTAL_DETAILS?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    TOTAL_DETAILS: getDouble(v),
                  }))
                }
                label="Total Amt."
                labelW="25%"
                length={12}
              />
            </div>
          </div>
        </div>
      </CommonContainer>
      <CommonContainer title="PPD : Prepaid">
        <div className="flex flex-col items-center justify-between w-full gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="w-[32%] mainInput">
              <CommonInput
                id="ppdWtCharge"
                value={dt.PPD_WEIGHT_CHARGE?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    PPD_WEIGHT_CHARGE: getDouble(v),
                  }))
                }
                label="Weight Charge"
                labelW="30%"
                length={13}
              />
            </div>
            <div className="w-[32%] mainInput">
              <CommonInput
                id="ppdValuCharge"
                value={dt.PPD_VALUATION_CHARGE?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    PPD_VALUATION_CHARGE: getDouble(v),
                  }))
                }
                label="Valuation Charge"
                labelW="30%"
                length={13}
              />
            </div>
            <div className="w-[32%] mainInput">
              <CommonInput
                id="ppdTax"
                value={dt.PPD_TAXES?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    PPD_TAXES: getDouble(v),
                  }))
                }
                label="Tax"
                labelW="20%"
                length={13}
              />
            </div>
          </div>
          <div className="flex items-center justify-between w-full">
            {" "}
            <div className="w-[32%] mainInput">
              <CommonInput
                id="ppdTtAgent"
                value={dt.PPD_OTHER_CHARGE_AGENT?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    PPD_OTHER_CHARGE_AGENT: getDouble(v),
                  }))
                }
                label="Total Other Due Agent"
                labelW="30%"
                length={13}
              />
            </div>
            <div className="w-[32%] mainInput">
              <CommonInput
                id="ppdTtCarrier"
                value={dt.PPD_OTHER_CHARGE_CARRIER?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    PPD_OTHER_CHARGE_CARRIER: getDouble(v),
                  }))
                }
                label="Total Other Due Carrier"
                labelW="30%"
                length={13}
              />
            </div>
            <div className="w-[32%] mainInput">
              <CommonInput
                id="ppdTtSummary"
                value={dt.PPD_TOTAL_CHARGE_SUMMARY?.toString() || "0.0"}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    PPD_TOTAL_CHARGE_SUMMARY: getDouble(v),
                  }))
                }
                label="Total"
                labelW="20%"
                length={13}
              />
            </div>
          </div>
        </div>
      </CommonContainer>
      <div className="grid grid-cols-2 gap-x-[2%] gap-y-[9%]">
        <CommonContainer title="ISU : Carrier’s Execution" width="60%">
          <div className="flex items-center justify-between">
            <div className="w-[65%] mainInput">
              <CommonDatePicker
                value={dt.ISU_AWB_ISSUE_DATE || ""}
                onClick={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    ISU_AWB_ISSUE_DATE: v,
                  }))
                }
                id="isuDate"
                title="Executed on (Date)"
                colSize="40%"
              />
            </div>
            <div className="w-[30%] mainInput">
              <CommonInput
                id="isuPlace"
                value={dt.ISU_AWB_ISSUE_PLACE_CODE || ""}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    ISU_AWB_ISSUE_PLACE_CODE: v,
                  }))
                }
                label="Total"
                labelW="30%"
                length={17}
                holder="KR"
              />
            </div>
          </div>
        </CommonContainer>
        <div className="row-span-2">
          <CommonContainer title="RTD : Rate Description">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="font-bold"> - Dimenstions</span>
                <div className="flex items-center justify-between">
                  <div className="w-[24%] mainInput">
                    <CommonInput
                      id="rtdLength"
                      value={dt.DIM_LENGTH?.toString() || "0"}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          DIM_LENGTH: getInt(v),
                        }))
                      }
                      label="Length"
                      labelW="30%"
                      length={5}
                    />
                  </div>
                  <div className="w-[24%] mainInput">
                    <CommonInput
                      id="rtdWidth"
                      value={dt.DIM_WIDTH?.toString() || "0"}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          DIM_WIDTH: getInt(v),
                        }))
                      }
                      label="Width"
                      labelW="30%"
                      length={5}
                    />
                  </div>
                  <div className="w-[24%] mainInput">
                    <CommonInput
                      id="rtdHeight"
                      value={dt.DIM_HEIGHT?.toString() || "0"}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          DIM_HEIGHT: getInt(v),
                        }))
                      }
                      label="Height"
                      labelW="30%"
                      length={5}
                    />
                  </div>
                  <div className="w-[24%] mainInput">
                    <CommonInput
                      id="rtdPcs"
                      value={dt.DIM_NO_OF_PACKAGE?.toString() || "0"}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          DIM_NO_OF_PACKAGE: getInt(v),
                        }))
                      }
                      label="Pieces"
                      labelW="30%"
                      length={4}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold"> - Volume</span>
                <div className="flex items-center justify-between">
                  <div className="w-[30%] mainInput">
                    <CommonInput
                      id="rtdCode"
                      value={dt.VOLUME_CODE || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          VOLUME_CODE: v,
                        }))
                      }
                      label="CODE"
                      labelW="24%"
                      length={2}
                    />
                  </div>
                  <div className="w-[65%] mainInput">
                    <CommonInput
                      id="rtdAmount"
                      value={dt.VOLUME_AMOUNT || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          VOLUME_AMOUNT: v,
                        }))
                      }
                      label="Amount"
                      labelW="20%"
                      length={12}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold"> - Harmonise Commodity Code</span>
                <div className="flex items-center justify-between">
                  <div className="w-[19%] mainInput">
                    <CommonInput
                      id="rtdCommodity"
                      value={dt.HARMONISED_COMMODITY_CODE || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          HARMONISED_COMMODITY_CODE: v,
                        }))
                      }
                      length={18}
                    />
                  </div>
                  <div className="w-[19%] mainInput">
                    <CommonInput
                      id="rtdCommodity2"
                      value={dt.HARMONISED_COMMODITY_CODE2 || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          HARMONISED_COMMODITY_CODE2: v,
                        }))
                      }
                      length={18}
                    />
                  </div>
                  <div className="w-[19%] mainInput">
                    <CommonInput
                      id="rtdCommodity3"
                      value={dt.HARMONISED_COMMODITY_CODE3 || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          HARMONISED_COMMODITY_CODE3: v,
                        }))
                      }
                      length={18}
                    />
                  </div>
                  <div className="w-[19%] mainInput">
                    <CommonInput
                      id="rtdCommodity4"
                      value={dt.HARMONISED_COMMODITY_CODE4 || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          HARMONISED_COMMODITY_CODE4: v,
                        }))
                      }
                      length={18}
                    />
                  </div>
                  <div className="w-[19%] mainInput">
                    <CommonInput
                      id="rtdCommodity5"
                      value={dt.HARMONISED_COMMODITY_CODE5 || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          HARMONISED_COMMODITY_CODE5: v,
                        }))
                      }
                      length={18}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold"> - Country of Origin of Goods</span>
                <div className="flex items-center justify-between">
                  <div className="w-[100%] mainInput">
                    <CommonInput
                      id="rtdCountry"
                      value={dt.COUNTRY_OF_ORIGIN_GOODS || ""}
                      onChange={(v) =>
                        setDt((prev) => ({
                          ...prev,
                          COUNTRY_OF_ORIGIN_GOODS: v,
                        }))
                      }
                      label="Country Code"
                      labelW="12%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CommonContainer>
        </div>
        <CommonContainer title="OSI : Other Service Information">
          <div className="flex flex-col gap-1">
            <div className="w-[100%] mainInput">
              <CommonInput
                id="osiInfo1"
                value={dt.OSI_OTHER_INFORMATION1 || ""}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    OSI_OTHER_INFORMATION1: v,
                  }))
                }
                label="1"
                labelW="12%"
                length={65}
              />
            </div>
            <div className="w-[100%] mainInput">
              <CommonInput
                id="osiInfo2"
                value={dt.OSI_OTHER_INFORMATION2 || ""}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    OSI_OTHER_INFORMATION2: v,
                  }))
                }
                label="2"
                labelW="12%"
                length={65}
              />
            </div>
            <div className="w-[100%] mainInput">
              <CommonInput
                id="osiInfo3"
                value={dt.OSI_OTHER_INFORMATION3 || ""}
                onChange={(v) =>
                  setDt((prev) => ({
                    ...prev,
                    OSI_OTHER_INFORMATION3: v,
                  }))
                }
                label="3"
                labelW="12%"
                length={65}
              />
            </div>
          </div>
        </CommonContainer>
      </div>
      <div className="grid grid-cols-[49%_49%] justify-between gap-y-5">
        <div>
          <CommonContainer title="REF : Sender Reference">
            <div className="grid grid-cols-[15%_18%_18%_38%] justify-between gap-2">
              <div className="mainInput w-full">
                <CommonInput
                  id={`refAirport`}
                  value={dt.REF_SENDER_AIRPORT || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, REF_SENDER_AIRPORT: v }));
                  }}
                  label={`Airport`}
                  labelW="40%"
                  length={3}
                />
              </div>
              <div className="mainInput w-full">
                <CommonInput
                  id={`refFunc`}
                  value={dt.REF_SENDER_FUNCTION || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, REF_SENDER_FUNCTION: v }));
                  }}
                  label={`Function`}
                  labelW="40%"
                  length={2}
                />
              </div>
              <div className="mainInput w-full">
                <CommonInput
                  id={`refCompany`}
                  value={dt.REF_SENDER_COMPANY || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, REF_SENDER_COMPANY: v }));
                  }}
                  label={`Company`}
                  labelW="40%"
                  length={2}
                />
              </div>
              <div className="mainInput w-full">
                <CommonInput
                  id={`refFile`}
                  value={dt.REF_FILE_REFERENCE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, REF_FILE_REFERENCE: v }));
                  }}
                  label={`File Reference`}
                  labelW="30%"
                  length={15}
                />
              </div>
              <div className="mainInput w-full flex items-center justify-center">
                {" "}
                <label className="font-bold">- Participant</label>
              </div>
              <div className="mainInput w-full">
                <CommonInput
                  id={`refPartId`}
                  value={dt.REF_PARTICIPANT_ID || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, REF_PARTICIPANT_ID: v }));
                  }}
                  label={`ID`}
                  labelW="40%"
                  length={3}
                />
              </div>
              <div className="mainInput w-full">
                <CommonInput
                  id={`refPartAirport`}
                  value={dt.REF_PARTICIPANT_AIRPORT || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, REF_PARTICIPANT_AIRPORT: v }));
                  }}
                  label={`Airport`}
                  labelW="40%"
                  length={3}
                />
              </div>
              <div className="mainInput w-full">
                <CommonInput
                  id={`refPartCode`}
                  value={dt.REF_PARTICIPANT_CODE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, REF_PARTICIPANT_CODE: v }));
                  }}
                  label={`Code`}
                  labelW="30%"
                  length={17}
                />
              </div>
            </div>
          </CommonContainer>
        </div>
        <div className="row-span-2">
          <CommonContainer
            title="OCI : Other Customs"
            childrenTitle={
              <div className="flex items-center gap-2">
                <Btn
                  type="NONE"
                  txt="+"
                  onClick={() => {
                    clickOci(true);
                  }}
                />
                <Btn
                  type="NONE"
                  txt="-"
                  onClick={() => {
                    clickOci(false);
                  }}
                />
              </div>
            }>
            <div className="flex flex-col gap-3">
              {ociArray.map((item) => {
                const flag = ociCount >= item ? true : false;
                if (!flag) {
                  return null;
                }
                const key1 = `COUNTRY_CODE_${item}` as keyof Fwb16Type;
                const key2 =
                  `INFORMATION_IDENTIFIER_${item}` as keyof Fwb16Type;
                const key3 = `CONTROL_IDENTIFIER_${item}` as keyof Fwb16Type;
                const key4 = `CONTROL_INFORMATION_${item}` as keyof Fwb16Type;
                return (
                  <div key={item} className={`flex flex-col gap-3`}>
                    <div className={`flex items-center justify-between gap-2`}>
                      <span className="font-bold">{item}</span>
                      <div className="mainInput w-[18%]">
                        <CommonInput
                          id={`oci${key1}`}
                          value={dt[key1]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [key1]: v,
                            }))
                          }
                          label={`Cuntry Code`}
                          labelW="55%"
                          length={2}
                        />
                      </div>
                      <div className="mainInput w-[15%]">
                        <CommonInput
                          id={`oci${key2}`}
                          value={dt[key2]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [key2]: v,
                            }))
                          }
                          label={`Info ID`}
                          labelW="35%"
                          length={3}
                        />
                      </div>
                      <div className="mainInput w-[15%]">
                        <CommonInput
                          id={`oci${key3}`}
                          value={dt[key3]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [key3]: v,
                            }))
                          }
                          label={`Control ID`}
                          labelW="50%"
                          length={2}
                        />
                      </div>
                      <div className="mainInput w-[50%]">
                        <CommonInput
                          id={`oci${key4}`}
                          value={dt[key4]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [key4]: v,
                            }))
                          }
                          label={`Control Info`}
                          labelW="20%"
                          length={35}
                        />
                      </div>
                    </div>
                    {flag && item < ociArray.length && (
                      <div className="border col-span-2 border-gray-300 rounded-full mt-[1%]" />
                    )}
                  </div>
                );
              })}
            </div>
          </CommonContainer>
        </div>
        <div>
          <CommonContainer
            title="OTH : Other Charges"
            childrenTitle={
              <div className="flex items-center gap-2">
                <Btn
                  type="NONE"
                  txt="+"
                  onClick={() => {
                    clickOth(true);
                  }}
                />
                <Btn
                  type="NONE"
                  txt="-"
                  onClick={() => {
                    clickOth(false);
                  }}
                />
              </div>
            }>
            <div className="flex flex-col gap-3">
              {othArray.map((item) => {
                const flag = othCount >= item ? true : false;
                if (!flag) {
                  return null;
                }
                const str = changeStr(item) as Fwb16Type;
                const pcKey = `OTH_PC_IND_OTHER_${str}` as keyof Fwb16Type;
                const chargeKey1 =
                  `OTH_OTHER_CHARGE_CODE_${str}1` as keyof Fwb16Type;
                const chargeKey2 =
                  `OTH_OTHER_CHARGE_CODE_${str}2` as keyof Fwb16Type;
                const chargeKey3 =
                  `OTH_OTHER_CHARGE_CODE_${str}3` as keyof Fwb16Type;
                const entitleKey1 =
                  `OTH_ENTITLEMENT_CODE_${str}1` as keyof Fwb16Type;
                const entitleKey2 =
                  `OTH_ENTITLEMENT_CODE_${str}2` as keyof Fwb16Type;
                const entitleKey3 =
                  `OTH_ENTITLEMENT_CODE_${str}3` as keyof Fwb16Type;
                const amountKey1 =
                  `OTH_CHARGE_AMOUNT_${str}1` as keyof Fwb16Type;
                const amountKey2 =
                  `OTH_CHARGE_AMOUNT_${str}2` as keyof Fwb16Type;
                const amountKey3 =
                  `OTH_CHARGE_AMOUNT_${str}3` as keyof Fwb16Type;
                return (
                  <div
                    className={`grid grid-cols-[15%_83%] justify-between gap-2 origin-top duration-500 transition-all ease-in-out ${
                      flag
                        ? "scale-y-100 translate-y-0"
                        : "scale-y-0 -translate-y-2 h-0"
                    }`}
                    key={item}>
                    <div className="row-span-3 flex items-center gap-3">
                      <label className="font-bold">{item}</label>
                      <div className="mainInput w-full">
                        <CommonInput
                          id={`othPc${item}`}
                          value={dt[pcKey]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [pcKey]: v,
                            }))
                          }
                          label={`P/C`}
                          labelW="35%"
                          length={1}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="w-[22%] mainInput">
                        <CommonInput
                          id={`othCharge1${item}`}
                          value={dt[chargeKey1]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [chargeKey1]: v,
                            }))
                          }
                          label={`Charge Code`}
                          labelW="55%"
                          length={2}
                        />
                      </div>
                      <div className="w-[25%] mainInput">
                        <CommonInput
                          id={`othEntitle1${item}`}
                          value={dt[entitleKey1]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [entitleKey1]: v,
                            }))
                          }
                          label={`Entitlement Coder`}
                          labelW="70%"
                          length={1}
                        />
                      </div>
                      <div className="w-[50%] mainInput">
                        <CommonInput
                          id={`othAmount1${item}`}
                          value={dt[amountKey1]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [amountKey1]: v,
                            }))
                          }
                          label={`Charge Amount`}
                          labelW="32%"
                          length={12}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="w-[22%] mainInput">
                        <CommonInput
                          id={`othCharge2${item}`}
                          value={dt[chargeKey2]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [chargeKey2]: v,
                            }))
                          }
                          label={`Charge Code`}
                          labelW="55%"
                          length={2}
                        />
                      </div>
                      <div className="w-[25%] mainInput">
                        <CommonInput
                          id={`othEntitle2${item}`}
                          value={dt[entitleKey2]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [entitleKey2]: v,
                            }))
                          }
                          label={`Entitlement Coder`}
                          labelW="70%"
                          length={1}
                        />
                      </div>
                      <div className="w-[50%] mainInput">
                        <CommonInput
                          id={`othAmount2${item}`}
                          value={dt[amountKey2]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [amountKey2]: v,
                            }))
                          }
                          label={`Charge Amount`}
                          labelW="32%"
                          length={12}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="w-[22%] mainInput">
                        <CommonInput
                          id={`othCharge3${item}`}
                          value={dt[chargeKey3]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [chargeKey3]: v,
                            }))
                          }
                          label={`Charge Code`}
                          labelW="55%"
                          length={2}
                        />
                      </div>
                      <div className="w-[25%] mainInput">
                        <CommonInput
                          id={`othEntitle3${item}`}
                          value={dt[entitleKey3]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [entitleKey3]: v,
                            }))
                          }
                          label={`Entitlement Coder`}
                          labelW="70%"
                          length={1}
                        />
                      </div>
                      <div className="w-[50%] mainInput">
                        <CommonInput
                          id={`othAmount3${item}`}
                          value={dt[amountKey3]?.toString() || ""}
                          onChange={(v) =>
                            setDt((prev) => ({
                              ...prev,
                              [amountKey3]: v,
                            }))
                          }
                          label={`Charge Amount`}
                          labelW="32%"
                          length={12}
                        />
                      </div>
                    </div>
                    {item < othArray.length && (
                      <div className="border col-span-2 border-gray-300 rounded-full mt-[1%]" />
                    )}
                  </div>
                );
              })}
            </div>
          </CommonContainer>
        </div>

        <div
          className={`origin-left col-span-2 duration-500 ${
            sysOpen ? "w-full" : "w-[49%]"
          }`}>
          <CommonContainer
            title="System"
            childrenTitle={
              <div className="flex items-center w-[50%] gap-2 px-[1%]">
                <Btn
                  type="NONE"
                  txt="SHOW"
                  onClick={() => {
                    setSysOpen(true);
                  }}
                />{" "}
                <Btn type="NONE" txt="HIDE" onClick={() => setSysOpen(false)} />
                <Btn
                  type="NONE"
                  txt="Schedule"
                  onClick={() => {
                    openModal({
                      array: [
                        {
                          id: "WMSCH0040",
                          name: "스케줄 변경",
                          param: { inout: sch.inout, date: sch.fltDate },
                        },
                      ],
                    });
                  }}
                />
              </div>
            }>
            <div
              className={`grid grid-cols-[30%_30%_30%] justify-between gap-2`}>
              <div className="w-full mainInput">
                <CommonInput
                  id={`sysSchSid`}
                  value={dt.SCHEDULE_SID?.toString() || "0"}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SCHEDULE_SID: getInt(v) }));
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
                  value={dt.SCH_FLIGHT_DATE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SCH_FLIGHT_DATE: v }));
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
                  value={dt.SCH_FLIGHT_NO || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SCH_FLIGHT_NO: v }));
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
                  value={dt.SCH_INOUT_FLAG || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SCH_INOUT_FLAG: v }));
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
                  value={dt.SCH_ORIGIN_CODE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SCH_ORIGIN_CODE: v }));
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
                  value={dt.SCH_DESTINATION_CODE || ""}
                  onChange={(v) => {
                    setDt((prev) => ({ ...prev, SCH_DESTINATION_CODE: v }));
                  }}
                  label={`Dest`}
                  labelW="45%"
                  check={true}
                  read={true}
                />
              </div>
              {sysOpen && (
                <>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysCreate`}
                      value={dt.FWB_CREATED_TIME || ""}
                      onChange={(v) => {
                        setDt((prev) => ({ ...prev, FWB_CREATED_TIME: v }));
                      }}
                      label={`Create DateTime`}
                      labelW="45%"
                      check={true}
                      read={true}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysFwbCreate`}
                      value={dt.FWB_CREATOR || ""}
                      onChange={(v) => {
                        setDt((prev) => ({ ...prev, FWB_CREATOR: v }));
                      }}
                      label={`FWB_CREATOR`}
                      labelW="45%"
                      check={true}
                      read={true}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysMawbSid`}
                      value={dt.MASTER_AIR_WAY_BILL_SID?.toString() || "0"}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          MASTER_AIR_WAY_BILL_SID: getInt(v),
                        }));
                      }}
                      label={`MAWB_SID`}
                      labelW="45%"
                      check={true}
                      read={true}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysSchSid2`}
                      value={dt.AUTO_SCHEDULE_SID?.toString() || "0"}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          AUTO_SCHEDULE_SID: getInt(v),
                        }));
                      }}
                      label={`SCH_SID`}
                      labelW="45%"
                      read={true}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysSchStr`}
                      value={dt.AUTO_SCHEDULE_STR || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          AUTO_SCHEDULE_STR: v,
                        }));
                      }}
                      label={`SCH_INFO`}
                      labelW="45%"
                      read={true}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods`}
                      value={dt.CONSOLIDATION || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION: v,
                        }));
                      }}
                      label={`Nature of Goods(Console)`}
                      labelW="45%"
                      length={30}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods1`}
                      value={dt.CONSOLIDATION_1 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_1: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 1`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods2`}
                      value={dt.CONSOLIDATION_2 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_2: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 2`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods3`}
                      value={dt.CONSOLIDATION_3 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_3: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 3`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods4`}
                      value={dt.CONSOLIDATION_4 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_4: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 4`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods5`}
                      value={dt.CONSOLIDATION_5 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_5: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 5`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods6`}
                      value={dt.CONSOLIDATION_6 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_6: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 6`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods7`}
                      value={dt.CONSOLIDATION_7 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_7: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 7`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods8`}
                      value={dt.CONSOLIDATION_8 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_8: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 8`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods9`}
                      value={dt.CONSOLIDATION_9 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_9: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 9`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                  <div className="w-full mainInput">
                    <CommonInput
                      id={`sysGoods10`}
                      value={dt.CONSOLIDATION_10 || ""}
                      onChange={(v) => {
                        setDt((prev) => ({
                          ...prev,
                          CONSOLIDATION_10: v,
                        }));
                      }}
                      label={`Nature of Goods(Console) 10`}
                      labelW="45%"
                      length={20}
                    />
                  </div>
                </>
              )}
            </div>
          </CommonContainer>
        </div>
      </div>
    </div>
  );
}
