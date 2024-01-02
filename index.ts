import startService from "./src/index.js";
import { yellow } from "./utils/consoleColor.js";
import { lan } from "./utils/host.js";
import { ca } from "./utils/signed-ca.js";

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
    void startService();
  }
}
