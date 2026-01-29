
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, 
  Wind, 
  ThermometerSun, 
  Home, 
  Maximize, 
  Users, 
  AlertTriangle,
  Info,
  ChevronRight,
  RefreshCcw,
  MessageCircle
} from 'lucide-react';
import { CalculationInputs, CalculationResults } from './types';
import { 
  BASE_KCAL_PER_PING,
  TIN_ROOF_KCAL_PER_PING,
  KCAL_TO_WATT, 
  KCAL_TO_BTU, 
  KCAL_TO_KW,
  BTU_TO_TON,
  STANDARD_HEIGHT, 
  MULTIPLIERS 
} from './constants';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<CalculationInputs>({
    area: 5,
    height: 2.8,
    isWestSun: false,
    isTinRoof: false,
    isTopFloor: false,
    hasLargeWindows: false,
    peopleCount: 2,
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);

  // 换算函数：1坪 = 3.3058 平方公尺
  const PING_TO_SQM = 3.3058;

  // 根据长度和宽度计算坪数（输入为公分，需要转换为公尺）
  const calculateAreaFromDimensions = (lenCm: number, widCm: number) => {
    // 公分转换为公尺：除以100
    const lenM = lenCm / 100;
    const widM = widCm / 100;
    const squareMeters = lenM * widM;
    const ping = squareMeters / PING_TO_SQM;
    return { squareMeters, ping };
  };

  const handleLengthChange = (value: number) => {
    setLength(value);
    if (value > 0 && width > 0) {
      const { ping } = calculateAreaFromDimensions(value, width);
      setInputs(prev => ({ ...prev, area: ping }));
    }
  };

  const handleWidthChange = (value: number) => {
    setWidth(value);
    if (length > 0 && value > 0) {
      const { ping } = calculateAreaFromDimensions(length, value);
      setInputs(prev => ({ ...prev, area: ping }));
    }
  };

  const handleAreaChange = (value: number) => {
    setInputs(prev => ({ ...prev, area: value }));
    // 当直接修改坪数时，不清空长度和宽度，但可以显示对应的面积
  };

  const calculate = useCallback(() => {
    const { area, height, isWestSun, isTinRoof, isTopFloor, hasLargeWindows, peopleCount } = inputs;

    // 核心計算公式：Q = A × q × H_factor
    // Q：總需求熱量 (kcal/h)
    // A：房間坪數
    // q：環境基準值
    // H_factor：高度修正

    // 1. 環境基準值 q (kcal/h/坪)
    // 一般房間：500 kcal/h/坪
    // 鐵皮屋：750 kcal/h/坪
    const q = isTinRoof ? TIN_ROOF_KCAL_PER_PING : BASE_KCAL_PER_PING;

    // 2. 高度修正 H_factor
    // 若高度超過 3.2 米，建議乘上 1.1
    const H_factor = height > STANDARD_HEIGHT ? MULTIPLIERS.HEIGHT_FACTOR : 1.0;

    // 3. 計算基礎總需求熱量：Q = A × q × H_factor
    let totalKcal = area * q * H_factor;

    // 4. 室內人數調整：超過3人，每多一人 +100 kcal/h
    if (peopleCount > MULTIPLIERS.BASE_PEOPLE) {
      const extraPeople = peopleCount - MULTIPLIERS.BASE_PEOPLE;
      totalKcal += extraPeople * MULTIPLIERS.PERSON_KCAL;
    }

    // 5. 各種加成因素（基於總熱量計算，累加百分比）
    let multiplier = 1.0;
    
    // 西曬嚴重：總瓦數 +15%
    if (isWestSun) {
      multiplier += MULTIPLIERS.WEST_SUN;
    }
    
    // 頂樓：總瓦數 +15%
    if (isTopFloor) {
      multiplier += MULTIPLIERS.TOP_FLOOR;
    }
    
    // 落地窗/大面積玻璃：總瓦數 +10%
    if (hasLargeWindows) {
      multiplier += MULTIPLIERS.LARGE_WINDOW;
    }
    
    // 鐵皮屋頂額外加成：總瓦數 +25%
    // 注意：此為額外加成，鐵皮屋基礎值已在q中設定為750
    if (isTinRoof) {
      multiplier += MULTIPLIERS.TIN_ROOF;
    }

    // 應用加成係數
    totalKcal *= multiplier;

    // 6. 單位換算
    // 轉成 BTU：kcal/h × 4
    const totalBTU = totalKcal * KCAL_TO_BTU;
    
    // 轉成 kW：kcal/h ÷ 860
    const totalKW = totalKcal * KCAL_TO_KW;
    
    // 轉成瓦數 (W)
    const totalWatt = totalKcal * KCAL_TO_WATT;

    const roundedKcal = Math.ceil(totalKcal);
    
    setResults({
      baseKcal: Math.round(area * q),
      totalKcal: roundedKcal,
      totalWatts: Math.ceil(totalWatt),
      recommendedBTU: Math.ceil(totalBTU),
      factors: {
        heightMultiplier: Number(H_factor.toFixed(1)),
        environmentalMultiplier: Number(multiplier.toFixed(1))
      }
    });
  }, [inputs]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value) || 0
    }));
  };

  const chartData = results ? [
    { name: '基本需求', value: results.baseKcal },
    { name: '額外熱負載', value: results.totalKcal - results.baseKcal },
  ] : [];

  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <header className="pt-4 pb-4 sticky top-0 bg-slate-50 z-10 border-b border-slate-200 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="text-blue-600" size={28} />
              <h1 className="text-lg font-bold text-slate-800">
                工程冷氣計算機
              </h1>
            </div>
            <button 
              onClick={() => {
                setInputs({
                  area: 5, height: 2.8, isWestSun: false, isTinRoof: false, 
                  isTopFloor: false, hasLargeWindows: false, peopleCount: 2
                });
                setLength(0);
                setWidth(0);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors border border-slate-200 rounded-lg bg-white"
            >
              <RefreshCcw size={14} /> 重設
            </button>
          </div>
        </header>

        <div className="space-y-4">
          {/* Input Section */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Maximize className="text-blue-500" size={20} />
              空間基本參數
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">輸入長與寬換算坪數</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">長度 (公分)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={length > 0 ? length : ''}
                        onChange={(e) => handleLengthChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white text-lg placeholder:text-slate-500"
                        step="1"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-medium text-sm">cm</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">寬度 (公分)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={width > 0 ? width : ''}
                        onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white text-lg placeholder:text-slate-500"
                        step="1"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-medium text-sm">cm</span>
                    </div>
                  </div>
                </div>
                {length > 0 && width > 0 && (
                  <p className="mt-2 text-xs text-blue-600">
                    面積：{((length * width) / 10000).toFixed(1)} m² = {(inputs.area).toFixed(1)} 坪
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  室內坪數 (坪)
                  <span className="ml-2 text-xs font-normal text-blue-600">可直接輸入坪數</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="area"
                    value={inputs.area}
                    onChange={(e) => handleAreaChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white text-lg placeholder:text-slate-500"
                    min="0"
                    step="0.1"
                    placeholder="0"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-medium">坪</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">1坪 = 3.3058 平方公尺</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">天花板高度 (公尺)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="height"
                    step="0.1"
                    value={inputs.height}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white text-lg placeholder:text-slate-500"
                    placeholder="0"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-medium">m</span>
                </div>
                {inputs.height > STANDARD_HEIGHT && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={14} /> 超過3.2公尺，高度修正 ×1.1
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">常用活動人數</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="peopleCount"
                    value={inputs.peopleCount}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white text-lg placeholder:text-slate-500"
                    placeholder="0"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">人</span>
                </div>
              </div>
            </div>
          </section>

          {/* LINE Official Link */}
          <section className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
            <a 
              href="https://lin.ee/faGiFku" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center text-white"
            >
              <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition-colors">
                卡位參加數位工程APP封測限額!???
              </div>
            </a>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <ThermometerSun className="text-orange-500" size={20} />
              環境熱源係數
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 min-h-[90px] ${inputs.isWestSun ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                onClick={() => setInputs(p => ({...p, isWestSun: !p.isWestSun}))}
              >
                <ThermometerSun size={24} className={inputs.isWestSun ? 'text-orange-600' : 'text-slate-400'} />
                <span className="text-sm font-bold">西曬房</span>
              </div>

              <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 min-h-[90px] ${inputs.isTinRoof ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                onClick={() => setInputs(p => ({...p, isTinRoof: !p.isTinRoof}))}
              >
                <Home size={24} className={inputs.isTinRoof ? 'text-red-600' : 'text-slate-400'} />
                <span className="text-sm font-bold text-center leading-tight">鐵皮屋 / <br/>頂樓加蓋</span>
              </div>

              <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 min-h-[90px] ${inputs.isTopFloor ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                onClick={() => setInputs(p => ({...p, isTopFloor: !p.isTopFloor}))}
              >
                <Maximize size={24} className={inputs.isTopFloor ? 'text-blue-600' : 'text-slate-400'} />
                <span className="text-sm font-bold text-center leading-tight">建築頂樓</span>
              </div>

              <div 
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 min-h-[90px] ${inputs.hasLargeWindows ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                onClick={() => setInputs(p => ({...p, hasLargeWindows: !p.hasLargeWindows}))}
              >
                <Maximize size={24} className={inputs.hasLargeWindows ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-sm font-bold text-center leading-tight">落地窗 / <br/>大採光</span>
              </div>
            </div>

            {inputs.isTinRoof && (
              <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-100 flex gap-2">
                <AlertTriangle className="shrink-0" size={16} />
                <div>
                  <span className="font-bold">注意：</span>鐵皮屋基礎值750 kcal/h/坪，額外+25%加成。
                </div>
              </div>
            )}
          </section>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">建議冷房能力</h2>
              
              <div className="mb-6">
                <div className="text-5xl font-black tracking-tight mb-2">
                  {results?.totalKcal.toLocaleString()}
                  <span className="text-xl font-normal text-slate-400 ml-2">kcal/h</span>
                </div>
                <div className="text-2xl font-bold text-blue-400 mt-2">
                  {(results?.totalWatts / 1000).toFixed(1)} kW
                  <span className="text-base font-normal text-slate-400 ml-2">
                    ({results?.totalWatts.toLocaleString()} W)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-xs mb-1">BTU/h</div>
                  <div className="text-2xl font-bold text-white">{results?.recommendedBTU.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-xs mb-1">高度修正</div>
                  <div className="text-xl font-bold text-emerald-400">×{results?.factors.heightMultiplier}</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-xs mb-1">環境加成</div>
                  <div className="text-xl font-bold text-orange-400">×{results?.factors.environmentalMultiplier}</div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">熱負荷結構分析</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs mt-3">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> 基準坪數熱量</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> 額外環境負荷</div>
              </div>
            </section>

            {/* Recommendations */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">採購專家建議</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600 shrink-0"><Info size={16} /></div>
                  <span>建議選購額定能力大於 <span className="font-bold text-slate-800">{results?.totalKcal} kcal/h</span>（約 <span className="font-bold text-slate-800">{(results?.totalWatts / 1000).toFixed(1)} kW</span>）的變頻機種。購買時「寧大勿小」。</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600 shrink-0"><Info size={16} /></div>
                  <span>推薦選用 CSPF 一級能效產品，長期使用可省下 30% 以上電費。</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600 shrink-0"><Info size={16} /></div>
                  <span>建議搭配循環扇加強空氣對流，可提升 20% 冷房效率。</span>
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 mb-6 text-center text-slate-400 text-xs border-t border-slate-200 pt-6 px-4">
          <p>© 2024 工程冷氣計算機 Pro</p>
          <div className="mt-2 italic">
            <span>* 計算結果僅供參考，實際安裝應由合格工程師依現場狀況評估</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
