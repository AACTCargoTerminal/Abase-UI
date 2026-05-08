import { forwardRef, useCallback, useEffect, useState } from "react";
import type {
  DefInfraComp,
  PageHandle,
  TableHeaderType,
  TableRow,
} from "../../Util/Type";
import { CommonContainer, CommonTab } from "../../comp/Container";
import { getApi, getClass } from "../../Util/Util";
import { TableCust2 } from "../../comp/Table";

const TABS = ["요청 리스트", "검토 리스트"];

const WorkHrMgm = forwardRef<PageHandle, DefInfraComp>(
  ({ outParam, param, pgmId }, ref) => {
    const [tabSelect, setTabSelect] = useState(0);
    const [hrreq, setHrreq] = useState<TableRow[]>([]);

    useEffect(() => {
      getClass("HRREQ", pgmId)
        .then((v) => setHrreq(v))
        .catch((r) => setHrreq([]));
    }, []);

    return (
      <div className="pr-[0.5%] flex flex-col gap-3">
        <CommonContainer title="설정" width="100%"></CommonContainer>
        <CommonTab
          tabs={TABS}
          active={tabSelect}
          setActive={(v) => setTabSelect(v)}>
          <ReqList pgmId={pgmId} />
          <div></div>
        </CommonTab>
      </div>
    );
  },
);

export default WorkHrMgm;

const GRID1_HEADER: TableHeaderType[] = [
  { key: "REQ_DATE", value: "날짜", w: "6rem", sum: 0 },
  { key: "REQ_NAME", value: "요청명", w: "8rem" },
  { key: "USER_NAME", value: "이름", w: "5rem" },
  { key: "SEQ", value: "순번", w: "2rem" },
  { key: "WORK_TYPE_NAME", value: "코드명", w: "8rem" },
  { key: "CAPS_START_TIME", value: "캡스시작", w: "5rem" },
  { key: "CAPS_END_TIME", value: "캡스종료", w: "5rem" },
  { key: "REQ_START_TIME", value: "요청시작", w: "5rem" },
  { key: "REQ_END_TIME", value: "요청종료", w: "5rem" },
  { key: "ADD_WORK_HOUR", value: "연장근무", w: "5rem" },
  { key: "NIGHT_WORK_HOUR", value: "야간근무", w: "5rem" },
  { key: "HOLIDAY_WORK_HOUR", value: "휴일근무", w: "5rem" },
];

const ReqList = ({ pgmId }: { pgmId: string }) => {
  const [grid1, setGrid1] = useState<TableRow[]>([]);
  useEffect(() => {
    searchClick();
  }, []);

  const searchClick = useCallback(async () => {
    const ret = await getApi<Record<number, TableRow[]>>({
      baseUrl: "INFRA",
      method: "GET",
      url: `/work/getWorkM010_006`,
      pgmId: pgmId,
      sucFlag: true,
    });

    if (ret.ok) {
      setGrid1(ret.data?.[0] || []);
    }
  }, []);

  return (
    <div>
      <TableCust2
        body={grid1}
        header={GRID1_HEADER}
        height="30rem"
        width="100%"
      />
    </div>
  );
};
