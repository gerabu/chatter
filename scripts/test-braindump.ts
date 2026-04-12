import { processBrainDump } from "../src/app/actions/processBrainDump";

async function run() {
  const sample = "I need to walk the dog, cancel my doctor appointment, my best friend's birthday will be on Apr 24th, and remember that Bob's number is 555-1234";
  console.log(`Processing sample: "${sample}"...`);

  const result = await processBrainDump(sample);

  console.log("Result:");
  console.dir(result, { depth: null });
}

run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
