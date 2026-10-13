# Cenários da tela inicial — geração no Blender

Fundos estáticos (Casa, Escola, Parque, Terapia) usados atrás do slime na tela inicial. O slime **não** entra na imagem: o app desenha o slime ao vivo por cima.

- Ferramenta: Blender 4.5 LTS, sem add-ons, renderização Cycles. Usa a GPU NVIDIA quando houver (OptiX, depois CUDA) e cai para a CPU; `--cpu` força a CPU. A linha `DISPOSITIVO` no log mostra qual foi usado.
- Modelos: Kenney Furniture Kit e Nature Kit, **CC0** (licenças em `recursos/kenney/LICENCA-*.txt`). Só os modelos usados foram copiados para o repositório.
- Saída: `apps/mobile/assets/cenarios/<cenario>.jpg`, 1080×2400, ~80 KB.

## Gerar

```sh
# todos (≈ 1 min na GPU, ≈ 9 min na CPU, com 96 amostras)
blender -b --factory-startup --python-exit-code 1 -P ferramentas/cenarios/gerar_cenarios.py -- --saida apps/mobile/assets/cenarios

# só um, para ajustes (baixe AMOSTRAS no script para iterar mais rápido)
blender -b --factory-startup --python-exit-code 1 -P ferramentas/cenarios/gerar_cenarios.py -- --saida <pasta> --so escola
```

## Regras de composição

- Fundo calmo e estático: sem luzes fortes, piscantes ou excesso de elementos.
- Centro do chão livre (o slime fica ali).
- Alto das laterais sem detalhes fortes (ali ficam as pílulas de ações).
- Nada que identifique pessoas reais.

Depois de gerar, conferir no aparelho: o Metro precisa ser reiniciado com `--clear` se as imagens forem criadas com ele rodando.
