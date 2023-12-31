import express from "express";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { getData } from "./routes/data.js";
import { getWorkbook, putWorkbookAsync } from "./routes/workbook.js";
import { getAudioAsync } from "./routes/audio.js";
import { lan } from "../utils/host.js";
import { ca } from "../utils/signed-ca.js";
import { requestUserPermission } from "./helper/userPermission.js";
// import { getPublicKey, pushSheetDataAsync, registerClient } from "./push.js";
import {
  checkAllOrigin,
  custom404,
  customError,
} from "./helper/utilHandlers.js";
import { getCA } from "./routes/certificate.js";
import { blue, green, red, yellow } from "../utils/consoleColor.js";
import { config } from "../utils/config.js";
import swaggerUI from "swagger-ui-express";

const projectRoot = path.resolve();

const uiPort = config.port.ui;
const httpPort = config.port.http;
export const httpsPort = config.port.https;
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
export const AUDIO_DIR = path.normalize(
  `${projectRoot}${config.directory.audio}`
);
export const CA_DIR = `${projectRoot}${config.directory.ca}`;
export const subscriptionFile = path.normalize(
  `${JSON_DIR}/subscriptions.json`
);

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
  `https://${serviceIP}:${httpsPort}`,
  `https://${lan.hostname}:${httpsPort}`,
  productionOrigin,
];

interface ServiceOptions {
  swaggerSpec?: swaggerUI.JsonObject;
}

export default async function askPermissions(serviceOptions?: ServiceOptions) {
  const { swaggerSpec } = serviceOptions ?? {};

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

  if (swaggerSpec) {
    console.log(
      `\n${green(
        "Swagger"
      )} api docs: https://${serviceIP}:${httpsPort}/api-docs`
    );
    swaggerSpec.servers = [
      {
        url: `https://${serviceIP}:{port}`,
        description: "https",
        variables: {
          port: {
            enum: [httpsPort, httpPort],
            default: httpsPort,
          },
        },
      },
    ];
    app.use(
      "/api-docs",
      swaggerUI.serve,
      swaggerUI.setup(swaggerSpec, {
        // prevent 'try it out' on anything but GET
        swaggerOptions: { supportedSubmitMethods: ["get"] },
      })
    );
  }

  app.disable("x-powered-by");
  app.use(express.json()); // for parsing application/json
  // app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

  // check origin from all requests
  app.use(checkAllOrigin());

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
    console.log(red("http://") + localhost + red(":" + httpPort));
  });

  void ca
    .get()
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
        console.log(blue("https://") + serviceIP + blue(":" + httpsPort));
      });
      // console.log("\n\n")
    });
}
