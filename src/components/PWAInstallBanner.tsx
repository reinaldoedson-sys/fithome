import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      installApp();
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-b border-emerald-500/30 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-200">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">
            Instale o <strong>FitHome</strong> no seu celular para treinar offline e acessar direto da tela inicial!
          </span>
          <span className="sm:hidden font-medium">
            Instalar app na tela inicial
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar App</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Instalar no iPhone / iPad
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              No Safari da Apple, você pode adicionar o FitHome como app nativo em 2 passos rápidos:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <Share className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">1. Toque em Compartilhar</strong>
                  <span className="text-slate-400">Na barra inferior do Safari, clique no ícone quadrado com a seta para cima.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <PlusSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">2. Adicionar à Tela de Início</strong>
                  <span className="text-slate-400">Role a lista para baixo e toque em &quot;Adicionar à Tela de Início&quot;.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
