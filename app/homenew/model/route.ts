// Only the experimental /homenew experience uses this model. Do not use it
// as a depiction of AUC's actual campus: it is an external photo scan.
const SOURCE =
  "https://huggingface.co/datasets/Matt1up/drone-building-scans/resolve/main/flat-roof/model/flat-roof.glb";

// Source: Matt1up/drone-building-scans, licensed CC BY 4.0.
// This endpoint streams the model as same-origin data to avoid browser CORS
// issues with the source CDN's redirect chain.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const probe = new URL(request.url).searchParams.get("probe") === "1";
    const upstream = await fetch(SOURCE, {
      cache: "no-store",
      headers: probe ? { Range: "bytes=0-127" } : { Accept: "application/octet-stream" }
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("The 3D model is temporarily unavailable.", {
        status: 502, headers: { "Content-Type": "text/plain" }
      });
    }
    if (probe) {
      // Only read the first chunk; confirm the source really is a GLB.
      const reader = upstream.body.getReader();
      const first = await reader.read();
      await reader.cancel();
      const bytes = first.value;
      const valid = bytes && bytes.byteLength >= 12;
      const view = valid ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength) : null;
      const magic = bytes ? String.fromCharCode(...Array.from(bytes.slice(0, 4))) : "";
      return Response.json({
        ok: valid && magic === "glTF" && view?.getUint32(4, true) === 2,
        magic,
        version: view?.getUint32(4, true) ?? null,
        declaredBytes: view?.getUint32(8, true) ?? null,
        source: "Matt1up/drone-building-scans",
        license: "CC BY 4.0"
      });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return new Response("The 3D model is temporarily unavailable.", {
      status: 502, headers: { "Content-Type": "text/plain" }
    });
  }
}
