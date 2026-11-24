import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { Platform } from "react-native";
import type { PreferenciaLembrete } from "./lembrete-dados";

const CANAL_ANDROID = "lembrete-diario";

/**
 * Agenda ou cancela o lembrete diário 100% local (sem servidor nem push token).
 * O texto é sempre genérico, sem nome da pessoa acompanhada nem conteúdo de registros.
 */
export async function sincronizarLembrete(
  pref: PreferenciaLembrete,
  textos: { titulo: string; corpo: string; canal: string },
): Promise<"ok" | "sem_permissao"> {
  await cancelAllScheduledNotificationsAsync();
  if (!pref.ativo) return "ok";

  const atual = await getPermissionsAsync();
  const status = atual.status === "granted" ? atual.status : (await requestPermissionsAsync()).status;
  if (status !== "granted") return "sem_permissao";

  if (Platform.OS === "android") {
    await setNotificationChannelAsync(CANAL_ANDROID, {
      name: textos.canal,
      importance: AndroidImportance.DEFAULT,
    });
  }

  await scheduleNotificationAsync({
    content: {
      title: textos.titulo,
      body: textos.corpo,
      sound: false,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: pref.hora,
      minute: 0,
      ...(Platform.OS === "android" ? { channelId: CANAL_ANDROID } : {}),
    },
  });
  return "ok";
}

/** Cancela qualquer lembrete agendado (ex.: ao apagar todos os dados do aparelho). */
export async function cancelarLembretes(): Promise<void> {
  try {
    await cancelAllScheduledNotificationsAsync();
  } catch {
    // Em aparelhos/ambientes sem serviço de notificação, não bloqueia a limpeza.
  }
}
