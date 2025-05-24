# MonkeyType Gruvbox Dark Extracted Styles

This directory contains CSS files with the styles for the Gruvbox Dark theme, extracted from the MonkeyType application. These files can be used as a base for theming other applications or for understanding how the Gruvbox Dark theme is implemented in MonkeyType.

## Included Files

All style files are located within the `gruvbox_dark_styles` subdirectory:

- **`gruvbox_dark_colors.css`**: Defines the core color palette for the Gruvbox Dark theme using CSS custom properties (variables).
- **`fonts.css`**: Contains `@font-face` definitions for various fonts used in MonkeyType. It expects the actual font files (e.g., `.woff2`) to be located in a `/webfonts/` directory at the root of your website.
- **`animations.css`**: Includes various CSS keyframe animations used for loaders, caret blinking, and other visual effects.
- **`general_ui.css`**: Provides styling for common HTML elements such as the body, links, buttons, and form inputs, adapted for the Gruvbox Dark theme. It relies on the color variables in `gruvbox_dark_colors.css`.
- **`typing_test_ui.css`**: Contains specific styles for the MonkeyType typing test interface, including the appearance of words, letters, the caret, highlights, and the results display. It also relies on the color variables in `gruvbox_dark_colors.css`.

## How to Use

1.  Download or copy the `gruvbox_dark_styles` directory into your project.
2.  Link the CSS files in the `<head>` of your HTML document. The recommended order is:

    ```html
    <head>
      <!-- Other head elements -->
      <link rel="stylesheet" href="path/to/your/gruvbox_dark_styles/gruvbox_dark_colors.css">
      <link rel="stylesheet" href="path/to/your/gruvbox_dark_styles/fonts.css">
      <link rel="stylesheet" href="path/to/your/gruvbox_dark_styles/animations.css">
      <link rel="stylesheet" href="path/to/your/gruvbox_dark_styles/general_ui.css">
      <link rel="stylesheet" href="path/to/your/gruvbox_dark_styles/typing_test_ui.css">
      <!-- Other stylesheets -->
    </head>
    ```
    Replace `path/to/your/` with the actual path to where you've placed the `gruvbox_dark_styles` directory.

3.  Ensure that the font files referenced in `fonts.css` are available in a `/webfonts/` directory at the root of your site.
4.  The `general_ui.css` and `typing_test_ui.css` files are designed to work with the color variables defined in `gruvbox_dark_colors.css`.

## Notes

- These styles were extracted directly from the MonkeyType application. While they provide a comprehensive look at the Gruvbox Dark theme implementation, some styles might be closely tied to MonkeyType's specific HTML structure. You may need to adapt them for use in other applications.
- The primary purpose is to provide a well-commented base of all interface elements for the Gruvbox Dark theme, which you can then use and modify.
