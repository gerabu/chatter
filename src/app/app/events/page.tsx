import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WeeklyCalendar } from "../_components/WeeklyCalendar";

export default async function EventsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth/signin");
  }

  const events = await prisma.event.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: { dateISO: "asc" },
  });

  return <WeeklyCalendar events={events.map(({ id, title, dateISO }) => ({ id, title, dateISO }))} />;
}
