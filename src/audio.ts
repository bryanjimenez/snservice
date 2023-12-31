import https from "node:https";
import { Blob } from "node:buffer";
import type { Request, Response, NextFunction } from "express";
import stream from "node:stream";
import fs from "node:fs";
import path from "node:path";
import md5 from "md5";
import { AUDIO_DIR } from "./index.js";

const allowedTL = ["en", "ja"];
const audioExt = '.mp3'

/**
 * Fetch audio pronunciation
 */
export async function getAudioAsync(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.set("Content-Type", "audio/mpeg");
  try {
    const { tl, q } = req.query;

    if (
      typeof tl !== "string" ||
      typeof q !== "string" ||
      tl.toString().length === 0 ||
      q.toString().length === 0 ||
      !allowedTL.includes(tl)
    ) {
      res.sendStatus(400);
      return;
    }

    if (fs.existsSync(AUDIO_DIR + "/" + md5(q) + audioExt)) {
      console.log("from file cache");
      const fileStream = fs.createReadStream(AUDIO_DIR + "/" + md5(q) + audioExt);

      fileStream.pipe(res);
      return;
    }

    // const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=友達"
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${q}`;

    // https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
    // const audioRes = await fetch(url);
    const audioBlob: Blob = await new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data: Blob[] = [];
          res.on("data", (chunk: Blob) => {
            data.push(chunk);
          });
          res.on("end", () => {
            resolve(new Blob(data, { type: "audio/mpeg" }));
          });
        })
        .on("error", (err) => {
          reject(err);
        });
    });

    // const audioBlob = await audioRes.blob();
    const audioBuff = await audioBlob.arrayBuffer();
    const raw = new Uint8Array(audioBuff);

    // Write to fs ?
    const filename = path.normalize(AUDIO_DIR + "/" + md5(q) + audioExt);
    const fileStream = fs.createWriteStream(filename, {
    flags: "w",
    });

    // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93/
    const readStream = new stream.PassThrough();
    readStream.end(raw);

    // zip it? https://nodejs.org/api/stream.html#readablepipedestination-options
    // const zlib = require('node:zlib');
    // const z = zlib.createGzip();

    readStream.pipe(fileStream);
    readStream.pipe(res);
  } catch (e) {
    console.log("getAudio");
    console.log(e);
    next(e);
    res.sendStatus(500);
  }
}
