# Mascote slime — geração 3D

O slime é **gerado por script** no Blender, sem interface e sem add-ons. O arquivo `apps/mobile/assets/slime/slime.glb` é saída deste script; não editar o `.glb` à mão.

- Ferramenta: **Blender 4.5 LTS** (testado com 4.5.10). Gratuito; o modelo gerado é do projeto, a licença GPL vale para o programa.
- Referência visual aprovada: as prévias em `docs/slime/previas-3d/` (gota sem bico, boca "ω" sem língua; ver `docs/experiencia-avatar.md`, 3.1).
- Prévias renderizadas (Cycles, na GPU quando houver; `--cpu` força a CPU) para aprovação: `docs/slime/previas-3d/` (`folha.png` reúne todas).
- Personagem original: não copiar personagens de anime ou jogos (`docs/experiencia-avatar.md`, seção 3.1).

## Gerar

Na raiz do repositório:

```sh
# modelo do app + prévias (≈ 1 min e meio)
blender -b --factory-startup --python-exit-code 1 -P ferramentas/slime/gerar_slime.py -- --saida apps/mobile/assets/slime --previas docs/slime/previas-3d

# folha com todas as prévias (Windows)
powershell -File ferramentas/slime/montar_folha.ps1 -Pasta <caminho absoluto>\docs\slime\previas-3d -Saida <caminho absoluto>\docs\slime\previas-3d\folha.png

# conferir a estrutura que o app espera (sai com código 1 se faltar algo)
node ferramentas/slime/inspecionar-glb.mjs apps/mobile/assets/slime/slime.glb
```

`--blend <arquivo>` salva também um `.blend` para mexer à mão no Blender (fora do Git). Mudança feita à mão precisa voltar para o script; senão se perde na próxima geração.

O exportador glTF pode mudar a ordem interna dos vértices: duas gerações não são idênticas byte a byte, mas forma, nós e animações são.

## Contrato com o app

| Item | Conteúdo |
|---|---|
| Material `corpo` | Transparente por alfa (`alphaMode: BLEND`, alfa `ALFA_CORPO = 0.8`, igual no app) com verniz (`clearcoat`). A transmissão (`KHR_materials_transmission`) só vale nas prévias do Blender: o react-native-filament não a implementa. **A cor da reação é aplicada pelo app** (`baseColorFactor`, com o mesmo alfa): neutro `#79AEE0`, claro `#8CC2F0`, enjoo `#9ACF94`, desconforto `#F2BE9C`. |
| Deformações do corpo (morph targets) | `achatar`, `esticar`, `amassar`, `respirar` |
| Nós do rosto (mostrar = escala 1, esconder = escala 0) | `olhos_abertos`, `olhos_apertados` ("> <"), `olhos_piscando`, `olhos_cansados`, `olhos_barra`, `olhos_alegres`, `sobrancelhas_preocupadas`, `bochechas`, `boca_gato` ("ω"), `boca_sorriso`, `boca_ondulada`, `boca_preocupada`, `boca_o` |
| Objetos de cena | `maca` (dentro do corpo, alimentação), `bolhas_banho` |
| Clipes (todos terminam no neutro) | `neutro` 0,1 s, `respirar` 3 s (repouso, em laço), `sono` 3 s, `quicar` 1,2 s (positivo), `enjoo` 2,5 s, `desconforto` 2,5 s, `alimentacao` 2,5 s, `banho` 2,5 s, `cutucada` 0,8 s (toque no slime) |

Na pose de repouso, só os grupos de partes podem ter escala 0; peças internas nunca (o inspetor confere). O Blender sai com código 0 mesmo se o script falhar: usar sempre `--python-exit-code 1`.

Cada clipe contém **todos** os canais (partes, rosto e deformações): tocar qualquer clipe define o estado visual inteiro, e `neutro` restaura o repouso quando uma reação é interrompida. Episódios difíceis e evacuação **não** têm clipe: o slime fica neutro.

Balão de região da dor, "z z" do sono e o card "Registro salvo" ficam por conta da interface (2D), sobre a cena 3D (`apps/mobile/src/components/slime/detalhes-da-reacao.tsx` e o aviso de desfazer).
