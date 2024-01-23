type ValueRecorderValue = {
  timestamp: number;
  elapsedTime: number;
  data: {
    [key: string]: any;
  };
};

export class ValueRecorder {
  private startTime: number = 0;

  private valueFuncs: Map<string, () => any> = new Map();
  private recordedValues: ValueRecorderValue[] = [];
  private currentRecordedValue: ValueRecorderValue | null = null;

  constructor() {}

  start() {
    this.startTime = Date.now();
  }

  addValue(key: string, valueFunc: () => any = () => null) {
    if (this.valueFuncs.has(key)) {
      console.warn(`${key} is already added to value recorder, overwriting`);
    }

    this.valueFuncs.set(key, valueFunc);
  }

  update() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.startTime;

    const newRecordedValue: ValueRecorderValue = {
      timestamp: currentTime,
      elapsedTime,
      data: {},
    };

    this.valueFuncs.forEach((valueFunc, key) => {
      newRecordedValue.data[key] = valueFunc();
    });

    this.recordedValues.push(newRecordedValue);

    this.currentRecordedValue = newRecordedValue;
  }

  updateValue(key: string, value: any) {
    if (!this.currentRecordedValue) {
      console.warn("No current recorded value, cannot update value");
      return;
    }
    this.currentRecordedValue.data[key] = value;
  }

  stop() {
    this.startTime = 0;
  }

  exportJSON() {
    const rawData = JSON.stringify(this.recordedValues);
    const blob = new Blob([rawData], { type: "application/json" });
    return URL.createObjectURL(blob);
  }

  exportCSV() {
    const header = ["timestamp", "elapsedTime", ...this.valueFuncs.keys()].join(
      ",",
    );
    const rows = this.recordedValues.map((recordedValue) => {
      const data = Object.values(recordedValue.data).join(",");
      return `${recordedValue.timestamp},${recordedValue.elapsedTime},${data}`;
    });
    return [header, ...rows].join("\n");
  }
}
