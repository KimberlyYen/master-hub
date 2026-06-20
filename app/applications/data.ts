export type Status =
  | '未開始'
  | '報名中'
  | '已報名'
  | '審查中'
  | '待面試'
  | '已面試'
  | '放榜等待'
  | '錄取'
  | '備取'
  | '未錄取'
  | '放棄';

export type ScoreItem = {
  label: string;
  percentage: number;
};

export type Document = {
  label: string;
  required: boolean;
};

// 115學年度參考日期（爬蟲於 2026-06-04 採集）
export type Ref115 = {
  brochureDate?: string;         // 公告簡章
  registrationDeadline?: string; // 報名截止
  documentDeadline?: string;     // 備審截止
  examDate?: string;             // 考試/面試
  source?: string;               // 資料來源說明
};

export type School = {
  id: string;
  school: string;
  department: string;
  code: string;
  quota: number;
  website: string;
  workExpRequired: string;
  classSchedule?: string;
  applicationFee?: number;
  // 116學年度（當前週期，待公告）
  brochureDate?: string;
  registrationDeadline?: string;
  documentDeadline?: string;
  examDate?: string;
  resultDate?: string;
  scoring: ScoreItem[];
  requiredDocuments: Document[];
  remarks?: string;
  contact?: string;
  hidden?: boolean;
  // 115學年度參考資料
  ref115?: Ref115;
};

