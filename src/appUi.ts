import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { config } from "./index.js";

const projectRoot = path.resolve();

export function getCA(req: Request, res: Response) {
  res.set("Content-Type", "application/pkcs10");

  const certificateDir = config.directory.ca;
  const rootCertFile = config.ca.rootCrt;

  try {
    const readStream = fs.createReadStream(
      `${projectRoot}${certificateDir}/${rootCertFile}`
    );
    res.set("Content-Disposition", `attachment; filename=${rootCertFile}`);
    readStream.pipe(res);
  } catch (_e) {
    res.sendStatus(400);
  }
}
