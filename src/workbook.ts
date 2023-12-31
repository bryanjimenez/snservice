import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { csvToObject, objectToCSV } from "./helper/csvHelper.js";
import { multipart } from "./helper/multipart.js";
import { CSV_DIR } from "./index.js";
import { type SheetData } from "@nmemonica/x-spreadsheet";
import { updateDataAndCache } from "./data.js";
import { FilledSheetData, isFilledSheetData } from "./helper/sheetHelper.js";
import { sheetDataToJSON } from "./helper/jsonHelper.js";

const _XLSX_FILE = "Nmemonica.xlsx";

const fileType: string = ".csv"; //".xlsx";
const sheetNames = ["Phrases", "Vocabulary", "Kanji"];

export function getWorkbook(req: Request, res: Response, next: NextFunction) {
  let xObj: Promise<FilledSheetData>[];
  switch (fileType) {
    case ".xlsx": {
      throw new Error("Incomplete: hardcoded range in readXLSX");
    }
    default: /** CSV */ {
      xObj = sheetNames.reduce<Promise<FilledSheetData>[]>((acc, sheet) => {
        const filePath = path.normalize(`${CSV_DIR}/${sheet}.csv`);

        const input = fs.createReadStream(filePath, { encoding: "utf-8" });

        const lineReader = readline.createInterface({
          input,
          terminal: false,
        });

        return [...acc, csvToObject(lineReader, sheet)];
      }, []);
    }
  }

  Promise.all(xObj)
    .then((vals) => {
      res.status(200).json(vals);
    })
    .catch(next);
}

export async function putWorkbookAsync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { sheetData } = await multipart<SheetData>(req, next);
    if (!isFilledSheetData(sheetData)) {
      next("Sheet missing name or data");
      return;
    }

    let h;
    switch (fileType) {
      case ".xlsx": {
        throw new Error("Incomplete: will override other sheets in wb!");
      }
      default:
        /** CSV */ {
          const t = new Date().toJSON();

          const backup = path.normalize(`${CSV_DIR}/backup/CSV-${t}`);
          // backup files
          if (!fs.existsSync(backup)) {
            fs.mkdirSync(backup, { recursive: true });
          }

          const { data, hash } = sheetDataToJSON(sheetData);

          const backupStream = fs.createWriteStream(
            `${backup}/${sheetData.name}.csv`
          );

          objectToCSV(sheetData, backupStream);

          const mainFileStream = fs.createWriteStream(
            path.normalize(`${CSV_DIR}/${sheetData.name}.csv`)
          );

          // working files
          objectToCSV(sheetData, mainFileStream);
          const resourceName = sheetData.name.toLowerCase();
          const updateP = updateDataAndCache(resourceName, data, hash);

          updateP.catch(next);
          h = hash;
        }

        res.status(200).json({ hash: h });
    }
  } catch (e) {
    next(e);
  }
}