export const schools: School[] = [
  {
    id: 'cycu-im',
    school: '中原大學',
    department: '資訊管理學系',
    code: '5461N',
    quota: 23,
    website: 'https://im.cycu.edu.tw/',
    workExpRequired: '1年以上',
    examDate: '待公告',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    scoring: [
      { label: '審查資料（工作經驗及專業表現）', percentage: 40 },
      { label: '面試', percentage: 60 },
    ],
    requiredDocuments: [
      { label: '自傳（5頁以內）', required: true },
      { label: '專業工作相關資料', required: true },
      { label: '學歷(力)證明', required: true },
      { label: '工作年資證明', required: true },
    ],
    remarks: '面試原始成績未達60分者不予錄取。未上傳任何審查資料者取消報名資格，扣手續費400元後退費1000元。',
    contact: '(03) 265-5403',
    ref115: {
      brochureDate: '114/11/21',
      registrationDeadline: '114/12/22–115/1/19 中午12:00',
      documentDeadline: '115/1/19（同報名截止）',
      examDate: '115/2/7（六）',
      source: 'icare.cycu.edu.tw 公告',
    },
  },
  {
    id: 'cycu-cs',
    school: '中原大學',
    department: '資訊工程學系（大數據技術組 4761N／物聯網技術組 4763N）',
    code: '4761N / 4763N',
    quota: 12,
    website: 'https://iceweb.cycu.edu.tw/',
    workExpRequired: '1年以上',
    examDate: '待公告',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    scoring: [
      { label: '審查資料（一）工作經驗及專業表現', percentage: 50 },
      { label: '審查資料（二）學習知能與相關特殊表現', percentage: 50 },
    ],
    requiredDocuments: [
      { label: '履歷', required: true },
      { label: '自傳', required: true },
      { label: '工作內容說明', required: true },
      { label: '最高學歷成績單', required: true },
      { label: '推薦函（採線上填寫）', required: false },
      { label: '學歷(力)證明', required: true },
      { label: '工作年資證明', required: true },
    ],
    remarks: '兩組名額（大數據6名、物聯網6名）得相互流用，任一組須待該組備取生遞補用盡方得流用另一組。推薦函採線上填寫。',
    contact: '(03) 265-4752',
    ref115: {
      brochureDate: '114/11/21',
      registrationDeadline: '114/12/22–115/1/19 中午12:00',
      documentDeadline: '115/1/19（同報名截止）',
      examDate: '未公告（純書審，無面試）',
      source: 'icare.cycu.edu.tw 公告',
    },
  },
  {
    id: 'fju-im',
    school: '輔仁大學',
    department: '資訊管理學系碩士在職專班',
    code: '—',
    quota: 35,
    website: 'http://www.im.fju.edu.tw',
    workExpRequired: '2年以上',
    examDate: '無（純書審）',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    scoring: [
      { label: '工作經驗及專業表現', percentage: 60 },
      { label: '學習知能與相關特殊表現', percentage: 40 },
    ],
    requiredDocuments: [
      { label: '考生資料表（本系網頁下載）', required: true },
      { label: '學士班學位證書', required: true },
      { label: '工作單位服務證明書正本', required: true },
      { label: '工作實務經驗說明', required: true },
      { label: '自我評述表（本系網頁下載）', required: true },
      { label: '學士班歷年成績單', required: true },
      { label: '其他有助審查之資料（碩士學分班修業成績單、證照等）', required: false },
    ],
    remarks: '具AACSB認證。資料須依「工作經驗及專業表現」、「學習知能與相關特殊表現」二項編輯成二個PDF，每檔5MB以內。網路報名者需線上上傳；現場報名者需至本系辦理。',
    contact: '02-2905-2626 / 055969@mail.fju.edu.tw',
    ref115: {
      registrationDeadline: '未找到',
      documentDeadline: '115/1/5 中午12:00',
      examDate: '無（純書審）',
      source: '招生簡章圖片',
    },
  },
  {
    id: 'fju-cs',
    school: '輔仁大學',
    department: '資訊工程學系碩士在職專班',
    code: '—',
    quota: 17,
    website: 'https://csie2.fju.edu.tw/',
    workExpRequired: '9個月以上',
    examDate: '待公告',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    scoring: [
      { label: '資料審查（工作經驗及專業表現）', percentage: 30 },
      { label: '資料審查（學習知能與相關特殊表現）', percentage: 30 },
      { label: '口試', percentage: 40 },
    ],
    requiredDocuments: [
      { label: '學位證書影本1份', required: true },
      { label: '工作年資證明', required: true },
      { label: '職業證照或專業資格證書（無則免繳）', required: false },
      { label: '專業工作、個人職務及表現說明', required: true },
      { label: '自傳', required: true },
      { label: '讀書計畫或研究計畫', required: true },
      { label: '推薦信（無則免繳）', required: false },
      { label: '獲獎紀錄（無則免繳）', required: false },
      { label: '創作、專利、論文著作等（無則免繳）', required: false },
    ],
    remarks: '網路報名者需限時掛號郵寄資料；逾期未繳資料者不予受理。口試詳細注意事項於115年3月9日後至本系網頁查詢。',
    contact: '02-2905-3885 / 019901@mail.fju.edu.tw',
    ref115: {
      registrationDeadline: '未找到',
      documentDeadline: '115/1/5 前（限時掛號郵寄）',
      examDate: '115/3/14（六）下午1:30',
      source: '招生簡章圖片',
    },
  },
  {
    id: 'ntust-emrd',
    school: '台灣科技大學',
    department: '高階科技研發碩士學位學程（EMRD）',
    code: '2690',
    quota: 30,
    website: 'https://emrd.ntust.edu.tw',
    workExpRequired: '6年以上（計算至當學年8月31日止，服義務役年資不列計）',
    examDate: '待公告',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    applicationFee: 2500,
    scoring: [
      { label: '審查', percentage: 50 },
      { label: '口試', percentage: 50 },
    ],
    requiredDocuments: [
      { label: 'EMRD報考申請表（官網下載後填寫上傳）', required: true },
      { label: '畢業證書（正本掃描成PDF）', required: true },
      { label: '工作年資證明（勞保投保資料或公司開立服務證明）', required: true },
      { label: '自傳（含工作經驗、進修計畫與未來展望，無字數限制）', required: false },
      { label: '推薦信函', required: false },
      { label: '學分證明書', required: false },
      { label: '相關證照、得獎紀錄等其他有助審查資料', required: false },
    ],
    remarks: '審查成績前50%之考生直接錄取並免參加第二階段口試；審查成績資格不足或零分者不得參加口試；口試缺考或零分者不予錄取。',
    contact: '02-27301026 / emrd@mail.ntust.edu.tw',
    ref115: {
      brochureDate: '114/11/28',
      registrationDeadline: '114/11/28–114/12/11',
      documentDeadline: '未找到',
      examDate: '未找到',
      source: 'emrd.ntust.edu.tw 公告欄',
    },
  },
  {
    id: 'ttu-cs',
    school: '大同科技大學',
    department: '資訊工程學系碩士在職專班',
    code: '060',
    quota: 18,
    website: 'https://cse.ttu.edu.tw',
    workExpRequired: '半年以上',
    classSchedule: '週一至週五晚上或假日',
    examDate: '待公告',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    scoring: [
      { label: '資料審查', percentage: 50 },
      { label: '口試', percentage: 50 },
    ],
    requiredDocuments: [
      { label: '最高學歷證明', required: true },
      { label: '自傳', required: true },
      { label: '個人資料表（附表二）', required: true },
      { label: '其他有助於了解報考者之資料（學經歷、工作經驗等）', required: false },
    ],
    remarks: '研究領域涵蓋人工智慧、物聯網、資訊安全、知識圖譜、NLP、電腦視覺、影像辨識等。',
    contact: '(02)77364714 / (02)21822928 轉6565 / lgchiu@gm.ttu.edu.tw',
    ref115: {
      registrationDeadline: '未找到（網站無法連線）',
      documentDeadline: '未找到',
      examDate: '未找到',
      source: '爬蟲無法連線至 b0222.ttu.edu.tw',
    },
  },
  {
    id: 'tku-cs',
    school: '淡江大學',
    department: '資訊工程學系碩士在職專班',
    code: '8280',
    quota: 10,
    website: 'https://csie.tku.edu.tw/',
    workExpRequired: '學士學位＋1年以上工作經驗',
    examDate: '待公告',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    scoring: [
      { label: '書面審查', percentage: 50 },
      { label: '面試', percentage: 50 },
    ],
    requiredDocuments: [
      { label: '歷年成績單1份及學歷證明（轉學生須另附原校成績單）', required: true },
      { label: '研讀計畫書1份', required: true },
      { label: '工作經驗年資證明', required: true },
      { label: '專業工作成就證明', required: true },
    ],
    remarks: '同分參酌順序：面試 > 書面審查。',
    contact: '(02) 2621-5656 轉 2616/2665 / teix@oa.tku.edu.tw',
    ref115: {
      registrationDeadline: '未找到',
      documentDeadline: '未找到',
      examDate: '未找到',
      source: '116招生簡章',
    },
  },
  {
    id: 'tku-im',
    school: '淡江大學',
    department: '資訊管理學系碩士在職專班（一般生 8440／同等學力第7條 8441）',
    code: '8440 / 8441',
    quota: 11,
    website: 'https://www.im.tku.edu.tw/',
    workExpRequired: '1年以上工作經驗（學士／碩博士）',
    examDate: '待公告',
    documentDeadline: '待公告',
    registrationDeadline: '待公告',
    scoring: [
      { label: '書面審查', percentage: 60 },
      { label: '面試', percentage: 40 },
    ],
    requiredDocuments: [
      { label: '學歷與工作年資證明', required: true },
      { label: '學經歷', required: true },
      { label: '其他傑出表現佐證文件', required: false },
    ],
    remarks:
      '備審資料須於繳費後上傳，逾期或缺件視同未完成報名。同等學力第7條考生（8441）須於114/12/15前送審資格審查申請表（附錄20）及佐證文件，經招生委員會審議通過始得報考。同分參酌順序：面試 > 書面審查。',
    contact: '(02) 2621-5656 轉 2616/2665',
    ref115: {
      registrationDeadline: '未找到',
      documentDeadline: '未找到',
      examDate: '未找到',
      source: '116招生簡章',
    },
  },
];

export const STATUS_COLORS: Record<Status, { bg: string; text: string; border: string }> = {
  未開始:   { bg: 'bg-zinc-100',   text: 'text-zinc-500',   border: 'border-zinc-200' },
  報名中:   { bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-200' },
  已報名:   { bg: 'bg-sky-50',     text: 'text-sky-700',    border: 'border-sky-200'  },
  審查中:   { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200'},
  待面試:   { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200'},
  已面試:   { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200'},
  放榜等待: { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200'},
  錄取:     { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200'},
  備取:     { bg: 'bg-teal-50',    text: 'text-teal-700',   border: 'border-teal-200' },
  未錄取:   { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200'  },
  放棄:     { bg: 'bg-zinc-100',   text: 'text-zinc-400',   border: 'border-zinc-200' },
};

export const ALL_STATUSES: Status[] = [
  '未開始', '報名中', '已報名', '審查中', '待面試',
  '已面試', '放榜等待', '錄取', '備取', '未錄取', '放棄',
];
