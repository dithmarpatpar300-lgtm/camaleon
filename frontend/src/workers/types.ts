export type TransmutationModule = "transmutador_jpg" | "transmutador_png";

export type WorkerRequest = {
  id: string;
  module: TransmutationModule;
  bytes: ArrayBuffer;
};

export type WorkerResponseSuccess = {
  id: string;
  ok: true;
  bytes: ArrayBuffer;
  mime: string;
  extension: string;
};

export type WorkerResponseError = {
  id: string;
  ok: false;
  error: string;
};

export type WorkerResponse = WorkerResponseSuccess | WorkerResponseError;
