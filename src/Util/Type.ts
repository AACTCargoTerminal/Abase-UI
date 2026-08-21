export interface DefComp {
  sch: UserSchType;
  param: TableRow | null;
  outParam: (r: TableRow) => void;
  pgmId: string;
  //fun
}

export interface DefInfraComp {
  deviceType: DeviceType;
  param: TableRow | null;
  outParam: (r: TableRow) => void;
  pgmId: string;
}

export type PageHandle = {
  onModalPayload: (payload: TableRow) => void;
};

export interface ModalComp {
  param: TableRow;
  pgmId: string;
  headerAction?: {
    type: string;
    pageIndex?: number;
  } | null;
  onClose: () => void;
  sendParam?: (r: TableRow) => void;
  outParam?: (r: TableRow) => void;
  closeParam?: (r: TableRow) => void;
  //fun
}

export interface MenuBtnType {
  data: MenuBtnDataType[];
  txt: string;
  type: BtnFunType;
  onClick?: (v: string) => void;
}
export interface MenuBtnDataType {
  KEY: string;
  VALUE: string;
}

export type ApiEnvelope<T = unknown> = {
  errFlag: string; // "Y" | "N" 해도 됨
  errMsg: string;
  data: T;
};

export type Res<T = unknown> = { ok: boolean; data: T | null };

export interface Error {
  id: string;
  errFlag: string;
  errMsg: string;
  visible: boolean;
  time?: string;
}

export type ErrorState = { queue: Error[]; rd: boolean; orgQue: Error[] };

export type UserState = {
  userInfo?: UserInfoType | null;
  menu: Array<any>;
  serverFlag: boolean;
  route: RouteType | null;
  routeArray: RouteType[];
  sch: UserSchType;
  loading: boolean;
  modalRoute: ModalRouteType;
  authCheck: boolean;
};

export type UserSchType = { schSid: number; fltDate: string; inout: string };

export type ErrorToastProps = {
  id: string;
  errFlag: string;
  errMsg: string;
  visible: boolean;
  deviceType: DeviceType;
};

export type JweMainType = {
  keys: JweSubType[];
};

export type JweSubType = {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
};

export type SchMainType = {
  SCHEDULE_SID: number;
  SCHEDULE_STATUS_CODE: string;
  HOLD_REPORTED_TIME: string;
  HOLD_REPORTED_USER_ID: string;
  ACTUAL_TIME: string;
  FLIGHT_NO: string;
  AIRPORT_CODE: string;
  SCHEDULE_STATUS_NAME: string;
  CARGO_CONTROL_COUNT: number;
  OPERATION_ULD_COUNT: number;
  PROCESS_RATIO: number;
};

export type RouteType = {
  ARGUMENT?: string;
  CHILD_MENU_SID?: number;
  MENU_ID?: string;
  MENU_NAME?: string;
  PARENT_MENU_SID?: number;
  PROGRAM_EXTENSION?: string;
  PROGRAM_FILE_NAME?: string;
  PROGRAM_ID: string;
  PROGRAM_PATH?: string;
  PROGRAM_NAME: string;
  PROGRAM_TYPE_CODE?: string;
  param: TableRow | null;
};

export type ModalRouteType = {
  flag: boolean;
  modalRoute?: RouteType[];
};

export type CalendarType = {
  date: string; //YYYYMMDD
  changeDate: (value: string) => void;
  type?: "DAY" | "MONTH";
};

export type ToggleType = {
  key: string;
  value: string;
};

export type ToggleBtnType = {
  array: ToggleType[];
  onClick: (value: string) => void;
  idx?: number;
};

export type DayType = { day: number; type: number; visible: boolean };

export type MonType = "DAY" | "MONTH" | "YEAR";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  title?: string;
  children?: React.ReactNode;
  childrenTitle?: { [key: number]: React.ReactElement<BtnType>[] };
  selectNod?: number;
  setSelectNod?: (value: number) => void;
  backColor?: string;
  deviceType?: DeviceType;
};

