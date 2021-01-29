const layouts = {
    default: {},
    qwerty: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "eE", "rR", "tT", "yY", "uU", "iI", "oO", "pP", "[{", "]}", "\\|",
            "aA", "sS", "dD", "fF", "gG", "hH", "jJ", "kK", "lL", ";:", "'\"",
            "\\|", "zZ", "xX", "cC", "vV", "bB", "nN", "mM", ",<", ".>", "/?",
            " "
        ]
    },
    dvorak: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "[{", "]}",
            "'\"", ",<", ".>", "pP", "yY", "fF", "gG", "cC", "rR", "lL", "/?", "=+", "\\|",
            "aA", "oO", "eE", "uU", "iI", "dD", "hH", "tT", "nN", "sS", "-_",
            "\\|", ";:", "qQ", "jJ", "kK", "xX", "bB", "mM", "wW", "vV", "zZ",
            " "
        ],
    },
    colemak: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "fF", "pP", "gG", "jJ", "lL", "uU", "yY", ";:", "[{", "]}", "\\|",
            "aA", "rR", "sS", "tT", "dD", "hH", "nN", "eE", "iI", "oO", "'\"",
            "\\|", "zZ", "xX", "cC", "vV", "bB", "kK", "mM", ",<", ".>", "/?",
            " "
        ]
    },
    colemak_dh: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "fF", "pP", "bB", "jJ", "lL", "uU", "yY", ";:", "[{", "]}", "\\|",
            "aA", "rR", "sS", "tT", "gG", "mM", "nN", "eE", "iI", "oO", "'\"",
            "\\|", "xX", "cC", "dD", "vV", "zZ", "kK", "hH", ",<", ".>", "/?",
            " "
        ],
    },
    colemak_dhk: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "fF", "pP", "bB", "jJ", "lL", "uU", "yY", ";:", "[{", "]}", "\\|",
            "aA", "rR", "sS", "tT", "gG", "kK", "nN", "eE", "iI", "oO", "'\"",
            "\\|", "xX", "cC", "dD", "vV", "zZ", "mM", "hH", ",<", ".>", "/?",
            " "
        ],
    },
    colemak_dh_matrix: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "fF", "pP", "bB", "jJ", "lL", "uU", "yY", ";:", "[{", "]}", "\\|",
            "aA", "rR", "sS", "tT", "gG", "mM", "nN", "eE", "iI", "oO", "'\"",
            "\\|", "zZ", "xX", "cC", "dD", "vV", "kK", "hH", ",<", ".>", "/?",
            " "
        ],
    },
    colemak_dh_iso: {
        keymapShowTopRow: false,
        iso: true,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "fF", "pP", "bB", "jJ", "lL", "uU", "yY", ";:", "[{", "]}", "\\|",
            "aA", "rR", "sS", "tT", "gG", "mM", "nN", "eE", "iI", "oO", "'\"",
            "zZ", "xX", "cC", "dD", "vV", "\\|", "kK", "hH", ",<", ".>", "/?",
            " "
        ],
    },
    colemak_dhk_iso: {
        keymapShowTopRow: false,
        iso: true,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "fF", "pP", "bB", "jJ", "lL", "uU", "yY", ";:", "[{", "]}", "\\|",
            "aA", "rR", "sS", "tT", "gG", "kK", "nN", "eE", "iI", "oO", "'\"",
            "zZ", "xX", "cC", "dD", "vV", "\\|", "mM", "hH", ",<", ".>", "/?",
            " "
        ],
    },
    qwertz: {
        keymapShowTopRow: false,
        iso: true,
        keys: [
            "^°", "1!", "2\"", "3§", "4$", "5%", "6&", "7/", "8(", "9)", "0=", "ß?", "´`",
            "qQ", "wW", "eE", "rR", "tT", "zZ", "uU", "iI", "oO", "pP", "üÜ", "+*", "'#",
            "aA", "sS", "dD", "fF", "gG", "hH", "jJ", "kK", "lL", "öÖ", "äÄ",
            "<>", "yY", "xX", "cC", "vV", "bB", "nN", "mM", ",;", ".:", "-_",
            " "
        ]
    },
    workman: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "dD", "rR", "wW", "bB", "jJ", "fF", "uU", "pP", ";:", "[{", "]}", "\\|",
            "aA", "sS", "hH", "tT", "gG", "yY", "nN", "eE", "oO", "iI", "'\"",
            "\\|", "zZ", "xX", "mM", "cC", "vV", "kK", "lL", ",<", ".>", "/?",
            " "
        ],
    },
    turkish_f: {
        keymapShowTopRow: false,
        keys: [
            "*+", "1!", "2\"", "3^", "4$", "5%", "6&", "7'", "8(", "9)", "0=", "/?", "-_",
            "fF", "gG", "ğĞ", "ıI", "oO", "dD", "rR", "nN", "hH", "pP", "qQ", "wW", "xX",
            "uU", "iİ", "eE", "aA", "üÜ", "tT", "kK", "mM", "lL", "yY", "şŞ",
            "\\|", "jJ", "öÖ", "vV", "cC", "çÇ", "zZ", "sS", "bB", ".:", ",;",
            " "
        ],
    },
    MTGAP_ASRT: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "lL", "dD", "bB", "jJ", "fF", "uU", "kK", "pP", "[{", "]}", "\\|",
            "aA", "sS", "rR", "tT", "gG", "hH", "nN", "eE", "oO", "iI", "/?",
            "\\|", "zZ", "xX", "cC", "vV", ";:", "yY", "mM", ",<", ".>", "'\"",
            " "
        ],
    },
    norman: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "wW", "dD", "fF", "kK", "jJ", "uU", "rR", "lL", ";:", "[{", "]}", "\\|",
            "aA", "sS", "eE", "tT", "gG", "yY", "nN", "iI", "oO", "hH", "'\"",
            "\\|", "zZ", "xX", "cC", "vV", "bB", "pP", "mM", ",<", ".>", "/?",
            " "
        ]
    },
    halmak: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "wW", "lL", "rR", "bB", "zZ", ";:", "qQ", "uU", "dD", "jJ", "[{", "]}", "\\|",
            "sS", "hH", "nN", "tT", ",<", ".>", "aA", "eE", "oO", "iI", "'\"",
            "\\|", "fF", "mM", "vV", "cC", "/?", "gG", "pP", "xX", "kK", "yY",
            " "
        ]
    },
    QGMLWB: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "gG", "mM", "lL", "wW", "bB", "yY", "uU", "vV", ";:", "[{", "]}", "\\|",
            "dD", "sS", "tT", "nN", "rR", "iI", "aA", "eE", "oO", "hH", "'\"",
            "\\|", "zZ", "xX", "cC", "fF", "jJ", "kK", "pP", ",<", ".>", "/?",
            " "
        ],
    },
    QGMLWY: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "qQ", "gG", "mM", "lL", "wW", "yY", "fF", "uU", "bB", ";:", "[{", "]}", "\\|",
            "dD", "sS", "tT", "nN", "rR", "iI", "aA", "eE", "oO", "hH", "'\"",
            "\\|", "zZ", "xX", "cC", "vV", "jJ", "kK", "pP", ",<", ".>", "/?",
            " "
        ],
    },
    qwpr: {
        keymapShowTopRow: false,
        keys: [
            "`~","1!","2@","3#","4$","5%","6^","7&","8*","9(","0)","-_","=+",
            "qQ","wW","pP","rR","fF","yY","uU","kK","lL",";:","[{","]}","\\|",
            "aA","sS","dD","tT","gG","hH","nN","iI","oO","eE","'\"",
            "\\|","zZ","xX","cC","vV","bB","jJ","mM",",<",".>","/?",
            " "
        ],   
    },
    prog_dvorak: {
        keymapShowTopRow: true,
        keys: [
            "$~", "&%", "[7", "{5", "}3", "(1", "=9", "*0", ")2", "+4", "]6", "!8", "#`",
            ";:", ",<", ".>", "pP", "yY", "fF", "gG", "cC", "rR", "lL", "/?", "@^", "\\|",
            "aA", "oO", "eE", "uU", "iI", "dD", "hH", "tT", "nN", "sS", "-_",
            "\\|", "'\"", "qQ", "jJ", "kK", "xX", "bB", "mM", "wW", "vV", "zZ",
            " "
        ],
    },
    dvorak_L: {
        keymapShowTopRow: true,
        keys: [
            "`~", "[{", "]}", "/?", "pP", "fF", "mM", "lL", "jJ", "4$", "3#", "2@", "1!",
            ";:", "qQ", "bB", "yY", "uU", "rR", "sS", "oO", ".>", "6^", "5%", "=+", "\\|",
            "-_", "kK", "cC", "dD", "tT", "hH", "eE", "aA", "zZ", "8*", "7&",
            "\\|", "'\"", "xX", "gG", "vV", "wW", "nN", "iI", ",<", "0)", "9(",
            " "
        ],
    },
    dvorak_R: {
        keymapShowTopRow: true,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "jJ", "lL", "mM", "fF", "pP", "/?", "[{", "]}",
            "5%", "6^", "qQ", ".>", "oO", "rR", "sS", "uU", "yY", "bB", ";:", "=+", "\\|",
            "7&", "8*", "zZ", "aA", "eE", "hH", "tT", "dD", "cC", "kK", "-_",
            "\\|", "9(", "0)", "xX", ",<", "iI", "nN", "wW", "vV", "gG", "'\"",
            " "
        ],
    },
    azerty: {
        keymapShowTopRow: false,
        iso: true,
        keys: [
            "`~", "&1", "é2", "\"3", "'4", "(5", "-6", "è7", "_8", "ç9", "à0", ")°", "=+",
            "aA", "zZ", "eE", "rR", "tT", "yY", "uU", "iI", "oO", "pP", "^¨", "$£", "*µ",
            "qQ", "sS", "dD", "fF", "gG", "hH", "jJ", "kK", "lL", "mM", "ù%",
            "<>", "wW", "xX", "cC", "vV", "bB", "nN", ",?", ";.", ":/", "!§",
            " "
        ]
    },
    bepo: {
        keymapShowTopRow: false,
        iso: true,
        keys: [
            "$#", "\"1", "«2", "»3", "(4", ")5", "@6", "+7", "-8", "/9", "*0", "=°", "%`",
            "bB", "éÉ", "pP", "oO", "èÈ", "^!", "vV", "dD", "lL", "jJ", "zZ", "wW", "mM",
            "aA", "uU", "iI", "eE", ",;", "cC", "tT", "sS", "rR", "nN", "mM",
            "êÊ", "àÀ", "yY", "xX", ".:", "kK", "’?", "qQ", "gG", "hH", "fF",
            "  "
        ]
    },
    alpha: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "aA", "bB", "cC", "dD", "eE", "fF", "gG", "hH", "iI", "jJ", "[{", "]}", "\\|",
            "kK", "lL", "mM", "nN", "oO", "pP", "qQ", "rR", "sS", ";:", "'\"",
            "\\|", "tT", "uU", "vV", "wW", "xX", "yY", "zZ", ",<", ".>", "/?",
            " "
        ]
    },
    handsdown_alt: {
        keymapShowTopRow: false,
        keys: [
            "`~", "1!", "2@", "3#", "4$", "5%", "6^", "7&", "8*", "9(", "0)", "-_", "=+",
            "'\"", "gG", "hH", "mM", "zZ", "vV", "cC", "oO", "xX", "/?", "[{", "]}", "\\|",
            "rR", "sS", "nN", "tT", "fF", "yY", "uU", "eE", "aA", "iI", ";:", 
            "\\|", "jJ", "bB", "lL", "dD", "kK", "wW", "pP", "qQ", ",<", ".>",
            " "
        ]
    },
    typehack: {
        keymapShowTopRow: false,
        keys: [
            "^~", "1!", "2@", "3#", "4$", "5%", "6&", "7`", "8(", "9)", "0=", "*+", "\\|",
            "jJ", "gG", "hH", "pP", "fF", "qQ", "vV", "oO", "uU", ";:", "/?", "[{", "]}",
            "rR", "sS", "nN", "tT", "kK", "yY", "iI", "aA", "eE", "lL", "-_",
            "\\|","zZ", "wW", "mM", "dD", "bB", "cC", ",<", "'\"", ".>", "xX",
            " "
        ],
    },
}
export default layouts;
