import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { config } from "../../utils/config.js";

const projectRoot = path.resolve();

/**
 * @swagger
 * /getCA:
 *    get:
 *      description: Obtain a Self Signed Root Certificate Authority for HTTPS requests
 *      summary: reachable by HTTP
 *      responses:
 *        200:
 *          description: a root CA
 *          content:
 *            application/pkcs10:
 *              schema:
 *                type: file
 *                format: plaintext
 *                example:
 *                  root.pem
 */
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
