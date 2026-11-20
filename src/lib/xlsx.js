export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function criarArquivoXlsx(nomePlanilha, cabecalho, linhas) {
  if (!cabecalho.length) throw new Error("A planilha precisa ter ao menos uma coluna.");
  const { montarArquivoXlsx } = await import("./xlsxWorkbook.js");
  return montarArquivoXlsx(nomePlanilha, cabecalho, linhas);
}

export async function baixarXlsx(nomeArquivo, nomePlanilha, cabecalho, linhas) {
  const bytes = await criarArquivoXlsx(nomePlanilha, cabecalho, linhas);
  const arquivo = new Blob([bytes], { type: XLSX_MIME_TYPE });
  const enderecoUrl = URL.createObjectURL(arquivo);
  const elementoA = document.createElement("a");
  elementoA.href = enderecoUrl;
  elementoA.download = nomeArquivo;
  elementoA.click();
  window.setTimeout(() => URL.revokeObjectURL(enderecoUrl), 1000);
}

export function baixarXlsxRecebido(resposta, nomeArquivo) {
  if (!(resposta?.data instanceof Blob)) throw new Error("O serviço não retornou um arquivo Excel válido.");
  const enderecoUrl = URL.createObjectURL(resposta.data);
  const elementoA = document.createElement("a");
  elementoA.href = enderecoUrl;
  elementoA.download = nomeArquivo;
  elementoA.click();
  window.setTimeout(() => URL.revokeObjectURL(enderecoUrl), 1000);
}
