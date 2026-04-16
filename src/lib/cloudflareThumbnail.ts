export function getSmartThumbnail(streamUid: string) {
  // We choose 15s as a "safe visual frame"
  const time = 15;

  return `https://videodelivery.net/${streamUid}/thumbnails/thumbnail.jpg?time=${time}s`;
}