"""Gera o mascote slime do Elo Azul no Blender, sem interface.

Uso (na raiz do repositório):
  blender -b --factory-startup --python-exit-code 1 -P ferramentas/slime/gerar_slime.py -- --saida apps/mobile/assets/slime
  blender -b --factory-startup --python-exit-code 1 -P ferramentas/slime/gerar_slime.py -- --saida apps/mobile/assets/slime --previas docs/slime/previas-3d

O modelo é inteiramente procedural: rodar de novo gera o mesmo modelo. O exportador glTF do Blender
pode mudar a ordem interna dos vértices, então o .glb não é idêntico byte a byte; a forma, os nós e
as animações são (conferido em 13/10/2026 com o inspecionar-glb.mjs e comparação de vértices).
Referência visual aprovada: docs/slime/rascunho-expressoes-v0.svg.

Personagem original. Não copiar personagens de anime ou jogos (ver docs/experiencia-avatar.md, 3.1).
"""

import argparse
import math
import os
import sys

import bpy
from mathutils import Euler, Vector

# --- Parâmetros do personagem --------------------------------------------------------------

ALTURA = 0.95  # semi-eixo vertical da cúpula (raio horizontal = 1); "gordinho" aprovado em 13/10/2026
BASE_Z = -0.10  # base achatada, levemente arredondada
CENTRO_ROSTO_Z = 0.38

CORES = {
    "corpo": "#79AEE0",
    "olho": "#22324A",
    "brilho": "#FFFFFF",
    "bochecha": "#EE8FA8",
    "maca": "#E86B6B",
    "folha": "#6BAF6B",
}
# Cores passageiras das reações, aplicadas pelo app no material "corpo" (não ficam no arquivo).
CORES_REACAO = {"neutro": "#79AEE0", "claro": "#8CC2F0", "enjoo": "#9ACF94", "desconforto": "#F2BE9C"}

FPS = 30

# Transparência real do corpo (alfa, mistura BLEND). O react-native-filament não implementa
# KHR_materials_transmission (o material carregado não tem "transmissionFactor"); a transmissão
# fica só para as prévias do Blender. Manter igual a ALFA_CORPO em apps/mobile/src/components/slime/reacoes.ts.
ALFA_CORPO = 0.8


def srgb_para_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgba(hex_cor: str, alfa: float = 1.0):
    h = hex_cor.lstrip("#")
    return tuple(srgb_para_linear(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4)) + (alfa,)


# --- Cena ----------------------------------------------------------------------------------


def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cena = bpy.context.scene
    cena.render.fps = FPS
    cena.frame_start = 1
    return cena


def material(nome, cor, *, rugosidade=0.4, transmissao=0.0, alfa=1.0, ior=1.45, verniz=0.0, brilho_proprio=0.0):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = rgba(cor)
    bsdf.inputs["Roughness"].default_value = rugosidade
    bsdf.inputs["IOR"].default_value = ior
    bsdf.inputs["Transmission Weight"].default_value = transmissao
    bsdf.inputs["Coat Weight"].default_value = verniz
    bsdf.inputs["Coat Roughness"].default_value = 0.03
    if brilho_proprio:
        # Objetos dentro do corpo translúcido precisam de um pouco de luz própria para ler a cor.
        bsdf.inputs["Emission Color"].default_value = rgba(cor)
        bsdf.inputs["Emission Strength"].default_value = brilho_proprio
    if alfa < 1.0:
        bsdf.inputs["Alpha"].default_value = alfa
        m.surface_render_method = "BLENDED"
    return m


# --- Geometria -----------------------------------------------------------------------------


def superficie(x: float, z: float, folga: float = 0.0) -> tuple[Vector, Vector]:
    """Ponto na frente da cúpula (lado -Y) para coordenadas (x, z) e a normal ali."""
    y2 = max(1.0 - x * x - (z / ALTURA) ** 2, 1e-6)
    p = Vector((x, -math.sqrt(y2), z))
    n = Vector((p.x, p.y, p.z / (ALTURA * ALTURA))).normalized()
    return p + n * folga, n


def rotacao_para(normal: Vector) -> Euler:
    """Rotação que leva o eixo -Y local a apontar para a normal (o "rosto" do objeto)."""
    return Vector((0, -1, 0)).rotation_difference(normal).to_euler()


