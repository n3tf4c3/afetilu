import { InicioCenario } from "../../components/inicio-cenario";
import { InicioSimples } from "../../components/inicio-simples";
import { useApp } from "../../lib/estado";

export default function Inicio() {
  const { aparencia } = useApp();
  return aparencia.modoVisual === "cenario" ? <InicioCenario /> : <InicioSimples />;
}
