import assert from "node:assert/strict";
import { test } from "node:test";
import { ehResiduoDeExportacao } from "./residuos";

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
