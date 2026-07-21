import { fetchRawFile } from "../github.js";

const HEADER_PATH = "src/PrismaUI_F4_API.h";

export async function getHeader(): Promise<string> {
  return fetchRawFile(HEADER_PATH);
}
