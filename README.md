# Health Planner

A personal planner for meals, supplements, cabinet stock, and reminders. It opens with one starter plan and can be cleared for someone else. There are no accounts in this version. Everything you check off stays in this browser.

## Medical boundary

The starter plan organizes an April 2026 dermatology sheet around a later problem: appetite is down and strength is down. It is not a new prescription.

- Vitamin D continues at 2000 IU with breakfast. Magnesium continues as one 200 mg capsule at night.
- Omega-3 is two softgels a day, with food. A probiotic is one capsule with breakfast.
- Forcapil and Perfectil alternate, then Forcapil continues alone until you pause it.
- Ashwagandha is one capsule at night for eight weeks, then a two-week pause. The bottle's 6000 mg figure is the label claim. The dose is one capsule.
- Centrum EC4 is one tablet with breakfast. It does not replace the two vitamin D softgels. A tablet already includes some vitamin D, zinc, selenium, and iron, so the 50 mg zinc tablet stays off.
- Zinc 50 mg and Jamieson Power for Men start paused. One 50 mg zinc tablet is above the usual daily upper limit, and the Jamieson label dose stacks zinc and magnesium on top of the evening capsule.
- Selenium and iron are not on the buy list. The Centrum tablet is the iron already in the plan.
- Minoxidil is applied to a dry scalp twice a day, morning and night.

Show the schedule to your doctor if you want it confirmed. Repeat vitamin D and magnesium around 12 January 2027, and ask about ferritin before any iron or extra zinc.

## Privacy

This repository is public. The starter schedule is in the app. Your name, prescription photo, and clinic contacts are not. Checks, stock, weight, and profile edits stay in `localStorage` on the device. Do not commit personal notes or exports into the repo.

## Open it

The public address is [https://zoubiromar.github.io/Health-Planner/](https://zoubiromar.github.io/Health-Planner/).

GitHub Pages has to be switched on once before that address answers. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. The next deploy then publishes the site. On an iPhone, open the link in Safari, tap Share, and choose **Add to Home Screen**.

`localhost` only works on a computer where you have started the app yourself. The “connection refused” page means nothing is running there.

## Run it locally

```bash
npm install
npm test
npm run dev
```

Open the printed local address. On a phone-width window, the four sections sit along the bottom: Today, Plan, Cabinet, and Groceries. On a wide window they sit in the left rail.

Today can move to yesterday, tomorrow, and later days. Nothing is scheduled before 18 October 2026. List, Timeline, and Hours are three ways to see the same checklist. List groups the day into morning, midday, and evening. Timeline follows the clock down the page. Hours lays each time in a card you can swipe.

`npm run build` typechecks and writes `dist/`.

## iPhone reminders

Browser notifications are a poor fit for iPhone. Today and Plan both have **Add alerts to iPhone**. That builds a calendar file with six repeating alerts:

1. Mint tea and minoxidil
2. Breakfast and morning capsules
3. Lunch and the hair capsule
4. Afternoon snack
5. Dinner
6. Night capsules

Share the file to Calendar and allow the alerts. Checking a dose still happens in the planner. If you mark something out of stock, Today quiets that row. The calendar does not know the cabinet.

Add the page to your Home Screen from the browser share menu if you want it to open like an app.

## What you can change

Reminder times, profile, weekly weight, and stock counts are editable. The in-stock switch is yours: a dose you mark out of stock stays visible and does not count as missed. **I bought this** puts it back and adds the count you enter. The daily plan does not stop because a bottle count hit zero.

**Start a blank plan** clears the schedule on this device and keeps the weight log. **Add a daily step** puts a new row on the timeline. **Restore the starter plan** brings the original schedule back.