type BaseHeader = {
  value: string;
  w: string;
  sum?: number;
  type?: TableObjType;
  read?: boolean;
  disable?: boolean;
  maxLength?: number;
  onClickChk?: boolean;
};

export type TableHeaderType =
  | (BaseHeader & {
      key: "BTN";
      option: TableBodyOptType;
    })
  | (BaseHeader & {
      key: "CHK" | "DROP";
      option?: TableBodyOptType;
    })
  | (BaseHeader & {
      key: string;
      option?: TableBodyOptType;
    });
export type TableObjType = "NUM" | "DOUBLE" | "STR";

export type TableBodyOptType =
  | { type: "NONE" }
  | { type: "CHK" }
  | { type: "WRITE"; ext?: number }
  | { type: "ICON"; icon: IconNameType; value: string; color: string }
  | { type: "BTN"; set: BtnType }
  | {
      type: "DROPDOWN";
      header: TableHeaderType[];
      body: TableRow[];
      inputKey: { key: string; showKey: string };
      find?: boolean;
    };

export type IconNameType = "PIN";

export type TableRow = Record<string, any>;

// export type TableRow = {
//   cell: TableCell;
//   bg?: string;
// };

// export type TableCell = Record<string, Cell>;

// export type Cell = {
//   value: any;
//   bg?: string;
// };

export type PairType = { key: string; value: string };

export type TableSortType = "DESC" | "ASC";

export type TableType = {
  tableId: string;
  header: TableHeaderType[];
  body: TableRow[];
  onClick: (value: TableRow) => void;
  doubleClick?: (value: TableRow) => void;
  height: string;
  fixCount?: number;
  width: string;
  children?: (args: { idx: number }) => React.ReactNode;
  changeValue?: (
    idx: number,
    key: string,
    value: any,
    refresh?: boolean,
  ) => void;
  onRowPrepared?: (row: TableRow, index: number) => RowPrepType;
  onCustumizeText?: (k: string, v: any) => string;
  childClick?: (index: number[]) => void;
  inChange?: Record<number, { key: string; value: any }>;
  rightMenu?: PairType[];
  rightClick?: (key: string, r?: TableRow) => void;
  refreshFlag?: boolean;
};

export type TableType2 = {
  header: TableHeaderType[];
  body: TableRow[];
  batch?: boolean;
  height: string;
  width: string;
  fixCount?: number;
  childClick?: (index: number[]) => void;
  onRowPrepared?: (row: TableRow, index: number) => RowPrepType;
  onCustumizeText?: (k: string, v: any) => string;
  changeValue?: (idx: number, key: string, value: any) => void;
  rightMenu?: PairType[];
  rightClick?: (key: string, r?: TableRow) => void;
  onClick?: (row: TableRow) => Promise<boolean>;
  filterFlag?: string;
  doubleClick?: (value: TableRow) => void;
};

export type TableHandle = {
  update: () => Record<number, TableRow>;
  cancle: () => void;
  add: () => void;
  getChk: () => Record<number, TableRow>;
  bgClear: () => void;
};

export type RowPrepType = {
  cells?: Record<string, string>;
  lines?: string;
};

export type BtnFunType =
  | "SAVE"
  | "DELETE"
  | "PRINT"
  | "SEARCH"
  | "CLOSE"
  | "NONE"
  | "EXCEL";

export type BtnType = {
  txt: string;
  onClick?: (r?: string) => void;
  width?: string;
  type: BtnFunType;
  tooltip?: string;
  actionType?: "PAGE" | "MODAL" | "ALL";
  deviceType?: DeviceType;
};

export type DeviceType = "PC" | "MOBILE";

export type UserInfoType = {
  userSid: number;
  userId: string;
  userName: string;
  userNameDefault: string;
  userCompanyName: string;
  userBranchName: string;
  userDepartName: string;
  userDepart: string;
  userBranch: string;
  userCompany: string;
  userLang: string;
  userEmail: string;
  userPhone: string;
  userMobile: string;
  userFax: string;
  userTerminalCodeWork: string;
  userTerminalNameWork: string;
  signData: any;
  signType: string;
  relArray: TableRow[];
};

