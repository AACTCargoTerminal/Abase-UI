import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaCheckSquare, FaEye, FaEyeSlash } from "react-icons/fa";
import type { InputType, TableRow } from "../Util/Type";
import moment from "moment";
import { IoSearch } from "react-icons/io5";

export function PwdInput({
  id,
  value,
  onChange,
  holder = "",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  holder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [show, setShow] = useState(false);

  const toggle = () => setShow((v) => !v);

  return (
    <div
      className="
        w-full flex h-full items-center bg-white rounded-md
        border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 
      ">
      <input
        ref={inputRef}
        id={id}
        type={show ? "text" : "password"}
        placeholder={holder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="current-password"
        className="w-full h-full text-left px-3 py-1 focus:outline-none"
      />

      <div
        onClick={toggle}
        aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
        className="rounded-full iconSize cursor-pointer hover:bg-gray-200 p-1 mr-1">
        {show ? (
          <FaEyeSlash className="text-gray-500" />
        ) : (
          <FaEye className="text-gray-500" />
        )}
      </div>
    </div>
  );
}

export const CommonInput = React.memo(
  function CommonInput({
    check,
    id,
    label,
    holder,
    value,
    onChange,
    read = false,
    type = "text",
    backColor,
    align = "NONE",
    labelW,
    length,
    setClear,
    auto,
    searchBtn,
  }: {
    check?: boolean;
    id: string;
    label?: string;
    holder?: string;
    value: string;
    onChange?: (value: string) => void;
    read?: boolean;
    type?: string;
    backColor?: string;
    align?: "NONE" | "COL";
    labelW?: string;
    length?: number;
    setClear?: boolean;
    auto?: boolean;
    searchBtn?: { flag: boolean; click: (v: string) => void };
  }) {
    const [changeValue, setChangeValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (value === undefined) {
        setChangeValue("");
      } else {
        setChangeValue(value);
      }
    }, [value]);
    return (
      <div
        className={`flex w-full rounded-md ${
          align === "NONE"
            ? "items-center gap-2 h-full"
            : "flex-col gap-1 h-[3.6rem]"
        } `}
        style={
          {
            backgroundColor: backColor
              ? backColor
              : label
                ? "transparent"
                : "transparent",
          } as React.CSSProperties
        }>
        {label && (
          <div
            className={`flex gap-1 items-center ${
              align === "COL" ? "h-[35%] px-[1rem]" : "w-[var(--w-label)]"
            }`}
            style={{ "--w-label": labelW || "35%" } as React.CSSProperties}>
            <label
              htmlFor={id}
              className={`text-nowrap ${
                align === "COL" ? "text-gray-500" : "text-gray-800"
              }`}>
              {label}
            </label>
            {check && (
              <div className="h-full flex items-start">
                <span className={`text-red-500 text-nowrap font-bold`}>*</span>
              </div>
            )}
          </div>
        )}
        <div className="flex-1 h-full flex items-center gap-1">
          <input
            ref={inputRef}
            id={id}
            type={type}
            placeholder={holder}
            className={`peer w-full h-full flex items-center bg-[#FFFFFF] text-left rounded-md px-3 py-1 
                        ${
                          read
                            ? "border-2 border-gray-400 bg-gray-100 focus:outline-none"
                            : check &&
                                (changeValue === undefined ||
                                  changeValue.length === 0)
                              ? "border border-red-200 bg-red-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              : "border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }`}
            value={changeValue}
            onChange={(e) => setChangeValue(e.target.value)}
            onBlur={(e) => {
              onChange?.(e.target.value);
            }}
            readOnly={read}
            maxLength={length}
            onFocus={() => setClear && onChange?.("")}
            autoComplete={auto ? "on" : "off"}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // form submit 방지

                // 검색버튼이 있으면 실행
                if (searchBtn?.flag) {
                  searchBtn.click(changeValue);
                } else {
                  //onBlur처리
                  inputRef.current?.blur();
                }
              }
            }}
          />
          {searchBtn !== undefined && searchBtn.flag && (
            <div
              className="mainInput p-[1.5%] cursor-pointer rounded-md hover:bg-gray-300 "
              onClick={(e) => {
                e.stopPropagation();
                searchBtn.click(changeValue);
              }}>
              <IoSearch className="w-full h-full" />
            </div>
          )}
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.id === next.id &&
      prev.value === next.value &&
      prev.label === next.label &&
      prev.onChange === next.onChange
    );
  },
);