def criar_corpo(mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=72, ring_count=36, radius=1.0)
    corpo = bpy.context.active_object
    corpo.name = "corpo"
    for v in corpo.data.vertices:
        x, y, z = v.co
        if z >= 0:
            v.co.z = z * ALTURA
        else:
            # Metade de baixo vira uma base quase plana com borda arredondada.
            t = -z
            v.co.z = BASE_Z * math.sin(t * math.pi / 2)
            raio = math.sqrt(1 - t * t)
            fator = 0.96 + 0.04 * raio
            v.co.x = x * fator
            v.co.y = y * fator
    bpy.ops.object.shade_smooth()
    corpo.data.materials.append(mat)

    # Deformações (morph targets): o app e as animações combinam os pesos.
    corpo.shape_key_add(name="Basis")
    deformacoes = {
        "achatar": (1.18, 0.55),  # sono: poça
        "esticar": (0.90, 1.22),  # quique: subida
        "amassar": (1.08, 0.82),  # quique: aterrissagem
        "respirar": (1.015, 1.03),
    }
    for nome, (sxy, sz) in deformacoes.items():
        k = corpo.shape_key_add(name=nome, from_mix=False)
        for i, v in enumerate(corpo.data.vertices):
            x, y, z = v.co
            k.data[i].co = Vector((x * sxy, y * sxy, BASE_Z + (z - BASE_Z) * sz))
    return corpo


def tubo(nome, pontos_xz, mat, *, espessura=0.016, folga=0.012, pai=None):
    """Traço (boca, sobrancelha, olho fechado) desenhado sobre a superfície da cúpula."""
    curva = bpy.data.curves.new(nome, "CURVE")
    curva.dimensions = "3D"
    curva.bevel_depth = espessura
    curva.bevel_resolution = 4
    curva.use_fill_caps = True
    sp = curva.splines.new("POLY")
    sp.points.add(len(pontos_xz) - 1)
    for i, (x, z) in enumerate(pontos_xz):
        p, _ = superficie(x, z, folga)
        sp.points[i].co = (p.x, p.y, p.z, 1)
    obj = bpy.data.objects.new(nome, curva)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    if pai:
        obj.parent = pai
    return obj


def arco(cx, cz, largura, altura, n=16):
    """Pontos de um arco de parábola: altura > 0 curva para baixo (sorriso)."""
    return [(cx + largura * (i / (n - 1) - 0.5), cz - altura * (1 - (2 * i / (n - 1) - 1) ** 2)) for i in range(n)]


def onda(cx, cz, largura, amplitude, ondas=2, n=40):
    return [
        (cx + largura * (i / (n - 1) - 0.5), cz + amplitude * math.sin(2 * math.pi * ondas * i / (n - 1)))
        for i in range(n)
    ]


def elipsoide(nome, x, z, escala, mat, *, folga=0.0, pai=None, segmentos=32):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segmentos, ring_count=segmentos // 2, radius=1.0)
    obj = bpy.context.active_object
    obj.name = nome
    p, n = superficie(x, z, folga)
    obj.location = p
    obj.rotation_euler = rotacao_para(n)
    obj.scale = escala
    # Tamanho e orientação ficam na malha: a escala do objeto fica livre para mostrar/esconder (1 ou 0).
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(mat)
    if pai:
        obj.parent = pai
    return obj


def grupo(nome, pai=None):
    vazio = bpy.data.objects.new(nome, None)
    bpy.context.collection.objects.link(vazio)
    if pai:
        vazio.parent = pai
    return vazio


# --- Personagem ----------------------------------------------------------------------------


