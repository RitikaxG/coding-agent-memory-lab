/*
Agent-Computer Interface layer

The agent does not perform random actions.

It acts through structured tools:
search_code → read_file → suggest_edit → run_command → write_memory

*/
export type AgentToolName =
  | "search_code"
  | "read_file"
  | "suggest_edit"
  | "run_command"
  | "write_memory";

export type AgentStep = {
  step: number;
  tool: AgentToolName;
  reason: string;
  input: Record<string, unknown>;
  expectedObservation: string;
  memoryInfluenced: boolean;
};

export type SimulatedAgentRun = {
  mode: "with_memory" | "without_memory";
  task: string;
  steps: AgentStep[];
  validationSummary: {
    shouldRun: string[];
    safetyChecks: string[];
    expectedOutcome: string;
  };
};