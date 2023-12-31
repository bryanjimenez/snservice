import fs from "fs";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/**
 * Request user permission for required files/access
 * @param useHTTPS
 * @param serviceIP LAN IP
 * @param localhost localhost or 127.0.0.1
 * @param JSON_DIR
 * @param CSV_DIR
 * @param AUDIO_DIR
 * @param httpPort
 * @param httpsPort
 */
export async function requestUserPermission(
  useHTTPS: boolean,
  serviceIP: string,
  localhost: string,
  CA_DIR: string,
  JSON_DIR: string,
  CSV_DIR: string,
  AUDIO_DIR: string,
  httpPort: number,
  httpsPort: number
) {
  const rl = readline.createInterface({ input, output });
  const writeJSONGranted = await rl.question(
    `Grant WRITE access? "${JSON_DIR}" [y/n]\t`
  );
  const writeCSVGranted = await rl.question(
    `Grant WRITE access? "${CSV_DIR}" [y/n]\t`
  );
  const writeAudioGranted = await rl.question(
    `Grant WRITE access? "${AUDIO_DIR}" [y/n]\t`
  );
  const writeKeyGranted = await rl.question(
    `Grant WRITE access? "${CA_DIR}" [y/n]\t`
  );
  const netGranted = await rl.question(
    `Grant HTTP access? "${localhost}:${httpPort}" [y/n]\t`
  );

  if (useHTTPS) {
    const httpsGranted = await rl.question(
      `Grant HTTPS access? "${serviceIP}:${httpsPort}" [y/n]\t`
    );
    isAllowed(httpsGranted, `${serviceIP}:${httpsPort}`, "Denied HTTPS access");
  }

  isAllowed(writeJSONGranted, JSON_DIR, "Denied WRITE access");
  isAllowed(writeCSVGranted, CSV_DIR, "Denied WRITE access");
  isAllowed(writeAudioGranted, AUDIO_DIR, "Denied WRITE access");
  isAllowed(writeKeyGranted, CA_DIR, "Denied WRITE access");
  isAllowed(netGranted, `${localhost}:${httpPort}`, "Denied HTTP access");

  if (!fs.existsSync(CSV_DIR)) {
    const createIt = await rl.question(
      `Create directory? "${CSV_DIR}" [y/n]\t`
    );
    if (isAllowed(createIt, "Missing required directory ", CSV_DIR)) {
      fs.mkdirSync(CSV_DIR, { recursive: true });
    }
  }
  if (!fs.existsSync(JSON_DIR)) {
    const createIt = await rl.question(
      `Create directory? "${JSON_DIR}" [y/n]\t`
    );
    if (isAllowed(createIt, "Missing required directory", JSON_DIR)) {
      fs.mkdirSync(JSON_DIR, { recursive: true });
    }
  }
if (!fs.existsSync(AUDIO_DIR)) {
    const createIt = await rl.question(
      `Create directory? "${AUDIO_DIR}" [y/n]\t`
    );
    if (isAllowed(createIt, "Missing required directory", AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }
  }
}

function isAllowed(response: string, path?: string, msg?: string) {
  const allowed = response?.toLowerCase() === "y";
  if (!allowed && path !== undefined && msg !== undefined) {
    throw new Error(`${msg} "${path}"`);
  }

  return allowed;
}
