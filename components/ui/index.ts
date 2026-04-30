// VeRAX Physical Depth — shared component library
// All new components added in this session (additive — existing ui/ files unchanged)

export { NeuCard, NeuGroove } from "./neu-card";
export { NeuButton }          from "./neu-button";
export {
  NeuInput,
  NeuTextarea,
  NeuSelect,
  NeuLabel,
  NeuField,
}                             from "./neu-input";
export { NeuToggle }          from "./neu-toggle";
export { NeuKnob }            from "./neu-knob";
export { Gauge }              from "./gauge";
export { LEDDisplay }         from "./led-display";
export { FuelGauge }          from "./fuel-gauge";
export { StatusDot }          from "./status-dot";
export { PaperDoc, PaperRule } from "./paper-doc";
export { VeRAXSidebar }       from "./sidebar";
export { HeaderMetal }        from "./header-metal";

// Hooks
export { useKnob }            from "@/lib/hooks/useKnob";
export { useInvoiceCalculator } from "@/lib/hooks/useInvoiceCalculator";
