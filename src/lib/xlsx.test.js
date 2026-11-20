import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { criarArquivoXlsx, XLSX_MIME_TYPE } from "./xlsx.js";

test("gera um workbook XLSX com cabeçalho, linhas, autofiltro e painel congelado", async () => {
  const arquivo = await criarArquivoXlsx(
    "Inscritos",
    ["Nome", "Telefone"],
    [["Ana", "(11) 99999-8888"]],
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(arquivo));
  const planilha = workbook.getWorksheet("Inscritos");

  assert.equal(XLSX_MIME_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  assert.equal(planilha.getCell("A1").value, "Nome");
  assert.equal(planilha.getCell("A1").font.bold, true);
  assert.equal(planilha.getCell("A2").value, "Ana");
  assert.equal(planilha.getCell("B2").value, "(11) 99999-8888");
  assert.equal(planilha.autoFilter, "A1:B2");
  assert.equal(planilha.views[0].ySplit, 1);
});
