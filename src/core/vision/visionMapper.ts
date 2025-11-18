export type UserEmotion = 'happy' | 'neutral' | 'surprised';

interface Landmark {
  x: number;
  y: number;
  z: number;
}

function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function mapFaceToEmotion(results: any): UserEmotion {
  const landmarks: Landmark[] | undefined = results?.multiFaceLandmarks?.[0];
  if (!landmarks || landmarks.length < 300) {
    return 'neutral';
  }
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const mouthWidth = distance(leftMouth, rightMouth);
  const mouthHeight = distance(upperLip, lowerLip);
  if (mouthWidth <= 0) {
    return 'neutral';
  }
  const ratio = mouthHeight / mouthWidth;
  if (ratio > 0.07) {
    return 'surprised';
  }
  if (ratio > 0.035) {
    return 'happy';
  }
  return 'neutral';
}