export const CommonChk = React.memo(
  function CommonChk({
    value,
    id,
    onChange,
    title,
    align = "NONE",
    bg,
    check,
    colSize,
  }: {
    id: string;
    title?: string;
    value: boolean;
    onChange: (v: boolean) => void;
    align?: "NONE" | "COL";
    bg?: string;
    check?: boolean;
    textColor?: string;
    colSize?: string;
  }) {
    const totalSize = useMemo<number>(
      () => parseInt(colSize || "0", 10),
      [colSize],
    );
    const labelW = useMemo(() => totalSize * 0.3, [totalSize]);
    const inputW = useMemo(() => totalSize * 0.7, [totalSize]);
    return (
      <div
        className={`flex items-center w-full rounded-md ${
          align === "NONE"
            ? title
              ? "items-center gap-3 h-full p-[0.15rem]"
              : "items-center gap-3 h-[2.3rem] p-[0.15rem]"
            : "flex-col gap-1 p-[0.2rem] pt-[0.3rem]"
        }`}
        style={{
          backgroundColor: bg ? bg : title ? "transparent" : "transparent",
        }}>
        {title && (
          <div
            className="flex gap-1 items-center justify-center w-[var(--labelW)]"
            style={
              {
                "--labelW": (colSize && labelW + "rem") || "",
              } as React.CSSProperties
            }>
            <label
              htmlFor={id}
              className="ml-[0.5rem] text-gray-700 text-nowrap">
              {title}
            </label>

            {check && (
              <div className="h-full flex items-start">
                <span className="text-red-500 font-bold">*</span>
              </div>
            )}
          </div>
        )}

        <div
          className="w-[var(--inputW)] flex items-center justify-center"
          style={
            {
              "--inputW": (colSize && inputW + "rem") || "",
            } as React.CSSProperties
          }>
          <div className="size-5">
            <input
              id={id}
              type="checkbox"
              className="h-full accent-gray-300 rounded-md size-4 text-center"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
            />
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return prev.id === next.id && prev.value === next.value;
  },
);
export const DateInput = React.memo(
  function DateInput({
    check,
    id,
    label,
    value,
    onChange,
    read = false,
    backColor,
    align = "NONE",
    labelW,
    setClear,
  }: {
    check?: boolean;
    id: string;
    label?: string;
    value: string;
    onChange?: (value: string) => void;
    read?: boolean;
    backColor?: string;
    align?: "NONE" | "COL";
    labelW?: string;
    setClear?: boolean;
  }) {
    const [changeValue, setChangeValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const nextCaretPosRef = useRef<number | null>(null);

    useEffect(() => {
      if (!value) {
        setChangeValue("");
      } else {
        const formatted = moment(value, "YYYYMMDD", true).isValid()
          ? moment(value, "YYYYMMDD").format("YYYY-MM-DD")
          : "";
        setChangeValue(formatted);
      }
    }, [value]);

    useEffect(() => {
      if (inputRef.current && nextCaretPosRef.current !== null) {
        const pos = nextCaretPosRef.current;
        inputRef.current.setSelectionRange(pos, pos);
        nextCaretPosRef.current = null;
      }
    }, [changeValue]);

    function fillDateFormat(raw: string) {
      const onlyNum = raw.replace(/[^0-9]/g, "").slice(0, 8);

      let result = "";
      for (let i = 0; i < onlyNum.length; i++) {
        if (i === 4 || i === 6) result += "-";
        result += onlyNum[i];
      }
      return result;
    }

    function changeData(e: React.ChangeEvent<HTMLInputElement>) {
      const input = e.target.value;
      const formatted = fillDateFormat(input);
      setChangeValue(formatted);
    }

    return (
      <div
        className={`flex w-full rounded-md ${
          align === "NONE"
            ? "items-center gap-2 h-full"
            : "flex-col gap-1 h-[3.6rem]"
        } `}
        style={
          {
            backgroundColor: backColor
              ? backColor
              : label
                ? "transparent"
                : "transparent",
          } as React.CSSProperties
        }>
        {label && (
          <div
            className={`flex gap-1 items-center ${
              align === "COL" ? "h-[35%] px-[1rem]" : "w-[var(--w-label)]"
            }`}
            style={{ "--w-label": labelW || "35%" } as React.CSSProperties}>
            <label
              htmlFor={id}
              className={`text-nowrap ${
                align === "COL" ? "text-gray-500" : "text-gray-800"
              }`}>
              {label}
            </label>
            {check && (
              <div className="h-full flex items-start">
                <span className="text-red-500 text-nowrap font-bold">*</span>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 h-full flex items-center gap-1">
          <input
            ref={inputRef}
            id={id}
            type="text"
            placeholder="YYYY-MM-DD"
            className={`peer w-full h-full flex items-center bg-[#FFFFFF] text-left rounded-md px-3 py-1 
              ${
                read
                  ? "border-2 border-gray-400 bg-gray-100 focus:outline-none"
                  : check &&
                      (changeValue === undefined || changeValue.length === 0)
                    ? "border border-red-200 bg-red-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    : "border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              }`}
            value={changeValue}
            onChange={changeData}
            onBlur={() => {
              if (!changeValue) {
                onChange?.("");
                return;
              }

              const m = moment(changeValue, "YYYY-MM-DD", true);
              if (!m.isValid()) {
                return;
              }

              setChangeValue(m.format("YYYY-MM-DD"));
              onChange?.(m.format("YYYYMMDD"));
            }}
            readOnly={read}
            maxLength={10}
            onFocus={() => {
              if (setClear) {
                setChangeValue("");
                onChange?.("");
              }
            }}
            autoComplete="off"
          />
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.id === next.id &&
      prev.value === next.value &&
      prev.label === next.label &&
      prev.onChange === next.onChange
    );
  },
);
export function TimeInput({
  type = "HH:mm",
  value,
  check,
  id,
  label,
  onChange,
  read = false,
  backColor,
  align = "NONE",
  labelW,
}: {
  type?: "HH:mm" | "HH:mm:ss";
  value: string;
  check?: boolean;
  id: string;
  label?: string;
  onChange?: (value: string) => void;
  read?: boolean;
  backColor?: string;
  align?: "NONE" | "COL";
  labelW?: string;
}) {
  const baseFormat = type.replace(/:/g, "");

  const [displayValue, setDisplayValue] = useState(
    value
      ? moment(value, baseFormat, true).format(type)
      : type === "HH:mm"
        ? "00:00"
        : "00:00:00",
  );

  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextCaretPosRef = useRef<number | null>(null);

  useEffect(() => {
    // 외부 value가 바뀌었을 때도 표시값 동기화
    if (!value) return;
    setDisplayValue(moment(value, baseFormat, true).format(type));
  }, [value, baseFormat, type]);

  useEffect(() => {
    // displayValue 변경 후에 커서 위치 복원
    if (inputRef.current && nextCaretPosRef.current !== null) {
      const pos = nextCaretPosRef.current;
      inputRef.current.setSelectionRange(pos, pos);
      nextCaretPosRef.current = null;
    }
  }, [displayValue]);

  const getTimeRegex = (type: "HH:mm" | "HH:mm:ss") => {
    if (type === "HH:mm:ss") {
      return /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    }

    return /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  };

  function changeData({
    e,
    type,
  }: {
    type: "HH:mm" | "HH:mm:ss";
    e: React.ChangeEvent<HTMLInputElement>;
  }) {
    const selectTmp = e.target.selectionStart;

    if (selectTmp === null) return;

    const safeValue =
      displayValue && displayValue.length > 0
        ? displayValue
        : type === "HH:mm"
          ? "00:00"
          : "00:00:00";

    const targetTmp = e.target.value;

    // 잘못된 입력일 경우 커서 복구용
    const restoreCaret = (pos: number) => {
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(pos, pos);
      });
    };

    if (targetTmp.length <= 1) {
      const digits = targetTmp.replace(/\D/g, "");

      if (digits.length === 0) {
        restoreCaret(0);
        return;
      }

      const maxLen = type === "HH:mm" ? 4 : 6;
      const padded = digits.padEnd(maxLen, "0").slice(0, maxLen);

      const changeValue =
        type === "HH:mm"
          ? `${padded.slice(0, 2)}:${padded.slice(2, 4)}`
          : `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;

      // 잘못된 시간값이면 값 변경 X + 커서 복구
      if (!getTimeRegex(type).test(changeValue)) {
        restoreCaret(0);
        return;
      }

      const m = moment(changeValue, type, true);

      if (!m.isValid()) {
        restoreCaret(0);
        return;
      }

      const formatted = m.format(type);

      let nextPos = selectTmp;

      if (type === "HH:mm") {
        if (nextPos === 2) nextPos = 3;
      } else {
        if (nextPos === 2) nextPos = 3;
        if (nextPos === 5) nextPos = 6;
      }

      nextCaretPosRef.current = nextPos;
      setDisplayValue(formatted);

      if (formatted === displayValue) {
        restoreCaret(nextPos);
      }

      return;
    }

    const insertTmp = targetTmp.slice(selectTmp - 1, selectTmp);
    const onlyNumber = /^[0-9]+$/;

    let changeValue = safeValue;
    let nextPos = selectTmp;

    if (displayValue.length > targetTmp.length) {
      // ========================
      // Backspace / Delete
      // ========================

      let replaceIndex = selectTmp;

      if (safeValue[replaceIndex] === ":") {
        replaceIndex = replaceIndex - 1;
      }

      if (replaceIndex < 0 || replaceIndex >= safeValue.length) {
        restoreCaret(selectTmp);
        return;
      }

      if (safeValue[replaceIndex] === ":") {
        restoreCaret(selectTmp);
        return;
      }

      changeValue =
        safeValue.slice(0, replaceIndex) +
        "0" +
        safeValue.slice(replaceIndex + 1);

      nextPos = replaceIndex;

      if (type === "HH:mm") {
        if (nextPos === 2) nextPos = 1;
      } else {
        if (nextPos === 2) nextPos = 1;
        if (nextPos === 5) nextPos = 4;
      }
    } else {
      // ========================
      // 숫자 입력
      // ========================

      // 입력 전 실제 커서 위치
      const originalPos = selectTmp - 1;

      if (!onlyNumber.test(insertTmp)) {
        restoreCaret(originalPos);
        return;
      }

      changeValue =
        safeValue.slice(0, originalPos) +
        insertTmp +
        safeValue.slice(originalPos + 1);

      // 여기서 먼저 시간값 검증
      if (!getTimeRegex(type).test(changeValue)) {
        restoreCaret(originalPos);
        return;
      }

      const m = moment(changeValue, type, true);

      if (!m.isValid()) {
        restoreCaret(originalPos);
        return;
      }

      // 정상적인 값일 때만 커서 다음칸으로 이동
      nextPos = selectTmp;

      if (type === "HH:mm") {
        if (nextPos === 2) nextPos = 3;
      } else {
        if (nextPos === 2) nextPos = 3;
        if (nextPos === 5) nextPos = 6;
      }
    }

    // 최종 시간 포맷 검사
    if (!getTimeRegex(type).test(changeValue)) {
      restoreCaret(selectTmp);
      return;
    }

    const m = moment(changeValue, type, true);

    if (!m.isValid()) {
      restoreCaret(selectTmp);
      return;
    }

    const formatted = m.format(type);

    nextCaretPosRef.current = nextPos;
    setDisplayValue(formatted);

    if (formatted === displayValue) {
      restoreCaret(nextPos);
    }
  }

  return (
    <div
      className={`flex w-full rounded-md ${
        align === "NONE"
          ? "items-center gap-2 h-full"
          : "flex-col gap-1 h-[3.6rem]"
      } `}
      style={
        {
          backgroundColor: backColor
            ? backColor
            : label
              ? "transparent"
              : "transparent",
        } as React.CSSProperties
      }>
      {label && (
        <div
          className={`flex gap-1 items-center ${
            align === "COL" ? "h-[35%] px-[1rem]" : "w-[var(--w-label)]"
          }`}
          style={{ "--w-label": labelW || "35%" } as React.CSSProperties}>
          <label
            htmlFor={id}
            className={`text-nowrap ${
              align === "COL" ? "text-gray-500" : "text-gray-800"
            }`}>
            {label}
          </label>
          {check && (
            <div className="h-full flex items-start">
              <span className={`text-red-500 text-nowrap font-bold`}>*</span>
            </div>
          )}
        </div>
      )}
      <div className="flex-1 h-full">
        <input
          id={id}
          ref={inputRef}
          type={"text"}
          className={`peer w-full h-full items-center bg-[#FFFFFF] text-center rounded-md px-3 py-1 
            ${
              read
                ? "border-2 border-gray-400 bg-gray-100 focus:outline-none"
                : check && value.length === 0
                  ? "border border-red-200 bg-red-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            }`}
          value={displayValue}
          onChange={(e) => {
            changeData({ type: type, e: e });
          }}
          onBlur={() => {
            const m = moment(displayValue, type, true);
            if (!m.isValid()) {
              return;
            }
            onChange?.(m.format(baseFormat));
          }}
          readOnly={read}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const m = moment(displayValue, type, true);

              if (!m.isValid()) {
                return;
              }
              onChange?.(m.format(baseFormat));
            }
          }}
          onFocus={() => {
            requestAnimationFrame(() => {
              inputRef.current?.setSelectionRange(0, 0);
            });
          }}
        />
      </div>
    </div>
  );
}

export const CommonLabel = React.memo(
  function CommonLabel({
    id,
    align = "NONE",
    check,
    label,
    justify = "CENTER",
    labelW,
  }: {
    check?: boolean;
    id: string;
    label?: string;
    align?: "NONE" | "COL";
    justify?: "CENTER" | "START";
    labelW?: string;
  }) {
    return (
      <div
        className={`flex gap-1 ${
          justify === "CENTER" ? "justify-center" : "justify-start"
        }  rounded-md ${
          align === "NONE" ? "items-center gap-2 h-full" : "flex-col gap-1 "
        }`}>
        <label
          htmlFor={id}
          className={`text-nowrap font-bold ${
            align === "COL" ? "text-gray-500 px-[1rem]" : "text-gray-800"
          }`}>
          {label}
        </label>
        {check && (
          <div className="h-full flex items-start">
            <span className={`text-red-500 text-nowrap font-bold`}>*</span>
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    return prev.id === next.id && prev.label === next.label;
  },
);
