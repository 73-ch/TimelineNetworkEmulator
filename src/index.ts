import { TimelineNetworkEmulator } from "./TimelineNetworkEmulator";
import { ValueRecorder } from "./ValueRecorder";
import * as fs from "fs";
import * as path from "path";

const main = () => {
  const networkEmulator = new TimelineNetworkEmulator([
    {
      timestamp: 0,
      targetPipe: 1,
      delay: 100,
      bandWidth: 1000000,
      packetLoss: 0.02,
    },
    {
      timestamp: 10000,
      targetPipe: 1,
      delay: 1200,
      bandWidth: 1000000,
      packetLoss: 0.03,
    },
    {
      timestamp: 20000,
      targetPipe: 1,
      delay: 100,
      bandWidth: 100000,
      packetLoss: 0.02,
    },
    {
      timestamp: 30000,
      targetPipe: 1,
      delay: 100,
      bandWidth: 2000000,
      packetLoss: 0.1,
    },
    { timestamp: 40000, finish: true },
  ]);

  const recordsDir = "./records";
  if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir);
  }

  const recorder = new ValueRecorder();
  recorder.addValue("delay");
  recorder.addValue("packetLoss");
  recorder.addValue("bandWidth");

  networkEmulator.start();
  recorder.start();

  setInterval(() => {
    networkEmulator.update();

    const currentEvent = networkEmulator.getCurrentEvent();

    recorder.update();
    recorder.updateValue("delay", currentEvent.delay);
    recorder.updateValue("packetLoss", currentEvent.packetLoss);
    recorder.updateValue("bandWidth", currentEvent.bandWidth);

    if (networkEmulator.getStatus() === "stopped") {
      console.log("network emulator stopped");

      recorder.stop();

      const csvData = recorder.exportCSV();
      fs.writeFileSync(path.join(recordsDir, "record.csv"), csvData);

      const jsonData = recorder.exportJSON();
      fs.writeFileSync(path.join(recordsDir, "record.json"), jsonData);

      process.exit(0);
    }
  }, 100);
};

main();
