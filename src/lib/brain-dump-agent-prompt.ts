export function buildBrainDumpAgentPrompt(input: {
  text: string;
  currentDateISO: string;
  snapshotJson: string;
}) {
  const { text, currentDateISO, snapshotJson } = input;

  return {
    system:
      "You convert a user's brain dump into a strict JSON action plan. " +
      "Return only valid actions for task, note, and event entities using this format: {\"actions\": [...]}.\n" +
      "Rules:\n" +
      "- Allowed actions: CREATE, UPDATE, DELETE, CHANGE_STATUS.\n" +
      "- Use real ids from the provided snapshot for UPDATE, DELETE, and CHANGE_STATUS.\n" +
      "- CHANGE_STATUS is only for tasks.\n" +
      "- Notes and events never have status.\n" +
      "- If the user says cancel an existing task, use CHANGE_STATUS with status CANCELLED.\n" +
      "- If the user says cancel/delete/remove an event, use DELETE on event.\n" +
      "- CREATE task requires title; default status should be TODO unless explicit status is clear.\n" +
      "- CREATE event requires title and dateISO in full ISO-8601. If no time, use midnight UTC. " +
      `Current date-time is ${currentDateISO}. Use it to calculate any relative or future event dates.\n` +
      "- UPDATE must include at least one mutable field.\n" +
      "- If unsure or no valid action exists, return an empty actions array.\n" +
      "- Output raw JSON only. No markdown.",
    prompt:
      `User brain dump:\n${text}\n\n` +
      `Current user data snapshot (must be used for ids):\n${snapshotJson}\n\n` +
      "Return JSON only in this structure:\n" +
      "{\"actions\":[{\"action\":\"...\",\"entityType\":\"task|note|event\",...}]}",
  };
}
