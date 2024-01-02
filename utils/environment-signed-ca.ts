import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { lan } from "./environment-host.js";
import { config } from "./config.js";

const projectRoot = path.resolve();

const hasSelfSignedCertificateAuthority = () => {
  if (
    fs.existsSync(
      `${projectRoot}/${config.directory.ca}/${config.ca.endEntityKey}`
    ) &&
    fs.existsSync(
      `${projectRoot}/${config.directory.ca}/${config.ca.endEntityCrt}`
    )
  ) {
    return true;
  }

  return false;
};

const cwd = `${projectRoot}/${config.directory.ca}`;

/**
 * This script creates a self signed End entity and Root CA (cert+key) pair
 */

const host = lan.hostname;
const ip = lan.address;
const AppName = "Nmemonica";

// #emailAddress=nobody@email.com
const commonName = `${AppName} Root Certificate Authority`;
const OU = "nmemonica";
const O = `${AppName} DEV`;
// const L="City"
// const ST="State"
const country = "US";

const rootKey = config.ca.rootKey; // key
const rootCRT = config.ca.rootCrt; // certificate
const rootCNF = "root.openssl.cnf"; // extensions file
const rootCSR = "root.csr"; // certificate sign request

const eeKey = config.ca.endEntityKey; // "eekey.pem";
const eecrt = config.ca.endEntityCrt; // "ee.pem";
const eeCNF = "ee.openssl.cnf";
const eeCSR = "ee.csr";

/**
 * Root Certificate Authority
 */
function buildRootCertificate() {
  // generate rootkey.pem
  spawnSync(
    "openssl",
    ["ecparam", "-out", rootKey, "-name", "secp384r1", "-genkey"],
    { cwd }
  );

  // generate root.csr
  spawnSync(
    "openssl",
    ["req", "-new", "-key", rootKey, "-days", "5480", "-extensions", "v3_ca", "-batch", "-out", rootCSR, "-utf8", "-subj", `/C=${country}/O=${O}/CN=${commonName}`],
    {cwd}
  );

  // create Root extensions file root.openssl.cnf
  const rootCNFString = `basicConstraints = critical, CA:TRUE\n
  keyUsage = keyCertSign, cRLSign\n
  subjectKeyIdentifier = hash\n
  nameConstraints = permitted;IP:${ip}/255.255.255.0,permitted;DNS:${host}`;
  fs.writeFileSync(`${cwd}/${rootCNF}`, rootCNFString);

  // generate ROOT signed CSR (root.pem) w/ root.openssl.cnf
  spawnSync(
    "openssl",
    ["x509", "-req", "-sha384", "-days", "3650", "-in", rootCSR, "-signkey", rootKey, "-extfile", rootCNF, "-out", rootCRT],
    {cwd}
  );
}

/**
 * End Entity Certificate
 */
function buildEndEntityCertificate() {
  if (eeKey === undefined || eecrt === undefined) {
    throw new Error("Dot env file missing key crt names");
  }

  // generate eekey.pem
  spawnSync(
    "openssl",
    ["ecparam", "-out", eeKey, "-name", "secp384r1", "-genkey"],
    { cwd }
  );

  // generate EE Certificate Signing Request (csr)
  spawnSync(
    "openssl",
    ["req", "-new", "-key", eeKey, "-days", "1096", "-extensions", "v3_ca", "-batch", "-out", eeCSR, "-utf8", "-subj", `/O=${O}/CN=${AppName} development`],
    {cwd}
  );

  // create End Entity extensions file ee.openssl.cnf
  const eeCNFString = `basicConstraints = CA:FALSE\n
  subjectAltName = IP:${ip}, DNS:${host}\n
  extendedKeyUsage = serverAuth`;
  fs.writeFileSync(`${cwd}/${eeCNF}`, eeCNFString);

  // generate End Entity signed CSR (ee.pem) w/ ee.openssl.cnf
  spawnSync(
    "openssl",
    ["x509", "-req", "-sha384", "-days", "1096", "-in", eeCSR, "-CAkey", rootKey, "-CA", rootCRT, "-extfile", eeCNF, "-out", eecrt],
    {cwd}
  );
}

function create() {
  console.log("IP: " + ip);
  console.log("Hostname: " + host);

  // create directory if not there
  if (!fs.existsSync(cwd)) {
    fs.mkdirSync(cwd, { recursive: true });
  }

  let delFileP: Promise<unknown>[] = [];

  // Delete old files
  [eecrt, eeKey, eeCSR, eeCNF, rootCRT, rootKey, rootCSR, rootCNF].forEach(
    (file) => {
      delFileP = [
        ...delFileP,
        new Promise((resolve) => {
          fs.rm(`${cwd}/${file}`, resolve);
        }),
      ];
    }
  );

  return Promise.all(delFileP).then(() => {
    buildRootCertificate();
    buildEndEntityCertificate();

    return get();
  });
}

function get() {
  return new Promise<{
    root: { key: string; crt: string };
    end: { key: string; crt: string };
  }>((resolve, reject) => {
    if (hasSelfSignedCertificateAuthority()) {
      const rootKey = fs.readFileSync(
        `${projectRoot}${config.directory.ca}/${config.ca.rootKey}`,
        "utf8"
      );
      const rootCrt = fs.readFileSync(
        `${projectRoot}${config.directory.ca}/${config.ca.rootCrt}`,
        "utf8"
      );

      const endKey = fs.readFileSync(
        `${projectRoot}${config.directory.ca}/${config.ca.endEntityKey}`,
        "utf8"
      );
      const endCrt = fs.readFileSync(
        `${projectRoot}${config.directory.ca}/${config.ca.endEntityCrt}`,
        "utf8"
      );

      const root = { key: rootKey, crt: rootCrt };
      const end = { key: endKey, crt: endCrt };

      resolve({ root, end });
    }
    reject(new Error("Self signed CA has not been created"));
  });
}


export const ca = {
  /** If it has been previously created */
  exists: hasSelfSignedCertificateAuthority,
  create,
  get,
};
