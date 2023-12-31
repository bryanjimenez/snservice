import type { Request, Response, NextFunction } from "express";
import { type SheetData } from "@nmemonica/x-spreadsheet";

import { sheetDataToJSON } from "./helper/jsonHelper.js";
import { multipart } from "./helper/multipart.js";
import fs, { createWriteStream, createReadStream } from "node:fs";
import path from "node:path";
import { JSON_DIR } from "./index.js";
import { isFilledSheetData } from "./helper/sheetHelper.js";

const allowedResources = ["cache", "phrases", "vocabulary", "kanji"];

/**
 * Get JSON vocabulary data
 */
export function getData(req: Request, res: Response) {
  const { data } = req.params;
  const resource = data?.toString().toLowerCase();

  if (resource && !allowedResources.includes(resource)) {
    res.sendStatus(400);
    return;
  }

  res.set({ "Content-Type": "application/json; charset=utf-8" });

  try {
    const readStream = createReadStream(
      path.normalize(`${JSON_DIR}/${resource}.json`)
    );
    readStream.pipe(res);
  } catch (_e) {
    res.sendStatus(400);
  }
}

/**
 * Update JSON (vocabulary) resource
 */
export async function putData(req: Request, res: Response, next: NextFunction) {
  const { sheetData } = await multipart<SheetData>(req, next);

  if (!isFilledSheetData(sheetData)) {
    next("Sheet missing name or data");
    return;
  }

  const resource = sheetData.name.toLowerCase();

  if (!allowedResources.filter((r) => r !== "cache").includes(resource)) {
    res.sendStatus(400);
  }

  const { data, hash } = sheetDataToJSON(sheetData);

  const fileP = updateData(resource, data);
  const hashP = updateLocalCache(resource, hash);

  Promise.all([fileP, hashP])
    .then(() => {
      res.sendStatus(200);
    })
    .catch(() => {
      res.sendStatus(400);
    });

  // https://firebase.google.com/docs/reference/rest/database/

  /*
  curl -X PUT -d '{ "first": "Jack", "last": "Sparrow" }' \
  'https://[PROJECT_ID].firebaseio.com/users/jack/name.json'
  https://nmemonica-9d977.firebaseio.com/lambda/cache.json
  https://nmemonica-9d977.firebaseio.com/lambda/phrases.json
  https://nmemonica-9d977.firebaseio.com/lambda/vocabulary.json
  */
}

/**
 * Combined operation of
 *
 * - Write data to json file
 * - Update cache json file
 * @param resource name of data set
 * @param data value
 * @param hash
 */
export function updateDataAndCache(
  resource: string,
  data: Record<string, unknown>,
  hash: string
) {
  if (!allowedResources.filter((r) => r !== "cache").includes(resource)) {
    // res.sendStatus(400);
    //
    throw new Error("invalid resource");
  }

  const fileP = updateData(resource, data);
  const hashP = updateLocalCache(resource, hash);

  return Promise.all([fileP, hashP]).then(() => {});
}

/**
 * Write JSON formatted data to file
 * @param jsonData
 * @param resourceName
 */
function updateData(resourceName: string, jsonData: Record<string, unknown>) {
  const dataPath = path.normalize(`${JSON_DIR}/${resourceName}.json`);

  return new Promise<void>((resolve, reject) => {
    try {
      const writeStream = createWriteStream(dataPath);
      writeStream.end(JSON.stringify(jsonData, null, 2));
      resolve();
    } catch (_e) {
      console.log("Failed to update resource: " + resourceName);
      reject(new Error("Failed to update resource"));
    }
  });
}

/**
 * Update cache file hashes
 * @param resource to update
 * @param hash value
 */
function updateLocalCache(resource: string, hash: string) {
  const cachePath = path.normalize(`${JSON_DIR}/cache.json`);

  return fs.promises
    .readFile(cachePath, { encoding: "utf-8" })
    .then((body) => JSON.parse(body) as Record<string, string>)
    .then((value) => {
      value[resource] = hash;
      return value;
    })
    .then((json) => JSON.stringify(json, null, 2))
    .then((value) => fs.promises.writeFile(cachePath, value))
    .catch((error: Error) => {
      if ("name" in error && error.name === "NotFound") {
        void fs.promises.writeFile(
          cachePath,
          JSON.stringify({ [resource]: hash }, null, 2)
        );
      } else {
        console.log(error);
        console.log("Some error happened writing cache: " + resource);
        throw new Error("Could not update cache.json");
      }
    });
}
