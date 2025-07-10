import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

let imageSegmenter: ImageSegmenter | null = null;

export async function loadImageSegmenter() {
  if (imageSegmenter) return imageSegmenter;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
    },
    runningMode: "VIDEO",
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });

  return imageSegmenter;
}

export async function applyBackgroundBlur(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  blurAmount: number = 20,
  overlayOpacity: number = 0.25
) {
  try {
    if (!imageSegmenter) throw new Error("ImageSegmenter not loaded");

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // Remove segmentation throttling: always run segmentation
    const result = await imageSegmenter.segmentForVideo(video, Date.now());
    const mask = result.categoryMask?.getAsUint8Array() || null;
    if (!mask) {
      return;
    }

    // Check mask size
    if (mask.length !== width * height) {
      return;
    }

    // 1. Draw original video frame first
    ctx.drawImage(video, 0, 0, width, height);
    const originalData = ctx.getImageData(0, 0, width, height);

    // 2. Create blurred version
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d")!;

    tempCtx.filter = `blur(${blurAmount}px)`;
    tempCtx.drawImage(video, 0, 0, width, height);
    const blurredData = tempCtx.getImageData(0, 0, width, height);

    // 3. Composite with feathered edges
    for (let i = 0; i < mask.length; i++) {
      const idx = i * 4;
      let alpha = 0; // 0 = person, 1 = background
      if (mask[i] < 96) {
        alpha = 0; // person
      } else if (mask[i] > 160) {
        alpha = 1; // background
      } else {
        alpha = (mask[i] - 96) / (160 - 96); // smooth blend
      }
      // Blend: result = (1-alpha)*original + alpha*blurred
      for (let c = 0; c < 3; c++) {
        originalData.data[idx + c] =
          originalData.data[idx + c] * (1 - alpha) +
          blurredData.data[idx + c] * alpha;
      }
    }

    // 4. Optional overlay on background only (use alpha for background)
    if (overlayOpacity > 0) {
      for (let i = 0; i < mask.length; i++) {
        let alpha = 0;
        if (mask[i] < 96) {
          alpha = 0;
        } else if (mask[i] > 160) {
          alpha = 1;
        } else {
          alpha = (mask[i] - 96) / (160 - 96);
        }
        if (alpha > 0.5) {
          const idx = i * 4;
          originalData.data[idx] =
            originalData.data[idx] * (1 - overlayOpacity);
          originalData.data[idx + 1] =
            originalData.data[idx + 1] * (1 - overlayOpacity);
          originalData.data[idx + 2] =
            originalData.data[idx + 2] * (1 - overlayOpacity);
        }
      }
    }

    // 5. Render final frame
    ctx.putImageData(originalData, 0, 0);
  } catch (err) {
    console.error("[Blur] Error in applyBackgroundBlur:", err);
  }
}
