import ExcelJS from "exceljs";

export async function montarArquivoXlsx(nomePlanilha, cabecalho, linhas) {
  const workbook = new ExcelJS.Workbook();
  const planilha = workbook.addWorksheet(nomePlanilha);
  planilha.addRow(cabecalho).font = { bold: true };
  linhas.forEach((linha) => planilha.addRow(linha));
  planilha.views = [{ state: "frozen", ySplit: 1 }];
  planilha.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: linhas.length + 1, column: cabecalho.length },
  };
  cabecalho.forEach((rotulo, indice) => {
    let largura = String(rotulo).length;
    for (const linha of linhas) {
      largura = Math.max(largura, String(linha[indice] ?? "").length);
    }
    planilha.getColumn(indice + 1).width = Math.min(Math.max(largura + 2, 12), 42);
  });
  return workbook.xlsx.writeBuffer();
}
