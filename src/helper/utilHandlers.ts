import type { Request, Response, NextFunction } from "express";
import { allowedOrigins } from "../app.js";

/**
 * Check origin from all request middleware
 * @param usingSelfSignedCA
 */
export function checkAllOrigin(usingSelfSignedCA: boolean) {
  return function (req: Request, res: Response, next: NextFunction) {
    console.log(
      (req.secure ? "https" : "http") + " " + req.method + " " + req.url
    );

    if (!req.secure && !usingSelfSignedCA) {
      res.set("Access-Control-Allow-Origin", req.headers.origin);
      res.set("Access-Control-Allow-Methods", "GET, PUT");
      res.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Data-Version, X-No-Cache"
      );
    }

    if (req.secure) {
      if (req.method === "OPTIONS") {
        const allowed =
          req.headers.origin && allowedOrigins.includes(req.headers.origin)
            ? req.headers.origin
            : allowedOrigins[0];

        res.set("Access-Control-Allow-Origin", allowed);
        res.set("Vary", "Origin");
        res.set("Access-Control-Allow-Methods", "GET, PUT");
        res.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Data-Version, X-No-Cache"
        );

        res.sendStatus(204);
        return;
      }

      if (!req.headers.origin || !allowedOrigins.includes(req.headers.origin)) {
        res.sendStatus(401);
        if (!req.headers.origin) {
          console.log("Missing origin");
          return;
        }
        if (!allowedOrigins.includes(req.headers.origin)) {
          console.log("Unknown origin " + req.headers.origin);
          return;
        }
      }

      res.set("Access-Control-Allow-Origin", req.headers.origin);
    }
    next();
  };
}

/**
 * Custom 404 message
 */
export function custom404() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (req: Request, res: Response, next: NextFunction) {
    res.status(404).send("That couldn't be found...");
  };
}

/**
 * Custom error handler
 */
export function customError() {
  return function (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
  ) {
    if (err instanceof Error) {
      console.error(err.stack);
    }
    console.log("\n . . .\n\n");
    res.status(500).send("Something broke!");
  };
}
