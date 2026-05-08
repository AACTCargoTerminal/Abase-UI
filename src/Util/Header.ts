import type { TableHeaderType } from "./Type";
export const commonHeader: TableHeaderType[] = [
  { key: "CODE_CODE", value: "", w: "100%" },
];

export const commonHeader2: TableHeaderType[] = [
  { key: "CODE_NAME", value: "", w: "10rem" },
];

export const commonHeader3: TableHeaderType[] = [
  { key: "DROP", value: "", w: "3rem" },
  { key: "CODE_NAME", value: "", w: "100%" },
];
export const commonHeader4: TableHeaderType[] = [
  { key: "CODE_CODE", value: "Code", w: "6rem" },
  { key: "CODE_NAME", value: "Name", w: "15rem" },
];

export const commonHeader5: TableHeaderType[] = [
  { key: "CODE_CODE", value: "코드", w: "5rem", sum: 0 },
  { key: "VALUE5_CHAR", value: "약어", w: "5rem" },
  { key: "VALUE2_CHAR", value: "시작시간", w: "8rem" },
  { key: "VALUE3_CHAR", value: "종료시간", w: "8rem" },
];

export const SchChgHeader: TableHeaderType[] = [
  { key: "FLIGHT_NO", value: "Flight No", w: "6rem", type: "STR", sum: 0 },
  { key: "ROUTE_NAME", value: "경로", w: "8rem", type: "STR" },
  { key: "ACTUAL_TIME", value: "실제 시간", w: "6rem", type: "STR" },
  { key: "FLIGHT_STATUS_NAME", value: "상태", w: "6rem", type: "STR" },
];

export const SchHeader: TableHeaderType[] = [
  { key: "INOUT_FLAG_NAME", value: "구분", w: "3rem", type: "STR" },
  { key: "ESTIMATED_TIME", value: "시간", w: "4rem", type: "STR" },
  { key: "FLIGHT_NO", value: "편번", w: "4rem", type: "STR" },
  { key: "ORIGIN_CODE", value: "출발지", w: "3.5rem", type: "STR" },
  { key: "DESTINATION_CODE", value: "도착지", w: "3.5rem", type: "STR" },
];

export const FwbMapInHeader: TableHeaderType[] = [
  { key: "CREATED_TIME_DISP", value: "Map In Date", w: "8rem" },
  {
    key: "AIRLINE_PREFIX",
    value: "PREFIX",
    w: "3.5rem",
  },
  {
    key: "AWB_SERIAL_NUMBER",
    value: "NUMBER",
    w: "6.5rem",
  },
  {
    key: "USER_NAME",
    value: "USER",
    w: "5.5rem",
  },
  {
    key: "MASTER_AIR_WAY_BILL_SID",
    value: "SID",
    w: "6.5rem",
  },
];

export const FhlMapInHeader: TableHeaderType[] = [
  { key: "MM_CREATED_TIME_DISP", value: "Map In", w: "10rem" },
  { key: "HAWB_NO", value: "HAWB", w: "10rem" },
  { key: "MM_CREATED_USER_ID", value: "USER", w: "10rem" },
];

export const fhlGrid1Header: TableHeaderType[] = [
  { key: "HD_CREATED_TIME_DISP", value: "DateTime", w: "10rem" },
  { key: "MAWB_NO", value: "MAWB NO", w: "8rem", sum: 0 },
  { key: "HAWB_NO", value: "HAWB NO", w: "8rem" },
  { key: "HAWB_NO_OF_PIECES", value: "Pcs", w: "4rem", type: "NUM", sum: 0 },
  { key: "HAWB_WEIGHT", value: "Wgt", w: "5rem", type: "DOUBLE", sum: 1 },
  { key: "HAWB_MFST_DESC_GOODS", value: "Desc", w: "10rem" },
  { key: "MM_CREATED_USER_ID", value: "Creator", w: "5rem" },
  { key: "MM_UPDATED_USER_ID", value: "Updater", w: "5rem" },
  { key: "SCHEDULE_SID", value: "Schedule", w: "5rem" },
  { key: "EDI_GUID", value: "EDI_GUID", w: "10rem" },
  { key: "AUTO_SCHEDULE_SID", value: "AUTO_SCHEDULE_SID", w: "10rem" },
  { key: "AUTO_SCHEDULE_STR", value: "AUTO_SCHEDULE_STR", w: "10rem" },
];

export const fhlOciHeader: TableHeaderType[] = [
  {
    key: "COUNTRY_CODE",
    value: "Country Code",
    w: "20%",
    option: { type: "WRITE" },
    maxLength: 2,
  },
  {
    key: "INFORMATION_ID",
    value: "Info ID",
    w: "10%",
    option: { type: "WRITE" },
    maxLength: 3,
  },
  {
    key: "CUSTOMS_INFORMATION_ID",
    value: "Control ID",
    w: "10%",
    option: { type: "WRITE" },
    maxLength: 2,
  },
  {
    key: "SUP_CUSTOMS_INFO",
    value: "Control Info",
    w: "60%",
    option: { type: "WRITE" },
  },
];

export const fsuTimeHeader: TableHeaderType[] = [
  {
    key: "VALUE",
    value: "",
    w: "100%",
  },
];
