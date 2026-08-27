export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const cols = Object.keys(data[0]);
  const csv = [
    cols.join(","),
    ...data.map((row) =>
      cols
        .map((c) => {
          const v = row[c];
          if (v === null || v === undefined) return "";
          const s = String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
