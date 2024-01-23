import { execSync } from "child_process";

export interface TimelineEvent {
  timestamp: number;

  [key: string]: any;
}

export interface DnctlEvent extends TimelineEvent {
  targetPipe: number;
  delay?: number;
  bandWidth?: number;
  packetLoss?: number;
}

export function isDnctlEvent(event: TimelineEvent): event is DnctlEvent {
  return (event as DnctlEvent).targetPipe !== undefined;
}

export interface FinishEvent extends TimelineEvent {
  finish: true;
}

export function isFinishEvent(event: TimelineEvent): event is FinishEvent {
  return (event as FinishEvent).finish !== undefined;
}

export class TimelineNetworkEmulator {
  private startTime: number = 0;
  private timeline: TimelineEvent[] = [];
  private nextEventIdx: number = 0;
  private currentEventIdx: number = -1;
  private status: "initialized" | "started" | "stopped" = "initialized";

  constructor(timeline: TimelineEvent[]) {
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
    this.nextEventIdx = 0;
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
    if (this.status !== "started") {
      console.warn("timeline is not started, but update is called");
      return;
    }

    const currentTime = Date.now() - this.startTime;
    const nextEvent = this.timeline[this.nextEventIdx];

    if (!nextEvent) return;

    // check if current event is finished
    if (
      isFinishEvent(nextEvent) &&
      currentTime > nextEvent.timestamp &&
      nextEvent.finish
    ) {
      console.log("event finished");
      this.stop();
      return;
    }

    // occur event
    if (isDnctlEvent(nextEvent) && currentTime > nextEvent.timestamp) {
      let command = TimelineNetworkEmulator.eventToCommand(nextEvent);

      console.log("executed command: ", command, " at ", currentTime);
      execSync(command);
      this.currentEventIdx = this.nextEventIdx;
      this.nextEventIdx++;
    }
  }

  static eventToCommand(event: TimelineEvent, isCheck: boolean = false) {
    if (!isDnctlEvent(event)) {
      console.log(event);
      throw new Error("event is not dnctl event");
    }

    let command = `sudo dnctl ${isCheck ? "-n" : ""} pipe ${event.targetPipe} config`;

    if (event.delay) command += ` delay ${event.delay}ms`;
    if (event.bandWidth) command += ` bw ${event.bandWidth / 1000}Kbit/s`;
    if (event.packetLoss) command += ` plr ${event.packetLoss}`;

    return command;
  }

  getStatus() {
    return this.status;
  }

  getCurrentEvent(): DnctlEvent {
    const currentTime = Date.now() - this.startTime;

    if (this.currentEventIdx === -1) {
      return {
        timestamp: currentTime,
        targetPipe: 0,
        delay: 0,
        bandWidth: 0,
        packetLoss: 0,
      };
    }
    const event = this.timeline[this.currentEventIdx];

    if (isDnctlEvent(event)) {
      return Object.assign(event, { timestamp: currentTime });
    } else {
      return {
        timestamp: currentTime,
        targetPipe: 0,
        delay: 0,
        bandWidth: 0,
        packetLoss: 0,
      };
    }
  }
}
