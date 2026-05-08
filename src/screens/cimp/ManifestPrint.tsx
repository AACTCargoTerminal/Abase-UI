import { useEffect, useState } from "react";
import { CommonDropDown } from "../../comp/DropDown";
import type { ModalComp, TableRow } from "../../Util/Type";
import {
  base64ToPdfUrl,
  getApi,
  getClass,
  getDouble,
  getInt,
} from "../../Util/Util";
import { commonHeader, commonHeader2 } from "../../Util/Header";
import { CommonChk, CommonInput } from "../../comp/Input";
import { Divider } from "../../comp/Common";
import { Btn } from "../../comp/Btn";
import { CommonContainer } from "../../comp/Container";

export default function ManifestPrint({
  param,
  onClose,
  pgmId,
  sendParam,
}: ModalComp) {
  const schSid: number = param["schedule_sid"] || 0;
  const cargoSidArray: number[] = param["cargoSidArray"] || [];

  if (!schSid) {
    onClose();
    return null;
  }

  useEffect(() => {
    getMFPTP();
  }, []);

  const [commonDt, setCommonDt] = useState<TableRow[]>([]);
  const [commonSelect, setCommonSelect] = useState<TableRow | undefined>();
  const [dt, setDt] = useState<TableRow>({});
  async function getMFPTP() {
    const data = await getClass("MFPTP", pgmId);
    setCommonDt(data);
    setCommonSelect(data?.[0] || {});
  }

  async function printClick() {
    const tmp: Map<string, any> = new Map();

    tmp.set("type", commonSelect?.["CODE_CODE"]);
    tmp.set("schSid", schSid);
    tmp.set("cargoSidArray", cargoSidArray);

    Object.keys(dt).forEach((k) => {
      if (k === "nillFlag") {
        tmp.set(k, dt[k] ? "Y" : "N");
      } else {
        tmp.set(k, dt[k]);
      }
    });

    const res = await getApi<string>({
      baseUrl: "CIMP",
      method: "POST",
      url: `/cimp/getSitaPrint`,
      pgmId: pgmId,
      params: tmp,
    });

    if (res.ok) {
      if (res.data) {
        sendParam?.({
          type: "PDF",
          data: base64ToPdfUrl(res.data, "application/pdf"),
        });
      }
    }
  }
  return (
    <div className="grid grid-cols-2 p-[2%] gap-y-3 gap-x-5">
      <div className="col-span-2 mainInput flex items-center justify-end">
        <Btn
          type="PRINT"
          txt="PRINT"
          onClick={() => {
            printClick();
          }}
        />
      </div>
      <div className="mainInput">
        <CommonDropDown
          data={commonDt}
          header={commonHeader2}
          dropHeight="10rem"
          id="type"
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: commonSelect?.["CODE_CODE"],
          }}
          onClick={(r) => setCommonSelect(r)}
          title="ManifestType"
          labelW="41%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Prepared By`}
          value={dt?.["preparedBy"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, preparedBy: v }));
          }}
          label={`Prepared By`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Owner Or Operator`}
          value={dt?.["ownerOrOperator"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, ownerOrOperator: v }));
          }}
          label={`Owner Or Operator`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Menifest No.`}
          value={dt?.["mainifestNo"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, mainifestNo: v }));
          }}
          label={`Menifest No.`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Registraton`}
          value={dt?.["registration"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, registration: v }));
          }}
          label={`Registraton`}
          labelW="40%"
        />
      </div>
      <div className="mainInput">
        <CommonInput
          id={`Customer Ref.`}
          value={dt?.["customerRef"] || ""}
          onChange={(v) => {
            setDt((prev) => ({ ...prev, customerRef: v }));
          }}
          label={`Customer Ref.`}
          labelW="40%"
        />
      </div>
      <div />
      <div className="col-span-2">
        {" "}
        <Divider align="Horizen" />
      </div>
      <div className="col-span-2">
        <CommonContainer title="MAIL">
          <div className="grid grid-cols-2 p-[2%] gap-y-3 gap-x-5">
            <div className="mainInput">
              <CommonInput
                id={`PIECES`}
                value={dt?.["mailPcs"] || "0"}
                onChange={(v) => {
                  setDt((prev) => ({ ...prev, mailPcs: getInt(v) }));
                }}
                label={`PIECES`}
                labelW="40%"
              />
            </div>
            <div className="mainInput">
              <CommonInput
                id={`WEIGHT`}
                value={dt?.["mailWt"] || "0.0"}
                onChange={(v) => {
                  setDt((prev) => ({ ...prev, mailWt: getDouble(v) }));
                }}
                label={`WEIGHT`}
                labelW="40%"
              />
            </div>
            <div className="mainInput">
              <CommonChk
                id="NILL"
                onChange={(v) => setDt((prev) => ({ ...prev, nillFlag: v }))}
                value={dt?.["nillFlag"] || false}
                title="NILL"
                colSize="13%"
              />
            </div>
          </div>
        </CommonContainer>
      </div>
    </div>
  );
}
