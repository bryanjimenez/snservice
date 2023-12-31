import startService from "./src/index.js";

if (
  // ts-node
  import.meta.url === `file://${process.argv[1]}` ||
  // node
  (import.meta.url === `file://${process.argv[1]}/dist/index.js`)

) {
  // running from cli
  void startService();
}
