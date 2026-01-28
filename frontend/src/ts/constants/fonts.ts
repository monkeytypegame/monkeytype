import { KnownFontName } from "@monkeytype/schemas/fonts";

export type FontConfig = {
  display?: string;
  weight?: number;
} & (
  | {
      systemFont: true;
      fileName?: never;
    }
  | {
      systemFont?: never;
      fileName: string;
    }
);

export const Fonts: Record<KnownFontName, FontConfig> = {
  Roboto_Mono: {
    fileName: "RobotoMono-Regular.woff2",
  },
  Noto_Naskh_Arabic: {
    fileName: "NotoNaskhArabic-Regular.woff2",
  },
  Source_Code_Pro: {
    fileName: "SourceCodePro-Regular.woff2",
  },
  IBM_Plex_Sans: {
    fileName: "IBMPlexSans-SemiBold.woff2",
    weight: 600,
  },
  Inconsolata: {
    fileName: "Inconsolata-Regular.woff2",
  },
  Fira_Code: {
    fileName: "FiraCode-Regular.woff2",
  },
  JetBrains_Mono: {
    fileName: "JetBrainsMono-Regular.woff2",
  },
  Roboto: {
    fileName: "Roboto-Regular.woff2",
  },
  Montserrat: {
    fileName: "Montserrat-Regular.woff2",
  },
  Titillium_Web: {
    fileName: "TitilliumWeb-Regular.woff2",
  },
  Lexend_Deca: {
    fileName: "LexendDeca-Regular.woff2",
  },
  Comic_Sans_MS: {
    display: "Helvetica",
    systemFont: true,
  },
  Oxygen: {
    fileName: "Oxygen-Regular.woff2",
  },
  Nunito: {
    fileName: "Nunito-Bold.woff2",
    weight: 700,
  },
  Itim: {
    fileName: "Itim-Regular.woff2",
  },
  Courier: {
    systemFont: true,
  },
  Comfortaa: {
    fileName: "Comfortaa-Regular.woff2",
  },
  Coming_Soon: {
    fileName: "ComingSoon-Regular.woff2",
  },
  Atkinson_Hyperlegible: {
    fileName: "AtkinsonHyperlegible-Regular.woff2",
  },
  Lato: {
    fileName: "Lato-Regular.woff2",
  },
  Lalezar: {
    fileName: "Lalezar-Regular.woff2",
  },
  Boon: {
    display: "Boon (ไทย)",
    fileName: "Boon-Regular.woff2",
  },
  Open_Dyslexic: {
    fileName: "OpenDyslexic-Regular.woff2",
  },
  Ubuntu: {
    fileName: "Ubuntu-Regular.woff2",
  },
  Ubuntu_Mono: {
    fileName: "UbuntuMono-Regular.woff2",
  },
  Georgia: {
    systemFont: true,
  },
  Cascadia_Mono: {
    fileName: "CascadiaMono-Regular.woff2",
  },
  IBM_Plex_Mono: {
    fileName: "IBMPlexMono-Regular.woff2",
  },
  Overpass_Mono: {
    fileName: "OverpassMono-Regular.woff2",
  },
  Hack: {
    fileName: "Hack-Regular.woff2",
  },
  CommitMono: {
    fileName: "CommitMono-Regular.woff2",
  },
  Mononoki: {
    fileName: "Mononoki-Regular.woff2",
  },
  Parkinsans: {
    fileName: "Parkinsans-Regular.woff2",
  },
  Geist: {
    fileName: "Geist-Medium.woff2",
  },
  Sarabun: {
    fileName: "Sarabun-Bold.woff2",
  },
  Kanit: {
    fileName: "Kanit-Regular.woff2",
  },
  Geist_Mono: {
    fileName: "GeistMono-Medium.woff2",
  },
  Iosevka: {
    fileName: "Iosevka-Regular.woff2",
  },
  Proto: {
    display: "0xProto",
    fileName: "0xProto-Regular.woff2",
  },
  Adwaita_Mono: {
    fileName: "AdwaitaMono-Regular.woff2",
  },
};