def montar():
    mats = {
        "corpo": material("corpo", CORES["corpo"], rugosidade=0.05, transmissao=0.65, ior=1.33, verniz=0.7, alfa=ALFA_CORPO),
        "olho": material("olho", CORES["olho"], rugosidade=0.25),
        "brilho": material("brilho", CORES["brilho"], rugosidade=0.2),
        "bochecha": material("bochecha", CORES["bochecha"], rugosidade=0.7, alfa=0.9),
        "maca": material("maca", CORES["maca"], rugosidade=0.35, brilho_proprio=0.6),
        "folha": material("folha", CORES["folha"], rugosidade=0.5),
        "bolha": material("bolha", "#FFFFFF", rugosidade=0.05, transmissao=0.9, alfa=0.6),
    }
    corpo = criar_corpo(mats["corpo"])
    raiz = grupo("slime")
    corpo.parent = raiz
    rosto = grupo("rosto", raiz)
    ez, ex = CENTRO_ROSTO_Z, 0.24

    partes = {}

    # Olhos abertos: ovais escuros com dois brilhos (marca do personagem).
    g = grupo("olhos_abertos", rosto)
    for lado in (-1, 1):
        elipsoide(f"olho_{lado}", lado * ex, ez, (0.082, 0.03, 0.11), mats["olho"], folga=0.0, pai=g)
        elipsoide(f"brilho_a_{lado}", lado * ex + 0.027, ez + 0.047, (0.026, 0.014, 0.026), mats["brilho"], folga=0.02, pai=g)
        elipsoide(f"brilho_b_{lado}", lado * ex - 0.025, ez - 0.047, (0.012, 0.009, 0.012), mats["brilho"], folga=0.02, pai=g)
    partes["olhos_abertos"] = g

    # Olhos do enjoo: pequenos e sem brilho (sem pálpebra, que lia como bravo).
    g = grupo("olhos_cansados", rosto)
    for lado in (-1, 1):
        elipsoide(f"olho_c_{lado}", lado * ex, ez - 0.015, (0.034, 0.016, 0.034), mats["olho"], pai=g)
    partes["olhos_cansados"] = g

    # Olhos fechados de sono (arco para baixo) e de alegria (arco para cima).
    g = grupo("olhos_sono", rosto)
    for lado in (-1, 1):
        tubo(f"sono_{lado}", arco(lado * ex, ez + 0.005, 0.11, 0.035), mats["olho"], espessura=0.013, pai=g)
    partes["olhos_sono"] = g
    g = grupo("olhos_alegres", rosto)
    for lado in (-1, 1):
        tubo(f"alegre_{lado}", arco(lado * ex, ez - 0.02, 0.11, -0.045), mats["olho"], espessura=0.013, pai=g)
    partes["olhos_alegres"] = g

    # Sobrancelhas preocupadas (desconforto): extremidades internas mais altas, sem choro.
    g = grupo("sobrancelhas_preocupadas", rosto)
    for lado in (-1, 1):
        tubo(f"sobrancelha_{lado}", [(lado * (ex + 0.07), ez + 0.1), (lado * (ex - 0.06), ez + 0.135)], mats["olho"], espessura=0.011, pai=g)
    partes["sobrancelhas_preocupadas"] = g

    # Bochechas.
    g = grupo("bochechas", rosto)
    for lado in (-1, 1):
        elipsoide(f"bochecha_{lado}", lado * (ex + 0.11), ez - 0.12, (0.085, 0.008, 0.045), mats["bochecha"], folga=0.006, pai=g)
    partes["bochechas"] = g

    # Bocas.
    bz = ez - 0.16
    partes["boca_neutra"] = tubo("boca_neutra", arco(0, bz, 0.11, 0.032), mats["olho"], pai=rosto)
    partes["boca_sorriso"] = tubo("boca_sorriso", arco(0, bz + 0.01, 0.13, 0.05), mats["olho"], espessura=0.02, pai=rosto)
    partes["boca_ondulada"] = tubo("boca_ondulada", onda(0, bz, 0.17, 0.018), mats["olho"], espessura=0.015, pai=rosto)
    partes["boca_preocupada"] = tubo("boca_preocupada", arco(0, bz - 0.01, 0.08, -0.02), mats["olho"], pai=rosto)
    partes["boca_o"] = elipsoide("boca_o", 0, bz, (0.022, 0.01, 0.017), mats["olho"], pai=rosto)

    # Objetos que aparecem DENTRO do corpo translúcido (alimento) ou ao redor (bolhas).
    maca = grupo("maca", raiz)
    maca.location = (0.44, -0.76, 0.12)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.1)
    m = bpy.context.active_object
    m.name = "maca_fruta"
    bpy.ops.object.shade_smooth()
    m.data.materials.append(mats["maca"])
    m.parent = maca
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1.0)
    f = bpy.context.active_object
    f.name = "maca_folha"
    f.scale = (0.05, 0.012, 0.025)
    f.location = (0.03, 0, 0.11)
    f.rotation_euler = (0, math.radians(-25), 0)
    f.data.materials.append(mats["folha"])
    f.parent = maca
    partes["maca"] = maca

    bolhas = grupo("bolhas_banho", raiz)
    for i, (x, z, r) in enumerate([(-1.05, 0.55, 0.09), (-0.8, 0.85, 0.05), (1.0, 0.7, 0.1), (1.15, 0.3, 0.06), (0.65, 1.0, 0.04), (-1.2, 0.15, 0.045)]):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=(x, -0.2, z))
        b = bpy.context.active_object
        b.name = f"bolha_{i}"
        bpy.ops.object.shade_smooth()
        b.data.materials.append(mats["bolha"])
        b.parent = bolhas
    partes["bolhas_banho"] = bolhas

    return raiz, corpo, rosto, partes


