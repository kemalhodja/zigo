import { isCapacitorClient } from "@/lib/client/capacitor-runtime";

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(",");
  const mimeMatch = /data:(.*?);base64/.exec(header ?? "");
  const mime = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(data ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

async function pickWithCapacitorCamera(source: "camera" | "gallery"): Promise<File | null> {
  try {
    const cameraModule = await import("@capacitor/camera");
    const { Camera, CameraResultType, CameraSource } = cameraModule;
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.DataUrl,
      source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      correctOrientation: true,
    });

    if (!photo.dataUrl) return null;
    const extension = photo.format === "png" ? "png" : "jpg";
    return dataUrlToFile(photo.dataUrl, `profile-${Date.now()}.${extension}`);
  } catch {
    return null;
  }
}

function pickWithFileInput(options: { capture?: boolean }): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (options.capture) {
      input.setAttribute("capture", "environment");
    }
    input.style.display = "none";
    document.body.appendChild(input);

    const cleanup = () => {
      if (document.body.contains(input)) {
        input.remove();
      }
    };

    input.addEventListener(
      "change",
      () => {
        const file = input.files?.[0] ?? null;
        cleanup();
        resolve(file);
      },
      { once: true },
    );

    input.click();
  });
}

/** Camera or device gallery → File for /api/profile/upload */
export async function pickProfilePhoto(source: "camera" | "gallery"): Promise<File | null> {
  if (isCapacitorClient()) {
    const nativeFile = await pickWithCapacitorCamera(source);
    if (nativeFile) return nativeFile;
  }

  return pickWithFileInput({ capture: source === "camera" });
}
