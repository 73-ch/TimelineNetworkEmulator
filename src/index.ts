import { execSync } from "child_process";

interface TimelineEvent {
  timestamp: number;

  [key: string]: any;
}

interface DnctlEvent extends TimelineEvent {
  targetPipe: number;
  delay?: string;
  bandWidth?: string;
  packetLoss?: number;
}

function isDnctlEvent(event: TimelineEvent): event is DnctlEvent {
  return (event as DnctlEvent).targetPipe !== undefined;
}

interface FinishEvent extends TimelineEvent {
  finish: true;
}

function isFinishEvent(event: TimelineEvent): event is FinishEvent {
  return (event as FinishEvent).finish !== undefined;
}

class TimelineNetworkEmulator {
  private startTime: number = 0;
  private timeline: TimelineEvent[] = [];
  private currentEventIdx: number = 0;
  private status: "initialized" | "started" | "stopped" = "initialized";

  constructor(targetPipe: number, timeline: TimelineEvent[]) {
    this.setTimeLine(timeline);
  }

  setTimeLine(timeline: TimelineEvent[]) {
    if (this.status !== "initialized") {
      console.warn("timeline is already set and running");
    }

    // check event
    for (let event of timeline) {
      try {
        if (isFinishEvent(event)) {
          continue;
        }
        // enable pfctl
        let command = TimelineNetworkEmulator.eventToCommand(event, true);
        execSync(command);
      } catch (e) {
        console.error("invalid event: ", event);
        throw e;
      }
    }

    this.resetDnctl();

    // sort with timestamp
    this.timeline = timeline.sort((a, b) => a.timestamp - b.timestamp);
  }

  start() {
    try {
      // enable pfctl
      execSync(`sudo pfctl -e`);
      execSync(`sudo pfctl -f /etc/pf.conf`);
    } catch (e) {
      console.log("pfctl is already enabled");
    }

    this.startTime = Date.now();
    this.currentEventIdx = 0;
    this.status = "started";
  }

  stop() {
    // disable pfctl
    this.status = "stopped";
    try {
      execSync(`sudo pfctl -d`);
      this.resetDnctl();
    } catch (e) {
      console.log("pfctl is already disabled");
    }
  }

  private resetDnctl() {
    try {
      execSync(`sudo dnctl -q flush`);
    } catch (e) {
      console.log("dnctl is already disabled");
    }
  }

  update() {
    const currentTime = Date.now() - this.startTime;
    const currentEvent = this.timeline[this.currentEventIdx];

    if (!currentEvent) return;

    // check if current event is finished
    if (isFinishEvent(currentEvent) && currentEvent.finish) {
      console.log("event finished");
      this.stop();
      return;
    }

    // occur event
    if (isDnctlEvent(currentEvent) && currentTime > currentEvent.timestamp) {
      let command = TimelineNetworkEmulator.eventToCommand(currentEvent);
      if (currentEvent.packetLoss) command += ` plr ${currentEvent.packetLoss}`;

      console.log("executed command: ", command, " at ", currentTime);
      execSync(command);
      this.currentEventIdx++;
    }
  }

  static eventToCommand(event: TimelineEvent, isCheck: boolean = false) {
    if (!isDnctlEvent(event)) {
      console.log(event);
      throw new Error("event is not dnctl event");
    }

    let command = `sudo dnctl ${isCheck ? "-n" : ""} pipe ${event.targetPipe} config`;

    if (event.delay) command += ` delay ${event.delay}`;
    if (event.bandWidth) command += ` bw ${event.bandWidth}`;
    if (event.packetLoss) command += ` plr ${event.packetLoss}`;

    return command;
  }

  getStatus() {
    return this.status;
  }
}

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
