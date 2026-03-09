// 动画配置 — 集中管理行为→动画映射
// 参考 AIRI 项目的模块化架构，将动画配置从渲染组件中分离

// 头部+身体动画目标值计算
export interface HeadBodyTarget {
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  bodyRotX: number;
  bodyRotZ: number;
  bodyPosY: number;
  leftBrowRotZ: number;
  rightBrowRotZ: number;
}

// 手臂动画目标值
export interface ArmTarget {
  leftArmRotZ: number;
  rightArmRotZ: number;
  leftArmRotX: number;
  rightArmRotX: number;
}

// 光环配置
export interface RingConfig {
  speed: number;
  wobble: number;
}

// 灯光强度
export function getLightIntensity(
  isSpeaking: boolean,
  isAnim: (name: string) => boolean,
): number {
  if (isAnim('excited') || isAnim('cheer') || isAnim('dance')) return 4;
  if (isSpeaking) return 3;
  if (isAnim('sleep')) return 0.8;
  if (isAnim('bow')) return 1.5;
  return 2;
}

// 光环动画配置
export function getRingConfig(
  currentBehavior: string,
  isSpeaking: boolean,
  isAnim: (name: string) => boolean,
): RingConfig {
  if (isAnim('wave') || isAnim('waveHand') || currentBehavior === 'greeting') {
    return { speed: 1.5, wobble: 0.3 };
  }
  if (isAnim('excited') || currentBehavior === 'excited') return { speed: 3.0, wobble: 0.5 };
  if (isAnim('cheer')) return { speed: 2.5, wobble: 0.4 };
  if (isAnim('dance')) return { speed: 2.0, wobble: 0.3 };
  if (isAnim('clap')) return { speed: 1.8, wobble: 0.2 };
  if (isAnim('thumbsUp') || isAnim('point')) return { speed: 1.0, wobble: 0 };
  if (isAnim('bow')) return { speed: 0.4, wobble: 0 };
  if (isAnim('sleep')) return { speed: 0.1, wobble: 0 };
  if (currentBehavior === 'thinking') return { speed: 0.8, wobble: 0 };
  if (isSpeaking) return { speed: 0.6, wobble: 0 };
  return { speed: 0.2, wobble: 0 };
}

// 计算头部+身体动画目标值
export function computeHeadBodyTarget(
  t: number,
  mouseX: number,
  mouseY: number,
  currentBehavior: string,
  isSpeaking: boolean,
  isAnim: (name: string) => boolean,
): HeadBodyTarget {
  let headRotX = -mouseY * 0.15;
  let headRotY = mouseX * 0.15;
  let headRotZ = 0;
  let bodyRotX = 0;
  let bodyRotZ = 0;
  let bodyPosY = 0;
  let leftBrowRotZ = 0.08;
  let rightBrowRotZ = -0.08;

  if (isAnim('nod') || currentBehavior === 'listening') {
    headRotX = Math.sin(t * 3.5) * 0.18;
    bodyRotX = Math.sin(t * 3.5) * 0.03;
  } else if (isAnim('shakeHead')) {
    headRotY = Math.sin(t * 5) * 0.35;
    bodyRotZ = Math.sin(t * 5) * 0.02;
  } else if (currentBehavior === 'thinking') {
    headRotZ = Math.sin(t * 0.8) * 0.12;
    headRotY = -0.15 + Math.sin(t * 0.5) * 0.08;
    headRotX = 0.05;
    bodyRotZ = Math.sin(t * 0.8) * 0.02;
  } else if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
    headRotZ = Math.sin(t * 2.5) * 0.1;
    headRotY = 0.1 + Math.sin(t * 3) * 0.05;
    headRotX = 0.05;
    bodyRotZ = -0.03;
    bodyPosY = Math.sin(t * 3) * 0.02;
  } else if (isAnim('bow')) {
    headRotX = -0.25;
    bodyRotX = -0.2 + Math.sin(t * 1.2) * 0.02;
  } else if (isAnim('headTilt')) {
    headRotZ = 0.3 + Math.sin(t * 1.5) * 0.06;
    headRotY = 0.12;
    headRotX = 0.05;
  } else if (isAnim('lookAround')) {
    headRotY = Math.sin(t * 1.2) * 0.55;
    headRotX = Math.sin(t * 2) * 0.1;
    bodyRotZ = Math.sin(t * 1.2) * 0.03;
  } else if (isAnim('sleep')) {
    headRotX = -0.35 + Math.sin(t * 0.4) * 0.03;
    headRotZ = 0.2 + Math.sin(t * 0.6) * 0.03;
    bodyRotX = -0.08;
  } else if (isAnim('shrug')) {
    headRotZ = Math.sin(t * 2.5) * 0.12;
    headRotY = Math.sin(t * 1.8) * 0.05;
    bodyPosY = 0.05;
  } else if (isAnim('cheer')) {
    headRotX = 0.2;
    headRotZ = Math.sin(t * 7) * 0.1;
    bodyPosY = Math.abs(Math.sin(t * 5)) * 0.12;
    bodyRotZ = Math.sin(t * 7) * 0.03;
  } else if (isAnim('point')) {
    headRotY = 0.25;
    headRotX = -0.05;
    bodyRotZ = -0.04;
  } else if (isAnim('clap')) {
    headRotX = 0.08;
    bodyPosY = Math.abs(Math.sin(t * 4)) * 0.03;
  } else if (isAnim('thumbsUp')) {
    headRotZ = -0.08;
    headRotY = 0.1;
  } else if (isAnim('crossArms')) {
    headRotX = 0.05;
    bodyRotX = 0.02;
  } else if (isAnim('excited') || currentBehavior === 'excited') {
    bodyPosY = Math.abs(Math.sin(t * 6)) * 0.15;
    headRotZ = Math.sin(t * 8) * 0.08;
  } else if (currentBehavior === 'speaking' || isSpeaking) {
    headRotY = mouseX * 0.1 + Math.sin(t * 1.5) * 0.05;
    headRotX = -mouseY * 0.05 + Math.sin(t * 2) * 0.03;
    bodyRotZ = Math.sin(t * 1.5) * 0.01;
  } else {
    // idle 呼吸动画
    bodyPosY = Math.sin(t * 1.2) * 0.012;
    headRotX = -mouseY * 0.1 + Math.sin(t * 0.8) * 0.015;
    headRotY = mouseX * 0.15 + Math.sin(t * 0.6) * 0.01;
    bodyRotZ = Math.sin(t * 0.9) * 0.005;
  }

  return { headRotX, headRotY, headRotZ, bodyRotX, bodyRotZ, bodyPosY, leftBrowRotZ, rightBrowRotZ };
}