# Estado visual de cada expressão: partes visíveis e pesos das deformações.
VISIVEL_SEMPRE = ()
EXPRESSOES = {
    "neutro": {"partes": ("olhos_abertos", "bochechas", "boca_neutra"), "pesos": {}},
    "alimentacao": {"partes": ("olhos_abertos", "bochechas", "boca_sorriso", "maca"), "pesos": {}},
    "enjoo": {"partes": ("olhos_cansados", "bochechas", "boca_ondulada"), "pesos": {"amassar": 0.3}},
    "desconforto": {"partes": ("olhos_abertos", "sobrancelhas_preocupadas", "bochechas", "boca_preocupada"), "pesos": {}},
    "sono": {"partes": ("olhos_sono", "bochechas", "boca_o"), "pesos": {"achatar": 1.0}},
    "banho": {"partes": ("olhos_alegres", "bochechas", "boca_sorriso", "bolhas_banho"), "pesos": {}},
    "positivo": {"partes": ("olhos_abertos", "bochechas", "boca_sorriso"), "pesos": {"esticar": 0.6}},
}
COR_EXPRESSAO = {
    "neutro": "neutro",
    "alimentacao": "neutro",
    "enjoo": "enjoo",
    "desconforto": "desconforto",
    "sono": "neutro",
    "banho": "claro",
    "positivo": "claro",
}


def escala_para_peso(corpo, pesos):
    """Acompanha o rosto quando o corpo se deforma (o rosto é objeto separado)."""
    sxy, sz = 1.0, 1.0
    for nome, (dxy, dz) in {"achatar": (1.18, 0.55), "esticar": (0.90, 1.22), "amassar": (1.08, 0.82)}.items():
        w = pesos.get(nome, 0.0)
        sxy *= 1 + (dxy - 1) * w
        sz *= 1 + (dz - 1) * w
    return sxy, sz


def aplicar_expressao(nome, corpo, rosto, partes):
    e = EXPRESSOES[nome]
    for chave, obj in partes.items():
        obj.scale = (1, 1, 1) if chave in e["partes"] else (0, 0, 0)
    for kb in corpo.data.shape_keys.key_blocks[1:]:
        kb.value = e["pesos"].get(kb.name, 0.0)
    sxy, sz = escala_para_peso(corpo, e["pesos"])
    rosto.scale = (sxy, sxy, sz)
    rosto.location = (0, 0, BASE_Z - BASE_Z * sz)
    corpo.active_material.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = rgba(
        CORES_REACAO[COR_EXPRESSAO[nome]]
    )


# --- Animações -----------------------------------------------------------------------------


def chave(obj, caminho, quadro, valor, *, interpolacao="BEZIER"):
    setattr_path = caminho.split(".")
    alvo = obj
    for p in setattr_path[:-1]:
        alvo = getattr(alvo, p)
    setattr(alvo, setattr_path[-1], valor)
    obj.keyframe_insert(data_path=caminho, frame=quadro)


