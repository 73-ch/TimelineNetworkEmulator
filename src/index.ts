import { TimelineNetworkEmulator } from "./TimelineNetworkEmulator";
import { ValueRecorder } from "./ValueRecorder";

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
