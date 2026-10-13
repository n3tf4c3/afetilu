"""Gera as imagens de fundo dos cenários da tela inicial (casa, escola, parque, terapia).

Uso (na raiz do repositório):
  blender -b --factory-startup --python-exit-code 1 -P ferramentas/cenarios/gerar_cenarios.py -- --saida apps/mobile/assets/cenarios

Usa modelos CC0 da Kenney (ferramentas/cenarios/recursos/kenney, licenças ao lado) e geometria
procedural. O slime NÃO entra na imagem: ele é desenhado ao vivo pelo app por cima do fundo.

Regras de composição (docs/experiencia-avatar.md): fundo estático e calmo, sem luzes fortes nem
excesso de elementos; centro do chão livre para o slime; alto das laterais sem detalhes fortes,
porque ali ficam as pílulas de ações.
"""

import argparse
import math
import os
import sys

import bpy
from mathutils import Euler, Vector

PASTA_RECURSOS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recursos", "kenney")
ESCALA_KENNEY = 2.2  # parede da Kenney tem 1,29 → ~2,8 m
LARGURA, ALTURA = 1080, 2400
AMOSTRAS = 96
FUNDO_Y = 3.2  # parede do fundo (sala pouco funda: os móveis aparecem maiores)


def srgb(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgba(hex_cor: str, alfa: float = 1.0):
    h = hex_cor.lstrip("#")
    return tuple(srgb(int(h[i : i + 2], 16) / 255) for i in (0, 2, 4)) + (alfa,)


def material(nome, cor, *, rugosidade=0.7, emissao=0.0, transmissao=0.0, alfa=1.0):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba(cor)
    b.inputs["Roughness"].default_value = rugosidade
    b.inputs["Transmission Weight"].default_value = transmissao
    if emissao:
        b.inputs["Emission Color"].default_value = rgba(cor)
        b.inputs["Emission Strength"].default_value = emissao
    if alfa < 1:
        b.inputs["Alpha"].default_value = alfa
        m.surface_render_method = "BLENDED"
    return m


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


def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.samples = AMOSTRAS
    cena.cycles.use_denoising = True
    cena.render.resolution_x = LARGURA
    cena.render.resolution_y = ALTURA
    cena.render.image_settings.file_format = "JPEG"
    cena.render.image_settings.quality = 82
    cena.view_settings.view_transform = "Standard"
    cena.view_settings.exposure = -0.9
    return cena


def importar(nome, local=(0, 0, 0), rot_z=0.0, escala=1.0):
    """Importa um modelo Kenney, agrupado num vazio para posicionar e girar."""
    antes = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(PASTA_RECURSOS, f"{nome}.glb"))
    novos = [o for o in bpy.context.scene.objects if o not in antes]
    grupo = bpy.data.objects.new(nome, None)
    bpy.context.collection.objects.link(grupo)
    for o in novos:
        if o.parent is None:
            o.parent = grupo
    grupo.location = local
    grupo.rotation_euler = (0, 0, math.radians(rot_z))
    grupo.scale = (ESCALA_KENNEY * escala,) * 3
    return grupo


def plano(nome, tamanho, local, rot, mat):
    bpy.ops.mesh.primitive_plane_add(size=1, location=local, rotation=rot)
    p = bpy.context.active_object
    p.name = nome
    p.scale = (tamanho[0], tamanho[1], 1)
    p.data.materials.append(mat)
    return p


def caixa(nome, dim, local, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=local)
    c = bpy.context.active_object
    c.name = nome
    c.scale = dim
    c.data.materials.append(mat)
    return c


