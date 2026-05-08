import { useCallback, useEffect, useRef, useState } from "react";
import type { ModalComp, TableRow } from "../../Util/Type";
import {
  changeSitaMessage,
  checkEmail,
  checkEng,
  closeModal,
  convStrToTableRow,
  getApi,
  getClass,
  sendErr,
  sendLoading,
} from "../../Util/Util";
import { CommonInput, CommonLabel } from "../../comp/Input";
import { Divider } from "../../comp/Common";
import { CommonDropDown, CommonMultiDrop } from "../../comp/DropDown";
import { commonHeader, commonHeader4 } from "../../Util/Header";
import moment from "moment";
import { confirmAsync } from "../../confirmService";

export default function NewSitaMsg({
  param,
  pgmId,
  headerAction,
  outParam,
  closeParam,
}: ModalComp) {
  const [params, setParams] = useState({
    guid: "",
    gubn: "",
    migType: "",
    carrierCode: "",
    progressGuid: "",
    sitaAddr: "",
    emailAddr: "",
    schSid: "",
  });

  const [sitaAddr1, setSitaAddr1] = useState("");
  const [freeText, setFreeText] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");

  const [sitaa, setSitaa] = useState<TableRow[]>([]);
  const [sitpc, setSitpc] = useState<TableRow[]>([]);
  const [sitpcSelect, setSitpcSelect] = useState<TableRow>({});

  useEffect(() => {
    getSITAA();
    getSITPC();
  }, []);

  useEffect(() => {
    if (Object.keys(param).length > 0) {
      setParams({
        guid: param["edi_guid"],
        gubn: param["gubn"],
        migType: param["mig_type"],
        carrierCode: param["owner_carrier_code"],
        progressGuid: param["progress_guid"],
        sitaAddr: param["sita_addr"] || "",
        emailAddr: param["email_addr"] || "",
        schSid: param["schedule_sid"],
      });
    }
  }, [param]);

  useEffect(() => {
    if (params.gubn === "forward") {
      setSitaAddr1("ICNACXH");
      getSitaMsg({ guid: params.guid });
      setSenderEmail("");
    }
  }, [params.gubn]);

  useEffect(() => {
    if (params.progressGuid) {
      getFwbFfmFsuMsg({ guid: params.progressGuid });
      setSitaAddr1("ICNACXH");
      setSenderEmail("");
    } else {
      setSitaAddr1("ICNACXH");
      setSenderEmail("");
    }
  }, [params.progressGuid]);

  useEffect(() => {
    if (headerAction?.type === "NEW") {
      setParams((prev) => ({ ...prev, gubn: "", emailAddr: "", sitaAddr: "" }));
      setSubject("");
      setFreeText("");
    } else if (headerAction?.type === "SEND") {
      sendSita();
    } else if (headerAction?.type === "SAVE") {
      saveMsg();
    }
  }, [headerAction?.type]);

  async function saveMsg() {
    const confRet = await confirmAsync({
      title: "SITA ADDR",
      message: `SITA ADDR : ${params.sitaAddr}\n저장합니까?`,
    });
    if (confRet) {
      //전송
      sendLoading(true);
      const paramTmp = new Map<string, any>();
      paramTmp.set("guid", params.progressGuid);
      paramTmp.set("sitaMsg", freeText);
      paramTmp.set("sitaAddr", params.sitaAddr);
      paramTmp.set("priority", sitpcSelect?.["CODE_CODE"]);
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "CIMP",
        method: "POST",
        url: `/cimp/saveSita`,
        params: paramTmp,
        pgmId: pgmId,
        sucFlag: true,
      });
      if (res.ok) {
        closeParam?.({ SAVE: "SAVE" });
      }
      sendLoading(false);
    }
  }

  const sendSita = useCallback(async () => {
    var sitaFlag = true;
    var emailFlag = true;
    if (params.sitaAddr.length === 0) {
      if (params.emailAddr.length === 0) {
        sendErr("받는 사람 정보 : SITA 주소가 없습니다.");
        return;
      } else {
        sitaFlag = false;
        const tmp = params.emailAddr.split(";");
        var chkFlag = false;
        tmp.forEach((item) => {
          if (item) {
            const bool = checkEmail(item);
            if (!bool) {
              chkFlag = true;
            }
          }
        });

        if (chkFlag) {
          sendErr("받는 사람 메일 형식이 맞지 않습니다");
          return;
        }
        if (senderEmail.length > 0) {
          const bool2 = checkEmail(senderEmail);
          if (!bool2) {
            sendErr("보내는 사람 메일 형식이 맞지 않습니다");
            return;
          }
        }
      }
    } else {
      if (params.emailAddr.length === 0) {
        emailFlag = false;
      } else {
        const tmp = params.emailAddr.split(";");
        var chkFlag = false;
        tmp.forEach((item) => {
          if (item) {
            const bool = checkEmail(item);
            if (!bool) {
              chkFlag = true;
            }
          }
        });

        if (chkFlag) {
          sendErr("받는 사람 메일 형식이 맞지 않습니다");
          return;
        }

        if (senderEmail.length > 0) {
          const bool2 = checkEmail(senderEmail);
          if (!bool2) {
            sendErr("보내는 사람 메일 형식이 맞지 않습니다");
            return;
          }
        }
      }
    }

    if (subject.length === 0 && params.emailAddr.length > 0) {
      sendErr("전송 제목이 없습니다");
      return;
    }

    if (freeText.length === 0) {
      sendErr("전송할 내용이 없습니다");
      return;
    } else {
      const chkRet = checkEng(freeText);
      if (chkRet) {
        sendErr(chkRet);
        return;
      }
    }
    const confRet = await confirmAsync({
      title: "SITA ADDR",
      message: `SITA ADDR : ${params.sitaAddr}\nEMAIL ADDR : ${params.emailAddr}\n전송합니까?`,
    });
    if (confRet) {
      //전송
      sendLoading(true);
      var flag = false;
      if (sitaFlag) {
        const paramTmp = new Map<string, any>();
        paramTmp.set("guid", params.progressGuid);
        paramTmp.set("sitaMsg", freeText);
        paramTmp.set("sitaAddr", params.sitaAddr);
        paramTmp.set("priority", sitpcSelect?.["CODE_CODE"]);
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "CIMP",
          method: "POST",
          url: `/cimp/sendSita`,
          params: paramTmp,
          pgmId: pgmId,
          sucFlag: true,
        });
        if (res.ok) {
          flag = true;
        }
      }

      if (emailFlag) {
        const paramTmp = new Map<string, any>();
        paramTmp.set("title", subject);
        paramTmp.set("msg", freeText);
        paramTmp.set("schSid", 0);
        paramTmp.set("mawb", "");
        paramTmp.set("senderEmail", senderEmail);
        paramTmp.set("recvEmai", params.emailAddr.split(";"));
        const res = await getApi<Record<number, TableRow[]>>({
          baseUrl: "AUTH",
          method: "POST",
          url: `/sys/sendSitaToEmail`,
          params: paramTmp,
          pgmId: pgmId,
          sucFlag: true,
        });
        if (res.ok) {
          flag = true;
        }
      }
      sendLoading(false);

      if (flag) {
        outParam?.({ SEND: "COMP" });
        closeModal();
      }
    }
  }, [
    params.sitaAddr,
    params.emailAddr,
    freeText,
    subject,
    sitpcSelect?.["CODE_CODE"],
    params.progressGuid,
    confirmAsync,
    senderEmail,
  ]);

  async function getSITAA() {
    const data = await getClass("SITAA", pgmId);
    setSitaa(data);
  }

  async function getSITPC() {
    const data = await getClass("SITPC", pgmId);
    setSitpc([{ CODE_CODE: " ", CODE_NAME: " " }, ...data]);
    setSitpcSelect(data?.[4] || {});
  }

  async function getFwbFfmFsuMsg({ guid }: { guid: string }) {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "CIMP",
      method: "GET",
      url: `/cimp/getFwbFfmFsuMsg?guid=${guid}`,
      pgmId: pgmId,
    });
    if (res.ok) {
      if (res.data) {
        if (res.data[0]) {
          const data = res.data[0][0]["EDI_FILE"];
          if (data) {
            setFreeText(changeSitaMessage(data));
          }
        }
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
            setFreeText(changeSitaMessage(data));
          }
        }
      }
    }
  }

  return (
    <div className="grid grid-cols-[15%_60%_20%] p-[1%] gap-x-4 gap-y-2">
      <div className="h-full row-span-2 border-r-2 border-gray-300">
        <CommonLabel id="sendUser" label="보내는 사람" />
      </div>
      <div className="mainInput">
        <CommonInput
          id="sitaAddr1"
          value={sitaAddr1}
          onChange={(v) => setSitaAddr1(v)}
          label="SITA ADDR"
          labelW="20%"
          read={true}
        />
      </div>
      <div className="mainInput ">
        <CommonInput
          id="schSid"
          value={params.schSid}
          onChange={(v) => {
            setParams((prev) => ({ ...prev, schSid: v }));
          }}
          read={true}
        />
      </div>
      <div className="mainInput col-span-2">
        <CommonInput
          id="senderEmail"
          value={senderEmail}
          onChange={(v) => setSenderEmail(v)}
          label="EMAIL"
          labelW="14.7%"
        />
      </div>
      <div className="col-span-3">
        <Divider align="Horizen" />
      </div>
      <div className="h-full row-span-2 border-r-2 border-gray-300">
        <CommonLabel id="recvUser" label="받는 사람" />
      </div>
      <div className="mainInput col-span-2">
        <CommonMultiDrop
          data={sitaa}
          dropHeight="15rem"
          header={commonHeader4}
          id="sitaa"
          btnKey="CODE_CODE"
          btnW={5}
          onChange={(a) => {
            setParams((prev) => ({ ...prev, sitaAddr: a }));
          }}
          title="SITA ADDR"
          labelW="15.3%"
          inputData={{ key: "CODE_CODE", split: " ", value: params.sitaAddr }}
        />
      </div>
      <div className="mainInput col-span-2">
        <CommonInput
          id="receiverEmail"
          value={params.emailAddr}
          label="EMAIL"
          onChange={(v) => {
            setParams((prev) => ({ ...prev, emailAddr: v }));
          }}
          labelW="14.7%"
        />
      </div>
      <div className="col-span-3">
        <Divider align="Horizen" />
      </div>
      <div className="mainInput">
        <CommonDropDown
          id="priority"
          labelW="30%"
          data={sitpc}
          dropHeight="10rem"
          header={commonHeader}
          inputKey={{
            key: "CODE_CODE",
            showKey: "0",
            value: sitpcSelect["CODE_CODE"],
          }}
          onClick={(r) => {
            setSitpcSelect(r);
          }}
          title="제목"
        />
      </div>
      <div className="mainInput col-span-2">
        <CommonInput
          id="subject"
          value={subject}
          onChange={(v) => setSubject(v)}
        />
      </div>
      <div className="col-span-3">
        <Divider align="Horizen" />
      </div>
      <div className="col-span-3 h-[22rem]">
        {" "}
        <textarea
          className="w-full h-full bg-white p-[1rem] border border-gray-500 rounded-sm"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
        />
      </div>
    </div>
  );
}
