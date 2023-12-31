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
