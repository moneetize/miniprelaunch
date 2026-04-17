const DEFAULT_PROFILE_PHOTO_MAX_LENGTH = 110000;
const OUTPUT_SIZES = [320, 280, 240, 200, 160] as const;
const JPEG_QUALITIES = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34] as const;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      cleanup();
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('Unable to read this image size.'));
        return;
      }
      resolve(image);
    };

    image.onerror = () => {
      cleanup();
      reject(new Error('Unable to process this image. Please try a JPG, PNG, or WebP photo.'));
    };

    image.src = objectUrl;
  });
}

function renderSquareImage(image: HTMLImageElement, outputSize: number) {
  const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, Math.round((image.naturalWidth - cropSize) / 2));
  const sourceY = Math.max(0, Math.round((image.naturalHeight - cropSize) / 2));
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to process this image.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, outputSize, outputSize);

  return canvas;
}

export async function resizeProfilePhoto(file: File, maxLength = DEFAULT_PROFILE_PHOTO_MAX_LENGTH): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const image = await loadImageFromFile(file);
  let smallestPhoto = '';

  for (const outputSize of OUTPUT_SIZES) {
    const canvas = renderSquareImage(image, outputSize);

    for (const quality of JPEG_QUALITIES) {
      const photo = canvas.toDataURL('image/jpeg', quality);
      if (!smallestPhoto || photo.length < smallestPhoto.length) {
        smallestPhoto = photo;
      }

      if (photo.length <= maxLength) {
        return photo;
      }
    }
  }

  if (smallestPhoto) {
    return smallestPhoto;
  }

  throw new Error('Unable to process this image. Please try another photo.');
}
