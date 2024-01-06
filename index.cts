// eslint-disable-next-line @typescript-eslint/no-var-requires
const JsonObject = require("swagger-ui-express").JsonObject;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");

void import("./src/app.js").then(({ default: startService }) => {
  if (
    (require.main?.loaded === true &&
      require.main.filename === `${process.argv[1]}/dist/cjs/index.cjs`) ||
    (require.main?.loaded === true &&
      require.main.filename === `${process.argv[1]}`)
  ) {
    // running from cli

    if (process.argv[2] === "--ca") {
      void import("./utils/signed-ca.js").then(({ ca }) => {
        void import("./utils/consoleColor").then(({ yellow }) => {
          // running from cli
          void ca
            .get()
            .catch(() => {
              console.log(yellow("\nCreating Certificate Authority"));
              return ca.create();
            })
            .then(() => {
              console.log("CA already exists");
            });
        });
      });

      return;
    }

    if (process.argv[2] === "--host") {
      void import("./utils/host.js").then(({ lan }) => {
        console.log(JSON.stringify(lan));
      });

      return;
    }

    let swaggerSpec: typeof JsonObject;
    let pkgRoot;
    switch (true) {
      case process.argv[1].endsWith("/dist/cjs/index.js"):
        pkgRoot = process.argv[1].replace("/dist/cjs/index.js", "");
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
    );

    void startService({ swaggerSpec });
  }
});
