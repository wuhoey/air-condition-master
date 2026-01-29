
export interface CalculationInputs {
  area: number;        // 坪數
  height: number;      // 高度 (公尺)
  isWestSun: boolean;  // 西曬
  isTinRoof: boolean;  // 鐵皮屋
  isTopFloor: boolean; // 頂樓
  hasLargeWindows: boolean; // 落地窗
  peopleCount: number;  // 常用人數
}

export interface CalculationResults {
  baseKcal: number;
  totalKcal: number;
  totalWatts: number;
  recommendedBTU: number;
  factors: {
    heightMultiplier: number;
    environmentalMultiplier: number;
  };
}
