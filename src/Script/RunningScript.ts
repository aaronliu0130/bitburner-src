/**
 * Class representing a Script instance that is actively running.
 * A Script can have multiple active instances
 */
import type React from "react";
import { Script } from "./Script";
import { ScriptURL } from "./LoadedModule";
import { Settings } from "../Settings/Settings";
import { Terminal } from "../Terminal";

import { Generic_fromJSON, Generic_toJSON, IReviverValue, constructorsForReviver } from "../utils/JSONReviver";
import { formatTime } from "../utils/helpers/formatTime";
import { ScriptArg } from "@nsdefs";
import { RamCostConstants } from "../Netscript/RamCostGenerator";
import { PositiveInteger } from "../types";
import { getKeyList } from "../utils/helpers/getKeyList";
import { ScriptFilePath } from "../Paths/ScriptFilePath";
import { ScriptKey, scriptKey } from "../utils/helpers/scriptKey";

export class RunningScript {
  // Script arguments
  args: ScriptArg[] = [];

  // Map of [key: hostname] -> Hacking data. Used for offline progress calculations.
  // Hacking data format: [MoneyStolen, NumTimesHacked, NumTimesGrown, NumTimesWeaken]
  dataMap: Record<string, number[]> = {};

  // Script filename
  filename = "default.js" as ScriptFilePath;

  // This script's logs. An array of log entries
  logs: React.ReactNode[] = [];

  // Flag indicating whether the logs have been updated since
  // the last time the UI was updated
  logUpd = false;

  // Total amount of hacking experience earned from this script when offline
  offlineExpGained = 0;

  // Total amount of money made by this script when offline
  offlineMoneyMade = 0;

  // Number of seconds that the script has been running offline
  offlineRunningTime = 0.01;

  // Total amount of hacking experience earned from this script when online
  onlineExpGained = 0;

  // Total amount of money made by this script when online
  onlineMoneyMade = 0;

  // Number of seconds that this script has been running online
  onlineRunningTime = 0.01;

  // Process ID. Must be an integer and equals the PID of corresponding WorkerScript
  pid = -1;

  // How much RAM this script uses for ONE thread
  ramUsage = RamCostConstants.Base;

  // hostname of the server on which this script is running
  server = "";

  // Cached key for ByArgs lookups. Will be overwritten by a correct ScriptKey in fromJSON or constructor
  scriptKey = "" as ScriptKey;

  // Number of threads that this script is running with
  threads = 1 as PositiveInteger;

  // Whether this RunningScript is excluded from saves
  temporary = false;

  // Script urls for the current running script for translating urls back to file names in errors
  dependencies = new Map<ScriptURL, Script>();

  constructor(script?: Script, ramUsage?: number, args: ScriptArg[] = []) {
    if (!script) return;
    if (!ramUsage) throw new Error("Must provide a ramUsage for RunningScript initialization.");
    this.filename = script.filename;
    this.args = args;
    this.scriptKey = scriptKey(this.filename, args);
    this.server = script.server;
    this.ramUsage = ramUsage;
    this.dependencies = script.dependencies;
  }

  log(txt: React.ReactNode): void {
    if (this.logs.length > Settings.MaxLogCapacity) {
      this.logs.shift();
    }

    let logEntry = txt;
    if (Settings.TimestampsFormat && typeof txt === "string") {
      logEntry = "[" + formatTime(Settings.TimestampsFormat) + "] " + logEntry;
    }

    this.logs.push(logEntry);
    this.logUpd = true;
  }

  displayLog(): void {
    for (const log of this.logs) {
      if (typeof log === "string") {
        Terminal.print(log);
      } else {
        Terminal.printRaw(log);
      }
    }
  }

  clearLog(): void {
    this.logs.length = 0;
  }

  // Update the moneyStolen and numTimesHack maps when hacking
  recordHack(hostname: string, moneyGained: number, n = 1): void {
    if (this.dataMap[hostname] == null || this.dataMap[hostname].constructor !== Array) {
      this.dataMap[hostname] = [0, 0, 0, 0];
    }
    this.dataMap[hostname][0] += moneyGained;
    this.dataMap[hostname][1] += n;
  }

  // Update the grow map when calling grow()
  recordGrow(hostname: string, n = 1): void {
    if (this.dataMap[hostname] == null || this.dataMap[hostname].constructor !== Array) {
      this.dataMap[hostname] = [0, 0, 0, 0];
    }
    this.dataMap[hostname][2] += n;
  }

  // Update the weaken map when calling weaken() {
  recordWeaken(hostname: string, n = 1): void {
    if (this.dataMap[hostname] == null || this.dataMap[hostname].constructor !== Array) {
      this.dataMap[hostname] = [0, 0, 0, 0];
    }
    this.dataMap[hostname][3] += n;
  }

  // Serialize the current object to a JSON save state
  toJSON(): IReviverValue {
    return Generic_toJSON("RunningScript", this, includedProperties);
  }

  // Initializes a RunningScript Object from a JSON save state
  static fromJSON(value: IReviverValue): RunningScript {
    const runningScript = Generic_fromJSON(RunningScript, value.data, includedProperties);
    if (!runningScript.scriptKey) runningScript.scriptKey = scriptKey(runningScript.filename, runningScript.args);
    return runningScript;
  }
}
const includedProperties = getKeyList(RunningScript, { removedKeys: ["logs", "dependencies", "logUpd", "pid"] });

constructorsForReviver.RunningScript = RunningScript;
