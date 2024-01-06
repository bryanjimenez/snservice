import fs from "node:fs";
import startService from "./src/app.js";
import { yellow } from "./utils/consoleColor.js";
import { lan } from "./utils/host.js";
import { ca } from "./utils/signed-ca.js";
import type { JsonObject } from "swagger-ui-express";

if (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file://${process.argv[1]}/dist/esm/index.js`
) {
  // running from cli

  if (process.argv[2] === "--ca") {
    void ca
      .get()
      .catch(() => {
        console.log(yellow("\nCreating Certificate Authority"));
        return ca.create();
      })
      .then(() => {
        console.log("CA already exists");
      });
  }

  if (process.argv[2] === "--host") {
    console.log(JSON.stringify(lan));
  }

  if (process.argv[2] === undefined) {
    let swaggerSpec: JsonObject;

    let pkgRoot;
    switch (true) {
      case process.argv[1].endsWith("/dist/esm/index.js"):
        pkgRoot = process.argv[1].replace("/dist/esm/index.js", "");
        break;
      case process.argv[1].endsWith("@nmemonica/snservice"):
        pkgRoot = process.argv[1];
        break;
      default:
        throw new Error("Unexpected cwd");
    }
    swaggerSpec = JSON.parse(
      fs.readFileSync(pkgRoot + "/api-docs/swaggerSpec.json", {
        encoding: "utf-8",
      })
    ) as JsonObject;

    void startService({ swaggerSpec });
  }
}
