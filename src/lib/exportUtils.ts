import type { RepoItem } from "./api";

export type ExportFormat = "excel" | "txt";

function escapeCsvCell(cell: unknown): string {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Exports repository data to the selected format (Excel .csv or Text .txt)
 * using client-side Blob URLs.
 */
export function exportRepositories(
  items: RepoItem[],
  format: ExportFormat,
  query = "",
): { filename: string; count: number } {
  if (!items || items.length === 0) {
    throw new Error("No repositories to export");
  }

  const sanitizedQuery = (query || "all")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "results";

  const dateStr = new Date().toISOString().slice(0, 10);
  let blob: Blob;
  let filename = "";

  switch (format) {
    case "excel": {
      // Excel CSV with UTF-8 BOM (\uFEFF) so Excel on Windows and macOS decodes special characters and emojis properly
      const headers = [
        "Repository",
        "URL",
        "Description",
        "Stars",
        "Language",
        "Topics",
        "Last Pushed",
      ];

      const rows = items.map((item) => [
        item.full_name,
        item.url,
        item.description ?? "",
        item.stars,
        item.language ?? "Unknown",
        item.topics.join(", "),
        item.pushed ? new Date(item.pushed).toISOString().slice(0, 10) : "",
      ]);

      const csvBody = [
        headers.map(escapeCsvCell).join(","),
        ...rows.map((row) => row.map(escapeCsvCell).join(",")),
      ].join("\r\n");

      blob = new Blob(["\uFEFF" + csvBody], {
        type: "text/csv;charset=utf-8;",
      });
      filename = `sih-prototypes-${sanitizedQuery}-${dateStr}.csv`;
      break;
    }

    case "txt": {
      const divider = "=".repeat(78);
      const subDivider = "-".repeat(78);
      const lines: string[] = [
        divider,
        "SIH PROTOTYPE FINDER - EXPORTED REPOSITORIES",
        `Search Query: ${query || "(All results)"}`,
        `Export Date:  ${new Date().toLocaleString()}`,
        `Total Repos:  ${items.length}`,
        divider,
        "",
      ];

      items.forEach((item, index) => {
        lines.push(`[${index + 1}] ${item.full_name}`);
        lines.push(`    URL:         ${item.url}`);
        lines.push(`    Stars:       ⭐ ${item.stars.toLocaleString()}`);
        lines.push(`    Language:    ${item.language ?? "Unknown"}`);
        if (item.topics.length > 0) {
          lines.push(`    Topics:      ${item.topics.join(", ")}`);
        }
        lines.push(
          `    Last Pushed: ${item.pushed ? item.pushed.slice(0, 10) : "N/A"}`,
        );
        lines.push(
          `    Description: ${item.description || "No description provided."}`,
        );
        lines.push(subDivider);
      });

      const txtContent = lines.join("\n");
      blob = new Blob([txtContent], {
        type: "text/plain;charset=utf-8;",
      });
      filename = `sih-prototypes-${sanitizedQuery}-${dateStr}.txt`;
      break;
    }
  }

  // Create temporary Blob URL for download
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Clean up object URL
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);

  return { filename, count: items.length };
}
