"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStatus = exports.TrafficPattern = exports.ScenarioStatus = exports.RunStatus = exports.SimulationMode = void 0;
var SimulationMode;
(function (SimulationMode) {
    SimulationMode["SANDBOX"] = "sandbox";
    SimulationMode["SHADOW"] = "shadow";
    SimulationMode["PRODUCTION"] = "production";
})(SimulationMode || (exports.SimulationMode = SimulationMode = {}));
var RunStatus;
(function (RunStatus) {
    RunStatus["PENDING"] = "pending";
    RunStatus["APPROVED"] = "approved";
    RunStatus["DISPATCHED"] = "dispatched";
    RunStatus["RUNNING"] = "running";
    RunStatus["COMPLETED"] = "completed";
    RunStatus["FAILED"] = "failed";
    RunStatus["CANCELLED"] = "cancelled";
})(RunStatus || (exports.RunStatus = RunStatus = {}));
var ScenarioStatus;
(function (ScenarioStatus) {
    ScenarioStatus["DRAFT"] = "draft";
    ScenarioStatus["PUBLISHED"] = "published";
    ScenarioStatus["ARCHIVED"] = "archived";
})(ScenarioStatus || (exports.ScenarioStatus = ScenarioStatus = {}));
var TrafficPattern;
(function (TrafficPattern) {
    TrafficPattern["STEADY"] = "steady";
    TrafficPattern["RAMP"] = "ramp";
    TrafficPattern["BURST"] = "burst";
    TrafficPattern["VIRAL"] = "viral";
    TrafficPattern["STEP"] = "step";
})(TrafficPattern || (exports.TrafficPattern = TrafficPattern = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["SPAWNED"] = "spawned";
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["COMPLETED"] = "completed";
    AgentStatus["FAILED"] = "failed";
    AgentStatus["LOOP_DETECTED"] = "loop_detected";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
//# sourceMappingURL=simulation.types.js.map