import express from "express";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { getData } from "./data.js";
import { getWorkbook, putWorkbookAsync } from "./workbook.js";
import { getAudioAsync } from "./audio.js";
import { lan } from "../utils/environment-host.js";
import { ca } from "../utils/environment-signed-ca.js";
import { requestUserPermission } from "./helper/userPermission.js";
// import { getPublicKey, pushSheetDataAsync, registerClient } from "./push.js";
import { checkAllOrigin, custom404, customError } from "./helper/utils.js";
import { getCA } from "./appUi.js";
import { blue, red, yellow } from "../utils/consoleColor.js";

const projectRoot = path.resolve();

const configPath = "/snservice.conf.json";
if (!fs.existsSync(projectRoot + configPath)) {
  console.log(projectRoot);
  throw new Error("Missing config file " + projectRoot);
}
export const config = JSON.parse(
  fs.readFileSync(projectRoot + configPath, { encoding: "utf-8" })
) as ServiceConfiguration;

const uiPort = config.port.ui;
const httpPort = Number(config.port.http);
export const httpsPort = Number(config.port.https);
const audioPath = config.servicePath.audio;
export const dataPath = config.servicePath.data;
const sheetPath = config.servicePath.sheet;
const productionOrigin = config.uiOrigin;
// const pathPushGetPubKey = config.servicePath.pushGetPubKey;
// const pathPushRegister = config.servicePath.pushRegister;
// const pushSheetData = config.servicePath.pushSheetData;

export const CSV_DIR = path.normalize(`${projectRoot}${config.directory.csv}`);
export const JSON_DIR = path.normalize(
  `${projectRoot}${config.directory.json}`
);
export const AUDIO_DIR = path.normalize(`${projectRoot}${config.directory.audio}`)
export const CA_DIR = `${projectRoot}${config.directory.ca}`;
export const subscriptionFile = path.normalize(
  `${JSON_DIR}/subscriptions.json`
);

if (
  !(
    (uiPort && httpsPort && audioPath && dataPath && sheetPath)
    // pathPushGetPubKey &&
    // pathPushRegister &&
    // pushSheetData
  )
) {
  throw new Error("Invalid property in config file");
}
if (CA_DIR === undefined) {
  throw new Error("Missing CA directory path");
}

if (!lan.address) {
  throw new Error("Could not get host IP");
}

const localhost = lan.address; // or "localhost"
export const serviceIP = lan.address; // or lan.hostname

export const allowedOrigins = [
  `https://localhost:${uiPort}`,
  `https://127.0.0.1:${uiPort}`,
  `https://${serviceIP}:${uiPort}`,
  `https://${lan.hostname}:${uiPort}`,
  productionOrigin,
];

export default async function askPermissions() {
  await requestUserPermission(
    ca.exists(),
    serviceIP,
    localhost,
    CA_DIR,
    JSON_DIR,
    CSV_DIR,
    AUDIO_DIR,
    httpPort,
    httpsPort
  );

  const app = express();

  app.disable("x-powered-by");
  app.use(express.json()); // for parsing application/json
  // app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

  // check origin from all requests
  app.use(checkAllOrigin(ca.exists()));

  // app.get("/", getUi)
  // app.get("/:resource.:ext", getAsset)
  app.get("/getCA", getCA);

  app.get(audioPath, getAudioAsync);

  // JSON
  app.get(dataPath + "/:data.json", getData);

  // SHEETS
  app.get(sheetPath, getWorkbook);
  app.put(sheetPath, putWorkbookAsync);

  // PUSH
  // app.get(pathPushGetPubKey, getPublicKey);
  // app.post(pathPushRegister, registerClient);
  // app.post(pushSheetData, pushSheetDataAsync);

  app.use(custom404);
  app.use(customError);

  const httpSever = http.createServer(app);
  httpSever.listen(httpPort, localhost, 0, () => {
    console.log("\n");
    console.log("workbook http service");
    console.log(red("http://") + localhost + red(":" + httpPort) + "\n\n");
  });

  void ca.get()
    .catch(() => {
      console.log(yellow("\nCreating Certificate Authority"));
      return ca.create();
    })
    .then(({ end }) => {
      const credentials = {
        key: end.key,
        cert: end.crt,
      };

      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(httpsPort, serviceIP, 0, () => {
        console.log("\n");
        console.log("workbook https service");
        console.log(
          blue("https://") + serviceIP + blue(":" + httpsPort) + "\n\n"
        );
      });
    });
}
