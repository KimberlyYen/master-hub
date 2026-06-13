"use client";

import { useSchools } from "../lib/schoolStore";
import MasterChecklist from "../applications/MasterChecklist";

export default function DocumentsPage() {
  const { schools, loaded } = useSchools();
  const visible = schools.filter((s) => !s.hidden);

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
        載入中...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-50">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800">文件總覽</h1>
          <p className="text-sm text-zinc-400 mt-1">
            整合所有學校必繳文件，去除重複項目，上傳後自動同步至各校卡片
          </p>
        </div>
        <MasterChecklist schools={visible} defaultExpanded />
      </div>
    </div>
  );
}
