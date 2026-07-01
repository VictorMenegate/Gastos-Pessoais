# App Mobile (Android / APK)

O app Android é um shell **Capacitor** que carrega o PWA publicado
(`https://gastos.161.97.159.77.sslip.io`) dentro de um WebView nativo.
Não empacota o site — depende do deploy (Coolify) estar no ar.

## Pré-requisitos (nesta máquina)

- **JDK 21** — `C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot`
  (o Capacitor 8 compila com Java 21; JDK 17 falha com `invalid source release: 21`).
- **Android SDK** — `C:\Android\sdk` (cmdline-tools, platform-tools, `platforms;android-36`, `build-tools;36.0.0`).
  Referenciado em `android/local.properties` (fora do git).

## Gerar o APK

```bash
export JAVA_HOME="/c/Program Files/Microsoft/jdk-21.0.11.10-hotspot"
export ANDROID_HOME="/c/Android/sdk"; export PATH="$JAVA_HOME/bin:$PATH"

npm run cap:sync          # copia public/ e registra plugins nativos
npm run apk:debug         # APK de teste -> android/app/build/outputs/apk/debug/app-debug.apk
npm run apk:release       # APK assinado -> android/app/build/outputs/apk/release/app-release.apk
```

Instalar: copiar o `.apk` para o celular e abrir, ou `adb install -r <arquivo>.apk`.

## Assinatura (release)

- Keystore: `android/gastos-release.keystore` (alias `gastos`).
- Credenciais em `android/keystore.properties` (fora do git).
- **⚠️ Faça backup do keystore e da senha.** Sem eles não é possível publicar
  atualizações do mesmo app depois.

## Recursos nativos

Os plugins só funcionam quando o **bundle web publicado** contém o código do
Capacitor (já incluído em `dependencies`). Portanto, após mexer no app web,
faça **deploy no Coolify** para o APK enxergar as mudanças.

- **Câmera** (`@capacitor/camera`): botão "Tirar foto" em `src/components/ExtratoUpload.tsx`
  (só aparece no app). A foto vai para a rota existente `/api/analyze-screenshot`.
- **Biometria** (`@aparajita/capacitor-biometric-auth`): `src/components/BiometricGate.tsx`
  bloqueia o app; ativado no toggle em Configurações → Conta (`src/components/NativeSettings.tsx`).
  Preferência salva em `localStorage` (nível de dispositivo).
- **Push** (`@capacitor/push-notifications`): registro em `src/components/PushInit.tsx`.
  **Requer Firebase** (ver abaixo) — sem isso o registro faz no-op seguro.

### Configurar Push (Firebase Cloud Messaging)

1. Criar projeto no [Firebase Console](https://console.firebase.google.com) e adicionar
   um app Android com package `br.com.eitacasaperfeita.gastos`.
2. Baixar o `google-services.json` e colocar em `android/app/google-services.json`.
   (O `android/app/build.gradle` já aplica o plugin `com.google.gms.google-services`
   automaticamente quando o arquivo existe.)
3. Rebuild do APK. O token FCM passa a ser obtido em `PushInit`/`NativeSettings`.
4. **Backend (pendente):** persistir o token (ex.: tabela `push_tokens` no Supabase)
   e disparar mensagens FCM a partir de `src/app/api/cron/route.ts`, junto da criação
   de alertas (`check_budget_alerts`). Hoje o token é apenas salvo em `localStorage`.
