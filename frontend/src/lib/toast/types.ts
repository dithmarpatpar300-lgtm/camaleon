export type ToastVariant = "success" | "info";

export type ToastRecord = {
  id: number;
  message: string;
  variant: ToastVariant;
  /** True while playing the exit animation before removal. */
  exiting: boolean;
};

export type ToastInput = {
  message: string;
  variant?: ToastVariant;
};