def esfera(nome, raio, local, escala, mat, segmentos=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segmentos, ring_count=segmentos // 2, radius=raio, location=local)
    s = bpy.context.active_object
    s.name = nome
    s.scale = escala
    bpy.ops.object.shade_smooth()
    s.data.materials.append(mat)
    return s


def sala(cor_parede, cor_chao, cor_rodape="#FFFFFF"):
    """Sala simples: chão, parede do fundo e paredes laterais, sem teto."""
    plano("chao", (12, 12), (0, 2, 0), (0, 0, 0), material("chao", cor_chao, rugosidade=0.55))
    parede = material("parede", cor_parede, rugosidade=0.9)
    plano("parede_fundo", (12, 10), (0, FUNDO_Y, 5), (math.radians(90), 0, 0), parede)
    plano("parede_esq", (8, 10), (-3.4, 0, 5), (math.radians(90), 0, math.radians(90)), parede)
    plano("parede_dir", (8, 10), (3.4, 0, 5), (math.radians(90), 0, math.radians(-90)), parede)
    rodape = material("rodape", cor_rodape, rugosidade=0.6)
    caixa("rodape", (12, 0.04, 0.12), (0, FUNDO_Y - 0.02, 0.06), rodape)


def janela(x, z, largura, altura):
    """Janela clara na parede do fundo (luz suave entrando)."""
    moldura = material("moldura", "#FFFFFF", rugosidade=0.5)
    y = FUNDO_Y - 0.03
    caixa("moldura", (largura + 0.12, 0.06, altura + 0.12), (x, y, z), moldura)
    vidro = material("ceu_janela", "#A9D4F2", emissao=0.8)
    caixa("vidro", (largura, 0.07, altura), (x, y - 0.01, z), vidro)
    cortina = material("cortina", "#E9B8A6", rugosidade=0.95)
    for lado in (-1, 1):
        caixa("cortina", (0.32, 0.05, altura + 0.5), (x + lado * (largura / 2 + 0.2), y - 0.08, z - 0.1), cortina)


def quadro(x, z, largura, altura, cor):
    """Quadro decorativo simples na parede do fundo."""
    caixa("quadro_moldura", (largura + 0.08, 0.04, altura + 0.08), (x, FUNDO_Y - 0.02, z), material("qm", "#FFFFFF", rugosidade=0.5))
    caixa("quadro", (largura, 0.05, altura), (x, FUNDO_Y - 0.03, z), material("q", cor, rugosidade=0.8))


def luzes(intensidade=1.0, cor_ceu="#F3EFE8", forca_ceu=0.6):
    mundo = bpy.data.worlds.new("mundo")
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = rgba(cor_ceu)
    mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = forca_ceu
    bpy.context.scene.world = mundo
    bpy.ops.object.light_add(type="AREA", location=(-1.5, -1.5, 5.5))
    l = bpy.context.active_object
    l.data.energy = 900 * intensidade
    l.data.size = 6
    l.data.color = (1.0, 0.96, 0.9)
    bpy.ops.object.light_add(type="AREA", location=(2.5, -3.5, 2.5))
    f = bpy.context.active_object
    f.data.energy = 250 * intensidade
    f.data.size = 4
    f.rotation_euler = Euler((math.radians(65), 0, math.radians(35)))


def camera():
    # Retrato, olhando levemente para baixo: o chão ocupa a parte de baixo, onde o slime aparece.
    bpy.ops.object.camera_add(location=(0, -3.0, 1.15), rotation=(math.radians(84), 0, 0))
    cam = bpy.context.active_object
    cam.data.lens = 20
    bpy.context.scene.camera = cam


# --- Cenários --------------------------------------------------------------------------------


def casa():
    sala("#F3E3CF", "#B98B62")
    janela(0.0, 2.2, 1.5, 1.3)
    quadro(-2.0, 2.3, 0.7, 0.55, "#8FB8DE")
    quadro(2.0, 2.4, 0.55, 0.7, "#E8A87C")
    importar("movel_rugRounded", (-1.73, -1.2, 0.002))
    importar("movel_loungeSofa", (-3.3, 1.9, 0), rot_z=0, escala=1.0)
    importar("movel_pillowBlue", (-2.9, 2.25, 0.62), escala=0.9)
    importar("movel_loungeChairRelax", (2.0, 1.0, 0), rot_z=200, escala=0.9)
    importar("movel_pottedPlant", (2.9, 2.7, 0), escala=1.2)
    importar("movel_lampRoundFloor", (-3.0, 2.8, 0))
    importar("movel_bookcaseOpenLow", (0.9, 2.65, 0))
    importar("movel_books", (1.2, 2.8, 0.88))
    importar("movel_plantSmall2", (1.9, 2.8, 0.88))
    luzes(1.0)


def escola():
    sala("#E8EEF2", "#D7B98E")
    quadro = material("lousa", "#2F5D4A", rugosidade=0.85)
    madeira = material("moldura_lousa", "#A07444", rugosidade=0.6)
    caixa("moldura_lousa", (2.6, 0.06, 1.3), (0, FUNDO_Y - 0.03, 2.0), madeira)
    caixa("lousa", (2.4, 0.07, 1.1), (0, FUNDO_Y - 0.04, 2.0), quadro)
    giz = material("giz", "#F5F2E8", rugosidade=0.9)
    caixa("bandeja", (2.4, 0.15, 0.04), (0, FUNDO_Y - 0.12, 1.4), madeira)
    caixa("giz", (0.1, 0.02, 0.02), (0.5, FUNDO_Y - 0.15, 1.43), giz)
    # Alfabeto em cartões coloridos acima da lousa (cores suaves, sem texto legível).
    for i, cor in enumerate(["#E8A87C", "#8FB8DE", "#BFD8A2", "#F2C46D", "#C9A8DE", "#E8A87C", "#8FB8DE"]):
        caixa(f"cartao_{i}", (0.28, 0.03, 0.28), (-0.9 + i * 0.3, FUNDO_Y - 0.03, 2.95), material(f"cartao{i}", cor, rugosidade=0.8))
    # Carteiras atrás da área do slime, entrando pelas laterais.
    for x, y in ((-2.2, 1.4), (1.0, 1.4), (-2.4, 2.4), (1.2, 2.4)):
        importar("movel_desk", (x, y, 0), escala=0.8)
        importar("movel_chairDesk", (x + 0.4, y - 0.5, 0), rot_z=180, escala=0.7)
    importar("movel_rugRectangle", (-1.6, -1.6, 0.002), escala=1.0)
    importar("movel_bookcaseOpen", (2.5, 2.6, 0), escala=0.9)
    importar("movel_books", (2.7, 2.75, 1.1))
    importar("movel_pottedPlant", (-2.9, 2.7, 0))
    luzes(1.05, cor_ceu="#EEF3F6")


def terapia():
    # Sala calma, cores suaves, luz baixa; nada piscando.
    sala("#E7E3F2", "#D9CFC2")
    importar("movel_rugRound", (-1.0, -1.3, 0.002), escala=1.0)
    quadro(-1.6, 2.3, 0.8, 0.5, "#B9CDEB")
    quadro(1.3, 2.4, 0.5, 0.5, "#D8C7EC")
    pufe = material("pufe", "#9CB7DD", rugosidade=0.85)
    esfera("pufe", 0.7, (-1.7, 1.6, 0.42), (1.0, 1.0, 0.6), pufe)
    almofada = material("almofada", "#F2C9B8", rugosidade=0.9)
    esfera("almofada_1", 0.36, (1.5, 1.3, 0.2), (1.2, 1.0, 0.5), almofada)
    esfera("almofada_2", 0.3, (1.9, 1.9, 0.18), (1.2, 1.0, 0.5), material("almofada2", "#BFD8C2", rugosidade=0.9))
    # Tubo de bolhas estático e de brilho suave (sem animação).
    vidro = material("tubo", "#BFE3F2", rugosidade=0.05, transmissao=0.9)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=2.2, location=(2.0, 2.7, 1.1))
    t = bpy.context.active_object
    t.name = "tubo"
    t.data.materials.append(vidro)
    bpy.ops.object.shade_smooth()
    interno = material("agua_tubo", "#9FD3EA", emissao=1.2)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=2.1, location=(2.0, 2.7, 1.1))
    bpy.context.active_object.data.materials.append(interno)
    importar("movel_pottedPlant", (-3.0, 2.7, 0))
    importar("movel_lampRoundFloor", (1.6, 2.8, 0))
    luzes(0.75, cor_ceu="#ECE8F4", forca_ceu=0.5)


