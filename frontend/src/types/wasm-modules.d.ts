declare module "*/transmutador_jpg/transmutador_jpg.js" {
  export function transmutar_jpg_a_png(input_bytes: Uint8Array): Uint8Array;
  export default function init(): Promise<void>;
}
