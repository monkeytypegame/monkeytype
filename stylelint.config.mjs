/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard-scss"],
  rules: {
    "no-invalid-position-at-import-rule": null, // consider adding // default: [true, {ignoreAtRules: ['use', 'forward'],},]

    "font-family-no-missing-generic-family-keyword": null, // add

    "selector-type-no-unknown": null, // add // default: [true, {ignore: ['custom-elements'],},]

    "length-zero-no-unit": null, // default: [true, {ignore: ['custom-properties'], ignorePreludeOfAtRules: ['function', 'mixin'],},]

    "property-no-vendor-prefix": null, // add
    "value-no-vendor-prefix": null, // add // default: [true, {ignoreValues: ['box', 'inline-box'],},] // `-webkit-box` is allowed as standard. See https://www.w3.org/TR/css-overflow-3/#webkit-line-clamp

    "at-rule-empty-line-before": null, // default: ['always', {except: ['blockless-after-same-name-blockless', 'first-nested'], ignore: ['after-comment'],},]
    "comment-empty-line-before": null, // default: ['always', {except: ['first-nested'], ignore: ['stylelint-commands'],},]
    "custom-property-empty-line-before": null, // default: 'custom-property-empty-line-before': ['always',{except: ['after-custom-property', 'first-nested'],ignore: ['after-comment', 'inside-single-line-block'],},]
    "declaration-empty-line-before": null, // default: ['always', {except: ['after-declaration', 'first-nested'], ignore: ['after-comment', 'inside-single-line-block'],},]
    "rule-empty-line-before": null, // default: ['always-multi-line', {except: ['first-nested'], ignore: ['after-comment'],},]

    "alpha-value-notation": null, // default: ['percentage',{exceptProperties: ['opacity','fill-opacity','flood-opacity','stop-opacity','stroke-opacity',],},]
    "color-function-alias-notation": null, // default: without-alpha
    "color-function-notation": null, // default: modern
    "hue-degree-notation": null, // default: angle
    "media-feature-range-notation": null, // default: context
    "selector-not-notation": null, // default: complex
    "selector-pseudo-element-colon-notation": null, // add // default: double

    // default pattern for these rules is a kebab case pattern
    "custom-property-pattern": null,
    "keyframes-name-pattern": null,
    "selector-class-pattern": null,
    "selector-id-pattern": null,

    "font-family-name-quotes": null, // add // default: always-where-recommended
    "function-url-quotes": null, // add // default: always

    "declaration-block-no-redundant-longhand-properties": null,
    "shorthand-property-no-redundant-values": null,

    "comment-whitespace-inside": null, // default: always

    "scss/at-extend-no-missing-placeholder": null,
    "scss/load-no-partial-leading-underscore": null,
    "scss/load-partial-extension": null, // default: never,
    "scss/no-global-function-names": null,

    "scss/dollar-variable-pattern": null, // default pattern is a kebab case pattern
    "scss/double-slash-comment-empty-line-before": null, // default: ['always', {except: ['first-nested'], ignore: ['between-comments', 'stylelint-commands'],},]
    "scss/double-slash-comment-whitespace-inside": null, // default: always
  },
};