def animar(raiz, corpo, rosto, partes):
    """Cada reação vira um clipe glTF (via faixas de NLA de mesmo nome). Todas terminam no neutro."""
    s = 1 / FPS

    def quadros(segundos):
        return round(segundos * FPS) + 1

    clipes = {
        # nome: (duração em s, [(tempo, pesos, expressão)])
        # "neutro" restaura o repouso completo; o app usa ao interromper uma reação.
        "neutro": (0.1, [(0, {}, "neutro"), (0.1, {}, "neutro")]),
        "respirar": (3.0, [(0, {}, "neutro"), (1.5, {"respirar": 1.0}, "neutro"), (3.0, {}, "neutro")]),
        "sono": (3.0, [(0, {}, "neutro"), (0.5, {"achatar": 1.0}, "sono"), (2.4, {"achatar": 1.0}, "sono"), (3.0, {}, "neutro")]),
        "quicar": (
            1.2,
            [(0, {}, "positivo"), (0.2, {"amassar": 1.0}, "positivo"), (0.45, {"esticar": 1.0}, "positivo"), (0.75, {"amassar": 0.6}, "positivo"), (1.2, {}, "neutro")],
        ),
        "enjoo": (2.5, [(0, {}, "enjoo"), (0.6, {"amassar": 0.4}, "enjoo"), (1.8, {"amassar": 0.4}, "enjoo"), (2.5, {}, "neutro")]),
        "desconforto": (2.5, [(0, {}, "desconforto"), (2.2, {}, "desconforto"), (2.5, {}, "neutro")]),
        "alimentacao": (2.5, [(0, {}, "alimentacao"), (0.4, {"amassar": 0.3}, "alimentacao"), (0.8, {}, "alimentacao"), (2.2, {}, "alimentacao"), (2.5, {}, "neutro")]),
        "banho": (2.5, [(0, {}, "banho"), (1.2, {"respirar": 1.0}, "banho"), (2.2, {}, "banho"), (2.5, {}, "neutro")]),
    }

    objetos_rosto = list(partes.values())
    chaves_forma = corpo.data.shape_keys

    for nome_clipe, (duracao, marcos) in clipes.items():
        for alvo in [rosto, *objetos_rosto, chaves_forma]:
            if alvo.animation_data is None:
                alvo.animation_data_create()
            alvo.animation_data.action = None

        for t, pesos, expr in marcos:
            q = quadros(t)
            visiveis = EXPRESSOES[expr]["partes"]
            for chave_parte, obj in partes.items():
                obj.scale = (1, 1, 1) if chave_parte in visiveis else (0, 0, 0)
                obj.keyframe_insert("scale", frame=q)
            for kb in chaves_forma.key_blocks[1:]:
                kb.value = pesos.get(kb.name, 0.0)
                kb.keyframe_insert("value", frame=q)
            sxy, sz = escala_para_peso(corpo, pesos)
            rosto.scale = (sxy, sxy, sz)
            rosto.location = (0, 0, BASE_Z - BASE_Z * sz)
            rosto.keyframe_insert("scale", frame=q)
            rosto.keyframe_insert("location", frame=q)

        # Troca de partes é instantânea (sem "derreter" uma boca na outra).
        for obj in objetos_rosto:
            for fc in _curvas(obj.animation_data.action):
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"

        for alvo in [rosto, *objetos_rosto, chaves_forma]:
            acao = alvo.animation_data.action
            acao.name = f"{nome_clipe}__{alvo.name if hasattr(alvo, 'name') else 'formas'}"
            faixa = alvo.animation_data.nla_tracks.new()
            faixa.name = nome_clipe
            faixa_clipe = faixa.strips.new(nome_clipe, 1, acao)
            # Fora do próprio intervalo a faixa não influencia nada: a pose de repouso exportada
            # é a neutra (com "Hold", o último clipe esconderia partes e degeneraria as filhas).
            faixa_clipe.extrapolation = "NOTHING"
            alvo.animation_data.action = None

    return list(clipes)


def _curvas(acao):
    """F-curves de uma ação, nas APIs antiga e nova (ações com camadas, Blender 4.4+)."""
    if hasattr(acao, "fcurves") and len(acao.fcurves):
        return list(acao.fcurves)
    curvas = []
    for camada in getattr(acao, "layers", []):
        for faixa in camada.strips:
            for cb in faixa.channelbags:
                curvas.extend(cb.fcurves)
    return curvas


# --- Saídas --------------------------------------------------------------------------------


def exportar(caminho):
    # Quadro 0 fica antes de todas as faixas: nenhuma animação altera a pose de repouso.
    bpy.context.scene.frame_set(0)
    bpy.ops.export_scene.gltf(
        filepath=caminho,
        export_format="GLB",
        export_yup=True,
        export_apply=False,
        export_morph=True,
        export_morph_normal=True,
        export_animations=True,
        export_animation_mode="NLA_TRACKS",
        export_force_sampling=True,
        # Todo clipe carrega todos os canais: qualquer reação define o estado visual inteiro.
        export_optimize_animation_size=False,
        export_optimize_animation_keep_anim_object=True,
        export_anim_slide_to_zero=True,
        export_extras=False,
        export_cameras=False,
        export_lights=False,
    )


