import { TimelineNetworkEmulator } from "./TimelineNetworkEmulator";

const main = () => {
  const networkEmulator = new TimelineNetworkEmulator(1, [
    {
      timestamp: 0,
      targetPipe: 1,
      delay: "100ms",
      bandWidth: "1000Kbit/s",
      packetLoss: 0.1,
    },
    {
      timestamp: 10000,
      targetPipe: 1,
      delay: "1200ms",
      bandWidth: "1000Kbit/s",
      packetLoss: 0.1,
    },
    {
      timestamp: 20000,
      targetPipe: 1,
      delay: "100ms",
      bandWidth: "100Kbit/s",
      packetLoss: 0.15,
    },
    {
      timestamp: 30000,
      targetPipe: 1,
      delay: "100ms",
      bandWidth: "2000Kbit/s",
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