def parque():
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 10, 0))
    bpy.context.active_object.data.materials.append(material("grama", "#8DBF6A", rugosidade=0.95))
    importar("natureza_path_stoneCircle", (0, 1.6, 0.06), escala=0.9)
    for x, y, nome, e in [
        (-3.4, 5.5, "natureza_tree_oak", 1.5),
        (3.2, 6.5, "natureza_tree_default", 1.4),
        (-1.0, 9.0, "natureza_tree_fat", 1.6),
        (1.6, 10.5, "natureza_tree_detailed", 1.5),
        (-4.8, 9.5, "natureza_tree_default", 1.3),
        (5.0, 10.0, "natureza_tree_oak", 1.4),
    ]:
        importar(nome, (x, y, 0), escala=e)
    for x, y in [(-1.9, 0.6), (1.9, 0.9), (-2.4, 2.6), (2.5, 3.0), (-3.4, 4.2), (3.6, 4.6)]:
        importar("natureza_plant_bushLarge", (x, y, 0), escala=1.2)
    for x, y, nome in [(-1.8, 1.2, "natureza_flower_yellowA"), (1.9, 1.5, "natureza_flower_redA"), (-2.2, 1.9, "natureza_flower_purpleA"), (2.4, 2.2, "natureza_flower_yellowA")]:
        importar(nome, (x, y, 0))
    for x in range(-6, 7):
        importar("natureza_fence_simple", (x * 1.1, 7.5, 0), escala=0.5)
    importar("movel_bench", (2.6, 4.6, 0), rot_z=180, escala=1.0)
    mundo = bpy.data.worlds.new("ceu")
    mundo.use_nodes = True
    mundo.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("#BFE1F5")
    mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.9
    bpy.context.scene.world = mundo
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
    sol = bpy.context.active_object
    sol.data.energy = 3.0
    sol.data.angle = math.radians(8)
    sol.rotation_euler = Euler((math.radians(50), 0, math.radians(-30)))


CENARIOS = {"casa": casa, "escola": escola, "parque": parque, "terapia": terapia}


def principal():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--saida", required=True)
    p.add_argument("--so", help="gera só um cenário (para ajustes)")
    p.add_argument("--cpu", action="store_true", help="renderiza na CPU mesmo havendo GPU")
    args = p.parse_args(argv)
    saida = os.path.abspath(args.saida)
    os.makedirs(saida, exist_ok=True)
    for nome, montar in CENARIOS.items():
        if args.so and nome != args.so:
            continue
        cena = limpar()
        configurar_dispositivo(args.cpu)
        montar()
        camera()
        cena.render.filepath = os.path.join(saida, f"{nome}.jpg")
        bpy.ops.render.render(write_still=True)
        print(f"CENARIO_OK {nome}")


principal()
