import { z } from "zod";
import { customEnumErrorHandler } from "./util";

const KnownFontNameSchema = z.enum(
  [
    "Roboto_Mono",
    "Noto_Naskh_Arabic",
    "Source_Code_Pro",
    "IBM_Plex_Sans",
    "Inconsolata",
    "Fira_Code",
    "JetBrains_Mono",
    "Roboto",
    "Montserrat",
    "Titillium_Web",
    "Lexend_Deca",
    "Comic_Sans_MS",
    "Oxygen",
    "Nunito",
    "Itim",
    "Courier",
    "Comfortaa",
    "Coming_Soon",
    "Atkinson_Hyperlegible",
    "Lato",
    "Lalezar",
    "Boon",
    "Open_Dyslexic",
    "Ubuntu",
    "Ubuntu_Mono",
    "Georgia",
    "Cascadia_Mono",
    "IBM_Plex_Mono",
    "Overpass_Mono",
    "Hack",
    "CommitMono",
    "Mononoki",
    "Parkinsans",
    "Geist",
    "Sarabun",
    "Kanit",
    "Geist_Mono",
    "Iosevka",
    "Proto",
    "Adwaita_Mono",
  ],
  {
    errorMap: customEnumErrorHandler("Must be a known font family"),
  },
);
export type KnownFontName = z.infer<typeof KnownFontNameSchema>;

export const FontNameSchema = KnownFontNameSchema.or(
  z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_\-+.]+$/),
);
export type FontName = z.infer<typeof FontNameSchema>;
