import imageCompression from "browser-image-compression";

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 4,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  return imageCompression(file, options);
};