import { TimelineNetworkEmulator } from "./TimelineNetworkEmulator";
import { ValueRecorder } from "./ValueRecorder";
import * as fs from "fs";
import * as path from "path";

const main = () => {
  const networkEmulator = new TimelineNetworkEmulator([
    {
      timestamp: 0,
      targetPipe: 1,
      delay: 0,
      bandWidth: 1000,
      packetLoss: 0,
    },
    {
      // Wi-Fi
      timestamp: 10000,
      targetPipe: 1,
      delay: 1,
      bandWidth: 250,
      packetLoss: 0,
    },
    {
      // LTE
      timestamp: 20000,
      targetPipe: 1,
      delay: 50,
      bandWidth: 50,
      packetLoss: 0.005,
    },
    {
      // bad Wi-Fi
      timestamp: 30000,
      targetPipe: 1,
      delay: 10,
      bandWidth: 100,
      packetLoss: 0.02,
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