def configurar_dispositivo(forcar_cpu=False):
    """Renderiza na GPU quando houver (OptiX, depois CUDA); senão, na CPU. Chamar depois de
    read_factory_settings, que também zera as preferências."""
    cena = bpy.context.scene
    if forcar_cpu:
        cena.cycles.device = "CPU"
        print("DISPOSITIVO CPU (forçado)")
        return
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for tipo in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = tipo
        except TypeError:
            continue
        prefs.refresh_devices()
        gpus = [d for d in prefs.devices if d.type == tipo]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == tipo
            cena.cycles.device = "GPU"
            print(f"DISPOSITIVO {tipo}: {', '.join(d.name for d in gpus)}")
            return
    cena.cycles.device = "CPU"
    print("DISPOSITIVO CPU (nenhuma GPU compatível)")


def previas(pasta, corpo, rosto, partes, forcar_cpu=False):
    """Imagens renderizadas (Cycles) de cada expressão, para aprovação visual."""
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    configurar_dispositivo(forcar_cpu)
    cena.cycles.samples = 64
    cena.cycles.use_denoising = True
    cena.render.resolution_x = 720
    cena.render.resolution_y = 560
    cena.render.film_transparent = False
    cena.view_settings.view_transform = "Standard"

    mundo = bpy.data.worlds.new("fundo")
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("#FAF7F2")
    mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
    cena.world = mundo

    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, BASE_Z - 0.001))
    chao = bpy.context.active_object
    chao.name = "chao_previa"
    chao.data.materials.append(material("chao", "#FAF7F2", rugosidade=0.9))

    bpy.ops.object.light_add(type="AREA", location=(-0.6, 1.6, 4.4))
    luz = bpy.context.active_object
    luz.data.energy = 330
    luz.data.shape = "DISK"
    luz.data.size = 2.6
    luz.rotation_euler = Euler((math.radians(-12), 0, 0))
    bpy.ops.object.light_add(type="AREA", location=(-3.0, 2.2, 1.2))
    luz2 = bpy.context.active_object
    luz2.data.energy = 60
    luz2.data.shape = "DISK"
    luz2.data.size = 1.2
    luz2.rotation_euler = Euler((math.radians(-70), 0, math.radians(-55)))

    bpy.ops.object.camera_add(location=(0, -5.2, 1.55))
    cam = bpy.context.active_object
    cam.rotation_euler = Euler((math.radians(80.5), 0, 0))
    cam.data.lens = 56
    cena.camera = cam

    os.makedirs(pasta, exist_ok=True)
    for nome in EXPRESSOES:
        aplicar_expressao(nome, corpo, rosto, partes)
        cena.render.filepath = os.path.join(pasta, f"{nome}.png")
        bpy.ops.render.render(write_still=True)
    aplicar_expressao("neutro", corpo, rosto, partes)

    # As peças da prévia não vão para o arquivo do app.
    for obj in (chao, luz, luz2, cam):
        bpy.data.objects.remove(obj, do_unlink=True)


def principal():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--saida", required=True)
    p.add_argument("--previas")
    p.add_argument("--cpu", action="store_true", help="prévias na CPU mesmo havendo GPU")
    p.add_argument("--blend", help="salva também o .blend para edição manual (não versionar)")
    args = p.parse_args(argv)
    # O Blender resolve caminhos relativos a partir do .blend, não do terminal.
    args.saida = os.path.abspath(args.saida)
    args.previas = os.path.abspath(args.previas) if args.previas else None
    args.blend = os.path.abspath(args.blend) if args.blend else None

    limpar_cena()
    raiz, corpo, rosto, partes = montar()
    aplicar_expressao("neutro", corpo, rosto, partes)

    if args.previas:
        previas(args.previas, corpo, rosto, partes, args.cpu)

    clipes = animar(raiz, corpo, rosto, partes)
    aplicar_expressao("neutro", corpo, rosto, partes)

    os.makedirs(args.saida, exist_ok=True)
    exportar(os.path.join(args.saida, "slime.glb"))
    if args.blend:
        bpy.ops.wm.save_as_mainfile(filepath=args.blend, compress=True)
    print(f"SLIME_OK clipes={','.join(clipes)}")


principal()
