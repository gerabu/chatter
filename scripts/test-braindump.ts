import { applyBrainDumpActions } from "../src/app/actions/applyBrainDumpActions";
import { suggestBrainDumpActions } from "../src/app/actions/suggestBrainDumpActions";

async function run() {
  const sample = "I need to walk the dog, cancel my doctor appointment, my best friend's birthday will be on Apr 24th, and remember that Bob's number is 555-1234";
  console.log(`Processing sample: "${sample}"...`);

  const suggestion = await suggestBrainDumpActions(sample);
  console.log("Suggested actions:");
  console.dir(suggestion, { depth: null });

  if (!suggestion.success || suggestion.actions.length === 0) {
    return;
  }

  const result = await applyBrainDumpActions(suggestion.actions);

  console.log("Apply result:");
  console.dir(result, { depth: null });
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
