interface DelayItem {
  id: string;
  appId: string;
  content: string;
  type: "delay";
  value: number;
}

interface WaitItem {
  id: string;
  appId: string;
  content: string;
  type: "wait";
  key: number;
  value: number;
}

export const delays: DelayItem[] = [
  {
    id: "idFor.2sec",
    appId: ".2_sec_delay",
    content: ".2s",
    type: "delay",
    value: 2,
  },
  {
    id: "idForHalfSec",
    appId: "half_sec_delay",
    content: ".5s",
    type: "delay",
    value: 5,
  },
  {
    id: "idFor1sec",
    appId: "one_sec_dly",
    content: "1s",
    type: "delay",
    value: 10,
  },
  {
    id: "idFor3sec",
    appId: "three_sec_delay",
    content: "3s",
    type: "delay",
    value: 30,
  },
  {
    id: "idFor5sec",
    appId: "five_sec_delay",
    content: "5s",
    type: "delay",
    value: 50,
  },
];

export const waitStates: WaitItem[] = [
  {
    id: "waitForA",
    appId: "wait_for_a",
    content: "A",
    type: "wait",
    key: 0,
    value: 10,
  },
];