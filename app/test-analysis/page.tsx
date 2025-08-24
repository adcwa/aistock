'use client';

import { AnalysisProgress } from '@/components/ui/analysis-progress';

export default function TestAnalysisPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">股票分析进度测试</h1>
      
      <div className="grid gap-6">
        <AnalysisProgress 
          symbol="AAPL"
          onComplete={(data) => {
            console.log('分析完成:', data);
          }}
          onError={(error) => {
            console.error('分析失败:', error);
          }}
        />
        
        <AnalysisProgress 
          symbol="TSLA"
          onComplete={(data) => {
            console.log('分析完成:', data);
          }}
          onError={(error) => {
            console.error('分析失败:', error);
          }}
        />
      </div>
    </div>
  );
}
