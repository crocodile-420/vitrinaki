export const getImageUrl = (image: string) => {
  return image.replace(
    'http://localhost:9100/',
    process.env.MEDUSA_BACKEND_URL || ''
  );
};
