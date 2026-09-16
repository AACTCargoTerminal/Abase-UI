import { forwardRef, useEffect, useState } from "react";
import { getApi } from "../../Util/Util";
import type {
  DefInfraComp,
  PageHandle,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";

import { CommonContainer } from "../../comp/Container";
import { TableCust } from "../../comp/Table";
import { CommonInput } from "../../comp/Input";
import { CommonDropDown } from "../../comp/DropDown";
import { Btn } from "../../comp/Btn";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

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

function formatDateTimeMinute(value: any) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.replace("T", " ").substring(0, 16);
}

function normalizeApprRows(rows: TableRow[]) {
  return rows.map((row) => {
    const statusCode = String(row["STATUS_CODE"] || "");

    return {
      ...row,
      STATUS_CODE: statusCode,
      STATUS_NAME:
        getApprStatusName(statusCode) || String(row["STATUS_NAME"] || ""),
      STATUS_REASON: String(row["STATUS_REASON"] || ""),
      REF_DEPT_NAMES: String(row["REF_DEPT_NAMES"] || "-"),
      DRAFT_TIME: formatDateTimeMinute(row["DRAFT_TIME"]),
      COMPLETE_TIME: formatDateTimeMinute(row["COMPLETE_TIME"]),
      STATUS_CHANGE_TIME: formatDateTimeMinute(row["STATUS_CHANGE_TIME"]),
      CURRENT_APPR_NAME: String(
        row["CURRENT_APPR_NAME"] || row["CURRENT_APPR_ID"] || "",
      ),
      DRAFTER_NAME: String(
        row["DRAFTER_NAME"] || row["DRAFTER_ID"] || "",
      ),
      WRITER_NAME: String(row["WRITER_NAME"] || row["WRITER_ID"] || ""),
    };
  });
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
}

function filterApprRows(
  rows: TableRow[],
  title: string,
  fromDate: string,
  toDate: string,
  statusCode: ApprStatusCode,
) {
  return rows.filter((row) => {
    const titleFlag =
      title === "" ||
      String(row["TITLE"] || "")
        .toUpperCase()
        .includes(title.toUpperCase());

    const draftDate = String(row["DRAFT_TIME"] || "").substring(0, 10);

    const fromDateFlag =
      fromDate === "" || draftDate >= fromDate;

    const toDateFlag =
      toDate === "" || draftDate <= toDate;

    const statusFlag =
      statusCode === "" ||
      String(row["STATUS_CODE"] || "") === statusCode;

    return titleFlag && fromDateFlag && toDateFlag && statusFlag;
  });
}

function addRowNumbers(rows: TableRow[]) {
  return rows.map((row, index) => ({
    ...row,
    ROW_NO: index + 1,
  }));
}

const GRID_HEADER: TableHeaderType[] = [
  { key: "ROW_NO", value: "번호", w: "3.5rem" },
  { key: "TITLE", value: "제목", w: "20rem" },
  { key: "REQ_DEPT_NAME", value: "기안부서", w: "7rem" },
  { key: "REF_DEPT_NAMES", value: "참조부서", w: "10rem" },
  { key: "STATUS_NAME", value: "진행상태", w: "7rem" },
  { key: "DRAFT_TIME", value: "기안일시", w: "9rem" },
];

