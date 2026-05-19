import {
  type RouteConfig,
  index,
  route,
  prefix,
} from "@react-router/dev/routes";

const MEMBERS = ["antoliny", "dium", "kob", "peat"] as const;

export default [
  index("routes/home.tsx"),
  ...prefix("problem/", MEMBERS.map((name) => route(`${name}/`, `problems/${name}/problem.jsx`))),
  ...prefix("solve/", MEMBERS.map((name) => route(`${name}/`, `problems/${name}/solve.jsx`))),
  route("problem/less/", "problems/less/problem.jsx"),
  route("solve/less/1/", "problems/less/solve1.jsx"),
  route("solve/less/2/", "problems/less/solve2.jsx"),
  route("solve/less/3/", "problems/less/solve3.jsx"),
  route("solve/less/4/", "problems/less/solve4.jsx"),
] satisfies RouteConfig;
