# Project Planner

A small, dependency-free web app for planning a project: list your tasks in a table and get a Gantt chart that updates as you type.

## Features

- Add, edit and delete tasks. Each task has a **title**, **start date** and **duration in days**.
- The end date is calculated for you. A 1-day task starts and ends on the same day.
- A Gantt chart below the table redraws instantly whenever you change a task. Weekends are shaded and today is marked with an orange line.
- Tasks are saved in your browser's `localStorage`, so they are still there after a page refresh.

## How to run

No install or build step needed.

1. Clone or download this repository.
2. Open `index.html` in any modern browser (double-click it, or drag it into a browser window).

That's it. If you'd rather serve it over HTTP, any static server works, e.g.:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

| File         | Purpose                                  |
|--------------|------------------------------------------|
| `index.html` | Page structure                           |
| `style.css`  | Styling for the table and Gantt chart    |
| `app.js`     | Task editing, Gantt rendering, storage   |

## Notes

- On first launch the app shows a few example tasks; delete them to start fresh.
- Data is stored per browser and per origin. Opening the file in a different browser, or via `file://` vs. `http://`, gives you a separate task list.
- To wipe everything, delete all tasks, or clear the `project-planner.tasks.v1` key from your browser's local storage.
