import { sendErr } from "./Util/Util";

export type SignOptions = {
  yes?: (file: File) => void;
  no?: () => void;
};

type SignListener = (options: SignOptions | null) => void;

let signListener: SignListener | null = null;

export function setSignListener(fn: SignListener) {
  signListener = fn;
}

export function openSign(options: SignOptions) {
  if (!signListener) {
    sendErr("서명 서비스 문제 관리자에게 문의하세요.");
    return;
  }
  signListener(options);
}

export function closeSign() {
  if (!signListener) {
    sendErr("서명 서비스 문제 관리자에게 문의하세요.");
    return;
  }
  signListener(null);
}

export function signAsync(
  options: Omit<SignOptions, "yes" | "no">,
): Promise<File | null> {
  return new Promise<File | null>((resolve) => {
    openSign({
      ...options,
      yes: (file: File) => {
        resolve(file);
        closeSign();
      },
      no: () => {
        resolve(null);
        closeSign();
      },
    });
  });
}
