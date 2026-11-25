# Project context

A summary of everything currently in the `MLUY/testme` repository, so it can be used as a starting point for new code.

## Branches

| Branch | Contents |
|---|---|
| `master` | Streamlit + salabim simulation (`testme.py`, `requirements.txt`) |
| `claude/project-planning-app-0vo215` | `master` plus a separate browser-based project planner (`index.html`, `style.css`, `app.js`, `README.md`) |
| `ccr-b6576fa8-2tifro` | `master` plus this `context/` folder |

---

## 1. Car driving simulation (`master`)

### `testme.py`
A **Streamlit** web app that runs a **salabim** discrete-event simulation of one car and plots the result with **matplotlib**.

- **Model:** A `Car` component (`sim.Component`) loops forever:
  1. **Drive** for a normally distributed time `Normal(d1, s1)` (mode `'drive'`). Distance driven = time × `speed`, where `speed = 3` (the comment says m/s).
  2. Add that distance to a running total and record it in the monitor `holding` (`sim.Monitor('holding_time')`).
  3. **Take a coffee break** for `Normal(b1, s2)` (mode `'break'`) and record the total again.
- **User interface (Streamlit):** two columns (width ratio 3:1).
  - Left column: `drive time min` slider (10–120) and `break time min` slider (10–120).
  - Right column: two sliders both labelled `standard deviation min` (1–5 for driving, 1–2 for breaks).
  - A **"click to run"** button builds a new `Car` and runs the environment until `t = 1000`.
- **Output:** `holding.xt()` returns the tallied distance over time, which is plotted as a "distance driven" line in a 15×5 figure shown with `st.write(fig)`.

### `requirements.txt`
```
matplotlib==3.4.2
numpy==1.21.1
scikit_learn==1.0.1
streamlit==1.1.0
salabim==21.1.4
```
(`numpy` and `scikit_learn` are listed but not used by `testme.py`.)

### Things to know before building on it
- The two right-hand sliders share the same label. In newer Streamlit versions this raises a `DuplicateWidgetID` error, so they need distinct labels or `key=` values.
- The `env`, `holding` monitor and a `Car` are created at module level on **every** Streamlit rerun, and a car exists before the button is pressed. The `del car` and new `Car` inside the button handler do not reset `env` or `holding`, so the first car is still scheduled in the same environment.
- Time units are mixed: the sliders say "min", but `speed` is in m/s and the simulation runs for 1000 time units with no explicit unit.
- The Python versions pinned in `requirements.txt` date from 2021 and may not install on current Python releases.
- Nothing is cached (`st.cache_data`/`st.session_state`), so every slider move re-creates the model.

Run it with:
```sh
pip install -r requirements.txt
streamlit run testme.py
```

---

## 2. Project planner web app (`claude/project-planning-app-0vo215`)

A static, dependency-free web app with no build step. Open `index.html` in a browser.

| File | Purpose |
|---|---|
| `index.html` | Page layout: a task table (Task, Start date, Duration (days), End date, delete) and a Gantt chart section |
| `style.css` | Styling for the table and the Gantt chart |
| `app.js` | Adding, editing and deleting tasks, rendering the Gantt chart, saving to `localStorage` |
| `README.md` | Usage notes |

Main behaviour:
- Each task has an `id`, `title`, `start` (YYYY-MM-DD) and `duration` (whole days, at least 1). The end date is inclusive, so a 1-day task ends on its start date.
- Dates are handled as UTC midnight to avoid daylight-saving bugs.
- The Gantt chart uses 28 px per day, shades weekends and marks today with an orange line. It redraws whenever a task changes.
- Tasks are saved under the `localStorage` key `project-planner.tasks.v1`. On first launch the app shows four sample tasks.
