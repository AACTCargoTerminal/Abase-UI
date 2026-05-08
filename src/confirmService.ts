export type ConfirmOptions = {
  title: string;
  message?: string;
  yes?: () => void;
  no?: () => void;
};

let pendingResolve: ((result: boolean) => void) | null = null;

type Listener = (options: ConfirmOptions | null) => void;

let listener: Listener | null = null;

export function setConfirmListener(fn: Listener) {
  listener = fn;
}

// 어디서든 이 함수만 import해서 사용
export function openConfirm(options: ConfirmOptions) {
  if (!listener) {
    console.warn("Confirm listener is not registered yet.");
    return;
  }
  listener(options);
}

export function closeConfirm() {
  pendingResolve = null;
  if (!listener) {
    console.warn("Confirm listener is not registered yet.");
    return;
  }

  listener(null);
}

export function confirmAsync(
  options: Omit<ConfirmOptions, "yes" | "no">
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    pendingResolve = resolve;

    // 여기서 yes/no를 우리가 감싸서 넣어줌
    openConfirm({
      ...options,
      yes: () => {
        // 확인 클릭
        resolve(true);
        closeConfirm();
      },
      no: () => {
        // 취소 클릭
        resolve(false);
        closeConfirm();
      },
    });
  });
}
