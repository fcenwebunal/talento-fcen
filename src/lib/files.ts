export function fileNameFrom(disposition: string, fallback = "archivo") {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {}
  }
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? fallback;
}

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  // Revoking right away can cancel the download while the browser still reads the blob
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Opens the tab during the click and points it to the URL once it is ready: a window.open after an await
 * loses the user activation on slow connections and the browser blocks it as a popup.
 */
export async function openInNewTab(getUrl: () => Promise<string | null>) {
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  const url = await getUrl().catch(() => null);
  if (!url) {
    tab?.close();
    return false;
  }
  if (!tab) return false;
  tab.location.href = url;
  return true;
}
