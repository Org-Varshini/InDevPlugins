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

import "dotenv/config";
import process from "process";
import { WebSocketServer } from "ws";

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import * as path from "path";
import https from "https";

import express from "express";
import cors from "cors";
import { PluginObserver } from "./observers/index.js";
import { HomeController, PluginController } from "./controllers/index.js";

const API_PROTOCOL = "https";
const API_HOST_NAME = process.env.API_HOST_NAME;
const API_PORT = Number(process.env.API_PORT);

const WEBSOCKET_PROTOCOL = "wss";
const WEBSOCKET_HOST_NAME = process.env.WEBSOCKET_HOST_NAME;
const WEBSOCKET_PORT = Number(process.env.WEBSOCKET_PORT);

process.on("uncaughtException", (error) => {
  console.error("Uncaught error", error);
});

const filename = fileURLToPath(import.meta.url);
const distDirectory = path.dirname(filename);
const rootDirectory = path.resolve(distDirectory, "..");
const sslDirectory = path.join(rootDirectory, "ssl");

const key = readFileSync(path.join(sslDirectory, "key.pem"), "utf8");
const cert = readFileSync(path.join(sslDirectory, "cert.pem"), "utf8");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const homeController = HomeController.instance;
homeController.register(app);

const pluginController = PluginController.instance;
pluginController.register(app);

const secureApiServer = https.createServer({ key, cert }, app);
secureApiServer.listen(API_PORT, API_HOST_NAME);

const secureWebSocketServer = https.createServer({ key, cert });
const webSocketServer = new WebSocketServer({ server: secureWebSocketServer });
secureWebSocketServer.listen(WEBSOCKET_PORT, WEBSOCKET_HOST_NAME);

const pluginObserver = PluginObserver.instance;
pluginObserver.register(webSocketServer);

console.log(`API URL: ${API_PROTOCOL}://${API_HOST_NAME}:${API_PORT}`);
console.log(
  `WebSocket URL: ${WEBSOCKET_PROTOCOL}://${WEBSOCKET_HOST_NAME}:${WEBSOCKET_PORT}\n`
);
