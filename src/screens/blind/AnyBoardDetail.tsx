import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../slices/store";
import { useState } from "react";
import { Captcha } from "../../comp/Common";
import type { TableRow } from "../../Util/Type";
import { getApi, getUUID, sendSuc } from "../../Util/Util";
import DOMPurify from "dompurify";
import { pushError } from "../../slices/err";
import { PwdInput } from "../../comp/Input";
import { Btn } from "../../comp/Btn";

export default function AnyBoardDetail({
  beforeClick,
  param,
}: {
  beforeClick: () => void;
  param: TableRow;
}) {
  const boardSid = Object.keys(param).length !== 0 ? param["BOARD_SID"] : 0;
  const dispatch = useDispatch();
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TableRow[]>([]);
  const [file, setFile] = useState<TableRow[]>([]);
  const [upload, setUpload] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [code, setCode] = useState("");
  const [secuStr, setSecuStr] = useState("");

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setUpload(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setUpload(selected);
  };

  const handleDragLeave = () => setDragOver(false);
  async function getAnyData() {
    const params = new Map<string, string>();
    params.set("boardSid", boardSid);
    params.set("boardPass", password);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/any/getAnyData",
      params: params,
      pgmId: "ANY",
    });
    if (res.ok) {
      if (res.data) {
        setOpen(true);
        setData(res.data[0]);
        setFile(res.data[1]);
      }
    }
  }

  async function saveClick() {
    if (code !== secuStr) {
      dispatch(
        pushError({
          id: getUUID(),
          errFlag: "Y",
          errMsg: "보안문자를 다시입력해주세요.",
        })
      );
      return;
    }

    const params = new Map<string, any>();
    params.set("boardSid", boardSid);
    params.set("boardTitle", title);
    params.set("boardPass", password);
    params.set("boardMsg", body);
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "AUTH",
      method: "POST",
      url: "/any/setAnyData",
      files: upload,
      params: params,
      pgmId: "ANY",
    });

    if (res.ok) {
      sendSuc("저장완료");
      beforeClick();
    }
  }

  return (
    <>
      <div className="h-[40rem] px-[1%]">
        {/* 비밀번호 입력 */}

        {boardSid !== 0 && !open && (
          <div className="absolute w-full h-full flex items-center justify-center backdrop-blur-[1px] rounded-md">
            <div className="flex flex-col items-center justify-center gap-5 border border-gray-300 p-10 bg-[#FFFFFF] rounded-md">
              <label className="font-bold" htmlFor="pass">
                비밀번호를 입력해주세요.
              </label>
              <PwdInput
                id="pass"
                onChange={(v) => setPassword(v)}
                value={password}
              />
              <div className="flex gap-1">
                <Btn
                  txt="CONFIRM"
                  type="NONE"
                  onClick={() => {
                    getAnyData();
                  }}
                />
                <Btn
                  txt="취소"
                  type="CLOSE"
                  onClick={() => {
                    beforeClick();
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {boardSid === 0 && !open && (
          <div className="absolute w-full h-full flex items-center justify-center backdrop-blur-[1px] rounded-md">
            <div className="flex flex-col gap-5 border border-gray-300 p-10 bg-[#FFFFFF] rounded-md">
              <p className="font-bold text-[20px] w-full text-center">
                익명게시판 이용안내
              </p>
              <p>
                익명게시판 글 작성 시 아래 해당하는 글은 사용자의 사전 동의 없이
                게시 삭제, 답글 작성 거부 등의 관련 조치를 취할 수 있습니다.
              </p>

              <ol className="list-decimal space-y-1 ml-5">
                <li>특정 개인 및 부서의 명예 훼손의 우려가 있는 경우</li>
                <li>부서/개인 비방하는 문구나 글이 게재된 경우</li>
                <li>정치적 목적이나 성향이 있는 경우</li>
                <li>욕설, 음란물 등 불건전한 내용</li>
                <li>저작권법에 위배되는 내용</li>
                <li>개인정보에 해당하는 내용이 있는 경우</li>
                <li>
                  기타 해당 익명게시판 운영의 취지와 부합되지 않는 경우 등
                </li>
              </ol>
              <div className="flex w-full gap-1 items-center justify-center">
                <Btn
                  txt="CONFIRM"
                  type="NONE"
                  onClick={() => {
                    setOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1">
          {boardSid === 0 && (
            <div className="col-span-2 flex items-center justify-between p-2">
              <div className="flex items-center gap-5">
                <div className="flex flex-col gap-1">
                  <label htmlFor="secu" className="font-bold px-2 text-nowrap">
                    보안문자
                  </label>
                  <Captcha outCode={(value) => setCode(value)} />
                  <input
                    id="secu"
                    placeholder="보안문자를 입력하세요"
                    className="peer font-semibold bg-[#FFFFFF] text-left anyInput rounded-md border border-gray-300 px-3 py-1
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={secuStr}
                    onChange={(e) => setSecuStr(e.target.value)}
                  />
                </div>
              </div>
              <Btn
                type="SAVE"
                txt="SAVE"
                onClick={() => {
                  saveClick();
                }}
              />
            </div>
          )}
          <div
            className={`flex flex-col p-2 gap-1 ${
              boardSid === 0 ? "" : "col-span-2"
            }`}>
            <label htmlFor="title" className="font-bold px-2">
              제목
            </label>
            <input
              id="title"
              placeholder=""
              className="peer w-full font-semibold bg-[#FFFFFF] text-left anyInput rounded-md border border-gray-300 px-3 py-1
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly={boardSid === 0 ? false : true}
              value={data.length > 0 ? data[0]["BOARD_TITLE"] : title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {boardSid === 0 && (
            <div className="flex flex-col p-2 gap-1">
              <label htmlFor="pass" className="font-bold px-2 truncate">
                비밀번호 ( 숫자, 문자 6 ~ 20 자 )
              </label>
              <div className="anyInput">
                <PwdInput
                  id="pass"
                  value={password}
                  onChange={(value) => setPassword(value)}
                />
              </div>
            </div>
          )}
          {boardSid !== 0 && (
            <div className="flex flex-col p-2 gap-1">
              <label htmlFor="create" className="font-bold px-2">
                작성일
              </label>
              <input
                id="create"
                placeholder=""
                className="peer w-full font-semibold bg-[#FFFFFF] text-left anyInput rounded-md border border-gray-300 px-3 py-1
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={boardSid === 0 ? false : true}
                value={data.length > 0 ? data[0]["POST_TIME"] : ""}
              />
            </div>
          )}

          {boardSid !== 0 && (
            <div className="flex flex-col p-2 gap-1">
              <label htmlFor="reply" className="font-bold text-sm px-2">
                답변일
              </label>
              <input
                id="reply"
                placeholder=""
                className="peer w-full text-base font-semibold bg-[#FFFFFF] text-left anyInput rounded-md border border-gray-300 px-3 py-1
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={boardSid === 0 ? false : true}
                value={data.length > 0 ? data[0]["REPLY_TIME"] : ""}
              />
            </div>
          )}

          <div className="col-span-2 flex flex-col p-2 gap-1">
            <label htmlFor="msg" className="font-bold text-sm px-2">
              내용
            </label>
            {boardSid !== 0 ? (
              <div
                id="msg"
                className="w-full h-[17rem] rounded-md border border-gray-300 px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white prose overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    data.length > 0 ? data[0]["BOARD_MESSAGE"] : ""
                  ),
                }}
              />
            ) : (
              <textarea
                id="msg"
                className="w-full h-[17rem] rounded-md border border-gray-300 px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white prose"
                value={body}
                onChange={(e) => setBody(e.target.value)}></textarea>
            )}
          </div>
          <div className="col-span-2 flex flex-col p-2 gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="file" className="font-bold text-sm px-2">
                첨부파일
              </label>
            </div>

            {boardSid !== 0 ? (
              file &&
              file.length > 0 && (
                <div
                  className="w-full h-[5rem] rounded-md border border-gray-300 px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white prose overflow-y-auto">
                  {file.map((item) => (
                    <div>{item["SOURCE_FILE_NAME"]}</div>
                  ))}
                </div>
              )
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
        flex items-center gap-10 h-[5rem] justify-center w-full mx-auto
        border-2 border-dashed rounded-lg px-6 text-center transition overflow-y-auto
        ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"}
      `}>
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer inline-block text-nowrap px-4 py-2 bg-[#5487CE] text-white rounded shadow hover:bg-blue-700">
                  ⬆ 파일 선택
                </label>
                {upload.length > 0 ? (
                  <ul className="text-sm text-gray-600 w-full text-left">
                    {upload.map((f) => (
                      <li key={f.name} className="truncate">
                        {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">
                    첨부할 파일을 여기에 끌어다 놓거나,
                    <br />
                    <span className="text-gray-500">
                      파일 선택 버튼을 눌러 파일을 직접 선택해 주세요.
                    </span>
                  </p>
                )}

                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
