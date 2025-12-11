const cron = require("node-cron");
const Profile = require("./models/Profile");
const profileController = require("./controllers/profileController");

function parseTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return { h, m };
}

cron.schedule("* * * * *", async () => {
  console.log("Scheduler running...");

  const now = new Date();
  const currentDay = now.toLocaleString("en-US", { weekday: "long" });
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  const profiles = await Profile.findAll({
    where: { isScheduled: true }
  });

  for (const p of profiles) {
    const start = parseTime(p.scheduleStartTime);
    const end = parseTime(p.scheduleEndTime);

    const isDayMatch =
      !p.scheduleDays ||
      p.scheduleDays.length === 0 ||
      p.scheduleDays.includes(currentDay);

    const isStartMatch = start && start.h === currentH && start.m === currentM;
    const isEndMatch = end && end.h === currentH && end.m === currentM;

    if ((p.scheduleType === "TIME" || p.scheduleType === "BOTH") && isDayMatch) {
      if (isStartMatch) {
        console.log(`Activating profile by TIME: ${p.name}`);
        await profileController.activateProfile(
          { params: { id: p.id }, user: { userId: p.userId } },
          { json: () => {} }
        );
      }

      if (isEndMatch) {
        console.log(`Deactivating profile by TIME: ${p.name}`);
        await profileController.deactivateProfile(
          { params: { id: p.id }, user: { userId: p.userId } },
          { json: () => {} }
        );
      }
    }

    if (p.scheduleType === "CONDITION" || p.scheduleType === "BOTH") {
      if (p.autoActivate && p.scheduleCondition === p.lastConditionMet) {
        console.log(`Auto activating by CONDITION: ${p.name}`);
        await profileController.activateProfile(
          { params: { id: p.id }, user: { userId: p.userId } },
          { json: () => {} }
        );
      }
    }
  }
});
