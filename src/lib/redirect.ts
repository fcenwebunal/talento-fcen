import { NextResponse } from "next/server";

// Behind App Hosting the request origin is the container's internal address (https://0.0.0.0:8080),
// so route handlers redirect with a relative Location that the browser resolves against the public host.
export function localRedirect(path: string, status = 303) {
  return new NextResponse(null, { status, headers: { Location: path } });
}
