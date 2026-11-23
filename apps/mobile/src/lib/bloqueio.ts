import * as LocalAuthentication from "expo-local-authentication";

/** Verifica se o aparelho possui biometria ou PIN/senha de tela configurados. */
export async function bloqueioDisponivel(): Promise<boolean> {
  try {
    const nivel = await LocalAuthentication.getEnrolledLevelAsync();
    return nivel !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Solicita desbloqueio usando biometria ou código/PIN do aparelho. */
export async function autenticarAparelho(textos: {
  mensagem: string;
  cancelar: string;
  usarCodigo: string;
}): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: textos.mensagem,
      cancelLabel: textos.cancelar,
      fallbackLabel: textos.usarCodigo,
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}
