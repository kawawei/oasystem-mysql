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
    '補習班名稱',
    '電話',
    '縣市',
    '區域',
    '地址',
    '聯繫人',
    'Email',
    '備註'
  ];

  // 創建示例數據 Create example data
  const exampleData = [
    [
      '大安優質補習班',
      '02-2771-8888',
      '台北市',
      '大安區',
      '大安路一段123號',
      '王主任',
      'daan.edu@example.com',
      '對國中數理班有興趣'
    ]
  ];

  // 組合數據 Combine data
  const data = [headers, ...exampleData];

  // 創建工作表 Create worksheet
  const ws = xlsx.utils.aoa_to_sheet(data);

  // 設置列寬 Set column widths
  const colWidths = [
    { wch: 20 }, // 補習班名稱
    { wch: 15 }, // 電話
    { wch: 10 }, // 縣市
    { wch: 10 }, // 區域
    { wch: 30 }, // 地址
    { wch: 15 }, // 聯繫人
    { wch: 25 }, // Email
    { wch: 40 }  // 備註
  ];

  ws['!cols'] = colWidths;

  // 將工作表添加到工作簿 Add worksheet to workbook
  xlsx.utils.book_append_sheet(wb, ws, '補習班資料');

  // 保存文件 Save file
  const templatePath = path.join(templatesDir, 'tutorial_center_template.xlsx');
  xlsx.writeFile(wb, templatePath);

  console.log('補習班導入範本已生成 Tutorial center import template has been generated:', templatePath);
}

// 生成所有範本 Generate all templates
function generateAllTemplates() {
  generateTutorialCenterTemplate();
  // 可以在這裡添加其他範本的生成函數 Add other template generation functions here
}

// 執行生成 Execute generation
generateAllTemplates(); 