// 计算手臂动画目标值
export function computeArmTarget(
  t: number,
  currentBehavior: string,
  isSpeaking: boolean,
  isAnim: (name: string) => boolean,
): ArmTarget & { extraBodyPosY?: number; extraBodyRotZ?: number } {
  let leftArmRotZ = Math.PI * 0.05;
  let rightArmRotZ = -Math.PI * 0.05;
  let leftArmRotX = 0;
  let rightArmRotX = 0;
  let extraBodyPosY: number | undefined;
  let extraBodyRotZ: number | undefined;

  if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
    rightArmRotZ = -Math.PI * 0.78 + Math.sin(t * 5) * 0.25;
    rightArmRotX = Math.sin(t * 5) * 0.15;
    leftArmRotZ = Math.PI * 0.12 + Math.sin(t * 2) * 0.03;
  } else if (isAnim('raiseHand')) {
    rightArmRotZ = -Math.PI * 0.65;
  } else if (currentBehavior === 'speaking' || isSpeaking) {
    leftArmRotZ = Math.PI * 0.18 + Math.sin(t * 2.5) * 0.06;
    rightArmRotZ = -Math.PI * 0.18 - Math.sin(t * 2.5 + 1.2) * 0.06;
    leftArmRotX = Math.sin(t * 3) * 0.08;
    rightArmRotX = Math.sin(t * 3 + 1) * 0.08;
  } else if (isAnim('excited') || currentBehavior === 'excited') {
    leftArmRotZ = Math.PI * 0.55 + Math.sin(t * 7) * 0.2;
    rightArmRotZ = -Math.PI * 0.55 - Math.sin(t * 7 + 0.5) * 0.2;
    leftArmRotX = Math.sin(t * 8) * 0.15;
    rightArmRotX = Math.sin(t * 8 + 0.3) * 0.15;
  } else if (isAnim('bow')) {
    leftArmRotZ = Math.PI * 0.03;
    rightArmRotZ = -Math.PI * 0.03;
    leftArmRotX = -0.15;
    rightArmRotX = -0.15;
  } else if (isAnim('clap')) {
    const clapPhase = Math.sin(t * 10);
    leftArmRotZ = Math.PI * 0.3 + clapPhase * 0.12;
    rightArmRotZ = -Math.PI * 0.3 - clapPhase * 0.12;
    leftArmRotX = -0.5 + clapPhase * 0.08;
    rightArmRotX = -0.5 + clapPhase * 0.08;
  } else if (isAnim('thumbsUp')) {
    rightArmRotZ = -Math.PI * 0.6;
    rightArmRotX = -0.3;
    leftArmRotZ = Math.PI * 0.1;
  } else if (isAnim('shrug')) {
    leftArmRotZ = Math.PI * 0.4 + Math.sin(t * 2) * 0.04;
    rightArmRotZ = -Math.PI * 0.4 - Math.sin(t * 2) * 0.04;
    leftArmRotX = -0.2;
    rightArmRotX = -0.2;
  } else if (isAnim('cheer')) {
    leftArmRotZ = Math.PI * 0.8 + Math.sin(t * 5) * 0.12;
    rightArmRotZ = -Math.PI * 0.8 - Math.sin(t * 5 + 0.4) * 0.12;
    leftArmRotX = Math.sin(t * 6) * 0.15;
    rightArmRotX = Math.sin(t * 6 + 0.5) * 0.15;
  } else if (isAnim('sleep')) {
    leftArmRotZ = Math.PI * 0.04;
    rightArmRotZ = -Math.PI * 0.04;
  } else if (isAnim('crossArms')) {
    leftArmRotZ = Math.PI * 0.3;
    rightArmRotZ = -Math.PI * 0.3;
    leftArmRotX = -0.4;
    rightArmRotX = -0.4;
  } else if (isAnim('point')) {
    rightArmRotZ = -Math.PI * 0.45;
    rightArmRotX = -0.55;
    leftArmRotZ = Math.PI * 0.1;
  } else if (isAnim('lookAround')) {
    leftArmRotZ = Math.PI * 0.12;
    rightArmRotZ = -Math.PI * 0.12;
  } else if (isAnim('dance')) {
    leftArmRotZ = Math.PI * 0.4 + Math.sin(t * 4) * 0.3;
    rightArmRotZ = -Math.PI * 0.4 - Math.sin(t * 4 + Math.PI) * 0.3;
    leftArmRotX = Math.sin(t * 4) * 0.2;
    rightArmRotX = Math.sin(t * 4 + Math.PI) * 0.2;
    extraBodyPosY = Math.abs(Math.sin(t * 4)) * 0.1;
    extraBodyRotZ = Math.sin(t * 4) * 0.04;
  }

  return { leftArmRotZ, rightArmRotZ, leftArmRotX, rightArmRotX, extraBodyPosY, extraBodyRotZ };
}
