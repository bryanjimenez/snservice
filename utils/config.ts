import fs from "node:fs";
import path from "node:path";

interface ServiceConfiguration {
  uiOrigin: string;

  port: {
    ui: number;
    http: number;
    https: number;
  };

  ca: {
    endEntityKey: string;
    endEntityCrt: string;
    rootKey: string;
    rootCrt: string;
  };

  directory: {
    ca: string;
    pushAPI: string;
    csv: string;
    json: string;
    audio: string;
  };

  servicePath: {
    audio: string;
    data: string;
    sheet: string;
    pushGetPubKey: string;
    pushRegister: string;
    pushSheetData: string;
  };
}


const projectRoot = path.resolve();

function getConfig() {
  const configPath = "/snservice.conf.json";
  if (!fs.existsSync(projectRoot + configPath)) {
    console.log(projectRoot);
    throw new Error("Missing config file " + projectRoot);
  }
  const config = JSON.parse(
    fs.readFileSync(projectRoot + configPath, { encoding: "utf-8" })
  ) as ServiceConfiguration;

  if (config.port.ui === undefined) {
    throw new Error("Missing app ui port in config file");
  }
  if (config.port.https === undefined) {
    throw new Error("Missing service https port in config file");
  }
  if (config.servicePath.audio === undefined) {
    throw new Error("Missing service audio path in config file");
  }
  if (config.servicePath.data === undefined) {
    throw new Error("Missing service data path in config file");
  }
  if (config.servicePath.sheet === undefined) {
    throw new Error("Missing service sheet path in config file");
  }

  if (config.directory.ca === undefined) {
    throw new Error("Missing CA directory path in config file");
  }

  return config;
}

export const config = getConfig();
