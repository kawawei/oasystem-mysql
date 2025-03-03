// 生成 Excel 範本的腳本 Script for generating Excel templates
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// 確保模板目錄存在 Ensure templates directory exists
const templatesDir = path.join(__dirname, '../templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// 創建補習班導入範本 Create tutorial center import template
function generateTutorialCenterTemplate() {
  // 創建工作簿 Create workbook
  const wb = xlsx.utils.book_new();

  // 定義表頭 Define headers
  const headers = [
    '意向',
    '補習班名稱',
    '縣市',
    '區域',
    '地址',
    '電話',
    '寄送日期',
    'Email Address',
    '窗口',
    '備註'
  ];

  // 創建示例數據 Create example data
  const exampleData = [
    [
      '新名單',
      '大安優質補習班',
      '台北市',
      '大安區',
      '大安路一段123號',
      '02-2771-8888',
      '2024-03-15',
      'daan.edu@example.com',
      '王主任',
      '對國中數理班有興趣'
    ],
    [
      '有意願',
      '松山數學專門班',
      '台北市',
      '松山區',
      '松山路456號',
      '02-2756-6666',
      '2024-03-16',
      'math.pro@example.com',
      '李老師',
      '希望合作開設高中數學班'
    ]
  ];

  // 組合數據 Combine data
  const data = [headers, ...exampleData];

  // 創建工作表 Create worksheet
  const ws = xlsx.utils.aoa_to_sheet(data);

  // 設置列寬 Set column widths
  const colWidths = [
    { wch: 12 },  // 意向
    { wch: 25 },  // 補習班名稱
    { wch: 10 },  // 縣市
    { wch: 10 },  // 區域
    { wch: 30 },  // 地址
    { wch: 15 },  // 電話
    { wch: 12 },  // 寄送日期
    { wch: 25 },  // Email Address
    { wch: 15 },  // 窗口
    { wch: 40 }   // 備註
  ];

  ws['!cols'] = colWidths;

  // 添加驗證說明工作表 Add validation notes worksheet
  const notesWs = xlsx.utils.aoa_to_sheet([
    ['欄位說明'],
    ['1. 所有欄位均為選填'],
    ['2. 意向可選值：'],
    ['   - 新名單'],
    ['   - 有意願'],
    ['   - 考慮中'],
    ['   - 無意願'],
    ['   - 未撥通'],
    ['   - 不相關'],
    ['   - 忙碌中'],
    ['   - 約訪'],
    ['   - 已洽談開班'],
    ['   - 空號'],
    ['3. 縣市格式：XX市 或 XX縣，如：台北市、新北市、桃園市等'],
    ['4. 區域格式：XX區，如：大安區、松山區等'],
    ['5. 電話格式：市話或手機號碼'],
    ['6. 寄送日期格式：YYYY-MM-DD'],
    ['7. Email 格式必須正確']
  ]);

  // 設置說明工作表的列寬
  notesWs['!cols'] = [{ wch: 60 }];

  // 將工作表添加到工作簿 Add worksheets to workbook
  xlsx.utils.book_append_sheet(wb, ws, '補習班資料');
  xlsx.utils.book_append_sheet(wb, notesWs, '填寫說明');

  // 保存文件 Save file
  const templatePath = path.join(templatesDir, '補習班名單範本.xlsx');
  xlsx.writeFile(wb, templatePath);

  console.log('補習班導入範本已生成:', templatePath);
}

// 生成所有範本 Generate all templates
function generateAllTemplates() {
  generateTutorialCenterTemplate();
  // 可以在這裡添加其他範本的生成函數 Add other template generation functions here
}

// 執行生成 Execute generation
generateAllTemplates(); 