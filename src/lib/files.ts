/** Saves a file. Inside Claude it uses the viewer’s download prompt; everywhere else, a normal download. */
export async function saveFile(filename: string, data: Blob) {
  const host = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude;
  if (host?.use) {
    try {
      const dl = (await host.use("downloads")) as { save: (o: { filename: string; data: Blob }) => Promise<unknown> } | null;
      if (dl) {
        await dl.save({ filename, data });
        return;
      }
    } catch (e) {
      if ((e as { code?: string })?.code === "declined") return;
    }
  }
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/** Turns the first SVG inside an element (a Recharts chart) into a PNG. */
export async function svgToPng(container: HTMLElement | null, background: string): Promise<Blob | null> {
  const svg = container?.querySelector("svg.recharts-surface") as SVGSVGElement | null;
  if (!svg) return null;
  const { width, height } = svg.getBoundingClientRect();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.style.fontFamily = "Nunito, system-ui, sans-serif";
  const src = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  const scale = 2;
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("render failed"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
  });
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
}
