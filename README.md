# Health Planner

A personal planner for meals, supplements, cabinet stock, and reminders. It opens with one starter plan and can be cleared for someone else. There are no accounts in this version. Everything you check off stays in this browser.

## Medical boundary

The starter plan organizes an April 2026 dermatology sheet around a later problem: appetite is down and strength is down. It is not a new prescription.

- Vitamin D continues at 2000 IU with breakfast, with a teaspoon of coconut oil. Magnesium is one 200 mg capsule at night, except on a Jamieson night.
- Omega-3 is two softgels a day, with food. A probiotic is one capsule with breakfast.
- Forcapil and Perfectil alternate, then Forcapil continues alone until Perfectil is refilled.
- Ashwagandha is one capsule at night for eight weeks, then a two-week pause. The bottle's 6000 mg figure is the label claim. The dose is one capsule.
- Centrum EC4 is one tablet with breakfast, except on a Jamieson day. It does not replace the two vitamin D softgels.
- Jamieson Power for Men is 3 caplets with lunch every 5th day. That morning skips Centrum, and that night skips the separate magnesium.
- Zaatar is a pinch on Sunday, Tuesday, and Thursday. Fenugreek seeds are a pinch every 5th day, off the Jamieson days. Clove is a pinch in cooking on Wednesday and Saturday, never an oil.
- Zinc 50 mg stays off. One tablet is above the usual daily upper limit, and Centrum, the hair capsule, and Jamieson already contain zinc.
- Selenium and iron are not on the buy list. The Centrum tablet is the iron already in the plan.
- Minoxidil is applied to a dry scalp twice a day, morning and night. The bottle is not given a run-out date.

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

Open the printed local address. On a phone-width window, the three sections sit along the bottom: Today, Plan, and Groceries. On a wide window they sit in the left rail, and the page uses the width of the window up to 1280 pixels.

Today can move to yesterday, tomorrow, and later days. Nothing is scheduled before 18 October 2026. Timeline is the checklist, and each time can be opened or closed. Plates turns the same day into four meals you can tap.

Daylight and Lamp sit at the top of every page. Daylight is the warm paper. Lamp is the evening green and gold.

Four other layouts are sketched in [view-ideas.html](https://zoubiromar.github.io/Health-Planner/view-ideas.html). That page is only for comparing them. The planner itself stays on the timeline.

`npm run build` typechecks and writes `dist/`.

## iPhone reminders

Browser notifications are a poor fit for iPhone. Today and Plan both have **Add alerts to iPhone**. That builds a calendar file with six repeating alerts:

1. Mint tea and minoxidil
2. Breakfast and morning capsules
3. Lunch and the hair capsule
4. Afternoon snack
5. Dinner
6. Night capsules

Share the file to Calendar and allow the alerts. Checking a dose still happens in the planner. If you mark something out of stock, Today quiets that row. The calendar does not know the grocery week.

Add the page to your Home Screen from the browser share menu if you want it to open like an app.

## What you can change

Reminder times, profile, weekly weight, and stock counts are editable from Groceries, under Bottles on hand. The in-stock switch is yours: a dose you mark out of stock stays visible and does not count as missed. **I bought this** puts a refill back and adds the count. The daily plan does not stop because a bottle count hit zero.

Groceries is one week at a time for the year that starts 18 October 2026. A full week asks for 7 cups of yogurt, a bag of dried apricots, a bag of almonds, a bar of dark chocolate, and a bunch of mint. A short week asks for fewer cups. A supplement is added only in the week its count runs out.

**Start a blank plan** clears the schedule on this device and keeps the weight log. **Add a daily step** puts a new row on the timeline. **Restore the starter plan** brings the original schedule back.
