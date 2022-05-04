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

import { WebSocketServer } from "ws";
import { watch } from "chokidar";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import * as path from "path";
import shell from "shelljs";
import { MessageBuffer } from "../utils/index.js";

export class PluginObserver {
  private static _instance: PluginObserver;

  private readonly _buffer: MessageBuffer;
  private readonly _extensionsToRecompile: Set<string>;

  private constructor() {
    this._buffer = new MessageBuffer();
    this._extensionsToRecompile = new Set<string>([
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
    ]);
  }

  static get instance() {
    if (!this._instance) {
      this._instance = new PluginObserver();
    }

    return this._instance;
  }

  register(webSocketServer: WebSocketServer) {
    this._buffer.registerAction((message, extensions) => {
      extensions.forEach((extension) => {
        if (this._extensionsToRecompile.has(extension)) {
          shell.exec("tsc");
          return;
        }
      });

      webSocketServer.clients.forEach((client) => client.send(message));
    });

    const filename = fileURLToPath(import.meta.url);
    const hubDirectory = path.dirname(filename);
    const distDirectory = path.resolve(hubDirectory, "..");
    const rootDirectory = path.resolve(distDirectory, "..");
    const pluginsDirectory = path.join(rootDirectory, "plugins");

    const pluginPaths = new Set<string>();
    readdirSync(pluginsDirectory).forEach((directory) =>
      pluginPaths.add(path.join(pluginsDirectory, directory))
    );

    const watcher = watch(pluginsDirectory, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles,
      persistent: true,
      ignoreInitial: true,
    });

    watcher
      .on("add", (filePath) => this.addMessage(filePath))
      .on("change", (filePath) => this.addMessage(filePath))
      .on("unlink", (filePath) => this.addMessage(filePath));
  }

  private addMessage(filePath: string) {
    const pluginName = path.basename(path.dirname(filePath));
    const fileExtension = path.extname(filePath);
    this._buffer.addMessage(pluginName, fileExtension);
  }
}
