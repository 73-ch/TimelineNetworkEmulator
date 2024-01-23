import { parse } from "csv-parse/sync";
import * as fs from "fs";
import { TimelineEvent } from "./TimelineNetworkEmulator";

export function CSVToEvent(filePath: string) {
  const file = fs.readFileSync(filePath, "utf8");

  const events: TimelineEvent[] = [];

  const records = parse(file);

  const header = records.shift();
  const bandWidthIdx = header.indexOf("bandWidth");
  const delayIdx = header.indexOf("delay");
  const packetLossIdx = header.indexOf("packetLoss");
  const targetPipeIdx = header.indexOf("targetPipe");
  const finishIdx = header.indexOf("finish");
  const timestampIdx = header.indexOf("timestamp");

  for (const record of records) {
    const timestamp = Number(record[timestampIdx]);
    const finish = !!Number(record[finishIdx]);
    const targetPipe = Number(record[targetPipeIdx]);
    const bandWidth = Number(record[bandWidthIdx]);
    const delay = Number(record[delayIdx]);
    const packetLoss = Number(record[packetLossIdx]);

    if (finish) {
      events.push({ timestamp, finish });
    } else {
      events.push({
        timestamp,
        targetPipe,
        delay,
        bandWidth,
        packetLoss,
      });
    }
  }

  return events;
}