export type CookieOptions = {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
};

export type InputType = {
  labelW: string;
  inputW: string;
};

export type ConfirmType = {
  flag: boolean;
  title: string;
  yes?: () => void;
  no?: () => void;
};

export type Fwb16Type = {
  mawbInput?: string;
  mapInFwb?: string;
  AWB_NO?: string;
  CONSOL_FLAG?: string;
  FLIGHT_NUMBER?: string;
  FLT_FLIGHT_DAY?: string;
  FLT_FLIGHT_DAY_ONLY?: string;
  ORIGIN_CODE?: string;
  DESTINATION_CODE?: string;
  RTG_FIRST_DESTINATION?: string;
  RTG_FIRST_CARRIER_CODE?: string;
  RTG_ONWARD_DESTINATION1?: string;
  RTG_ONWARD_CARRIER1_CODE?: string;
  RTG_ONWARD_DESTINATION2?: string;
  RTG_ONWARD_CARRIER2_CODE?: string;
  SPECIAL_HANDLING_CODE?: string;
  SPECIAL_HANDLING_CODE2?: string;
  SPECIAL_HANDLING_CODE3?: string;
  SPECIAL_HANDLING_CODE4?: string;
  SPECIAL_HANDLING_CODE5?: string;
  SPECIAL_HANDLING_CODE6?: string;
  DANGEROUS_CARGO_FLAG?: string;
  ISU_AWB_ISSUE_DATE?: string;
  ISU_AWB_ISSUE_PLACE_CODE?: string;
  //SHP
  SHP_COMPANY_NAME1?: string;
  SHP_STREET_ADDRESS1?: string;
  SHP_PLACE_NAME?: string;
  SHP_COUNTRY_CODE?: string;
  SHP_POST_CODE?: string;
  SHP_STATE_PROVINCE_NAME?: string;
  SHP_PHONE_NO?: string;
  //CNE
  CNE_COMPANY_NAME1?: string;
  CNE_STREET_ADDRESS1?: string;
  CNE_PLACE_NAME?: string;
  CNE_COUNTRY_CODE?: string;
  CNE_POST_CODE?: string;
  CNE_STATE_PROVINCE_NAME?: string;
  CNE_PHONE_NO?: string;
  //AGT
  AGT_IATA_CODE?: string;
  AGT_CASS_ADDRESS?: string;
  AGT_COMPANY_NAME?: string;
  AGT_ACCOUNT_NO?: string;
  AGT_PLACE_NAME?: string;
  //NFY
  NFY_COMPANY_NAME1?: string;
  NFY_STREET_ADDRESS1?: string;
  NFY_PLACE_NAME?: string;
  NFY_COUNTRY_CODE?: string;
  NFY_STATE_PROVINCE_NAME?: string;
  NFY_POST_CODE?: string;
  NFY_PHONE_NO?: string;
  //CVD
  CVD_CURRENCY_CODE?: string;
  CVD_DECLARED_CARRIAGE?: string;
  CVD_PC_IND_WEIGHT?: string;
  CVD_DECLARED_CUSTOMS?: string;
  CVD_PC_IND_OTHER?: string;
  CVD_DECLARED_INSURANCE?: string;
  //OSI
  OSI_OTHER_INFORMATION1?: string;
  OSI_OTHER_INFORMATION2?: string;
  OSI_OTHER_INFORMATION3?: string;
  //REF
  REF_SENDER_AIRPORT?: string;
  REF_SENDER_FUNCTION?: string;
  REF_SENDER_COMPANY?: string;
  REF_FILE_REFERENCE?: string;
  REF_PARTICIPANT_AIRPORT?: string;
  REF_PARTICIPANT_ID?: string;
  REF_PARTICIPANT_CODE?: string;
  //RTD Rate Info
  GOODS_DESCRIPTION?: string;
  NO_OF_PIECES?: number;
  WEIGHT?: number;
  RATE_CLASS_CODE?: string;
  CHARGEABLE_WEIGHT_DETAILS?: number;
  RATE_CHARGE_DETAILS?: number;
  TOTAL_DETAILS?: number;
  //PPD
  PPD_WEIGHT_CHARGE?: number;
  PPD_VALUATION_CHARGE?: number;
  PPD_TAXES?: number;
  PPD_OTHER_CHARGE_AGENT?: number;
  PPD_OTHER_CHARGE_CARRIER?: number;
  PPD_TOTAL_CHARGE_SUMMARY?: number;
  //CONSOLE
  CONSOLIDATION?: string;
  CONSOLIDATION_1?: string;
  CONSOLIDATION_2?: string;
  CONSOLIDATION_3?: string;
  CONSOLIDATION_4?: string;
  CONSOLIDATION_5?: string;
  CONSOLIDATION_6?: string;
  CONSOLIDATION_7?: string;
  CONSOLIDATION_8?: string;
  CONSOLIDATION_9?: string;
  CONSOLIDATION_10?: string;
  //RTD Rate Description
  DIM_LENGTH?: number;
  DIM_WIDTH?: number;
  DIM_HEIGHT?: number;
  DIM_NO_OF_PACKAGE?: number;
  VOLUME_CODE?: string;
  VOLUME_AMOUNT?: string;
  HARMONISED_COMMODITY_CODE?: string;
  HARMONISED_COMMODITY_CODE2?: string;
  HARMONISED_COMMODITY_CODE3?: string;
  HARMONISED_COMMODITY_CODE4?: string;
  HARMONISED_COMMODITY_CODE5?: string;
  COUNTRY_OF_ORIGIN_GOODS?: string;
  //OTH
  //A
  OTH_PC_IND_OTHER_A?: string;
  OTH_OTHER_CHARGE_CODE_A1?: string;
  OTH_ENTITLEMENT_CODE_A1?: string;
  OTH_CHARGE_AMOUNT_A1?: string;
  OTH_OTHER_CHARGE_CODE_A2?: string;
  OTH_ENTITLEMENT_CODE_A2?: string;
  OTH_CHARGE_AMOUNT_A2?: string;
  OTH_OTHER_CHARGE_CODE_A3?: string;
  OTH_ENTITLEMENT_CODE_A3?: string;
  OTH_CHARGE_AMOUNT_A3?: string;
  //B
  OTH_PC_IND_OTHER_B?: string;
  OTH_OTHER_CHARGE_CODE_B1?: string;
  OTH_ENTITLEMENT_CODE_B1?: string;
  OTH_CHARGE_AMOUNT_B1?: string;
  OTH_OTHER_CHARGE_CODE_B2?: string;
  OTH_ENTITLEMENT_CODE_B2?: string;
  OTH_CHARGE_AMOUNT_B2?: string;
  OTH_OTHER_CHARGE_CODE_B3?: string;
  OTH_ENTITLEMENT_CODE_B3?: string;
  OTH_CHARGE_AMOUNT_B3?: string;
  //C
  OTH_PC_IND_OTHER_C?: string;
  OTH_OTHER_CHARGE_CODE_C1?: string;
  OTH_ENTITLEMENT_CODE_C1?: string;
  OTH_CHARGE_AMOUNT_C1?: string;
  OTH_OTHER_CHARGE_CODE_C2?: string;
  OTH_ENTITLEMENT_CODE_C2?: string;
  OTH_CHARGE_AMOUNT_C2?: string;
  OTH_OTHER_CHARGE_CODE_C3?: string;
  OTH_ENTITLEMENT_CODE_C3?: string;
  OTH_CHARGE_AMOUNT_C3?: string;
  //D
  OTH_PC_IND_OTHER_D?: string;
  OTH_OTHER_CHARGE_CODE_D1?: string;
  OTH_ENTITLEMENT_CODE_D1?: string;
  OTH_CHARGE_AMOUNT_D1?: string;
  OTH_OTHER_CHARGE_CODE_D2?: string;
  OTH_ENTITLEMENT_CODE_D2?: string;
  OTH_CHARGE_AMOUNT_D2?: string;
  OTH_OTHER_CHARGE_CODE_D3?: string;
  OTH_ENTITLEMENT_CODE_D3?: string;
  OTH_CHARGE_AMOUNT_D3?: string;
  //E
  OTH_PC_IND_OTHER_E?: string;
  OTH_OTHER_CHARGE_CODE_E1?: string;
  OTH_ENTITLEMENT_CODE_E1?: string;
  OTH_CHARGE_AMOUNT_E1?: string;
  OTH_OTHER_CHARGE_CODE_E2?: string;
  OTH_ENTITLEMENT_CODE_E2?: string;
  OTH_CHARGE_AMOUNT_E2?: string;
  OTH_OTHER_CHARGE_CODE_E3?: string;
  OTH_ENTITLEMENT_CODE_E3?: string;
  OTH_CHARGE_AMOUNT_E3?: string;
  //F
  OTH_PC_IND_OTHER_F?: string;
  OTH_OTHER_CHARGE_CODE_F1?: string;
  OTH_ENTITLEMENT_CODE_F1?: string;
  OTH_CHARGE_AMOUNT_F1?: string;
  OTH_OTHER_CHARGE_CODE_F2?: string;
  OTH_ENTITLEMENT_CODE_F2?: string;
  OTH_CHARGE_AMOUNT_F2?: string;
  OTH_OTHER_CHARGE_CODE_F3?: string;
  OTH_ENTITLEMENT_CODE_F3?: string;
  OTH_CHARGE_AMOUNT_F3?: string;

  //OCI
  //1
  COUNTRY_CODE_1?: string;
  INFORMATION_IDENTIFIER_1?: string;
  CONTROL_IDENTIFIER_1?: string;
  CONTROL_INFORMATION_1?: string;
  //2
  COUNTRY_CODE_2?: string;
  INFORMATION_IDENTIFIER_2?: string;
  CONTROL_IDENTIFIER_2?: string;
  CONTROL_INFORMATION_2?: string;
  //3
  COUNTRY_CODE_3?: string;
  INFORMATION_IDENTIFIER_3?: string;
  CONTROL_IDENTIFIER_3?: string;
  CONTROL_INFORMATION_3?: string;
  //4
  COUNTRY_CODE_4?: string;
  INFORMATION_IDENTIFIER_4?: string;
  CONTROL_IDENTIFIER_4?: string;
  CONTROL_INFORMATION_4?: string;
  //5
  COUNTRY_CODE_5?: string;
  INFORMATION_IDENTIFIER_5?: string;
  CONTROL_IDENTIFIER_5?: string;
  CONTROL_INFORMATION_5?: string;
  //6
  COUNTRY_CODE_6?: string;
  INFORMATION_IDENTIFIER_6?: string;
  CONTROL_IDENTIFIER_6?: string;
  CONTROL_INFORMATION_6?: string;
  //7
  COUNTRY_CODE_7?: string;
  INFORMATION_IDENTIFIER_7?: string;
  CONTROL_IDENTIFIER_7?: string;
  CONTROL_INFORMATION_7?: string;
  //8
  COUNTRY_CODE_8?: string;
  INFORMATION_IDENTIFIER_8?: string;
  CONTROL_IDENTIFIER_8?: string;
  CONTROL_INFORMATION_8?: string;
  //9
  COUNTRY_CODE_9?: string;
  INFORMATION_IDENTIFIER_9?: string;
  CONTROL_IDENTIFIER_9?: string;
  CONTROL_INFORMATION_9?: string;
  //10
  COUNTRY_CODE_10?: string;
  INFORMATION_IDENTIFIER_10?: string;
  CONTROL_IDENTIFIER_10?: string;
  CONTROL_INFORMATION_10?: string;
  //11
  COUNTRY_CODE_11?: string;
  INFORMATION_IDENTIFIER_11?: string;
  CONTROL_IDENTIFIER_11?: string;
  CONTROL_INFORMATION_11?: string;
  //12
  COUNTRY_CODE_12?: string;
  INFORMATION_IDENTIFIER_12?: string;
  CONTROL_IDENTIFIER_12?: string;
  CONTROL_INFORMATION_12?: string;

  //ex
  MASTER_AIR_WAY_BILL_SID?: number;
  SCHEDULE_SID?: number;
  FWB_CREATED_TIME?: string;
  FWB_CREATOR?: string;
  SCH_FLIGHT_DATE?: string;
  SCH_FLIGHT_NO?: string;
  SCH_INOUT_FLAG?: string;
  SCH_ORIGIN_CODE?: string;
  SCH_DESTINATION_CODE?: string;
  AUTO_SCHEDULE_SID?: number;
  AUTO_SCHEDULE_STR?: string;
  PROGRESS_GUID?: string;
  CARRIER_PREFIX?: string;
  AWB_PREFIX?: string;
};

