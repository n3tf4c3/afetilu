import assert from "node:assert/strict";
import { test } from "node:test";
import { ehResiduoDeExportacao, limparResiduos } from "./residuos";

// Achado 1: a limpeza diz se tudo saiu; falha de I/O não pode passar por remoção completa.
test("limpeza informa resíduo que não saiu e cache que não pôde ser listado", () => {
  const cache = [
    { name: "resumos", pasta: true },
    { name: "afetilu-backup-1.afetilu", pasta: false },
    { name: "ImagePicker", pasta: true },
  ];
  const apagados: string[] = [];
  const apagar = (falha?: string) => (item: { name: string }) => {
    if (item.name === falha) throw new Error("EIO");
    apagados.push(item.name);
  };
  assert.equal(limparResiduos(() => cache, (i) => i.pasta, apagar()), true);
  assert.deepEqual(apagados, ["resumos", "afetilu-backup-1.afetilu"]);
  apagados.length = 0;
  // Um falha, o outro ainda é tentado.
  assert.equal(limparResiduos(() => cache, (i) => i.pasta, apagar("resumos")), false);
  assert.deepEqual(apagados, ["afetilu-backup-1.afetilu"]);
  assert.equal(
    limparResiduos(() => { throw new Error("EIO"); }, () => false, apagar()),
    false,
  );
});

test("PDFs, backups e as pastas de exportação saem do cache", () => {
  assert.equal(ehResiduoDeExportacao("resumos", true), true);
  assert.equal(ehResiduoDeExportacao("Print", true), true);
  assert.equal(ehResiduoDeExportacao("Resumo para consulta - Exemplo - 2026-10-21.pdf", false), true);
  assert.equal(ehResiduoDeExportacao("RESUMO.PDF", false), true);
  assert.equal(ehResiduoDeExportacao("afetilu-backup-2026-10-21-1030.afetilu", false), true);
});

test("o resto do cache fica", () => {
  assert.equal(ehResiduoDeExportacao("ImagePicker", true), false);
  assert.equal(ehResiduoDeExportacao("resumos.pdf", true), false);
  assert.equal(ehResiduoDeExportacao("http-cache", false), false);
  assert.equal(ehResiduoDeExportacao("slime.glb", false), false);
});
