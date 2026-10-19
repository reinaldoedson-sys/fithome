import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  MoreVertical,
  Check,
  Copy,
  X,
  Zap,
  WifiOff,
  Sparkles,
  ExternalLink,
  Laptop,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Share,
  Cloud
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { canPromptNative, isIOS, isAndroid, isInIframe, installApp } = usePWAInstall();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios' | 'desktop'>('auto');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : 'https://fithome.app';

  const handleNativeInstall = async () => {
    const success = await installApp();
    if (success) {
      onClose();
    }
  };

  const handleOpenDedicatedTab = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'FitHome - Treinos em Casa & Evolução',
          text: language === 'en'
            ? 'Open FitHome on your mobile phone:'
            : language === 'es'
            ? 'Abre FitHome en tu teléfono móvil:'
            : 'Abra o FitHome no seu celular para treinar:',
          url: currentUrl
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=020617&color=34d399&qzone=1`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>
                  {language === 'en'
                    ? 'Install FitHome on Mobile'
                    : language === 'es'
                    ? 'Instalar FitHome en el Móvil'
                    : 'Instalar FitHome no Celular'}
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'en'
                  ? 'Lightweight, full-screen and works 100% offline'
                  : language === 'es'
                  ? 'Ligero, pantalla completa y 100% sin conexión'
                  : 'Leve, tela cheia e funciona 100% offline'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-200 text-xs">
          {/* IMMEDIATE SOLUTION FOR "NÃO É POSSÍVEL INSTALAR" */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {language === 'en'
                  ? 'Got "Cannot install"? Quick 5-second fix:'
                  : language === 'es'
                  ? '¿Apareció "No es posible instalar"? Solución en 5 seg:'
                  : 'Apareceu "Não é possível instalar"? Solução em 5 segundos:'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {language === 'en'
                ? 'Chrome on Android tries to generate a WebAPK via Google servers, which is blocked on private preview links. Use "Add to Home screen" instead to install directly and 100% reliably:'
                : language === 'es'
                ? 'Chrome intenta generar un paquete WebAPK en servidores de Google, el cual se bloquea en enlaces de prueba. Usa "Añadir a pantalla de inicio" para instalar directamente:'
                : 'O Chrome no celular tenta gerar um WebAPK via servidores do Google, que é bloqueado neste endereço de teste. Use a opção "Adicionar à tela inicial" para instalar de forma 100% garantida:'}
            </p>
            <div className="p-3 bg-slate-950/90 rounded-xl border border-rose-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span>
                  {language === 'en'
                    ? 'In mobile Chrome, tap the 3 dots ⋮ (top right)'
                    : language === 'es'
                    ? 'En Chrome del móvil, toca los 3 puntos ⋮ (arriba a la derecha)'
                    : 'No Chrome do celular, toque nos 3 pontinhos ⋮ (topo direito)'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span className="text-emerald-300">
                  {language === 'en'
                    ? 'Select "Add to Home screen" (or "Create shortcut")'
                    : language === 'es'
                    ? 'Selecciona "Añadir a la pantalla de inicio" (o "Crear atajo")'
                    : 'Selecione "Adicionar à tela inicial" (ou "Criar atalho")'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <span>
                  {language === 'en'
                    ? 'Confirm "Add" - It appears as a full-screen app!'
                    : language === 'es'
                    ? 'Confirma "Añadir" - ¡Quedará como app en pantalla completa!'
                    : 'Confirme em "Adicionar" - Pronto, vira app em tela cheia!'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {language === 'en'
                ? '✨ It opens full-screen like a native app, with custom icon and works 100% offline.'
                : language === 'es'
                ? '✨ Abre en pantalla completa como app nativa, con icono oficial y 100% sin internet.'
                : '✨ Abre em tela cheia nativa sem barra do navegador, com ícone oficial e funciona 100% offline.'}
            </p>
          </div>

          {/* CRITICAL RESOLUTION: If viewed inside iframe or browser 3 dots disabled */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {language === 'en'
                  ? 'Viewing in AI Studio Preview Pane?'
                  : language === 'es'
                  ? '¿Viendo dentro del panel de AI Studio?'
                  : 'Visualizando dentro do painel do AI Studio?'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {isInIframe
                ? language === 'en'
                  ? 'You are viewing inside the AI Studio editor frame. Browsers cannot install apps from embedded iframes. Open the app in its own dedicated tab to enable full installation:'
                  : language === 'es'
                  ? 'Estás dentro del panel embebido de AI Studio. Los navegadores no instalan apps dentro de marcos. Abre el app en su propia pestaña para habilitar la instalación:'
                  : 'Você está no painel de edição do AI Studio. O Chrome não permite instalar sites embutidos em iframe. Abra o app em sua aba própria para liberar a instalação imediata nos 3 pontinhos:'
                : language === 'en'
                ? 'PWA installation requires a normal browser tab (not incognito/private mode). If using a computer or phone, click below to open directly:'
                : language === 'es'
                ? 'La instalación PWA requiere una pestaña normal (no modo incógnito). Pulsa abajo para abrir directamente:'
                : 'A instalação requer aba normal (não anônima). Clique abaixo para abrir diretamente na aba dedicada:'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenDedicatedTab}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {language === 'en'
                    ? 'Open in Dedicated Tab ↗'
                    : language === 'es'
                    ? 'Abrir en Pestaña Propia ↗'
                    : 'Abrir em Nova Aba Própria ↗'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'en'
                    ? (showTroubleshooting ? 'Hide details' : 'Direct link help')
                    : language === 'es'
                    ? (showTroubleshooting ? 'Ocultar detalles' : 'Ayuda con enlace')
                    : (showTroubleshooting ? 'Ocultar detalhes' : 'Ajuda sobre o link')}
                </span>
              </button>
            </div>

            {/* Expandable Troubleshooting on Direct Link */}
            {showTroubleshooting && (
              <div className="pt-2 mt-2 border-t border-amber-500/20 text-[11px] text-slate-300 space-y-2 animate-in fade-in duration-150">
                <div className="font-semibold text-white">
                  {language === 'en'
                    ? 'Why did the direct link fail on mobile?'
                    : language === 'es'
                    ? '¿Por qué falló el enlace directo en el móvil?'
                    : 'Por que o link direto no celular não abriu?'}
                </div>
                <div className="space-y-1.5 text-slate-400">
                  <p>
                    <strong className="text-emerald-400">1. {language === 'en' ? 'Development Link:' : language === 'es' ? 'Enlace de desarrollo:' : 'Link de desenvolvimento:'}</strong>{' '}
                    {language === 'en'
                      ? 'The dev link requires you to be logged into your Google AI Studio account on your mobile browser.'
                      : language === 'es'
                      ? 'El enlace de desarrollo requiere iniciar sesión con la cuenta de Google del proyecto en el móvil.'
                      : 'O link de teste atual exige que seu navegador do celular faça login com a mesma conta Google usada no AI Studio.'}
                  </p>
                  <p>
                    <strong className="text-emerald-400">2. {language === 'en' ? 'Public Shared Link:' : language === 'es' ? 'Enlace público compartido:' : 'Link Público Oficial:'}</strong>{' '}
                    {language === 'en'
                      ? 'In the top bar of AI Studio, click "Share" (or Deploy) to generate the public link that opens on ANY mobile device without login!'
                      : language === 'es'
                      ? 'En la barra superior de AI Studio, haz clic en "Share" (Compartir) para generar el enlace público que abre en CUALQUIER móvil sin login.'
                      : 'Na barra superior do AI Studio, clique em "Share" (Compartilhar) para gerar o link público oficial que abre em QUALQUER celular sem precisar de login prévio!'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick 1-Click Install Button if browser triggered beforeinstallprompt */}
          {canPromptNative && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {language === 'en' ? 'Quick Installation Ready' : language === 'es' ? 'Instalación Rápida Lista' : 'Instalação Rápida Pronta'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {language === 'en'
                  ? 'Your browser detected FitHome! Tap below to install directly to your device:'
                  : language === 'es'
                  ? '¡Tu navegador detectó FitHome! Pulsa abajo para instalar directamente:'
                  : 'Seu navegador já detectou o FitHome! Toque no botão abaixo para adicionar direto à sua tela inicial:'}
              </p>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {language === 'en'
                    ? 'Install App Now (1 Tap)'
                    : language === 'es'
                    ? 'Instalar App Ahora (1 Toque)'
                    : 'Instalar Aplicativo Agora (1 Toque)'}
                </span>
              </button>
            </div>
          )}

          {/* Device Tabs (Android, iOS, Desktop / QR Code) */}
          <div>
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('auto')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
                  activeTab === 'auto'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'en' ? 'Recommended' : language === 'es' ? 'Recomendado' : 'Recomendado'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
                  activeTab === 'android'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
                  activeTab === 'ios'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                iPhone (iOS)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center ${
                  activeTab === 'desktop'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                QR / Link
              </button>
            </div>

            {/* TAB CONTENT: ANDROID INSTRUCTIONS */}
            {(activeTab === 'android' || (activeTab === 'auto' && isAndroid && !canPromptNative)) && (
              <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  <Smartphone className="w-4 h-4" />
                  <span>Android (Chrome / Samsung / Edge)</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <strong className="text-white block font-medium">
                        {language === 'en' ? 'Open in regular tab' : language === 'es' ? 'Abre en pestaña normal' : 'Abra em aba normal no Chrome do celular'}
                      </strong>
                      <span className="text-slate-400 mt-0.5 block text-[11px]">
                        {language === 'en'
                          ? 'Do not use Incognito Mode (Chrome disables PWAs in private tabs).'
                          : language === 'es'
                          ? 'No uses Modo Incógnito (Chrome bloquea PWAs en pestañas privadas).'
                          : 'Não utilize Guia Anônima (o Chrome bloqueia instalação em guias anônimas).'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <strong className="text-white block font-medium">
                        {language === 'en' ? 'Tap the 3 dots menu' : language === 'es' ? 'Toca los 3 puntos' : 'Toque nos 3 pontinhos do Chrome'}
                      </strong>
                      <span className="text-slate-400 flex items-center gap-1 mt-0.5 text-[11px]">
                        {language === 'en' ? 'Tap ' : language === 'es' ? 'Toca ' : 'Toque em '}
                        <MoreVertical className="w-3.5 h-3.5 inline text-emerald-400" />
                        {language === 'en'
                          ? ' in top right ➔ Select "Add to Home screen" (or "Install app").'
                          : language === 'es'
                          ? ' arriba a la derecha ➔ "Añadir a pantalla de inicio" (o "Instalar app").'
                          : ' no topo direito ➔ Escolha "Adicionar à tela inicial" (ou "Criar atalho").'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <strong className="text-white block font-medium">
                        {language === 'en' ? 'Confirm Install' : language === 'es' ? 'Confirma la Instalación' : 'Confirme a Instalação'}
                      </strong>
                      <span className="text-slate-400 mt-0.5 block text-[11px]">
                        {language === 'en'
                          ? 'FitHome appears in your app drawer, launching in full screen and working 100% offline!'
                          : language === 'es'
                          ? 'FitHome se añadirá a tus apps, abrirá en pantalla completa y funcionará sin internet.'
                          : 'O FitHome aparecerá na sua lista de aplicativos, abrindo em tela cheia e funcionando 100% sem internet!'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: IPHONE / IOS INSTRUCTIONS */}
            {(activeTab === 'ios' || (activeTab === 'auto' && isIOS)) && (
              <div className="space-y-3 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone & iPad (Safari)</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <strong className="text-white block font-medium">
                        {language === 'en' ? 'Open link in Safari' : language === 'es' ? 'Abre el enlace en Safari' : 'Abra no Safari do iPhone'}
                      </strong>
                      <span className="text-slate-400 flex items-center gap-1.5 mt-0.5 text-[11px]">
                        {language === 'en' ? 'Tap the ' : language === 'es' ? 'Toca el botón ' : 'Toque no botão '}
                        <Share2 className="w-3.5 h-3.5 inline text-emerald-400" />
                        <strong>{language === 'en' ? 'Share' : language === 'es' ? 'Compartir' : 'Compartilhar'}</strong>
                        {language === 'en' ? ' in Safari bottom bar.' : language === 'es' ? ' en la barra inferior.' : ' na barra inferior.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <strong className="text-white block font-medium">
                        {language === 'en' ? 'Select "Add to Home Screen"' : language === 'es' ? 'Pulsa "Añadir a pantalla de inicio"' : 'Selecione "Adicionar à Tela de Início"'}
                      </strong>
                      <span className="text-slate-400 flex items-center gap-1.5 mt-0.5 text-[11px]">
                        {language === 'en' ? 'Scroll down and tap ' : language === 'es' ? 'Desliza hacia abajo y pulsa ' : 'Role a folha de opções e toque em '}
                        <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />
                        <strong>{language === 'en' ? 'Add to Home Screen' : language === 'es' ? 'Añadir a pantalla de inicio' : 'Adicionar à Tela de Início'}</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <strong className="text-white block font-medium">
                        {language === 'en' ? 'Confirm "Add"' : language === 'es' ? 'Pulsa "Añadir"' : 'Confirme "Adicionar"'}
                      </strong>
                      <span className="text-slate-400 mt-0.5 block text-[11px]">
                        {language === 'en'
                          ? 'In the top right corner, tap Add. FitHome will launch like a native iOS app!'
                          : language === 'es'
                          ? 'En la esquina superior derecha, pulsa Añadir. ¡Listo para entrenar!'
                          : 'No canto superior direito, toque em Adicionar. O FitHome abrirá como um app nativo no seu iPhone!'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DESKTOP / QR CODE SCAN */}
            {(activeTab === 'desktop' || (activeTab === 'auto' && !isIOS && !isAndroid && !canPromptNative)) && (
              <div className="space-y-4 p-4 bg-slate-950/70 border border-slate-800 rounded-2xl animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Laptop className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? 'Open on your Mobile Phone'
                      : language === 'es'
                      ? 'Abrir en tu Teléfono Móvil'
                      : 'Abrir Direto no seu Celular'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code */}
                  <div className="p-2.5 bg-slate-950 rounded-2xl border border-emerald-500/30 flex flex-col items-center shadow-lg shrink-0">
                    <img
                      src={qrCodeUrl}
                      alt="FitHome QR Code"
                      className="w-32 h-32 rounded-xl object-contain"
                      loading="lazy"
                    />
                    <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                      {language === 'en' ? 'Scan with Camera' : language === 'es' ? 'Escanear con Cámara' : 'Aponte a Câmera'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300">
                    <p className="leading-relaxed text-[11px]">
                      {language === 'en'
                        ? 'Point your phone camera to this QR Code to open FitHome on your device, then follow the installation steps above.'
                        : language === 'es'
                        ? 'Apunta la cámara de tu móvil a este código QR para abrir FitHome directamente en tu teléfono.'
                        : 'Aponte a câmera do seu celular para o QR Code ao lado para abrir o FitHome no seu aparelho e instalar na tela inicial.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">
                              {language === 'en' ? 'Link Copied!' : language === 'es' ? '¡Enlace Copiado!' : 'Link Copiado!'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {language === 'en' ? 'Copy Link' : language === 'es' ? 'Copiar Enlace' : 'Copiar Link'}
                            </span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleShare}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Share className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {language === 'en' ? 'Share Link' : language === 'es' ? 'Compartir' : 'Compartilhar'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Multi-Device Cloud Sync Reminder */}
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-1 mt-3">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>
                      {language === 'en'
                        ? 'Multi-Device Cloud Sync'
                        : language === 'es'
                        ? 'Sincronización en la Nube (Web y Móvil)'
                        : 'Sincronização em Tempo Real (Web & Celular)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {language === 'en'
                      ? 'After opening on mobile, tap "Sync" at the top and connect with the same Google account. Your workouts and stats sync instantly between PC and mobile!'
                      : language === 'es'
                      ? 'Después de abrir en el móvil, pulsa "Sincronizar" en la parte superior y conecta la misma cuenta Google. ¡Tus entrenamientos se sincronizan al instante!'
                      : 'Depois de abrir no celular, toque em "Sincronizar" no topo e conecte a mesma conta Google. Seus treinos, pesos e recordes sincronizam instantaneamente entre o PC e o celular!'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block text-[11px]">
                  {language === 'en' ? '100% Offline' : language === 'es' ? '100% Sin Conexión' : '100% Offline'}
                </strong>
                <span className="text-[10px] text-slate-500">
                  {language === 'en' ? 'Train without wifi or signal' : language === 'es' ? 'Entrena sin cobertura' : 'Treine em qualquer lugar'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block text-[11px]">
                  {language === 'en' ? 'Ultra Lightweight' : language === 'es' ? 'Ultra Ligero' : 'Ultra Leve'}
                </strong>
                <span className="text-[10px] text-slate-500">
                  {language === 'en' ? 'No heavy app store downloads' : language === 'es' ? 'Sin descargas pesadas' : 'Sem pesar na memória'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>FitHome PWA · Progressive Web App</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {language === 'en' ? 'Close' : language === 'es' ? 'Cerrar' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
};
