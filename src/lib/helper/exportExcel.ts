import ExcelJS from 'exceljs';
import {Header} from "../types/excel";

export const ExportExcel = async (res: any, filename: string, header: Header[], data: any) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Sheet');

    worksheet.columns = header;

    data.forEach((item) => {
        worksheet.addRow(item);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + `${filename}.xlsx`);

    // send file Excel to response
    await workbook.xlsx.write(res);
    res.end();
}