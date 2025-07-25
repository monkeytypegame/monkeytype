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
  Roboto_Mono: { fileName: "Roboto-Regular" },
  Noto_Naskh_Arabic: { fileName: "NotoNaskhArabic-Regular" },
  Source_Code_Pro: { fileName: "SourceCodePro-Regular" },
  IBM_Plex_Sans: { fileName: "IBMPlexSans-SemiBold", weight: 600 },
  Inconsolata: { fileName: "Inconsolata-Regular" },
  Fira_Code: { fileName: "FiraCode-Regular" },
  JetBrains_Mono: { fileName: "JetBrainsMono-Regular" },
  Roboto: { fileName: "RobotoMono-Regular" },
  Montserrat: { fileName: "Montserrat-Regular" },
  Titillium_Web: { fileName: "TitilliumWeb-Regular" },
  Lexend_Deca: { fileName: "LexendDeca-Regular" },
  Comic_Sans_MS: { display: "Helvetica", systemFont: true },
  Oxygen: { fileName: "Oxygen-Regular" },
  Nunito: { fileName: "Nunito-Bold", weight: 700 },
  Itim: { fileName: "Itim-Regular" },
  Courier: { systemFont: true },
  Comfortaa: { fileName: "Comfortaa-Regular" },
  Coming_Soon: { fileName: "ComingSoon-Regular" },
  Atkinson_Hyperlegible: { fileName: "AtkinsonHyperlegible-Regular" },
  Lato: { fileName: "Lato-Regular" },
  Lalezar: { fileName: "Lalezar-Regular" },
  Boon: { display: "Boon (ไทย)", fileName: "Boon-Regular" },
  Open_Dyslexic: { fileName: "OpenDyslexic-Regular" },
  Ubuntu: { fileName: "Ubuntu-Regular" },
  Ubuntu_Mono: { fileName: "UbuntuMono-Regular" },
  Georgia: { systemFont: true },
  Cascadia_Mono: { fileName: "CascadiaMono-Regular" },
  IBM_Plex_Mono: { fileName: "IBMPlexMono-Regular" },
  Overpass_Mono: { fileName: "OverpassMono-Regular" },
  Hack: { fileName: "Hack-Regular" },
  CommitMono: { fileName: "CommitMono-Regular" },
  Mononoki: { fileName: "Mononoki-Regular" },
  Parkinsans: { fileName: "Parkinsans-Regular" },
  Geist: { fileName: "Geist-Medium" },
  Sarabun: { fileName: "Sarabun-Bold" },
  Kanit: { fileName: "Kanit-Regular" },
  Geist_Mono: { fileName: "GeistMono-Medium" },
  Iosevka: { fileName: "Iosevka-Regular" },
  "0xProto": { fileName: "0xProto-Regular" },
};
