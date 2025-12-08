export interface SchoolModel {
  id: string;
  schoolId: string;
  name: string;
  type: 'A' | 'B';
  idleAnimation: string;
  runningAnimation: string;
  cameraXOffset?: number; // Model-specific camera offset
  modelYOffset?: number; // Model-specific Y position offset
}

export const schoolModels: SchoolModel[] = [
  
  // Fire - two models
  {
    id: 'fire-a',
    schoolId: 'fire',
    name: 'Fire Wizard A',
    type: 'A',
    idleAnimation: '/FIREWIZARDAMeshy_Merged_Animations.glb',
    runningAnimation: '/FIREWIZARDAMeshy_Merged_Animations.glb',
    cameraXOffset: 0, // Fire model seems centered correctly
    modelYOffset: 0 // Fire model at ground level
  },
  {
    id: 'fire-b',
    schoolId: 'fire', 
    name: 'Fire Wizard B',
    type: 'B',
    idleAnimation: '/FIREWIZARDBMeshy_Merged_Animations.glb',
    runningAnimation: '/FIREWIZARDBMeshy_Merged_Animations.glb'
  },
  
  // Myth - only one model
  {
    id: 'myth-a',
    schoolId: 'myth',
    name: 'Myth Wizard',
    type: 'A',
    idleAnimation: '/MYTHWIZARDMeshy_Merged_Animations.glb',
    runningAnimation: '/MYTHWIZARDMeshy_Merged_Animations.glb'
  },
  
  // Ice - only one model
  {
    id: 'ice-a',
    schoolId: 'ice',
    name: 'Ice Wizard',
    type: 'A',
    idleAnimation: '/ICEWIZARDMeshy_Merged_Animations.glb',
    runningAnimation: '/ICEWIZARDMeshy_Merged_Animations.glb',
    cameraXOffset: 0.8, // Ice model needs offset based on earlier fixes
    modelYOffset: 0 // Ice model Y offset - adjust if needed
  },
  
  // Life - two models
  {
    id: 'life-a',
    schoolId: 'life',
    name: 'Life Wizard A',
    type: 'A',
    idleAnimation: '/LIFEWIZARDAMeshy_Merged_Animations.glb',
    runningAnimation: '/LIFEWIZARDAMeshy_Merged_Animations.glb'
  },
  {
    id: 'life-b',
    schoolId: 'life',
    name: 'Life Wizard B',
    type: 'B',
    idleAnimation: '/LIFEWIZARDBMeshy_Merged_Animations.glb',
    runningAnimation: '/LIFEWIZARDBMeshy_Merged_Animations.glb'
  },
  
  // Balance - two models
  {
    id: 'balance-a',
    schoolId: 'balance',
    name: 'Balance Wizard A',
    type: 'A',
    idleAnimation: '/BALANCEWIZARDAMeshy_Merged_Animations.glb',
    runningAnimation: '/BALANCEWIZARDAMeshy_Merged_Animations.glb'
  },
  {
    id: 'balance-b',
    schoolId: 'balance',
    name: 'Balance Wizard B',
    type: 'B',
    idleAnimation: '/BALANCEWIZARDBMeshy_Merged_Animations.glb',
    runningAnimation: '/BALANCEWIZARDBMeshy_Merged_Animations.glb'
  },
  
  // Death - only one model
  {
    id: 'death-a',
    schoolId: 'death',
    name: 'Death Wizard',
    type: 'A',
    idleAnimation: '/DEATHWIZARDMeshy_Merged_Animations.glb',
    runningAnimation: '/DEATHWIZARDMeshy_Merged_Animations.glb'
  }
];

export function getModelsBySchool(schoolId: string): SchoolModel[] {
  return schoolModels.filter(model => model.schoolId === schoolId);
}

export function getModelById(modelId: string): SchoolModel | undefined {
  return schoolModels.find(model => model.id === modelId);
}