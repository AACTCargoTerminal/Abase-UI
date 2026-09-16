import { useState } from "react";
import type { TableHeaderType, TableRow } from "../../Util/Type";
import { CommonInput } from "../../comp/Input";
import { CommonDropDown } from "../../comp/DropDown";
import { Btn } from "../../comp/Btn";
import { ModalCust } from "../../comp/Common";

export type ApprFormMode = "CREATE" | "EDIT";

const APPR_FORM_STATUS_HEADER: TableHeaderType[] = [
  { key: "CODE_NAME", value: "진행상태", w: "12rem" },
];

const DEPT_HEADER: TableHeaderType[] = [
  { key: "CODE_NAME", value: "부서", w: "14rem" },
];

const USER_HEADER: TableHeaderType[] = [
  { key: "USER_NAME", value: "사용자", w: "12rem" },
];

export default function ApprModal({
  mode,
  form,
  statusMaster,
  deptMaster,
  deptUserList,
  approvalUserList,
  deviceType,
  onChange,
  onReqDeptChange,
  onSave,
  onDelete,
  onClose,
}: {
  mode: ApprFormMode;
  form: TableRow;
  statusMaster: TableRow[];
  deptMaster: TableRow[];
  deptUserList: TableRow[];
  approvalUserList: TableRow[];
  deviceType: "MOBILE" | "PC";
  onChange: (key: string, value: any) => void;
  onReqDeptChange: (row: TableRow) => void;
  onSave: () => void;
  onDelete: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const statusCode = String(form["STATUS_CODE"] || "");
  const statusChanged =
    mode === "EDIT" &&
    String(form["STATUS_SID"] ?? "") !==
      String(form["ORIGINAL_STATUS_SID"] ?? "");
  const currentApprChanged =
    mode === "EDIT" &&
    String(form["CURRENT_APPR_SID"] ?? "") !==
      String(form["ORIGINAL_CURRENT_APPR_SID"] ?? "");
  const statusEventRequired =
    statusChanged || currentApprChanged;

  const refDeptCodes = String(
    form["REF_DEPT_CODES_TEXT"] || "",
  )
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

  const selectedRefDepts = refDeptCodes.map((code) => {
    const dept = deptMaster.find(
      (item) =>
        String(item["CODE_CODE"] || "") === code,
    );

    return {
      code,
      name: String(dept?.["CODE_NAME"] || code),
    };
  });

  function addRefDept(row: TableRow) {
    const code = String(row["CODE_CODE"] || "").trim();

    if (!code || refDeptCodes.includes(code)) return;

    onChange(
      "REF_DEPT_CODES_TEXT",
      [...refDeptCodes, code].join(","),
    );
  }

  function removeRefDept(code: string) {
    onChange(
      "REF_DEPT_CODES_TEXT",
      refDeptCodes
        .filter((item) => item !== code)
        .join(","),
    );
  }

  return (
    <>
      <div className="px-[3%] py-[3%] flex flex-col gap-4">
      <div className="border border-gray-200 rounded-md bg-[#fafbfc] p-4">
        <div className="mb-4">
          <span className="text-sm font-bold text-gray-700">
            기안 기본 정보
          </span>
        </div>

        <div
          className={`grid gap-4 ${
            deviceType === "PC" ? "grid-cols-2" : "grid-cols-1"
          }`}>
          {mode === "EDIT" && (
            <div className="mainInput">
              <CommonInput
                id="formApprId"
                label="기안번호"
                labelW="6.25rem"
                value={String(form["APPR_ID"] || "")}
                read
              />
            </div>
          )}

          <div className="mainInput">
            <CommonDropDown
              id="formReqDept"
              title="기안부서"
              labelW="6.5rem"
              data={deptMaster}
              header={DEPT_HEADER}
              dropHeight="14rem"
              inputKey={{
                key: "CODE_CODE",
                value: form["REQ_DEPT_CODE"] || "",
                showKey: "0",
              }}
              onClick={(row) => {
                onReqDeptChange(row);
              }}
            />
          </div>

          <div
            className={`mainInput ${
              deviceType === "PC" ? "col-span-2" : ""
            }`}>
            <CommonInput
              id="formTitle"
              label="제목"
              labelW="6.25rem"
              value={String(form["TITLE"] || "")}
              onChange={(value) => {
                onChange("TITLE", value);
              }}
            />
          </div>

          <div className="mainInput">
            <CommonDropDown
              id="formDrafter"
              title="기안자"
              labelW="6.5rem"
              data={deptUserList}
              header={USER_HEADER}
              dropHeight="14rem"
              inputKey={{
                key: "USER_SID",
                value: form["DRAFTER_SID"] || "",
                showKey: "0",
              }}
              onClick={(row) => {
                onChange("DRAFTER_SID", row["USER_SID"] || "");
                onChange(
                  "DRAFTER_NAME",
                  String(row["USER_NAME"] || ""),
                );
              }}
            />
          </div>

          <div className="mainInput">
            <CommonInput
              id="formDraftTime"
              label="기안일시"
              labelW="6.25rem"
              type="datetime-local"
              value={String(form["DRAFT_TIME"] || "")}
              onChange={(value) => {
                onChange("DRAFT_TIME", value);
              }}
            />
          </div>

          {mode === "EDIT" && (
            <div className="mainInput">
              <CommonInput
                id="formWriterName"
                label="담당자"
                labelW="6.25rem"
                value={String(
                  form["WRITER_NAME"] ||
                    form["WRITER_ID"] ||
                    form["WRITER_SID"] ||
                    "",
                )}
                read
              />
            </div>
          )}

          <div
            className={`mainInput ${
              deviceType === "PC" ? "col-span-2" : ""
            }`}>
            <CommonDropDown
              id="formRefDept"
              title="참조부서"
              labelW="6.5rem"
              data={deptMaster.filter(
                (row) =>
                  !refDeptCodes.includes(
                    String(row["CODE_CODE"] || ""),
                  ),
              )}
              header={DEPT_HEADER}
              dropHeight="14rem"
              inputKey={{
                key: "CODE_CODE",
                value: "",
                showKey: "0",
              }}
              onClick={addRefDept}
            />
          </div>

          {selectedRefDepts.length > 0 && (
            <div
              className={`flex flex-wrap gap-1.5 ${
                deviceType === "PC"
                  ? "col-span-2 ml-[6.5rem]"
                  : ""
              }`}>
              {selectedRefDepts.map((dept) => (
                <span
                  key={dept.code}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-gray-300 bg-gray-50 px-2.5 text-xs font-medium text-gray-600">
                  {dept.name}
                  <button
                    type="button"
                    aria-label={`${dept.name} 참조부서 제거`}
                    onClick={() => removeRefDept(dept.code)}
                    className="flex h-4 w-4 items-center justify-center rounded text-sm leading-none text-gray-400 hover:bg-gray-200 hover:text-gray-700">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-md bg-white p-4">
        <div className="mb-4">
          <span className="text-sm font-bold text-gray-700">
            결재 정보
          </span>
        </div>

        <div
          className={`grid gap-4 ${
            deviceType === "PC" ? "grid-cols-2" : "grid-cols-1"
          }`}>
          <div className="mainInput">
            <CommonDropDown
              id="formStatus"
              title="진행상태"
              labelW="6.5rem"
              data={statusMaster}
              header={APPR_FORM_STATUS_HEADER}
              dropHeight="12rem"
              inputKey={{
                key: "CODE_SID",
                value: form["STATUS_SID"] || "",
                showKey: "0",
              }}
              onClick={(row) => {
                onChange("STATUS_SID", row["CODE_SID"]);
                onChange(
                  "STATUS_CODE",
                  String(
                    row["VALUE1_CHAR"] ||
                      row["CODE_CODE"] ||
                      "",
                  ),
                );
              }}
            />
          </div>

          <div className="mainInput">
            <CommonDropDown
              id="formCurrentAppr"
              title="현재 결재자"
              labelW="6.5rem"
              data={approvalUserList}
              header={USER_HEADER}
              dropHeight="14rem"
              inputKey={{
                key: "USER_SID",
                value: form["CURRENT_APPR_SID"] || "",
                showKey: "0",
              }}
              onClick={(row) => {
                onChange(
                  "CURRENT_APPR_SID",
                  row["USER_SID"] || "",
                );
                onChange(
                  "CURRENT_APPR_NAME",
                  String(row["USER_NAME"] || ""),
                );
              }}
            />
          </div>

          {mode === "EDIT" && (
            <div className="mainInput">
              <CommonInput
                id="formLastStatusChangeTime"
                label="최근 결재일시"
                labelW="6.25rem"
                value={String(
                  form["LAST_STATUS_CHANGE_TIME"] || "",
                )}
                read
              />
            </div>
          )}

          {statusEventRequired && (
            <div className="mainInput">
              <CommonInput
                id="formStatusChangeTime"
                label="결재 진행일시"
                labelW="6.25rem"
                type="datetime-local"
                value={String(form["STATUS_CHANGE_TIME"] || "")}
                onChange={(value) => {
                  onChange("STATUS_CHANGE_TIME", value);
                }}
              />
            </div>
          )}

          <div
            className={`mainInput ${
              deviceType === "PC" ? "col-span-2" : ""
            }`}>
            <CommonInput
              id="formStatusReason"
              label="상태사유"
              labelW="6.25rem"
              holder="현재 진행상태에 대한 사유"
              value={String(form["STATUS_REASON"] || "")}
              onChange={(value) => {
                onChange("STATUS_REASON", value);
              }}
            />
          </div>

          {statusCode === "REJECTED" && (
            <>
              <div className="mainInput">
                <CommonInput
                  id="formRejectReason"
                  label="반려사유"
                  labelW="6.25rem"
                  value={String(form["REJECT_REASON"] || "")}
                  onChange={(value) => {
                    onChange("REJECT_REASON", value);
                  }}
                />
              </div>

              <div className="mainInput">
                <CommonDropDown
                  id="formRejectBy"
                  title="반려처리자"
                  labelW="6.5rem"
                  data={approvalUserList}
                  header={USER_HEADER}
                  dropHeight="14rem"
                  inputKey={{
                    key: "USER_SID",
                    value: form["REJECT_BY_SID"] || "",
                    showKey: "0",
                  }}
                  onClick={(row) => {
                    onChange(
                      "REJECT_BY_SID",
                      row["USER_SID"] || "",
                    );
                    onChange(
                      "REJECT_BY_NAME",
                      String(row["USER_NAME"] || ""),
                    );
                  }}
                />
              </div>
            </>
          )}

          {mode === "EDIT" && (
            <div className="mainInput">
              <CommonInput
                id="formCompleteTime"
                label="완료일"
                labelW="6.25rem"
                value={String(form["COMPLETE_TIME"] || "")}
                read
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-3">
        <div>
          {mode === "EDIT" && (
            <Btn
              type="DELETE"
              txt="삭제"
              deviceType={deviceType}
              onClick={() => setDeleteOpen(true)}
            />
          )}
        </div>

        <div className="flex gap-2">
          <Btn
            type="CLOSE"
            txt="닫기"
            deviceType={deviceType}
            onClick={onClose}
          />

          <Btn
            type="SAVE"
            txt={mode === "CREATE" ? "등록" : "저장"}
            deviceType={deviceType}
            onClick={onSave}
          />
        </div>
      </div>
    </div>

      <ModalCust
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="기안 삭제"
        size="sm"
        deviceType={deviceType}>
        <div className="flex flex-col gap-5 p-5">
          <div className="text-sm leading-6 text-gray-700">
            삭제하시겠습니까?
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
            <Btn
              type="CLOSE"
              txt="취소"
              deviceType={deviceType}
              onClick={() => setDeleteOpen(false)}
            />
            <Btn
              type="DELETE"
              txt="확인"
              deviceType={deviceType}
              onClick={async () => {
                await onDelete();
                setDeleteOpen(false);
              }}
            />
          </div>
        </div>
      </ModalCust>
    </>
  );
}
