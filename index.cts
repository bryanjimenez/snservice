void import("./src/index.js").then(({ default: startService }) => {
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

    void startService();
  }
});
