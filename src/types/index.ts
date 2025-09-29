export type Servo = {
  id: string;
  name?: string;
  index: number;
  pin?: number;
  value: number;
  enabled: boolean;
  type?: string;
  // preserve unknown legacy keys explicitly
  extras?: Record<string, unknown>;
};

export type Position = {
  appId: string;
  name: string;
  servos: Servo[];
  extras?: Record<string, unknown>;
};

export type Sequence = {
  id?: string;
  appId?: string;
  name: string;
  // Discriminated union for sequence actions
  actions: Action[];
  extras?: Record<string, unknown>;
};

export type Robot = {
  path: string;
  name: string;
  servos: Servo[];
  sequences: Sequence[];
  // Common UI fields
  description?: string;
  youtubeId?: string;
  difficulty?: number;
  readOnly?: boolean;
  boardRequirements?: Record<string, unknown>;
  positions: Position[];
  extras?: Record<string, unknown>;
};

// Actions used in sequences. Keep this union small and explicit so UI code can
// pattern-match on `type` safely.
export type DelayAction = {
  type: "delay";
  id?: string;
  appId?: string;
  content?: string;
  value?: number; // milliseconds
};

export type WaitAction = {
  type: "wait";
  id?: string;
  appId?: string;
  content?: string;
  key?: number | string;
};

export type MoveAction = {
  type: "move";
  id?: string;
  appId: string; // references a Position.appId
  content?: string;
  servos?: Servo[];
};

export type Action = DelayAction | WaitAction | MoveAction;