export type FhlType = {
  //MAWB
  MAWB_NO?: string;
  MBI_ORG_AIRPORT_CODE?: string;
  MBI_DEST_AIRPORT_CODE?: string;
  MBI_NO_OF_PIECES?: number;
  MBI_WEIGHT?: number;
  //HAWB
  HAWB_NO?: string;
  HBS_NO_OF_PIECES?: number;
  HBS_WEIGHT?: number;
  HBS_MFST_DESC_GOODS?: string;
  //SHP
  SHP_NAME?: string;
  SHP_ADDR?: string;
  SHP_PLACE?: string;
  SHP_STATE?: string;
  SHP_COUNTRY_CODE?: string;
  SHP_POST_CODE?: string;
  SHP_CONTACT_NO?: string;
  //CNE
  CNE_NAME?: string;
  CNE_ADDR?: string;
  CNE_PLACE?: string;
  CNE_STATE?: string;
  CNE_COUNTRY_CODE?: string;
  CNE_POST_CODE?: string;
  CNE_CONTACT_NO?: string;
  //CVD
  CVD_CURRENCY_CODE?: string;
  CVD_PC_WGT_VAL?: string;
  CVD_PC_OTH_CHG?: string;
  CVD_CARRIAGE_VALUE?: string;
  CVD_CUSTOMS_VALUE?: string;
  CVD_INSURANCE_VALUE?: string;
  //free text
  FREE_TEXT_1?: string;
  FREE_TEXT_2?: string;
  FREE_TEXT_3?: string;
  FREE_TEXT_4?: string;
  FREE_TEXT_5?: string;
  FREE_TEXT_6?: string;
  FREE_TEXT_7?: string;
  FREE_TEXT_8?: string;
  FREE_TEXT_9?: string;
  //HSCODE
  HS_CODE_1?: string;
  HS_CODE_2?: string;
  HS_CODE_3?: string;
  HS_CODE_4?: string;
  HS_CODE_5?: string;
  HS_CODE_6?: string;
  HS_CODE_7?: string;
  HS_CODE_8?: string;
  HS_CODE_9?: string;
  //hd
  HD_EDI_GUID?: string;
  EDI_IO_GUID?: string;
  HD_ROW_SEQ_NO?: number;
  HD_CREATED_TIME?: string;
  HD_SCHEDULE_SID?: number;
  FLIGHT_DATE?: string;
  FLIGHT_NO?: string;
  INOUT_FLAG?: string;
  ORIGIN_CODE?: string;
  DESTINATION_CODE?: string;
  AUTO_SCHEDULE_SID?: number;
  AUTO_SCHEDULE_STR?: string;
};
