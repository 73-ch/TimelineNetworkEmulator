import { TimelineNetworkEmulator } from "./TimelineNetworkEmulator";
import { CSVToEvent } from "./CSVToEvent";

const main = () => {
  const events = CSVToEvent("./sample.csv");

  console.log(events);

  const networkEmulator = new TimelineNetworkEmulator(events);

  networkEmulator.start();

  setInterval(() => {
    networkEmulator.update();

    if (networkEmulator.getStatus() === "stopped") {
      console.log("network emulator stopped");
      process.exit(0);
    }
  }, 100);
};

main();
