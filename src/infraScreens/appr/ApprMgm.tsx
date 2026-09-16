import {
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getApi,
  getClass,
  sendErr,
} from "../../Util/Util";

import type {
  DefInfraComp,
  PageHandle,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";

import { CommonContainer } from "../../comp/Container";
import { TableCust } from "../../comp/Table";
import { Btn } from "../../comp/Btn";
import { CommonInput } from "../../comp/Input";
import { CommonDropDown } from "../../comp/DropDown";
import { ModalCust } from "../../comp/Common";
import ApprModal from "./ApprModal";


type ApprStatusCode =
  | ""
  | "WAITING"
  | "PROGRESS"
  | "COMPLETED"
  | "REJECTED";

const APPR_STATUS_HEADER: TableHeaderType[] = [
  { key: "STATUS_NAME", value: "진행상태", w: "10rem" },
];

const APPR_STATUS_DATA: TableRow[] = [
  { STATUS_CODE: "", STATUS_NAME: "전체" },
  { STATUS_CODE: "WAITING", STATUS_NAME: "대기" },
  { STATUS_CODE: "PROGRESS", STATUS_NAME: "진행중" },
  { STATUS_CODE: "COMPLETED", STATUS_NAME: "완료" },
  { STATUS_CODE: "REJECTED", STATUS_NAME: "반려" },
];

const DEPT_HEADER: TableHeaderType[] = [
  { key: "CODE_NAME", value: "부서", w: "14rem" },
];

function resolveApprProgramId(
  pgmId: string | undefined,
  defaultProgramId: string,
) {
  if (pgmId === "APPR010") return "IFAPPR0010";
  if (pgmId === "APPR020") return "IFAPPR0020";
  return pgmId || defaultProgramId;
}

function getApprStatusName(statusCode: string) {
  switch (statusCode) {
    case "WAITING":
      return "대기";
    case "PROGRESS":
      return "진행중";
    case "COMPLETED":
      return "완료";
    case "REJECTED":
      return "반려";
    default:
      return "";
  }
}

function normalizeApprRows(rows: TableRow[]) {
  return rows.map((row) => {
    const statusCode = String(row["STATUS_CODE"] || "");

    return {
      ...row,
      STATUS_CODE: statusCode,
      STATUS_NAME:
        getApprStatusName(statusCode) ||
        String(row["STATUS_NAME"] || ""),
      STATUS_REASON: String(row["STATUS_REASON"] || ""),
      DRAFT_TIME: formatDateTimeMinute(row["DRAFT_TIME"]),
      STATUS_CHANGE_TIME: formatDateTimeMinute(
        row["STATUS_CHANGE_TIME"],
      ),
      COMPLETE_TIME: formatDateTimeMinute(row["COMPLETE_TIME"]),
      REJECT_TIME: formatDateTimeMinute(row["REJECT_TIME"]),
      CURRENT_APPR_NAME: String(
        row["CURRENT_APPR_NAME"] ||
          row["CURRENT_APPR_ID"] ||
          "",
      ),
      DRAFTER_NAME: String(
        row["DRAFTER_NAME"] ||
          row["DRAFTER_ID"] ||
          "",
      ),
      WRITER_NAME: String(
        row["WRITER_NAME"] ||
          row["WRITER_ID"] ||
          "",
      ),
    };
  });
}

function formatDateTimeMinute(value: any) {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.replace("T", " ").substring(0, 16);
}

function filterApprRowsByStatus(
  rows: TableRow[],
  code: ApprStatusCode,
) {
  if (!code) return rows;

  return rows.filter(
    (row) => String(row["STATUS_CODE"] || "") === code,
  );
}

function toDateTimeLocalValue(value: any) {
  const text = String(value || "").trim();

  if (!text) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text}T00:00`;
  }

  const normalized = text.replace(" ", "T");

  if (normalized.length >= 16) {
    return normalized.substring(0, 16);
  }

  return normalized;
}

function toApiDateTime(value: any) {
  const text = String(value || "").trim();

  if (!text) return "";

  return text.replace("T", " ").substring(0, 16);
}

function parseApprDate(value: any) {
  const text = String(value || "").trim();

  if (!text) return null;

  const date = new Date(text.replace(" ", "T"));

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatElapsedHours(hours: number) {
  if (!Number.isFinite(hours) || hours < 0) return "-";

  const totalHours = Math.floor(hours);

  if (totalHours < 1) return "1시간 미만";
  if (totalHours < 24) return `${totalHours}시간`;

  const days = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;

  return remainHours > 0
    ? `${days}일 ${remainHours}시간`
    : `${days}일`;
}


function getApprStatusCount(rows: TableRow[]) {
  return {
    total: rows.length,
    waiting: rows.filter(
      (row) => String(row["STATUS_CODE"] || "") === "WAITING",
    ).length,
    progress: rows.filter(
      (row) => String(row["STATUS_CODE"] || "") === "PROGRESS",
    ).length,
    completed: rows.filter(
      (row) => String(row["STATUS_CODE"] || "") === "COMPLETED",
    ).length,
    rejected: rows.filter(
      (row) => String(row["STATUS_CODE"] || "") === "REJECTED",
    ).length,
  };
}type ApprFormMode = "CREATE" | "EDIT";

function applyDeptNames(
  rows: TableRow[],
  deptMaster: TableRow[],
) {
  return rows.map((row) => {
    const deptCode = String(row["REQ_DEPT_CODE"] || "");
    const dept = deptMaster.find(
      (item) =>
        String(item["CODE_CODE"] || "") === deptCode,
    );

    return {
      ...row,
      REQ_DEPT_NAME: String(
        dept?.["CODE_NAME"] ||
          row["REQ_DEPT_NAME"] ||
          deptCode,
      ),
    };
  });
}

const GRID_HEADER: TableHeaderType[] = [
  { key: "APPR_ID", value: "기안번호", w: "7%" },
  { key: "TITLE", value: "제목", w: "20%" },
  { key: "REQ_DEPT_NAME", value: "기안부서", w: "8%" },
  { key: "STATUS_NAME", value: "진행상태", w: "7%" },
  { key: "CURRENT_APPR_NAME", value: "현재 결재자", w: "8%" },
  { key: "DRAFTER_NAME", value: "기안자", w: "7%" },
  { key: "WRITER_NAME", value: "담당자", w: "7%" },
  { key: "DRAFT_TIME", value: "기안일시", w: "12%" },
  { key: "STATUS_CHANGE_TIME", value: "결재변경일시", w: "12%" },
  { key: "COMPLETE_TIME", value: "완료일시", w: "12%" },
];


type SearchCondition = {
  fromDate: string;
  toDate: string;
  title: string;
  reqDeptCode: string;
  statusCode: ApprStatusCode;
};

const ApprMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ deviceType = "PC", pgmId }, ref) => {
  const programId = resolveApprProgramId(
    pgmId,
    "IFAPPR0010",
  );

  const pageDeviceType: "PC" | "MOBILE" =
    deviceType === "MOBILE" ? "MOBILE" : "PC";

  const [originGrid, setOriginGrid] = useState<TableRow[]>([]);
  const [grid, setGrid] = useState<TableRow[]>([]);
  const [statusMaster, setStatusMaster] = useState<TableRow[]>([]);
  const [deptMaster, setDeptMaster] = useState<TableRow[]>([]);
  const [deptUserList, setDeptUserList] = useState<TableRow[]>([]);
  const [approvalUserList, setApprovalUserList] = useState<TableRow[]>([]);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [title, setTitle] = useState("");
  const [reqDeptCode, setReqDeptCode] = useState("");
  const [statusCode, setStatusCode] =
    useState<ApprStatusCode>("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] =
    useState<ApprFormMode>("CREATE");
  const [form, setForm] = useState<TableRow>({});
  const [searchOpen, setSearchOpen] = useState(false);


  const statusCount = getApprStatusCount(originGrid);
  const statusCards: {
    code: ApprStatusCode;
    title: string;
    value: number;
    description: string;
  }[] = [
    {
      code: "",
      title: "전체",
      value: statusCount.total,
      description: "등록된 전체 기안",
    },
    {
      code: "WAITING",
      title: "대기",
      value: statusCount.waiting,
      description: "결재 시작 대기",
    },
    {
      code: "PROGRESS",
      title: "진행중",
      value: statusCount.progress,
      description: "현재 결재 진행",
    },
    {
      code: "COMPLETED",
      title: "완료",
      value: statusCount.completed,
      description: "결재 처리 완료",
    },
    {
      code: "REJECTED",
      title: "반려",
      value: statusCount.rejected,
      description: "반려 처리",
    },
  ];

  const displayGrid = useMemo(
    () => applyDeptNames(grid, deptMaster),
    [grid, deptMaster],
  );


  const delayMonitoring = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();

    const processingRows = originGrid.filter((row) => {
      const code = String(row["STATUS_CODE"] || "");
      return code === "WAITING" || code === "PROGRESS";
    });

    const elapsedRows = processingRows
      .map((row) => {
        const baseTime =
          parseApprDate(row["STATUS_CHANGE_TIME"]) ||
          parseApprDate(row["DRAFT_TIME"]);

        const elapsedHours = baseTime
          ? Math.max(
              0,
              (nowMs - baseTime.getTime()) / (1000 * 60 * 60),
            )
          : 0;

        return {
          row,
          elapsedHours,
        };
      })
      .sort((a, b) => b.elapsedHours - a.elapsedHours);

    const warningRows = elapsedRows.filter(
      (item) => item.elapsedHours >= 24,
    );

    const delayedRows = elapsedRows.filter(
      (item) => item.elapsedHours >= 72,
    );

    const delayRate =
      processingRows.length > 0
        ? Math.round(
            (delayedRows.length / processingRows.length) * 100,
          )
        : 0;

    return {
      processingCount: processingRows.length,
      warningCount: warningRows.length,
      delayedCount: delayedRows.length,
      delayRate,
      longestElapsedHours:
        elapsedRows.length > 0 ? elapsedRows[0].elapsedHours : 0,
      delayedTop3: delayedRows.slice(0, 3),
    };
  }, [originGrid]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    await Promise.all([
      getStatusData(),
      getDeptData(),
      getApprovalUser(),
      getApprAdminList({
        fromDate: "",
        toDate: "",
        title: "",
        reqDeptCode: "",
        statusCode: "",
      }),
    ]);
  }

  async function getStatusData() {
    const data = await getClass("APSTS", programId);
    setStatusMaster(data);
  }

  async function getDeptData() {
    const data = await getClass("HRPAT", programId);
    setDeptMaster(data);
  }

  async function getApprovalUser() {
    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "GET",
      url: "/appr/approval-user",
      pgmId: programId,
    });

    const data =
      res.ok && res.data ? res.data[0] || [] : [];

    setApprovalUserList(data);

    return data;
  }

  async function getApprDeptUser(deptCode: string) {
    if (!deptCode) {
      setDeptUserList([]);
      return [];
    }

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "GET",
      url: `/appr/dept-user?deptCode=${encodeURIComponent(deptCode)}`,
      pgmId: programId,
    });

    const data =
      res.ok && res.data ? res.data[0] || [] : [];

    setDeptUserList(data);

    return data;
  }

  function getSearchCondition(
    code: ApprStatusCode = statusCode,
  ): SearchCondition {
    return {
      fromDate,
      toDate,
      title,
      reqDeptCode,
      statusCode: code,
    };
  }

  function getStatusSid(code: ApprStatusCode) {
    if (!code) return "";

    const status = statusMaster.find(
      (row) =>
        String(
          row["VALUE1_CHAR"] ||
            row["CODE_CODE"] ||
            "",
        ) === code,
    );

    return status?.["CODE_SID"] ?? "";
  }

  function makeQuery(condition: SearchCondition) {
    const query = new URLSearchParams();

    if (condition.fromDate) {
      query.set("fromDate", condition.fromDate);
    }

    if (condition.toDate) {
      query.set("toDate", condition.toDate);
    }

    if (condition.title.trim()) {
      query.set("title", condition.title.trim());
    }

    if (condition.reqDeptCode) {
      query.set("reqDeptCode", condition.reqDeptCode);
    }

    const statusSid = getStatusSid(condition.statusCode);

    if (String(statusSid).trim() !== "") {
      query.set("statusSid", String(statusSid));
    }

    const value = query.toString();

    return value ? `?${value}` : "";
  }

  async function getApprAdminList(
    condition: SearchCondition,
  ) {
    /*
     * 상태 카드를 눌러도 다른 상태 건수가 0이 되지 않도록
     * 서버 조회에서는 상태조건을 제외하고 전체 상태를 유지한다.
     * 실제 목록(grid)만 선택한 상태로 필터링한다.
     */
    const baseCondition: SearchCondition = {
      ...condition,
      statusCode: "",
    };

    const res = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "GET",
      url: `/appr/admin${makeQuery(baseCondition)}`,
      pgmId: programId,
    });

    if (res.ok && res.data) {
      const data = normalizeApprRows(res.data[0] || []);

      setOriginGrid(data);
      setGrid(filterApprRowsByStatus(data, condition.statusCode));
    }
  }

  async function search() {
    const condition = getSearchCondition();

    await getApprAdminList(condition);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (formOpen) return;

      e.preventDefault();

      const active = document.activeElement as HTMLElement | null;

      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.getAttribute("contenteditable") === "true")
      ) {
        active.blur();
      }

      setTimeout(() => {
        search();
      }, 0);
    };

    window.addEventListener("keyup", handler, true);

    return () => {
      window.removeEventListener("keyup", handler, true);
    };
  }, [
    fromDate,
    toDate,
    title,
    reqDeptCode,
    statusCode,
    statusMaster,
    formOpen,
  ]);

  async function reset() {
    setFromDate("");
    setToDate("");
    setTitle("");
    setReqDeptCode("");
    setStatusCode("");

    const condition: SearchCondition = {
      fromDate: "",
      toDate: "",
      title: "",
      reqDeptCode: "",
      statusCode: "",
    };

    await getApprAdminList(condition);
  }

  async function selectStatus(code: ApprStatusCode) {
    setStatusCode(code);

    const condition = getSearchCondition(code);

    await getApprAdminList(condition);
  }

  function openCreate() {
    setDeptUserList([]);

    const waiting = statusMaster.find(
      (row) =>
        String(
          row["VALUE1_CHAR"] ||
            row["CODE_CODE"] ||
            "",
        ) === "WAITING",
    );

    setFormMode("CREATE");

    setForm({
      APPR_ID: "",
      TITLE: "",
      REQ_DEPT_CODE: "",
      REQ_DEPT_NAME: "",
      STATUS_SID: waiting?.["CODE_SID"] || "",
      STATUS_CODE: "WAITING",
      STATUS_REASON: "",
      CURRENT_APPR_SID: "",
      CURRENT_APPR_NAME: "",
      DRAFTER_SID: "",
      DRAFTER_NAME: "",
      DRAFT_TIME: "",
      STATUS_CHANGE_TIME: "",
      LAST_STATUS_CHANGE_TIME: "",
      COMPLETE_TIME: "",
      WRITER_SID: "",
      WRITER_NAME: "",
      REJECT_REASON: "",
      REJECT_BY_SID: "",
      REF_DEPT_CODES_TEXT: "",
    });

    setFormOpen(true);
  }

  async function openEdit(row: TableRow) {
    const apprId = String(row["APPR_ID"] || "");

    if (!apprId) return;

    const [detailRes, refRes] = await Promise.all([
      getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/appr/detail?apprId=${apprId}`,
        pgmId: programId,
      }),
      getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/appr/ref-dept?apprId=${apprId}`,
        pgmId: programId,
      }),
    ]);

    const detailRow: TableRow =
      detailRes.ok &&
      detailRes.data &&
      detailRes.data[0] &&
      detailRes.data[0][0]
        ? normalizeApprRows([detailRes.data[0][0]])[0] || {}
        : normalizeApprRows([row])[0] || {};

    const refDeptCodes =
      refRes.ok && refRes.data
        ? (refRes.data[0] || [])
            .map((item) =>
              String(item["DEPT_CODE"] || ""),
            )
            .filter((item) => item !== "")
        : [];

    const selectedStatus = statusMaster.find(
      (item) =>
        String(item["CODE_SID"] || "") ===
        String(detailRow["STATUS_SID"] || ""),
    );

    const selectedDept = deptMaster.find(
      (item) =>
        String(item["CODE_CODE"] || "") ===
        String(detailRow["REQ_DEPT_CODE"] || ""),
    );

    const detailDeptCode = String(
      detailRow["REQ_DEPT_CODE"] || "",
    );

    const deptUsers = await getApprDeptUser(detailDeptCode);

    const approvalUsers =
      approvalUserList.length > 0
        ? approvalUserList
        : await getApprovalUser();

    const selectedDrafter = deptUsers.find(
      (item: TableRow) =>
        String(item["USER_SID"] || "") ===
        String(detailRow["DRAFTER_SID"] || ""),
    );

    const selectedCurrentAppr = approvalUsers.find(
      (item: TableRow) =>
        String(item["USER_SID"] || "") ===
        String(detailRow["CURRENT_APPR_SID"] || ""),
    );

    const selectedRejectBy = approvalUsers.find(
      (item: TableRow) =>
        String(item["USER_SID"] || "") ===
        String(detailRow["REJECT_BY_SID"] || ""),
    );

    setFormMode("EDIT");

    setForm({
      ...detailRow,
      DRAFT_TIME: toDateTimeLocalValue(detailRow["DRAFT_TIME"]),
      STATUS_CHANGE_TIME: "",
      LAST_STATUS_CHANGE_TIME: toDateTimeLocalValue(
        detailRow["STATUS_CHANGE_TIME"],
      ),
      ORIGINAL_STATUS_SID: detailRow["STATUS_SID"] ?? "",
      ORIGINAL_CURRENT_APPR_SID:
        detailRow["CURRENT_APPR_SID"] ?? "",
      STATUS_SID:
        selectedStatus?.["CODE_SID"] ??
        detailRow["STATUS_SID"] ??
        "",
      REQ_DEPT_NAME:
        selectedDept?.["CODE_NAME"] ??
        detailRow["REQ_DEPT_NAME"] ??
        "",
      DRAFTER_SID:
        selectedDrafter?.["USER_SID"] ??
        detailRow["DRAFTER_SID"] ??
        "",
      DRAFTER_NAME:
        selectedDrafter?.["USER_NAME"] ??
        detailRow["DRAFTER_NAME"] ??
        "",
      CURRENT_APPR_SID:
        selectedCurrentAppr?.["USER_SID"] ??
        detailRow["CURRENT_APPR_SID"] ??
        "",
      CURRENT_APPR_NAME:
        selectedCurrentAppr?.["USER_NAME"] ??
        detailRow["CURRENT_APPR_NAME"] ??
        "",
        REJECT_BY_SID:
        selectedRejectBy?.["USER_SID"] ??
        detailRow["REJECT_BY_SID"] ??
        "",

      REJECT_BY_NAME:
        selectedRejectBy?.["USER_NAME"] ??
        detailRow["REJECT_BY_NAME"] ??
        "",
      REF_DEPT_CODES_TEXT: refDeptCodes.join(","),
    });

    setFormOpen(true);
  }

  function changeForm(key: string, value: any) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function changeReqDept(row: TableRow) {
    const deptCode = String(row["CODE_CODE"] || "");
    const deptName = String(row["CODE_NAME"] || "");

    setForm((prev) => ({
      ...prev,
      REQ_DEPT_CODE: deptCode,
      REQ_DEPT_NAME: deptName,
      DRAFTER_SID: "",
      DRAFTER_NAME: ""
    }));

    await getApprDeptUser(deptCode);
  }

  function toNumberOrNull(value: any) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return null;
    }

    return Number(value);
  }

  function getRefDeptCodes() {
    return String(form["REF_DEPT_CODES_TEXT"] || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
  }

  async function refreshCurrentSearch() {
    const condition = getSearchCondition();

    await getApprAdminList(condition);
  }

  async function saveForm() {
    if (String(form["TITLE"] || "").trim() === "") {
      sendErr("제목을 입력하세요.");
      return;
    }

    if (
      String(form["REQ_DEPT_CODE"] || "").trim() === ""
    ) {
      sendErr("기안부서를 선택하세요.");
      return;
    }

    if (
      String(form["DRAFTER_SID"] || "").trim() === ""
    ) {
      sendErr("기안자를 입력하세요.");
      return;
    }

    if (String(form["DRAFT_TIME"] || "").trim() === "") {
      sendErr("기안일을 입력하세요.");
      return;
    }

    if (
      String(form["STATUS_SID"] || "").trim() === ""
    ) {
      sendErr("진행상태를 선택하세요.");
      return;
    }

    const statusChanged =
      formMode === "EDIT" &&
      String(form["STATUS_SID"] ?? "") !==
        String(form["ORIGINAL_STATUS_SID"] ?? "");

    const currentApprChanged =
      formMode === "EDIT" &&
      String(form["CURRENT_APPR_SID"] ?? "") !==
        String(form["ORIGINAL_CURRENT_APPR_SID"] ?? "");

    const statusEventRequired =
      statusChanged || currentApprChanged;

    if (
      statusEventRequired &&
      String(form["STATUS_CHANGE_TIME"] || "").trim() === ""
    ) {
      sendErr("결재 진행일시를 입력하세요.");
      return;
    }

    const params = new Map<string, any>();

    params.set(
      "apprId",
      toNumberOrNull(form["APPR_ID"]),
    );
    params.set("title", String(form["TITLE"] || ""));
    params.set(
      "reqDeptCode",
      String(form["REQ_DEPT_CODE"] || ""),
    );
    params.set("refDeptCodes", getRefDeptCodes());
    params.set(
      "statusSid",
      toNumberOrNull(form["STATUS_SID"]),
    );
    params.set(
      "statusReason",
      String(form["STATUS_REASON"] || ""),
    );
    params.set(
      "currentApprSid",
      toNumberOrNull(form["CURRENT_APPR_SID"]),
    );
    params.set(
      "drafterSid",
      toNumberOrNull(form["DRAFTER_SID"]),
    );

    params.set(
      "draftTime",
      toApiDateTime(form["DRAFT_TIME"]),
    );
    params.set(
    "statusChangeTime",
    formMode === "CREATE"
      ? toApiDateTime(form["DRAFT_TIME"])
      : statusEventRequired
        ? toApiDateTime(form["STATUS_CHANGE_TIME"])
        : toApiDateTime(form["LAST_STATUS_CHANGE_TIME"]),
    );

    params.set(
      "rejectReason",
      String(form["REJECT_REASON"] || ""),
    );
    params.set(
      "rejectBySid",
      toNumberOrNull(form["REJECT_BY_SID"]),
    );

    const res = await getApi<unknown>({
      baseUrl: "INFRA",
      method: "POST",
      url: "/appr",
      params,
      sucFlag: true,
      pgmId: programId,
    });

    if (res.ok) {
      setFormOpen(false);
      await refreshCurrentSearch();
    }
  }

  async function deleteAppr() {
    const apprId = String(form["APPR_ID"] || "");

    if (!apprId) {
      sendErr("삭제할 기안번호가 없습니다.");
      return;
    }

    const res = await getApi<unknown>({
      baseUrl: "INFRA",
      method: "DELETE",
      url: `/appr?apprId=${encodeURIComponent(apprId)}`,
      sucFlag: true,
      pgmId: programId,
    });

    if (res.ok) {
      setFormOpen(false);
      setForm({});
      await refreshCurrentSearch();
    }
  }

  return (
    <>
      <div className="py-1 pr-1">
        <div className="flex w-full flex-col gap-2">
          <CommonContainer
          title={`기안 추적 시스템 (전체 ${originGrid.length}건)`}
          deviceType={deviceType}>
          <div
            className={`grid gap-3 ${
              deviceType === "PC" ? "grid-cols-5" : "grid-cols-2"
            }`}>
            {statusCards.map((item) => (
              <div
                key={item.code || "ALL"}
                onClick={() => selectStatus(item.code)}
                className={`group flex min-h-[4.75rem] cursor-pointer flex-col justify-between rounded-lg border bg-white px-4 py-3 text-left transition-colors duration-150 ${
                  statusCode === item.code
                    ? "border-slate-400 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">
                    {item.title}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full opacity-70 ${
                      item.code === "WAITING"
                        ? "bg-amber-400"
                        : item.code === "PROGRESS"
                          ? "bg-blue-500"
                          : item.code === "COMPLETED"
                            ? "bg-green-500"
                            : item.code === "REJECTED"
                              ? "bg-rose-300"
                              : "bg-gray-400"
                    }`}
                  />
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div className="flex items-end gap-1">
                    <span className="text-[1.5rem] font-semibold leading-none tracking-tight text-slate-800">
                      {item.value.toLocaleString()}
                    </span>
                    <span className="pb-0.5 text-xs text-gray-400">건</span>
                  </div>
                  <span className="text-right text-[0.65rem] text-slate-400">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CommonContainer>

        <CommonContainer
          title="관리 필요 결재"
          deviceType={deviceType}
          childrenTitle={
            <span className="text-[0.68rem] text-gray-400">
              미처리 결재 위험도 확인
            </span>
          }>
          <div className="flex flex-col gap-2">
            <div
              className={`grid gap-2 ${
                deviceType === "PC"
                  ? "grid-cols-4"
                  : "grid-cols-2"
              }`}>
              <div className="rounded-md border border-sky-100 bg-sky-50/40 px-3 py-2">
                <div className="text-[0.65rem] font-semibold text-sky-700">
                  24시간 이상
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-semibold leading-none text-slate-800">
                      {delayMonitoring.warningCount.toLocaleString()}
                    </span>
                    <span className="pb-0.5 text-[0.6rem] text-gray-400">
                      건
                    </span>
                  </div>
                  <span className="text-[0.58rem] text-gray-400">
                    주의
                  </span>
                </div>
              </div>

              <div className="rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2">
                <div className="text-[0.65rem] font-semibold text-amber-700">
                  3일 이상 지연
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-semibold leading-none text-slate-800">
                      {delayMonitoring.delayedCount.toLocaleString()}
                    </span>
                    <span className="pb-0.5 text-[0.6rem] text-gray-400">
                      건
                    </span>
                  </div>
                  <span className="text-[0.58rem] text-gray-400">
                    조치 필요
                  </span>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="text-[0.65rem] font-semibold text-gray-600">
                  가장 오래 경과
                </div>
                <div className="mt-1 truncate text-base font-semibold text-slate-800">
                  {formatElapsedHours(
                    delayMonitoring.longestElapsedHours,
                  )}
                </div>
              </div>

              <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="text-[0.65rem] font-semibold text-gray-600">
                  지연률
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <span
                    className={`text-xl font-semibold leading-none ${
                      delayMonitoring.delayRate > 0
                        ? "text-amber-700"
                        : "text-slate-800"
                    }`}>
                    {delayMonitoring.delayRate}%
                  </span>
                  <span className="text-[0.58rem] text-gray-400">
                    처리중 {delayMonitoring.processingCount}건
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-1.5">
                <span className="text-[0.68rem] font-semibold text-gray-600">
                  장기 미처리 결재
                </span>
                <span className="text-[0.6rem] text-gray-400">
                  72시간 이상
                </span>
              </div>

              {delayMonitoring.delayedTop3.length > 0 ? (
                <>
                  <div className="grid grid-cols-[minmax(0,1fr)_7rem_7rem_5rem] items-center gap-3 border-b border-gray-100 px-3 py-1 text-[0.6rem] text-gray-400">
                    <div>제목</div>
                    <div>부서</div>
                    <div>현재 결재자</div>
                    <div className="text-right">경과</div>
                  </div>

                  {delayMonitoring.delayedTop3.map(
                    ({ row, elapsedHours }) => (
                      <div
                        key={String(
                          row["APPR_ID"] ||
                            `${row["TITLE"]}-${elapsedHours}`,
                        )}
                        className="grid grid-cols-[minmax(0,1fr)_7rem_7rem_5rem] items-center gap-3 border-b border-gray-100 px-3 py-1.5 text-xs last:border-b-0">
                        <div className="min-w-0 truncate font-medium text-gray-700">
                          {String(row["TITLE"] || "-")}
                        </div>

                        <div className="truncate text-gray-500">
                          {String(
                            row["REQ_DEPT_NAME"] ||
                              row["REQ_DEPT_CODE"] ||
                              "-",
                          )}
                        </div>

                        <div className="truncate text-gray-500">
                          {String(
                            row["CURRENT_APPR_NAME"] || "-",
                          )}
                        </div>

                        <div className="text-right font-semibold text-amber-600">
                          {formatElapsedHours(elapsedHours)}
                        </div>
                      </div>
                    ),
                  )}
                </>
              ) : (
                <div className="flex h-10 items-center justify-center text-[0.68rem] text-gray-400">
                  3일 이상 지연된 결재가 없습니다.
                </div>
              )}
            </div>
          </div>
        </CommonContainer>

        {searchOpen && (
          <CommonContainer title="조회" deviceType={deviceType}>
            <div
              className={`grid items-end gap-3 ${
                deviceType === "PC"
                  ? "grid-cols-[1fr_1fr_1.5fr_1fr_1fr_auto]"
                  : "grid-cols-1"
              }`}>
              <CommonInput
                id="apprSearchFromDate"
                label="시작일"
                labelW="4rem"
                type="date"
                value={fromDate}
                onChange={setFromDate}
              />

              <CommonInput
                id="apprSearchToDate"
                label="종료일"
                labelW="4rem"
                type="date"
                value={toDate}
                onChange={setToDate}
              />

              <CommonInput
                id="apprSearchTitle"
                label="제목"
                labelW="3.5rem"
                holder="기안 제목"
                value={title}
                onChange={setTitle}
              />

              <CommonDropDown
                id="apprSearchDept"
                title="기안부서"
                labelW="5rem"
                data={[
                  { CODE_CODE: "", CODE_NAME: "전체" },
                  ...deptMaster,
                ]}
                header={DEPT_HEADER}
                dropHeight="14rem"
                inputKey={{
                  key: "CODE_CODE",
                  value: reqDeptCode,
                  showKey: "0",
                }}
                onClick={(row) => {
                  setReqDeptCode(String(row["CODE_CODE"] || ""));
                }}
              />

              <CommonDropDown
                id="apprSearchStatus"
                title="진행상태"
                labelW="5rem"
                data={APPR_STATUS_DATA}
                header={APPR_STATUS_HEADER}
                dropHeight="11rem"
                inputKey={{
                  key: "STATUS_CODE",
                  value: statusCode,
                  showKey: "0",
                }}
                onClick={(row) => {
                  setStatusCode(
                    String(row["STATUS_CODE"] || "") as ApprStatusCode,
                  );
                }}
              />

              <div className="flex justify-end gap-2">
                <Btn
                  type="SEARCH"
                  txt="조회"
                  deviceType={deviceType}
                  onClick={search}
                />
                <Btn
                  type="NONE"
                  txt="초기화"
                  deviceType={deviceType}
                  onClick={reset}
                />
              </div>
            </div>
          </CommonContainer>
        )}

        <CommonContainer
          title={`기안 목록 (전체 ${originGrid.length}건 / 조회 ${displayGrid.length}건)`}
          titleAlign="END"
          deviceType={deviceType}
          childrenTitle={
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                title="조회조건"
                aria-label="조회조건"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((prev) => !prev)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-base font-semibold leading-none transition ${
                  searchOpen
                    ? "border-slate-400 bg-slate-100 text-slate-700"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}>
                {searchOpen ? "−" : "+"}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  더블클릭 시 수정
                </span>

                <Btn
                  type="NONE"
                  txt="신규"
                  deviceType={deviceType}
                  onClick={openCreate}
                />
              </div>
            </div>
          }>
          <TableCust
            tableId="apprProgressMgmGrid"
            header={GRID_HEADER}
            body={displayGrid}
            height={deviceType === "PC" ? "30rem" : "24rem"}
            width="100%"
            onClick={() => {}}
            doubleClick={(row) => {
              openEdit(row);
            }}
          />
          </CommonContainer>
        </div>
      </div>

      <ModalCust
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
        }}
        title={
          formMode === "CREATE"
            ? "기안 신규 등록"
            : "기안 정보 수정"
        }
        size="xl"
        deviceType={deviceType}>
        <ApprModal
          mode={formMode}
          form={form}
          statusMaster={statusMaster}
          deptMaster={deptMaster}
          deptUserList={deptUserList}
          approvalUserList={approvalUserList}
          deviceType={pageDeviceType}
          onChange={changeForm}
          onReqDeptChange={changeReqDept}
          onSave={saveForm}
          onDelete={deleteAppr}
          onClose={() => {
            setFormOpen(false);
          }}
        />
      </ModalCust>


    </>
  );
  },
);

export default ApprMgm;
