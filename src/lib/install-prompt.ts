export const HANDHELD = "(hover: none) and (pointer: coarse)";
export const INSTALL_CHANGE = "sproutly:install-change";

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallWindow = Window & { sproutlyInstall?: InstallEvent | null };

export const installScript = `try{if(matchMedia("${HANDHELD}").matches){addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.sproutlyInstall=e;dispatchEvent(new Event("${INSTALL_CHANGE}"))});addEventListener("appinstalled",function(){window.sproutlyInstall=null;dispatchEvent(new Event("${INSTALL_CHANGE}"))})}}catch(e){}`;

export function canPromptInstall() {
  return Boolean((window as InstallWindow).sproutlyInstall);
}

export function takeInstallEvent() {
  const target = window as InstallWindow;
  const event = target.sproutlyInstall ?? null;
  target.sproutlyInstall = null;
  window.dispatchEvent(new Event(INSTALL_CHANGE));
  return event;
}
