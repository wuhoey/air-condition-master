
// 環境基準值 q (kcal/h/坪)
export const BASE_KCAL_PER_PING = 500;  // 一般房間每坪基準 kcal/h
export const TIN_ROOF_KCAL_PER_PING = 750; // 鐵皮屋每坪基準 kcal/h

// 單位換算係數
export const KCAL_TO_BTU = 4;           // 1 kcal/h = 4 BTU/h
export const KCAL_TO_KW = 1 / 860;      // 1 kcal/h = 1/860 kW
export const KCAL_TO_WATT = 1000 / 860; // 1 kcal/h = 1000/860 W ≈ 1.163 W
export const BTU_TO_TON = 12000;        // 1噸 = 12,000 BTU/h

export const STANDARD_HEIGHT = 3.2;     // 標準樓高基準 (公尺)，超過此高度需高度修正

// 影響因子倍率（加成百分比）
export const MULTIPLIERS = {
  WEST_SUN: 0.15,      // 西曬嚴重：總瓦數 +15%
  TIN_ROOF: 0.25,      // 鐵皮屋頂：總瓦數 +25%（額外加成，基礎值已在q中設定為750）
  TOP_FLOOR: 0.15,     // 頂樓：總瓦數 +15%
  LARGE_WINDOW: 0.10,  // 落地窗/大面積玻璃：總瓦數 +10%
  HEIGHT_FACTOR: 1.1,  // 高度修正：超過3.2米 × 1.1
  PERSON_KCAL: 100,    // 超過3人，每多一人 +100 kcal/h
  BASE_PEOPLE: 3,      // 基準人數
};
