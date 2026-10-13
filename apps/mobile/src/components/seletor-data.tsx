import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { chaveDoDia, dataDaChave, diaPorExtenso } from "@afetilu/core";
import { useState } from "react";
import { Platform, View } from "react-native";
import { useTextos } from "../lib/estado";
import { Botao } from "./ui";

type Modo = "date" | "time";

/** Abre o seletor nativo: diálogo no Android, roda inline no iOS. */
function SeletorNativo(props: { modo: Modo; valor: Date; onChange: (d: Date) => void; maximo?: Date; rotulo: string }) {
  const { d, idioma } = useTextos();
  const [abertoIos, setAbertoIos] = useState(false);
  const texto = props.modo === "date" ? diaPorExtenso(chaveDoDia(props.valor), d) : d.hora(props.valor);
  const icone = props.modo === "date" ? "calendar" : "clock-outline";

  const aoMudar = (_e: DateTimePickerEvent, data?: Date) => {
    if (data) props.onChange(data);
  };

  if (Platform.OS === "android") {
    return (
      <Botao
        variante="secundaria"
        icone={icone}
        rotulo={`${props.rotulo}: ${texto}`}
        onPress={() =>
          DateTimePickerAndroid.open({
            value: props.valor,
            mode: props.modo,
            is24Hour: idioma !== "en",
            maximumDate: props.maximo,
            onChange: aoMudar,
          })
        }
      />
    );
  }
  return (
    <View>
      <Botao variante="secundaria" icone={icone} rotulo={`${props.rotulo}: ${texto}`} onPress={() => setAbertoIos((a) => !a)} />
      {abertoIos ? (
        <DateTimePicker
          value={props.valor}
          mode={props.modo}
          display="spinner"
          locale={idioma}
          maximumDate={props.maximo}
          onChange={aoMudar}
        />
      ) : null}
    </View>
  );
}

/** Data e hora separadas, mantendo a outra parte intacta. */
export function SeletorDataHora(props: { valor: Date; onChange: (d: Date) => void; maximo?: Date }) {
  const { t } = useTextos();
  const juntar = (dia: Date, hora: Date) =>
    new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hora.getHours(), hora.getMinutes());
  return (
    <View style={{ gap: 8 }}>
      <SeletorNativo rotulo={t.quando.dia} modo="date" valor={props.valor} maximo={props.maximo} onChange={(x) => props.onChange(juntar(x, props.valor))} />
      <SeletorNativo rotulo={t.quando.hora} modo="time" valor={props.valor} onChange={(h) => props.onChange(juntar(props.valor, h))} />
    </View>
  );
}

export function SeletorDia(props: { dia: string; onChange: (dia: string) => void; maximo?: Date }) {
  const { t } = useTextos();
  return (
    <SeletorNativo
      rotulo={t.quando.dia}
      modo="date"
      valor={dataDaChave(props.dia)}
      maximo={props.maximo}
      onChange={(x) => props.onChange(chaveDoDia(x))}
    />
  );
}
