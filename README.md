# Timeline Netem
## Author
Kosaku Namikawa

## Description

This Node.js script is designed to simulate a network environment.
It uses pfctl and dnctl to configure packet loss, bandwidth, and delay along a timeline.

THIS IS A WORK IN PROGRESS. USE AT YOUR OWN RISK.

## `pfctl` setting sample
```
dummynet in quick all pipe 1
dummynet in quick all pipe 1
```
