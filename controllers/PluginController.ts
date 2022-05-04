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
import { readdirSync, existsSync, readFileSync } from "fs";
import * as path from "path";
import { IController } from "./IController.js";
import { Manifest, Plugin } from "../models/PluginTypes.js";

export class PluginController implements IController {
  private readonly MANIFEST_FILE = "manifest.json";

  static _instance: IController;

  private constructor() {}

  static get instance(): IController {
    if (!this._instance) {
      this._instance = new PluginController();
    }

    return this._instance;
  }

  register(app: Express) {
    const filename = fileURLToPath(import.meta.url);
    const controllerDirectory = path.dirname(filename);
    const distDirectory = path.resolve(controllerDirectory, "..");
    const rootDirectory = path.resolve(distDirectory, "..");
    const pluginsDirectory = path.join(rootDirectory, "plugins");

    app.get("/pluginManifests", (request, response) => {
      try {
        const pluginPaths = new Set<string>();
        readdirSync(pluginsDirectory).forEach((directory) =>
          pluginPaths.add(path.join(pluginsDirectory, directory))
        );

        const protocol = request.protocol;
        const host = request.get("host") ?? "";

        const pluginsList: Manifest[] = [];
        pluginPaths.forEach((pluginPath) => {
          const manifestPath = path.join(pluginPath, this.MANIFEST_FILE);
          if (!existsSync(manifestPath)) {
            return;
          }

          const manifest = JSON.parse(
            readFileSync(manifestPath, "utf8")
          ) as Manifest;
          this.setManifestIcon(manifest, protocol, host);
          pluginsList.push(manifest);
        });

        response.set("Content-Type", "application/json");
        response.status(200).json(pluginsList);
      } catch (error) {
        console.error(
          "Something went wrong while processing the request.",
          error
        );
        response.status(500);
      }
    });

    app.get("/pluginManifests/:pluginId", (request, response) => {
      try {
        const pluginId = request.params.pluginId;

        let pluginPath = "";
        const directories = readdirSync(pluginsDirectory);
        for (let i = 0; i < directories.length; i++) {
          if (directories[i] === pluginId) {
            pluginPath = path.join(pluginsDirectory, directories[i]);
            break;
          }
        }

        if (pluginPath === "") {
          response.status(200).json({});
          return;
        }

        const protocol = request.protocol;
        const host = request.get("host") ?? "";

        const manifestPath = path.join(pluginPath, this.MANIFEST_FILE);
        if (!existsSync(manifestPath)) {
          response.status(200).json({});
          return;
        }

        const manifest = JSON.parse(
          readFileSync(manifestPath, "utf8")
        ) as Manifest;
        this.setManifestIcon(manifest, protocol, host);

        response.set("Content-Type", "application/json");
        response.status(200).json(manifest);
      } catch (error) {
        console.error(
          "Something went wrong while processing the request.",
          error
        );
        response.status(500);
      }
    });

    app.get("/plugins/:pluginId", (request, response) => {
      try {
        const pluginId = request.params.pluginId;
        const pluginPath = path.join(pluginsDirectory, pluginId);
        const distPluginPath = path.join(distDirectory, "plugins", pluginId);

        const manifestPath = path.join(pluginPath, this.MANIFEST_FILE);
        if (!existsSync(manifestPath)) {
          response.status(200).json({});
          return;
        }

        const manifest = JSON.parse(
          readFileSync(manifestPath, "utf8")
        ) as Manifest;
        const plugin = this.getPlugin(manifest, pluginPath, distPluginPath);

        response.set("Content-Type", "application/json");
        response.status(200).json(plugin);
      } catch (error) {
        console.error(
          "Something went wrong while processing the request.",
          error
        );
        response.status(500);
      }
    });

    app.get("/pluginIcons/:pluginId/:iconId", (request, response) => {
      try {
        const pluginId = request.params.pluginId;
        const iconId = request.params.iconId;

        if (
          !pluginId ||
          pluginId.trim().length === 0 ||
          !iconId ||
          iconId.trim().length === 0
        ) {
          console.warn("'pluginId' and/or 'iconId' is empty.");
          response.status(400);
          return;
        }

        const pluginPath = path.join(pluginsDirectory, pluginId);
        const iconPath = path.join(pluginPath, iconId);
        if (!existsSync(iconPath)) {
          response.status(404);
          return;
        }

        response.sendFile(iconPath);
      } catch (error) {
        console.error(
          "Something went wrong while processing the request.",
          error
        );
        response.status(500);
      }
    });
  }

  private setManifestIcon(manifest: Manifest, protocol: string, host: string) {
    if (manifest.icon) {
      if (typeof manifest.icon === "string") {
        manifest.icon = this.getIconUrl(
          protocol,
          host,
          manifest.id,
          manifest.icon
        );
      } else {
        manifest.icon.light = this.getIconUrl(
          protocol,
          host,
          manifest.id,
          manifest.icon.light
        );
        manifest.icon.dark = this.getIconUrl(
          protocol,
          host,
          manifest.id,
          manifest.icon.dark
        );
      }
    }
  }

  private getIconUrl(
    protocol: string,
    host: string,
    pluginId: string,
    iconId: string
  ) {
    return `${protocol}://${host}/pluginIcons/${pluginId}/${iconId}`;
  }

  private getPlugin(
    manifest: Manifest,
    pluginPath: string,
    distPluginPath: string
  ) {
    const plugin: Plugin = { ui: "", code: "" };

    if (manifest.ui) {
      const uiFile = path.resolve(pluginPath, manifest.ui);
      if (existsSync(uiFile)) {
        plugin.ui = `data:text/html;base64,${readFileSync(uiFile).toString(
          "base64"
        )}`;
      }
    }

    if (manifest.main) {
      let codeFile = path.resolve(pluginPath, manifest.main);
      if (existsSync(codeFile)) {
        plugin.code = readFileSync(codeFile).toString();
      } else {
        codeFile = path.resolve(distPluginPath, manifest.main);
        if (existsSync(codeFile)) {
          plugin.code = readFileSync(codeFile).toString();
        }
      }
    }

    return plugin;
  }
}
