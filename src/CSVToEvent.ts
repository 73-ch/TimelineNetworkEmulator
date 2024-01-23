import { parse } from "csv-parse/sync";
import * as fs from "fs";
import { TimelineEvent } from "./TimelineNetworkEmulator";

export function CSVToEvent(filePath: string) {
  const file = fs.readFileSync(filePath, "utf8");

  const events: TimelineEvent[] = [];

  const records = parse(file);

  records.shift();

  for (const record of records) {
    const timestamp = Number(record[0]);
    const finish = !!Number(record[1]);
    const targetPipe = Number(record[2]);
    const delay = record[3];
    const bandWidth = record[4];
    const packetLoss = Number(record[5]);

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
