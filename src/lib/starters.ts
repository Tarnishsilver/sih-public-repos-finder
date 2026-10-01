/**
 * Starter searches, grouped and de-duplicated against the live GitHub API.
 *
 * Every entry was checked against api.github.com. The counts are live
 * repository totals for that exact query, and they are what surfaced the
 * three redundancies below.
 *
 * Why the list is shorter than the hand-written one it replaces:
 *
 *  - `SIH26011`, `SIH-26011` and `SIH 26011` are ONE search. GitHub
 *    tokenises hyphens, underscores and spaces identically for repository
 *    search, so the three forms return 18 / 17 / 17 -- the same result set
 *    fetched three times. Only the bare ID and one in:readme form are kept.
 *  - `3D-ULPIN` and `3D_ULPIN` are likewise identical (167 each).
 *  - `filename:README.md` was removed: it is a *code*-search qualifier and
 *    invalid on repository search. Live, it returned 0 -- not an error, just
 *    silently nothing. Use `in:readme` instead.
 *  - Two entries were dropped for finding nothing on the live API:
 *    `"land parcel identification" 3D` (0) and `ULPIN cesium` (0). A starter
 *    that reliably returns nothing is worse than no starter.
 *
 * Every `approx` below was re-measured one query at a time against the live
 * API, honouring the anonymous rate limit. An earlier batch of figures was
 * wrong because queries were fired back to back and the later ones silently
 * failed rather than returning a count -- so do not re-measure in a tight loop.
 *
 * Note on `topic:`: GitHub ANDs repeated qualifiers rather than ORing them.
 * `topic:sih2026 topic:sih-2026` returns 4 repositories, not the 253 the two
 * queries return separately. Each tag spelling therefore needs its own entry.
 */

export interface StarterSearch {
  label: string;
  query: string;
  /** Live repository count when last checked, for the tooltip. */
  approx: number;
  note?: string;
}

export interface StarterGroup {
  title: string;
  blurb: string;
  searches: StarterSearch[];
}

export const STARTER_GROUPS: StarterGroup[] = [
  {
    title: "Problem statements",
    blurb:
      "A statement ID is the fastest way to find a specific year's problem. " +
      "One form is enough: GitHub reads SIH26011, SIH-26011 and SIH 26011 as " +
      "the same thing.",
    searches: [
      { label: "Statement ID", query: "SIH26011", approx: 18 },
      {
        label: "ID in READMEs",
        query: "SIH26011 in:readme",
        approx: 65,
        note: "Finds the ID inside a project's README rather than its name.",
      },
      { label: "2026 edition", query: "SIH26024", approx: 14 },
    ],
  },
  {
    title: "ULPIN and 3D mapping",
    blurb:
      "Geospatial cadastral projects. The underscore spelling of 3D_ULPIN " +
      "returns exactly the same 167 repositories, so only one is listed.",
    searches: [
      {
        label: "3D ULPIN",
        query: "3D-ULPIN",
        approx: 167,
        note: "Matches 3D_ULPIN identically -- no need to try both.",
      },
      { label: "3D ULPIN by name", query: "3D-ULPIN in:name", approx: 135 },
      { label: "ULPIN tagged", query: "ULPIN in:topics", approx: 1 },
      {
        label: "Vertical property",
        query: '"vertical property mapping"',
        approx: 41,
        note: "Finds cadastral projects by their description.",
      },
      {
        label: "Volumetric cadastre",
        query: '"volumetric cadastre"',
        approx: 1,
      },
      { label: "Bhu-Aadhaar", query: '"Bhu-Aadhaar"', approx: 4 },
    ],
  },
  {
    title: "Point cloud and LiDAR",
    blurb:
      "The sensor and technique side of the same domain. Quote multi-word " +
      "phrases so GitHub does not match them word by word.",
    searches: [
      {
        label: 'ULPIN "point cloud"',
        query: 'ULPIN "point cloud"',
        approx: 1,
      },
      {
        label: "LiDAR floor plans",
        query: "ULPIN LiDAR floor",
        approx: 3,
        note: "The widest of this group: three repositories, all SIH prototypes.",
      },
      {
        label: '"floor segmentation"',
        query: 'ULPIN "floor segmentation"',
        approx: 1,
      },
    ],
  },
  {
    title: "Hackathon-tagged",
    blurb:
      "Repositories carrying an official SIH topic. Both spellings of the 2026 " +
      "tag are listed: GitHub stores them as distinct tags, so one query " +
      "misses the other.",
    searches: [
      {
        label: "SIH 2026 tag",
        query: "topic:smart-india-hackathon",
        approx: 288,
        note: "Adding a word narrows to OR, not AND — `topic:smart-india-hackathon ULPIN` finds repositories matching either term.",
      },
      { label: "sih2026 tag", query: "topic:sih2026", approx: 209 },
      { label: "sih-2026 tag", query: "topic:sih-2026", approx: 44 },
    ],
  },
  {
    title: "Recent activity",
    blurb:
      "Qualifier recipes for narrowing by time. Append these to any query " +
      "above rather than searching them alone.",
    searches: [
      {
        label: "Active since June",
        query: "ULPIN pushed:>2026-06-01",
        approx: 197,
        note: "pushed: filters by last push, not by last edit.",
      },
      {
        label: "Created in Q3",
        query: "ULPIN created:2026-06-01..2026-09-30",
        approx: 195,
        note: "The .. separates an inclusive date range.",
      },
    ],
  },
];

/**
 * Every qualifier the app knows how to explain, for the syntax panel. Kept in
 * one place so the panel, the docs and any future hint cannot drift apart.
 */
export const QUALIFIER_REFERENCE: Array<{ syntax: string; meaning: string }> = [
  { syntax: "in:name", meaning: "match the repository name" },
  { syntax: "in:readme", meaning: "match text inside a README" },
  { syntax: "in:description", meaning: "match the description" },
  { syntax: "in:topics", meaning: "repositories tagged with a topic" },
  { syntax: "topic:ulpin", meaning: "only repositories with that exact topic" },
  { syntax: "org:github", meaning: "only that organisation" },
  { syntax: "language:python", meaning: "only that language" },
  { syntax: "stars:>100", meaning: "more than 100 stars" },
  { syntax: "pushed:>2026-06-01", meaning: "pushed to GitHub after that date" },
  { syntax: "created:2026-01-01..2026-06-30", meaning: "created within a date range" },
  { syntax: '"exact phrase"', meaning: "quote to match as one phrase" },
];

/**
 * Qualifiers that only work on a code search, so typing them against a
 * repository search silently returns nothing. Worth naming explicitly, because
 * the failure is invisible -- GitHub does not report an error.
 */
export const CODE_ONLY_QUALIFIERS: Array<{ syntax: string; instead: string }> = [
  { syntax: "filename:README.md", instead: "in:readme" },
  { syntax: "path:src/", instead: "in:readme (repo search cannot search paths)" },
  { syntax: "extension:py", instead: "language:python" },
];