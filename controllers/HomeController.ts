/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2022 Adobe Systems Incorporated
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 **************************************************************************/

import { Express } from "express";
import { fileURLToPath } from "url";
import * as path from "path";
import { IController } from "./IController.js";

export class HomeController implements IController {
  static _instance: IController;

  private constructor() {}

  static get instance() {
    if (!this._instance) {
      this._instance = new HomeController();
    }

    return this._instance;
  }

  register(app: Express) {
    const filename = fileURLToPath(import.meta.url);
    const controllerDirectory = path.dirname(filename);
    const distDirectory = path.resolve(controllerDirectory, "..");

    app.get("/", (_, response) => {
      try {
        const homePage = path.join(distDirectory, "index.html");
        response.sendFile(homePage);
      } catch (error) {
        console.error(
          "Something went wrong while processing the request.",
          error
        );
        response.status(500);
      }
    });
  }
}
