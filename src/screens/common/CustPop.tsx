import { useCallback, useEffect, useState } from "react";
import { CommonChk, CommonInput } from "../../comp/Input";
import type { ModalComp, TableHeaderType, TableRow } from "../../Util/Type";
import { getApi, sendLoading } from "../../Util/Util";
import { TableCust } from "../../comp/Table";

const Grid1: TableHeaderType[] = [
  { key: "PHONE_NO", value: "PHONE", w: "8rem", sum: 0 },
  { key: "CUSTOMER_CODE", value: "Code", w: "8rem" },
  { key: "AGENCY_CODE", value: "AGENCY", w: "7rem" },
  { key: "CUSTOMER_NAME", value: "Name", w: "8rem" },
  { key: "REGISTRATION_NO", value: "사업자등록번호", w: "8rem" },
  { key: "EMAIL_ADDRESS", value: "EMAIL", w: "11rem" },
  { key: "DUZON_CODE", value: "더존 Code", w: "7rem" },
  { key: "IATA_CODE", value: "IATA 코드", w: "7rem" },
  { key: "ACCOUNT_NO", value: "Account No", w: "7rem" },
  { key: "CITY_CODE", value: "Place Name", w: "7rem" },
];

export default function CustPop({
  onClose,
  param,
  pgmId,
  headerAction,
  outParam,
}: ModalComp) {
  const [params, setParams] = useState(param);
  const [dt, setDt] = useState<TableRow[]>([]);
  useEffect(() => {
    setParams(param);
    searchData();
  }, [param]);

  useEffect(() => {
    if (headerAction?.type === "SEARCH") {
      searchData();
    }
  }, [headerAction?.type]);

  const searchData = useCallback(async () => {
    sendLoading(true);
    const tmp = new Map();

    tmp.set("customerName", params["class_name"] || "");
    tmp.set("registrationNo", params["registrationNo"] || "");
    tmp.set("customerFlag", params["customer_flag"] || "");
    tmp.set("vendorFlag", params["vender_flag"] || "");
    tmp.set("carrierFlag", params["carrier_flag"] || "");
    tmp.set("agencyFlag", params["agency_flag"] || "");
    tmp.set("customsFlag", params["customs_flag"] || "");
    tmp.set("iataFlag", params["iata_flag"] || "");

    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      pgmId: pgmId,
      url: `/sys/getCustomerP010_001`,
      params: tmp,
    });
    if (ret) {
      if (ret.data?.[0]) {
        setDt(ret.data[0]);
        sendLoading(false);
        return;
      }
    }
    sendLoading(false);
  }, [params]);
  return (
    <div className="px-[2%] py-[1%] flex flex-col gap-2">
      <div className="flex items-center justify-between w-full ">
        <div className="mainInput w-[45%]">
          <CommonInput
            id="name"
            value={params["class_name"]}
            onChange={(v) => {
              setParams((prev) => ({ ...prev, class_name: v }));
            }}
            label="Code/Name"
          />
        </div>
        <div className="mainInput w-[45%]">
          <CommonInput
            id="reg"
            value={params["registrationNo"]}
            onChange={(v) => {
              setParams((prev) => ({ ...prev, registrationNo: v }));
            }}
            label="사업자등록번호"
          />
        </div>
      </div>
      <div className="w-full mainInput flex">
        <CommonChk
          id="customer_flag"
          value={params["customer_flag"] === "Y" ? true : false}
          onChange={(v) => {
            setParams((prev) => ({ ...prev, customer_flag: v ? "Y" : "" }));
          }}
          title="고객사"
        />
        <CommonChk
          id="vender_flag"
          value={params["vender_flag"] === "Y" ? true : false}
          onChange={(v) => {
            setParams((prev) => ({ ...prev, vender_flag: v ? "Y" : "" }));
          }}
          title="협력사"
        />
        <CommonChk
          id="carrier_flag"
          value={params["carrier_flag"] === "Y" ? true : false}
          onChange={(v) => {
            setParams((prev) => ({ ...prev, carrier_flag: v ? "Y" : "" }));
          }}
          title="항공사"
        />
        <CommonChk
          id="agency_flag"
          value={params["agency_flag"] === "Y" ? true : false}
          onChange={(v) => {
            setParams((prev) => ({ ...prev, agency_flag: v ? "Y" : "" }));
          }}
          title="대리점"
        />
        <CommonChk
          id="customs_flag"
          value={params["customs_flag"] === "Y" ? true : false}
          onChange={(v) => {
            setParams((prev) => ({ ...prev, customs_flag: v ? "Y" : "" }));
          }}
          title="세관/관세사"
        />
        <CommonChk
          id="iata_flag"
          value={params["iata_flag"] === "Y" ? true : false}
          onChange={(v) => {
            setParams((prev) => ({ ...prev, iata_flag: v ? "Y" : "" }));
          }}
          title="IATA 가입 여부"
        />
        <CommonChk
          id="allFlag"
          value={params["allFlag"] === "Y" ? true : false}
          onChange={(v) => {
            const tmp = v ? "Y" : "";
            setParams((prev) => ({
              ...prev,
              allFlag: tmp,
              customer_flag: tmp,
              vender_flag: tmp,
              carrier_flag: tmp,
              agency_flag: tmp,
              customs_flag: tmp,
              iata_flag: tmp,
            }));
          }}
          title="전체선택"
        />
      </div>
      <div>
        <TableCust
          tableId="grid1"
          body={dt}
          header={Grid1}
          height="30rem"
          onClick={(v) => {
            outParam?.(v);
            onClose();
          }}
          width="100%"
        />
      </div>
    </div>
  );
}
