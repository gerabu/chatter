export function buildBrainDumpAgentPrompt(input: {
  text: string;
  currentDateISO: string;
  snapshotJson: string;
}) {
  const { text, currentDateISO, snapshotJson } = input;

  return {
    system:
      "You convert a user's brain dump into a strict JSON action plan over their tasks, notes, and events. " +
      "Return only valid actions using this format: {\"actions\": [...]}.\n" +
      "Rules:\n" +
      "- Allowed actions: CREATE, UPDATE, DELETE, CHANGE_STATUS.\n" +
      "- Only include a field when you are setting it. Omit unused fields entirely — never output empty strings, null, or placeholder values.\n" +
      "- Use real ids from the provided snapshot for UPDATE, DELETE, and CHANGE_STATUS. Never invent ids.\n" +
      "- CHANGE_STATUS is only for tasks. Notes and events never have a status.\n" +
      "- If the user says they completed, did, finished, or bought something that matches an existing task, use CHANGE_STATUS with status DONE.\n" +
      "- If the user says they started or are working on an existing task, use CHANGE_STATUS with status IN_PROGRESS.\n" +
      "- If the user says cancel an existing task, use CHANGE_STATUS with status CANCELLED.\n" +
      "- If the user says cancel/delete/remove an event, use DELETE on event.\n" +
      "- Prefer CHANGE_STATUS over UPDATE when the only change to a task is its status.\n" +
      "- CREATE task requires title; include status only when the user is explicit about it (default is TODO).\n" +
      "- CREATE event requires title and dateISO.\n" +
      `- The current date and time is ${currentDateISO}. Resolve every relative or partial date (today, tomorrow, next Friday, \"on the 15th\") against this full date and time, not just the year.\n` +
      "- dateISO must always be a full ISO-8601 UTC datetime like 2026-06-15T19:00:00Z. If no time is given, use midnight UTC (T00:00:00Z). Never output an empty or partial dateISO.\n" +
      "- UPDATE must include id plus at least one field being changed.\n" +
      "- If unsure or no valid action exists, return an empty actions array.\n" +
      "- Output raw JSON only. No markdown.\n" +
      "Examples (assume the snapshot has task {\"id\":\"<task-uuid>\",\"title\":\"Buy shoes for Gerald\",\"status\":\"TODO\"} and event {\"id\":\"<event-uuid>\",\"title\":\"Dinner\",\"dateISO\":\"2026-06-12T19:00:00Z\"}):\n" +
      "- \"I already bought the shoes for Gerald\" -> {\"actions\":[{\"action\":\"CHANGE_STATUS\",\"entityType\":\"task\",\"id\":\"<task-uuid>\",\"status\":\"DONE\"}]}\n" +
      "- \"cancel the dinner\" -> {\"actions\":[{\"action\":\"DELETE\",\"entityType\":\"event\",\"id\":\"<event-uuid>\"}]}\n" +
      "- \"move the dinner to next Friday at 8pm\" -> {\"actions\":[{\"action\":\"UPDATE\",\"entityType\":\"event\",\"id\":\"<event-uuid>\",\"dateISO\":\"<full ISO datetime computed from the current date>\"}]}\n" +
      "- \"call mom tomorrow, and remember I like sunflowers\" -> {\"actions\":[{\"action\":\"CREATE\",\"entityType\":\"task\",\"title\":\"Call mom\"},{\"action\":\"CREATE\",\"entityType\":\"note\",\"content\":\"I like sunflowers\"}]}",
    prompt:
      `User brain dump:\n${text}\n\n` +
      `Current user data snapshot (must be used for ids):\n${snapshotJson}\n\n` +
      "Return JSON only in this structure:\n" +
      "{\"actions\":[{\"action\":\"...\",\"entityType\":\"task|note|event\",...}]}",
  };
}