const ApprView = forwardRef<PageHandle, DefInfraComp>(
  ({ deviceType = "PC", pgmId }, ref) => {
    const programId = resolveApprProgramId(pgmId, "IFAPPR0020");

    const [originGrid, setOriginGrid] = useState<TableRow[]>([]);
    const [grid, setGrid] = useState<TableRow[]>([]);
    const [detail, setDetail] = useState<TableRow>({});
    const [title, setTitle] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [statusCode, setStatusCode] = useState<ApprStatusCode>("");
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
        description: "결재 시작 전",
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
        description: "반려 사유",
      },
    ];

    useEffect(() => {
      getApprM010_001();
    }, []);

    async function getApprM010_001() {
      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: "/appr",
        pgmId: programId,
      });

      if (res.ok && res.data) {
        const data = addRowNumbers(
          normalizeApprRows(res.data[0] || []),
        );

        setOriginGrid(data);
        setGrid(data);

        if (data.length > 0) {
          await getApprM010_002(data[0]);
        } else {
          setDetail({});
        }
      }
    }

    async function getApprM010_002(row: TableRow) {
      const apprId = String(row["APPR_ID"] || "");

      if (!apprId) {
        setDetail({});
        return;
      }

      const res = await getApi<Record<number, TableRow[]>>({
        baseUrl: "INFRA",
        method: "GET",
        url: `/appr/detail?apprId=${apprId}`,
        pgmId: programId,
      });

      if (res.ok && res.data && res.data[0] && res.data[0][0]) {
        setDetail(normalizeApprRows([res.data[0][0]])[0]);
      } else {
        setDetail(normalizeApprRows([row])[0]);
      }
    }

    function applyFilter(code: ApprStatusCode) {
      const data = addRowNumbers(
        filterApprRows(
          originGrid,
          title,
          fromDate,
          toDate,
          code,
        ),
      );

      setGrid(data);

      if (data.length > 0) {
        getApprM010_002(data[0]);
      } else {
        setDetail({});
      }
    }

    function search() {
      applyFilter(statusCode);
    }

    function reset() {
      setTitle("");
      setFromDate("");
      setToDate("");
      setStatusCode("");
      setGrid(originGrid);

      if (originGrid.length > 0) {
        getApprM010_002(originGrid[0]);
      } else {
        setDetail({});
      }
    }

    function selectStatus(code: ApprStatusCode) {
      setStatusCode(code);
      applyFilter(code);
    }

    return (
      <div className="py-1 pr-1">
        <div className="flex w-full flex-col gap-2">
          <CommonContainer title="기안 진행 현황" deviceType={deviceType}>
            <div
              className={`grid gap-2 ${
                deviceType === "PC" ? "grid-cols-5" : "grid-cols-2"
              }`}>
              {statusCards.map((item) => (
                <button
                  type="button"
                  key={item.code || "ALL"}
                  onClick={() => selectStatus(item.code)}
                  className={`group min-h-[4.75rem] rounded-lg border bg-white px-4 py-3 text-left transition-colors duration-150 ${
                    statusCode === item.code
                      ? "border-slate-400 bg-slate-50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                  }`}>
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {item.title}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full opacity-70 ${getStatusDotClass(
                          item.code,
                        )}`}
                      />
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div className="flex items-end gap-1.5">
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
                </button>
              ))}
            </div>
          </CommonContainer>

          {searchOpen && (
            <CommonContainer title="조회" deviceType={deviceType}>
              <div
                className={`grid items-end gap-3 ${
                  deviceType === "PC"
                    ? "grid-cols-[minmax(12rem,1.6fr)_1fr_1fr_0.8fr_auto]"
                    : "grid-cols-1"
                }`}>
                <CommonInput
                  id="apprSearchTitle"
                  label="제목"
                  labelW="3.5rem"
                  holder="기안 제목"
                  value={title}
                  onChange={setTitle}
                />

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

          <div
            className={`grid min-w-0 items-start gap-2 ${
              deviceType === "PC"
                ? "grid-cols-[minmax(0,1.35fr)_minmax(27rem,0.9fr)]"
                : "grid-cols-1"
            }`}>
            <div className="relative min-w-0">
              <div className="absolute right-3 top-[0.45rem] z-20">
                <button
                  type="button"
                  title="조회조건"
                  aria-label="조회조건"
                  aria-expanded={searchOpen}
                  onClick={() => setSearchOpen((prev) => !prev)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border text-base font-semibold leading-none transition ${
                    searchOpen
                      ? "border-slate-400 bg-slate-100 text-slate-700"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  }`}>
                  {searchOpen ? "−" : "+"}
                </button>
              </div>

              <CommonContainer
                title={`기안 목록 (조회 ${grid.length}건 / 전체 ${originGrid.length}건)`}
                deviceType={deviceType}>
                <TableCust
                  tableId="apprProgressViewGrid"
                  header={GRID_HEADER}
                  body={grid}
                  height={
                    deviceType === "PC"
                      ? searchOpen
                        ? "calc(100vh - 30rem)"
                        : "calc(100vh - 25rem)"
                      : "22rem"
                  }
                  width="100%"
                  onClick={(row) => {
                    getApprM010_002(row);
                  }}
                />
              </CommonContainer>
            </div>

            <div className="min-w-0">
              <CommonContainer title="기안 상세" deviceType={deviceType}>
                <ApprDetailView row={detail} deviceType={deviceType} />
              </CommonContainer>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default ApprView;

function ApprDetailView({
  row,
  deviceType,
}: {
  row: TableRow;
  deviceType: "MOBILE" | "PC";
}) {
  if (!row || Object.keys(row).length === 0) {
    return (
      <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-6 text-center text-sm text-gray-400">
        기안 목록에서 확인할 문서를 선택해 주세요.
      </div>
    );
  }

  const statusCode = String(row["STATUS_CODE"] || "");
  const statusName = String(row["STATUS_NAME"] || "-");
  const title = String(row["TITLE"] || "제목 없음");
  const currentApprover = String(
    row["CURRENT_APPR_NAME"] || row["CURRENT_APPR_ID"] || "-",
  );
  const drafter = String(
    row["DRAFTER_NAME"] || row["DRAFTER_ID"] || row["DRAFTER_SID"] || "-",
  );
  const writer = String(row["WRITER_NAME"] || row["WRITER_ID"] || "-");
  const reqDept = String(
    row["REQ_DEPT_NAME"] || row["REQ_DEPT_CODE"] || "-",
  );
  const draftTime = String(row["DRAFT_TIME"] || "-");
  const completeTime = String(row["COMPLETE_TIME"] || "-");
  const statusChangeTime = String(row["STATUS_CHANGE_TIME"] || "");

  const statusReasonLabel =
    statusCode === "WAITING"
      ? "대기 사유"
      : statusCode === "PROGRESS"
        ? "결재 진행중 사유"
        : statusCode === "COMPLETED"
          ? "결재 사유"
          : "상태 사유";

  return (
    <div className="flex flex-col gap-2">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-gray-400">
                <span>기안번호</span>
                <span className="font-medium text-gray-600">
                  {String(row["APPR_ID"] || "-")}
                </span>
              </div>
              <h2 className="break-words text-base font-bold leading-snug tracking-tight text-gray-900">
                {title}
              </h2>
            </div>

            <StatusBadge code={statusCode} name={statusName} />
          </div>

          <div
            className={`mt-3 grid gap-2 ${
              deviceType === "PC" ? "grid-cols-4" : "grid-cols-1"
            }`}>
            <SummaryItem label="기안부서" value={reqDept} />
            <SummaryItem label="기안자" value={drafter} />
            <SummaryItem
              label="기안일시"
              value={String(row["DRAFT_TIME"] || "-")}
            />
            <SummaryItem
              label="현재 결재자"
              value={currentApprover}
            />
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-gray-800">결재 진행</div>
              <div className="mt-0.5 text-[0.68rem] text-gray-400">
                현재 결재 진행 상태
              </div>
            </div>

            {statusChangeTime && (
              <div className="text-right">
                <div className="text-[0.68rem] text-gray-400">
                  결재변경일시
                </div>
                <div className="mt-0.5 text-xs font-medium text-gray-600">
                  {statusChangeTime}
                </div>
              </div>
            )}
          </div>

          <ApprovalProgress
            statusCode={statusCode}
            currentApprover={currentApprover}
            draftTime={draftTime}
            completeTime={completeTime}
          />

          {statusCode !== "REJECTED" &&
            String(row["STATUS_REASON"] || "").trim() !== "" && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3">
                <div className="text-xs font-semibold text-slate-500">
                  {statusReasonLabel}
                </div>
                <div className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-700">
                  {String(row["STATUS_REASON"] || "-")}
                </div>
              </div>
            )}

          {statusCode === "REJECTED" && (
            <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-3">
              <div className="text-xs font-semibold text-rose-500">
                반려 사유
              </div>
              <div className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-rose-700/80">
                {String(
                  row["REJECT_REASON"] || row["STATUS_REASON"] || "-",
                )}
              </div>
              <div className="mt-1.5 text-xs text-rose-500">
                반려자:{" "}
                {String(
                  row["REJECT_BY_NAME"] || row["REJECT_BY_ID"] || "-",
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="mb-2">
          <div className="text-sm font-bold text-gray-800">처리 정보</div>
          <div className="mt-0.5 text-[0.68rem] text-gray-400">
            현재 처리 결과
          </div>
        </div>

        <div
          className={`grid gap-x-4 gap-y-2 ${
            deviceType === "PC" ? "grid-cols-3" : "grid-cols-1"
          }`}>
          <InfoItem label="진행상태" value={statusName} />
          <InfoItem label="완료일시" value={completeTime} />
          <InfoItem label="담당자" value={writer} />
        </div>
      </section>
    </div>
  );
}
function SummaryItem({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[0.65rem] text-slate-400">
        {label}
      </div>
      <div
        className={`truncate text-sm font-semibold text-slate-800 ${valueClassName}`}>
        {value}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-gray-100 pb-2">
      <div className="text-[0.68rem] font-medium text-gray-400">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-gray-700">
        {value || "-"}
      </div>
    </div>
  );
}

function StatusBadge({ code, name }: { code: string; name: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusBadgeClass(
        code,
      )}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(code)}`} />
      {name || "-"}
    </span>
  );
}

function ApprovalProgress({
  statusCode,
  currentApprover,
  draftTime,
  completeTime,
}: {
  statusCode: string;
  currentApprover: string;
  draftTime: string;
  completeTime: string;
}) {
  const rejected = statusCode === "REJECTED";
  const progressPassed = statusCode === "PROGRESS" || statusCode === "COMPLETED";
  const completed = statusCode === "COMPLETED";

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-3">
      <div className="flex items-start">
        <ProgressNode
          title="기안"
          description={draftTime}
          state="done"
        />

        <ProgressConnector active={progressPassed || rejected} />

        <ProgressNode
          title={rejected ? "반려" : "결재"}
          description={
            rejected
              ? "결재 반려"
              : statusCode === "WAITING"
                ? "결재 대기"
                : currentApprover
          }
          state={
            rejected
              ? "rejected"
              : statusCode === "WAITING"
                ? "waiting"
                : completed
                  ? "done"
                  : "active"
          }
        />

        <ProgressConnector active={completed} />

        <ProgressNode
          title="완료"
          description={completed ? completeTime : "-"}
          state={completed ? "done" : "waiting"}
        />
      </div>
    </div>
  );
}

function ProgressNode({
  title,
  description,
  state,
}: {
  title: string;
  description: string;
  state: "waiting" | "active" | "done" | "rejected";
}) {
  const circleClass =
    state === "done"
      ? "border-emerald-500 bg-emerald-500 text-white"
      : state === "active"
        ? "border-[#336699] bg-[#336699] text-white shadow-[0_0_0_4px_rgba(51,102,153,0.10)]"
        : state === "rejected"
          ? "border-red-500 bg-red-500 text-white"
          : "border-gray-300 bg-white text-gray-300";

  const titleClass =
    state === "active"
      ? "text-[#336699]"
      : state === "rejected"
        ? "text-rose-600"
        : state === "done"
          ? "text-gray-800"
          : "text-gray-400";

  return (
    <div className="flex min-w-[4.5rem] flex-col items-center text-center">
      <div
  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[0.68rem] font-bold transition ${circleClass}`}>
  {state === "done" ? (
    "✓"
  ) : state === "rejected" ? (
    "!"
  ) : state === "active" ? (
    <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin text-white" />
  ) : (
    ""
  )}
</div>
      <div className={`mt-1.5 text-xs font-bold ${titleClass}`}>{title}</div>
      <div className="mt-0.5 max-w-[7rem] truncate text-[0.62rem] text-gray-400">
        {description || "-"}
      </div>
    </div>
  );
}

function ProgressConnector({ active }: { active: boolean }) {
  return (
    <div className="mt-[0.95rem] min-w-[1.25rem] flex-1 px-1">
      <div
        className={`h-[2px] w-full rounded-full ${
          active ? "bg-emerald-400" : "bg-gray-200"
        }`}
      />
    </div>
  );
}

function getStatusDotClass(code: string) {
  switch (code) {
    case "WAITING":
      return "bg-amber-400";
    case "PROGRESS":
      return "bg-blue-500";
    case "COMPLETED":
      return "bg-emerald-500";
    case "REJECTED":
      return "bg-rose-300";
    default:
      return "bg-gray-400";
  }
}

function getStatusBadgeClass(code: string) {
  switch (code) {
    case "WAITING":
      return "border-amber-100 bg-amber-50/50 text-amber-700";
    case "PROGRESS":
      return "border-sky-100 bg-sky-50/50 text-sky-700";
    case "COMPLETED":
      return "border-emerald-100 bg-emerald-50/50 text-emerald-700";
    case "REJECTED":
      return "border-rose-100 bg-rose-50/60 text-rose-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}